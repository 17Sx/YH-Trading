"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Check, ChevronDown, X } from "lucide-react";

interface Journal {
  id: string;
  name: string;
}

interface MultiJournalSelectorProps {
  journals: Journal[];
  selectedJournalIds: string[];
  onJournalsChange?: (ids: string[]) => void;
}

export function MultiJournalSelector({ 
  journals, 
  selectedJournalIds, 
  onJournalsChange 
}: MultiJournalSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleJournalToggle = (journalId: string) => {
    const newSelectedIds = selectedJournalIds.includes(journalId)
      ? selectedJournalIds.filter(id => id !== journalId)
      : [...selectedJournalIds, journalId];
    
    updateUrl(newSelectedIds);
    onJournalsChange?.(newSelectedIds);
  };

  const handleSelectAll = () => {
    const allIds = journals.map(j => j.id);
    updateUrl(allIds);
    onJournalsChange?.(allIds);
  };

  const handleClearAll = () => {
    updateUrl([]);
    onJournalsChange?.([]);
  };

  const updateUrl = (journalIds: string[]) => {
    const params = new URLSearchParams();
    if (journalIds.length > 0) {
      params.set("journalIds", journalIds.join(","));
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const getDisplayText = () => {
    if (selectedJournalIds.length === 0) {
      return "Aucun journal sélectionné";
    }
    if (selectedJournalIds.length === journals.length) {
      return "Tous les journaux";
    }
    if (selectedJournalIds.length === 1) {
      const journal = journals.find(j => j.id === selectedJournalIds[0]);
      return journal?.name || "1 journal";
    }
    return `${selectedJournalIds.length} journaux sélectionnés`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-[250px] px-3 py-2 bg-gray-800/70 border border-gray-700/50 rounded-md text-gray-200 text-left flex items-center justify-between hover:bg-gray-700/70 transition-colors"
      >
        <span className="truncate">{getDisplayText()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* Actions rapides */}
          <div className="p-2 border-b border-gray-700 flex gap-2">
            <button
              onClick={handleSelectAll}
              className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded"
            >
              Tout sélectionner
            </button>
            <button
              onClick={handleClearAll}
              className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded"
            >
              Tout désélectionner
            </button>
          </div>

          {/* Liste des journaux */}
          <div className="p-1">
            {journals.map((journal) => {
              const isSelected = selectedJournalIds.includes(journal.id);
              return (
                <div
                  key={journal.id}
                  onClick={() => handleJournalToggle(journal.id)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-700 cursor-pointer rounded"
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    isSelected 
                      ? 'bg-purple-600 border-purple-600' 
                      : 'border-gray-500'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-gray-200 text-sm">{journal.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overlay pour fermer le dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 