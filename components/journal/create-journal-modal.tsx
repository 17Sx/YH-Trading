"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createJournal } from "@/lib/actions/journal.actions";

const CreateJournalSchema = z.object({
  name: z.string().min(1, "Le nom est requis.").max(100, "Le nom ne peut pas dépasser 100 caractères."),
  description: z.string().max(500, "La description ne peut pas dépasser 500 caractères.").optional(),
});

type CreateJournalInput = z.infer<typeof CreateJournalSchema>;

interface CreateJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateJournalModal({ isOpen, onClose }: CreateJournalModalProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateJournalInput>({
    resolver: zodResolver(CreateJournalSchema),
  });

  const onSubmit = async (data: CreateJournalInput) => {
    try {
      const journal = await createJournal(data);
      toast.success("Journal créé avec succès !");
      reset();
      onClose();
      router.push(`/journal/${journal.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue lors de la création du journal.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md relative border border-purple-500/50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Fermer la modale"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-semibold text-purple-300 mb-6">
          Créer un nouveau Journal
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Nom du Journal
            </label>
            <input
              type="text"
              {...register("name")}
              id="name"
              className={`w-full p-2.5 bg-gray-700 border ${
                errors.name ? "border-red-500" : "border-gray-600"
              } rounded-md focus:ring-purple-500 focus:border-purple-500`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Description (Optionnel)
            </label>
            <textarea
              {...register("description")}
              id="description"
              rows={3}
              className={`w-full p-2.5 bg-gray-700 border ${
                errors.description ? "border-red-500" : "border-gray-600"
              } rounded-md focus:ring-purple-500 focus:border-purple-500`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Création..." : "Créer le Journal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 