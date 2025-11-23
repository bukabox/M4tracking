import { useState } from 'react';
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
  type: 'income' | 'allocation';
  date: string;
  label: string;
  amount: number;
}

export default function App() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
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
            value="$92,450"
            change="+12.5%"
            changeType="positive"
            comparison="vs last month"
          />
          <MetricCard
            icon={<TrendingUp className="w-5 h-5" />}
            iconBgColor="bg-green-500"
            title="Total Revenue"
            value="$58,640"
            change="+8.2%"
            changeType="positive"
            comparison="vs last month"
          />
          <MetricCard
            icon={<TrendingDown className="w-5 h-5" />}
            iconBgColor="bg-orange-500"
            title="Total Expenses"
            value="$24,120"
            change="-3.1%"
            changeType="negative"
            comparison="vs last month"
          />
          <MetricCard
            icon={<DollarSign className="w-5 h-5" />}
            iconBgColor="bg-purple-500"
            title="Net Profit"
            value="$34,520"
            change="+15.8%"
            changeType="positive"
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
              {/* Portfolio Performance */}
              <div className="lg:col-span-2">
                <PortfolioChart />
              </div>

              {/* Asset Allocation */}
              <div className="lg:col-span-1">
                <AssetAllocation />
              </div>
            </div>

            {/* Transaction Table */}
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
        onSubmit={handleAddTransaction}
      />
    </div>
  );
}