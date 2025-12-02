import { AlertCircle, Database, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { mockDataService } from '../services/mockData';

interface MockDataBannerProps {
  onReload?: () => void;
}

export function MockDataBanner({ onReload }: MockDataBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [stats, setStats] = useState({
    transactions: 0,
    income: 0,
    lineProducts: 0,
    btcInvestments: 0
  });

  useEffect(() => {
    // Get sample data stats
    const transactions = mockDataService.getTransactions();
    const income = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const lineProducts = new Set(
      transactions
        .filter(tx => tx.type === 'income' && tx.stream?.toLowerCase() === 'line')
        .map(tx => tx.category)
    ).size;

    const btcInvestments = transactions
      .filter(tx => tx.type === 'investment' && tx.category === 'BTC')
      .length;

    setStats({
      transactions: transactions.length,
      income,
      lineProducts,
      btcInvestments
    });
  }, []);

  const handleReset = () => {
    if (confirm('Reset semua data ke sample data? Data yang sudah ditambahkan akan hilang.')) {
      mockDataService.resetToSample();
      if (onReload) onReload();
    }
  };

  if (dismissed) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-4 h-4 text-blue-600" />
          <h4 className="text-blue-900">Using Sample Data</h4>
        </div>
        
        <p className="text-sm text-blue-700 mb-2">
          Backend tidak tersedia. Aplikasi menampilkan <strong>{stats.transactions} sample transactions</strong> dengan total income <strong>Rp {new Intl.NumberFormat('id-ID').format(stats.income)}</strong>.
        </p>
        
        <div className="flex items-center gap-2 text-xs text-blue-600">
          <span>✓ {stats.lineProducts} LINE sticker products</span>
          <span>•</span>
          <span>✓ {stats.btcInvestments} BTC DCA investments</span>
          <span>•</span>
          <span>✓ Hardware & expenses</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleReset}
          className="text-orange-600 border-orange-300 hover:bg-orange-100"
          title="Reset to original sample data"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Reset
        </Button>
        
        {onReload && (
          <Button
            size="sm"
            variant="outline"
            onClick={onReload}
            className="text-blue-600 border-blue-300 hover:bg-blue-100"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reload
          </Button>
        )}
        
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-400 hover:text-blue-600 p-1"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}