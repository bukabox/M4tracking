// src/components/ProductList.tsx
import { forwardRef, useMemo, useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Input } from './ui/input';
import { useCurrency } from '../contexts/CurrencyContext';
import {
  TrendingUp,
  Hash,
  ArrowUp,
  ArrowDown,
  FileText,
  Search,
  Package,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ProductData {
  id: string;
  name: string;
  total_revenue: number;
}

type Tx = {
  id: string | number;
  type?: string;
  date?: string;
  label?: string;
  amount?: number;
  stream?: string;
  note?: string;
  category?: string;
  stickerId?: string | number;
  packId?: string | number;
};

interface ProductListProps {
  products: ProductData[];
  transactions: Tx[];
  pageSize?: number;
}

function makeStaticUrl(id: string) {
  return `https://stickershop.line-scdn.net/stickershop/v1/product/${encodeURIComponent(id)}/LINEStorePC/main.png?v=1`;
}
function makeAnimationUrl(id: string) {
  return `https://stickershop.line-scdn.net/stickershop/v1/product/${encodeURIComponent(id)}/iPhone/main_animation@2x.png?v=1`;
}
function makeStickerWebpUrl(id: string) {
  return `https://stickershop.line-scdn.net/stickershop/v1/sticker/${encodeURIComponent(id)}/ANDROID/sticker.webp`;
}

function extractStickerId(tx: Tx): string | null {
  if (!tx) return null;

  if (tx.note && typeof tx.note === 'string') {
    const m = tx.note.match(/sticker[:=]\s*([0-9]+)/i);
    if (m) return m[1];
  }

  if ((tx as any).packId) return String((tx as any).packId);

  if (tx.stickerId) {
    const s = String(tx.stickerId);
    if (String(tx.id) !== s && s.length >= 4 && s.length <= 12) return s;
  }

  if (tx.label && typeof tx.label === 'string') {
    const m2 = tx.label.match(/\b([0-9]{4,})\b/);
    if (m2) return m2[1];
  }

  return null;
}

// Component untuk Paginasi Detail Transactions
const TransactionPagination = ({ entries, productName }: { entries: Tx[], productName: string }) => {
  const [detailPage, setDetailPage] = useState(1);
  const detailPageSize = 5; // 5 items per page untuk detail

  const totalDetailPages = Math.max(1, Math.ceil(entries.length / detailPageSize));
  
  // Reset to page 1 if entries change
  useEffect(() => {
    setDetailPage(1);
  }, [entries.length]);

  const visibleEntries = useMemo(() => {
    const start = (detailPage - 1) * detailPageSize;
    return entries.slice(start, start + detailPageSize);
  }, [entries, detailPage, detailPageSize]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: "numeric", month: "2-digit", day: "2-digit"
    }).replace(/\//g, '-');
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false
    });
  };

  const formatCurrency = (amount?: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
      .format(amount || 0);

  const getCategoryIcon = (label?: string, type?: string) => {
    const t = (type || "").toLowerCase();
    if (t === "income") return <TrendingUp className="w-5 h-5" />;
    return <Hash className="w-5 h-5" />;
  };

  const getCategoryName = (label?: string, type?: string) => {
    const t = (type || '').toLowerCase();
    if (t === "income") return "Income";
    return label || "General";
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-gray-900 dark:text-gray-100 font-medium">Product Transactions</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
          {entries.length} total
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">No transactions for this product.</div>
      ) : (
        <>
          <div className="space-y-3">
            {visibleEntries.map((tx) => {
              const sid = extractStickerId(tx);
              const thumbUrl = sid ? makeStaticUrl(sid) : null;

              return (
                <div key={tx.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt="sticker"
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              try {
                                const img = e.currentTarget as HTMLImageElement;
                                if (!img.dataset.triedAnim && sid) {
                                  img.dataset.triedAnim = "1";
                                  img.src = makeAnimationUrl(sid);
                                  return;
                                }
                                if (!img.dataset.triedSticker && sid) {
                                  img.dataset.triedSticker = "1";
                                  img.src = makeStickerWebpUrl(sid);
                                  return;
                                }
                                img.onerror = null;
                                img.style.visibility = 'hidden';
                              } catch (_) {}
                            }}
                          />
                        ) : (
                          getCategoryIcon(tx.label, tx.type)
                        )}
                      </div>

                      <div>
                        <p className="text-gray-900 dark:text-gray-100 font-medium text-left">
                          {tx.label || productName}
                        </p>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <span>{getCategoryName(tx.label, tx.type)}</span>
                          <span className="mx-2">•</span>
                          <span>{formatDate(tx.date)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`${(tx.type || '').toLowerCase() === 'income'
                        ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} font-semibold`}>
                        {(tx.type || '').toLowerCase() === 'income' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDateTime(tx.date)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail Pagination - Only show if more than 5 items */}
          {totalDetailPages > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Showing {(detailPage - 1) * detailPageSize + 1}-{Math.min(detailPage * detailPageSize, entries.length)} of {entries.length}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="p-1.5 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    onClick={() => setDetailPage(p => Math.max(1, p - 1))}
                    disabled={detailPage <= 1}
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalDetailPages, 5) }).map((_, i) => {
                      let pageNum;
                      if (totalDetailPages <= 5) {
                        pageNum = i + 1;
                      } else {
                        // Show smart pagination
                        if (detailPage <= 3) {
                          pageNum = i + 1;
                        } else if (detailPage >= totalDetailPages - 2) {
                          pageNum = totalDetailPages - 4 + i;
                        } else {
                          pageNum = detailPage - 2 + i;
                        }
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => setDetailPage(pageNum)}
                          className={`w-7 h-7 text-xs rounded transition-all ${
                            pageNum === detailPage
                              ? 'bg-green-600 text-white shadow-sm'
                              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    className="p-1.5 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    onClick={() => setDetailPage(p => Math.min(totalDetailPages, p + 1))}
                    disabled={detailPage >= totalDetailPages}
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export const ProductList = forwardRef<HTMLDivElement, ProductListProps>(({ products = [], transactions = [], pageSize = 10 }, ref) => {

  const { formatCurrency } = useCurrency();
  const [page, setPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortKey, setSortKey] = useState<'name' | 'total_revenue'>('total_revenue');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  // <-- NEW: local transactions state so component can update itself when new tx events arrive
  const [localTx, setLocalTx] = useState<Tx[]>(transactions || []);
  // Keep localTx in sync if parent updates the transactions prop (initial load / bulk refresh)
  useEffect(() => {
    setLocalTx(transactions || []);
  }, [transactions]);

  // Listen for global event dispatched by TransactionDialog (transaction:added)
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        // CustomEvent detail contains transaction payload
        const ce = e as CustomEvent;
        const newTx = ce.detail as Tx | undefined;
        if (!newTx) return;
        // prepend so newest shows first
        setLocalTx(prev => {
          // avoid duplicates if same id exists
          if (prev.some(t => String(t.id) === String(newTx.id))) return prev;
          return [newTx, ...prev];
        });
        // ensure we show first page / make it visible to user
        setPage(1);
      } catch (_) { /* swallow */ }
    };
    window.addEventListener('transaction:added', handler as EventListener);
    return () => window.removeEventListener('transaction:added', handler as EventListener);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [products.length, searchTerm]);

  const normalize = (s?: string) => (s || '').toLowerCase().trim();

  // Use localTx instead of transactions so component updates by itself
  const entriesByProduct = useMemo(() => {
    // Build mapping product_id -> product normalized name (norm)
    const idToNorm = new Map<string, string>();
    const productMapById = new Map<string, any>();
    for (const p of products) {
      const pid = String((p as any).product_id ?? p.id ?? "").trim();
      if (pid) {
        idToNorm.set(pid, normalize(p.name));
        productMapById.set(pid, p);
      }
    }

    // create map with keys = normalized product name, but index by product_id so grouping is stable
    const map = new Map<string, Tx[]>();
    // initialize keys for known products so empty groups show
    for (const p of products) {
      const norm = normalize(p.name);
      if (!map.has(norm)) map.set(norm, []);
    }

    for (const tx of localTx) {
      // prefer product_id if present and maps to a known product
      const pid = String((tx as any).product_id ?? "").trim();
      let key: string | null = null;
      if (pid && idToNorm.has(pid)) {
        key = idToNorm.get(pid)!;
      } else {
        // fallback to normalized label/category
        key = normalize(tx.label || tx.category || "Unknown Product");
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }

    // sort each product's transactions by date desc
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => {
        const ta = new Date(a.date || 0).getTime();
        const tb = new Date(b.date || 0).getTime();
        return tb - ta;
      });
    }
    return map;
  }, [localTx, products]);

  // Recompute revenue per product from local transactions (only income type)
  const revenueByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of localTx) {
      if (!tx) continue;
      const key = normalize(tx.label || tx.category || "Unknown Product");
      const amt = Number(tx.amount || 0);
      // only sum income transactions (mimic total_revenue semantics)
      if ((tx.type || '').toLowerCase() === 'income') {
        map.set(key, (map.get(key) || 0) + amt);
      }
    }
    return map;
  }, [localTx]);

  const normalizedProducts = useMemo(
    () => products.map(p => ({ ...p, _norm: normalize(p.name) })),
    [products]
  );

  const sorted = useMemo(() => {
    const sterm = normalize(searchTerm);
    let list = normalizedProducts.filter(p => p._norm.includes(sterm));
    list.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? (aVal as string).localeCompare(bVal as string) : (bVal as string).localeCompare(aVal as string);
      } else {
        return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      }
    });
    return list;
  }, [normalizedProducts, searchTerm, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]);
  const visible = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const getSortIcon = (key: 'name' | 'total_revenue') =>
    sortKey === key ? (sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : null;

  return (
    <Card className="p-6 bg-white border-gray-200" ref={ref}>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-5 h-5 text-gray-600" />
          <h3 className="text-gray-900">Product SKUs</h3>
        </div>
      </div>
      
      <div className="flex gap-4 justify-between mb-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-full max-w-sm">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="pl-9"
            />
            <div className="absolute left-auto right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="hidden sm:grid grid-cols-2 text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-2 rounded-t">
          <div
            onClick={() => {
              setSortKey('total_revenue');
              setSortDirection(sortKey === 'total_revenue'
                ? (sortDirection === 'desc' ? 'asc' : 'desc')
                : 'desc');
            }}
            className="flex items-center justify-end cursor-pointer"
          >
            Sort {getSortIcon('total_revenue')}
          </div>
        </div>
      </div>

      <div className="mt-2">
        {visible.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? `No products found for "${searchTerm}".` : 'No products available.'}
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">

            {visible.map((p) => {
              const entries = entriesByProduct.get(p._norm) || [];
              // prefer computed revenue (from live transactions), fallback to product.total_revenue
              const liveRevenue = revenueByProduct.get(p._norm);
              const displayRevenue = typeof liveRevenue === 'number' ? liveRevenue : p.total_revenue;

              return (
                <AccordionItem
                  key={p.id}
                  value={p.id}
                  className="border border-gray-200 rounded-xl px-3 py-2 hover:border-gray-300 transition-colors"
                >
                  <AccordionTrigger className="hover:no-underline py-0">
                    <div className="flex items-center justify-between w-full">

                      <div className="flex items-center gap-1">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50 text-blue-600">
                          {(() => {
                            let finalThumbUrl: string | null = null;
                            let sid: string | null = null;
                            for (const tx of entries) {
                              const s = extractStickerId(tx);
                              if (s) {
                                sid = s;
                                finalThumbUrl = makeStaticUrl(s);
                                break;
                              }
                            }

                            // fallback: prefer product.url_id (explicit store id) then product.product_id / p.id
                            if (!finalThumbUrl) {
                              const productCandidate = (p as any);
                              const urlId = (productCandidate.url_id || productCandidate.store_id || productCandidate.line_store_id || "").toString().trim();
                              const candidate = urlId || (productCandidate.product_id || productCandidate.id || "").toString().trim();
                              if (candidate && /^[0-9]{4,}$/.test(candidate)) {
                                sid = candidate;
                                finalThumbUrl = makeStaticUrl(candidate);
                              }
                            }

                            return finalThumbUrl ? (
                              <img
                                src={finalThumbUrl}
                                alt="sticker"
                                className="w-8 h-8 object-contain"
                                onError={(e) => {
                                  try {
                                    const img = e.currentTarget as HTMLImageElement;
                                    if (!img.dataset.triedAnim && sid) {
                                      img.dataset.triedAnim = "1";
                                      img.src = makeAnimationUrl(sid);
                                      return;
                                    }
                                    if (!img.dataset.triedSticker && sid) {
                                      img.dataset.triedSticker = "1";
                                      img.src = makeStickerWebpUrl(sid);
                                      return;
                                    }
                                    img.onerror = null;
                                    img.style.visibility = 'hidden';
                                  } catch (_) { /* swallow */ }
                                }}
                              />
                            ) : (
                              <Hash className="w-5 h-5" />
                            );
                          })()}
                        </div>

                        <div className="text-left">
                          <p className="text-gray-900">{p.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{entries.length} entries</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-500">{formatCurrency(displayRevenue)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-green-600 font-semibold">
                        {formatCurrency(displayRevenue)}
                      </div>

                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pt-4">
                    <TransactionPagination entries={entries} productName={p.name} />
                  </AccordionContent>

                </AccordionItem>
              );
            })}

          </Accordion>
        )}
      </div>

      {/* Main Pagination - 10 items per page */}
      {totalPages > 1 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span>-
              <span className="font-medium">{Math.min(page * pageSize, sorted.length)}</span> of
              <span className="font-medium"> {sorted.length}</span> products
            </div>

            <div className="flex items-center gap-2">
              <button
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                  let n;
                  if (totalPages <= 7) {
                    n = i + 1;
                  } else {
                    // Smart pagination
                    if (page <= 4) {
                      n = i + 1;
                    } else if (page >= totalPages - 3) {
                      n = totalPages - 6 + i;
                    } else {
                      n = page - 3 + i;
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => setPage(n)}
                      className={`w-9 h-9 text-sm rounded-lg transition-all ${
                        n === page
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>

              <button
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </Card>
  );
});

export default ProductList;
