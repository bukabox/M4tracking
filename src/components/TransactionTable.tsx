import { forwardRef, useImperativeHandle, useState, useMemo, useEffect } from 'react';
import { Card } from './ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion';
import { Badge } from './ui/badge';
import { 
  Trash2, 
  FileText, 
  Hash, 
  Clock, 
  CheckCircle, 
  Tag, 
  List,
  TrendingUp,
  Home,
  Utensils,
  Car,
  ShoppingBag,
  MapPin,
  CreditCard,
  BanknoteArrowDown,
  BanknoteArrowUp,
  ChevronDown
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// if you have a shared resolver keep it for compatibility; fallback to local getCategoryIcon if not available
let getCategoryInfo: any = undefined;
try {
  // prefer existing shared resolver if present
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const shared = require('./InvestmentList');
  if (shared && typeof shared.getCategoryInfo === 'function') getCategoryInfo = shared.getCategoryInfo;
} catch (e) {
  // ignore - we'll use local icon/name helpers below
}

// -------------------------
// Local category helpers (from your backup file)
// -------------------------
const getCategoryIcon = (label?: string, type?: string) => {
  const lowerLabel = (label || '').toLowerCase();
  const t = (type || '').toLowerCase();

  if (t === 'income') return <BanknoteArrowDown className="w-5 h-5" />;
  if (t === 'investment') return <TrendingUp className="w-5 h-5" />;
  if (t === 'expense') return <BanknoteArrowUp className="w-5 h-5" />;
  if (lowerLabel.includes('rent') || lowerLabel.includes('house')) return <Home className="w-5 h-5" />;
  if (lowerLabel.includes('food') || lowerLabel.includes('groceries') || lowerLabel.includes('restaurant')) return <Utensils className="w-5 h-5" />;
  if (lowerLabel.includes('transport') || lowerLabel.includes('car') || lowerLabel.includes('gas')) return <Car className="w-5 h-5" />;
  if (lowerLabel.includes('shopping') || lowerLabel.includes('clothes')) return <ShoppingBag className="w-5 h-5" />;
  return <Tag className="w-5 h-5" />;
};

const getCategoryName = (label?: string, type?: string) => {
  const lowerLabel = (label || '').toLowerCase();
  const t = (type || '').toLowerCase();

  if (t === 'income') return 'Income';
  if (t === 'expense') return 'Expense';
  if (t === 'investment') return 'Investment';
  if (lowerLabel.includes('rent') || lowerLabel.includes('house')) return 'Housing';
  if (lowerLabel.includes('food') || lowerLabel.includes('groceries')) return 'Food & Dining';
  if (lowerLabel.includes('transport') || lowerLabel.includes('car')) return 'Transportation';
  if (lowerLabel.includes('shopping')) return 'Shopping';
  return 'General';
};

const getCategoryColor = (label?: string, type?: string) => {
  const lowerLabel = (label || '').toLowerCase();
  const t = (type || '').toLowerCase();

  // Type-based colors
  if (t === 'income') return 'bg-green-500';
  if (t === 'expense') return 'bg-red-500';
  if (t === 'investment') return 'bg-orange-500';
  
  // Label-based colors for subcategories
  if (lowerLabel.includes('rent') || lowerLabel.includes('house')) return 'bg-blue-500';
  if (lowerLabel.includes('food') || lowerLabel.includes('groceries') || lowerLabel.includes('restaurant')) return 'bg-yellow-500';
  if (lowerLabel.includes('transport') || lowerLabel.includes('car') || lowerLabel.includes('gas')) return 'bg-purple-500';
  if (lowerLabel.includes('shopping') || lowerLabel.includes('clothes')) return 'bg-pink-500';
  
  // Default
  return 'bg-gray-500';
};

// -------------------------
// Types
// -------------------------
export interface Transaction {
  id: string | number;
  type?: 'income' | 'expense' | 'investment' | string;
  date?: string;
  label?: string;
  amount?: number;
  stream?: string;
  category?: string;
  note?: string;
  packId?: string | number;
  stickerId?: string | number;
  price_idr?: any;
  btc_price_idr?: any;
  btc_amount?: any;
  btc_units?: any;
  unit?: any;
  symbol?: string;
  meta?: any;
  [k: string]: any;
}

export interface TransactionTableProps {
  transactions: Transaction[];
  cryptoRefs?: any[]; // optional
  onDelete?: (id: string | number) => void;
  pageSize?: number;
}

export interface TransactionTableRef {
  scrollToTransaction: (id: string | number) => void;
}

const BTC_LOGO_URL = "https://www.svgrepo.com/show/303287/bitcoin-logo.svg";
const DEBUG_LOG = false;

// -------------------------
// Helpers: robust coercion & formatting
// -------------------------
const coerceNumberRobust = (v: any) => {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'object') {
    // try common numeric props
    const sub = v.value ?? v.amount ?? v.price ?? v[Object.keys(v)[0]] ?? null;
    if (sub != null) return coerceNumberRobust(sub);
    return null;
  }
  if (typeof v === 'string') {
    let s = v.trim();
    s = s.replace(/[,₩¥₹€£\s\u00A0]+/g, '');
    s = s.replace(/[^\d\.\-eE+]/g, '');
    if (s === '' || s === '.' || s === '-' || s === '+') return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const fmtIDR = (v: any) => {
  if (v == null) return '—';
  const n = coerceNumberRobust(v);
  if (n == null) return '—';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
};

const fmtCrypto = (v: any, maxDecimals = 8) => {
  if (v == null) return '—';
  const n = coerceNumberRobust(v);
  if (n == null) return '—';
  const fixed = n.toFixed(maxDecimals);
  return parseFloat(fixed).toString();
};

// -------------------------
// Crypto read helpers
// -------------------------
const coerceNumber = (v: any) => {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const readCryptoFields = (tx: any) => {
  const priceCandidates = [
    tx?.price_idr,
    tx?.priceIdr,
    tx?.btc_price_idr,
    tx?.btcPriceIdr,
    tx?.price,
    tx?.meta?.price_idr,
    tx?.meta?.priceIdr,
    tx?.meta?.price
  ];

  const unitCandidates = [
    tx?.btc_amount,
    tx?.btcAmount,
    tx?.btc_units,
    tx?.btcUnits,
    tx?.unit,
    tx?.meta?.btc_amount,
    tx?.meta?.btcAmount
  ];

  const price = priceCandidates.map(coerceNumber).find((v) => v != null) ?? null;
  let unit = unitCandidates.map(coerceNumber).find((v) => v != null) ?? null;

  // fallback compute: if unit missing and we have price + amount, compute
  if ((unit == null || !Number.isFinite(unit)) && price != null) {
    const amt = coerceNumber(tx?.amount);
    if (amt != null && price > 0) {
      const computed = amt / price;
      unit = Number.isFinite(computed) ? Number(Number(computed.toFixed(8))) : null;
    }
  }

  return { price, unit };
};

// Detect Bitcoin category strictly (only show crypto rows for BTC)
const isBitcoinCategory = (tx: any) => {
  const cat = String(tx?.category ?? tx?.label ?? '').toLowerCase();
  return cat === 'btc' || cat === 'bitcoin' || cat.includes('btc') || cat.includes('bitcoin');
};

// -------------------------
// Component
// -------------------------
export const TransactionTable = forwardRef<TransactionTableRef, TransactionTableProps>(function TransactionTable(
  { transactions = [], cryptoRefs = undefined, onDelete, pageSize = 5 }: TransactionTableProps,
  ref
) {
  const { t } = useLanguage();
  // resolved cryptoRefs not strictly required for BTC-only display, kept for compatibility
  const resolvedCryptoRefs = Array.isArray(cryptoRefs) && cryptoRefs.length > 0 ? cryptoRefs : (Array.isArray((window as any).__CRYPTO_REFS__) ? (window as any).__CRYPTO_REFS__ : []);

  // Track screen size for responsive behavior (same pattern as Header)
  const [isDesktop, setIsDesktop] = useState<boolean>(
    typeof window !== 'undefined' && window.innerWidth >= 768
  );

  const [activeTab, setActiveTab] = useState<'income' | 'expense' | 'investment'>('income');
  const [pageByTab, setPageByTab] = useState<Record<string, number>>({
    income: 1,
    expense: 1,
    investment: 1
  });

  // Track screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sorted = useMemo(() => {
    // Remove duplicates based on ID, keeping the LATEST transaction (most recent date)
    const uniqueMap = new Map();
    (transactions || []).forEach(tx => {
      const id = String(tx.id || '');
      if (!id) return; // Skip transactions without ID
      
      const existing = uniqueMap.get(id);
      if (!existing) {
        uniqueMap.set(id, tx);
      } else {
        // Keep the transaction with the more recent date
        const existingDate = new Date(existing.date || 0).getTime();
        const newDate = new Date(tx.date || 0).getTime();
        if (newDate > existingDate) {
          uniqueMap.set(id, tx);
        }
      }
    });
    
    return Array.from(uniqueMap.values()).sort((a, b) => {
      const ta = new Date(a.date || 0).getTime();
      const tb = new Date(b.date || 0).getTime();
      if (tb !== ta) return tb - ta;
      const ai = Number(String(a.id).replace(/\D/g, '')) || 0;
      const bi = Number(String(b.id).replace(/\D/g, '')) || 0;
      return bi - ai;
    });
  }, [transactions]);

  const incomeList = useMemo(() => sorted.filter(t => (t.type || '').toLowerCase() === 'income'), [sorted]);
  const expenseList = useMemo(() => sorted.filter(t => (t.type || '').toLowerCase() === 'expense'), [sorted]);
  const investmentList = useMemo(() => sorted.filter(t => (t.type || '').toLowerCase() === 'investment'), [sorted]);

  useEffect(() => setPageByTab(p => ({ ...p, income: 1 })), [incomeList.length]);
  useEffect(() => setPageByTab(p => ({ ...p, expense: 1 })), [expenseList.length]);
  useEffect(() => setPageByTab(p => ({ ...p, investment: 1 })), [investmentList.length]);

  const totalPagesFor = (list: Transaction[]) => Math.max(1, Math.ceil(list.length / pageSize));
  const currentPageFor = (tab: string) => pageByTab[tab] || 1;
  const setPageFor = (tab: string, n: number) => {
    setPageByTab(prev => ({ ...prev, [tab]: Math.min(Math.max(1, n), totalPagesFor(tab === 'income' ? incomeList : tab === 'expense' ? expenseList : investmentList)) }));
  };

  const visibleForTab = (tab: 'income' | 'expense' | 'investment') => {
    const list = tab === 'income' ? incomeList : tab === 'expense' ? expenseList : investmentList;
    const page = currentPageFor(tab);
    const start = (page - 1) * pageSize;
    const slice = list.slice(start, start + pageSize);
    
    // Dedupe by id+date to prevent duplicate keys in rendering
    const seen = new Set<string>();
    return slice.filter((tx) => {
      const key = `${String(tx.id ?? '')}|${String(tx.date ?? '')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  useImperativeHandle(ref, () => ({
    scrollToTransaction: (id: string | number) => {
      try {
        const el = document.getElementById(`txn-${id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (e) { /* ignore */ }
    }
  }), []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
  };
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  };
  const formatCurrency = (amount?: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);

  const goPrev = (tab: string) => setPageFor(tab, currentPageFor(tab) - 1);
  const goNext = (tab: string) => setPageFor(tab, currentPageFor(tab) + 1);
  const goToPage = (tab: string, n: number) => setPageFor(tab, n);

  useEffect(() => {
    const root = document.getElementById('transaction-table-root');
    if (root) root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeTab]);

  const tryFindCryptoRef = (tx: any) => {
    if (!Array.isArray(resolvedCryptoRefs) || resolvedCryptoRefs.length === 0) return null;
    const idStr = String(tx?.id ?? '').trim();
    const txNote = (tx?.note ?? tx?.label ?? '').toString().toLowerCase();

    const byDirectId = resolvedCryptoRefs.find(r => {
      const rid = r?.transaction_id ?? r?.tx_id ?? r?.txn_id ?? r?.id;
      return rid != null && String(rid) === idStr;
    });
    if (byDirectId) return byDirectId;

    if (txNote && txNote.length > 0) {
      const byNote = resolvedCryptoRefs.find(r => {
        const txt = (r?.note ?? r?.description ?? r?.remark ?? r?.label ?? '').toString().toLowerCase();
        if (!txt) return false;
        return txt.includes(txNote) || txNote.includes(txt);
      });
      if (byNote) return byNote;
    }

    if (tx?.date) {
      const dateOnly = tx.date.split('T')[0] ?? tx.date;
      const byDateSymbol = resolvedCryptoRefs.find(r => {
        const rdate = (r?.date ?? r?.created_at ?? '').toString().split('T')[0];
        const symbol = (r?.symbol ?? r?.category ?? '').toString().toLowerCase();
        return rdate === dateOnly && (symbol === 'btc' || symbol === 'bitcoin' || (tx?.category ?? '').toString().toLowerCase() === 'btc');
      });
      if (byDateSymbol) return byDateSymbol;
    }

    return null;
  };

  const renderTabSection = (tab: 'income' | 'expense' | 'investment') => {
    const list = tab === 'income' ? incomeList : tab === 'expense' ? expenseList : investmentList;
    const visible = visibleForTab(tab);
    const totalPages = totalPagesFor(list);
    const page = currentPageFor(tab);

    if (list.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          No {tab} transactions yet.
        </div>
      );
    }

    return (
      <>
        <Accordion type="single" collapsible className="space-y-3">
          {visible.map((tx, idx) => {
            if (DEBUG_LOG) console.debug('RENDER TX', tx?.id, tx);

            // Generate safe unique key with index fallback
            const itemKey = tx.id != null ? String(tx.id) : `tmp-${idx}`;

            // sticker id extraction (same logic as backup)
            const sid = (() => {
              try {
                if (!tx) return null;

                // 1) explicit stickerId field (preferred)
                if (tx.stickerId) {
                  const s = String(tx.stickerId).trim();
                  if (s && s.length >= 4 && /^[0-9]+$/.test(s)) return s;
                }

                // 1.5) explicit url_id or store_id on tx (sometimes used)
                const explicitUrlId = ((tx as any).url_id || (tx as any).store_id || (tx as any).line_store_id);
                if (explicitUrlId) {
                  const s = String(explicitUrlId).trim();
                  if (s && s.length >= 4 && /^[0-9]+$/.test(s)) return s;
                }

                // 2) try find in note (sticker:<id>)
                if (tx.note && typeof tx.note === 'string') {
                  const m = tx.note.match(/sticker[:=]\s*([0-9]+)/i);
                  if (m) return m[1];
                }

                // 3) fallback to product_id if present (this is grouping key from import)
                if ((tx as any).product_id) {
                  const pid = String((tx as any).product_id).trim();
                  if (pid && /^[0-9]{4,}$/.test(pid)) return pid;
                }

                // 4) packId as older fallback
                if ((tx as any).packId) {
                  const s = String((tx as any).packId).trim();
                  if (s && s.length >= 4 && /^[0-9]+$/.test(s)) return s;
                }

                // 5) try to extract numeric id from label
                if (tx.label && typeof tx.label === 'string') {
                  const m2 = tx.label.match(/\b([0-9]{4,})\b/);
                  if (m2) return m2[1];
                }

                return null;
              } catch { return null; }
            })();
            const staticUrl = sid ? `https://stickershop.line-scdn.net/stickershop/v1/product/${encodeURIComponent(sid)}/LINEStorePC/main.png?v=1` : null;

            // Determine category icon and name
            // PRIORITY SYSTEM:
            // 1. For Income/Expense with generic labels → use type-based icons (BanknoteArrowDown/Up)
            // 2. For Investment with specific labels → use getCategoryInfo for detailed icons (Monitor, Laptop, etc)
            // 3. For Expense with specific labels → use getCategoryInfo or label-based icons
            // 4. Fallback → use local helpers
            
            let categoryIcon: any = null;
            let categoryBgColor = '';
            let categoryName = '';
            const t = (tx.type || '').toLowerCase();
            
            // For INVESTMENT type, always try getCategoryInfo first for detailed mapping
            if (t === 'investment' && getCategoryInfo) {
              try {
                const info = getCategoryInfo(tx.label || tx.category || '');
                categoryIcon = info.icon;
                categoryBgColor = info.bgColor;
                categoryName = info.name;
              } catch {
                // Fallback to generic investment icon
                categoryIcon = getCategoryIcon(tx.label, tx.type);
                categoryBgColor = getCategoryColor(tx.label, tx.type);
                categoryName = getCategoryName(tx.label, tx.type);
              }
            }
            // For INCOME type, use type-based icon (unless label suggests specific category)
            else if (t === 'income') {
              categoryIcon = <BanknoteArrowDown className="w-5 h-5" />;
              categoryBgColor = 'bg-green-500';
              categoryName = 'Income';
            }
            // For EXPENSE type, check if getCategoryInfo has specific match, otherwise use type-based
            else if (t === 'expense') {
              if (getCategoryInfo) {
                try {
                  const info = getCategoryInfo(tx.label || tx.category || '');
                  // Only use getCategoryInfo if it's not the generic fallback
                  if (info.key !== 'other') {
                    categoryIcon = info.icon;
                    categoryBgColor = info.bgColor;
                    categoryName = info.name;
                  } else {
                    // Generic expense
                    categoryIcon = getCategoryIcon(tx.label, tx.type);
                    categoryBgColor = getCategoryColor(tx.label, tx.type);
                    categoryName = 'Expense';
                  }
                } catch {
                  categoryIcon = <BanknoteArrowUp className="w-5 h-5" />;
                  categoryBgColor = 'bg-red-500';
                  categoryName = 'Expense';
                }
              } else {
                categoryIcon = getCategoryIcon(tx.label, tx.type);
                categoryBgColor = getCategoryColor(tx.label, tx.type);
                categoryName = getCategoryName(tx.label, tx.type);
              }
            }
            // Fallback for other types
            else {
              categoryIcon = getCategoryIcon(tx.label, tx.type);
              categoryBgColor = getCategoryColor(tx.label, tx.type);
              categoryName = getCategoryName(tx.label, tx.type);
            }

            // read crypto fields (but we will only show them for Bitcoin category)
            let rawPrice = tx?.price_idr ?? null;
            let rawUnit = tx?.btc_amount ?? null;

            // if missing, try to find in resolvedCryptoRefs
            if ((rawPrice == null || rawUnit == null) && resolvedCryptoRefs.length > 0) {
              const ref = tryFindCryptoRef(tx);
              if (ref) {
                if (rawPrice == null) rawPrice = ref?.price_idr ?? ref?.price ?? ref?.btc_price_idr ?? rawPrice;
                if (rawUnit == null) rawUnit = ref?.btc_amount ?? ref?.amount ?? ref?.units ?? rawUnit;
                if (DEBUG_LOG) console.debug('MATCHED CRYPTO REF for tx', tx?.id, '=>', ref);
              }
            }

            const { price: priceNum, unit: unitNum } = readCryptoFields({ ...tx, price_idr: rawPrice, btc_amount: rawUnit, amount: tx?.amount });
            const displayPrice = priceNum != null ? fmtIDR(priceNum) : (rawPrice != null ? String(rawPrice) : '—');
            const displayUnit = unitNum != null ? `${fmtCrypto(unitNum)} BTC` : (rawUnit != null ? `${String(rawUnit)} BTC` : '—');

            const isBTC = isBitcoinCategory(tx);

            // Avatar rendering:
            // - sticker thumbnail if sid
            // - BTC logo if BTC category
            // - otherwise category circle using determined categoryIcon and categoryBgColor
            const avatar = sid ? (
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white flex items-center justify-center">
                <img src={staticUrl || undefined} alt={`${tx.label || 'sticker'} thumbnail`} className="w-12 h-12 object-contain" loading="lazy" />
              </div>
            ) : isBTC ? (
              <div className="w-12 h-12 flex items-center justify-center bg-white">
                <img src={BTC_LOGO_URL} alt="BTC" className="w-10 h-10" style={{ display: 'block' }} />
              </div>
            ) : (
              // Use the determined categoryIcon and categoryBgColor
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${categoryBgColor}`}
              >
                {categoryIcon}
              </div>
            );

            // Ensure categoryName uses correct value based on type
            const finalCategoryName = (() => {
              const ttype = (tx.type || '').toLowerCase();
              if (ttype === 'income') return 'Income';
              if (ttype === 'expense') return 'Expense';
              if (ttype === 'investment') return 'Investment';
              // Fallback to category info or categoryName
              return getCategoryInfo ? (getCategoryInfo(tx.label || tx.category || '')?.name ?? categoryName) : categoryName;
            })();

            return (
              <AccordionItem
                key={itemKey}
                value={String(tx.id)}
                id={`txn-${tx.id}`}
                className="border border-gray-200 rounded-xl relative overflow-visible md:overflow-hidden hover:border-gray-300 transition-colors"
              >
                {/* Delete Icon - Mobile Only (keluar 50% dari accordion, center vertical, smaller size) */}
                {!isDesktop && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onDelete && onDelete(tx.id);
                    }}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onDelete && onDelete(tx.id);
                      }
                    }}
                    className="absolute top-1/2 -translate-y-1/2 -right-4 z-20 w-8 h-8 rounded-full bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center cursor-pointer shadow-lg transition-colors"
                    aria-label="Delete transaction"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                  </div>
                )}

                {/* Delete Icon - Desktop Only (top-right inside accordion) */}
                {isDesktop && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onDelete && onDelete(tx.id);
                    }}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onDelete && onDelete(tx.id);
                      }
                    }}
                    className="absolute top-3 right-10 z-10 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-md cursor-pointer transition-colors"
                    aria-label="Delete transaction"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                  </div>
                )}

                <AccordionTrigger className="hover:no-underline px-5 py-4 [&[data-state=open]>div>.chevron]:rotate-180">
                  {/* Row 1: Icon + Content + Nominal (vertically centered) */}
                  <div className={`flex items-center gap-3 w-full ${isDesktop ? 'pr-14' : ''}`}>
                    {avatar}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium mb-1">{tx.label || tx.category || '—'}</p>
                      
                      {/* Row 2: Stream/Category • Date */}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>
                          {(() => {
                            const ttype = String((tx as any)?.type ?? '').toLowerCase();
                            const maybeStream = ((tx as any)?.stream ?? (tx as any)?.platform ?? (tx as any)?.source ?? '').toString().trim();
                            if (ttype === 'income') {
                              if (maybeStream.length > 0) return maybeStream;
                              return 'Income';
                            }
                            return finalCategoryName;
                          })()}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span>{new Date(tx.date || '').toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                      </div>
                    </div>
                    
                    {/* Nominal - Right aligned and vertically centered */}
                    <div className={`text-sm font-semibold whitespace-nowrap ${
                      (tx.type || '').toLowerCase() === 'income' 
                        ? 'text-green-600' 
                        : (tx.type || '').toLowerCase() === 'investment'
                        ? 'text-orange-600'
                        : 'text-red-600'
                    }`}>
                      {(tx.type || '').toLowerCase() === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pt-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-gray-100">Transaction Receipt</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Hash className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Transaction ID</span>
                          </div>
                          <p className="text-gray-900 dark:text-gray-200 ml-6">TXN-{tx.id}</p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Date & Time</span>
                          </div>
                          <p className="text-gray-900 dark:text-gray-200 ml-6">{formatDateTime(tx.date)}</p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Merchant</span>
                          </div>
                          <p className="text-gray-900 dark:text-gray-200 ml-6">Payment Gateway</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CreditCard className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Payment Method</span>
                          </div>
                          <p className="text-gray-900 dark:text-gray-200 ml-6">Bank Transfer</p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                          </div>
                          <div className="ml-6">
                            <Badge className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40">Completed</Badge>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Tag className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Category</span>
                          </div>
                          <p className="text-gray-900 dark:text-gray-200 ml-6">{finalCategoryName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Crypto details: show ONLY for Bitcoin category */}
                    {isBTC && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Harga Entry (IDR)</span>
                          <span className="text-gray-900 dark:text-gray-200">
                            { displayPrice }
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Jumlah (BTC)</span>
                          <span className="text-gray-900 dark:text-gray-200">
                            { displayUnit }
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                        <span className="text-gray-900 dark:text-gray-200">{formatCurrency(tx.amount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900 dark:text-gray-100">Total Amount</span>
                        <span className={`${
                          (tx.type || '').toLowerCase() === 'income' 
                            ? 'text-green-600 dark:text-green-400' 
                            : (tx.type || '').toLowerCase() === 'investment'
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {(tx.type || '').toLowerCase() === 'income' ? '+' : ''}{formatCurrency(tx.amount)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Description</p>
                      <p className="text-gray-900 dark:text-gray-200">
                        {tx.note && String(tx.note).trim().length > 0 ? tx.note : (
                          (tx.type || '').toLowerCase() === 'income'
                            ? `Incoming payment for ${(tx.label || tx.category || '').toLowerCase()}`
                            : `Payment for ${(tx.label || tx.category || '').toLowerCase()}`
                        )}
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> - <span className="font-medium">{Math.min(page * pageSize, list.length)}</span> of <span className="font-medium">{list.length}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 rounded-md border border-gray-200 bg-white text-gray-700 disabled:opacity-50"
                onClick={() => goPrev(tab)}
                disabled={page <= 1}
              >
                Prev
              </button>

              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const n = i + 1;
                  return (
                    <button
                      key={n}
                      onClick={() => goToPage(tab, n)}
                      className={`px-2 py-1 rounded ${n === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>

              <button
                className="px-3 py-1 rounded-md border border-gray-200 bg-white text-gray-700 disabled:opacity-50"
                onClick={() => goNext(tab)}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <Card className="p-6 bg-white border-gray-200" id="transaction-table-root">
      <div className="mb-6">
        {/* Header - Desktop: Flex Between, Mobile: Flex Column Center */}
        <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between mb-6 gap-4 md:gap-0">
          {/* Title & Description - Mobile: Center, Desktop: Left */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2 mb-2">
              <List className="w-5 h-5 text-gray-600" />
              <h3 className="text-gray-900">Transactions</h3>
            </div>
            <p className="text-gray-500 text-sm">Filtered by type — Income, Expense, Investment</p>
          </div>

          {/* Tabs - Desktop: Right, Mobile: Centered */}
          <div className="inline-flex rounded-md bg-gray-100 p-1">
            <button
              onClick={() => setActiveTab('income')}
              className={`px-3 py-1 rounded ${activeTab === 'income' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'}`}
            >
              Income <span className="ml-2 text-xs text-gray-400">({incomeList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('expense')}
              className={`px-3 py-1 rounded ${activeTab === 'expense' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'}`}
            >
              Expense <span className="ml-2 text-xs text-gray-400">({expenseList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('investment')}
              className={`px-3 py-1 rounded ${activeTab === 'investment' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'}`}
            >
              Investment <span className="ml-2 text-xs text-gray-400">({investmentList.length})</span>
            </button>
          </div>
        </div>
      </div>

      <div>
        {activeTab === 'income' && renderTabSection('income')}
        {activeTab === 'expense' && renderTabSection('expense')}
        {activeTab === 'investment' && renderTabSection('investment')}
      </div>
    </Card>
  );
});

export default TransactionTable;