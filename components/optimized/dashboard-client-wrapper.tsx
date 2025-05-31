"use client";

import { useRouter } from 'next/navigation';
import { DashboardOptimized } from './dashboard-optimized';
import type { Trade } from "@/lib/actions/journal.actions";

interface DashboardClientWrapperProps {
  trades: Trade[];
  selectedJournals: Array<{ id: string; name: string }>;
  allJournals: Array<{ id: string; name: string }>;
}

export function DashboardClientWrapper({ 
  trades, 
  selectedJournals, 
  allJournals 
}: DashboardClientWrapperProps) {
  const router = useRouter();

  const handleJournalSelectionChange = (journalIds: string[]) => {
    const params = new URLSearchParams();
    if (journalIds.length > 0) {
      params.set("journalIds", journalIds.join(","));
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <DashboardOptimized
      trades={trades}
      selectedJournals={selectedJournals}
      allJournals={allJournals}
      onJournalSelectionChange={handleJournalSelectionChange}
    />
  );
} 