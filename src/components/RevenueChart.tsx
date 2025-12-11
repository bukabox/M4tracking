import { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Calendar, CalendarDays, CalendarRange } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'investment';
  date: string;
  amount: number;
  label?: string;
  category?: string;
  stream?: string;
}

interface RevenueChartProps {
  monthlyLabels: string[];
  incomeArr: number[];
  transactions: Transaction[];
  currentYear?: number;
}

type PeriodType = 'daily' | 'weekly' | 'monthly';

export function RevenueChart({ 
  monthlyLabels, 
  incomeArr, 
  transactions,
  currentYear = new Date().getFullYear() 
}: RevenueChartProps) {
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');

  // Calculate chart data based on period type
  const chartData = useMemo(() => {
    const incomeTransactions = transactions.filter(tx => tx.type === 'income');

    if (periodType === 'monthly') {
      return monthlyLabels.map((label, index) => ({
        label: label,
        revenue: incomeArr[index] || 0,
      }));
    } else if (periodType === 'weekly') {
      // Group by week (last 12 weeks)
      const weeks: { [key: string]: number } = {};
      const now = new Date();
      
      // Initialize last 12 weeks
      for (let i = 11; i >= 0; i--) {
        const weekDate = new Date(now);
        weekDate.setDate(weekDate.getDate() - (i * 7));
        const weekStart = new Date(weekDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
        const weekKey = `Week ${12 - i}`;
        weeks[weekKey] = 0;
      }

      // Aggregate transactions by week
      incomeTransactions.forEach(tx => {
        const txDate = new Date(tx.date);
        const diffTime = now.getTime() - txDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const weekIndex = Math.floor(diffDays / 7);
        
        if (weekIndex < 12 && weekIndex >= 0) {
          const weekKey = `Week ${12 - weekIndex}`;
          weeks[weekKey] = (weeks[weekKey] || 0) + tx.amount;
        }
      });

      return Object.entries(weeks).map(([label, revenue]) => ({
        label,
        revenue,
      }));
    } else {
      // Daily - last 30 days
      const days: { [key: string]: number } = {};
      const now = new Date();
      
      // Initialize last 30 days
      for (let i = 29; i >= 0; i--) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        const month = String(day.getMonth() + 1).padStart(2, '0');
        const date = String(day.getDate()).padStart(2, '0');
        const dayKey = `${month}-${date}`;
        days[dayKey] = 0;
      }

      // Aggregate transactions by day
      incomeTransactions.forEach(tx => {
        const txDate = new Date(tx.date);
        const diffTime = now.getTime() - txDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 30 && diffDays >= 0) {
          const month = String(txDate.getMonth() + 1).padStart(2, '0');
          const date = String(txDate.getDate()).padStart(2, '0');
          const dayKey = `${month}-${date}`;
          days[dayKey] = (days[dayKey] || 0) + tx.amount;
        }
      });

      return Object.entries(days).map(([label, revenue]) => ({
        label,
        revenue,
      }));
    }
  }, [periodType, monthlyLabels, incomeArr, transactions]);

  // Calculate total revenue based on current period
  const totalRevenue = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.revenue, 0);
  }, [chartData]);

  // Format currency for display
  const formatIDR = (value: number) => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toFixed(0);
  };

  const formatTooltipIDR = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getPeriodLabel = () => {
    if (periodType === 'daily') return 'Last 30 days';
    if (periodType === 'weekly') return 'Last 12 weeks';
    return `Year ${currentYear}`;
  };

  return (
    <Card className="p-4 md:p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Title Section */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-500 flex items-center justify-center text-white">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <h3 className="text-gray-900 dark:text-gray-100">Revenue Analysis</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{getPeriodLabel()}</p>
          </div>
        </div>

        {/* Period Selector - Full Width on Mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setPeriodType('daily')}
              className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-md text-xs transition-all whitespace-nowrap ${
                periodType === 'daily'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Daily
            </button>
            <button
              onClick={() => setPeriodType('weekly')}
              className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-md text-xs transition-all whitespace-nowrap ${
                periodType === 'weekly'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Weekly
            </button>
            <button
              onClick={() => setPeriodType('monthly')}
              className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-md text-xs transition-all whitespace-nowrap ${
                periodType === 'monthly'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              Monthly
            </button>
          </div>

          {/* Total Revenue */}
          <div className="text-left sm:text-right">
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">Total Revenue</p>
            <p className="text-green-600 dark:text-green-400 text-sm md:text-base">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                maximumFractionDigits: 0,
              }).format(totalRevenue)}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full" style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis 
              dataKey="label" 
              className="text-gray-600 dark:text-gray-400 text-xs"
              tick={{ fill: 'currentColor' }}
              angle={0}
              textAnchor="middle"
              height={30}
            />
            <YAxis 
              className="text-gray-600 dark:text-gray-400 text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={formatIDR}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: any) => [formatTooltipIDR(value), 'Revenue']}
              labelClassName="text-gray-900"
            />
            <Legend 
              wrapperStyle={{
                paddingTop: '20px',
              }}
            />
            <Bar 
              dataKey="revenue" 
              fill="#10b981"
              radius={[8, 8, 0, 0]}
              name="Revenue"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}