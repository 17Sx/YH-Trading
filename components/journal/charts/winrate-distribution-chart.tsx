"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { Trade } from '@/lib/actions/journal.actions';

interface WinrateDistributionChartProps {
  trades: Trade[];
}

const WIN_COLOR = "#7e5bef"; // Orange moderne (ou mets #7e5bef pour violet)
const BG_COLOR = "#23272e";  // Gris foncé pour la partie restante

export function WinrateDistributionChart({ trades }: WinrateDistributionChartProps) {
  if (!trades || trades.length === 0) {
    return <div className="text-center text-gray-400 py-8">Aucune donnée pour afficher le winrate.</div>;
  }

  const numTP = trades.filter(t => t.profit_loss_amount > 0).length;
  const numSL = trades.filter(t => t.profit_loss_amount < 0).length;
  const winrate = (numTP + numSL) > 0 ? (numTP / (numTP + numSL)) * 100 : 0;
  
  // Données pour le donut : [partie win, partie restante]
  const data = [
    { name: "Win", value: winrate },
    { name: "Rest", value: 100 - winrate }
  ];

  return (
    <div className="relative flex items-center justify-center h-80 w-full md:w-56 mx-auto bg-gray-800/70 p-4 rounded-lg shadow-xl backdrop-blur-md border border-gray-700/50">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            startAngle={90}
            endAngle={-270}
            innerRadius={70}
            outerRadius={90}
            dataKey="value"
            stroke="none"
            isAnimationActive={false}
          >
            <Cell key="win" fill={WIN_COLOR} />
            <Cell key="rest" fill={BG_COLOR} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {/* Texte centré */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
        <span className="text-4xl font-bold text-white">{Math.round(winrate)}%</span>
        <span className="text-md text-gray-300 mt-1">Win rate</span>
      </div>
    </div>
  );
} 