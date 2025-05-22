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
    console.error('Error fetching data:', { url, status: res.status });
    const error = new Error('Une erreur est survenue lors du chargement des données') as JournalError;
    error.status = res.status;
    error.info = await res.json();
    throw error;
  }
  const data = await res.json();
  return data;
};

const swrOptions = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 5000,
  shouldRetryOnError: (error: JournalError) => {
    return error.status !== 404;
  },
  onError: (error: JournalError) => {
    console.error('Erreur SWR:', error);
  }
};

const preloadCache = new Map<string, Promise<any>>();
const preloadTimeouts = new Map<string, NodeJS.Timeout>();

export const preloadJournalData = async (journalId: string) => {
  const endpoints = [
    `/api/journals/${journalId}/assets`,
    `/api/journals/${journalId}/sessions`,
    `/api/journals/${journalId}/setups`,
    `/api/journals/${journalId}/trades`
  ];

  endpoints.forEach(endpoint => {
    const timeout = preloadTimeouts.get(endpoint);
    if (timeout) {
      clearTimeout(timeout);
      preloadTimeouts.delete(endpoint);
    }
  });

  const debouncedPreload = new Promise<void>((resolve) => {
    const timeout = setTimeout(async () => {
      const preloadPromises = endpoints.map(endpoint => {
        if (!preloadCache.has(endpoint)) {
          const promise = fetcher(endpoint).then(data => {
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

  const assetsKey = isEnabled ? `/api/journals/${journalId}/assets` : null;
  const sessionsKey = isEnabled ? `/api/journals/${journalId}/sessions` : null;
  const setupsKey = isEnabled ? `/api/journals/${journalId}/setups` : null;
  const tradesKey = isEnabled ? `/api/journals/${journalId}/trades` : null;


  const { data: assetsData, error: assetsError, mutate: mutateAssets } = useSWR(
    assetsKey,
    fetcher,
    { ...swrOptions, revalidateOnMount: true }
  );

  const { data: sessionsData, error: sessionsError, mutate: mutateSessions } = useSWR(
    sessionsKey,
    fetcher,
    { ...swrOptions, revalidateOnMount: true }
  );

  const { data: setupsData, error: setupsError, mutate: mutateSetups } = useSWR(
    setupsKey,
    fetcher,
    { ...swrOptions, revalidateOnMount: true }
  );

  const { data: tradesData, error: tradesError, mutate: mutateTrades } = useSWR(
    tradesKey,
    fetcher,
    { ...swrOptions, revalidateOnMount: true }
  );



  useEffect(() => {
    if (isEnabled) {
      preloadData();
    }
  }, [isEnabled, journalId]);


  const preloadData = async () => {
    if (isEnabled) {
      try {
        await preloadJournalData(journalId);
      } catch (error) {
        console.error('Erreur lors de la précharge des données:', error);
      }
    }
  };


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

  const refreshAll = async () => {
    await Promise.all([
      mutateAssets(),
      mutateSessions(),
      mutateSetups(),
      mutateTrades()
    ]);
  };

  const isLoading = isEnabled && (
    (!assetsData && !assetsError) ||
    (!sessionsData && !sessionsError) ||
    (!setupsData && !setupsError) ||
    (!tradesData && !tradesError)
  );

  const error = assetsError || sessionsError || setupsError || tradesError;

  useEffect(() => {
    return () => {
      clearPreloadCache(journalId);
    };
  }, [journalId]);

  return {
    assets: assetsData?.assets?.assets || [],
    sessions: sessionsData?.sessions?.sessions || [],
    setups: setupsData?.setups?.setups || [],
    trades: tradesData?.trades?.trades || [],
    isLoading,
    error,
    refreshAll,
    optimisticUpdateTrades,
    preloadData
  };
} 