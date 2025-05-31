import { NextResponse } from 'next/server';
import { getSetups } from '@/lib/actions/journal.actions';
import { getCachedResponse, setCachedResponse, CACHE_CONFIGS } from '@/lib/utils/enhanced-api-cache';

export async function GET(
  request: Request,
  { params }: { params: { journalId: string } }
) {
  console.log(`[DEBUG] Setups API called for journal ${params.journalId}`);
  
  try {
    const req = request as any;
    
    const cachedResponse = getCachedResponse(req, CACHE_CONFIGS.REFERENCE_DATA);
    if (cachedResponse) {
      console.log(`[DEBUG] Setups API - returning cached response`);
      return cachedResponse;
    }

    console.log(`[DEBUG] Setups API - fetching fresh data`);
    const result = await getSetups();
    console.log(`[DEBUG] Setups API - got result:`, result);
    
    return setCachedResponse(req, result, CACHE_CONFIGS.REFERENCE_DATA);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des setups:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des setups' },
      { status: 500 }
    );
  }
} 