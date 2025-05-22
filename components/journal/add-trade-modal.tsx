"use client";

import { useForm, SubmitHandler, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddTradeSchema, type AddTradeInput } from "@/schemas/journal.schema";
import { 
  addTrade, 
  addAsset, addSession, addSetup, 
  deleteAsset, deleteSession, deleteSetup 
} from "@/lib/actions/journal.actions";
import type { Asset, Session, Setup } from "@/lib/actions/journal.actions";
import { X, PlusSquare, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState, useCallback, memo } from "react";
import { ManageItemsModal } from "./manage-items-modal"; 
import { useJournalData } from '@/lib/hooks/useJournalData';
import DatePicker from "react-datepicker";
import { fr } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataNeedsRefresh: () => Promise<void>;
  journalId: string;
}

type ItemType = "asset" | "session" | "setup";
interface ItemManagementType {
  type: ItemType;
  id?: string;
}

export const AddTradeModal = memo(function AddTradeModal({
  isOpen,
  onClose,
  onDataNeedsRefresh,
  journalId,
}: AddTradeModalProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<AddTradeInput>({
    resolver: zodResolver(AddTradeSchema),
    defaultValues: {
      trade_date: new Date().toISOString().split("T")[0],
      asset_id: "",
      session_id: "",
      setup_id: "",
      risk_input: "",
      profit_loss_amount: 0,
      tradingview_link: "",
      notes: "",
    },
  });

  const [itemManagementTarget, setItemManagementTarget] = useState<ItemManagementType | null>(null);

  const { 
    assets = [], 
    sessions = [], 
    setups = [], 
    isLoading, 
    error,
    refreshAll,
    optimisticUpdateTrades
  } = useJournalData(journalId, true);

  useEffect(() => {
    if (isOpen) {
      refreshAll().then(() => {
      }).catch(err => {
        console.error('Erreur lors du rafraîchissement:', err);
      });
    }
  }, [isOpen, refreshAll]);

  useEffect(() => {
    if (!isOpen) {
      reset({
        trade_date: new Date().toISOString().split("T")[0],
        asset_id: "",
        session_id: "",
        setup_id: "",
        risk_input: "",
        profit_loss_amount: 0,
        tradingview_link: "",
        notes: "",
      });
    }
  }, [isOpen, reset]);

  const handleOpenManageItemsModal = useCallback((type: ItemType) => {
    setItemManagementTarget({ type });
  }, []);

  const handleListChangedInManageModal = useCallback(async (itemType: ItemManagementType, newItemId?: string) => {
    await refreshAll();
    
    if (itemType.type === "asset" && newItemId) {
      setValue("asset_id", newItemId, { shouldValidate: true });
    } else if (itemType.type === "session" && newItemId) {
      setValue("session_id", newItemId, { shouldValidate: true });
    } else if (itemType.type === "setup" && newItemId) {
      setValue("setup_id", newItemId, { shouldValidate: true });
    }
    
    await onDataNeedsRefresh();
  }, [refreshAll, setValue, onDataNeedsRefresh]);

  const handleClose = useCallback(() => {
    setItemManagementTarget(null);
    onClose();
  }, [onClose]);

  const onSubmitTrade: SubmitHandler<AddTradeInput> = useCallback(async (data) => {
    try {
      const optimisticTrade = {
        id: `temp-${Date.now()}`,
        trade_date: data.trade_date,
        asset_id: data.asset_id,
        session_id: data.session_id,
        setup_id: data.setup_id,
        risk_input: data.risk_input,
        profit_loss_amount: data.profit_loss_amount,
        tradingview_link: data.tradingview_link,
        notes: data.notes,
        journal_id: journalId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      optimisticUpdateTrades(optimisticTrade);

      const result = await addTrade(data, journalId);

      if (result.success) {
        toast.success("Trade ajouté avec succès !");
        await refreshAll();
        onClose();
      } else {
        let errorMessage = result.error || "Une erreur est survenue lors de l'ajout.";
        if (result.issues) {
          errorMessage = result.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(" ; ");
        }
        toast.error(errorMessage);
        await refreshAll();
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur inattendue est survenue lors de l'ajout du trade.");
      await refreshAll();
    }
  }, [journalId, onClose, refreshAll, optimisticUpdateTrades]);

  if (!isOpen) return null;
  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur lors du chargement des données</div>;

  let currentItems: any[] = [];
  let currentAddItemAction: any;
  let currentDeleteItemAction: any;
  let currentItemTypeLabel = "";

  if (itemManagementTarget && itemManagementTarget.type === "asset") {
    currentItemTypeLabel = "Actif";
    currentItems = assets;
    currentAddItemAction = addAsset;
    currentDeleteItemAction = deleteAsset;
  } else if (itemManagementTarget && itemManagementTarget.type === "session") {
    currentItemTypeLabel = "Session";
    currentItems = sessions;
    currentAddItemAction = addSession;
    currentDeleteItemAction = deleteSession;
  } else if (itemManagementTarget && itemManagementTarget.type === "setup") {
    currentItemTypeLabel = "Setup";
    currentItems = setups;
    currentAddItemAction = addSetup;
    currentDeleteItemAction = deleteSetup;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 pointer-events-auto">
        <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative border border-purple-500/50">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Fermer la modale"
            disabled={isSubmitting}
          >
            <X size={24} />
          </button>
          <h2 className="text-2xl font-semibold text-purple-300 mb-6">
            Ajouter un Trade
          </h2>
          <form onSubmit={handleSubmit(onSubmitTrade)} className="space-y-5">
            {/* Date */}
            <div>
              <label htmlFor="trade_date" className="block text-sm font-medium text-gray-300 mb-1">Date</label>
              <Controller
                name="trade_date"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <DatePicker
                      selected={field.value ? new Date(field.value) : null}
                      onChange={(date) => {
                        if (date) {
                          const formattedDate = date.toISOString().split('T')[0];
                          field.onChange(formattedDate);
                        }
                      }}
                      dateFormat="dd MMMM yyyy"
                      locale={fr}
                      className={`w-full p-2.5 bg-gray-700 border ${errors.trade_date ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500 pl-10 text-gray-200`}
                      placeholderText="Sélectionner une date"
                      maxDate={new Date()}
                      showPopperArrow={false}
                      customInput={
                        <input
                          type="text"
                          className={`w-full p-2.5 bg-gray-700 border ${errors.trade_date ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500 pl-10 text-gray-200`}
                          placeholder="Sélectionner une date"
                          value={field.value ? new Date(field.value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
                          readOnly
                        />
                      }
                      popperClassName="z-50"
                      popperPlacement="bottom-start"
                    />
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                )}
              />
              {errors.trade_date && <p className="mt-1 text-sm text-red-400">{errors.trade_date.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Actif */}
              <div>
                <label htmlFor="asset_id" className="flex items-center justify-between text-sm font-medium text-gray-300 mb-1">
                  <span>Actif</span>
                  <button type="button" onClick={() => handleOpenManageItemsModal("asset")} className="text-xs text-purple-400 hover:text-purple-300 hover:underline flex items-center" disabled={isSubmitting}>
                    <PlusSquare size={14} className="mr-1"/> Gérer
                  </button>
                </label>
                <Controller
                  name="asset_id"
                  control={control}
                  render={({ field }) => (
                    <select 
                      {...field} 
                      id="asset_id" 
                      className={`w-full p-2.5 bg-gray-700 border ${errors.asset_id ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`}
                      value={field.value || ''}
                    >
                      <option value="">Sélectionner...</option>
                      {Array.isArray(assets) && assets.map(asset => (
                        <option key={asset.id} value={asset.id}>{asset.name}</option>
                      ))}
                    </select>
                  )}
                />
                {errors.asset_id && <p className="mt-1 text-sm text-red-400">{errors.asset_id.message}</p>}
              </div>

              {/* Session */}
              <div>
                <label htmlFor="session_id" className="flex items-center justify-between text-sm font-medium text-gray-300 mb-1">
                  <span>Session</span>
                  <button type="button" onClick={() => handleOpenManageItemsModal("session")} className="text-xs text-purple-400 hover:text-purple-300 hover:underline flex items-center" disabled={isSubmitting}>
                    <PlusSquare size={14} className="mr-1"/> Gérer
                  </button>
                </label>
                <Controller
                  name="session_id"
                  control={control}
                  render={({ field }) => (
                    <select 
                      {...field} 
                      id="session_id" 
                      className={`w-full p-2.5 bg-gray-700 border ${errors.session_id ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`}
                      value={field.value || ''}
                    >
                      <option value="">Sélectionner...</option>
                      {Array.isArray(sessions) && sessions.map(session => (
                        <option key={session.id} value={session.id}>{session.name}</option>
                      ))}
                    </select>
                  )}
                />
                {errors.session_id && <p className="mt-1 text-sm text-red-400">{errors.session_id.message}</p>}
              </div>

              {/* Setup */}
              <div>
                <label htmlFor="setup_id" className="flex items-center justify-between text-sm font-medium text-gray-300 mb-1">
                  <span>Setup</span>
                  <button type="button" onClick={() => handleOpenManageItemsModal("setup")} className="text-xs text-purple-400 hover:text-purple-300 hover:underline flex items-center" disabled={isSubmitting}>
                    <PlusSquare size={14} className="mr-1"/> Gérer
                  </button>
                </label>
                <Controller
                  name="setup_id"
                  control={control}
                  render={({ field }) => (
                    <select 
                      {...field} 
                      id="setup_id" 
                      className={`w-full p-2.5 bg-gray-700 border ${errors.setup_id ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`}
                      value={field.value || ''}
                    >
                      <option value="">Sélectionner...</option>
                      {Array.isArray(setups) && setups.map(setup => (
                        <option key={setup.id} value={setup.id}>{setup.name}</option>
                      ))}
                    </select>
                  )}
                />
                {errors.setup_id && <p className="mt-1 text-sm text-red-400">{errors.setup_id.message}</p>}
              </div>
            </div>

            {/* Risk & PNL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="risk_input" className="block text-sm font-medium text-gray-300 mb-1">Risk (RR ou %)</label>
                <input type="text" {...register("risk_input")} id="risk_input" placeholder="Ex: 2R, -1R, 0.5%" className={`w-full p-2.5 bg-gray-700 border ${errors.risk_input ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`} />
                {errors.risk_input && <p className="mt-1 text-sm text-red-400">{errors.risk_input.message}</p>}
              </div>
              <div>
                <label htmlFor="profit_loss_amount" className="block text-sm font-medium text-gray-300 mb-1">Résultat (%)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("profit_loss_amount")}
                  id="profit_loss_amount"
                  placeholder="Ex: 1.5 (pour 1.5%)"
                  className={`w-full p-2.5 bg-gray-700 border ${errors.profit_loss_amount ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`}
                />
                {errors.profit_loss_amount && <p className="mt-1 text-sm text-red-400">{errors.profit_loss_amount.message}</p>}
              </div>
            </div>

            {/* TradingView Link */}
            <div>
              <label htmlFor="tradingview_link" className="block text-sm font-medium text-gray-300 mb-1">Lien TradingView (Optionnel)</label>
              <input type="url" {...register("tradingview_link")} id="tradingview_link" placeholder="https://www.tradingview.com/chart/..." className={`w-full p-2.5 bg-gray-700 border ${errors.tradingview_link ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`} />
              {errors.tradingview_link && <p className="mt-1 text-sm text-red-400">{errors.tradingview_link.message}</p>}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">Notes (Optionnel)</label>
              <textarea {...register("notes")} id="notes" rows={3} placeholder="Contexte, émotions, leçons apprises..." className={`w-full p-2.5 bg-gray-700 border ${errors.notes ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`}></textarea>
              {errors.notes && <p className="mt-1 text-sm text-red-400">{errors.notes.message}</p>}
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button 
                type="button" 
                onClick={handleClose} 
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"
              >
                Annuler
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors flex items-center focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Ajouter le trade
              </button>
            </div>
          </form>
        </div>
      </div>

      {itemManagementTarget && (
        <ManageItemsModal
          isOpen={!!itemManagementTarget}
          onClose={() => setItemManagementTarget(null)}
          itemTypeLabel={currentItemTypeLabel}
          items={currentItems}
          addItemAction={currentAddItemAction}
          deleteItemAction={currentDeleteItemAction}
          onListChanged={handleListChangedInManageModal}
          journalId={journalId}
        />
      )}
    </>
  );
}); 