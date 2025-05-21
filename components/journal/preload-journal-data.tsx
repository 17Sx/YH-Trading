"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { preloadJournalData } from '@/lib/hooks/useJournalData';
import { LoadingIndicator } from '@/components/ui/loading-indicator';

interface PreloadJournalDataProps {
  journalId: string;
}

export function PreloadJournalData({ journalId }: PreloadJournalDataProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPreloading, setIsPreloading] = useState(false);

  useEffect(() => {
    // Précharge des données au montage du composant
    setIsPreloading(true);
    preloadJournalData(journalId).finally(() => {
      setIsPreloading(false);
    });

    // Précharge des données lors de la navigation
    const handleRouteChange = () => {
      setIsPreloading(true);
      preloadJournalData(journalId).finally(() => {
        setIsPreloading(false);
      });
    };

    // Écoute des événements de navigation
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [journalId, pathname]);

  return <LoadingIndicator isLoading={isPreloading} />;
} 