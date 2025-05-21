"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { CreateJournalModal } from "./create-journal-modal";
import { JournalLink } from './journal-link';

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

      <div className="space-y-2">
        {journals.map((journal) => (
          <JournalLink
            key={journal.id}
            href={`/journal/${journal.id}`}
            journalId={journal.id}
            className="block p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <h3 className="text-lg font-medium text-gray-200">{journal.name}</h3>
            <p className="text-gray-400 mb-4">{journal.description}</p>
            <p className="text-sm text-gray-500">
              Créé le {new Date(journal.created_at).toLocaleDateString()}
            </p>
          </JournalLink>
        ))}
      </div>

      <CreateJournalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
} 