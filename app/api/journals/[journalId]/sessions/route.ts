import { NextResponse } from 'next/server';
import { getSessions } from '@/lib/actions/journal.actions';
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

    const sessions = await getSessions(params.journalId);
    const response = { sessions };


    setCachedResponse(request as any, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erreur lors de la récupération des sessions:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des sessions' },
      { status: 500 }
    );
  }
} 