import { Card } from './ui/card';
import { TrendingUp } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

// Definisi Props untuk menerima data Net Profit yang sudah dihitung
interface NetProfitChartProps {
  netProfitData: number[]; // Array 12 bulan net profit
  monthlyLabels: string[]; // Array 12 label bulan (Jan, Feb, ...)
  currentYear: number;
}

export function NetProfitChart({ netProfitData, monthlyLabels, currentYear }: NetProfitChartProps) {
  
  const { formatCurrency, convertFromIDR } = useCurrency();
  
  // Kombinasikan label bulan dan data net profit
  const chartData = monthlyLabels.map((label, index) => ({
    month: label,
    'Net Profit (Income - Expense)': netProfitData[index] || 0,
  }));

  // Cek apakah ada data yang valid untuk ditampilkan
  const hasData = chartData.some(d => d['Net Profit (Income - Expense)'] !== 0);

  if (!hasData) {
    return (
      <Card className="p-6 bg-white border-gray-200 min-h-[380px] flex items-center justify-center">
        <p className="text-gray-500">No Net Profit data available for {currentYear}.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white border-gray-200">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          <h3 className="text-gray-900">Net Profit Trend</h3>
        </div>
        <p className="text-gray-500 text-sm">Monthly Net Profit (Income - Expense) — {currentYear}</p>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 6, right: 16, left: 0, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 12 }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 12 }} 
            tickFormatter={(v) => {
              // Format mata uang sederhana (1000 -> 1k)
              const absV = Math.abs(Number(v));
              const prefix = Number(v) < 0 ? '-' : '';
              if (absV >= 1000000) return `${prefix}${Math.round(absV/1000000)}m`;
              if (absV >= 1000) return `${prefix}${Math.round(absV/1000)}k`;
              return `${v}`;
            }} 
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatCurrency(Number(value)), String(name)]}
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
          />
          <Legend />

          <Line
            type="monotone"
            dataKey="Net Profit (Income - Expense)"
            stroke="#06b6d4" // Warna Cyan untuk Net Profit
            strokeWidth={2}
            dot={false}
            name="Net Profit" // Label yang akan muncul di Legend
          />
          
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}