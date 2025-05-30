import { useMemo, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import type { Trade } from '@/lib/actions/journal.actions';

interface FilterOptions {
  searchTerm: string;
  selectedYear: number;
  selectedMonth: number;
  viewMode: 'month' | 'year' | 'all';
}

interface OptimizedStats {
  performanceDisplay: string;
  winRate: string;
  numTrades: number;
  numTP: number;
  numSL: number;
  numBE: number;
}

export function useOptimizedTradeFilters(trades: Trade[], filters: FilterOptions) {
  const { searchTerm, selectedYear, selectedMonth, viewMode } = filters;
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredTrades = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    const lowerSearchTerm = debouncedSearchTerm.toLowerCase().trim();
    
    return trades.filter(trade => {
      if (viewMode !== 'all') {
        const tradeDate = new Date(trade.trade_date);
        const isYearMatch = tradeDate.getFullYear() === selectedYear;
        
        if (viewMode === 'year' && !isYearMatch) return false;
        if (viewMode === 'month' && (!isYearMatch || tradeDate.getMonth() !== selectedMonth)) return false;
      }

      if (!lowerSearchTerm) return true;

      return (
        (trade.asset_name && trade.asset_name.toLowerCase().includes(lowerSearchTerm)) ||
        (trade.session_name && trade.session_name.toLowerCase().includes(lowerSearchTerm)) ||
        (trade.setup_name && trade.setup_name.toLowerCase().includes(lowerSearchTerm)) ||
        (trade.notes && trade.notes.toLowerCase().includes(lowerSearchTerm)) ||
        (trade.risk_input && String(trade.risk_input).toLowerCase().includes(lowerSearchTerm))
      );
    });
  }, [trades, debouncedSearchTerm, selectedYear, selectedMonth, viewMode]);

  const optimizedStats = useMemo((): OptimizedStats => {
    const numTrades = filteredTrades.length;
    
    if (numTrades === 0) {
      return {
        performanceDisplay: "N/A",
        winRate: "N/A",
        numTrades: 0,
        numTP: 0,
        numSL: 0,
        numBE: 0,
      };
    }

    let numTP = 0;
    let numSL = 0;
    let numBE = 0;
    let totalPerformance = 0;

    for (const trade of filteredTrades) {
      const pnl = trade.profit_loss_amount;
      totalPerformance += pnl;
      
      if (pnl > 0) numTP++;
      else if (pnl < 0) numSL++;
      else numBE++;
    }

    const totalTradedTrades = numTP + numSL;    
    const winRate = totalTradedTrades > 0 ? (numTP / totalTradedTrades) * 100 : 0;

    return {
      performanceDisplay: `${totalPerformance.toFixed(2)}%`,
      winRate: totalTradedTrades > 0 ? `${winRate.toFixed(2)}%` : "N/A",
      numTrades,
      numTP,
      numSL,
      numBE,
    };
  }, [filteredTrades]);

  const sortTrades = useCallback((trades: Trade[], sortBy: 'date' | 'performance' | 'asset', order: 'asc' | 'desc' = 'desc') => {
    return [...trades].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime();
          break;
        case 'performance':
          comparison = a.profit_loss_amount - b.profit_loss_amount;
          break;
        case 'asset':
          comparison = (a.asset_name || '').localeCompare(b.asset_name || '');
          break;
      }
      
      return order === 'desc' ? -comparison : comparison;
    });
  }, []);

  const getPaginatedTrades = useCallback((page: number, itemsPerPage: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTrades.slice(startIndex, endIndex);
  }, [filteredTrades]);

  const getTradesByPeriod = useCallback(() => {
    const grouped = new Map<string, Trade[]>();
    
    filteredTrades.forEach(trade => {
      const date = new Date(trade.trade_date);
      const key = viewMode === 'month' 
        ? `${date.getFullYear()}-${date.getMonth()}`
        : `${date.getFullYear()}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(trade);
    });
    
    return grouped;
  }, [filteredTrades, viewMode]);

  return {
    filteredTrades,
    optimizedStats,
    sortTrades,
    getPaginatedTrades,
    getTradesByPeriod,
    totalCount: filteredTrades.length,
    isFiltering: debouncedSearchTerm !== searchTerm
  };
} 