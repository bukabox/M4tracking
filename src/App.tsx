// App-lokal.tsx - Clean version untuk project lokal (tanpa mock data/API)
// Updated: ROI Target dinamis + SettingsSheet integration + Search & Scroll

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Search, Bell, Settings, Download, Plus, TrendingUp, TrendingDown, DollarSign, Monitor } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { MetricCard } from './components/MetricCard';
import { PortfolioChart } from './components/PortfolioChart';
import { TopPerformance } from './components/TopPerformance';
import { TransactionDialog } from './components/TransactionDialog';
import { TransactionTable, TransactionTableRef } from './components/TransactionTable';
import { NetProfitChart } from './components/NetProfitChart';
import { ProductList } from './components/ProductList';
import { InvestmentList } from './components/InvestmentList';
import { InvestmentCrypto } from './components/InvestmentCrypto';
import Report from './components/Report';
import { TotalRevenue } from './components/TotalRevenue';
import { SettingsSheet } from './components/SettingsSheet';

interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'investment';
  date: string;
  label: string;
  category?: string;
  stream?: string;
  amount: number;
  note?: string;
  price_idr?: any;
  btc_amount?: any;
}

interface StreamData {
  name: string;
  value: number;
  color: string;
}

function fmtIDR(v: number) {
  return new Intl.NumberFormat('id-ID').format(Math.round(v));
}

function pctChange(current: number, previous: number): { text: string; type: 'positive' | 'negative' | 'neutral' } {
  if (previous === 0) {
    if (current === 0) return { text: '—', type: 'neutral' };
    return { text: '—', type: 'neutral' };
  }
  const raw = ((current - previous) / Math.abs(previous)) * 100;
  const type = raw === 0 ? 'neutral' : (raw > 0 ? 'positive' : 'negative');
  return { text: (raw >= 0 ? '+' : '') + raw.toFixed(1) + '%', type: type as any };
}

export default function App() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Search & Scroll state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const transactionTableRef = useRef<TransactionTableRef>(null);

  // Metric state
  const [lifetimeRevenue, setLifetimeRevenue] = useState<number>(0);
  const [streamData, setStreamData] = useState<StreamData[]>([]);

  // ROI / Modal (M4) - Updated dengan ROI Target dinamis
  const [modalM4, setModalM4] = useState<number>(25000000);
  const [roiTarget, setRoiTarget] = useState<number>(2000); // Default 2000%

  // Chart data states
  const [monthlyLabels, setMonthlyLabels] = useState<string[]>([]);
  const [incomeArr, setIncomeArr] = useState<number[]>(Array(12).fill(0));
  const [expenseArr, setExpenseArr] = useState<number[]>(Array(12).fill(0));
  const [investArr, setInvestArr] = useState<number[]>(Array(12).fill(0));
  const [netProfitArr, setNetProfitArr] = useState<number[]>(Array(12).fill(0));
  const [lineProducts, setLineProducts] = useState<any[]>([]);

  // Derived metrics for cards
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [netProfitTotal, setNetProfitTotal] = useState<number>(0);
  const [changes, setChanges] = useState({
    balance: { text: '—', type: 'neutral' as 'neutral' },
    revenue: { text: '—', type: 'neutral' as 'neutral' },
    expenses: { text: '—', type: 'neutral' as 'neutral' },
    net: { text: '—', type: 'neutral' as 'neutral' },
  });

  // Filter Transactions
  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();

    return transactions.filter(tx =>
      tx.label.toLowerCase().includes(query) ||
      (tx.category && tx.category.toLowerCase().includes(query)) ||
      (tx.stream && tx.stream.toLowerCase().includes(query)) ||
      tx.amount.toString().includes(query)
    ).slice(0, 10);
  }, [transactions, searchQuery]);

  // Fetch Functions
  const fetchLifetimeMetrics = async () => {
    try {
      const res = await fetch('/api/lifetime_metrics');
      if (!res.ok) return;
      const j = await res.json();
      setLifetimeRevenue(Number(j.lifetime_revenue || 0));
    } catch (e) {
      console.warn('fetchLifetimeMetrics failed', e);
    }
  };

  const fetchLineProductRevenue = async () => {
    try {
      const res = await fetch(`/api/product_revenue_line`);
      if (!res.ok) {
        console.warn(`Failed to fetch /api/product_revenue_line: ${res.status}`);
        return;
      }
      const data: any[] = await res.json();
      setLineProducts(data);
    } catch (e) {
      console.warn('fetchLineProductRevenue failed', e);
    }
  };

  const fetchStreamPerformance = async () => {
    try {
      const res = await fetch(`/api/stream_performance`);
      if (!res.ok) return;
      const j = await res.json();
      setStreamData(j);
    } catch (e) {
      console.warn('fetchStreamPerformance failed', e);
    }
  };

  const refreshMonthlyAndMetrics = async () => {
    try {
      const year = new Date().getFullYear();
      const res = await fetch(`/api/monthly?year=${year}`);
      if (!res.ok) {
        console.warn(`Failed to fetch /api/monthly: ${res.status}`);
        return;
      }
      const j = await res.json();

      const openingBalance = Number(j.opening_balance || 0);
      const labels = j.labels || [];
      const income = (j.income || []).map((x: any) => Number(x || 0));
      const expense = (j.expense || []).map((x: any) => Number(x || 0));
      const invest = (j.investment || []).map((x: any) => Number(x || 0));

      setMonthlyLabels(labels);
      setIncomeArr(income);
      setExpenseArr(expense);
      setInvestArr(invest);

      const now = new Date();
      const idx = now.getMonth();
      const prevIdx = idx - 1;

      const sumIncome = income.reduce((s: number, v: number) => s + v, 0);
      const sumExpense = expense.reduce((s: number, v: number) => s + v, 0);

      const nettArr = income.map((inc: number, i: number) => inc - (expense[i] || 0) - (invest[i] || 0));
      setNetProfitArr(nettArr);

      const currentYearProfit = nettArr.slice(0, idx + 1).reduce((s: number, v: number) => s + v, 0);
      const cumulativeUpToIdx = openingBalance + currentYearProfit;

      const prevYearProfit = prevIdx >= 0 ? nettArr.slice(0, prevIdx + 1).reduce((s: number, v: number) => s + v, 0) : 0;
      const cumulativeUpToPrev = openingBalance + prevYearProfit;

      const revenueThisMonth = income[idx] || 0;
      const expenseThisMonth = expense[idx] || 0;
      const netThisMonth = nettArr[idx] || 0;

      setTotalRevenue(revenueThisMonth);
      setTotalExpenses(expenseThisMonth);
      setNetProfitTotal(netThisMonth);
      setTotalBalance(cumulativeUpToIdx);

      setChanges({
        balance: pctChange(cumulativeUpToIdx, cumulativeUpToPrev),
        revenue: pctChange(revenueThisMonth, prevIdx >= 0 ? (income[prevIdx] || 0) : 0),
        expenses: pctChange(expenseThisMonth, prevIdx >= 0 ? (expense[prevIdx] || 0) : 0),
        net: pctChange(netThisMonth, prevIdx >= 0 ? (nettArr[prevIdx] || 0) : 0),
      });
    } catch (e) {
      console.warn('refreshMonthlyAndMetrics failed', e);
    }
  };

  // Initial Data Fetch
  const loadInitialData = () => {
    async function loadTx() {
      try {
        const res = await fetch('/api/transactions');
        if (!res.ok) throw new Error('failed to fetch transactions');
        const json = await res.json();
        const mapped = (json || []).map((t: any) => ({
          id: String(t.id),
          type: (t.type || '').toLowerCase() as Transaction['type'],
          date: t.date || '',
          label: t.label || t.category || t.title || '',
          category: t.category || '',
          stream: t.stream ?? '',
          amount: Number(t.amount || t.amount_idr || 0),
          note: t.note || '',
          price_idr: t.price_idr ?? t.btc_price_idr ?? null,
          btc_amount: t.btc_amount ?? t.btcAmount ?? null
        })) as Transaction[];
        setTransactions(mapped);
      } catch (e) {
        console.warn('load transactions failed', e);
      }
    }

    loadTx();
    refreshMonthlyAndMetrics();
    fetchLifetimeMetrics();
    fetchStreamPerformance();
    fetchLineProductRevenue();
  };

  useEffect(() => {
    loadInitialData();
    
    // Load modal & ROI target from localStorage
    const savedModal = localStorage.getItem('initialModal');
    if (savedModal) {
      const parsed = Number(savedModal);
      if (!isNaN(parsed) && parsed > 0) {
        setModalM4(parsed);
      }
    }

    const savedRoiTarget = localStorage.getItem('roiTarget');
    if (savedRoiTarget) {
      const parsed = Number(savedRoiTarget);
      if (!isNaN(parsed) && parsed > 0) {
        setRoiTarget(parsed);
      }
    }
  }, []);

  // Handlers
  const mergeTransactionIntoState = useCallback((tx: any) => {
    if (!tx) return;
    setTransactions(prev => {
      const idStr = String(tx.id);
      const idx = prev.findIndex(p => String(p.id) === idStr);
      const normalized = {
        id: idStr,
        type: (tx.type || tx.category || 'income').toLowerCase(),
        date: tx.date ?? new Date().toISOString(),
        label: tx.label ?? tx.category ?? '',
        category: tx.category ?? '',
        stream: tx.stream ?? '',
        amount: Number(tx.amount ?? tx.amount_idr ?? 0),
        note: tx.note ?? '',
        price_idr: tx.price_idr ?? tx.btc_price_idr ?? null,
        btc_amount: tx.btc_amount ?? tx.btcAmount ?? null
      } as Transaction;

      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...normalized };
        return copy;
      }
      return [normalized, ...prev];
    });
  }, []);

  const handleAddTransaction = async (transaction: any) => {
    const normalized: Transaction = {
      id: (transaction as any)?.id ? String((transaction as any).id) : Date.now().toString(),
      type: ((transaction as any)?.type || (transaction as any)?.category || 'income').toLowerCase() as any,
      date: (transaction as any)?.date || new Date().toISOString(),
      label: (transaction as any)?.label ?? (transaction as any)?.category ?? '',
      category: (transaction as any)?.category ?? '',
      stream: (transaction as any)?.stream ?? '',
      amount: Number((transaction as any)?.amount ?? transaction?.amount_idr ?? 0),
      note: (transaction as any)?.note ?? '',
      price_idr: transaction?.price_idr ?? transaction?.btc_price_idr ?? null,
      btc_amount: transaction?.btc_amount ?? transaction?.btcAmount ?? null
    };
    setTransactions(prev => [normalized, ...prev]);

    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) {
          const mapped = (json || []).map((t: any) => ({
            id: String(t.id),
            type: (t.type || '').toLowerCase() as Transaction['type'],
            date: t.date || '',
            label: t.label || t.category || t.title || '',
            category: t.category || '',
            stream: t.stream ?? '',
            amount: Number(t.amount || t.amount_idr || 0),
            note: t.note || '',
            price_idr: t.price_idr ?? t.btc_price_idr ?? null,
            btc_amount: t.btc_amount ?? t.btcAmount ?? null
          })) as Transaction[];
          setTransactions(mapped);
        }
      }
    } catch (e) {
      console.warn('refresh transactions after add failed', e);
    }

    refreshMonthlyAndMetrics();
    fetchLifetimeMetrics();
    fetchStreamPerformance();
  };

  useEffect(() => {
    const handler = (e: any) => {
      const tx = e?.detail ?? null;
      if (!tx) return;
      mergeTransactionIntoState(tx);
      console.debug('[APP] transaction:added event merged', tx);
    };
    window.addEventListener('transaction:added', handler as EventListener);
    return () => window.removeEventListener('transaction:added', handler as EventListener);
  }, [mergeTransactionIntoState]);

  const handleDeleteTransaction = async (id: string) => {
    try {
      setTransactions(prev => prev.filter(t => t.id !== id));

      const res = await fetch('/api/delete_transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('delete failed');

      refreshMonthlyAndMetrics();
      fetchLifetimeMetrics();
      fetchStreamPerformance();
    } catch (e) {
      console.error('delete transaction failed', e);
      loadInitialData();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900">M4 Tracking</h1>
              <p className="text-gray-500 text-sm">BUKABOX tracking system</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Box */}
            <div
              className="relative"
              onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <Input
                placeholder="Search transactions..."
                className="pl-10 w-80 bg-gray-50 border-gray-200"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length > 0) {
                    setIsSearchOpen(true);
                  } else {
                    setIsSearchOpen(false);
                  }
                }}
                onFocus={() => {
                  if (searchQuery.length > 0) setIsSearchOpen(true);
                }}
              />

              {/* Search Results Panel */}
              {isSearchOpen && searchQuery && (
                <div className="absolute top-full mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="p-3 bg-gray-50 border-b px-5 py-4 border-gray-200">
                    <p className="text-gray-900 font-semibold">
                      Search Results ({filteredTransactions.length})
                    </p>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((transaction) => (
                        <button
                          key={transaction.id}
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery("");
                            if (transactionTableRef.current) {
                              transactionTableRef.current.scrollToTransaction(transaction.id);
                            }
                          }}
                          className="w-full px-5 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-gray-900 font-medium mb-1">
                                {transaction.label}
                              </p>
                              <p className="text-gray-500 text-sm flex items-center gap-1">
                                {transaction.type === 'income' && transaction.stream ? (
                                  <span className="font-medium text-gray-700">{transaction.stream}</span>
                                ) : (
                                  <span className="capitalize">
                                    {(transaction.category || transaction.type)}
                                  </span>
                                )}
                                <span className="text-gray-400"> • </span>
                                {new Date(transaction.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <span
                              className={`font-semibold ${
                                transaction.type === 'income'
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {transaction.type === 'income' ? "+" : "-"}Rp {fmtIDR(Math.abs(transaction.amount))}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-gray-500">No transactions found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
              <Settings className="w-5 h-5 text-gray-600" />
            </Button>
            <Button className="bg-green-500 hover:bg-green-600" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Transaction
            </Button>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {/* TotalRevenue Component - Updated dengan ROI Target dinamis */}
        <TotalRevenue 
          lifetimeRevenue={lifetimeRevenue}
          initialModal={modalM4}
          roiTarget={roiTarget}
          onModalChange={(value) => {
            setModalM4(value);
            localStorage.setItem('initialModal', String(value));
          }}
        />

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon={<Monitor className="w-5 h-5" />}
            iconBgColor="bg-cyan-500"
            title="Total Balance"
            value={`Rp ${fmtIDR(totalBalance)}`}
            change={changes.balance.text}
            changeType={changes.balance.type}
            comparison="vs last month"
          />
          <MetricCard
            icon={<TrendingUp className="w-5 h-5" />}
            iconBgColor="bg-green-500"
            title="Total Revenue"
            value={`Rp ${fmtIDR(totalRevenue)}`}
            change={changes.revenue.text}
            changeType={changes.revenue.type}
            comparison="vs last month"
          />
          <MetricCard
            icon={<TrendingDown className="w-5 h-5" />}
            iconBgColor="bg-orange-500"
            title="Total Expenses"
            value={`Rp ${fmtIDR(totalExpenses)}`}
            change={changes.expenses.text}
            changeType={changes.expenses.type}
            comparison="vs last month"
          />
          <MetricCard
            icon={<DollarSign className="w-5 h-5" />}
            iconBgColor="bg-purple-500"
            title="Net Profit"
            value={`Rp ${fmtIDR(netProfitTotal)}`}
            change={changes.net.text}
            changeType={changes.net.type}
            comparison="vs last month"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mb-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="investment">Investment</TabsTrigger>
            <TabsTrigger value="analytic">Analytic</TabsTrigger>
            <TabsTrigger value="report">Report</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <PortfolioChart />
              </div>
              <div className="lg:col-span-1">
                <TopPerformance streamData={streamData} />
              </div>
            </div>

            <TransactionTable
              ref={transactionTableRef}
              transactions={transactions}
              onDelete={handleDeleteTransaction}
            />
          </TabsContent>

          <TabsContent value="investment" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <InvestmentList 
                  transactions={transactions} 
                  onDelete={handleDeleteTransaction} 
                />
              </div>
              <div className="lg:col-span-1">
                <InvestmentCrypto />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytic" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <NetProfitChart
                  netProfitData={netProfitArr}
                  monthlyLabels={monthlyLabels}
                  currentYear={new Date().getFullYear()}
                />
              </div>
              <div className="lg:col-span-1">
                <ProductList
                  products={lineProducts}
                  pageSize={10}
                  transactions={transactions}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="report" className="mt-6">
            <Report transactions={transactions} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Transaction Dialog */}
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={(tx: any) => {
          mergeTransactionIntoState(tx);
          handleAddTransaction(tx);
        }}
      />

      {/* Settings Sheet - Updated dengan ROI Target */}
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        initialModal={modalM4}
        roiTarget={roiTarget}
        onModalChange={(value) => {
          setModalM4(value);
          localStorage.setItem('initialModal', String(value));
        }}
        onRoiTargetChange={(value) => {
          setRoiTarget(value);
          localStorage.setItem('roiTarget', String(value));
        }}
      />
    </div>
  );
}