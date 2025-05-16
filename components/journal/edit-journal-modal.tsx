"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EditJournalSchema, type EditJournalInput } from '@/schemas/journal.schema';
import { updateJournal } from '@/actions/journal.actions';
import type { Journal } from '@/actions/journal.actions';

interface EditJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  journal: Journal;
  onJournalUpdated: (journal: Journal) => void;
}

export function EditJournalModal({ isOpen, onClose, journal, onJournalUpdated }: EditJournalModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EditJournalInput>({
    resolver: zodResolver(EditJournalSchema),
    defaultValues: {
      name: journal.name,
      description: journal.description || '',
    },
  });

  const onSubmit = async (data: EditJournalInput) => {
    try {
      setIsLoading(true);
      const updatedJournal = await updateJournal(journal.id, data);
      onJournalUpdated(updatedJournal);
      toast.success('Journal mis à jour avec succès');
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du journal');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-xl font-semibold mb-4">Modifier le journal</h2>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nom
            </label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Nom du journal"
              disabled={isLoading}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Description du journal"
              disabled={isLoading}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 