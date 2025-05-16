"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddTradeModal } from "@/components/journal/add-trade-modal";
import { Journal } from "@/lib/actions/journal.actions";
import { getAssets, getSessions, getSetups } from "@/lib/actions/journal.actions";
import { ArrowLeft } from "lucide-react";

interface JournalClientProps {
  journal: Journal;
}

export function JournalClient({ journal }: JournalClientProps) {
  const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);
  const [assets, setAssets] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [setups, setSetups] = useState([]);
  const router = useRouter();

  const loadData = async () => {
    const [assetsData, sessionsData, setupsData] = await Promise.all([
      getAssets(),
      getSessions(),
      getSetups(),
    ]);

    setAssets(assetsData.assets || []);
    setSessions(sessionsData.sessions || []);
    setSetups(setupsData.setups || []);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push("/journal")}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{journal.name}</h1>
          {journal.description && (
            <p className="text-gray-400 mt-1">{journal.description}</p>
          )}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Trades</h2>
          <button
            onClick={() => setIsAddTradeModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Ajouter un Trade
          </button>
        </div>

        {/* Liste des trades à implémenter */}
        <div className="text-gray-400 text-center py-8">
          Aucun trade pour le moment
        </div>
      </div>

      <AddTradeModal
        isOpen={isAddTradeModalOpen}
        onClose={() => setIsAddTradeModalOpen(false)}
        assets={assets}
        sessions={sessions}
        setups={setups}
        onDataNeedsRefresh={loadData}
      />
    </div>
  );
} 