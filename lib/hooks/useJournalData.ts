import useSWR, { mutate } from 'swr';
import { Asset, Session, Setup, Trade } from '@/lib/actions/journal.actions';
import { useEffect } from 'react';

interface JournalData {
  assets: Asset[];
  sessions: Session[];
  setups: Setup[];
  trades: Trade[];
  isLoading: boolean;
  error: Error | null;
  refreshAll: () => Promise<void>;
  optimisticUpdateTrades: (newTrade: Trade) => void;
  preloadData: () => Promise<void>;
}

interface JournalError extends Error {
  status?: number;
  info?: any;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('Une erreur est survenue lors du chargement des données') as JournalError;
    error.status = res.status;
    error.info = await res.json();
    throw error;
  }
  return res.json();
};

// Configuration SWR optimisée
const swrOptions = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 5000,
  shouldRetryOnError: (error: JournalError) => {
    // Ne pas réessayer sur les erreurs 404
    return error.status !== 404;
  },
  onError: (error: JournalError) => {
    console.error('Erreur SWR:', error);
  }
};

// Cache global pour la précharge
const preloadCache = new Map<string, Promise<any>>();
const preloadTimeouts = new Map<string, NodeJS.Timeout>();

// Fonction de précharge des données avec debounce
export const preloadJournalData = async (journalId: string) => {
  const endpoints = [
    `/api/journals/${journalId}/assets`,
    `/api/journals/${journalId}/sessions`,
    `/api/journals/${journalId}/setups`,
    `/api/journals/${journalId}/trades`
  ];

  // Annuler les préchargements en cours pour ce journal
  endpoints.forEach(endpoint => {
    const timeout = preloadTimeouts.get(endpoint);
    if (timeout) {
      clearTimeout(timeout);
      preloadTimeouts.delete(endpoint);
    }
  });

  // Débounce de 100ms pour éviter les requêtes multiples
  const debouncedPreload = new Promise<void>((resolve) => {
    const timeout = setTimeout(async () => {
      const preloadPromises = endpoints.map(endpoint => {
        if (!preloadCache.has(endpoint)) {
          const promise = fetcher(endpoint).then(data => {
            // Mise à jour du cache SWR
            mutate(endpoint, data, false);
            return data;
          });
          preloadCache.set(endpoint, promise);
        }
        return preloadCache.get(endpoint);
      });

      await Promise.all(preloadPromises);
      resolve();
    }, 100);

    endpoints.forEach(endpoint => {
      preloadTimeouts.set(endpoint, timeout);
    });
  });

  return debouncedPreload;
};

// Fonction pour nettoyer le cache
const clearPreloadCache = (journalId: string) => {
  const endpoints = [
    `/api/journals/${journalId}/assets`,
    `/api/journals/${journalId}/sessions`,
    `/api/journals/${journalId}/setups`,
    `/api/journals/${journalId}/trades`
  ];

  endpoints.forEach(endpoint => {
    preloadCache.delete(endpoint);
    const timeout = preloadTimeouts.get(endpoint);
    if (timeout) {
      clearTimeout(timeout);
      preloadTimeouts.delete(endpoint);
    }
  });
};

export function useJournalData(journalId: string, isEnabled: boolean = true): JournalData {
  // Configuration des clés de cache
  const assetsKey = isEnabled ? `/api/journals/${journalId}/assets` : null;
  const sessionsKey = isEnabled ? `/api/journals/${journalId}/sessions` : null;
  const setupsKey = isEnabled ? `/api/journals/${journalId}/setups` : null;
  const tradesKey = isEnabled ? `/api/journals/${journalId}/trades` : null;

  // Utilisation de SWR pour chaque type de données
  const { data: assetsData, error: assetsError, mutate: mutateAssets } = useSWR(
    assetsKey,
    fetcher,
    swrOptions
  );

  const { data: sessionsData, error: sessionsError, mutate: mutateSessions } = useSWR(
    sessionsKey,
    fetcher,
    swrOptions
  );

  const { data: setupsData, error: setupsError, mutate: mutateSetups } = useSWR(
    setupsKey,
    fetcher,
    swrOptions
  );

  const { data: tradesData, error: tradesError, mutate: mutateTrades } = useSWR(
    tradesKey,
    fetcher,
    swrOptions
  );

  // Précharge des données
  const preloadData = async () => {
    if (isEnabled) {
      try {
        await preloadJournalData(journalId);
      } catch (error) {
        console.error('Erreur lors de la précharge des données:', error);
      }
    }
  };

  // Mise à jour optimiste des trades
  const optimisticUpdateTrades = (newTrade: Trade) => {
    mutateTrades(
      (currentData: any) => {
        if (!currentData) return { trades: [newTrade] };
        return {
          trades: [newTrade, ...currentData.trades]
        };
      },
      { revalidate: false }
    );
  };

  // Rafraîchissement de toutes les données
  const refreshAll = async () => {
    await Promise.all([
      mutateAssets(),
      mutateSessions(),
      mutateSetups(),
      mutateTrades()
    ]);
  };

  // Détermination de l'état de chargement
  const isLoading = isEnabled && (
    (!assetsData && !assetsError) ||
    (!sessionsData && !sessionsError) ||
    (!setupsData && !setupsError) ||
    (!tradesData && !tradesError)
  );

  // Gestion des erreurs
  const error = assetsError || sessionsError || setupsError || tradesError;

  // Nettoyage du cache lors du démontage
  useEffect(() => {
    return () => {
      clearPreloadCache(journalId);
    };
  }, [journalId]);

  // Retour des données avec des valeurs par défaut
  return {
    assets: assetsData?.assets || [],
    sessions: sessionsData?.sessions || [],
    setups: setupsData?.setups || [],
    trades: tradesData?.trades || [],
    isLoading,
    error,
    refreshAll,
    optimisticUpdateTrades,
    preloadData
  };
} 