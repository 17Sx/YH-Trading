"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { Trade } from '@/lib/actions/journal.actions';

interface SetupPerformanceChartProps {
  trades: Trade[];
}

interface ChartData {
  name: string; // Setup name
  pnl: number;   // Total PnL for this setup
}

const COLORS = ['#7e5bef', '#ffff'];

export function SetupPerformanceChart({ trades }: SetupPerformanceChartProps) {
  if (!trades || trades.length === 0) {
    return <div className="text-center text-gray-400 py-8">Aucune donnée pour afficher la performance des setups.</div>;
  }

  const performanceBySetup: Record<string, number> = trades.reduce((acc, trade) => {
    const setupName = trade.setup_name || 'Non défini';
    acc[setupName] = (acc[setupName] || 0) + trade.profit_loss_amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData: ChartData[] = Object.entries(performanceBySetup)
    .map(([name, pnl]) => ({ name, pnl }))
    .sort((a, b) => b.pnl - a.pnl); // Trier par PnL décroissant

  return (
    <div className="bg-gray-800/70 p-4 rounded-lg shadow-xl backdrop-blur-md border border-gray-700/50 h-80">
      <h3 className="text-lg font-semibold text-purple-300 mb-4 text-center">Performance par Setup (% PnL)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}> {/* Ajustement des marges */}
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} />
          <YAxis tickFormatter={(value) => `${value}%`} tick={{ fontSize: 12, fill: '#9ca3af' }} />
          <Tooltip
            cursor={{ fill: 'rgba(126, 91, 239, 0.1)' }}
            contentStyle={{ backgroundColor: '#374151', border: '1px solid #4B5563', borderRadius: '0.375rem' }}
            itemStyle={{ color: '#D1D5DB' }}
            formatter={(value: number) => [`${value.toFixed(2)}%`, "PnL Total"]}
          />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          <Bar dataKey="pnl" name="PnL Total par Setup"  >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? COLORS[0] : '#ef4444'} /> // Purple si positif, rouge si négatif
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 