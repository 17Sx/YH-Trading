"use client";

import type { Trade } from "@/lib/actions/journal.actions";
import { X, ExternalLink } from "lucide-react";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TradeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade | null;
}

export function TradeDetailsModal({
  isOpen,
  onClose,
  trade,
}: TradeDetailsModalProps) {
  if (!isOpen || !trade) return null;

  const pnlColorClass = trade.profit_loss_amount > 0 
    ? "text-green-400" 
    : trade.profit_loss_amount < 0 
    ? "text-red-400" 
    : "text-gray-400";
  
 const formattedPnl = `${trade.profit_loss_amount.toFixed(2)}%`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 pointer-events-auto">
      <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-2xl max-h-[70vh] overflow-y-auto relative border border-purple-500/50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition-colors"
          aria-label="Fermer la modale"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-semibold text-purple-300 mb-6">
          Détails du Trade
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-gray-300">
          <div>
            <span className="font-medium text-gray-400 block mb-0.5">Date:</span>
            <p>{format(new Date(trade.trade_date), 'PPP', { locale: fr })}</p>
          </div>
          <div>
            <span className="font-medium text-gray-400 block mb-0.5">Actif:</span>
            <p>{trade.asset_name}</p>
          </div>
          <div>
            <span className="font-medium text-gray-400 block mb-0.5">Session:</span>
            <p>{trade.session_name}</p>
          </div>
          <div>
            <span className="font-medium text-gray-400 block mb-0.5">Setup:</span>
            <p>{trade.setup_name}</p>
          </div>
          <div>
            <span className="font-medium text-gray-400 block mb-0.5">Risque:</span>
            <p>{trade.risk_input}</p>
          </div>
          <div>
            <span className="font-medium text-gray-400 block mb-0.5">Profit/Perte:</span>
            <p className={pnlColorClass}>{formattedPnl}</p>
          </div>
          <div>
            <span className="font-medium text-gray-400 block mb-0.5">Durée:</span>
            <p>{typeof trade.duration_minutes === 'number' ? (trade.duration_minutes % 60 === 0 ? `${trade.duration_minutes / 60} h` : `${trade.duration_minutes} min`) : '—'}</p>
          </div>

          {trade.tradingview_link && (
            <div className="md:col-span-2">
              <span className="font-medium text-gray-400 block mb-0.5">Lien TradingView:</span>
              <a
                href={trade.tradingview_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-purple-400 hover:text-purple-300 hover:underline"
              >
                Voir le graphique <ExternalLink size={16} className="ml-1" />
              </a>
            </div>
          )}
          <div className="md:col-span-2">
            <span className="font-medium text-gray-400 block mb-0.5">Notes:</span>
            <p className="whitespace-pre-wrap break-words bg-gray-700 p-3 rounded-md text-sm leading-relaxed">{trade.notes || "Aucune note."}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 