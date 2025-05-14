"use server";

import { z } from "zod";
import { createSupabaseActionClient } from "@/lib/supabase/actions";
import { AddTradeSchema, type AddTradeInput } from "@/schemas/journal.schema";
import { revalidatePath } from "next/cache";


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
  created_at: string;
}

export async function getAssets(): Promise<{ assets: Asset[]; error?: string }> {
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

export async function getSessions(): Promise<{ sessions: Session[]; error?: string }> {
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

export async function getSetups(): Promise<{ setups: Setup[]; error?: string }> {
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
  values: AddTradeInput
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
    trade_date, 
    asset_id,
    session_id,
    setup_id,
    risk_input,
    profit_loss_amount,
    tradingview_link: tradingview_link || null, 
    notes: notes || null, 
  });

  if (insertError) {
    console.error("Erreur d'insertion Supabase (addTrade):", insertError);
    return { error: `Erreur Supabase: ${insertError.message}` };
  }

  revalidatePath("/journal");
  return { success: true };
}

export async function getTrades(): Promise<{ trades: Trade[]; error?: string }> {
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

  console.log("Données des trades transformées (getTrades):", JSON.stringify(tradesData, null, 2));

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
    .insert({ user_id: user.id, name: itemName.trim() })
    .select("id, name")
    .single();

  if (insertError) {
    console.error(`Erreur d'insertion Supabase (${tableName}):`, insertError);
    return { error: insertError.message };
  }

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


async function deleteItem(
  itemId: string,
  tableName: "assets" | "sessions" | "setups"
): Promise<{ success?: boolean; error?: string }> {
  const supabase = createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Utilisateur non authentifié." };
  }

  if (!itemId) {
    return { error: "L\'ID de l\'élément est requis." };
  }


  const { error: deleteError } = await supabase
    .from(tableName)
    .delete()
    .match({ id: itemId, user_id: user.id }); 
  if (deleteError) {
    console.error(`Erreur de suppression Supabase (${tableName}, ID: ${itemId}):`, deleteError);
    return { error: `Erreur Supabase: ${deleteError.message}` };
  }

  revalidatePath("/journal");
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

export async function deleteTrade(id: string): Promise<{ success?: boolean; error?: string }> {
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
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/journal");
  return { success: true };
}

export async function updateTrade(
  tradeId: string,
  values: Partial<AddTradeInput> 
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
    .eq("user_id", user.id); 

  if (updateError) {
    console.error("Erreur de mise à jour Supabase (updateTrade):", updateError);
    return { error: `Erreur Supabase: ${updateError.message}` };
  }

  revalidatePath("/journal");
  return { success: true };
}
