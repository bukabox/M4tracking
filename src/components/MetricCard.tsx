import { Card } from './ui/card';

interface MetricCardProps {
  icon: React.ReactNode;
  iconBgColor: string;
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  comparison: string;
}

export function MetricCard({
  icon,
  iconBgColor,
  title,
  value,
  change,
  changeType,
  comparison,
}: MetricCardProps) {
  return (
    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center text-white`}>
          {icon}
        </div>
        <span
          className={`px-2 py-1 rounded text-sm ${
            changeType === 'positive'
              ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
          }`}
        >
          {change}
        </span>
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{title}</p>
        <p className="text-gray-900 dark:text-gray-100 mb-1">{value}</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs">{comparison}</p>
      </div>
    </Card>
  );
}