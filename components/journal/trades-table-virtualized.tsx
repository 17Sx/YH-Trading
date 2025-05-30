"use client";

import { memo, useMemo, useCallback, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import type { Trade } from "@/lib/actions/journal.actions";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

interface TradesTableVirtualizedProps {
  trades: Trade[];
  onRowClick: (trade: Trade) => void;
  onEdit?: (trade: Trade) => void;
  onDelete?: (trade: Trade) => void;
  selectedTradeIds?: Set<string>;
  onToggleSelection?: (tradeId: string) => void;
  itemsPerPage?: number;
}

interface TradeRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    trades: Trade[];
    onRowClick: (trade: Trade) => void;
    onEdit?: (trade: Trade) => void;
    onDelete?: (trade: Trade) => void;
    selectedTradeIds: Set<string>;
    onToggleSelection?: (tradeId: string) => void;
  };
}

const TradeRow = memo(({ index, style, data }: TradeRowProps) => {
  const { trades, onRowClick, onEdit, onDelete, selectedTradeIds, onToggleSelection } = data;
  const trade = trades[index];

  if (!trade) return null;

  const gridCols = onToggleSelection 
    ? "grid-cols-[48px_96px_80px_80px_96px_64px_96px_1fr_80px_80px]" 
    : "grid-cols-[96px_80px_80px_96px_64px_96px_1fr_80px_80px]";

  return (
    <div 
      style={style} 
      className={`grid ${gridCols} gap-2 items-center hover:bg-gray-700/40 transition-colors cursor-pointer border-b border-gray-700/30 px-4 py-2`}
      onClick={() => onRowClick(trade)}
    >
      {/* Checkbox */}
      {onToggleSelection && (
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={selectedTradeIds.has(trade.id)}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelection(trade.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
          />
        </div>
      )}
      
      {/* Date */}
      <div className="text-sm text-gray-200 truncate">
        {format(new Date(trade.trade_date), 'dd MMM', { locale: fr })}
      </div>
      
      {/* Asset */}
      <div className="text-sm text-gray-200 truncate">
        {trade.asset_name || '-'}
      </div>
      
      {/* Session */}
      <div className="text-sm text-gray-200 truncate">
        {trade.session_name || '-'}
      </div>
      
      {/* Setup */}
      <div className="text-sm text-gray-200 truncate">
        {trade.setup_name || '-'}
      </div>
      
      {/* Risk */}
      <div className="text-sm text-gray-200 text-center">
        {trade.risk_input}
      </div>
      
      {/* Performance */}
      <div className={`text-sm text-right font-semibold ${
        trade.profit_loss_amount > 0 
          ? 'text-green-400' 
          : trade.profit_loss_amount < 0 
          ? 'text-red-400' 
          : 'text-blue-400'
      }`}>
        {trade.profit_loss_amount.toFixed(2)}%
      </div>
      
      {/* Notes */}
      <div className="text-sm text-gray-300 truncate min-w-0" title={trade.notes || undefined}>
        {trade.notes || '-'}
      </div>
      
      {/* TradingView */}
      <div className="text-sm text-center">
        {trade.tradingview_link ? (
          <a 
            href={trade.tradingview_link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-purple-400 hover:text-purple-300 hover:underline" 
            onClick={(e) => e.stopPropagation()}
          >
            Graph
          </a>
        ) : '-'}
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-center gap-2">
        <button
          className="text-purple-400 hover:text-purple-200 p-1"
          title="Éditer"
          onClick={(e) => { e.stopPropagation(); onEdit && onEdit(trade); }}
          aria-label="Éditer"
        >
          <Pencil size={14} />
        </button>
        <button
          className="text-red-500 hover:text-red-400 p-1"
          title="Supprimer"
          onClick={(e) => { e.stopPropagation(); onDelete && onDelete(trade); }}
          aria-label="Supprimer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
});

TradeRow.displayName = 'TradeRow';

export const TradesTableVirtualized = memo(({ 
  trades, 
  onRowClick, 
  onEdit, 
  onDelete, 
  selectedTradeIds = new Set(), 
  onToggleSelection,
  itemsPerPage = 50
}: TradesTableVirtualizedProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return trades.slice(startIndex, endIndex);
  }, [trades, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(trades.length / itemsPerPage);

  const listData = useMemo(() => ({
    trades: paginatedTrades,
    onRowClick,
    onEdit,
    onDelete,
    selectedTradeIds,
    onToggleSelection
  }), [paginatedTrades, onRowClick, onEdit, onDelete, selectedTradeIds, onToggleSelection]);

  const handleSelectAll = useCallback(() => {
    if (!onToggleSelection) return;
    
    const isAllSelected = paginatedTrades.every(trade => selectedTradeIds.has(trade.id));
    
    paginatedTrades.forEach(trade => {
      if (isAllSelected && selectedTradeIds.has(trade.id)) {
        onToggleSelection(trade.id);
      } else if (!isAllSelected && !selectedTradeIds.has(trade.id)) {
        onToggleSelection(trade.id);
      }
    });
  }, [paginatedTrades, selectedTradeIds, onToggleSelection]);

  if (!trades || trades.length === 0) {
    return (
      <div className="bg-gray-800/80 p-6 rounded-md shadow-xl min-h-[150px] flex items-center justify-center backdrop-blur-md border border-gray-700/60">
        <p className="text-gray-400 text-center">
          Aucun trade enregistré pour le moment. <br />
          Cliquez sur "Ajouter un Trade" pour commencer.
        </p>
      </div>
    );
  }

  const headerGridCols = onToggleSelection 
    ? "grid-cols-[48px_96px_80px_80px_96px_64px_96px_1fr_80px_80px]" 
    : "grid-cols-[96px_80px_80px_96px_64px_96px_1fr_80px_80px]";

  return (
    <div className="bg-gray-800/70 rounded-md shadow-xl backdrop-blur-md border border-gray-700/50">
      {/* Header */}
      <div className={`grid ${headerGridCols} gap-2 items-center px-4 py-3 border-b border-gray-700`}>
        {onToggleSelection && (
          <div className="flex justify-center">
            <input
              type="checkbox"
              checked={paginatedTrades.length > 0 && paginatedTrades.every(trade => selectedTradeIds.has(trade.id))}
              onChange={handleSelectAll}
              className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
            />
          </div>
        )}
        <div className="text-xs font-medium text-purple-300 uppercase tracking-wider">Date</div>
        <div className="text-xs font-medium text-purple-300 uppercase tracking-wider">Actif</div>
        <div className="text-xs font-medium text-purple-300 uppercase tracking-wider">Session</div>
        <div className="text-xs font-medium text-purple-300 uppercase tracking-wider">Setup</div>
        <div className="text-xs font-medium text-purple-300 uppercase tracking-wider text-center">Risk</div>
        <div className="text-xs font-medium text-purple-300 uppercase tracking-wider text-right">Performance</div>
        <div className="text-xs font-medium text-purple-300 uppercase tracking-wider">Notes</div>
        <div className="text-xs font-medium text-purple-300 uppercase tracking-wider text-center">Graph</div>
        <div className="text-xs font-medium text-purple-300 uppercase tracking-wider text-center">Actions</div>
      </div>

      {/* Virtualized List */}
      <div className="h-96">
        <List
          height={384}
          itemCount={paginatedTrades.length}
          itemSize={56}
          itemData={listData}
          width="100%"
        >
          {TradeRow}
        </List>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            {trades.length} trade{trades.length > 1 ? 's' : ''} au total - Page {currentPage} sur {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              <ChevronLeft size={16} />
              Précédent
            </button>
            <span className="text-sm text-gray-300 px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
            >
              Suivant
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

TradesTableVirtualized.displayName = 'TradesTableVirtualized'; 