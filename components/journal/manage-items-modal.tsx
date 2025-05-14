"use client";

import { useState, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AddListItemSchema, type AddListItemInput } from '@/schemas/journal.schema';
import { X, Trash2, PlusCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Asset, Session, Setup } from "@/lib/actions/journal.actions";

type ItemType = "asset" | "session" | "setup";
type Item = { id: string; name: string; } & (Asset | Session | Setup);


interface ManageItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemTypeLabel: string; 
  items: Item[];
  addItemAction: (name: string) => Promise<{ data?: { id: string; name: string }; error?: string; issues?: any[] }>;
  deleteItemAction: (id: string) => Promise<{ success?: boolean; error?: string }>;
  onListChanged: (newItemId?: string) => Promise<void>; 
}

export function ManageItemsModal({
  isOpen,
  onClose,
  itemTypeLabel,
  items = [], 
  addItemAction,
  deleteItemAction,
  onListChanged,
}: ManageItemsModalProps) {
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null); 

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
    reset,
  } = useForm<AddListItemInput>({
    resolver: zodResolver(AddListItemSchema),
  });

  const handleAddNewItem: SubmitHandler<AddListItemInput> = async (data) => {
    setIsSubmittingNew(true);
    try {
      const result = await addItemAction(data.name);
      if (result.data) {
        toast.success(`${itemTypeLabel} "${result.data.name}" ajouté avec succès !`);
        reset();
        await onListChanged(result.data.id); 
      } else {
        toast.error(result.error || `Erreur lors de l'ajout de ${itemTypeLabel.toLowerCase()}.`);
      }
    } catch (error) {
      toast.error(`Une erreur inattendue est survenue lors de l'ajout.`);
      console.error(error);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {

    setItemToDelete(itemId);
    try {
      const result = await deleteItemAction(itemId);
      if (result.success) {
        toast.success(`${itemTypeLabel} "${itemName}" supprimé avec succès !`);
        await onListChanged(); 
      } else {
        toast.error(result.error || `Erreur lors de la suppression de ${itemTypeLabel.toLowerCase()}.`);
      }
    } catch (error) {
      toast.error(`Une erreur inattendue est survenue lors de la suppression.`);
      console.error(error);
    } finally {
      setItemToDelete(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 pointer-events-auto">
      <div className="bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-lg relative border border-purple-500/60 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold text-purple-300">
            Gérer les {itemTypeLabel}s
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors"
            aria-label={`Fermer la modale de gestion`}
          >
            <X size={22} />
          </button>
        </div>

        {/* Section d'ajout */}
        <form onSubmit={handleSubmit(handleAddNewItem)} className="mb-6 pb-6 border-b border-gray-700">
          <label htmlFor="newItemName" className="block text-sm font-medium text-gray-300 mb-1">
            Ajouter un nouveau {itemTypeLabel.toLowerCase()}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              {...register("name")}
              id="newItemName"
              placeholder={`Nom du ${itemTypeLabel.toLowerCase()}`}
              className={`flex-grow p-2.5 bg-gray-700 border ${formErrors.name ? 'border-red-500' : 'border-gray-600'} rounded-md focus:ring-purple-500 focus:border-purple-500`}
            />
            <button
              type="submit"
              disabled={isSubmittingNew}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold p-2.5 rounded-md transition-colors duration-150 focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-70 flex items-center justify-center"
              aria-label={`Ajouter ${itemTypeLabel.toLowerCase()}`}
            >
              {isSubmittingNew ? <Loader2 size={20} className="animate-spin" /> : <PlusCircle size={20} />}
            </button>
          </div>
          {formErrors.name && <p className="mt-1 text-sm text-red-400">{formErrors.name.message}</p>}
        </form>

        {/* Liste des items existants */}
        <div className="flex-grow overflow-y-auto pr-2 space-y-2">
          {items.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Aucun {itemTypeLabel.toLowerCase()} existant.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-gray-700/50 p-3 rounded-md hover:bg-gray-700 transition-colors">
                <span className="text-gray-200">{item.name}</span>
                <button
                  onClick={() => handleDeleteItem(item.id, item.name)}
                  disabled={itemToDelete === item.id}
                  className="text-red-500 hover:text-red-400 disabled:text-gray-500 p-1 rounded-md hover:bg-red-500/10 transition-colors"
                  aria-label={`Supprimer ${item.name}`}
                >
                  {itemToDelete === item.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-5 text-sm font-medium text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
            >
              Fermer
            </button>
        </div>
      </div>
    </div>
  );
} 