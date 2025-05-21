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
import { X, PlusSquare, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState, useCallback } from "react";
import { ManageItemsModal } from "./manage-items-modal"; 
import { getAssets, getSessions, getSetups } from "@/lib/actions/journal.actions";
import DatePicker from "react-datepicker";
import { fr } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

interface AddTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataNeedsRefresh: () => Promise<void>;
  journalId: string;
}

type ItemManagementType = "asset" | "session" | "setup" | null;

export function AddTradeModal({
  isOpen,
  onClose,
  onDataNeedsRefresh,
  journalId,
}: AddTradeModalProps) {
  const [localAssets, setLocalAssets] = useState<Asset[]>([]);
  const [localSessions, setLocalSessions] = useState<Session[]>([]);
  const [localSetups, setLocalSetups] = useState<Setup[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isSubmittingTrade },
    reset,
    setValue,
    watch,
    trigger,
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
      duration_minutes: undefined
    },
  });

  const [itemManagementTarget, setItemManagementTarget] = useState<ItemManagementType>(null);
  const [durationUnit, setDurationUnit] = useState<'minutes' | 'heures'>('minutes');
  
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        const [
          { assets: newAssets },
          { sessions: newSessions },
          { setups: newSetups }
        ] = await Promise.all([
          getAssets(journalId),
          getSessions(journalId),
          getSetups(journalId)
        ]);
        
        if (newAssets) setLocalAssets(newAssets);
        if (newSessions) setLocalSessions(newSessions);
        if (newSetups) setLocalSetups(newSetups);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isOpen) {
      initializeData();
    }
  }, [isOpen, journalId]);

  useEffect(() => {
    if (isOpen && !isLoading) {
      reset({
        trade_date: new Date().toISOString().split("T")[0],
        asset_id: localAssets[0]?.id || "",
        session_id: localSessions[0]?.id || "",
        setup_id: localSetups[0]?.id || "",
        risk_input: "",
        profit_loss_amount: 0,
        tradingview_link: "",
        notes: "",
        duration_minutes: undefined
      });
    }
  }, [isOpen, localAssets, localSessions, localSetups, reset, isLoading]);

  const handleOpenManageItemsModal = (type: ItemManagementType) => {
    setItemManagementTarget(type);
  };

  const refreshLocalAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const { assets: newAssets } = await getAssets(journalId);
      if (newAssets) setLocalAssets(newAssets);
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des actifs:", error);
      toast.error("Erreur lors du rafraîchissement des actifs");
    } finally {
      setIsLoading(false);
    }
  }, [journalId]);

  const refreshLocalSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { sessions: newSessions } = await getSessions(journalId);
      if (newSessions) setLocalSessions(newSessions);
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des sessions:", error);
      toast.error("Erreur lors du rafraîchissement des sessions");
    } finally {
      setIsLoading(false);
    }
  }, [journalId]);

  const refreshLocalSetups = useCallback(async () => {
    setIsLoading(true);
    try {
      const { setups: newSetups } = await getSetups(journalId);
      if (newSetups) setLocalSetups(newSetups);
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des setups:", error);
      toast.error("Erreur lors du rafraîchissement des setups");
    } finally {
      setIsLoading(false);
    }
  }, [journalId]);

  const handleListChangedInManageModal = useCallback(async (itemType: ItemManagementType, newItemId?: string) => {
    let refreshedListIsEmpty = false;
    try {
      if (itemType === "asset") {
        await refreshLocalAssets();
        if (newItemId) setValue("asset_id", newItemId, { shouldValidate: true });
        else if (localAssets.length > 0) setValue("asset_id", localAssets[0].id, { shouldValidate: true });
        else { setValue("asset_id", "", { shouldValidate: true }); refreshedListIsEmpty = true; }
      } else if (itemType === "session") {
        await refreshLocalSessions();
        if (newItemId) setValue("session_id", newItemId, { shouldValidate: true });
        else if (localSessions.length > 0) setValue("session_id", localSessions[0].id, { shouldValidate: true });
        else { setValue("session_id", "", { shouldValidate: true }); refreshedListIsEmpty = true; }
      } else if (itemType === "setup") {
        await refreshLocalSetups();
        if (newItemId) setValue("setup_id", newItemId, { shouldValidate: true });
        else if (localSetups.length > 0) setValue("setup_id", localSetups[0].id, { shouldValidate: true });
        else { setValue("setup_id", "", { shouldValidate: true }); refreshedListIsEmpty = true; }
      }
      
      await onDataNeedsRefresh();
    } catch (error) {
      console.error("Erreur lors de la mise à jour des données:", error);
      toast.error("Erreur lors de la mise à jour des données");
    }
  }, [refreshLocalAssets, refreshLocalSessions, refreshLocalSetups, onDataNeedsRefresh, setValue, localAssets, localSessions, localSetups]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await trigger();

    if (isValid) {
      const result = await handleSubmit(onSubmitTrade)(e);
    } else {
      Object.entries(errors).forEach(([field, error]) => {
      });
    }
  };

  const onSubmitTrade: SubmitHandler<AddTradeInput> = async (data) => {
    try {
      const tradeData = { 
        ...data, 
        profit_loss_amount: parseFloat(data.profit_loss_amount.toString()),
        journal_id: journalId,
        duration_minutes: undefined
      };

      const result = await addTrade(tradeData, journalId);

      if (result.success) {
        toast.success("Trade ajouté avec succès !");
        await onDataNeedsRefresh();
        reset();
        onClose(); 
      } else {
        let errorMessage = result.error || "Une erreur est survenue.";
        if (result.issues) {
          errorMessage = result.issues.map((issue) => issue.message).join(" ");
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du trade:", error);
      toast.error("Une erreur inattendue est survenue lors de l'ajout du trade.");
    }
  };

  const formValues = watch();
  useEffect(() => {
    console.log('Form values updated:', formValues);
  }, [formValues]);

  if (!isOpen) return null;

  const currentItemTypeLabel = 
    itemManagementTarget === "asset" ? "Actif" :
    itemManagementTarget === "session" ? "Session" : "Setup";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 pointer-events-auto">
        <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative border border-purple-500/50">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="Fermer la modale"
          >
            <X size={24} />
          </button>
          <h2 className="text-2xl font-semibold text-purple-300 mb-6">
            Ajouter un nouveau Trade
          </h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-5">
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
                    <button type="button" onClick={() => handleOpenManageItemsModal("asset")} className="text-xs text-purple-400 hover:text-purple-300 hover:underline flex items-center">
                      <PlusSquare size={14} className="mr-1"/> Gérer
                    </button>
                  </label>
                  <select {...register("asset_id")} id="asset_id" className={`w-full p-2.5 bg-gray-700 border ${errors.asset_id ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`}>
                    <option value="">Sélectionner...</option>
                    {localAssets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  {errors.asset_id && <p className="mt-1 text-sm text-red-400">{errors.asset_id.message}</p>}
                </div>

                {/* Session */}
                <div>
                  <label htmlFor="session_id" className="flex items-center justify-between text-sm font-medium text-gray-300 mb-1">
                    <span>Session</span>
                    <button type="button" onClick={() => handleOpenManageItemsModal("session")} className="text-xs text-purple-400 hover:text-purple-300 hover:underline flex items-center">
                      <PlusSquare size={14} className="mr-1"/> Gérer
                    </button>
                  </label>
                  <select {...register("session_id")} id="session_id" className={`w-full p-2.5 bg-gray-700 border ${errors.session_id ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`}>
                    <option value="">Sélectionner...</option>
                    {localSessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {errors.session_id && <p className="mt-1 text-sm text-red-400">{errors.session_id.message}</p>}
                </div>

                {/* Setup */}
                <div>
                  <label htmlFor="setup_id" className="flex items-center justify-between text-sm font-medium text-gray-300 mb-1">
                    <span>Setup</span>
                    <button type="button" onClick={() => handleOpenManageItemsModal("setup")} className="text-xs text-purple-400 hover:text-purple-300 hover:underline flex items-center">
                      <PlusSquare size={14} className="mr-1"/> Gérer
                    </button>
                  </label>
                  <select {...register("setup_id")} id="setup_id" className={`w-full p-2.5 bg-gray-700 border ${errors.setup_id ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`}>
                    <option value="">Sélectionner...</option>
                    {localSetups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {errors.setup_id && <p className="mt-1 text-sm text-red-400">{errors.setup_id.message}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="risk_input" className="block text-sm font-medium text-gray-300 mb-1">Risk (montant ou %)</label>
                  <input type="text" {...register("risk_input")} id="risk_input" placeholder="Ex: 100 ou 1%" className={`w-full p-2.5 bg-gray-700 border ${errors.risk_input ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`} />
                  {errors.risk_input && <p className="mt-1 text-sm text-red-400">{errors.risk_input.message}</p>}
                </div>
                <div>
                  <label htmlFor="profit_loss_amount" className="block text-sm font-medium text-gray-300 mb-1">Profit / Perte</label>
                  <Controller
                    name="profit_loss_amount"
                    control={control}
                    render={({ field }) => (
                      <input 
                        type="text"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^-?\d*([.,]\d*)?$/.test(value) || value === "" || value === "-") {
                            field.onChange(value);
                          }
                        }}
                        placeholder="Ex: 2.5 (pour +2.5%), -1 (pour -1%)" 
                        className={`w-full p-2.5 bg-gray-700 border ${errors.profit_loss_amount ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`} 
                      />
                    )}
                  />
                  {errors.profit_loss_amount && <p className="mt-1 text-sm text-red-400">{errors.profit_loss_amount.message}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="tradingview_link" className="block text-sm font-medium text-gray-300 mb-1">Lien TradingView (Optionnel)</label>
                <input type="url" {...register("tradingview_link")} id="tradingview_link" placeholder="https://www.tradingview.com/chart/..." className={`w-full p-2.5 bg-gray-700 border ${errors.tradingview_link ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`} />
                {errors.tradingview_link && <p className="mt-1 text-sm text-red-400">{errors.tradingview_link.message}</p>}
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">Notes / Analyse (Optionnel)</label>
                <textarea {...register("notes")} id="notes" rows={3} placeholder="Vos réflexions sur le trade, émotions, etc." className={`w-full p-2.5 bg-gray-700 border ${errors.notes ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`}></textarea>
                {errors.notes && <p className="mt-1 text-sm text-red-400">{errors.notes.message}</p>}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmittingTrade}
                  className="mr-3 py-2 px-5 text-sm font-medium text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSubmittingTrade}
                  onClick={() => console.log("cliqué")}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-6 rounded-md transition-colors duration-300 focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-60"
                >
                  {isSubmittingTrade ? "Enregistrement..." : "Enregistrer le Trade"}
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
          journalId={journalId}
        />
      )}
    </>
  );
} 