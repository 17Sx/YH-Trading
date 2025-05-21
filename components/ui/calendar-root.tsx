"use client";

import { useEffect, useState } from "react";
import { CalendarMonth } from "./calendar-month";
import { CalendarNavigation } from "./calendar-navigation";
import type { Trade } from "@/lib/actions/journal.actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Dither from "@/components/ui/Dither/Dither";
import { JournalSelector } from "@/components/journal/journal-selector";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import { fr } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

const PERIODS = [1, 3, 6, 12];

export function CalendarRoot() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = new Date();
  const [startDate, setStartDate] = useState(new Date(today.getFullYear(), 0, 1)); // 1er janvier de l'année en cours
  const [endDate, setEndDate] = useState(new Date(today.getFullYear(), 11, 31)); // 31 décembre de l'année en cours
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [journals, setJournals] = useState<{ id: string; name: string; }[]>([]);
  const [selectedJournalId, setSelectedJournalId] = useState<string | undefined>(searchParams.get('journalId') || undefined);
  const [isLoadingJournals, setIsLoadingJournals] = useState(true);

  const monthsToShow = (() => {
    const months = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      months.push({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth()
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return months;
  })();

  useEffect(() => {
    let isMounted = true;
    async function fetchJournals() {
      setIsLoadingJournals(true);
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: journalsData } = await supabase
        .from('journals')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (isMounted && journalsData) {
        setJournals(journalsData);
      }
      setIsLoadingJournals(false);
    }
    fetchJournals();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function fetchTrades() {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      const startStr = startDate.toISOString().slice(0, 10);
      const endStr = endDate.toISOString().slice(0, 10);

      let query = supabase
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
          created_at,
          journal_id
        `)
        .gte("trade_date", startStr)
        .lte("trade_date", endStr)
        .order("trade_date", { ascending: true });

      if (selectedJournalId) {
        query = query.eq('journal_id', selectedJournalId);
      }

      const { data, error } = await query;
      
      if (isMounted) {
        setTrades(error ? [] : (data as Trade[]));
        setLoading(false);
      }
    }
    fetchTrades();
    return () => { isMounted = false; };
  }, [startDate, endDate, selectedJournalId]);

  const handleJournalChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value !== "all") {
      params.set("journalId", value);
    } else {
      params.delete("journalId");
    }
    router.push(`/calendar?${params.toString()}`);
    setSelectedJournalId(value === "all" ? undefined : value);
  };

  const handlePeriodChange = (period: number) => {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 1);
    const end = new Date(today.getFullYear(), 11, 31); 
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <>
      <div className="relative min-h-screen selection:bg-purple-500 selection:text-white flex justify-center items-center w-full">
        <div className="absolute inset-0 z-0">
          <Dither waveColor={[0.494, 0.357, 0.937]} waveAmplitude={0.05} waveFrequency={0.5} pixelSize={1} colorNum={5} waveSpeed={0.1} enableMouseInteraction={true} mouseRadius={0.3} />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-start p-4 pt-10 md:pt-12 text-gray-100 pointer-events-auto min-h-screen w-full">
          <header className="mb-6 text-center md:text-left w-full max-w-7xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              Trade Calendar
            </h1>
            <p className="mt-1 text-base md:text-lg text-gray-300">Visualisez vos performances sur plusieurs mois.</p>
          </header>

          <div className="w-full max-w-screen-2xl mx-auto space-y-4">
            <div className="flex justify-end mb-4">
              {isLoadingJournals ? (
                <div className="w-[200px] h-10 bg-gray-800/70 border border-gray-700/50 rounded-md flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                </div>
              ) : (
                <JournalSelector 
                  journals={journals} 
                  selectedJournalId={selectedJournalId} 
                  showAllOption={true}
                  onJournalChange={handleJournalChange}
                />
                
              )}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-800/70 p-4 rounded-lg shadow-xl backdrop-blur-md border border-gray-700/50">
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2 relative z-[9999]">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => date && setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    maxDate={endDate}
                    dateFormat="dd/MM/yyyy"
                    locale={fr}
                    showMonthYearPicker
                    className="bg-gray-700 border border-gray-600 text-gray-200 px-3 py-1 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    popperClassName="z-[9999]"
                    popperPlacement="top-start"
                  />
                </div>
                <span className="text-gray-400">à</span>
                <div className="flex items-center gap-2 relative z-[9999]">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => date && setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    dateFormat="dd/MM/yyyy"
                    locale={fr}
                    showMonthYearPicker
                    className="bg-gray-700 border border-gray-600 text-gray-200 px-3 py-1 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    popperClassName="z-[9999]"
                    popperPlacement="top-start"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="w-full max-w-7xl h-96 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                  <span className="text-gray-400">Chargement des trades...</span>
                </div>
              </div>
            ) : (
              <div className="w-full overflow-x-auto pb-4">
                <div
                  className="grid gap-8 w-full min-w-[320px]"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(3, monthsToShow.length)}, minmax(0, 1fr))`,
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
            )}
          </div>

          <footer className="mt-auto pt-6 pb-2 text-xs text-gray-500 text-center relative z-10 pointer-events-auto w-full">
            YH Trading Journal &copy; {new Date().getFullYear()}
          </footer>
        </div>
      </div>
    </>
  );
}

function monthNameFr(month: number) {
  return [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ][month];
} 