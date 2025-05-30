"use server";

import { createSupabaseActionClient } from "@/lib/supabase/actions";

export interface Journal {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  user_id: string;
}

export interface Trade {
  id: string;
  trade_date: string; 
  asset_id?: string | null;
  asset_name?: string | null; 
  session_id?: string | null;
  session_name?: string | null;
  setup_id?: string | null;
  setup_name?: string | null;
  risk_input: string;
  profit_loss_amount: number;
  tradingview_link?: string | null;
  notes?: string | null;
  duration_minutes?: number | null;
  created_at: string;
}

export async function getJournalsOptimized(): Promise<{ journals: (Journal & {
  trades_count: number;
  win_rate: number;
  profit_loss: number;
  performance: number;
  last_trade_date: Date;
})[]; error?: string }> {
  try {
    const supabase = createSupabaseActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { journals: [], error: "Non authentifié" };
    }

    const { data: journals, error: journalsError } = await supabase
      .from('journals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (journalsError) {
      console.error('Erreur lors de la récupération des journaux:', journalsError);
      return { journals: [], error: journalsError.message };
    }

    const journalsWithStats = await Promise.all(
      (journals || []).map(async (journal: Journal) => {
        const { data: trades, error: tradesError } = await supabase
          .from('trades')
          .select('*')
          .eq('journal_id', journal.id);

        if (tradesError) {
          console.error('Erreur lors de la récupération des trades:', tradesError);
          return {
            ...journal,
            trades_count: 0,
            win_rate: 0,
            profit_loss: 0,
            performance: 0,
            last_trade_date: new Date(journal.created_at),
          };
        }

        const tradesList = (trades || []) as Trade[];
        const totalTrades = tradesList.length;
        const winningTrades = tradesList.filter((trade: Trade) => trade.profit_loss_amount > 0).length;
        const totalProfitLoss = tradesList.reduce((sum: number, trade: Trade) => sum + trade.profit_loss_amount, 0);
        const winRate = totalTrades > 0 ? Math.round((winningTrades / totalTrades) * 100) : 0;
        const lastTradeDate = tradesList.length > 0 
          ? new Date(tradesList.reduce((latest: Trade, trade: Trade) => 
              new Date(trade.trade_date) > new Date(latest.trade_date) ? trade : latest
            ).trade_date)
          : new Date(journal.created_at);

        return {
          ...journal,
          trades_count: totalTrades,
          win_rate: winRate,
          profit_loss: totalProfitLoss,
          performance: totalTrades > 0 ? Math.round((totalProfitLoss / totalTrades) * 100) : 0,
          last_trade_date: lastTradeDate,
        };
      })
    );

    return { journals: journalsWithStats };
  } catch (error) {
    console.error('Exception lors de la récupération des journaux:', error);
    return { journals: [], error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue' };
  }
} 