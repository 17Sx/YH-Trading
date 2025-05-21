import { NextResponse } from 'next/server';
import { getTrades } from '@/lib/actions/journal.actions';
import { getCachedResponse, setCachedResponse } from '@/lib/utils/api-cache';

export async function GET(
  request: Request,
  { params }: { params: { journalId: string } }
) {
  try {

    const cachedResponse = getCachedResponse(request as any);
    if (cachedResponse) {
      return cachedResponse;
    }

    const trades = await getTrades(params.journalId);
    const response = { trades };


    setCachedResponse(request as any, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur lors de la récupération des trades:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des trades' },
      { status: 500 }
    );
  }
} 