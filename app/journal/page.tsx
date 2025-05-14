"use client";
import Dither from "@/components/ui/Dither/Dither"; 
import { AddTradeModal } from "@/components/journal/add-trade-modal";
import { TradesTable } from "@/components/journal/trades-table";
import { TradeDetailsModal } from "@/components/journal/trade-details-modal";
import { WinrateDistributionChart } from "@/components/journal/charts/winrate-distribution-chart";
import { SessionPerformanceChart } from "@/components/journal/charts/session-performance-chart";
import { CumulativePnlChart } from "@/components/journal/charts/cumulative-pnl-chart";
import {
  getAssets,
  getSessions,
  getSetups,
  getTrades,
  type Asset,
  type Session,
  type Setup,
  type Trade,
} from "@/lib/actions/journal.actions";
import { useEffect, useState, useTransition, useMemo } from "react";
import { PlusCircle, CalendarDays } from "lucide-react";
import { Toaster, toast } from "sonner";

interface JournalPageData {
  assets: Asset[];
  sessions: Session[];
  setups: Setup[];
  trades: Trade[];
  error?: string;
}

export default function JournalPage() {
  const primaryAccentRGB: [number, number, number] = [0.494, 0.357, 0.937];
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [journalData, setJournalData] = useState<JournalPageData>({
    assets: [],
    sessions: [],
    setups: [],
    trades: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); 
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [searchTerm, setSearchTerm] = useState<string>(""); 

  const loadData = async () => {
    setIsLoading(true);
    startTransition(async () => {
      try {
        const [
          assetsResult,
          sessionsResult,
          setupsResult,
          tradesResult
        ] = await Promise.all([
          getAssets(),
          getSessions(),
          getSetups(),
          getTrades(),
        ]);

        const error = assetsResult.error || sessionsResult.error || setupsResult.error || tradesResult.error;

        if (error) {
          console.error("Erreur de chargement des données:", error);
          toast.error(`Erreur de chargement: ${error}`);
          setJournalData({ assets: [], sessions: [], setups: [], trades: [], error });
        } else {
          setJournalData({
            assets: assetsResult.assets,
            sessions: sessionsResult.sessions,
            setups: setupsResult.setups,
            trades: tradesResult.trades,
          });
        }
      } catch (e: any) {
        console.error("Exception lors du chargement des données:", e);
        toast.error(`Une exception s'est produite: ${e.message || e}`);
        setJournalData({ assets: [], sessions: [], setups: [], trades: [], error: e.message || String(e) });
      } finally {
        setIsLoading(false);
      }
    });
  };
  
  useEffect(() => {
    loadData();
  }, []);

  const handleAddModalClose = () => {
    setIsAddModalOpen(false);
    loadData();
  };

  const handleDetailsModalClose = () => {
    setIsDetailsModalOpen(false);
    setSelectedTrade(null);
  };

  const handleRowClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setIsDetailsModalOpen(true);
  };

  const yearOptions = useMemo(() => {
    const startYear = Math.min(currentYear - 2, ...journalData.trades.map(t => new Date(t.trade_date).getFullYear()));
    const endYear = currentYear + 1;
    const years = [];
    for (let y = Math.min(startYear, 2022) ; y <= endYear; y++) {
      years.push(y);
    }
    return years.sort((a,b) => b-a); 
  }, [currentYear, journalData.trades]);

  const monthOptions = [
    { value: 0, label: "Janvier" }, { value: 1, label: "Février" }, { value: 2, label: "Mars" },
    { value: 3, label: "Avril" }, { value: 4, label: "Mai" }, { value: 5, label: "Juin" },
    { value: 6, label: "Juillet" }, { value: 7, label: "Août" }, { value: 8, label: "Septembre" },
    { value: 9, label: "Octobre" }, { value: 10, label: "Novembre" }, { value: 11, label: "Décembre" },
  ];

  const filteredTrades = useMemo(() => {
    if (!journalData.trades) return [];
    return journalData.trades.filter(trade => {
      const tradeDate = new Date(trade.trade_date);
      const isMonthYearMatch = tradeDate.getFullYear() === selectedYear && tradeDate.getMonth() === selectedMonth;
      if (!isMonthYearMatch) return false;

      if (!searchTerm.trim()) return true; 

      const lowerSearchTerm = searchTerm.toLowerCase();
      const searchableFields = [
        trade.asset_name,
        trade.session_name,
        trade.setup_name,
        trade.notes,
        trade.risk_input, 
      ];

      return searchableFields.some(field => 
        field && String(field).toLowerCase().includes(lowerSearchTerm)
      );
    });
  }, [journalData.trades, selectedYear, selectedMonth, searchTerm]);

  const monthlyStats = useMemo(() => {
    if (filteredTrades.length === 0) {
      return {
        performancePercent: "N/A",
        winRate: "N/A",
        numTrades: 0,
        numTP: 0,
        numSL: 0,
        numBE: 0,
      };
    }

    const numTrades = filteredTrades.length;
    const numTP = filteredTrades.filter(t => t.profit_loss_amount > 0).length;
    const numSL = filteredTrades.filter(t => t.profit_loss_amount < 0).length;
    const numBE = filteredTrades.filter(t => t.profit_loss_amount === 0).length;
    const winRate = numTrades > 0 && (numTP + numSL > 0) ? ((numTP / (numTP + numSL)) * 100) : 0;
    

    const totalPercentagePerformance = filteredTrades.reduce((acc, trade) => acc + trade.profit_loss_amount, 0);
    
    const performanceDisplay = numTrades > 0 
      ? `${totalPercentagePerformance.toFixed(2)}%` 
      : "N/A";

    const averageTradePerformance = numTrades > 0 ? totalPercentagePerformance / numTrades : 0;
    const averageTradePerformanceDisplay = numTrades > 0 
      ? `${averageTradePerformance.toFixed(2)}%` 
      : "N/A";

    return {
      performanceDisplay,
      winRate: numTP + numSL > 0 ? `${winRate.toFixed(2)}%` : "N/A",
      numTrades,
      numTP,
      numSL,
      numBE,
      averageTradePerformanceDisplay,
    };
  }, [filteredTrades]);

  return (
    <>
      <Toaster richColors position="bottom-right" />
      <div className="relative min-h-screen selection:bg-purple-500 selection:text-white">
        <div className="absolute inset-0 z-0">
          <Dither
            waveColor={primaryAccentRGB}
            waveAmplitude={0.05}
            waveFrequency={0.5}
            pixelSize={1}
            colorNum={5}
            waveSpeed={0.01}
            enableMouseInteraction={true}
            mouseRadius={0.3}
          />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-start p-4 pt-12 md:pt-16 text-gray-100 pointer-events-none">
          <div className="w-full max-w-6xl space-y-8 bg-transparent p-0 md:p-4 pointer-events-auto">
            <header className="flex flex-col sm:flex-row justify-between items-center mb-8 px-2 sm:px-0">
              <div className="text-center sm:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                  Journal de Trading
                </h1>
                <p className="mt-1 text-md md:text-lg text-gray-300">
                  Suivez et analysez vos performances.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 sm:mt-0 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-5 rounded-md transition-colors duration-300 focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center"
              >
                <PlusCircle size={20} className="mr-2" />
                Ajouter un Trade
              </button>
            </header>
            
            {/* Filtres et Stats */}
            <div className="mb-8 p-4 bg-gray-800/70 rounded-lg shadow-xl backdrop-blur-md border border-gray-700/50">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center mb-6 flex-wrap">
                <div className="flex items-center gap-2 text-gray-300">
                  <CalendarDays size={20} className="text-purple-400"/>
                  <span className="font-medium">Filtrer par mois :</span>
                </div>
                <div className="flex gap-3">
                  <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-md focus:ring-purple-500 focus:border-purple-500 p-2.5"
                  >
                    {monthOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-md focus:ring-purple-500 focus:border-purple-500 p-2.5"
                  >
                    {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
                {/* Champ de recherche */}
                <div className="flex-grow sm:flex-grow-0 sm:ml-auto">
                  <input 
                    type="search"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-auto bg-gray-700 border border-gray-600 text-gray-200 text-sm rounded-md focus:ring-purple-500 focus:border-purple-500 p-2.5 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Tableau des Stats Mensuelles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
                <div className="bg-gray-700/50 p-4 rounded-md">
                  <p className="text-sm text-purple-300 mb-1">Performance</p>
                  <p className="text-xl font-semibold text-gray-100">{monthlyStats.performanceDisplay}</p>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-md">
                  <p className="text-sm text-purple-300 mb-1">Perf. Moy/Trade</p>
                  <p className="text-xl font-semibold text-gray-100">{monthlyStats.averageTradePerformanceDisplay}</p>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-md">
                  <p className="text-sm text-purple-300 mb-1">Winrate</p>
                  <p className="text-xl font-semibold text-gray-100">{monthlyStats.winRate}</p>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-md">
                  <p className="text-sm text-purple-300 mb-1">Trades</p>
                  <p className="text-xl font-semibold text-gray-100">{monthlyStats.numTrades}</p>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-md">
                  <p className="text-sm text-purple-300 mb-1">Gagnants (TP)</p>
                  <p className="text-xl font-semibold text-green-400">{monthlyStats.numTP}</p>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-md">
                  <p className="text-sm text-purple-300 mb-1">Perdants (SL)</p>
                  <p className="text-xl font-semibold text-red-400">{monthlyStats.numSL}</p>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-md">
                  <p className="text-sm text-purple-300 mb-1">Neutres (BE)</p>
                  <p className="text-xl font-semibold text-gray-400">{monthlyStats.numBE}</p>
                </div>
              </div>
            </div>

            {/* Section des Graphiques */}
            {!isLoading && filteredTrades.length > 0 && (
              <div className="mb-8 grid grid-cols-1 lg:grid-cols-[auto,1fr] gap-6 items-stretch">
  <div className="flex justify-start">
    <WinrateDistributionChart trades={filteredTrades} />
  </div>
  <div className="flex flex-col justify-center">
    <SessionPerformanceChart trades={filteredTrades} />
  </div>
  <div className="lg:col-span-2">
    <CumulativePnlChart trades={filteredTrades} />
  </div>
</div>
            )}
            
            {isLoading && filteredTrades.length === 0 && journalData.trades.length > 0 ? (
                <div className="flex justify-center items-center h-64">
                    <p className="text-gray-400">Chargement des trades pour {monthOptions.find(m=>m.value === selectedMonth)?.label} {selectedYear}...</p>
                </div>
            ) : isLoading && journalData.trades.length === 0 ? (
                 <div className="bg-red-900/30 text-red-300 p-4 rounded-md border border-red-700/50 text-center">
                    Erreur lors du chargement des données du journal : {journalData.error}
                 </div>
            ) : (
              <TradesTable trades={filteredTrades} onRowClick={handleRowClick} />
            )}

          </div>
          <p className="mt-8 mb-4 text-xs text-gray-500 text-center relative z-10 pointer-events-auto">
            YH Trading Journal &copy; {new Date().getFullYear()}
          </p>
        </div>

        <AddTradeModal
          isOpen={isAddModalOpen}
          onClose={handleAddModalClose}
          assets={journalData.assets}
          sessions={journalData.sessions}
          setups={journalData.setups}
          onDataNeedsRefresh={loadData}
        />
        
        <TradeDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={handleDetailsModalClose}
          trade={selectedTrade}
        />
      </div>
    </>
  );
} 