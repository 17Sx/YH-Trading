"use client";

import type { Trade } from "@/lib/actions/journal.actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; 
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Pencil, Trash2 } from "lucide-react";

interface TradesTableProps {
  trades: Trade[];
  onRowClick: (trade: Trade) => void;
  onEdit?: (trade: Trade) => void;
  onDelete?: (trade: Trade) => void;
}

export function TradesTable({ trades, onRowClick, onEdit, onDelete }: TradesTableProps) {
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

  return (
    <div className="overflow-x-auto bg-gray-800/70 p-4 sm:p-6 rounded-md shadow-xl backdrop-blur-md border border-gray-700/50">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow className="border-b border-gray-700 hover:bg-gray-700/50">
            <TableHead className="py-3 px-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Date</TableHead>
            <TableHead className="py-3 px-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Actif</TableHead>
            <TableHead className="py-3 px-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Session</TableHead>
            <TableHead className="py-3 px-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Setup</TableHead>
            <TableHead className="py-3 px-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Risk</TableHead>
            <TableHead className="py-3 px-4 text-right text-xs font-medium text-purple-300 uppercase tracking-wider">Profit/Perte</TableHead>
            <TableHead className="py-3 px-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">Notes</TableHead>
            <TableHead className="py-3 px-4 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">TradingView</TableHead>
            <TableHead className="py-3 px-4 text-center text-xs font-medium text-purple-300 uppercase tracking-wider hidden md:table-cell">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-700">
          {trades.map((trade) => (
            <TableRow 
              key={trade.id} 
              className="hover:bg-gray-700/40 transition-colors cursor-pointer"
              onClick={() => onRowClick(trade)}
            >
              <TableCell className="py-3 px-4 whitespace-nowrap text-sm text-gray-200">{format(new Date(trade.trade_date), 'dd MMM yyyy', { locale: fr })}</TableCell>
              <TableCell className="py-3 px-4 whitespace-nowrap text-sm text-gray-200">{trade.asset_name || '-'}</TableCell>
              <TableCell className="py-3 px-4 whitespace-nowrap text-sm text-gray-200">{trade.session_name || '-'}</TableCell>
              <TableCell className="py-3 px-4 whitespace-nowrap text-sm text-gray-200">{trade.setup_name || '-'}</TableCell>
              <TableCell className="py-3 px-4 whitespace-nowrap text-sm text-gray-200">{trade.risk_input}</TableCell>
              <TableCell className={`py-3 px-4 whitespace-nowrap text-sm text-right font-semibold ${trade.profit_loss_amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {/* Affichage en devise si currency est disponible, sinon en pourcentage */}
                {trade.profit_loss_amount.toFixed(2)}%
              </TableCell>
              <TableCell className="py-3 px-4 text-sm text-gray-300 max-w-xs truncate" title={trade.notes || undefined}>
                {trade.notes || '-'}
              </TableCell>
              <TableCell className="py-3 px-4 whitespace-nowrap text-sm">
                {trade.tradingview_link ? (
                  <a href={trade.tradingview_link} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 hover:underline" onClick={(e) => e.stopPropagation()}>
                    Voir Graph.
                  </a>
                ) : '-'}
              </TableCell>
              <TableCell className="py-3 px-4 whitespace-nowrap text-sm text-center hidden md:table-cell">
                <button
                  className="inline-flex items-center justify-center text-purple-400 hover:text-purple-200 mr-2"
                  title="Éditer"
                  onClick={e => { e.stopPropagation(); onEdit && onEdit(trade); }}
                  aria-label="Éditer"
                >
                  <Pencil size={18} />
                </button>
                <button
                  className="inline-flex items-center justify-center text-red-500 hover:text-red-400"
                  title="Supprimer"
                  onClick={e => { e.stopPropagation(); onDelete && onDelete(trade); }}
                  aria-label="Supprimer"
                >
                  <Trash2 size={18} />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 