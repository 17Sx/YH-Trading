import { DashboardOptimized } from "@/components/optimized/dashboard-optimized";
import { getTrades } from "@/lib/actions/journal.actions";
import type { Trade } from "@/lib/actions/journal.actions";
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { journalId?: string; journalIds?: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: journals, error: journalsError } = await supabase
    .from('journals')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (journalsError) {
    return (
      <div className="relative min-h-screen selection:bg-purple-500 selection:text-white">
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 text-gray-100">
          <div className="p-4 text-center text-red-400 bg-red-900/30 rounded-lg border border-red-700/50">
            Erreur lors de la récupération des journaux: {journalsError.message}
          </div>
        </div>
      </div>
    );
  }

  if (!journals || journals.length === 0) {
    return (
      <div className="relative min-h-screen selection:bg-purple-500 selection:text-white">
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 text-gray-100">
          <div className="p-4 text-center text-gray-400 bg-gray-800/70 rounded-lg border border-gray-700/50">
            Aucun journal trouvé. Veuillez créer un journal pour commencer.
          </div>
        </div>
      </div>
    );
  }

  let selectedJournalIds: string[] = [];
  if (searchParams.journalIds) {
    selectedJournalIds = searchParams.journalIds.split(',').filter(id => id.trim());
  } else if (searchParams.journalId) {
    selectedJournalIds = [searchParams.journalId];
  } else {
    selectedJournalIds = journals.map(j => j.id);
  }

  const selectedJournals = journals.filter(journal => selectedJournalIds.includes(journal.id));

  let trades: Trade[] = [];
  let tradesError: string | undefined;

  if (selectedJournalIds.length > 0) {
    const tradesPromises = selectedJournalIds.map(journalId => getTrades(journalId));
    const tradesResults = await Promise.all(tradesPromises);
    
    trades = tradesResults.flatMap(result => result.trades);
    tradesError = tradesResults.find(result => result.error)?.error;
  }

  if (tradesError) {
    return (
      <div className="relative min-h-screen selection:bg-purple-500 selection:text-white">
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 text-gray-100">
          <div className="p-4 text-center text-red-400 bg-red-900/30 rounded-lg border border-red-700/50">
            Erreur lors de la récupération des trades: {tradesError}
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardOptimized
      trades={trades}
      selectedJournals={selectedJournals}
      onJournalSelectionChange={(journalIds: string[]) => {
        
      }}
    />
  );
} 