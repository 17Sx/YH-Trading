import { NextRequest, NextResponse } from 'next/server';
import { getAssets } from '@/lib/actions/journal.actions';
import { getCachedResponse, setCachedResponse, CACHE_CONFIGS } from '@/lib/utils/enhanced-api-cache';

export async function GET(
  request: NextRequest,
  { params }: { params: { journalId: string } }
) {
  console.log(`[DEBUG] Assets API called for journal ${params.journalId}`);
  
  try {
    const req = request as any;
    
    const cachedResponse = getCachedResponse(req, CACHE_CONFIGS.REFERENCE_DATA);
    if (cachedResponse) {
      console.log(`[DEBUG] Assets API - returning cached response`);
      return cachedResponse;
    }

    console.log(`[DEBUG] Assets API - fetching fresh data`);
    const result = await getAssets();
    console.log(`[DEBUG] Assets API - got result:`, result);
    
    return setCachedResponse(req, result, CACHE_CONFIGS.REFERENCE_DATA);
  } catch (error) {
    console.error('Error in assets API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
} 