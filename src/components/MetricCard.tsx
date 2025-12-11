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
    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center text-white shrink-0`}>
          {icon}
        </div>
        <span
          className={`px-2.5 py-1.5 rounded-md text-sm font-medium ${
            changeType === 'positive'
              ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
          }`}
        >
          {change}
        </span>
      </div>
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 font-medium">{title}</p>
        <p 
          className="text-gray-900 dark:text-gray-100 mb-2 tracking-tight" 
          style={{ fontSize: '1.75rem', lineHeight: '2rem', fontWeight: 700 }}
        >
          {value}
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs">{comparison}</p>
      </div>
    </Card>
  );
}
