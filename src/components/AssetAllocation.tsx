import { Card } from './ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Stocks', value: 45, color: '#3b82f6' },
  { name: 'Bonds', value: 25, color: '#10b981' },
  { name: 'Real Estate', value: 15, color: '#f59e0b' },
  { name: 'Crypto', value: 10, color: '#8b5cf6' },
  { name: 'Cash', value: 5, color: '#06b6d4' },
];

export function AssetAllocation() {
  return (
    <Card className="p-6 bg-white border-gray-200">
      <div className="mb-6">
        <h3 className="text-gray-900 mb-1">Asset Allocation</h3>
        <p className="text-gray-500 text-sm">Distribution of your investments</p>
      </div>

      <div className="flex justify-center mb-6">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
            <span className="text-sm text-gray-900">{item.value}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
