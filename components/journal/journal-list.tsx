"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { CreateJournalModal } from "./create-journal-modal";

interface Journal {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface JournalListProps {
  journals: Journal[];
}

export function JournalList({ journals }: JournalListProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Mes Journaux de Trading</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          <Plus size={20} />
          Nouveau Journal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {journals.map((journal) => (
          <div
            key={journal.id}
            onClick={() => router.push(`/journal/${journal.id}`)}
            className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-purple-500 cursor-pointer transition-colors"
          >
            <h2 className="text-xl font-semibold text-white mb-2">{journal.name}</h2>
            <p className="text-gray-400 mb-4">{journal.description}</p>
            <p className="text-sm text-gray-500">
              Créé le {new Date(journal.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      <CreateJournalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
} 