// /components/PortfolioChart-lokal.tsx - Compact version for MetricCard slot (Props-based)
import { useMemo } from "react";
import { Card } from './ui/card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { BarChart3 } from 'lucide-react';

type Transaction = {
  id: string;
  type: string;
  date: string;
  category?: string;
  stream?: string;
  amount: number;
  note?: string;
  label?: string;
};

interface PortfolioChartProps {
  transactions: Transaction[];
}

// brand colors requested (normalized keys are uppercased)
const STREAM_COLORS: Record<string, string> = {
  LINE: '#06C755',    // LINE green
  ETSY: '#F16521',    // Etsy orange
  STIPOP: '#FF4E59',  // Stipop red
  MOJITOK: '#8B5CF6', // Mojitok indigo/pastel
};

// fallback palette for other streams
const FALLBACK_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#f59e0b', // orange
  '#10b981', // green
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // amber
  '#6366f1', // indigo
];

// produce months Jan → Dec for given year (default now)
function yearMonths(year?: number) {
  const y = year ?? new Date().getFullYear();
  const arr: { key: string; label: string }[] = [];
  for (let m = 0; m < 12; m++) {
    const d = new Date(y, m, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
    const label = d.toLocaleString('default', { month: 'short' }); // "Jan", "Feb", ...
    arr.push({ key, label });
  }
  return arr;
}

export function PortfolioChart({ transactions }: PortfolioChartProps) {
  const currentYear = new Date().getFullYear();
  const months = useMemo(() => yearMonths(currentYear), [currentYear]);

  // build per-stream series (months fixed Jan..Dec)
  const { chartData, streams } = useMemo(() => {
    const monthKeys = months.map(m => m.key); // YYYY-MM for Jan..Dec
    const streamMap: Record<string, Record<string, number>> = {};

    // Process transactions
    transactions.forEach(tx => {
      if ((tx.type || '').toLowerCase() !== 'income') return;
      const stream = (tx.stream || '').trim();
      if (!stream) return;
      
      // parse month key from tx.date
      let dt = new Date(tx.date);
      if (isNaN(dt.getTime())) {
        const m = String(tx.date || '').match(/^(\d{4}-\d{2})/);
        if (m) dt = new Date(m[1] + '-01');
      }
      if (isNaN(dt.getTime())) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthKeys.includes(key)) return;

      if (!streamMap[stream]) streamMap[stream] = {};
      streamMap[stream][key] = (streamMap[stream][key] || 0) + Number(tx.amount || 0);
    });

    const streamList = Object.keys(streamMap).sort((a, b) => {
      const sa = Object.values(streamMap[a] || {}).reduce((s, v) => s + v, 0);
      const sb = Object.values(streamMap[b] || {}).reduce((s, v) => s + v, 0);
      return sb - sa;
    });

    const rows = months.map(m => {
      const row: Record<string, any> = { month: m.label, key: m.key };
      streamList.forEach(s => {
        row[s] = Math.round(streamMap[s]?.[m.key] || 0);
      });
      return row;
    });

    return { chartData: rows, streams: streamList };
  }, [transactions, months]);

  const streamColors = useMemo(() => {
    const out: Record<string, string> = {};
    let fallbackIndex = 0;
    streams.forEach(s => {
      const up = s.toString().toUpperCase();
      if (STREAM_COLORS[up]) out[s] = STREAM_COLORS[up];
      else {
        out[s] = FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length];
        fallbackIndex++;
      }
    });
    return out;
  }, [streams]);

  // Calculate month-over-month change
  const changeData = useMemo(() => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    const currentRow = chartData.find(r => r.key === currentMonthKey);
    const prevRow = chartData.find(r => r.key === prevMonthKey);

    if (!currentRow || !prevRow) {
      return { text: 'N/A', type: 'neutral' as const };
    }

    // Sum all streams for both months
    const currentTotal = streams.reduce((sum, s) => sum + (currentRow[s] || 0), 0);
    const prevTotal = streams.reduce((sum, s) => sum + (prevRow[s] || 0), 0);

    if (prevTotal === 0) {
      if (currentTotal > 0) return { text: '+100%', type: 'positive' as const };
      return { text: '0%', type: 'neutral' as const };
    }

    const change = ((currentTotal - prevTotal) / prevTotal) * 100;
    const sign = change >= 0 ? '+' : '';
    return {
      text: `${sign}${change.toFixed(1)}%`,
      type: change >= 0 ? 'positive' as const : 'negative' as const
    };
  }, [chartData, streams]);

  // No data state
  if (chartData.length === 0 || streams.length === 0) {
    return (
      <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-full flex flex-col">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center text-white">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm">No stream data</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Header with icon and percentage badge like MetricCard */}
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${
          changeData.type === 'positive' 
            ? 'bg-green-500' 
            : changeData.type === 'negative'
            ? 'bg-red-500'
            : 'bg-gray-500'
        }`}>
          <BarChart3 className="w-5 h-5" />
        </div>
        <span className={`px-2 py-1 rounded text-sm ${
          changeData.type === 'positive' 
            ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
            : changeData.type === 'negative'
            ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            : 'bg-gray-50 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400'
        }`}>
          {changeData.text}
        </span>
      </div>

      {/* Chart Area - with min-height to ensure visibility */}
      <div className="flex-1 min-h-[100px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9ca3af', fontSize: 10 }} 
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9ca3af', fontSize: 10 }} 
              tickFormatter={(v) => {
                if (Math.abs(Number(v)) >= 1000000) return `${Math.round(Number(v)/1000000)}M`;
                if (Math.abs(Number(v)) >= 1000) return `${Math.round(Number(v)/1000)}k`;
                return `${v}`;
              }} 
            />
            <Tooltip
              formatter={(value: number, name: string) => [`Rp ${Number(value).toLocaleString('id-ID')}`, String(name)]}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 11 }}
            />

            {/* Per-stream lines */}
            {streams.map((s) => (
              <Line
                key={s}
                type="monotone"
                dataKey={s}
                stroke={streamColors[s]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
                connectNulls={true}
              />
            ))}

          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default PortfolioChart;
