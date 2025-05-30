import { NextResponse } from 'next/server';
import { getAssets } from '@/lib/actions/journal.actions';
import { getCachedResponse, setCachedResponse, CACHE_CONFIGS } from '@/lib/utils/enhanced-api-cache';

export async function GET(
  request: Request,
  { params }: { params: { journalId: string } }
) {
  try {
    const req = request as any;
    
    const cachedResponse = getCachedResponse(req, CACHE_CONFIGS.REFERENCE_DATA);
    if (cachedResponse) {
      return cachedResponse;
    }

    const assets = await getAssets();
    const response = { assets };

    return setCachedResponse(req, response, CACHE_CONFIGS.REFERENCE_DATA);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des assets:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des assets' },
      { status: 500 }
    );
  }
} 