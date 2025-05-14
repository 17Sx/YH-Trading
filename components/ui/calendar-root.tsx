"use client";

import { useEffect, useState } from "react";
import { CalendarMonth } from "./calendar-month";
import { CalendarNavigation } from "./calendar-navigation";
import type { Trade } from "@/lib/actions/journal.actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Dither from "@/components/ui/Dither/Dither";

const PERIODS = [1, 3, 6, 12];

export function CalendarRoot() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0 = janvier
  const [period, setPeriod] = useState(1); // nombre de mois affichés
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  // Calcule la plage de mois à afficher
  const monthsToShow = Array.from({ length: period }, (_, i) => {
    const d = new Date(year, month - (period - 1) + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchTrades() {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      // Calcule la plage de dates à récupérer
      const first = new Date(monthsToShow[0].year, monthsToShow[0].month, 1);
      const last = new Date(monthsToShow[monthsToShow.length - 1].year, monthsToShow[monthsToShow.length - 1].month + 1, 0);
      const startStr = first.toISOString().slice(0, 10);
      const endStr = last.toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("trades")
        .select(`
          id,
          trade_date,
          asset_id,
          session_id,
          setup_id,
          risk_input,
          profit_loss_amount,
          tradingview_link,
          notes,
          created_at
        `)
        .gte("trade_date", startStr)
        .lte("trade_date", endStr)
        .order("trade_date", { ascending: true });
      if (isMounted) {
        setTrades(error ? [] : (data as Trade[]));
        setLoading(false);
      }
    }
    fetchTrades();
    return () => { isMounted = false; };
  }, [year, month, period]);

  // Navigation multi-mois (avance/recul d'une tranche entière)
  function prevPeriod() {
    const d = new Date(year, month - period, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }
  function nextPeriod() {
    const d = new Date(year, month + period, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  return (
    <div className="relative min-h-screen selection:bg-purple-500 selection:text-white flex justify-center items-center w-full">
      <div className="absolute inset-0 z-0">
        <Dither waveColor={[0.494, 0.357, 0.937]} waveAmplitude={0.05} waveFrequency={0.5} pixelSize={1} colorNum={5} waveSpeed={0.1} enableMouseInteraction={true} mouseRadius={0.3} />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-start p-4 pt-10 md:pt-12 text-gray-100 pointer-events-auto min-h-screen w-11/12">
        <header className="mb-6 text-center md:text-left w-full max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Trade Calendar
          </h1>
          <p className="mt-1 text-base md:text-lg text-gray-300">Visualisez vos performances sur plusieurs mois.</p>
        </header>
        <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-7xl mb-6 gap-4">
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-full font-semibold border transition-all duration-200
                  ${period === p ? "bg-purple-500 text-white border-purple-400 shadow-lg" : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-purple-700/30"}`}
                aria-pressed={period === p}
              >
                {p} mois
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={prevPeriod}
              aria-label="Période précédente"
              className="px-2 py-1 rounded bg-gray-800 hover:bg-purple-700/60 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {"<"}
            </button>
            <span className="font-bold text-lg min-w-[120px] text-center">
              {monthsToShow.length === 1
                ? `${monthNameFr(monthsToShow[0].month)} ${monthsToShow[0].year}`
                : `${monthNameFr(monthsToShow[0].month)} ${monthsToShow[0].year} - ${monthNameFr(monthsToShow[monthsToShow.length - 1].month)} ${monthsToShow[monthsToShow.length - 1].year}`}
            </span>
            <button
              onClick={nextPeriod}
              aria-label="Période suivante"
              className="px-2 py-1 rounded bg-gray-800 hover:bg-purple-700/60 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {">"}
            </button>
          </div>
        </div>
        {loading ? (
          <div className="w-full max-w-7xl h-96 flex items-center justify-center">
            <span className="text-gray-500 animate-pulse">Chargement...</span>
          </div>
        ) : (
          period === 1 ? (
            <div className="flex justify-center w-full">
              <div className="bg-gray-800/70 p-3 md:p-4 rounded-lg shadow-xl backdrop-blur-md border border-gray-700/50 flex flex-col min-w-[260px] max-w-md w-full">
                <h2 className="text-lg font-semibold mb-2 text-purple-400 text-center">
                  {monthNameFr(monthsToShow[0].month)} {monthsToShow[0].year}
                </h2>
                <CalendarMonth
                  year={monthsToShow[0].year}
                  month={monthsToShow[0].month}
                  trades={trades.filter(t => {
                    const d = new Date(t.trade_date);
                    return d.getFullYear() === monthsToShow[0].year && d.getMonth() === monthsToShow[0].month;
                  })}
                />
              </div>
            </div>
          ) : (
            <div className="w-full overflow-x-auto pb-4">
              <div
                className={`grid gap-8 w-full min-w-[320px]`}
                style={{
                  gridTemplateColumns:
                    period === 3
                      ? "repeat(3, minmax(0, 1fr))"
                      : period === 6
                      ? "repeat(3, minmax(0, 1fr))"
                      : period === 12
                      ? "repeat(4, minmax(0, 1fr))"
                      : `repeat(${monthsToShow.length}, minmax(0, 1fr))`,
                }}
              >
                {monthsToShow.map(({ year, month }) => (
                  <div key={`${year}-${month}`} className="bg-gray-800/70 p-3 md:p-4 rounded-lg shadow-xl backdrop-blur-md border border-gray-700/50 flex flex-col min-w-[260px]">
                    <h2 className="text-lg font-semibold mb-2 text-purple-400 text-center">
                      {monthNameFr(month)} {year}
                    </h2>
                    <CalendarMonth
                      year={year}
                      month={month}
                      trades={trades.filter(t => {
                        const d = new Date(t.trade_date);
                        return d.getFullYear() === year && d.getMonth() === month;
                      })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        )}
        <footer className="mt-auto pt-6 pb-2 text-xs text-gray-500 text-center relative z-10 pointer-events-auto w-full">
          YH Trading Journal &copy; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}

function monthNameFr(month: number) {
  return [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ][month];
} 