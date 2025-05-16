import { redirect } from "next/navigation";
import { getJournalById } from "@/lib/actions/journal.actions";
import { JournalClient } from "@/app/journal/journal-client";
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface JournalPageProps {
  params: {
    journalId: string;
  };
}

export default async function JournalPage({ params }: JournalPageProps) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  const journal = await getJournalById(params.journalId);
  if (!journal) {
    redirect("/journal");
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <JournalClient journal={journal} />
    </div>
  );
} 