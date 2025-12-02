// Report.tsx - Fixed version
// Monthly accordion report — groups transactions by month and shows details per-month in an Accordion.
// Redesigned to match FinanceHub main design system

import React, { useMemo, useState, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion';
import { Badge } from './ui/badge';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  FileText,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

interface ReportProps {
  transactions?: Transaction[];
}

const fmtIDR = (v: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v);
};

const COLORS = {
  income: '#10b981',    // green
  expense: '#ef4444',   // red
  investment: '#f59e0b' // orange
};

function monthKey(d: string) {
  try {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

function monthLabel(yyyy_mm: string) {
  const [y, m] = yyyy_mm.split('-');
  const dt = new Date(Number(y), Number(m) - 1, 1);
  return dt.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
}

export default function Report({ transactions = [] }: ReportProps) {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  // Filter transactions by selected year
  const yearTransactions = useMemo(() => {
    return transactions.filter(t => {
      const txYear = new Date(t.date).getFullYear();
      return txYear === year;
    });
  }, [transactions, year]);

  // Calculate monthly data
  const monthlyData = useMemo(() => {
    const months = Array(12).fill(0).map((_, i) => ({
      month: new Date(year, i, 1).toLocaleString('default', { month: 'short' }),
      income: 0,
      expense: 0,
      investment: 0,
    }));

    yearTransactions.forEach(tx => {
      const month = new Date(tx.date).getMonth();
      if (tx.type === 'income') {
        months[month].income += tx.amount;
      } else if (tx.type === 'expense') {
        months[month].expense += tx.amount;
      } else if (tx.type === 'investment') {
        months[month].investment += tx.amount;
      }
    });

    return months;
  }, [yearTransactions, year]);

  // Group transactions by month
  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    
    yearTransactions.forEach(t => {
      const k = monthKey(t.date);
      if (!k) return;
      groups[k] = groups[k] || [];
      groups[k].push(t);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map(k => ({ key: k, txs: groups[k] }));
  }, [yearTransactions]);

  // Calculate year totals
  const yearTotals = useMemo(() => {
    const income = monthlyData.reduce((s, m) => s + m.income, 0);
    const expense = monthlyData.reduce((s, m) => s + m.expense, 0);
    const investment = monthlyData.reduce((s, m) => s + m.investment, 0);
    const net = income - expense - investment;

    return { income, expense, investment, net };
  }, [monthlyData]);

  // Pie data - use year totals instead of current month for better visibility
  const pieChartData = useMemo(() => {
    const total = yearTotals.income + yearTotals.expense + yearTotals.investment || 1;

    return [
      { name: 'Income', value: yearTotals.income, percentage: (yearTotals.income / total * 100).toFixed(1) },
      { name: 'Expense', value: yearTotals.expense, percentage: (yearTotals.expense / total * 100).toFixed(1) },
      { name: 'Investment', value: yearTotals.investment, percentage: (yearTotals.investment / total * 100).toFixed(1) },
    ].filter(item => item.value > 0); // Only show items with data
  }, [yearTotals]);
  
  async function exportPdf() {
    if (!reportRef.current) return;
    setLoadingPdf(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const img = canvas.toDataURL('image/png');
      const doc = new jsPDF('p', 'pt', 'a4');
      const imgProps = (doc as any).getImageProperties(img);
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      let position = 0;
      
      doc.addImage(img, 'PNG', 0, position, pdfWidth, pdfHeight);
      const pageHeight = doc.internal.pageSize.getHeight();
      
      let heightLeft = pdfHeight;
      while (heightLeft > pageHeight) {
        position -= pageHeight;
        doc.addPage();
        doc.addImage(img, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      doc.save(`FinanceHub-Report-${year}.pdf`);
    } catch (e) {
      console.warn('exportPdf failed', e);
    }
    setLoadingPdf(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="text-gray-900">Annual Report</h2>
          <p className="text-gray-500">Comprehensive financial overview for {year}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={() => setYear(y => y - 1)}>
            Previous Year
          </Button>
          <Button variant="outline" onClick={() => setYear(new Date().getFullYear())}>
            This Year
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            onClick={exportPdf} 
            disabled={loadingPdf}
          >
            <Download className="w-4 h-4 mr-2" />
            {loadingPdf ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      <div ref={reportRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Year Summary Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          <Card className="p-6 bg-white border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <Badge style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                Income
              </Badge>
            </div>
            <p className="text-gray-500 text-sm mb-1">Total Revenue</p>
            <p className="text-gray-900 text-2xl">{fmtIDR(yearTotals.income)}</p>
          </Card>

          <Card className="p-6 bg-white border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <Badge style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                Expense
              </Badge>
            </div>
            <p className="text-gray-500 text-sm mb-1">Total Expenses</p>
            <p className="text-gray-900 text-2xl">{fmtIDR(yearTotals.expense)}</p>
          </Card>

          <Card className="p-6 bg-white border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <Badge style={{ backgroundColor: '#fed7aa', color: '#9a3412' }}>
                Investment
              </Badge>
            </div>
            <p className="text-gray-500 text-sm mb-1">Total Investment</p>
            <p className="text-gray-900 text-2xl">{fmtIDR(yearTotals.investment)}</p>
          </Card>

          <Card className="p-6 bg-white border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-full ${yearTotals.net >= 0 ? 'bg-purple-500' : 'bg-gray-500'} flex items-center justify-center`}>
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <Badge style={{ 
                backgroundColor: yearTotals.net >= 0 ? '#f3e8ff' : '#f3f4f6',
                color: yearTotals.net >= 0 ? '#6b21a8' : '#374151'
              }}>
                Net
              </Badge>
            </div>
            <p className="text-gray-500 text-sm mb-1">Net Profit</p>
            <p className={`text-2xl ${yearTotals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmtIDR(yearTotals.net)}
            </p>
          </Card>
        </div>

        {/* Charts Section */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: window.innerWidth >= 1024 ? '2fr 1fr' : '1fr',
          gap: '1.5rem'
        }}>
          {/* Trend Chart */}
          <Card className="p-6 bg-white border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              <h3 className="text-gray-900">Monthly Trend</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => fmtIDR(value)}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: 8 
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="income" stroke={COLORS.income} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="expense" stroke={COLORS.expense} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="investment" stroke={COLORS.investment} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Pie Chart */}
          <Card className="p-6 bg-white border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon className="w-5 h-5 text-gray-600" />
              <h3 className="text-gray-900">Year Summary</h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => fmtIDR(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              {pieChartData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: Object.values(COLORS)[idx] }}
                    />
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="text-gray-900">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Monthly Breakdown Accordion */}
        <Card className="p-6 bg-white border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="text-gray-900">Monthly Breakdown</h3>
          </div>

          {grouped.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No transactions for {year}
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-3">
              {grouped.map(({ key, txs }) => {
                const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
                const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                const totalInvest = txs.filter(t => t.type === 'investment').reduce((s, t) => s + t.amount, 0);
                const monthTotal = totalIncome - totalExpense - totalInvest;

                return (
                  <AccordionItem 
                    key={key} 
                    value={key}
                    className="border border-gray-200 rounded-xl overflow-hidden"
                  >
                    <AccordionTrigger className="hover:no-underline px-5 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between w-full pr-2">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-gray-900">{monthLabel(key)}</p>
                            <p className="text-sm text-gray-500">{txs.length} transactions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 mb-1">Net Total</p>
                          <p className={`text-lg ${monthTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {monthTotal >= 0 ? '+' : ''}{fmtIDR(monthTotal)}
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent style={{ paddingTop: '1rem', paddingBottom: '1rem', paddingLeft: '1.25rem', paddingRight: '1.25rem' }}>
                      <div className="bg-gray-50 rounded-lg" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Month Summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                          <div className="bg-white rounded-lg border border-gray-200" style={{ padding: '0.75rem' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span className="text-sm text-gray-500">Income</span>
                            </div>
                            <p className="text-green-600">{fmtIDR(totalIncome)}</p>
                          </div>
                          <div className="bg-white rounded-lg border border-gray-200" style={{ padding: '0.75rem' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                              <span className="text-sm text-gray-500">Expense</span>
                            </div>
                            <p className="text-red-600">{fmtIDR(totalExpense)}</p>
                          </div>
                          <div className="bg-white rounded-lg border border-gray-200" style={{ padding: '0.75rem' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-orange-500" />
                              <span className="text-sm text-gray-500">Investment</span>
                            </div>
                            <p className="text-orange-600">{fmtIDR(totalInvest)}</p>
                          </div>
                        </div>

                        {/* Transactions Table */}
                        <div className="bg-white rounded-lg overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
                          <div className="overflow-x-auto">
                            <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                              <thead style={{ backgroundColor: '#f9fafb' }}>
                                <tr>
                                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Type</th>
                                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Stream</th>
                                  <th className="text-right text-xs text-gray-500 uppercase tracking-wider" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {txs.map((t, idx) => (
                                  <tr key={t.id} className="hover:bg-gray-50" style={{ borderBottom: idx < txs.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                                    <td className="text-sm text-gray-600" style={{ padding: '0.75rem 1rem' }}>
                                      {new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                    </td>
                                    <td className="text-sm text-gray-900" style={{ padding: '0.75rem 1rem' }}>{t.label}</td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                      <Badge style={{
                                        backgroundColor: t.type === 'income' ? '#dcfce7' : t.type === 'expense' ? '#fee2e2' : '#fed7aa',
                                        color: t.type === 'income' ? '#15803d' : t.type === 'expense' ? '#991b1b' : '#9a3412',
                                        textTransform: 'capitalize'
                                      }}>
                                        {t.type}
                                      </Badge>
                                    </td>
                                    <td className="text-sm text-gray-600" style={{ padding: '0.75rem 1rem' }}>{t.stream || t.category || '—'}</td>
                                    <td className={`text-sm text-right ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`} style={{ padding: '0.75rem 1rem' }}>
                                      {t.type === 'income' ? '+' : '-'}{fmtIDR(t.amount)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Generated by FinanceHub • {new Date().toLocaleDateString('id-ID')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}