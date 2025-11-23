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
    <Card className="p-6 bg-white border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 ${iconBgColor} rounded-xl flex items-center justify-center text-white`}>
          {icon}
        </div>
        <span
          className={`px-2 py-1 rounded text-sm ${
            changeType === 'positive'
              ? 'bg-green-50 text-green-600'
              : 'bg-red-50 text-red-600'
          }`}
        >
          {change}
        </span>
      </div>
      <div>
        <p className="text-gray-500 text-sm mb-1">{title}</p>
        <p className="text-gray-900 mb-1">{value}</p>
        <p className="text-gray-400 text-xs">{comparison}</p>
      </div>
    </Card>
  );
}
