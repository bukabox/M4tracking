import { Card } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const data = [
  { month: 'Jan', current: 50000, previous: 48000 },
  { month: 'Feb', current: 52000, previous: 49000 },
  { month: 'Mar', current: 49000, previous: 50000 },
  { month: 'Apr', current: 58000, previous: 52000 },
  { month: 'May', current: 61000, previous: 55000 },
  { month: 'Jun', current: 65000, previous: 58000 },
  { month: 'Jul', current: 70000, previous: 62000 },
  { month: 'Aug', current: 75000, previous: 68000 },
  { month: 'Sep', current: 82000, previous: 75000 },
  { month: 'Oct', current: 90000, previous: 82000 },
];

export function PortfolioChart() {
  return (
    <Card className="p-6 bg-white border-gray-200">
      <div className="mb-6">
        <h3 className="text-gray-900 mb-1">Portfolio Performance</h3>
        <p className="text-gray-500 text-sm">Your portfolio growth over time</p>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-sm text-gray-600">Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          <span className="text-sm text-gray-600">Previous</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
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
            tickFormatter={(value) => `${value / 1000}k`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value: number) => `$${value.toLocaleString()}`}
          />
          <Line 
            type="monotone" 
            dataKey="previous" 
            stroke="#d1d5db" 
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5"
          />
          <Area 
            type="monotone" 
            dataKey="current" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fill="url(#colorCurrent)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
