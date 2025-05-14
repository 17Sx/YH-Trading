"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Trade } from '@/lib/actions/journal.actions';

interface SetupDistributionChartProps {
  trades: Trade[];
}

const COLORS = ['#7e5bef', '#ffffff'];

interface ChartData {
  name: string;
  value: number;
}

export function SetupDistributionChart({ trades }: SetupDistributionChartProps) {
  if (!trades || trades.length === 0) {
    return <div className="text-center text-gray-400 py-8">Aucune donnée pour afficher le graphique des setups.</div>;
  }

  const setupCounts: Record<string, number> = trades.reduce((acc, trade) => {
    const setupName = trade.setup_name || 'Non défini';
    acc[setupName] = (acc[setupName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData: ChartData[] = Object.entries(setupCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value); // Trier pour une meilleure lisibilité du PieChart

  return (
    <div className="bg-gray-800/70 p-4 rounded-lg shadow-xl backdrop-blur-md border border-gray-700/50 h-80">
      <h3 className="text-lg font-semibold text-purple-300 mb-4 text-center">Répartition des Setups</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#374151', border: '1px solid #4B5563', borderRadius: '0.375rem' }}
            itemStyle={{ color: '#D1D5DB' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
} 