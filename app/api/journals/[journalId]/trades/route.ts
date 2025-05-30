import { NextResponse } from 'next/server';
import { getTrades } from '@/lib/actions/journal.actions';
import { getCachedResponse, setCachedResponse, CACHE_CONFIGS } from '@/lib/utils/enhanced-api-cache';

export async function GET(
  request: Request,
  { params }: { params: { journalId: string } }
) {
  try {
    const req = request as any;
    
    const cachedResponse = getCachedResponse(req, CACHE_CONFIGS.TRADES);
    if (cachedResponse) {
      return cachedResponse;
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const dateFrom = url.searchParams.get('dateFrom') || undefined;
    const dateTo = url.searchParams.get('dateTo') || undefined;

    if (page > 1 || limit < 100 || dateFrom || dateTo) {
      const trades = await getTrades(params.journalId);
      
      let filteredTrades = trades.trades || [];
      
      if (dateFrom) {
        filteredTrades = filteredTrades.filter(t => t.trade_date >= dateFrom);
      }
      if (dateTo) {
        filteredTrades = filteredTrades.filter(t => t.trade_date <= dateTo);
      }
      
      const start = (page - 1) * limit;
      const paginatedTrades = filteredTrades.slice(start, start + limit);
      
      const response = { 
        trades: { trades: paginatedTrades },
        total: filteredTrades.length,
        page,
        limit,
        hasMore: start + limit < filteredTrades.length
      };
      
      return setCachedResponse(req, response, CACHE_CONFIGS.TRADES);
    }

    const trades = await getTrades(params.journalId);
    const response = { trades };

    return setCachedResponse(req, response, CACHE_CONFIGS.TRADES);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des trades:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des trades' },
      { status: 500 }
    );
  }
} 