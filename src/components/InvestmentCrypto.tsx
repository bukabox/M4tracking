// src/components/InvestmentCrypto.tsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Card } from "./ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion";
import { Badge } from "./ui/badge";
import { RefreshCw } from "lucide-react";

/**
 * InvestmentCrypto.tsx (patched)
 * - loadTransactions() now called on mount
 * - listens for 'transaction:added' and 'crypto:updated' events and reloads data
 * - sorting improved so newest buys appear on top (date desc, then id desc)
 * - description for buys pulled from matching transaction note if available
 *
 * Notes: TransactionDialog posts `note` on add_transaction; main.py persists it as `note`.
 * See TransactionDialog.tsx and main.py for payload shape / server behaviour. :contentReference[oaicite:2]{index=2} :contentReference[oaicite:3]{index=3}
 */

// small helpers
function formatRp(n: number) {
  if (n == null || !Number.isFinite(n)) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(n));
}
function fmtNumber(n: number, decimals = 8) {
  if (n == null || !Number.isFinite(n)) return "0";
  const s = n.toFixed(decimals);
  return s.replace(/\.?0+$/, "");
}

// types
type BuyEntry = {
  id?: string | number;
  date?: string | null;
  amount?: number; // BTC amount
  price_idr?: number;
  invested_idr?: number;
  note?: string;
};

type Holding = {
  symbol?: string;
  name?: string;
  amount?: number; // aggregated amount
  total_invested_idr?: number;
  buys?: BuyEntry[];
};

export function InvestmentCrypto({ pageSize = 3 }: { pageSize?: number }) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [btcPriceIdr, setBtcPriceIdr] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [priceSource, setPriceSource] = useState<"internal" | "coingecko" | "none">("none");
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Load holdings from backend
  async function loadHoldings() {
    try {
      const res = await fetch("/api/crypto_holdings");
      if (!res.ok) throw new Error(`holdings fetch failed ${res.status}`);
      const j = await res.json();
      const arr = Array.isArray(j?.holdings) ? j.holdings : (Array.isArray(j) ? j : []);
      setHoldings(arr);
      return arr;
    } catch (e) {
      console.warn("loadHoldings failed", e);
      setHoldings([]);
      return [];
    }
  }

  async function loadTransactions() {
    try {
      const res = await fetch("/api/transactions");
      if (!res.ok) throw new Error(`transactions fetch failed ${res.status}`);
      const j = await res.json();
      const arr = Array.isArray(j) ? j : (Array.isArray(j?.transactions) ? j.transactions : []);
      // normalize: ensure date strings and sort desc by date (newest first)
      const normalized = arr.map(tx => ({
        ...tx,
        // keep id as-is; date may be undefined/null
      })).sort((a, b) => {
        const da = a?.date ? new Date(a.date).getTime() : 0;
        const db = b?.date ? new Date(b.date).getTime() : 0;
        if (db !== da) return db - da;
        // fallback to numeric id if possible
        const ida = Number(a?.id || 0);
        const idb = Number(b?.id || 0);
        return idb - ida;
      });
      setTransactions(normalized);
      return normalized;
    } catch (e) {
      console.warn("loadTransactions failed", e);
      setTransactions([]);
      return [];
    }
  }

  // Try internal price first, fallback to CoinGecko simple price if needed
  async function fetchInternalPrice(): Promise<number | null> {
    try {
      const res = await fetch("/api/crypto_prices?vs_currency=idr&symbols=btc");
      if (!res.ok) throw new Error("internal price fetch failed");
      const j = await res.json();
      const candidate = (j && (j["btc"] ?? j["BTC"])) ?? j ?? {};
      const idr = (candidate && (candidate["idr"] ?? candidate["IDR"] ?? candidate["price_idr"])) ?? (j && j["price_idr"]) ?? null;
      if (idr != null && Number.isFinite(Number(idr))) {
        const n = Number(idr);
        setPriceSource("internal");
        setBtcPriceIdr(n);
        return n;
      }
    } catch (e) {
      // silent fallback
    }
    return null;
  }

  async function fetchCoinGeckoPrice(): Promise<number | null> {
    try {
      const cg = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=idr");
      if (!cg.ok) throw new Error(`coingecko ${cg.status}`);
      const j = await cg.json();
      const idr = j?.bitcoin?.idr ?? j?.bitcoin?.IDR ?? null;
      if (idr != null && Number.isFinite(Number(idr))) {
        const n = Number(idr);
        setPriceSource("coingecko");
        setBtcPriceIdr(n);
        return n;
      }
    } catch (e) {
      console.warn("CoinGecko price fetch failed", e);
    }
    return null;
  }

  async function loadPriceFromApiOrCoingecko() {
    const internal = await fetchInternalPrice();
    if (internal != null) return internal;
    const cg = await fetchCoinGeckoPrice();
    if (cg != null) return cg;
    setPriceSource("none");
    setBtcPriceIdr(0);
    return 0;
  }

  // FORCE refresh & re-render
  async function manualRefresh() {
    setRefreshing(true);
    try {
      const newPrice = await loadPriceFromApiOrCoingecko();
      setBtcPriceIdr(prev => prev === newPrice ? newPrice + 0.0000001 : newPrice);
    } catch (e) {
      console.error("Refresh failed", e);
    }
    setTimeout(() => setRefreshing(false), 400);
  }

  function generatePnlPoints(items: any[], btcPrice: number) {
    const pts = items.map(it => {
      const currentVal = btcPrice * Number(it.amount || 0);
      const pnl = currentVal - Number(it.invested_idr || 0);
      return pnl;
    });

    if (pts.length < 2) return pts;

    const max = Math.max(...pts);
    const min = Math.min(...pts);
    const range = max - min || 1;

    return pts.map(p => 30 - ((p - min) / range) * 30);
  }

  useEffect(() => {
    setLoading(true);
    // load holdings AND transactions AND price
    Promise.all([loadHoldings(), loadTransactions(), loadPriceFromApiOrCoingecko()]).finally(() => setLoading(false));
    const t = setInterval(loadPriceFromApiOrCoingecko, 60000); // refresh every minute

    // listeners: when a transaction is added or crypto updated, reload
    const onTxAdded = (ev: any) => {
      // ev.detail may contain the transaction object; reload list(s)
      loadTransactions().catch(() => {});
      loadHoldings().catch(() => {});
    };
    const onCryptoUpdated = () => {
      loadHoldings().catch(() => {});
    };
    window.addEventListener("transaction:added", onTxAdded as EventListener);
    window.addEventListener("crypto:updated", onCryptoUpdated as EventListener);

    return () => {
      clearInterval(t);
      window.removeEventListener("transaction:added", onTxAdded as EventListener);
      window.removeEventListener("crypto:updated", onCryptoUpdated as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build BTC-only holdings (filter by symbol or name containing 'btc'/'bitcoin')
  const btcHoldings = useMemo(() => {
    return holdings.filter(h => {
      const sym = String(h?.symbol ?? "").toLowerCase();
      const n = String(h?.name ?? "").toLowerCase();
      return sym === "btc" || n.includes("bitcoin") || sym.includes("btc");
    });
  }, [holdings]);

  // ====== REPLACEMENT: ROBUST NUMBER PARSER + CLEAN ITEMS/TOTALS ======

  function coerce(v: any): number {
    if (v == null) return 0;
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    if (typeof v === "string") {
      const cleaned = v.replace(/[^\d.\-]/g, "");
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : 0;
    }
    if (typeof v === "object") {
      const keys = ["invested_idr", "total_invested_idr", "price_idr", "amount", "value"];
      for (const k of keys) if (v[k] != null) return coerce(v[k]);
      for (const k of Object.keys(v)) {
        const n = coerce(v[k]);
        if (n) return n;
      }
    }
    return 0;
  }

  // ---- REPLACE existing items useMemo block with this ----
  const items = useMemo(() => {
    const list: any[] = [];

    const normDate = (d: any) => {
      if (!d) return null;
      try {
        const ds = new Date(d);
        if (isNaN(ds.getTime())) return null;
        return ds.toISOString().split('T')[0];
      } catch { return null; }
    };

    const findMatchingTransaction = (buy: any, investedNum: number, amountNum: number) => {
      if (!Array.isArray(transactions) || transactions.length === 0) return null;
      const buyDate = normDate(buy.date);
      const candidates = transactions.filter(tx => (String((tx.type || '')).toLowerCase() === 'investment'));
      const scored = candidates.map(tx => {
        const txDate = normDate(tx.date);
        const txAmtIdr = coerce(tx.amount ?? tx.invested_idr ?? tx.investedIdr ?? tx.invested);
        const txBtc = coerce(tx.btc_amount ?? tx.btcAmount ?? tx.unit ?? tx.units ?? tx.amount);
        let score = 0;
        if (buyDate && txDate && buyDate === txDate) score += 3;
        if (txAmtIdr != null && investedNum != null && Math.abs(txAmtIdr - investedNum) < 1) score += 4;
        if (txBtc != null && amountNum != null && Math.abs(txBtc - amountNum) < 1e-9) score += 2;
        // Slight boost if tx.note exists (more likely a match we've saved)
        if (tx.note && String(tx.note).trim().length > 0) score += 1;
        return { tx, score };
      }).filter(x => x.score > 0);

      if (scored.length === 0) return null;
      scored.sort((a,b) => b.score - a.score);
      return scored[0].tx;
    };

    btcHoldings.forEach(h => {
      const buys = Array.isArray(h.buys) ? h.buys : [];

      if (buys.length) {
        buys.forEach(b => {
          const amt = coerce(b.amount);
          let invested = coerce(b.invested_idr ?? b.investedIdr ?? b.invested);
          if ((!invested || invested === 0) && coerce(b.price_idr)) {
            invested = coerce(b.price_idr) * amt;
          }
          const priceEntry = coerce(b.price_idr) || (amt ? invested / amt : 0);

          const matchedTx = findMatchingTransaction(b, invested, amt);
          const descriptionFromTx = matchedTx ? (matchedTx.note ?? matchedTx.description ?? matchedTx.remark ?? matchedTx.meta?.note ?? '') : '';

          const description = (descriptionFromTx && String(descriptionFromTx).trim().length > 0)
            ? String(descriptionFromTx)
            : ( (b.note ?? b.notes ?? b.description ?? h?.note ?? '') as string );

          list.push({
            id: b.id ?? Math.random().toString(36).slice(2),
            date: b.date ?? null,
            amount: amt,
            invested_idr: invested,
            price_idr: priceEntry,
            description: description || ''
          });
        });
      } else {
        const amt = coerce(h.amount);
        const invested = coerce(h.total_invested_idr ?? h.totalInvestedIdr);
        const priceEntry = amt ? invested / amt : 0;
        list.push({
          id: Math.random().toString(36).slice(2),
          date: null,
          amount: amt,
          invested_idr: invested,
          price_idr: priceEntry,
          description: (h?.note ?? h?.description ?? "Aggregated holding") as string
        });
      }
    });

    // newest first (by date desc, then by id desc if date equal)
    list.sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : 0;
      const tb = b.date ? new Date(b.date).getTime() : 0;
      if (tb !== ta) return tb - ta;
      // try id numeric fallback
      const ida = Number(a.id || 0);
      const idb = Number(b.id || 0);
      return idb - ida;
    });

    return list;
  }, [btcHoldings, transactions]);

  // === TOTALS ===
  const totalBtc = useMemo(() => {
    return items.reduce((s, it) => s + coerce(it.amount), 0);
  }, [items]);

  const totalInvestedIdr = useMemo(() => {
    return items.reduce((s, it) => s + coerce(it.invested_idr), 0);
  }, [items]);

  const currentValueIdr = useMemo(() => {
    return btcPriceIdr * totalBtc;
  }, [btcPriceIdr, totalBtc]);

  const totalPnLIdr = useMemo(() => {
    return currentValueIdr - totalInvestedIdr;
  }, [currentValueIdr, totalInvestedIdr]);

  const totalPnLPercent = useMemo(() => {
    if (!totalInvestedIdr) return null;
    return (totalPnLIdr / totalInvestedIdr) * 100;
  }, [totalPnLIdr, totalInvestedIdr]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]);
  const visible = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const goPrev = () => setPage(p => Math.max(1, p - 1));
  const goNext = () => setPage(p => Math.min(totalPages, p + 1));
  const goTo = (n: number) => setPage(Math.min(Math.max(1, n), totalPages));

  return (
    <Card className="p-6 bg-white border-gray-200">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-gray-900 mb-1">Bitcoin Accumulation</h3>
          <p className="text-gray-500 text-sm">BTC holdings and buy history (lifetime)</p>
        </div>

        <div className="flex items-center gap-3">
          <Badge className={
            priceSource === "internal"
              ? "bg-blue-100 text-blue-700"
              : priceSource === "coingecko"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-200 text-gray-600"
          }>
            {priceSource === "internal" ? "Internal API" : priceSource === "coingecko" ? "CoinGecko" : "No Price"}
          </Badge>

          <button
            onClick={manualRefresh}
            className="flex items-center gap-2 text-xs px-3 py-1 border rounded-md hover:bg-gray-100"
            aria-label="Refresh price"
            title="Refresh price"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600" : "text-gray-600"}`} />
            Refresh Price
          </button>
        </div>
      </div>

      {/* Top summary: 2-row format */}
      <div className="mb-4 border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="left-block">
            <div className="text-lg font-semibold">{fmtNumber(totalBtc, 8)} BTC</div>
            <div className="text-xs">Initial : {formatRp(totalInvestedIdr)}</div>
          </div>

          <div className="text-right">
            <div className="text-lg font-semibold">{formatRp(currentValueIdr)}</div>
            <div className={`text-sm ${totalPnLIdr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatRp(totalPnLIdr)}{ totalPnLPercent != null ? ` (${totalPnLPercent >= 0 ? '+' : ''}${totalPnLPercent.toFixed(1)}%)` : '' }
            </div>
            
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading crypto holdings…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No BTC holdings yet.</div>
      ) : (
        <>
          <Accordion type="single" collapsible className="space-y-3">
            {visible.map(it => {
              return (
                <AccordionItem key={it.id} value={String(it.id)} className="border border-gray-200 rounded-xl px-5 py-4 hover:border-gray-300 transition-colors">
                  <AccordionTrigger className="hover:no-underline py-0">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-yellow-500 text-white">
                          <img src="https://www.svgrepo.com/show/303287/bitcoin-logo.svg" alt="BTC" className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <p className="text-gray-900">{it.date ? `Buy — ${new Date(it.date).toLocaleDateString('id-ID')}` : 'Holding (aggregated)'}</p>
                          <div className="text-sm text-gray-500">{it.description || 'No description'}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold">
                          { formatRp( Number(it.invested_idr ?? ((it.price_idr ?? 0) * (it.amount ?? 0))) ) }
                        </div>

                        <div className="text-sm text-gray-500">
                          { fmtNumber(it.amount ?? 0, 8) } BTC
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pt-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Date</div>
                          <div className="text-gray-900">{it.date ? new Date(it.date).toLocaleString('id-ID', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'}</div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-500 mb-1">Price Entry (IDR)</div>
                          <div className="text-gray-900">{formatRp(it.price_idr || 0)}</div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-500 mb-1">Jumlah (BTC)</div>
                          <div className="text-gray-900">{fmtNumber(it.amount || 0, 8)} BTC</div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-500 mb-1">Invested (IDR)</div>
                          <div className="text-gray-900">{formatRp(it.invested_idr || 0)}</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-gray-500 text-sm mb-1">Notes</p>
                        <div className="text-sm text-gray-500">{it.description || 'No description'}</div>
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
                Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> - <span className="font-medium">{Math.min(page * pageSize, items.length)}</span> of <span className="font-medium">{items.length}</span>
              </div>

              <div className="flex items-center gap-2">
                <button className="px-3 py-1 rounded-md border border-gray-200 bg-white text-gray-700 disabled:opacity-50" onClick={goPrev} disabled={page <= 1}>Prev</button>

                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const n = i + 1;
                    return (
                      <button key={n} onClick={() => goTo(n)} className={`px-2 py-1 rounded ${n === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>{n}</button>
                    );
                  })}
                </div>

                <button className="px-3 py-1 rounded-md border border-gray-200 bg-white text-gray-700 disabled:opacity-50" onClick={goNext} disabled={page >= totalPages}>Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export default InvestmentCrypto;
