import { CumulativePnlChart } from "@/components/journal/charts/cumulative-pnl-chart";
import { MonthlyPnlBarChart, type MonthlyPnlData } from "@/components/journal/charts/monthly-pnl-bar-chart";
import { getTrades } from "@/lib/actions/journal.actions";
import type { Trade } from "@/lib/actions/journal.actions";
import { BuildingStorefrontIcon, ChartBarIcon, PresentationChartLineIcon, ScaleIcon } from "@heroicons/react/24/outline";
import Dither from "@/components/ui/Dither/Dither";
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { JournalSelector } from "@/components/journal/journal-selector";

interface GlobalStats {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  averagePnl: number;
  winningTradesCount: number;
  losingTradesCount: number;
  breakevenTradesCount: number;
  averageWinningTrade: number;
  averageLosingTrade: number;
  profitFactor: number | null;
}

function calculateGlobalStats(trades: Trade[]): GlobalStats {
  if (!trades || trades.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      totalPnl: 0,
      averagePnl: 0,
      winningTradesCount: 0,
      losingTradesCount: 0,
      breakevenTradesCount: 0,
      averageWinningTrade: 0,
      averageLosingTrade: 0,
      profitFactor: null,
    };
  }

  const winningTrades = trades.filter(trade => trade.profit_loss_amount > 0);
  const losingTrades = trades.filter(trade => trade.profit_loss_amount < 0);
  const breakevenTrades = trades.filter(trade => trade.profit_loss_amount === 0);

  const totalPnl = trades.reduce((sum, trade) => sum + trade.profit_loss_amount, 0);
  const averagePnl = trades.length > 0 ? totalPnl / trades.length : 0;
  
  const nonBreakevenTradesCount = winningTrades.length + losingTrades.length;
  const winRate = nonBreakevenTradesCount > 0 ? (winningTrades.length / nonBreakevenTradesCount) * 100 : 0;

  const totalGrossProfit = winningTrades.reduce((sum, trade) => sum + trade.profit_loss_amount, 0);
  const totalGrossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profit_loss_amount, 0));

  const averageWinningTrade = winningTrades.length > 0 ? totalGrossProfit / winningTrades.length : 0;
  const averageLosingTrade = losingTrades.length > 0 ? totalGrossLoss / losingTrades.length : 0; 

  const profitFactor = totalGrossLoss > 0 ? totalGrossProfit / totalGrossLoss : null;

  return {
    totalTrades: trades.length,
    winRate: parseFloat(winRate.toFixed(2)),
    totalPnl: parseFloat(totalPnl.toFixed(2)),
    averagePnl: parseFloat(averagePnl.toFixed(2)),
    winningTradesCount: winningTrades.length,
    losingTradesCount: losingTrades.length,
    breakevenTradesCount: breakevenTrades.length,
    averageWinningTrade: parseFloat(averageWinningTrade.toFixed(2)),
    averageLosingTrade: parseFloat(averageLosingTrade.toFixed(2)),
    profitFactor: profitFactor !== null ? parseFloat(profitFactor.toFixed(2)) : null,
  };
}

function calculateMonthlyPnl(trades: Trade[]): MonthlyPnlData[] {
  if (!trades || trades.length === 0) return [];

  const monthlyData: { [key: string]: number } = {};

  trades.forEach(trade => {
    try {
      const tradeDate = parseISO(trade.trade_date);
      const monthYearKey = format(tradeDate, 'yyyy-MM');
      monthlyData[monthYearKey] = (monthlyData[monthYearKey] || 0) + trade.profit_loss_amount;
    } catch (error) {
      console.error("Error parsing trade_date:", trade.trade_date, error);
    }
  });

  const frMonthMap: { [key: string]: number } = {
    'janv.': 0, 'févr.': 1, 'mars': 2, 'avr.': 3, 'mai': 4, 'juin': 5,
    'juil.': 6, 'août': 7, 'sept.': 8, 'oct.': 9, 'nov.': 10, 'déc.': 11
  };

  return Object.entries(monthlyData)
    .map(([monthYearKey, pnl]) => ({
      monthYear: format(parseISO(monthYearKey + '-01'), 'MMM yy', { locale: fr }),
      pnl: parseFloat(pnl.toFixed(2)),
    }))
    .sort((a, b) => {
      const [aMonthStr, aYearNum] = a.monthYear.split(' ');
      const [bMonthStr, bYearNum] = b.monthYear.split(' ');

      const aMonthIndex = frMonthMap[aMonthStr.toLowerCase()] ?? -1;
      const bMonthIndex = frMonthMap[bMonthStr.toLowerCase()] ?? -1;

      const dateA = new Date(parseInt(`20${aYearNum}`), aMonthIndex, 1);
      const dateB = new Date(parseInt(`20${bYearNum}`), bMonthIndex, 1);
      
      return dateA.getTime() - dateB.getTime();
    });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { journalId?: string };
}) {
  const primaryAccentRGB: [number, number, number] = [0.494, 0.357, 0.937];
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: journals, error: journalsError } = await supabase
    .from('journals')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (journalsError) {
    return (
      <div className="relative min-h-screen selection:bg-purple-500 selection:text-white">
        <div className="absolute inset-0 z-0">
          <Dither waveColor={primaryAccentRGB} waveAmplitude={0.05} waveFrequency={0.5} pixelSize={1} colorNum={5} waveSpeed={0.1} enableMouseInteraction={true} mouseRadius={0.3} />
        </div>
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 text-gray-100">
          <div className="p-4 text-center text-red-400 bg-red-900/30 rounded-lg border border-red-700/50">Erreur lors de la récupération des journaux: {journalsError.message}</div>
        </div>
      </div>
    );
  }

  if (!journals || journals.length === 0) {
    return (
      <div className="relative min-h-screen selection:bg-purple-500 selection:text-white">
        <div className="absolute inset-0 z-0">
          <Dither waveColor={primaryAccentRGB} waveAmplitude={0.05} waveFrequency={0.5} pixelSize={1} colorNum={5} waveSpeed={0.1} enableMouseInteraction={true} mouseRadius={0.3} />
        </div>
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 text-gray-100">
          <div className="p-4 text-center text-gray-400 bg-gray-800/70 rounded-lg border border-gray-700/50">Aucun journal trouvé. Veuillez créer un journal pour commencer.</div>
        </div>
      </div>
    );
  }

  let trades: Trade[] = [];
  let tradesError: string | undefined;

  if (searchParams.journalId) {
    const result = await getTrades(searchParams.journalId);
    trades = result.trades;
    tradesError = result.error;
  } else {
    const allTradesPromises = journals.map(journal => getTrades(journal.id));
    const allTradesResults = await Promise.all(allTradesPromises);
    
    trades = allTradesResults.flatMap(result => result.trades);
    tradesError = allTradesResults.find(result => result.error)?.error;
  }

  if (tradesError) {
    return (
      <div className="relative min-h-screen selection:bg-purple-500 selection:text-white">
        <div className="absolute inset-0 z-0">
          <Dither waveColor={primaryAccentRGB} waveAmplitude={0.05} waveFrequency={0.5} pixelSize={1} colorNum={5} waveSpeed={0.1} enableMouseInteraction={true} mouseRadius={0.3} />
        </div>
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 text-gray-100">
          <div className="p-4 text-center text-red-400 bg-red-900/30 rounded-lg border border-red-700/50">Erreur lors de la récupération des trades: {tradesError}</div>
        </div>
      </div>
    );
  }

  const stats = calculateGlobalStats(trades);
  const monthlyPnl = calculateMonthlyPnl(trades);
  const pnlSuffix = '%';

  return (
    <div className="relative min-h-screen selection:bg-purple-500 selection:text-white">
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

      <div className="relative z-10 flex flex-col items-center justify-start p-4 pt-10 md:pt-12 text-gray-100 pointer-events-none min-h-screen">
        <div className="w-full max-w-7xl space-y-6 bg-transparent p-0 md:p-4 pointer-events-auto flex flex-col flex-grow">
          <header className="mb-4 flex flex-col md:flex-row items-center justify-between text-left">

            <div className="flex flex-col">

            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              Dashboard Global
            </h1>
            <p className="mt-1 text-base md:text-lg text-gray-300">Vue d'ensemble de vos performances de trading.</p>

            </div>

            <div className="flex items-center justify-end">

            <JournalSelector 
              journals={journals} 
              selectedJournalId={searchParams.journalId} 
              showAllOption={true}
            />

          </div>

          </header>


          <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            <StatCard title="Trades Totaux" value={stats.totalTrades.toString()} icon={<BuildingStorefrontIcon className="h-6 w-6 md:h-7 md:w-7 text-purple-400" />} />
            <StatCard title="Winrate" value={`${stats.winRate.toFixed(2)}${pnlSuffix}`} icon={<ChartBarIcon className="h-6 w-6 md:h-7 md:w-7 text-purple-400" />} />
            <StatCard title="Performance Total" value={`${stats.totalPnl.toFixed(2)}${stats.totalPnl !== 0 ? pnlSuffix : ''}`} icon={<ScaleIcon className="h-6 w-6 md:h-7 md:w-7 text-purple-400" />} />
            <StatCard title="PnL Moyen/Trade" value={`${stats.averagePnl.toFixed(2)}${stats.averagePnl !== 0 ? pnlSuffix : ''}`} icon={<PresentationChartLineIcon className="h-6 w-6 md:h-7 md:w-7 text-purple-400" />} />
            <StatCard title="Gagnants (TP)" value={stats.winningTradesCount.toString()} />
            <StatCard title="Perdants (SL)" value={stats.losingTradesCount.toString()} />
            <StatCard title="Neutres (BE)" value={stats.breakevenTradesCount.toString()} />
            <StatCard title="Gain Moyen" value={`${stats.averageWinningTrade.toFixed(2)}${stats.averageWinningTrade !== 0 ? pnlSuffix : ''}`} />
            <StatCard title="Perte Moyenne" value={`${stats.averageLosingTrade.toFixed(2)}${stats.averageLosingTrade !== 0 ? pnlSuffix : ''}`} />
            <StatCard title="Profit factor" value={stats.profitFactor !== null ? stats.profitFactor.toFixed(2) : "N/A"} />
          </section>
          
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 flex-grow">
            <div className="lg:col-span-1 h-90">
              {trades && trades.length > 0 ? (
                <CumulativePnlChart trades={trades} />
              ) : (
                <div className="bg-gray-800/70 p-4 rounded-lg shadow-xl backdrop-blur-md border border-gray-700/50 h-full flex items-center justify-center">
                  <p className="text-gray-400">Données insuffisantes pour le graphique PnL.</p>
                </div>
              )}
            </div>
            <div className="lg:col-span-1 h-90">
              {trades && trades.length > 0 ? (
                <MonthlyPnlBarChart data={monthlyPnl} currencySuffix={pnlSuffix} />
              ) : (
                <div className="bg-gray-800/70 p-4 rounded-lg shadow-xl backdrop-blur-md border border-gray-700/50 h-full flex items-center justify-center">
                  <p className="text-gray-400">Données insuffisantes pour le PnL mensuel.</p>
                </div>
              )}
            </div>
          </section>

          <footer className="mt-auto pt-6 pb-2 text-xs text-gray-500 text-center relative z-10 pointer-events-auto">
            YH Trading Journal &copy; {new Date().getFullYear()}
          </footer>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="bg-gray-800/70 p-3 md:p-4 rounded-lg shadow-xl backdrop-blur-md border border-gray-700/50 
                   flex flex-col justify-between min-h-[80px] md:min-h-[90px] 
                   transition-all duration-300 ease-in-out 
                   hover:scale-105 hover:border-purple-500/80 hover:shadow-lg hover:shadow-purple-500/30">
      <div className="flex items-start justify-between">
        <p className="text-xs md:text-sm text-gray-400 mb-1">{title}</p>
        {icon && (
          <div className="p-1 bg-purple-500/10 rounded-md transition-colors duration-300 group-hover:bg-purple-500/20">
            {icon} 
          </div>
        )}
      </div>
      <p className="text-lg md:text-xl font-semibold text-white">{value}</p>
    </div>
  );
} 