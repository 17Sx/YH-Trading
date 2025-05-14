import { z } from 'zod';

export const AddTradeSchema = z.object({
  trade_date: z.string().min(1, "La date est requise."), 
  asset_id: z.string().uuid("L'actif sélectionné n'est pas valide.").optional().nullable(),
  session_id: z.string().uuid("La session sélectionnée n'est pas valide.").optional().nullable(),
  setup_id: z.string().uuid("Le setup sélectionné n'est pas valide.").optional().nullable(),
  risk_input: z.string().min(1, "Le risque est requis."),
  profit_loss_amount: z.preprocess(
    (val) => {
      const processedVal = String(val).replace(',', '.'); 
      return parseFloat(processedVal);
    },
    z.number({ invalid_type_error: "Le profit/perte doit être un nombre." })
  ),
  tradingview_link: z.string().url("Le lien TradingView doit être une URL valide.").optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
});

export type AddTradeInput = z.infer<typeof AddTradeSchema>;

export const AddListItemSchema = z.object({
  name: z.string().min(1, "Le nom est requis.").max(100, "Le nom ne peut pas dépasser 100 caractères."),
});

export type AddListItemInput = z.infer<typeof AddListItemSchema>; 