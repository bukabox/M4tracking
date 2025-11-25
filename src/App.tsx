// /mnt/data/App.tsx
import { useEffect, useState } from 'react';
import { Search, Bell, Settings, Download, Plus, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { MetricCard } from './components/MetricCard';
import { PortfolioChart } from './components/PortfolioChart';
import { AssetAllocation } from './components/AssetAllocation';
import { TransactionDialog } from './components/TransactionDialog';
import { TransactionTable } from './components/TransactionTable';

interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'investment';
  date: string;
  label: string;
  category?: string;
  stream?: string;
  amount: number;
  note?: string;
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
  const sign = raw >= 0 ? 'positive' : 'negative';
  return { text: (raw >= 0 ? '+' : '') + raw.toFixed(1) + '%', type: sign as any };
}

export default function App() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // metric state
  const [monthlyLabels, setMonthlyLabels] = useState<string[]>([]);
  const [incomeArr, setIncomeArr] = useState<number[]>(Array(12).fill(0));
  const [expenseArr, setExpenseArr] = useState<number[]>(Array(12).fill(0));
  const [investArr, setInvestArr] = useState<number[]>(Array(12).fill(0));

  // derived metrics for cards
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [netProfitTotal, setNetProfitTotal] = useState<number>(0);
  const [changes, setChanges] = useState({
    balance: { text: '—', type: 'neutral' as any },
    revenue: { text: '—', type: 'neutral' as any },
    expenses: { text: '—', type: 'neutral' as any },
    net: { text: '—', type: 'neutral' as any },
  });

  // --- helper to load monthly and derived metrics ---
  const refreshMonthlyAndMetrics = async () => {
    try {
      const year = new Date().getFullYear();
      const res = await fetch(`/api/monthly?year=${year}`);
      if (!res.ok) return;
      const j = await res.json(); // { labels, income, expense, investment }
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

      const sumIncome = income.reduce((s:number, v:number) => s + v, 0);
      const sumExpense = expense.reduce((s:number, v:number) => s + v, 0);

      const nettArr = income.map((inc:number, i:number) => inc - (expense[i] || 0) - (invest[i] || 0));
      const cumulativeUpToIdx = nettArr.slice(0, idx + 1).reduce((s:number,v:number)=>s+v, 0);
      const cumulativeUpToPrev = prevIdx >= 0 ? nettArr.slice(0, prevIdx + 1).reduce((s:number,v:number)=>s+v, 0) : 0;

      setTotalRevenue(sumIncome);
      setTotalExpenses(sumExpense);
      setNetProfitTotal(nettArr.reduce((s:number,v:number)=>s+v, 0));
      setTotalBalance(cumulativeUpToIdx);

      setChanges({
        balance: pctChange(cumulativeUpToIdx, cumulativeUpToPrev),
        revenue: pctChange(income[idx] || 0, prevIdx >= 0 ? income[prevIdx] || 0 : 0),
        expenses: pctChange(expense[idx] || 0, prevIdx >= 0 ? expense[prevIdx] || 0 : 0),
        net: pctChange(nettArr[idx] || 0, prevIdx >= 0 ? nettArr[prevIdx] || 0 : 0),
      });
    } catch (e) {
      console.warn('refreshMonthlyAndMetrics failed', e);
    }
  };

  // --- fetch persisted transactions on mount ---
  useEffect(() => {
    async function loadTx() {
      try {
        const res = await fetch('/api/transactions');
        if (!res.ok) throw new Error('failed to fetch transactions');
        const json = await res.json();
        const mapped = (json || []).map((t: any) => ({
          id: String(t.id),
          type: (t.type || '').toLowerCase(),
          date: t.date || '',
          label: t.label || t.category || t.title || '',
          category: t.category || '',
          stream: t.stream ?? '',   
          amount: Number(t.amount || t.amount_idr || 0),
          note: t.note || ''
        })) as Transaction[];
        setTransactions(mapped);
      } catch (e) {
        console.warn('load transactions failed', e);
      }
    }
    loadTx();
    // initial metric load
    refreshMonthlyAndMetrics();
  }, []);

  // when dialog saves, this handler will be called with transaction object returned by backend or optimistic one
  // keep original signature but normalize internally to avoid invalid shapes causing render errors
  const handleAddTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    // normalize incoming transaction shape for optimistic update
    const normalized: Transaction = {
      id: (transaction as any)?.id ? String((transaction as any).id) : Date.now().toString(),
      type: ((transaction as any)?.type || (transaction as any)?.category || 'income').toLowerCase() as any,
      date: (transaction as any)?.date || new Date().toISOString(),
      label: (transaction as any)?.label ?? (transaction as any)?.category ?? '',
      category: (transaction as any)?.category ?? '',
      stream: (transaction as any)?.stream ?? '',     // <-- FIX DI SINI
      amount: Number((transaction as any)?.amount ?? 0),
      note: (transaction as any)?.note ?? '',
    };


    // optimistic add (normalized)
    setTransactions(prev => [normalized, ...prev]);

    // re-fetch canonical transactions + metrics and defensively apply
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) {
          const mapped = (json || []).map((t: any) => ({
            id: String(t.id),
            type: (t.type || '').toLowerCase(),
            date: t.date || '',
            label: t.label || t.category || t.title || '',
            category: t.category || '',
            stream: t.stream ?? '',       
            amount: Number(t.amount || t.amount_idr || 0),
            note: t.note || ''
          })) as Transaction[];
          setTransactions(mapped);
        } else {
          console.warn('[App] /api/transactions returned non-array:', json);
        }
      } else {
        console.warn('[App] /api/transactions returned non-ok', res.status);
      }
    } catch (e) {
      console.warn('refresh transactions after add failed', e);
    }

    // refresh metrics too
    refreshMonthlyAndMetrics();
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await fetch('/api/delete_transaction', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('delete failed');
      // update UI
      setTransactions(prev => prev.filter(t => t.id !== id));
      // refresh metrics
      refreshMonthlyAndMetrics();
    } catch (e) {
      console.error('delete transaction failed', e);
      // fallback: remove from UI anyway
      setTransactions(prev => prev.filter(t => t.id !== id));
      refreshMonthlyAndMetrics();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900">FinanceHub</h1>
              <p className="text-gray-500 text-sm">Welcome back, Alex</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                className="pl-10 w-80 bg-gray-50 border-gray-200"
              />
            </div>
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5 text-gray-600" />
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
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-gray-900">Financial Overview</h2>
            <p className="text-gray-500">Track your wealth and spending habits</p>
          </div>
          <Button className="bg-green-500 hover:bg-green-600" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Transaction
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon={<Wallet className="w-5 h-5" />}
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
                <AssetAllocation />
              </div>
            </div>

            <TransactionTable 
              transactions={transactions}
              onDelete={handleDeleteTransaction}
            />
          </TabsContent>

          <TabsContent value="investment" className="mt-6">
            <div className="bg-white rounded-lg p-8 text-center text-gray-500">
              Investment view coming soon...
            </div>
          </TabsContent>

          <TabsContent value="analytic" className="mt-6">
            <div className="bg-white rounded-lg p-8 text-center text-gray-500">
              Analytic view coming soon...
            </div>
          </TabsContent>

          <TabsContent value="report" className="mt-6">
            <div className="bg-white rounded-lg p-8 text-center text-gray-500">
              Report view coming soon...
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Transaction Dialog */}
      <TransactionDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={(tx:any) => {
          // server returns saved tx — re-fetch canonical state
          handleAddTransaction(tx);
        }}
      />
    </div>
  );
}
