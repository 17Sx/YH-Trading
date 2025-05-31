"use server";

import { z } from "zod";
import { createSupabaseActionClient } from "@/lib/supabase/actions";
import { AddTradeSchema, type AddTradeInput } from "@/schemas/journal.schema";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { invalidateCache } from "@/lib/utils/enhanced-api-cache";

export interface Asset {
  id: string;
  name: string;
}

export interface Session {
  id: string;
  name: string;
}

export interface Setup {
  id: string;
  name: string;
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

export interface Journal {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  user_id: string;
}

export async function getAssets(journalId?: string): Promise<{ assets: Asset[]; error?: string }> {
  const supabase = createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { assets: [], error: "Utilisateur non authentifié." };

  const { data, error } = await supabase
    .from("assets")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name");

  if (error) return { assets: [], error: error.message };
  return { assets: data || [] };
}

export async function getSessions(journalId?: string): Promise<{ sessions: Session[]; error?: string }> {
  const supabase = createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { sessions: [], error: "Utilisateur non authentifié." };

  const { data, error } = await supabase
    .from("sessions")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name");

  if (error) return { sessions: [], error: error.message };
  return { sessions: data || [] };
}

export async function getSetups(journalId?: string): Promise<{ setups: Setup[]; error?: string }> {
  const supabase = createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { setups: [], error: "Utilisateur non authentifié." };

  const { data, error } = await supabase
    .from("setups")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name");

  if (error) return { setups: [], error: error.message };
  return { setups: data || [] };
}

export async function addTrade(
  values: AddTradeInput,
  journalId: string
): Promise<{ success?: boolean; error?: string; issues?: z.ZodIssue[] }> {
  const supabase = createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Utilisateur non authentifié." };
  }

  const result = AddTradeSchema.safeParse(values);
  if (!result.success) {
    return { error: "Données du formulaire invalides.", issues: result.error.issues };
  }

  const { 
    trade_date, 
    asset_id, 
    session_id, 
    setup_id, 
    risk_input, 
    profit_loss_amount, 
    tradingview_link, 
    notes
  } = result.data;

  const { error: insertError } = await supabase.from("trades").insert({
    user_id: user.id,
    journal_id: journalId,
    trade_date, 
    asset_id,
    session_id,
    setup_id,
    risk_input,
    profit_loss_amount,
    tradingview_link: tradingview_link || null, 
    notes: notes || null
  });

  if (insertError) {
    console.error("Erreur d'insertion Supabase (addTrade):", insertError);
    return { error: `Erreur Supabase: ${insertError.message}` };
  }

  invalidateCache('trades');
  invalidateCache('stats');
  invalidateCache('journals');

  revalidatePath("/journal");
  return { success: true };
}

export async function getTrades(journalId: string): Promise<{ trades: Trade[]; error?: string }> {
  const supabase = createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { trades: [], error: "Utilisateur non authentifié." };

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
      created_at,
      asset:assets(name),
      session:sessions(name),
      setup:setups(name)
    `)
    .eq("user_id", user.id)
    .eq("journal_id", journalId)
    .order("trade_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Erreur de récupération des trades:", error);
    return { trades: [], error: error.message };
  }
  

  const tradesData = data?.map(t => {    
    const assetData = Array.isArray(t.asset) ? t.asset[0] : t.asset;
    const sessionData = Array.isArray(t.session) ? t.session[0] : t.session;
    const setupData = Array.isArray(t.setup) ? t.setup[0] : t.setup;

    return {
      ...t,
      asset_name: assetData?.name || null, 
      session_name: sessionData?.name || null,
      setup_name: setupData?.name || null,
      asset: undefined,
      session: undefined,
      setup: undefined,
    };
  }) || [];


  return { trades: tradesData };
}

export async function getTradesForStats(journalId: string): Promise<{ trades: Trade[]; error?: string }> {
  const supabase = createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { trades: [], error: "Utilisateur non authentifié." };

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
      created_at,
      asset:assets(name),
      session:sessions(name),
      setup:setups(name)
    `)
    .eq("user_id", user.id)
    .eq("journal_id", journalId)
    .order("trade_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur de récupération des trades:", error);
    return { trades: [], error: error.message };
  }
  
  const tradesData = data?.map(t => {    
    const assetData = Array.isArray(t.asset) ? t.asset[0] : t.asset;
    const sessionData = Array.isArray(t.session) ? t.session[0] : t.session;
    const setupData = Array.isArray(t.setup) ? t.setup[0] : t.setup;

    return {
      ...t,
      asset_name: assetData?.name || null, 
      session_name: sessionData?.name || null,
      setup_name: setupData?.name || null,
      asset: undefined,
      session: undefined,
      setup: undefined,
    };
  }) || [];

  return { trades: tradesData };
}

async function addItem(
  itemName: string,
  tableName: "assets" | "sessions" | "setups"
): Promise<{ data?: { id: string; name: string }; error?: string; issues?: z.ZodIssue[] }> {
  const supabase = createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Utilisateur non authentifié." };

  if (!itemName || itemName.trim().length === 0) {
    return { error: "Le nom ne peut pas être vide." };
  }
  if (itemName.length > 100) {
    return { error: "Le nom ne peut pas dépasser 100 caractères." };
  }

  const { data: existingItem, error: existingError } = await supabase
    .from(tableName)
    .select("id")
    .eq("user_id", user.id)
    .ilike("name", itemName)
    .single();

  if (existingError && existingError.code !== "PGRST116") { 
    console.error(`Erreur lors de la vérification de l'existence de l'item (${tableName}):`, existingError);
    return { error: existingError.message };
  }
  if (existingItem) {
    return { error: `L'élément \"${itemName}\" existe déjà.` };
  }

  const { data: newItem, error: insertError } = await supabase
    .from(tableName)
    .insert({ 
      user_id: user.id, 
      name: itemName.trim()
    })
    .select("id, name")
    .single();

  if (insertError) {
    console.error(`Erreur d'insertion Supabase (${tableName}):`, insertError);
    return { error: insertError.message };
  }

  
  invalidateCache('reference-data');

  revalidatePath("/journal"); 
  return { data: newItem };
}

export async function addAsset(name: string): Promise<{ data?: Asset; error?: string; issues?: z.ZodIssue[] }> {
  return addItem(name, "assets");
}

export async function addSession(name: string): Promise<{ data?: Session; error?: string; issues?: z.ZodIssue[] }> {
  return addItem(name, "sessions");
}

export async function addSetup(name: string): Promise<{ data?: Setup; error?: string; issues?: z.ZodIssue[] }> {
  return addItem(name, "setups");
}

async function addItemWithJournal(
  itemName: string,
  tableName: "assets" | "sessions" | "setups",
  journalId: string
): Promise<{ data?: { id: string; name: string }; error?: string; issues?: z.ZodIssue[] }> {
  const supabase = createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Utilisateur non authentifié." };

  if (!itemName || itemName.trim().length === 0) {
    return { error: "Le nom ne peut pas être vide." };
  }
  if (itemName.length > 100) {
    return { error: "Le nom ne peut pas dépasser 100 caractères." };
  }

  const { data: existingItem, error: existingError } = await supabase
    .from(tableName)
    .select("id")
    .eq("user_id", user.id)
    .ilike("name", itemName)
    .single();

  if (existingError && existingError.code !== "PGRST116") { 
    console.error(`Erreur lors de la vérification de l'existence de l'item (${tableName}):`, existingError);
    return { error: existingError.message };
  }
  if (existingItem) {
    return { error: `L'élément \"${itemName}\" existe déjà.` };
  }

  const { data: newItem, error: insertError } = await supabase
    .from(tableName)
    .insert({ 
      user_id: user.id, 
      journal_id: journalId,
      name: itemName.trim()
    })
    .select("id, name")
    .single();

  if (insertError) {
    console.error(`Erreur d'insertion Supabase (${tableName}):`, insertError);
    return { error: insertError.message };
  }

  invalidateCache('reference-data');
  revalidatePath("/journal"); 
  return { data: newItem };
}

export async function addAssetWithJournal(name: string, journalId: string): Promise<{ data?: Asset; error?: string; issues?: z.ZodIssue[] }> {
  return addItemWithJournal(name, "assets", journalId);
}

export async function addSessionWithJournal(name: string, journalId: string): Promise<{ data?: Session; error?: string; issues?: z.ZodIssue[] }> {
  return addItemWithJournal(name, "sessions", journalId);
}

export async function addSetupWithJournal(name: string, journalId: string): Promise<{ data?: Setup; error?: string; issues?: z.ZodIssue[] }> {
  return addItemWithJournal(name, "setups", journalId);
}

async function deleteItem(
  itemId: string,
  tableName: "assets" | "sessions" | "setups"
): Promise<{ success?: boolean; error?: string }> {
  console.log(`[DEBUG] Attempting to delete ${tableName} with ID: ${itemId}`);
  
  const supabase = createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log('[DEBUG] User not authenticated');
    return { error: "Utilisateur non authentifié." };
  }

  if (!itemId) {
    console.log('[DEBUG] Item ID is missing');
    return { error: "L'ID de l'élément est requis." };
  }

  console.log(`[DEBUG] Checking if ${tableName} with ID ${itemId} exists for user ${user.id}`);
  const { data: existingItem, error: checkError } = await supabase
    .from(tableName)
    .select("id, name, user_id")
    .eq("id", itemId)
    .single();

  if (checkError) {
    console.log(`[DEBUG] Error checking item existence:`, checkError);
    if (checkError.code === 'PGRST116') {
      console.log(`[DEBUG] Item ${itemId} does not exist in ${tableName}`);
      return { error: "Élément introuvable dans la base de données." };
    }
    return { error: `Erreur lors de la vérification: ${checkError.message}` };
  }

  console.log(`[DEBUG] Found item:`, existingItem);

  if (existingItem.user_id !== user.id) {
    console.log(`[DEBUG] Item belongs to user ${existingItem.user_id}, but current user is ${user.id}`);
    return { error: "Vous n'êtes pas autorisé à supprimer cet élément." };
  }

  const columnName = tableName === "assets" ? "asset_id" : 
                    tableName === "sessions" ? "session_id" : "setup_id";
  
  console.log(`[DEBUG] Checking if ${tableName} is used in ANY trades for user ${user.id}`);
  const { data: usedInTrades, error: tradeCheckError } = await supabase
    .from("trades")
    .select("id, journal_id")
    .eq(columnName, itemId)
    .eq("user_id", user.id)
    .limit(5); 

  if (tradeCheckError) {
    console.error(`[DEBUG] Error checking trade usage:`, tradeCheckError);
  } else if (usedInTrades && usedInTrades.length > 0) {
    console.log(`[DEBUG] Item is used in ${usedInTrades.length} trade(s) across journals:`, usedInTrades.map(t => t.journal_id));
    return { error: `Impossible de supprimer: cet élément est utilisé dans ${usedInTrades.length} trade(s). Supprimez d'abord tous les trades qui l'utilisent dans tous vos journaux.` };
  }

  console.log(`[DEBUG] Deleting from ${tableName} where id=${itemId} AND user_id=${user.id}`);

  const { error: deleteError, count } = await supabase
    .from(tableName)
    .delete({ count: 'exact' })
    .match({ id: itemId, user_id: user.id });
    
  console.log(`[DEBUG] Delete operation result:`, { 
    error: deleteError, 
    affectedRows: count,
    tableName,
    itemId 
  });
    
  if (deleteError) {
    console.error(`Erreur de suppression Supabase (${tableName}, ID: ${itemId}):`, deleteError);
    return { error: `Erreur Supabase: ${deleteError.message}` };
  }

  if (count === 0) {
    console.log(`[DEBUG] No rows were deleted - this should not happen after existence check`);
    return { error: "Erreur inattendue: la suppression a échoué." };
  }

  console.log(`[DEBUG] Successfully deleted ${count} row(s) from ${tableName}`);
  
  invalidateCache('reference-data');
  console.log('[DEBUG] Cache invalidated');

  revalidatePath("/journal");
  console.log('[DEBUG] Path revalidated');
  
  return { success: true };
}

export async function deleteAsset(id: string): Promise<{ success?: boolean; error?: string }> {
  return deleteItem(id, "assets");
}

export async function deleteSession(id: string): Promise<{ success?: boolean; error?: string }> {
  return deleteItem(id, "sessions");
}

export async function deleteSetup(id: string): Promise<{ success?: boolean; error?: string }> {
  return deleteItem(id, "setups");
}

export async function deleteTrade(id: string, journalId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Utilisateur non authentifié." };
  }

  if (!id) {
    return { error: "L'ID du trade est requis." };
  }

  const { error } = await supabase
    .from("trades")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("journal_id", journalId);

  if (error) {
    return { error: error.message };
  }

  invalidateCache('trades');
  invalidateCache('stats');
  invalidateCache('journals');

  revalidatePath("/journal");
  return { success: true };
}

export async function updateTrade(
  tradeId: string,
  values: Partial<AddTradeInput>,
  journalId: string
): Promise<{ success?: boolean; error?: string; issues?: z.ZodIssue[] }> {
  const supabase = createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Utilisateur non authentifié." };
  }

  const result = AddTradeSchema.partial().safeParse(values);
  if (!result.success) {
    return { error: "Données du formulaire invalides.", issues: result.error.issues };
  }

  const updateData: { [key: string]: any } = {};
  for (const key in result.data) {
    if (result.data.hasOwnProperty(key)) {
      const value = (result.data as any)[key];
      if (value !== undefined) { 
        if (key === "asset_id" || key === "session_id" || key === "setup_id") {
          updateData[key] = value === "" ? null : value;
        } else {
          updateData[key] = value;
        }
      }
    }
  }
  
  if (updateData.profit_loss_amount !== undefined && typeof updateData.profit_loss_amount === 'string') {
    updateData.profit_loss_amount = parseFloat(updateData.profit_loss_amount);
    if (isNaN(updateData.profit_loss_amount)) {
      delete updateData.profit_loss_amount; 
    }
  }

  if (Object.keys(updateData).length === 0) {
    return { error: "Aucune donnée à mettre à jour." };
  }

  const { error: updateError } = await supabase
    .from("trades")
    .update(updateData)
    .eq("id", tradeId)
    .eq("user_id", user.id)
    .eq("journal_id", journalId);

  if (updateError) {
    console.error("Erreur de mise à jour Supabase (updateTrade):", updateError);
    return { error: `Erreur Supabase: ${updateError.message}` };
  }

  invalidateCache('trades');
  invalidateCache('stats');
  invalidateCache('journals');

  revalidatePath("/journal");
  return { success: true };
}

export async function createJournal(data: { name: string; description?: string }) {
  const supabase = createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const { data: journal, error } = await supabase
    .from('journals')
    .insert({
      name: data.name,
      description: data.description,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return journal;
}

export async function getJournals(): Promise<{ journals: (Journal & {
  trades_count: number;
  win_rate: number;
  performance: number;
  last_trade_date: Date;
})[]; error?: string }> {
  try {
    const supabase = createSupabaseActionClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { journals: [], error: "Non authentifié" };
    }

    const { data, error } = await supabase
      .from('journals')
      .select(`
        *,
        trades:trades(count),
        trades_stats:trades(profit_loss_amount, trade_date)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des journaux:', error);
      return { journals: [], error: error.message };
    }

    const journalsWithStats = (data || []).map((journal: any) => {
      const trades = journal.trades_stats || [];
      const totalTrades = journal.trades?.[0]?.count || 0;
      
      const winningTrades = trades.filter((t: any) => t.profit_loss_amount > 0);
      const losingTrades = trades.filter((t: any) => t.profit_loss_amount < 0);
      const winRate = (winningTrades.length + losingTrades.length) > 0 
        ? Math.round((winningTrades.length / (winningTrades.length + losingTrades.length)) * 100) 
        : 0;
      
      const performance = trades.reduce((sum: number, t: any) => sum + t.profit_loss_amount, 0);
      const lastTradeDate = trades.length > 0 
        ? new Date(Math.max(...trades.map((t: any) => new Date(t.trade_date).getTime())))
        : new Date(journal.created_at);

      return {
        ...journal,
        trades_count: totalTrades,
        win_rate: winRate,
        performance,
        last_trade_date: lastTradeDate,
        trades: undefined,
        trades_stats: undefined,
      };
    });

    return { journals: journalsWithStats };
  } catch (error) {
    console.error('Exception lors de la récupération des journaux:', error);
    return { journals: [], error: error instanceof Error ? error.message : 'Erreur inconnue' };
  }
}

export async function getJournalById(id: string) {
  const supabase = createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const { data: journal, error } = await supabase
    .from('journals')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return journal;
}

export async function updateJournal(id: string, data: { name?: string; description?: string }) {
  const supabase = createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const { data: journal, error } = await supabase
    .from('journals')
    .update(data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return journal;
}

export async function deleteJournal(id: string) {
  const supabase = createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const { error } = await supabase
    .from('journals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
  return true;
}
