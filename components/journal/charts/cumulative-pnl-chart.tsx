"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Trade } from '@/lib/actions/journal.actions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CumulativePnlChartProps {
  trades: Trade[];
}

interface ChartData {
  date: string;         
  cumulativePnl: number; 
  tradePnl: number;      
}

export function CumulativePnlChart({ trades }: CumulativePnlChartProps) {
  if (!trades || trades.length === 0) {
    return <div className="text-center text-gray-400 py-8">Aucune donnée pour afficher la courbe de PnL.</div>;
  }

  const sortedTrades = [...trades].sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());

  let currentCumulativePnl = 0;
  const chartData: ChartData[] = sortedTrades.map((trade, index) => {
    currentCumulativePnl += trade.profit_loss_amount;
    return {
      date: format(new Date(trade.trade_date), 'dd MMM', { locale: fr }), 
      cumulativePnl: parseFloat(currentCumulativePnl.toFixed(2)),
      tradePnl: trade.profit_loss_amount,
    };
  });
  
  if (chartData.length > 0 && (sortedTrades[0].profit_loss_amount !== 0 || chartData[0].cumulativePnl !== sortedTrades[0].profit_loss_amount)) {
     const firstTradeDate = new Date(sortedTrades[0].trade_date);
     const startDate = new Date(firstTradeDate.setDate(firstTradeDate.getDate() -1));
      chartData.unshift({
        date: format(startDate, 'dd MMM', { locale: fr }),
        cumulativePnl: 0,
        tradePnl: 0,
      });
  } else if (chartData.length === 0) { 
     chartData.unshift({
        date: format(new Date(), 'dd MMM', { locale: fr }), // Date du jour par défaut je croit
        cumulativePnl: 0,
        tradePnl: 0,
      });
  }


  return (
    <div className="bg-gray-800/70 p-4 rounded-lg shadow-xl backdrop-blur-md border border-gray-700/50 h-96"> 
      <h3 className="text-lg font-semibold text-purple-300 mb-4 text-center">Courbe de PnL Cumulatif (%)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 20 }}> 
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} angle={-30} textAnchor="end" />
          <YAxis 
            tickFormatter={(value) => `${value}%`} 
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            domain={['auto', 'auto']} 
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#374151', border: '1px solid #4B5563', borderRadius: '0.375rem' }}
            itemStyle={{ color: '#D1D5DB' }}
            labelStyle={{ color: '#c7d2fe', fontWeight: 'bold' }}
            formatter={(value: number, name: string, props) => {
              if (name === "PnL Cumulatif") return [`${value.toFixed(2)}%`, "Cumulatif"];
              if (name === "PnL du Trade") return [`${props.payload.tradePnl.toFixed(2)}%`, "Trade"];
              return [`${value}`, name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          <Line 
            type="monotone" 
            dataKey="cumulativePnl" 
            name="PnL Cumulatif" 
            stroke="#7e5bef" 
            strokeWidth={2} 
            dot={{ r: 3, fill: '#7e5bef' }} 
            activeDot={{ r: 6, stroke: '#fff', fill: '#7e5bef' }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 