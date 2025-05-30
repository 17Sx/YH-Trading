import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface CacheEntry {
  data: any;
  timestamp: number;
  etag: string;
  lastModified: string;
  userId?: string;
}

interface CacheConfig {
  duration: number;
  staleWhileRevalidate?: number;
  tags?: string[];
  private?: boolean;
}

class LRUCache<T> {
  private capacity: number;
  private cache: Map<string, T>;

  constructor(capacity: number = 1000) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: string): T | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

class EnhancedApiCache {
  private cache: LRUCache<CacheEntry>;
  private tags: Map<string, Set<string>>;

  constructor() {
    this.cache = new LRUCache<CacheEntry>(2000);
    this.tags = new Map();
  }

  private generateEtag(data: any): string {
    return `"${Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 16)}"`;
  }

  private isExpired(entry: CacheEntry, maxAge: number): boolean {
    return Date.now() - entry.timestamp > maxAge;
  }

  private isStale(entry: CacheEntry, staleTime: number): boolean {
    return Date.now() - entry.timestamp > staleTime;
  }

  private addTags(cacheKey: string, tags: string[]): void {
    tags.forEach(tag => {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag)!.add(cacheKey);
    });
  }

  private removeTags(cacheKey: string): void {
    this.tags.forEach((keys, tag) => {
      if (keys.has(cacheKey)) {
        keys.delete(cacheKey);
        if (keys.size === 0) {
          this.tags.delete(tag);
        }
      }
    });
  }

  get(request: NextRequest, config: CacheConfig): NextResponse | null {
    const cacheKey = this.getCacheKey(request);
    const entry = this.cache.get(cacheKey);

    if (!entry) return null;

    const isExpired = this.isExpired(entry, config.duration);
    const isStale = config.staleWhileRevalidate 
      ? this.isStale(entry, config.staleWhileRevalidate)
      : isExpired;

    const ifNoneMatch = request.headers.get('if-none-match');
    const ifModifiedSince = request.headers.get('if-modified-since');

    if (ifNoneMatch === entry.etag || 
        (ifModifiedSince && new Date(ifModifiedSince) >= new Date(entry.lastModified))) {
      return new NextResponse(null, { status: 304 });
    }

    if (isExpired) {
      this.cache.delete(cacheKey);
      this.removeTags(cacheKey);
      return null;
    }

    const response = NextResponse.json(entry.data);
    this.setCacheHeaders(response, entry, config, isStale);
    
    return response;
  }

  set(request: NextRequest, data: any, config: CacheConfig): NextResponse {
    const cacheKey = this.getCacheKey(request);
    const now = new Date().toISOString();
    const etag = this.generateEtag(data);

    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      etag,
      lastModified: now,
      userId: this.extractUserId(request) || undefined
    };

    if (this.cache.get(cacheKey)) {
      this.removeTags(cacheKey);
    }

    this.cache.set(cacheKey, entry);

    if (config.tags) {
      this.addTags(cacheKey, config.tags);
    }

    const response = NextResponse.json(data);
    this.setCacheHeaders(response, entry, config, false);
    
    return response;
  }

  invalidateByTag(tag: string): number {
    const keys = this.tags.get(tag);
    if (!keys) return 0;

    let invalidatedCount = 0;
    keys.forEach(key => {
      if (this.cache.delete(key)) {
        invalidatedCount++;
      }
    });

    this.tags.delete(tag);
    return invalidatedCount;
  }

  invalidateByPattern(pattern: string): number {
    let invalidatedCount = 0;
    const regex = new RegExp(pattern);

    this.cache.keys().forEach(key => {
      if (regex.test(key)) {
        this.cache.delete(key);
        this.removeTags(key);
        invalidatedCount++;
      }
    });

    return invalidatedCount;
  }

  private getCacheKey(request: NextRequest): string {
    const url = request.nextUrl;
    const userId = this.extractUserId(request);
    return `${url.pathname}${url.search}${userId ? `_user_${userId}` : ''}`;
  }

  private extractUserId(request: NextRequest): string | null {
    const authCookie = request.cookies.get('auth-token');
    if (authCookie) {
      try {
        return 'user_id_placeholder';
      } catch {
        return null;
      }
    }
    return null;
  }

  private setCacheHeaders(
    response: NextResponse, 
    entry: CacheEntry, 
    config: CacheConfig,
    isStale: boolean
  ): void {
    const maxAge = Math.floor(config.duration / 1000);
    const staleWhileRevalidate = config.staleWhileRevalidate 
      ? Math.floor(config.staleWhileRevalidate / 1000)
      : 0;

    response.headers.set('etag', entry.etag);
    response.headers.set('last-modified', entry.lastModified);
    
    if (config.private) {
      response.headers.set('cache-control', 
        `private, max-age=${maxAge}${staleWhileRevalidate > 0 ? `, stale-while-revalidate=${staleWhileRevalidate}` : ''}`
      );
    } else {
      response.headers.set('cache-control', 
        `public, max-age=${maxAge}${staleWhileRevalidate > 0 ? `, stale-while-revalidate=${staleWhileRevalidate}` : ''}`
      );
    }

    if (isStale) {
      response.headers.set('x-cache-status', 'STALE');
    } else {
      response.headers.set('x-cache-status', 'HIT');
    }
  }

  getStats(): { size: number; tags: number; hitRate?: number } {
    return {
      size: this.cache.keys().length,
      tags: this.tags.size
    };
  }

  clear(): void {
    this.cache.clear();
    this.tags.clear();
  }
}

const enhancedCache = new EnhancedApiCache();

export const CACHE_CONFIGS = {
  REFERENCE_DATA: {
    duration: 10 * 60 * 1000, // 10 minutes
    staleWhileRevalidate: 30 * 60 * 1000, // 30 minutes
    private: true,
    tags: ['reference-data']
  } as CacheConfig,

  TRADES: {
    duration: 2 * 60 * 1000, // 2 minutes
    staleWhileRevalidate: 10 * 60 * 1000, // 10 minutes
    private: true,
    tags: ['trades']
  } as CacheConfig,

  STATS: {
    duration: 1 * 60 * 1000, // 1 minute
    staleWhileRevalidate: 5 * 60 * 1000, // 5 minutes
    private: true,
    tags: ['stats']
  } as CacheConfig,

  JOURNALS: {
    duration: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: 15 * 60 * 1000, // 15 minutes
    private: true,
    tags: ['journals']
  } as CacheConfig
};

export function getCachedResponse(request: NextRequest, config: CacheConfig): NextResponse | null {
  return enhancedCache.get(request, config);
}

export function setCachedResponse(request: NextRequest, data: any, config: CacheConfig): NextResponse {
  return enhancedCache.set(request, data, config);
}

export function invalidateCache(tag: string): number {
  return enhancedCache.invalidateByTag(tag);
}

export function invalidateCachePattern(pattern: string): number {
  return enhancedCache.invalidateByPattern(pattern);
}

export function getCacheStats() {
  return enhancedCache.getStats();
}

export function clearAllCache(): void {
  enhancedCache.clear();
}

export function createCacheInvalidationMiddleware(tags: string[]) {
  return function invalidateOnMutation() {
    tags.forEach(tag => invalidateCache(tag));
  };
}

export function withCacheInvalidation<T extends any[], R>(
  action: (...args: T) => Promise<R>,
  tags: string[]
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const result = await action(...args);
    
    tags.forEach(tag => invalidateCache(tag));
    
    return result;
  };
} 