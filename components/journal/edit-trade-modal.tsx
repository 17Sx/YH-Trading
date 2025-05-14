"use client";

import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddTradeSchema, type AddTradeInput } from "@/schemas/journal.schema"; 
import { 
  updateTrade, 
  addAsset, addSession, addSetup, 
  deleteAsset, deleteSession, deleteSetup 
} from "@/lib/actions/journal.actions";
import type { Asset, Session, Setup, Trade } from "@/lib/actions/journal.actions";
import { X, PlusSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState, useCallback } from "react";
import { ManageItemsModal } from "./manage-items-modal"; 
import { getAssets, getSessions, getSetups } from "@/lib/actions/journal.actions";

interface EditTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade | null; 
  assets: Asset[];
  sessions: Session[];
  setups: Setup[];
  onDataNeedsRefresh: () => Promise<void>; 
}

type ItemManagementType = "asset" | "session" | "setup" | null;

export function EditTradeModal({
  isOpen,
  onClose,
  trade,
  assets,
  sessions,
  setups,
  onDataNeedsRefresh,
}: EditTradeModalProps) {
  const [localAssets, setLocalAssets] = useState<Asset[]>(assets);
  const [localSessions, setLocalSessions] = useState<Session[]>(sessions);
  const [localSetups, setLocalSetups] = useState<Setup[]>(setups);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isSubmittingForm }, 
    reset,
    setValue,
  } = useForm<AddTradeInput>({ 
    resolver: zodResolver(AddTradeSchema.partial()), 
    defaultValues: {
      trade_date: "",
      asset_id: "",
      session_id: "",
      setup_id: "",
      risk_input: "",
      profit_loss_amount: 0,
      tradingview_link: "",
      notes: "",
    },
  });

  const [itemManagementTarget, setItemManagementTarget] = useState<ItemManagementType>(null);
  
  useEffect(() => {
    setLocalAssets(assets);
  }, [assets]);

  useEffect(() => {
    setLocalSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    setLocalSetups(setups);
  }, [setups]);

  useEffect(() => {
    if (isOpen && trade) {
      reset({
        trade_date: trade.trade_date ? new Date(trade.trade_date).toISOString().split("T")[0] : "",
        asset_id: trade.asset_id || "",
        session_id: trade.session_id || "",
        setup_id: trade.setup_id || "",
        risk_input: trade.risk_input || "",
        profit_loss_amount: trade.profit_loss_amount || 0,
        tradingview_link: trade.tradingview_link || "",
        notes: trade.notes || "",
      });
    } else if (!isOpen) {
      reset({ 
        trade_date: new Date().toISOString().split("T")[0],
        asset_id: "", session_id: "", setup_id: "", 
        risk_input: "", profit_loss_amount: 0, tradingview_link: "", notes: ""
      });
    }
  }, [isOpen, trade, reset]);

  const handleOpenManageItemsModal = (type: ItemManagementType) => {
    setItemManagementTarget(type);
  };

  const refreshLocalAssets = useCallback(async () => {
    const { assets: newAssets } = await getAssets();
    if (newAssets) setLocalAssets(newAssets);
  }, []);

  const refreshLocalSessions = useCallback(async () => {
    const { sessions: newSessions } = await getSessions();
    if (newSessions) setLocalSessions(newSessions);
  }, []);

  const refreshLocalSetups = useCallback(async () => {
    const { setups: newSetups } = await getSetups();
    if (newSetups) setLocalSetups(newSetups);
  }, []);
  
  const handleListChangedInManageModal = useCallback(async (itemType: ItemManagementType, newItemId?: string) => {
    let refreshedListIsEmpty = false;
    if (itemType === "asset") {
      await refreshLocalAssets();
      const currentAssets = await getAssets().then(res => res.assets || []);
      if (newItemId) setValue("asset_id", newItemId, { shouldValidate: true });
      else if (currentAssets.length > 0 && !currentAssets.find(a => a.id === trade?.asset_id)) {
        setValue("asset_id", currentAssets[0].id, { shouldValidate: true });
      } else if (currentAssets.length === 0) { 
        setValue("asset_id", "", { shouldValidate: true }); refreshedListIsEmpty = true; 
      }
    } else if (itemType === "session") {
      await refreshLocalSessions();
      const currentSessions = await getSessions().then(res => res.sessions || []);
      if (newItemId) setValue("session_id", newItemId, { shouldValidate: true });
      else if (currentSessions.length > 0 && !currentSessions.find(s => s.id === trade?.session_id)) {
        setValue("session_id", currentSessions[0].id, { shouldValidate: true });
      } else if (currentSessions.length === 0) {
        setValue("session_id", "", { shouldValidate: true }); refreshedListIsEmpty = true;
      }
    } else if (itemType === "setup") {
      await refreshLocalSetups();
      const currentSetups = await getSetups().then(res => res.setups || []);
      if (newItemId) setValue("setup_id", newItemId, { shouldValidate: true });
      else if (currentSetups.length > 0 && !currentSetups.find(s => s.id === trade?.setup_id)) {
        setValue("setup_id", currentSetups[0].id, { shouldValidate: true });
      } else if (currentSetups.length === 0) {
         setValue("setup_id", "", { shouldValidate: true }); refreshedListIsEmpty = true;
      }
    }
    await onDataNeedsRefresh(); 
  }, [refreshLocalAssets, refreshLocalSessions, refreshLocalSetups, onDataNeedsRefresh, setValue, trade]);


  const onSubmitEditTrade: SubmitHandler<AddTradeInput> = async (data) => {
    if (!trade) {
      toast.error("Aucun trade sélectionné pour la modification.");
      return;
    }

    const changedData: Partial<AddTradeInput> = {};
    let hasChanges = false;

    const initialTradeDate = trade.trade_date ? new Date(trade.trade_date).toISOString().split("T")[0] : null;
    const formTradeDate = data.trade_date ? new Date(data.trade_date).toISOString().split("T")[0] : null;
    if (formTradeDate !== initialTradeDate) {
      changedData.trade_date = data.trade_date;
      hasChanges = true;
    }


    const fieldsToCompare: Array<keyof Pick<AddTradeInput, 'asset_id' | 'session_id' | 'setup_id' | 'notes' | 'tradingview_link'>> = [
      'asset_id', 'session_id', 'setup_id', 'notes', 'tradingview_link'
    ];

    for (const key of fieldsToCompare) {
      const formValue = data[key] === '' ? null : data[key]; 
      const initialValue = trade[key as keyof Trade]; 
      if (formValue !== initialValue) {
        changedData[key] = formValue; 
        hasChanges = true;
      }
    }

    if (data.risk_input !== trade.risk_input) {
      changedData.risk_input = data.risk_input;
      hasChanges = true;
    }


    const formPnl = data.profit_loss_amount;
    if (formPnl !== undefined && formPnl !== trade.profit_loss_amount) {
      changedData.profit_loss_amount = formPnl;
      hasChanges = true;
    } else if (formPnl === undefined && trade.profit_loss_amount !== null && trade.profit_loss_amount !== undefined) {

    }

    if (!hasChanges) {
      toast.info("Aucune modification détectée.");
      onClose();
      return;
    }
    
    try {
      const result = await updateTrade(trade.id, changedData);
      if (result.success) {
        toast.success("Trade modifié avec succès !");
        onClose(); 
      } else {
        let errorMessage = result.error || "Une erreur est survenue lors de la modification.";
        if (result.issues) {
          errorMessage = result.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(" ; ");
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur inattendue est survenue lors de la modification du trade.");
    }
  };

  if (!isOpen) return null;

  let currentItems: any[] = [];
  let currentAddItemAction: any;
  let currentDeleteItemAction: any;
  let currentItemTypeLabel = "";

  if (itemManagementTarget === "asset") {
    currentItemTypeLabel = "Actif";
    currentItems = localAssets;
    currentAddItemAction = addAsset;
    currentDeleteItemAction = deleteAsset;
  } else if (itemManagementTarget === "session") {
    currentItemTypeLabel = "Session";
    currentItems = localSessions;
    currentAddItemAction = addSession;
    currentDeleteItemAction = deleteSession;
  } else if (itemManagementTarget === "setup") {
    currentItemTypeLabel = "Setup";
    currentItems = localSetups;
    currentAddItemAction = addSetup;
    currentDeleteItemAction = deleteSetup;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 pointer-events-auto">
        <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative border border-purple-500/50">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Fermer la modale"
            disabled={isSubmittingForm}
          >
            <X size={24} />
          </button>
          <h2 className="text-2xl font-semibold text-purple-300 mb-6">
            Modifier le Trade
          </h2>
          {!trade && <p className="text-center text-red-400">Chargement des données du trade impossible...</p>}
          {trade && (
            <form onSubmit={handleSubmit(onSubmitEditTrade)} className="space-y-5">
              {/* Date */}
              <div>
                <label htmlFor="edit-trade_date" className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                <input type="date" {...register("trade_date")} id="edit-trade_date" className={`w-full p-2.5 bg-gray-700 border ${errors.trade_date ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`} />
                {errors.trade_date && <p className="mt-1 text-sm text-red-400">{errors.trade_date.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Actif */}
                <div>
                  <label htmlFor="edit-asset_id" className="flex items-center justify-between text-sm font-medium text-gray-300 mb-1">
                    <span>Actif</span>
                    <button type="button" onClick={() => handleOpenManageItemsModal("asset")} className="text-xs text-purple-400 hover:text-purple-300 hover:underline flex items-center" disabled={isSubmittingForm}>
                      <PlusSquare size={14} className="mr-1"/> Gérer
                    </button>
                  </label>
                  <Controller
                    name="asset_id"
                    control={control}
                    render={({ field }) => (
                      <select 
                        {...field} 
                        id="edit-asset_id" 
                        className={`w-full p-2.5 bg-gray-700 border ${errors.asset_id ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`}
                        value={field.value ?? ''}
                      >
                        <option value="">Sélectionner...</option>
                        {localAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    )}
                  />
                  {errors.asset_id && <p className="mt-1 text-sm text-red-400">{errors.asset_id.message}</p>}
                </div>

                {/* Session */}
                <div>
                  <label htmlFor="edit-session_id" className="flex items-center justify-between text-sm font-medium text-gray-300 mb-1">
                    <span>Session</span>
                    <button type="button" onClick={() => handleOpenManageItemsModal("session")} className="text-xs text-purple-400 hover:text-purple-300 hover:underline flex items-center" disabled={isSubmittingForm}>
                      <PlusSquare size={14} className="mr-1"/> Gérer
                    </button>
                  </label>
                  <Controller
                    name="session_id"
                    control={control}
                    render={({ field }) => (
                        <select 
                          {...field} 
                          id="edit-session_id" 
                          className={`w-full p-2.5 bg-gray-700 border ${errors.session_id ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`}
                          value={field.value ?? ''}
                        >
                        <option value="">Sélectionner...</option>
                        {localSessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    )}
                    />
                  {errors.session_id && <p className="mt-1 text-sm text-red-400">{errors.session_id.message}</p>}
                </div>

                {/* Setup */}
                <div>
                  <label htmlFor="edit-setup_id" className="flex items-center justify-between text-sm font-medium text-gray-300 mb-1">
                      <span>Setup</span>
                      <button type="button" onClick={() => handleOpenManageItemsModal("setup")} className="text-xs text-purple-400 hover:text-purple-300 hover:underline flex items-center" disabled={isSubmittingForm}>
                          <PlusSquare size={14} className="mr-1"/> Gérer
                      </button>
                  </label>
                   <Controller
                    name="setup_id"
                    control={control}
                    render={({ field }) => (
                        <select 
                          {...field} 
                          id="edit-setup_id" 
                          className={`w-full p-2.5 bg-gray-700 border ${errors.setup_id ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`}
                          value={field.value ?? ''}
                        >
                        <option value="">Sélectionner...</option>
                        {localSetups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    )}
                    />
                  {errors.setup_id && <p className="mt-1 text-sm text-red-400">{errors.setup_id.message}</p>}
                </div>
              </div>
              
              {/* Risk & PNL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="edit-risk_input" className="block text-sm font-medium text-gray-300 mb-1">Risk (RR ou %)</label>
                  <input type="text" {...register("risk_input")} id="edit-risk_input" placeholder="Ex: 2R, -1R, 0.5%" className={`w-full p-2.5 bg-gray-700 border ${errors.risk_input ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`} />
                  {errors.risk_input && <p className="mt-1 text-sm text-red-400">{errors.risk_input.message}</p>}
                </div>
                <div>
                  <label htmlFor="edit-profit_loss_amount" className="block text-sm font-medium text-gray-300 mb-1">Résultat (%)</label>
                  <Controller
                      name="profit_loss_amount"
                      control={control}
                      render={({ field }) => (
                          <input 
                              type="number"
                              id="edit-profit_loss_amount"
                              step="0.01"
                              placeholder="Ex: 1.5 (pour 1.5%)"
                              className={`w-full p-2.5 bg-gray-700 border ${errors.profit_loss_amount ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`}
                              value={field.value === null || field.value === undefined || isNaN(parseFloat(String(field.value))) ? '' : String(parseFloat(String(field.value)))}
                              onChange={e => {
                                  const val = e.target.value;
                                  if (val === '' || val === '-') { 
                                    field.onChange(val);
                                  } else {
                                    const num = parseFloat(val);
                                    field.onChange(isNaN(num) ? '' : num); 
                                  }
                              }}
                              onBlur={field.onBlur} 
                          />
                      )}
                  />
                  {errors.profit_loss_amount && <p className="mt-1 text-sm text-red-400">{errors.profit_loss_amount.message}</p>}
                </div>
              </div>

              {/* TradingView Link */}
              <div>
                <label htmlFor="edit-tradingview_link" className="block text-sm font-medium text-gray-300 mb-1">Lien TradingView (Optionnel)</label>
                <input type="url" {...register("tradingview_link")} id="edit-tradingview_link" placeholder="https://www.tradingview.com/chart/..." className={`w-full p-2.5 bg-gray-700 border ${errors.tradingview_link ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`} />
                {errors.tradingview_link && <p className="mt-1 text-sm text-red-400">{errors.tradingview_link.message}</p>}
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="edit-notes" className="block text-sm font-medium text-gray-300 mb-1">Notes (Optionnel)</label>
                <textarea {...register("notes")} id="edit-notes" rows={3} placeholder="Contexte, émotions, leçons apprises..." className={`w-full p-2.5 bg-gray-700 border ${errors.notes ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`}></textarea>
                {errors.notes && <p className="mt-1 text-sm text-red-400">{errors.notes.message}</p>}
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={onClose} 
                  disabled={isSubmittingForm}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingForm}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors flex items-center focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  {isSubmittingForm ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {itemManagementTarget && (
        <ManageItemsModal
          isOpen={!!itemManagementTarget}
          onClose={() => setItemManagementTarget(null)}
          itemTypeLabel={currentItemTypeLabel}
          items={
            itemManagementTarget === "asset" ? localAssets :
            itemManagementTarget === "session" ? localSessions : localSetups
          }
          addItemAction={
            itemManagementTarget === "asset" ? addAsset :
            itemManagementTarget === "session" ? addSession : addSetup
          }
          deleteItemAction={
            itemManagementTarget === "asset" ? deleteAsset :
            itemManagementTarget === "session" ? deleteSession : deleteSetup
          }
          onListChanged={async (newItemId?: string) => {
            if (itemManagementTarget) { 
                await handleListChangedInManageModal(itemManagementTarget, newItemId);
            }
          }}
        />
      )}
    </>
  );
} 