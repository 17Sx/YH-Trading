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
import { X, PlusSquare, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState, useCallback, memo, useRef, useMemo } from "react";
import { ManageItemsModal } from "./manage-items-modal"; 
import useSWR from 'swr';
import DatePicker from "react-datepicker";
import { fr } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { useJournalData } from '@/lib/hooks/useJournalData';

interface EditTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade;
  assets: Asset[];
  sessions: Session[];
  setups: Setup[];
  onDataNeedsRefresh: () => Promise<void>;
  journalId: string;
}

type ItemType = "asset" | "session" | "setup";
interface ItemManagementType {
  type: ItemType;
  id?: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export const EditTradeModal = memo(function EditTradeModal({
  isOpen,
  onClose,
  trade,
  assets: initialAssets,
  sessions: initialSessions,
  setups: initialSetups,
  onDataNeedsRefresh,
  journalId,
}: EditTradeModalProps) {
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
      duration_minutes: undefined,
    },
  });

  const { 
    assets, 
    sessions, 
    setups, 
    isLoading, 
    error, 
    refreshAll,
    optimisticUpdateTrades 
  } = useJournalData(journalId, isOpen);

  const [durationUnit, setDurationUnit] = useState<'minutes' | 'heures'>('minutes');
  const [itemManagementTarget, setItemManagementTarget] = useState<ItemManagementType | null>(null);

  const assetOptions = useMemo(() => {
    if (!Array.isArray(assets)) return [];
    return assets.map(a => ({ value: a.id, label: a.name }));
  }, [assets]);

  const sessionOptions = useMemo(() => {
    if (!Array.isArray(sessions)) return [];
    return sessions.map(s => ({ value: s.id, label: s.name }));
  }, [sessions]);

  const setupOptions = useMemo(() => {
    if (!Array.isArray(setups)) return [];
    return setups.map(s => ({ value: s.id, label: s.name }));
  }, [setups]);

  useEffect(() => {
    if (isOpen && trade) {
      let unit: 'minutes' | 'heures' = 'minutes';
      let value = trade.duration_minutes || undefined;
      if (value && value % 60 === 0) {
        unit = 'heures';
        value = value / 60;
      }
      setDurationUnit(unit);
      reset({
        trade_date: trade.trade_date ? new Date(trade.trade_date).toISOString().split("T")[0] : "",
        asset_id: trade.asset_id || "",
        session_id: trade.session_id || "",
        setup_id: trade.setup_id || "",
        risk_input: trade.risk_input || "",
        profit_loss_amount: trade.profit_loss_amount || 0,
        tradingview_link: trade.tradingview_link || "",
        notes: trade.notes || "",
        duration_minutes: value,
      });
    }
  }, [isOpen, trade?.id, reset]);

  useEffect(() => {
    if (!isOpen) {
      setDurationUnit('minutes');
      reset({ 
        trade_date: new Date().toISOString().split("T")[0],
        asset_id: "", session_id: "", setup_id: "", 
        risk_input: "", profit_loss_amount: 0, tradingview_link: "", notes: "",
        duration_minutes: undefined,
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

  const AssetSelect = useMemo(() => (
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
          {Array.isArray(assets) && assets.map(asset => (
            <option key={asset.id} value={asset.id}>{asset.name}</option>
          ))}
        </select>
      )}
    />
  ), [control, errors.asset_id, assets]);

  const SessionSelect = useMemo(() => (
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
          {Array.isArray(sessions) && sessions.map(session => (
            <option key={session.id} value={session.id}>{session.name}</option>
          ))}
        </select>
      )}
    />
  ), [control, errors.session_id, sessions]);

  const SetupSelect = useMemo(() => (
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
          {Array.isArray(setups) && setups.map(setup => (
            <option key={setup.id} value={setup.id}>{setup.name}</option>
          ))}
        </select>
      )}
    />
  ), [control, errors.setup_id, setups]);

  const onSubmitEditTrade: SubmitHandler<AddTradeInput> = useCallback(async (data) => {
    if (!trade) {
      toast.error("Aucun trade sélectionné pour la modification.");
      return;
    }

    let duration = data.duration_minutes;
    if (duration && durationUnit === 'heures') {
      duration = duration * 60;
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

    if (duration !== trade?.duration_minutes) {
      changedData.duration_minutes = duration;
      hasChanges = true;
    }

    if (!hasChanges) {
      toast.info("Aucune modification détectée.");
      onClose();
      return;
    }
    
    try {
      const result = await updateTrade(trade.id, changedData, journalId);
      if (result.success) {
        toast.success("Trade modifié avec succès !");
        await refreshAll();
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
  }, [trade, durationUnit, journalId, onClose, refreshAll]);

  if (!isOpen) return null;
  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur lors du chargement des données</div>;

  let currentItems: any[] = [];
  let currentAddItemAction: any;
  let currentDeleteItemAction: any;
  let currentItemTypeLabel = "";

  if (itemManagementTarget?.type === "asset") {
    currentItemTypeLabel = "Actif";
    currentItems = Array.isArray(assets) ? assets : [];
    currentAddItemAction = addAsset;
    currentDeleteItemAction = deleteAsset;
  } else if (itemManagementTarget?.type === "session") {
    currentItemTypeLabel = "Session";
    currentItems = Array.isArray(sessions) ? sessions : [];
    currentAddItemAction = addSession;
    currentDeleteItemAction = deleteSession;
  } else if (itemManagementTarget?.type === "setup") {
    currentItemTypeLabel = "Setup";
    currentItems = Array.isArray(setups) ? setups : [];
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
            disabled={isSubmittingForm}
          >
            <X size={24} />
          </button>
          <h2 className="text-2xl font-semibold text-purple-300 mb-6">
            Modifier le Trade
          </h2>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : error ? (
            <p className="text-center text-red-400">Erreur lors du chargement des données</p>
          ) : !trade ? (
            <p className="text-center text-red-400">Chargement des données du trade impossible...</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmitEditTrade)} className="space-y-5">
              {/* Date */}
              <div>
                <label htmlFor="edit-trade_date" className="block text-sm font-medium text-gray-300 mb-1">Date</label>
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
                  <label htmlFor="edit-asset_id" className="flex items-center justify-between text-sm font-medium text-gray-300 mb-1">
                    <span>Actif</span>
                    <button type="button" onClick={() => handleOpenManageItemsModal("asset")} className="text-xs text-purple-400 hover:text-purple-300 hover:underline flex items-center" disabled={isSubmittingForm}>
                      <PlusSquare size={14} className="mr-1"/> Gérer
                    </button>
                  </label>
                  {AssetSelect}
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
                  {SessionSelect}
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
                  {SetupSelect}
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

              {/* Durée */}
              <div>
                <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-300 mb-1">Durée</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    {...register("duration_minutes")}
                    id="duration_minutes"
                    className={`w-full p-2.5 bg-gray-700 border ${errors.duration_minutes ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`}
                    placeholder="Ex: 45"
                  />
                  <select
                    value={durationUnit}
                    onChange={e => setDurationUnit(e.target.value as 'minutes' | 'heures')}
                    className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-md focus:ring-purple-500 focus:border-purple-500 p-2.5"
                  >
                    <option value="minutes">minutes</option>
                    <option value="heures">heures</option>
                  </select>
                </div>
                {errors.duration_minutes && (
                  <p className="text-red-400 text-xs mt-1">{errors.duration_minutes.message as string}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={handleClose} 
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