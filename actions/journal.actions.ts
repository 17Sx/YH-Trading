import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { EditJournalInput } from '@/schemas/journal.schema';

export async function updateJournal(journalId: string, data: EditJournalInput) {
  const supabase = createSupabaseBrowserClient();
  const { data: journal, error } = await supabase
    .from('journals')
    .update({
      name: data.name,
      description: data.description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', journalId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return journal;
}

export interface Journal {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
} 