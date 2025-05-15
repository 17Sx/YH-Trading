import { createSupabaseActionClient } from "@/lib/supabase/actions";
import type { Trade } from "@/lib/actions/journal.actions";

interface GetTradesByMonthParams {
  year: number;
  month: number; 
}

export async function getTradesByMonth({ year, month }: GetTradesByMonthParams): Promise<Trade[]> {
  const supabase = createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0); 
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("trades")
    .select(`
      id,
      trade_date,
      asset_id,
      session_id,
      setup_id,
      risk_input,
      profit_loss_amount,
      tradingview_link,
      notes,
      created_at
    `)
    .eq("user_id", user.id)
    .gte("trade_date", startStr)
    .lte("trade_date", endStr)
    .order("trade_date", { ascending: true });

  if (error) {
    console.error("Erreur récupération trades par mois:", error);
    return [];
  }
  return data as Trade[];
} 

//test