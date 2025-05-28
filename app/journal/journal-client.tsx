"use client";
import Dither from "@/components/ui/Dither/Dither";
import { AddTradeModal } from "@/components/journal/add-trade-modal";
import { EditTradeModal } from "@/components/journal/edit-trade-modal";
import { TradesTable } from "@/components/journal/trades-table";
import { TradeDetailsModal } from "@/components/journal/trade-details-modal";
import { DeleteTradeConfirmationModal } from "@/components/journal/delete-trade-confirmation-modal";
import { WinrateDistributionChart } from "@/components/journal/charts/winrate-distribution-chart";
import { SessionPerformanceChart } from "@/components/journal/charts/session-performance-chart";
import { CumulativePnlChart } from "@/components/journal/charts/cumulative-pnl-chart";
import {
  getAssets,
  getSessions,
  getSetups,
  getTrades,
  deleteTrade,
  type Asset,
  type Session,
  type Setup,
  type Trade,
  type Journal,
} from "@/lib/actions/journal.actions";
import { useEffect, useState, useTransition, useMemo } from "react";
import { PlusCircle, CalendarDays, File, BookOpen, Upload } from "lucide-react";
import { Toaster, toast } from "sonner";
import * as XLSX from "xlsx";
import { Loading } from "@/components/ui/loading";
import { PageLoading } from "@/components/ui/page-loading";

interface JournalPageData {
  assets: Asset[];
  sessions: Session[];
  setups: Setup[];
  trades: Trade[];
  error?: string;
}

interface JournalClientProps {
  journal: Journal;
}

export function JournalClient({ journal }: JournalClientProps) {
  const primaryAccentRGB: [number, number, number] = [0.494, 0.357, 0.937];
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [isDeletingTrade, setIsDeletingTrade] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [journalData, setJournalData] = useState<JournalPageData>({
    assets: [],
    sessions: [],
    setups: [],
    trades: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); 
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [viewMode, setViewMode] = useState<'month' | 'year' | 'all'>('month');
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
          getAssets(journal.id),
          getSessions(journal.id),
          getSetups(journal.id),
          getTrades(journal.id),
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
  }, [journal.id]);

  const handleAddModalClose = () => {
    setIsAddModalOpen(false);
    loadData();
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setTradeToEdit(null);
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

  const handleOpenEditModal = (trade: Trade) => {
    setTradeToEdit(trade);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (trade: Trade) => {
    setTradeToDelete(trade);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!tradeToDelete) return;
    setIsDeletingTrade(true);
    try {
      const result = await deleteTrade(tradeToDelete.id, journal.id);
      if (result.success) {
        toast.success("Trade supprimé avec succès.");
        loadData();
      } else {
        toast.error(result.error || "Erreur lors de la suppression du trade.");
      }
    } catch (error) {
      toast.error("Une erreur inattendue est survenue lors de la suppression.");
      console.error("Delete trade error:", error);
    } finally {
      setIsDeletingTrade(false);
      setIsDeleteModalOpen(false);
      setTradeToDelete(null);
    }
  };

  function importFromExcel(file: File) {
    if (!file) {
      toast.error("Aucun fichier sélectionné.");
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        if (!worksheet) {
          toast.error("Aucune feuille de calcul trouvée dans le fichier.");
          setIsImporting(false);
          return;
        }

        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          range: 1 
        }) as any[][];

        if (!jsonData || jsonData.length === 0) {
          toast.error("Le fichier Excel est vide ou ne contient pas de données valides.");
          setIsImporting(false);
          return;
        }

        const tradesToImport = [];
        const errors = [];

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const rowNumber = i + 2; 

          if (!row || row.length === 0 || !row.some(cell => cell !== undefined && cell !== null && cell !== '')) {
            continue;
          }

          try {
            const tradeDate = row[0]; // Colonne A
            const assetName = row[6]; // Colonne G
            const sessionName = row[11]; // Colonne L
            const riskInput = row[25]; // Colonne Z
            const profitLoss = row[28]; // Colonne AC
            const setupName = row[31]; // Colonne AF
            const notes = row[36]; // Colonne AK
            const tradingviewLink = row[50]; // Colonne AY

            if (!tradeDate) {
              errors.push(`Ligne ${rowNumber}: Date manquante`);
              continue;
            }

            if (!assetName) {
              errors.push(`Ligne ${rowNumber}: Actif manquant`);
              continue;
            }

            const asset = journalData.assets.find(a => a.name.toLowerCase() === String(assetName).toLowerCase());
            const session = sessionName ? journalData.sessions.find(s => s.name.toLowerCase() === String(sessionName).toLowerCase()) : null;
            const setup = setupName ? journalData.setups.find(s => s.name.toLowerCase() === String(setupName).toLowerCase()) : null;

            if (!asset) {
              errors.push(`Ligne ${rowNumber}: Actif "${assetName}" non trouvé dans le journal`);
              continue;
            }

            const tradeData = {
              trade_date: new Date(tradeDate).toISOString().split('T')[0],
              asset_id: asset.id,
              session_id: session?.id || null,
              setup_id: setup?.id || null,
              risk_input: riskInput ? String(riskInput) : "",
              profit_loss_amount: profitLoss ? parseFloat(String(profitLoss)) : 0,
              notes: notes ? String(notes) : "",
              tradingview_link: tradingviewLink ? String(tradingviewLink) : "",
              duration_minutes: null
            };

            tradesToImport.push(tradeData);

          } catch (error) {
            errors.push(`Ligne ${rowNumber}: Erreur de parsing - ${error}`);
          }
        }

        if (errors.length > 0) {
          console.warn("Erreurs d'import:", errors);
          toast.warning(`${errors.length} ligne(s) ignorée(s) à cause d'erreurs. Vérifiez la console pour plus de détails.`);
        }

        if (tradesToImport.length === 0) {
          toast.error("Aucun trade valide trouvé dans le fichier.");
          setIsImporting(false);
          return;
        }

        let successCount = 0;
        let failCount = 0;

        for (const tradeData of tradesToImport) {
          try {
            const { addTrade } = await import('@/lib/actions/journal.actions');
            const result = await addTrade(tradeData, journal.id);
            
            if (result.success) {
              successCount++;
            } else {
              failCount++;
              console.error("Erreur lors de l'ajout du trade:", result.error);
            }
          } catch (error) {
            failCount++;
            console.error("Erreur lors de l'ajout du trade:", error);
          }
        }

        if (successCount > 0) {
          toast.success(`${successCount} trade(s) importé(s) avec succès!`);
          await loadData();
        }

        if (failCount > 0) {
          toast.error(`${failCount} trade(s) n'ont pas pu être importés.`);
        }

      } catch (error) {
        console.error("Erreur lors de l'import:", error);
        toast.error("Erreur lors de la lecture du fichier Excel.");
      } finally {
        setIsImporting(false);
      }
    };

    reader.onerror = () => {
      toast.error("Erreur lors de la lecture du fichier.");
      setIsImporting(false);
    };

    reader.readAsArrayBuffer(file);
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importFromExcel(file);
    }
    event.target.value = '';
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
      const isYearMatch = tradeDate.getFullYear() === selectedYear;
      const isMonthYearMatch = isYearMatch && tradeDate.getMonth() === selectedMonth;
      
      if (viewMode === 'all') {
        if (!searchTerm.trim()) return true;
      } else {
        if (viewMode === 'year' && !isYearMatch) return false;
        if (viewMode === 'month' && !isMonthYearMatch) return false;
      }

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
  }, [journalData.trades, selectedYear, selectedMonth, searchTerm, viewMode]);

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

    return {
      performanceDisplay,
      winRate: numTP + numSL > 0 ? `${winRate.toFixed(2)}%` : "N/A",
      numTrades,
      numTP,
      numSL,
      numBE,
    };
  }, [filteredTrades]);

  function exportToExcel(trades: Trade[], filename: string) {
    if (!trades || trades.length === 0) {
      toast.error("No trades to export for this period.");
      return;
    }

    const exportData = trades.map(trade => {
      const row: { [key: string]: any } = {};
      // Date (A-F)
      row['A'] = trade.trade_date;
      row['B'] = '';
      row['C'] = '';
      row['D'] = '';
      row['E'] = '';
      row['F'] = '';
      // Actif (G-K)
      row['G'] = trade.asset_name;
      row['H'] = '';
      row['I'] = '';
      row['J'] = '';
      row['K'] = '';
      // Session (L-P)
      row['L'] = trade.session_name;
      row['M'] = '';
      row['N'] = '';
      row['O'] = '';
      row['P'] = '';
      // / (Q-S)
      row['Q'] = '';
      row['R'] = '';
      row['S'] = '';
      // / (T-V)
      row['T'] = '';
      row['U'] = '';
      row['V'] = '';
      // / (W-Y)
      row['W'] = '';
      row['X'] = '';
      row['Y'] = '';
      // Risk (Z-AB)
      row['Z'] = trade.risk_input;
      row['AA'] = '';
      row['AB'] = '';
      // Profit (AC-AE)
      row['AC'] = trade.profit_loss_amount;
      row['AD'] = '';
      row['AE'] = '';
      // Setup (AF-AJ)
      row['AF'] = trade.setup_name;
      row['AG'] = '';
      row['AH'] = '';
      row['AI'] = '';
      row['AJ'] = '';
      // Notes (AK-AX)
      row['AK'] = trade.notes ?? '';
      for (let col of ['AL','AM','AN','AO','AP','AQ','AR','AS','AT','AU','AV','AW','AX']) row[col] = '';
      // Lien (AY-BC)
      row['AY'] = trade.tradingview_link ?? '';
      row['AZ'] = '';
      row['BA'] = '';
      row['BB'] = '';
      row['BC'] = '';
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [
      { wch: 12 }, // A
      { wch: 2 },  // B
      { wch: 2 },  // C
      { wch: 2 },  // D
      { wch: 2 },  // E
      { wch: 2 },  // F
      { wch: 15 }, // G (Actif)
      { wch: 2 },  // H
      { wch: 2 },  // I
      { wch: 2 },  // J
      { wch: 2 },  // K
      { wch: 12 }, // L (Session)
      { wch: 2 },  // M
      { wch: 2 },  // N
      { wch: 2 },  // O
      { wch: 2 },  // P
      { wch: 2 },  // Q
      { wch: 2 },  // R
      { wch: 2 },  // S
      { wch: 2 },  // T
      { wch: 2 },  // U
      { wch: 2 },  // V
      { wch: 2 },  // W
      { wch: 2 },  // X
      { wch: 2 },  // Y
      { wch: 8 },  // Z (Risk)
      { wch: 2 },  // AA
      { wch: 2 },  // AB
      { wch: 8 },  // AC (Profit)
      { wch: 2 },  // AD
      { wch: 2 },  // AE
      { wch: 12 }, // AF (Setup)
      { wch: 2 },  // AG
      { wch: 2 },  // AH
      { wch: 2 },  // AI
      { wch: 2 },  // AJ
      { wch: 20 }, // AK (Notes)
      { wch: 2 },  // AL
      { wch: 2 },  // AM
      { wch: 2 },  // AN
      { wch: 2 },  // AO
      { wch: 2 },  // AP
      { wch: 2 },  // AQ
      { wch: 2 },  // AR
      { wch: 2 },  // AS
      { wch: 2 },  // AT
      { wch: 2 },  // AU
      { wch: 2 },  // AV
      { wch: 2 },  // AW
      { wch: 2 },  // AX
      { wch: 30 }, // AY (Lien)
      { wch: 2 },  // AZ
      { wch: 2 },  // BA
      { wch: 2 },  // BB
      { wch: 2 },  // BC
    ];

    const horizontalMerges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },    // Date (A-F)
      { s: { r: 0, c: 6 }, e: { r: 0, c: 10 } },   // Actif (G-K)
      { s: { r: 0, c: 11 }, e: { r: 0, c: 15 } },  // Session (L-P)
      { s: { r: 0, c: 16 }, e: { r: 0, c: 18 } },  // / (Q-S)
      { s: { r: 0, c: 19 }, e: { r: 0, c: 21 } },  // / (T-V)
      { s: { r: 0, c: 22 }, e: { r: 0, c: 24 } },  // / (W-Y)
      { s: { r: 0, c: 25 }, e: { r: 0, c: 27 } },  // Risk (Z-AB)
      { s: { r: 0, c: 28 }, e: { r: 0, c: 30 } },  // Profit (AC-AE)
      { s: { r: 0, c: 31 }, e: { r: 0, c: 35 } },  // Setup (AF-AJ)
      { s: { r: 0, c: 36 }, e: { r: 0, c: 49 } },  // Notes (AK-AX)
      { s: { r: 0, c: 50 }, e: { r: 0, c: 54 } },  // Lien (AY-BC)
    ];

    const verticalMerges = trades.flatMap((_, rowIndex) => [
      { s: { r: rowIndex + 1, c: 0 }, e: { r: rowIndex + 1, c: 5 } },    // Date (A-F)
      { s: { r: rowIndex + 1, c: 6 }, e: { r: rowIndex + 1, c: 10 } },   // Actif (G-K)
      { s: { r: rowIndex + 1, c: 11 }, e: { r: rowIndex + 1, c: 15 } },  // Session (L-P)
      { s: { r: rowIndex + 1, c: 16 }, e: { r: rowIndex + 1, c: 18 } },  // / (Q-S)
      { s: { r: rowIndex + 1, c: 19 }, e: { r: rowIndex + 1, c: 21 } },  // / (T-V)
      { s: { r: rowIndex + 1, c: 22 }, e: { r: rowIndex + 1, c: 24 } },  // / (W-Y)
      { s: { r: rowIndex + 1, c: 25 }, e: { r: rowIndex + 1, c: 27 } },  // Risk (Z-AB)
      { s: { r: rowIndex + 1, c: 28 }, e: { r: rowIndex + 1, c: 30 } },  // Profit (AC-AE)
      { s: { r: rowIndex + 1, c: 31 }, e: { r: rowIndex + 1, c: 35 } },  // Setup (AF-AJ)
      { s: { r: rowIndex + 1, c: 36 }, e: { r: rowIndex + 1, c: 49 } },  // Notes (AK-AX)
      { s: { r: rowIndex + 1, c: 50 }, e: { r: rowIndex + 1, c: 54 } },  // Lien (AY-BC)
    ]);

    ws['A1'] = { v: 'Date' };
    ws['G1'] = { v: 'Actif' };
    ws['L1'] = { v: 'Session' };
    ws['Z1'] = { v: 'Risk' };
    ws['AC1'] = { v: 'Profit' };
    ws['AF1'] = { v: 'Setup' };
    ws['AK1'] = { v: 'Notes' };
    ws['AY1'] = { v: 'Lien' };

    ws['!merges'] = [...horizontalMerges, ...verticalMerges];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trades");
    XLSX.writeFile(wb, filename);
  }

  const handleNavigation = (path: string) => {
    setIsNavigating(true);
    window.location.href = path;
  };

  return (
    <>
      <Toaster richColors position="bottom-right" />
      <div className="relative min-h-screen selection:bg-purple-500 selection:text-white">
        {(isLoading || isNavigating) && <PageLoading />}
        <div className="absolute inset-0 z-0">
          <Dither
            waveColor={primaryAccentRGB}
            waveAmplitude={0.05}
            waveFrequency={0.5}
            pixelSize={1}
            colorNum={5}
            waveSpeed={0.1}
            enableMouseInteraction={true}
            mouseRadius={0.3}
          />
        </div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-start p-4 pt-12 md:pt-16 text-gray-100 pointer-events-none">
          <div className="w-full max-w-7xl space-y-8 bg-transparent p-0 md:p-4 pointer-events-auto">
            <header className="flex flex-col sm:flex-row justify-between items-center mb-8 px-2 sm:px-0">
              <div className="text-center sm:text-left">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleNavigation('/journal')}
                    className="text-gray-400 hover:text-gray-200 transition-colors"
                    aria-label="Retour à la liste des journaux"
                    disabled={isLoading || isNavigating}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                      {journal.name}
                    </h1>
                    <p className="mt-1 text-md md:text-lg text-gray-300">
                      {journal.description}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-4">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileImport}
                  style={{ display: 'none' }}
                  id="excel-import-input"
                  disabled={isLoading || isNavigating || isImporting}
                />
                <button
                  type="button"
                  className="mt-4 sm:mt-0 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-5 rounded-md transition-colors duration-300 focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Import trades from Excel"
                  onClick={() => document.getElementById('excel-import-input')?.click()}
                  disabled={isLoading || isNavigating || isImporting}
                >
                  {isImporting ? (
                    <Loading size="sm" variant="default" className="mr-2" />
                  ) : (
                    <Upload size={20} className="mr-2" />
                  )}
                  {isImporting ? 'Import en cours...' : 'Import Excel'}
                </button>

                <button
                  type="button"
                  className="mt-4 sm:mt-0 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-5 rounded-md transition-colors duration-300 focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Export trades to Excel"
                  onClick={() => exportToExcel(filteredTrades, `trades-${selectedMonth + 1}-${selectedYear}.xlsx`)}
                  disabled={isLoading || isNavigating || isImporting}
                >
                  {isLoading ? (
                    <Loading size="sm" variant="default" className="mr-2" />
                  ) : (
                    <File size={20} className="mr-2" />
                  )}
                  Export Excel
                </button>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-4 sm:mt-0 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-5 rounded-md transition-colors duration-300 focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || isNavigating}
                >
                  {isLoading ? (
                    <Loading size="sm" variant="default" className="mr-2" />
                  ) : (
                    <PlusCircle size={20} className="mr-2" />
                  )}
                  Ajouter un Trade
                </button>
              </div>
            </header>
            
            {/* Filtres et Stats */}
            <div className="mb-8 p-4 bg-gray-800/70 rounded-lg shadow-xl backdrop-blur-md border border-gray-700/50">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center mb-6 flex-wrap">
                <div className="flex items-center gap-2 text-gray-300">
                  <CalendarDays size={20} className="text-purple-400"/>
                  <span className="font-medium">Filtrer par période :</span>
                </div>
                <div className="flex gap-3">
                  {viewMode !== 'all' && (
                    <>
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
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-2 rounded-md transition-colors ${
                      viewMode === 'month'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Vue Mensuelle
                  </button>
                  <button
                    onClick={() => setViewMode('year')}
                    className={`px-3 py-2 rounded-md transition-colors ${
                      viewMode === 'year'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Vue Annuelle
                  </button>
                  <button
                    onClick={() => setViewMode('all')}
                    className={`px-3 py-2 rounded-md transition-colors ${
                      viewMode === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Tous les Trades
                  </button>
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
                  <p className="text-xl font-semibold text-blue-400">{monthlyStats.numBE}</p>
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
                    <p className="text-gray-400">
                      Chargement des trades {viewMode === 'month' 
                        ? `pour ${monthOptions.find(m=>m.value === selectedMonth)?.label} ${selectedYear}`
                        : viewMode === 'year'
                        ? `pour l'année ${selectedYear}`
                        : 'du journal...'}
                    </p>
                </div>
            ) : isLoading && journalData.trades.length === 0 ? (
                 <div className="bg-red-900/30 text-red-300 p-4 rounded-md border border-red-700/50 text-center">
                    Erreur lors du chargement des données du journal : {journalData.error}
                 </div>
            ) : (
              <TradesTable 
                trades={filteredTrades} 
                onRowClick={handleRowClick} 
                onEdit={handleOpenEditModal}
                onDelete={handleOpenDeleteModal} 
              />
            )}


          </div>
          <p className="mt-8 mb-4 text-xs text-gray-500 text-center relative z-10 pointer-events-auto">
            YH Trading Journal &copy; {new Date().getFullYear()}
          </p>
        </div>

        <AddTradeModal
          isOpen={isAddModalOpen}
          onClose={handleAddModalClose}
          onDataNeedsRefresh={loadData}
          journalId={journal.id}
        />
        
        <EditTradeModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          trade={tradeToEdit!}
          assets={journalData.assets}
          sessions={journalData.sessions}
          setups={journalData.setups}
          onDataNeedsRefresh={loadData}
          journalId={journal.id}
        />

        <TradeDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={handleDetailsModalClose}
          trade={selectedTrade}
        />

        <DeleteTradeConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          tradeIdentifier={
            tradeToDelete
              ? `Trade du ${new Date(tradeToDelete.trade_date).toLocaleDateString()} sur ${tradeToDelete.asset_name || 'N/A'}`
              : null
          }
          isPending={isDeletingTrade}
        />
      </div>
    </>
  );
} 