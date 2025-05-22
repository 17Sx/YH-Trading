import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getCachedResponse(request: NextRequest) {
  const cacheKey = request.nextUrl.pathname + request.nextUrl.search;
  const cachedResponse = apiCache.get(cacheKey);

  if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_DURATION) {
    return NextResponse.json(cachedResponse.data);
  }

  return null;
}

export function setCachedResponse(request: NextRequest, data: any) {
  const cacheKey = request.nextUrl.pathname + request.nextUrl.search;
  apiCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

export function clearCache(pathname: string) {
  for (const key of apiCache.keys()) {
    if (key.startsWith(pathname)) {
      apiCache.delete(key);
    }
  }
}

export function clearAllCache() {
  apiCache.clear();
} 