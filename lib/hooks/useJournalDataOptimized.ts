import useSWR, { mutate } from 'swr';
import { Asset, Session, Setup, Trade } from '@/lib/actions/journal.actions';
import { useCallback, useMemo } from 'react';

interface JournalData {
  assets: Asset[];
  sessions: Session[];
  setups: Setup[];
  trades: Trade[];
  isLoading: boolean;
  error: Error | null;
  refreshAll: () => Promise<void>;
  optimisticUpdateTrades: (newTrade: Trade) => void;
}

interface JournalError extends Error {
  status?: number;
  info?: any;
}


const fetchAllJournalData = async (journalId: string) => {
  const [assetsRes, sessionsRes, setupsRes, tradesRes] = await Promise.all([
    fetch(`/api/journals/${journalId}/assets`),
    fetch(`/api/journals/${journalId}/sessions`),
    fetch(`/api/journals/${journalId}/setups`),
    fetch(`/api/journals/${journalId}/trades`)
  ]);

  if (!assetsRes.ok || !sessionsRes.ok || !setupsRes.ok || !tradesRes.ok) {
    throw new Error('Erreur lors du chargement des données');
  }

  const [assets, sessions, setups, trades] = await Promise.all([
    assetsRes.json(),
    sessionsRes.json(),
    setupsRes.json(),
    tradesRes.json()
  ]);

  return {
    assets: assets.assets?.assets || [],
    sessions: sessions.sessions?.sessions || [],
    setups: setups.setups?.setups || [],
    trades: trades.trades?.trades || []
  };
};


const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 10000, // 10 secondes (plus long que l'original)
  refreshInterval: 60000, // Auto-refresh toutes les minutes
  errorRetryCount: 2,
  errorRetryInterval: 5000,
  shouldRetryOnError: (error: JournalError) => error.status !== 404,
  onError: (error: JournalError) => {
    console.error('Erreur SWR Journal Data:', error);
  }
};

export function useJournalDataOptimized(journalId: string, isEnabled: boolean = true): JournalData {
  
  const swrKey = isEnabled ? `journal-data-${journalId}` : null;
  
  const { 
    data, 
    error, 
    mutate: mutateAll,
    isLoading: swrLoading
  } = useSWR(
    swrKey,
    () => fetchAllJournalData(journalId),
    swrConfig
  );

  const memoizedData = useMemo(() => {
    if (!data) {
      return {
        assets: [],
        sessions: [],
        setups: [],
        trades: []
      };
    }
    return data;
  }, [data]);

  const optimisticUpdateTrades = useCallback((newTrade: Trade) => {
    mutateAll(
      (currentData) => {
        if (!currentData) return { ...memoizedData, trades: [newTrade] };
        return {
          ...currentData,
          trades: [newTrade, ...currentData.trades]
        };
      },
      { revalidate: false }
    );
  }, [mutateAll, memoizedData]);

  const refreshAll = useCallback(async () => {
    await mutateAll();
  }, [mutateAll]);

  const isLoading = isEnabled && swrLoading && !data && !error;

  return {
    ...memoizedData,
    isLoading,
    error,
    refreshAll,
    optimisticUpdateTrades
  };
}


const referenceDataFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
};

export function useReferenceData(journalId: string, type: 'assets' | 'sessions' | 'setups') {
  const { data, error, mutate } = useSWR(
    `/api/journals/${journalId}/${type}`,
    referenceDataFetcher,
    {
      ...swrConfig,
      refreshInterval: 5 * 60 * 1000, // 5 minutes pour les données de référence
      dedupingInterval: 30000, // 30 secondes
    }
  );

  return {
    data: data?.[type]?.[type] || [],
    error,
    mutate,
    isLoading: !data && !error
  };
}

export function useTradesPaginated(
  journalId: string, 
  page: number = 1, 
  limit: number = 50,
  filters?: { dateFrom?: string; dateTo?: string }
) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters?.dateFrom && { dateFrom: filters.dateFrom }),
    ...(filters?.dateTo && { dateTo: filters.dateTo }),
  });

  const { data, error, mutate } = useSWR(
    `/api/journals/${journalId}/trades?${queryParams}`,
    referenceDataFetcher,
    swrConfig
  );

  return {
    trades: data?.trades || [],
    total: data?.total || 0,
    error,
    mutate,
    isLoading: !data && !error,
    hasMore: (data?.total || 0) > page * limit
  };
} 