"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddTradeModal } from "@/components/journal/add-trade-modal";
import { Journal, Asset, Session, Setup } from "@/lib/actions/journal.actions";
import { getAssets, getSessions, getSetups } from "@/lib/actions/journal.actions";
import { ArrowLeft } from "lucide-react";

interface JournalClientProps {
  journal: Journal;
}

export function JournalClient({ journal }: JournalClientProps) {
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [setups, setSetups] = useState<Setup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    const [assetsData, sessionsData, setupsData] = await Promise.all([
      getAssets(),
      getSessions(),
      getSetups(),
    ]);

    if (assetsData.assets) setAssets(assetsData.assets);
    if (sessionsData.sessions) setSessions(sessionsData.sessions);
    if (setupsData.setups) setSetups(setupsData.setups);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-gray-200 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </button>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">{journal.name}</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
          >
            Ajouter un trade
          </button>
        </div>

        {isAddModalOpen && (
          <AddTradeModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onDataNeedsRefresh={loadData}
            journalId={journal.id}
          />
        )}
      </div>
    </div>
  );
} 