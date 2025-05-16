"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getJournals, deleteJournal, createJournal } from "@/lib/actions/journal.actions";
import { PageLoading } from "@/components/ui/page-loading";
import { BookOpen, PlusCircle, ArrowRight, Pencil, Trash2, X, Loader2 } from "lucide-react";
import Dither from "@/components/ui/Dither/Dither";
import { toast } from "sonner";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  journalName: string;
  isDeleting: boolean;
}

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<void>;
}

function DeleteModal({ isOpen, onClose, onConfirm, journalName, isDeleting }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md border border-red-500/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-red-400">Supprimer le journal</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200" disabled={isDeleting}>
            <X size={24} />
          </button>
        </div>
        <p className="text-gray-300 mb-6">
          Êtes-vous sûr de vouloir supprimer le journal <span className="font-semibold text-purple-300">{journalName}</span> ? 
          Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDeleting}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Suppression...
              </>
            ) : (
              "Supprimer"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateModal({ isOpen, onClose, onCreate }: CreateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await onCreate(name, description);
      setName("");
      setDescription("");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md border border-purple-500/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-purple-400">Créer un nouveau journal</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200" disabled={isCreating}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Nom du journal
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ex: Journal de trading 2024"
              required
              disabled={isCreating}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="Décrivez l'objectif de ce journal..."
              disabled={isCreating}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isCreating}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function JournalsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [journals, setJournals] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [journalToDelete, setJournalToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const primaryAccentRGB: [number, number, number] = [0.494, 0.357, 0.937];

  useEffect(() => {
    const loadJournals = async () => {
      try {
        const result = await getJournals();
        if (result.error) {
          setError(result.error);
        } else {
          setJournals(result.journals);
        }
      } catch (err) {
        setError("Une erreur est survenue lors du chargement des journaux");
      } finally {
        setIsLoading(false);
      }
    };

    loadJournals();
  }, []);

  const handleJournalClick = (journalId: string) => {
    setIsNavigating(true);
    router.push(`/journal/${journalId}`);
  };

  const handleEditClick = (e: React.MouseEvent, journalId: string) => {
    e.stopPropagation();
    setIsEditing(true);
    router.push(`/journal/${journalId}/edit`);
  };

  const handleDeleteClick = (e: React.MouseEvent, journal: any) => {
    e.stopPropagation();
    setJournalToDelete(journal);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!journalToDelete) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteJournal(journalToDelete.id);
      if (success) {
        toast.success("Journal supprimé avec succès");
        setJournals(journals.filter(j => j.id !== journalToDelete.id));
      } else {
        toast.error("Erreur lors de la suppression du journal");
      }
    } catch (error) {
      toast.error("Une erreur inattendue est survenue");
      console.error("Delete journal error:", error);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setJournalToDelete(null);
    }
  };

  const handleCreateJournal = async (name: string, description: string) => {
    try {
      const result = await createJournal({ name, description });
      if (result.success) {
        toast.success("Journal créé avec succès");
        const updatedJournals = await getJournals();
        if (updatedJournals.journals) {
          setJournals(updatedJournals.journals);
        }
        setCreateModalOpen(false);
      } else {
        toast.error(result.error || "Une erreur est survenue lors de la création du journal");
      }
    } catch (error) {
      console.error("Create journal error:", error);
      toast.error("Une erreur inattendue est survenue");
    }
  };

  if (isLoading || isNavigating || isEditing) {
    return <PageLoading />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-red-900/30 text-red-300 p-4 rounded-md border border-red-700/50">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-900 text-white">
      <div className="absolute inset-0 z-0">
        <Dither
          waveColor={primaryAccentRGB}
          waveAmplitude={0.05}
          waveFrequency={0.5}
          pixelSize={1}
          colorNum={5}
          waveSpeed={0.1}
          enableMouseInteraction={true}
          mouseRadius={0.3}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-start p-8">
        <div className="w-full max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <BookOpen className="w-8 h-8 text-purple-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Mes Journaux de Trading
              </h1>
            </div>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-5 rounded-md transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <PlusCircle size={20} />
              Nouveau Journal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {journals.map((journal) => (
              <div
                key={journal.id}
                onClick={() => handleJournalClick(journal.id)}
                className="group bg-gray-800/70 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold text-purple-300 group-hover:text-purple-200 transition-colors">
                    {journal.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleEditClick(e, journal.id)}
                      className="p-1 text-gray-400 hover:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Modifier le journal"
                      disabled={isDeleting || isEditing}
                    >
                      {isEditing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Pencil size={16} />
                      )}
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, journal)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Supprimer le journal"
                      disabled={isDeleting || isEditing}
                    >
                      {isDeleting && journalToDelete?.id === journal.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                  {journal.description}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Performance</span>
                      <span className={`text-lg font-semibold ${journal.performance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {journal.performance >= 0 ? '+' : ''}{journal.performance}%
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Trades</span>
                      <span className="text-lg font-semibold text-purple-300">
                        {journal.trades_count}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Win Rate</span>
                      <span className="text-lg font-semibold text-blue-400">
                        {journal.win_rate}%
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Trades Gagnants</span>
                      <span className="text-lg font-semibold text-green-400">
                        {Math.round((journal.win_rate * journal.trades_count) / 100)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                    <BookOpen className="w-4 h-4" />
                    <span>Dernier trade: {new Date(journal.last_trade_date).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {journals.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Aucun journal trouvé</h3>
              <p className="text-gray-500">Commencez par créer votre premier journal de trading</p>
            </div>
          )}
        </div>
      </div>

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setJournalToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        journalName={journalToDelete?.name || ""}
        isDeleting={isDeleting}
      />

      <CreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateJournal}
      />
    </div>
  );
} 