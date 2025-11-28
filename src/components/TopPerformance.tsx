// /mnt/data/components/TopPerformance.tsx
import { Card } from './ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface StreamData {
  name: string;
  value: number;
  color: string;
}

interface TopPerformanceProps {
    streamData: StreamData[];
}

// Fallback colors for streams not listed in STREAM_COLORS in PortfolioChart
const FALLBACK_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#f59e0b', // orange
  '#10b981', // green
  '#8b5cf6', // purple
  '#06b6d4', // cyan
];

// Helper untuk mendapatkan warna berdasarkan index (jika tidak ada warna khusus)
function getStreamColor(index: number): string {
    return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}


export function TopPerformance({ streamData }: TopPerformanceProps) {
    
    // Siapkan data, pastikan value > 0 untuk ditampilkan
    const displayData = streamData
        .filter(item => item.value > 0)
        .map((item, index) => ({
            ...item,
            color: item.color || getStreamColor(index) // Gunakan warna yang sudah ada, atau fallback
        }));

    // Hitung total nilai untuk persentase
    const total = displayData.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card className="p-6 bg-white border-gray-200">
            <div className="mb-6">
                <h3 className="text-gray-900 mb-1">Top Stream Performance</h3>
                <p className="text-gray-500 text-sm">Income distribution by stream</p>
            </div>

            {displayData.length === 0 ? (
                 <div className="h-56 flex items-center justify-center text-gray-400">
                    No income stream data available for this period.
                 </div>
            ) : (
                <>
                    <div className="flex justify-center mb-6">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={displayData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {displayData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                        {displayData.map((item) => (
                            <div key={item.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    ></div>
                                    <span className="text-sm text-gray-600">{item.name}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                    Rp {item.value.toLocaleString('id-ID')} ({(item.value / total * 100).toFixed(1)}%)
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </Card>
    );
}

export default TopPerformance;