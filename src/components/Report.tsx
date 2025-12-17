// Report.tsx - Fixed version
// Monthly accordion report — groups transactions by month and shows details per-month in an Accordion.
// Redesigned to match BUKABOX M4 Tracker main design system

import React, { useMemo, useState, useRef, forwardRef, useImperativeHandle } from 'react';
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
  BarChart3,
  ChevronDown
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
import { jsPDF } from 'jspdf';

// Professional color palette - Asphalt Blue Theme
const PDF_COLORS = {
  // Primary colors - Muted and professional
  primary: '#475569',      // slate-600 - Main headings
  secondary: '#64748b',    // slate-500 - Subheadings
  accent: '#60a5fa',       // blue-400 - Highlights
  
  // Data visualization - Subtle yet distinct
  income: '#10b981',       // emerald-500 - Income (kept vibrant for clarity)
  expense: '#64748b',      // slate-500 - Expense (muted)
  investment: '#94a3b8',   // slate-400 - Investment (light slate)
  net: '#3b82f6',         // blue-500 - Net profit
  
  // Backgrounds
  bgPrimary: '#f8fafc',    // slate-50 - Light bg
  bgSecondary: '#f1f5f9',  // slate-100 - Card bg
  bgDark: '#1e293b',       // slate-800 - Dark header
  
  // Borders and lines
  border: '#cbd5e1',       // slate-300
  borderLight: '#e2e8f0',  // slate-200
  
  // Text colors
  textPrimary: '#0f172a',  // slate-900
  textSecondary: '#475569', // slate-600
  textMuted: '#94a3b8',    // slate-400
  textWhite: '#ffffff',
};

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
  projectName?: string;
}

export interface ReportRef {
  exportYearlyPDF: () => void;
  exportMonthlyPDF: () => void;
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

const Report = forwardRef<ReportRef, ReportProps>(({ transactions = [], projectName = 'M4 ROI' }, ref) => {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [exportMode, setExportMode] = useState<'yearly' | 'monthly'>('yearly');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(
    typeof window !== 'undefined' && window.innerWidth >= 768
  );
  const [monthlyDepreciation, setMonthlyDepreciation] = useState<number>(0);

  // Fetch monthly depreciation from API
  React.useEffect(() => {
    fetch('/api/monthly')
      .then(res => res.json())
      .then(data => {
        console.log('[Report] API Response:', data);
        console.log('[Report] Monthly Depreciation:', data.monthly_depreciation);
        setMonthlyDepreciation(data.monthly_depreciation || 0);
      })
      .catch(err => console.error('Failed to fetch monthly depreciation:', err));
  }, []);

  // Track screen size for responsive behavior
  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    
    // Count months with activity for depreciation calculation
    const activeMonths = monthlyData.filter(m => m.income > 0 || m.expense > 0).length;
    
    // CORRECTED: Net Profit = Income - Expense - Depreciation
    // Depreciation deducted for all active months in the year
    const net = income - expense - (monthlyDepreciation * activeMonths);

    console.log('[Report yearTotals]', {
      income,
      expense,
      monthlyDepreciation,
      activeMonths,
      totalDepreciation: monthlyDepreciation * activeMonths,
      net
    });

    return { income, expense, investment, net };
  }, [monthlyData, monthlyDepreciation]);

  // Pie data - use year totals instead of current month for better visibility
  const pieChartData = useMemo(() => {
    const total = yearTotals.income + yearTotals.expense + yearTotals.investment || 1;

    return [
      { name: 'Income', value: yearTotals.income, percentage: (yearTotals.income / total * 100).toFixed(1) },
      { name: 'Expense', value: yearTotals.expense, percentage: (yearTotals.expense / total * 100).toFixed(1) },
      { name: 'Investment', value: yearTotals.investment, percentage: (yearTotals.investment / total * 100).toFixed(1) },
    ].filter(item => item.value > 0); // Only show items with data
  }, [yearTotals]);
  
  // Helper: Convert hex to RGB
  function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0];
  }

  // Helper: Draw line chart on PDF
  function drawLineChart(doc: jsPDF, x: number, y: number, width: number, height: number, data: any[]) {
    const marginLeft = 25;
    const marginBottom = 20;
    const marginTop = 10;
    const chartWidth = width - marginLeft - 10;
    const chartHeight = height - marginTop - marginBottom;

    // Background
    doc.setFillColor(...hexToRgb(PDF_COLORS.bgSecondary));
    doc.roundedRect(x, y, width, height, 2, 2, 'F');

    // Get max value for scaling
    const maxValue = Math.max(
      ...data.map(d => Math.max(d.income, d.expense, d.investment))
    );
    const scale = chartHeight / (maxValue * 1.1);

    // Draw grid lines (horizontal)
    doc.setDrawColor(...hexToRgb(PDF_COLORS.borderLight));
    doc.setLineWidth(0.2);
    for (let i = 0; i <= 4; i++) {
      const gridY = y + marginTop + (chartHeight / 4) * i;
      doc.line(x + marginLeft, gridY, x + marginLeft + chartWidth, gridY);
    }

    // Draw axes
    doc.setDrawColor(...hexToRgb(PDF_COLORS.border));
    doc.setLineWidth(0.5);
    doc.line(x + marginLeft, y + marginTop, x + marginLeft, y + marginTop + chartHeight); // Y-axis
    doc.line(x + marginLeft, y + marginTop + chartHeight, x + marginLeft + chartWidth, y + marginTop + chartHeight); // X-axis

    // Plot lines
    const plotLine = (dataKey: 'income' | 'expense' | 'investment', color: string) => {
      doc.setDrawColor(...hexToRgb(color));
      doc.setLineWidth(1.5);
      
      for (let i = 0; i < data.length - 1; i++) {
        const x1 = x + marginLeft + (chartWidth / (data.length - 1)) * i;
        const y1 = y + marginTop + chartHeight - (data[i][dataKey] * scale);
        const x2 = x + marginLeft + (chartWidth / (data.length - 1)) * (i + 1);
        const y2 = y + marginTop + chartHeight - (data[i + 1][dataKey] * scale);
        
        doc.line(x1, y1, x2, y2);
        
        // Draw dots
        doc.setFillColor(...hexToRgb(color));
        doc.circle(x1, y1, 1.5, 'F');
        if (i === data.length - 2) {
          doc.circle(x2, y2, 1.5, 'F');
        }
      }
    };

    plotLine('income', PDF_COLORS.income);
    plotLine('expense', PDF_COLORS.expense);
    plotLine('investment', PDF_COLORS.investment);

    // X-axis labels (month names)
    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
    data.forEach((d, i) => {
      if (i % 2 === 0) { // Show every other month
        const labelX = x + marginLeft + (chartWidth / (data.length - 1)) * i;
        doc.text(d.month, labelX, y + marginTop + chartHeight + 6, { align: 'center' });
      }
    });

    // Y-axis labels
    for (let i = 0; i <= 4; i++) {
      const value = (maxValue * 1.1 / 4) * (4 - i);
      const labelY = y + marginTop + (chartHeight / 4) * i;
      doc.text(`${Math.round(value / 1000000)}M`, x + marginLeft - 3, labelY + 1, { align: 'right' });
    }

    // Legend
    const legendY = y + height - 5;
    const legendStartX = x + width / 2 - 40;
    
    const legends = [
      { label: 'Income', color: PDF_COLORS.income },
      { label: 'Expense', color: PDF_COLORS.expense },
      { label: 'Investment', color: PDF_COLORS.investment }
    ];
    
    legends.forEach((leg, idx) => {
      const legX = legendStartX + idx * 28;
      doc.setFillColor(...hexToRgb(leg.color));
      doc.circle(legX, legendY - 0.5, 1.5, 'F');
      doc.setFontSize(7);
      doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
      doc.text(leg.label, legX + 3, legendY);
    });
  }

  // Helper: Draw donut chart on PDF
  function drawDonutChart(doc: jsPDF, centerX: number, centerY: number, radius: number, data: any[]) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -90; // Start from top

    data.forEach((item, idx) => {
      const colors = [PDF_COLORS.income, PDF_COLORS.expense, PDF_COLORS.investment];
      const sliceAngle = (item.value / total) * 360;
      
      // Draw slice
      doc.setFillColor(...hexToRgb(colors[idx]));
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      
      // Create arc path
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      // Outer arc
      for (let angle = startAngle; angle <= endAngle; angle += 2) {
        const rad = (angle * Math.PI) / 180;
        const x1 = centerX + Math.cos(rad) * radius;
        const y1 = centerY + Math.sin(rad) * radius;
        const nextRad = ((angle + 2) * Math.PI) / 180;
        const x2 = centerX + Math.cos(nextRad) * radius;
        const y2 = centerY + Math.sin(nextRad) * radius;
        
        doc.setDrawColor(...hexToRgb(colors[idx]));
        doc.setLineWidth(8); // Thickness of donut
        doc.line(x1, y1, x2, y2);
      }
      
      currentAngle += sliceAngle;
    });

    // Center circle (white)
    doc.setFillColor(255, 255, 255);
    doc.circle(centerX, centerY, radius - 8, 'F');

    // Center text - Total
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
    doc.text('Total', centerX, centerY - 3, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
    doc.text(fmtIDR(total), centerX, centerY + 3, { align: 'center' });
  }

  // Generate Yearly PDF Report
  function generateYearlyPDF() {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 15;

    // Modern Header - Minimalist
    doc.setFillColor(...hexToRgb(PDF_COLORS.bgDark));
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Logo/Brand area
    doc.setFillColor(...hexToRgb(PDF_COLORS.accent));
    doc.roundedRect(14, 8, 6, 6, 1, 1, 'F');
    
    doc.setTextColor(...hexToRgb(PDF_COLORS.textWhite));
    doc.setFontSize(20);
    doc.text(`${projectName} - Annual Report`, 25, 13);
    
    doc.setFontSize(11);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
    doc.text(`Fiscal Year ${year}`, 25, 20);
    
    // Date generated
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - 14, 13, { align: 'right' });
    
    yPos = 45;

    // Section: Key Metrics
    doc.setFontSize(12);
    doc.setTextColor(...hexToRgb(PDF_COLORS.primary));
    doc.text('Key Financial Metrics', 14, yPos);
    yPos += 8;

    const cardData = [
      { 
        label: 'Total Income', 
        value: fmtIDR(yearTotals.income), 
        bgColor: PDF_COLORS.bgSecondary,
        accentColor: PDF_COLORS.income
      },
      { 
        label: 'Total Expense', 
        value: fmtIDR(yearTotals.expense), 
        bgColor: PDF_COLORS.bgSecondary,
        accentColor: PDF_COLORS.expense
      },
      { 
        label: 'Investment', 
        value: fmtIDR(yearTotals.investment), 
        bgColor: PDF_COLORS.bgSecondary,
        accentColor: PDF_COLORS.investment
      },
      { 
        label: 'Net Profit', 
        value: fmtIDR(yearTotals.net), 
        bgColor: PDF_COLORS.bgSecondary,
        accentColor: yearTotals.net >= 0 ? PDF_COLORS.net : PDF_COLORS.expense
      }
    ];

    cardData.forEach((card, idx) => {
      const cardY = yPos + Math.floor(idx / 2) * 26;
      const cardX = 14 + (idx % 2) * 96;
      
      // Card background
      doc.setFillColor(...hexToRgb(card.bgColor));
      doc.roundedRect(cardX, cardY, 90, 22, 2, 2, 'F');
      
      // Accent bar on left
      doc.setFillColor(...hexToRgb(card.accentColor));
      doc.roundedRect(cardX, cardY, 3, 22, 2, 2, 'F');
      
      // Label
      doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
      doc.setFontSize(8);
      doc.text(card.label, cardX + 8, cardY + 7);
      
      // Value
      doc.setFontSize(11);
      doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
      doc.text(card.value, cardX + 8, cardY + 16);
    });

    yPos += 60;

    // Section: Trend Analysis
    doc.setFontSize(12);
    doc.setTextColor(...hexToRgb(PDF_COLORS.primary));
    doc.text('Monthly Trend Analysis', 14, yPos);
    yPos += 5;

    // Draw line chart
    drawLineChart(doc, 14, yPos, 120, 55, monthlyData);

    // Draw donut chart
    const donutCenterX = 160;
    const donutCenterY = yPos + 20;
    drawDonutChart(doc, donutCenterX, donutCenterY, 18, pieChartData);

    // Donut chart legend
    const legendStartY = yPos + 40;
    pieChartData.forEach((item, idx) => {
      const colors = [PDF_COLORS.income, PDF_COLORS.expense, PDF_COLORS.investment];
      const legY = legendStartY + idx * 5;
      
      doc.setFillColor(...hexToRgb(colors[idx]));
      doc.circle(145, legY - 1, 1.5, 'F');
      
      doc.setFontSize(7);
      doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
      doc.text(item.name, 150, legY);
      
      doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
      doc.text(`${item.percentage}%`, 180, legY, { align: 'right' });
    });

    yPos += 65;

    // Section: Monthly Breakdown
    doc.setFontSize(12);
    doc.setTextColor(...hexToRgb(PDF_COLORS.primary));
    doc.text('Monthly Breakdown', 14, yPos);
    yPos += 8;

    // Table Header
    doc.setFillColor(...hexToRgb(PDF_COLORS.bgDark));
    doc.roundedRect(14, yPos, 182, 7, 1, 1, 'F');
    
    doc.setTextColor(...hexToRgb(PDF_COLORS.textWhite));
    doc.setFontSize(8);
    doc.text('Month', 18, yPos + 4.5);
    doc.text('Income', 122, yPos + 4.5, { align: 'right' });
    doc.text('Expense', 148, yPos + 4.5, { align: 'right' });
    doc.text('Investment', 170, yPos + 4.5, { align: 'right' });
    doc.text('Net', 193, yPos + 4.5, { align: 'right' });
    
    yPos += 7;

    // Table Body
    monthlyData.forEach((m, idx) => {
      const monthName = new Date(year, idx, 1).toLocaleString('en-US', { month: 'short' });
      
      // CORRECTED: Net Profit = Income - Expense - Depreciation
      // Depreciation deducted per month if there's activity
      const hasActivity = m.income > 0 || m.expense > 0;
      const net = m.income - m.expense - (hasActivity ? monthlyDepreciation : 0);
      
      // Alternating row colors
      if (idx % 2 === 0) {
        doc.setFillColor(...hexToRgb(PDF_COLORS.bgPrimary));
        doc.rect(14, yPos, 182, 6, 'F');
      }
      
      doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
      doc.setFontSize(7);
      doc.text(monthName, 18, yPos + 4);
      
      doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
      doc.text(fmtIDR(m.income), 122, yPos + 4, { align: 'right' });
      doc.text(fmtIDR(m.expense), 148, yPos + 4, { align: 'right' });
      doc.text(fmtIDR(m.investment), 170, yPos + 4, { align: 'right' });
      
      // Net with color coding
      doc.setTextColor(...hexToRgb(net >= 0 ? PDF_COLORS.income : PDF_COLORS.expense));
      doc.text(fmtIDR(net), 193, yPos + 4, { align: 'right' });
      
      yPos += 6;
    });

    // Table Border
    doc.setDrawColor(...hexToRgb(PDF_COLORS.border));
    doc.setLineWidth(0.3);
    doc.roundedRect(14, yPos - 72, 182, 79, 1, 1, 'S');

    yPos += 10;

    // Footer - Professional
    const footerY = pageHeight - 15;
    doc.setDrawColor(...hexToRgb(PDF_COLORS.borderLight));
    doc.setLineWidth(0.3);
    doc.line(14, footerY, pageWidth - 14, footerY);
    
    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
    doc.text(`${projectName} Financial Report`, 14, footerY + 5);
    doc.text(`Page 1 of 1`, pageWidth - 14, footerY + 5, { align: 'right' });
    
    doc.setFontSize(6);
    doc.text(`© ${new Date().getFullYear()} BUKABOX M4 ROI system. All rights reserved.`, pageWidth / 2, footerY + 8, { align: 'center' });

    doc.save(`${projectName.replace(/\s+/g, '-')}-Annual-Report-${year}.pdf`);
  }

  // Generate Monthly PDF Report
  function generateMonthlyPDF() {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    let pageNum = 1;

    grouped.forEach((group, groupIdx) => {
      if (groupIdx > 0) {
        doc.addPage();
        pageNum++;
      }

      let yPos = 15;

      // Modern Header
      doc.setFillColor(...hexToRgb(PDF_COLORS.bgDark));
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      // Logo/Brand area
      doc.setFillColor(...hexToRgb(PDF_COLORS.accent));
      doc.roundedRect(14, 8, 6, 6, 1, 1, 'F');
      
      doc.setTextColor(...hexToRgb(PDF_COLORS.textWhite));
      doc.setFontSize(18);
      doc.text(`${projectName} - Monthly Report`, 25, 13);
      
      doc.setFontSize(11);
      doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
      doc.text(monthLabel(group.key), 25, 20);
      
      // Date & page number
      doc.setFontSize(8);
      doc.text(`Page ${pageNum}/${grouped.length}`, pageWidth - 14, 13, { align: 'right' });
      
      yPos = 45;

      // Calculate month totals
      const txs = group.txs;
      const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const totalInvest = txs.filter(t => t.type === 'investment').reduce((s, t) => s + t.amount, 0);
      
      // CORRECTED: Net Profit = Income - Expense - Depreciation
      const hasActivity = totalIncome > 0 || totalExpense > 0;
      const monthNet = totalIncome - totalExpense - (hasActivity ? monthlyDepreciation : 0);

      // Section: Monthly Summary
      doc.setFontSize(11);
      doc.setTextColor(...hexToRgb(PDF_COLORS.primary));
      doc.text('Monthly Summary', 14, yPos);
      yPos += 8;

      const monthCards = [
        { 
          label: 'Income', 
          value: fmtIDR(totalIncome), 
          bgColor: PDF_COLORS.bgSecondary,
          accentColor: PDF_COLORS.income
        },
        { 
          label: 'Expense', 
          value: fmtIDR(totalExpense), 
          bgColor: PDF_COLORS.bgSecondary,
          accentColor: PDF_COLORS.expense
        },
        { 
          label: 'Investment', 
          value: fmtIDR(totalInvest), 
          bgColor: PDF_COLORS.bgSecondary,
          accentColor: PDF_COLORS.investment
        },
        { 
          label: 'Net', 
          value: fmtIDR(monthNet), 
          bgColor: PDF_COLORS.bgSecondary,
          accentColor: monthNet >= 0 ? PDF_COLORS.net : PDF_COLORS.expense
        }
      ];

      monthCards.forEach((card, idx) => {
        const cardY = yPos + Math.floor(idx / 2) * 22;
        const cardX = 14 + (idx % 2) * 96;
        
        // Card background
        doc.setFillColor(...hexToRgb(card.bgColor));
        doc.roundedRect(cardX, cardY, 90, 18, 2, 2, 'F');
        
        // Accent bar
        doc.setFillColor(...hexToRgb(card.accentColor));
        doc.roundedRect(cardX, cardY, 3, 18, 2, 2, 'F');
        
        // Label
        doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
        doc.setFontSize(7);
        doc.text(card.label, cardX + 8, cardY + 6);
        
        // Value
        doc.setFontSize(9);
        doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
        doc.text(card.value, cardX + 8, cardY + 13);
      });

      yPos += 52;

      // Section: Transaction Details - with space check
      const footerStartY = pageHeight - 25; // Reserve space for footer
      const availableSpace = footerStartY - yPos;
      const rowHeight = 5;
      const headerHeight = 6;
      const titleHeight = 10;
      const maxRows = Math.floor((availableSpace - headerHeight - titleHeight - 15) / rowHeight);
      const txToShow = Math.min(Math.max(maxRows, 3), txs.length, 22); // Min 3, max 22
      
      // Only show table if we have space
      if (txToShow >= 3 && availableSpace > 40) {
        doc.setTextColor(...hexToRgb(PDF_COLORS.primary));
        doc.setFontSize(11);
        doc.text(`Transaction Details (${txs.length} transactions)`, 14, yPos);
        yPos += 8;

        // Table Header
        doc.setFillColor(...hexToRgb(PDF_COLORS.bgDark));
        doc.roundedRect(14, yPos, 182, 6, 1, 1, 'F');
        
        doc.setTextColor(...hexToRgb(PDF_COLORS.textWhite));
        doc.setFontSize(7);
        doc.text('Date', 18, yPos + 4);
        doc.text('Description', 38, yPos + 4);
        doc.text('Type', 100, yPos + 4);
        doc.text('Category', 125, yPos + 4);
        doc.text('Amount', 193, yPos + 4, { align: 'right' });
        
        yPos += 6;

        const startY = yPos;

        // Table Body - show calculated amount
        txs.slice(0, txToShow).forEach((t, idx) => {
        const dateStr = new Date(t.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
        const typeLabel = t.type === 'income' ? 'Income' : t.type === 'expense' ? 'Expense' : 'Invest';
        const amountStr = (t.type === 'income' ? '+' : '-') + fmtIDR(Math.abs(t.amount));
        const streamText = (t.stream || t.category || '—').substring(0, 18);
        const labelText = t.label.substring(0, 28);
        
        // Alternating row colors
        if (idx % 2 === 0) {
          doc.setFillColor(...hexToRgb(PDF_COLORS.bgPrimary));
          doc.rect(14, yPos, 182, 5, 'F');
        }
        
        doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
        doc.setFontSize(6);
        doc.text(dateStr, 18, yPos + 3.5);
        doc.text(labelText, 38, yPos + 3.5);
        
        // Type badge
        const typeColor = t.type === 'income' ? PDF_COLORS.income : 
                         t.type === 'expense' ? PDF_COLORS.expense : 
                         PDF_COLORS.investment;
        doc.setTextColor(...hexToRgb(typeColor));
        doc.setFontSize(6);
        doc.text(typeLabel, 100, yPos + 3.5);
        
        doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
        doc.text(streamText, 125, yPos + 3.5);
        
        // Amount with color
        doc.setTextColor(...hexToRgb(t.type === 'income' ? PDF_COLORS.income : PDF_COLORS.expense));
        doc.setFontSize(7);
        doc.text(amountStr, 193, yPos + 3.5, { align: 'right' });
        
        yPos += 5;
        });

        // Table Border
        const tableHeight = txToShow * 5;
        doc.setDrawColor(...hexToRgb(PDF_COLORS.border));
        doc.setLineWidth(0.3);
        doc.roundedRect(14, startY, 182, tableHeight, 1, 1, 'S');

        // If more transactions, show note
        if (txs.length > txToShow) {
          yPos += 3;
          doc.setFontSize(6);
          doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
          doc.text(`Showing first ${txToShow} of ${txs.length} transactions`, 14, yPos);
          yPos += 5;
        } else {
          yPos += 5;
        }
      }

      // Ensure minimum spacing before footer
      yPos = Math.max(yPos, footerStartY);

      // Footer
      const footerY = pageHeight - 15;
      doc.setDrawColor(...hexToRgb(PDF_COLORS.borderLight));
      doc.setLineWidth(0.3);
      doc.line(14, footerY, pageWidth - 14, footerY);
      
      doc.setFontSize(7);
      doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
      doc.text(`${projectName} Monthly Report`, 14, footerY + 5);
      doc.text(`Page ${pageNum} of ${grouped.length}`, pageWidth - 14, footerY + 5, { align: 'right' });
      
      doc.setFontSize(6);
      doc.text(`© ${new Date().getFullYear()} BUKABOX M4 ROI system. All rights reserved.`, pageWidth / 2, footerY + 8, { align: 'center' });
    });

    doc.save(`${projectName.replace(/\s+/g, '-')}-Monthly-Report-${year}.pdf`);
  }

  async function exportPdf(mode: 'yearly' | 'monthly') {
    setLoadingPdf(true);
    setShowExportMenu(false);
    
    try {
      if (mode === 'yearly') {
        generateYearlyPDF();
      } else {
        generateMonthlyPDF();
      }
    } catch (e) {
      console.warn('exportPdf failed', e);
    }
    
    setLoadingPdf(false);
  }

  // Expose export functions to parent component via ref
  useImperativeHandle(ref, () => ({
    exportYearlyPDF: () => {
      generateYearlyPDF();
    },
    exportMonthlyPDF: () => {
      generateMonthlyPDF();
    }
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="text-gray-900 dark:text-gray-100">Annual Report</h2>
          <p className="text-gray-500">Comprehensive financial overview for {year}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'no-wrap', position: 'relative' }}>
          <Button variant="outline" onClick={() => setYear(y => y - 1)}>
            Previous Year
          </Button>
          <Button variant="outline" onClick={() => setYear(new Date().getFullYear())}>
            This Year
          </Button>
          <div style={{ position: 'relative' }}>
            <Button 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              onClick={() => setShowExportMenu(!showExportMenu)} 
              disabled={loadingPdf}
            >
              <Download className="w-4 h-4 mr-2" />
              {loadingPdf ? 'Exporting...' : 'Export PDF'}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
            {showExportMenu && !loadingPdf && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
                <div className="py-1">
                  <button
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                    onClick={() => exportPdf('yearly')}
                  >
                    <FileText className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="font-medium">Laporan Tahunan</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">1 halaman ringkasan {year}</div>
                    </div>
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700" />
                  <button
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                    onClick={() => exportPdf('monthly')}
                  >
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <div>
                      <div className="font-medium">Laporan Bulanan</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{grouped.length} bulan detail transaksi</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div ref={reportRef} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Year Summary Cards moved to App.tsx - shows above tabs when Report tab is active */}

        {/* Charts Section */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: isDesktop ? '2fr 1fr' : '1fr',
          gap: '1.5rem'
        }}>
          {/* Trend Chart */}
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-gray-900 dark:text-gray-100">Monthly Trend</h3>
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
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-gray-900 dark:text-gray-100">Distribution</h3>
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
                    <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                  </div>
                  <span className="text-gray-900 dark:text-gray-100">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Monthly Breakdown Accordion */}
        <Card className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${isDesktop ? 'p-6' : 'p-0'}`}>
          <div className={`flex items-center gap-2 ${isDesktop ? 'mb-6' : 'mb-0 p-6 pb-0'}`}>
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-gray-900 dark:text-gray-100">Monthly Breakdown</h3>
          </div>

          {grouped.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No transactions for {year}
            </div>
          ) : (
            <Accordion type="single" collapsible className={isDesktop ? 'space-y-3' : 'space-y-3 p-6 pt-3'}>
              {grouped.map(({ key, txs }) => {
                const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
                const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                const totalInvest = txs.filter(t => t.type === 'investment').reduce((s, t) => s + t.amount, 0);
                const monthTotal = totalIncome - totalExpense - totalInvest;

                return (
                  <AccordionItem 
                    key={key} 
                    value={key}
                    className={isDesktop ? 'border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden' : 'border-0 rounded-none overflow-hidden'}
                  >
                    <AccordionTrigger className="hover:no-underline px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className={`w-full ${isDesktop ? 'flex items-center justify-between pr-2' : 'flex flex-col gap-3'}`}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="text-gray-900 dark:text-gray-100 font-medium">{monthLabel(key)}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">{txs.length} transactions</p>
                          </div>
                        </div>
                        <div className={isDesktop ? 'text-right' : 'text-left pl-16'}>
                          <span className="text-gray-500 dark:text-gray-400 text-sm">Net Total</span>
                          <span className={`font-semibold ${monthTotal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {monthTotal >= 0 ? '+' : ''}{fmtIDR(monthTotal)}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent style={isDesktop ? { paddingTop: '1rem', paddingBottom: '1rem', paddingLeft: '1.25rem', paddingRight: '1.25rem' } : {}}>
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Month Summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                          <div className="bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600" style={{ padding: '0.75rem' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-400">Income</span>
                            </div>
                            <p className="text-green-600 dark:text-green-400 font-semibold">{fmtIDR(totalIncome)}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600" style={{ padding: '0.75rem' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                                <TrendingDown className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-400">Expense</span>
                            </div>
                            <p className="text-red-600 dark:text-red-400 font-semibold">{fmtIDR(totalExpense)}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600" style={{ padding: '0.75rem' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                                <BarChart3 className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-400">Investment</span>
                            </div>
                            <p className="text-orange-600 dark:text-orange-400 font-semibold">{fmtIDR(totalInvest)}</p>
                          </div>
                        </div>

                        {/* Transactions Table */}
                        <div className="bg-white dark:bg-gray-700/30 rounded-lg overflow-hidden border border-gray-300 dark:border-[#212730ff]">
                          <div className="overflow-x-auto">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                  <th className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ padding: '0.75rem 1rem' }}>Date</th>
                                  <th className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ padding: '0.75rem 1rem' }}>Description</th>
                                  <th className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ padding: '0.75rem 1rem' }}>Type</th>
                                  <th className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ padding: '0.75rem 1rem' }}>Stream</th>
                                  <th className="text-right text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ padding: '0.75rem 1rem' }}>Amount</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800/50">
                                {txs.map((t, idx) => (
                                  <tr key={t.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${idx < txs.length - 1 ? 'border-b border-gray-300 dark:border-[#212730ff]' : ''}`}>
                                    <td className="text-sm text-gray-600 dark:text-gray-400" style={{ padding: '0.75rem 1rem' }}>
                                      {new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                    </td>
                                    <td className="text-sm text-gray-900 dark:text-gray-200" style={{ padding: '0.75rem 1rem' }}>
                                      {t.label}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                      <Badge
                                        className={`${
                                          t.type === 'income'
                                            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                                            : t.type === 'expense'
                                              ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                                              : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                                        }`}
                                      >
                                        {t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                                      </Badge>
                                    </td>
                                    <td className="text-sm text-gray-600 dark:text-gray-400" style={{ padding: '0.75rem 1rem' }}>
                                      {t.stream || t.category || '—'}
                                    </td>
                                    <td 
                                      className={`text-sm font-semibold text-right ${
                                        t.type === 'income' 
                                          ? 'text-green-600 dark:text-green-400' 
                                          : 'text-red-600 dark:text-red-400'
                                      }`} 
                                      style={{ padding: '0.75rem 1rem' }}
                                    >
                                      {t.type === 'income' ? '+' : '-'}{fmtIDR(Math.abs(t.amount))}
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
            <span>{projectName} • {new Date().toLocaleDateString('id-ID')} • BUKABOX</span>
          </div>
        </div>
      </div>
    </div>
  );
});

Report.displayName = 'Report';

export default Report;