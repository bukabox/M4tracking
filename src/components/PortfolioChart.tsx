// /mnt/data/PortfolioChart.tsx
import { useEffect, useMemo, useState } from "react";
import { Card } from './ui/card';
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

type Tx = {
  id: string;
  type: string;
  date: string;
  category?: string;
  stream?: string;
  amount: number;
  note?: string;
};

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

export function PortfolioChart() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  // fix chart year to current year
  const currentYear = new Date().getFullYear();
  const months = useMemo(() => yearMonths(currentYear), [currentYear]);

  useEffect(() => {
    let mounted = true;
    const fetchTx = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch('/api/transactions');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        if (!mounted) return;
        const mapped: Tx[] = (j || []).map((t: any) => ({
          id: String(t.id),
          type: String(t.type || '').toLowerCase(),
          date: t.date || t.datetime || '',
          category: t.category ?? t.label ?? '',
          stream: (t.stream ?? '').toString(),
          amount: Number(t.amount ?? t.amount_idr ?? 0),
          note: t.note ?? '',
        }));
        setTransactions(mapped);
      } catch (e: any) {
        if (mounted) setErr(String(e?.message ?? e));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchTx();
    const iv = setInterval(fetchTx, 60_000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  // build per-stream series (months fixed Jan..Dec)
  const { chartData, streams } = useMemo(() => {
    const monthKeys = months.map(m => m.key); // YYYY-MM for Jan..Dec
    const streamMap: Record<string, Record<string, number>> = {};

    // initialize zero values so each stream has entries for all months
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

    // ensure streams that had no transactions still don't appear.
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

  if (loading) {
    return (
      <Card className="p-6 bg-white border-gray-200">
        <div className="mb-6">
          <h3 className="text-gray-900 mb-1">Revenue Performance</h3>
          <p className="text-gray-500 text-sm">Income by stream (yearly)</p>
        </div>
        <div className="py-16 text-center text-gray-500">Loading chart…</div>
      </Card>
    );
  }

  if (err) {
    return (
      <Card className="p-6 bg-white border-gray-200">
        <div className="mb-6">
          <h3 className="text-gray-900 mb-1">Revenue Performance</h3>
          <p className="text-gray-500 text-sm">Income by stream (yearly)</p>
        </div>
        <div className="py-16 text-center text-red-600">Error loading chart: {err}</div>
      </Card>
    );
  }

  if (chartData.length === 0 || streams.length === 0) {
    return (
      <Card className="p-6 bg-white border-gray-200">
        <div className="mb-6">
          <h3 className="text-gray-900 mb-1">Revenue Performance</h3>
          <p className="text-gray-500 text-sm">Income by stream — {currentYear}</p>
        </div>
        <div className="py-16 text-center text-gray-500">No income-with-stream data available for this year.</div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white border-gray-200">
      <div className="mb-6">
        <h3 className="text-gray-900 mb-1">Revenue Performance</h3>
        <p className="text-gray-500 text-sm">Income by stream — {currentYear}</p>
      </div>

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {streams.map((s) => (
          <div key={s} className="flex items-center gap-2 mr-4">
            <div style={{ width: 10, height: 10, background: streamColors[s] }} />
            <span className="text-sm text-gray-600">{s}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 6, right: 16, left: 0, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(v) => {
            if (Math.abs(Number(v)) >= 1000) return `${Math.round(Number(v)/1000)}k`;
            return `${v}`;
          }} />
          <Tooltip
            formatter={(value: number, name: string) => [`Rp ${Number(value).toLocaleString('id-ID')}`, String(name)]}
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
          />
          <Legend />

          {/* Per-stream lines */}
          {streams.map((s) => (
            <Line
              key={s}
              type="monotone"
              dataKey={s}
              stroke={streamColors[s]}
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
              connectNulls={true}
            />
          ))}

        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export default PortfolioChart;
