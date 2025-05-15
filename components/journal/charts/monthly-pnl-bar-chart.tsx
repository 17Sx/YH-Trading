"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface MonthlyPnlData {
  monthYear: string; 
  pnl: number;
}

interface MonthlyPnlBarChartProps {
  data: MonthlyPnlData[];
  currencySuffix?: string; 
}

const CustomTooltip = ({ active, payload, label, currencySuffix }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-700/80 p-3 rounded-md shadow-lg backdrop-blur-sm border border-gray-600/50">
        <p className="label text-sm text-purple-300">{`${label}`}</p>
        <p className="intro text-white font-semibold">{`PnL: ${payload[0].value.toFixed(2)}${currencySuffix || '%'}`}</p>
      </div>
    );
  }
  return null;
};

export function MonthlyPnlBarChart({ data, currencySuffix = '%' }: MonthlyPnlBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8 h-full flex items-center justify-center">
        Aucune donnée mensuelle à afficher.
      </div>
    );
  }

  return (
    <div className="bg-gray-800/70 p-4 rounded-lg shadow-xl backdrop-blur-md border border-gray-700/50 min-h-[350px]">
      <h3 className="text-lg font-semibold text-purple-300 mb-4 text-center">Performance Mensuel</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={data} 
          margin={{ top: 5, right: 10, left: -25, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis 
            dataKey="monthYear" 
            tick={{ fontSize: 10, fill: '#9ca3af' }} 
            angle={-30} 
            textAnchor="end"
            interval={0} 
          />
          <YAxis 
            tickFormatter={(value) => `${value.toFixed(0)}${currencySuffix}`} 
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip currencySuffix={currencySuffix} />} cursor={{ fill: 'rgba(126, 91, 239, 0.1)' }} />
          <Bar dataKey="pnl" name="PnL Mensuel">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#7e5bef'  : '#F87171' } />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 