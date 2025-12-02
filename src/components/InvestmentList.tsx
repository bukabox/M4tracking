// src/components/InvestmentList.tsx
import React, { useMemo, useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion";
import { Badge } from "./ui/badge";
import {
  TrendingUp,
  Cpu,
  Laptop,
  Smartphone,
  Tablet,
  Watch,
  Headphones,
  Camera,
  Aperture,
  HardDrive,
  Usb,
  Monitor,
  Table as TableIcon,
  Armchair as ChairIcon,
  Keyboard,
  Mouse,
  Mic,
  Speaker,
  MemoryStick,
  Lightbulb,
  Trash2,
  FileText,
  Hash,
  Clock,
  CheckCircle,
  Tag,
  TrendingDown,
  BarChart3
} from "lucide-react";

/* formatting helpers */
const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-");
};
const formatDateTime = (dateString?: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("id-ID", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
};
const formatCurrency = (amount?: number) => {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount || 0);
};

/* unified category resolver: returns icon (no color), name, wrapperClass (bg + text) 
   NOTE: exported so TransactionTable can import and follow same mapping */
export function getCategoryInfo(label?: string) {
  const s = (label || "").toLowerCase();

  const info = (key: string, name: string, icon: JSX.Element, bgColor: string) => ({ 
    key, 
    name, 
    icon, 
    bgColor 
  });

  // BTC special (we return icon as <img> but bgColor will be empty so caller can render icon without background)
  if (/\b(btc|bitcoin)\b/.test(s)) {
    // BTC: no colored background, larger icon
    const btcImg = <img src="https://www.svgrepo.com/show/303287/bitcoin-logo.svg" alt="BTC" className="w-10 h-10" />;
    return info("btc", "Bitcoin", btcImg, ""); // empty bg so caller can render raw img (no bg)
  }

  // COMPUTER / WORKSTATION
  if (/\b(pc|desktop|workstation|mac mini|macmini)\b/.test(s)) return info("cpu", "Desktop / PC", <Cpu className="w-5 h-5" />, "bg-indigo-600");
  if (/\b(macbook|laptop|notebook)\b/.test(s)) return info("laptop", "Laptop", <Laptop className="w-5 h-5" />, "bg-purple-600");
  if (/\b(monitor|display|screen)\b/.test(s)) return info("monitor", "Monitor / Display", <Monitor className="w-5 h-5" />, "bg-sky-600");

  // TABLET / IPAD
  if (/\b(ipad|tablet)\b/.test(s)) return info("tablet", "Tablet / iPad", <Tablet className="w-5 h-5" />, "bg-sky-500");
  if (/\b(iphone|smartphone|handphone|hp)\b/.test(s)) return info("phone", "Smartphone", <Smartphone className="w-5 h-5" />, "bg-teal-600");
  if (/\b(watch|apple watch|smartwatch)\b/.test(s)) return info("watch", "Watch / Smartwatch", <Watch className="w-5 h-5" />, "bg-pink-600");

  // AUDIO / HEADPHONES
  if (/\b(airpods|earbuds|earphone|headphone|headset)\b/.test(s)) return info("headphones", "Headphones", <Headphones className="w-5 h-5" />, "bg-violet-600");
  if (/\b(mic|microphone)\b/.test(s)) return info("mic", "Microphone", <Mic className="w-5 h-5" />, "bg-fuchsia-600");
  if (/\b(speaker)\b/.test(s)) return info("speaker", "Speaker", <Speaker className="w-5 h-5" />, "bg-indigo-500");

  // CAMERA
  if (/\b(camera|dslr|mirrorless)\b/.test(s)) return info("camera", "Camera", <Camera className="w-5 h-5" />, "bg-blue-600");
  if (/\b(lens|lensa|glass)\b/.test(s)) return info("lens", "Lens", <Aperture className="w-5 h-5" />, "bg-slate-700");

  // STORAGE
  if (/\b(ssd|hdd|nvme|hard drive|external disk)\b/.test(s)) return info("storage", "Storage", <HardDrive className="w-5 h-5" />, "bg-amber-500");
  if (/\b(sd card|memory card|memorystick)\b/.test(s)) return info("sdcard", "Memory Card", <MemoryStick className="w-5 h-5" />, "bg-rose-500");

  // DOCK / HUB / ACCESSORIES
  if (/\b(dock|docking|hub|usb)\b/.test(s)) return info("hub", "Dock / Hub", <Usb className="w-5 h-5" />, "bg-emerald-600");

  // FURNITURE
  if (/\b(table|desk|meja)\b/.test(s)) return info("table", "Table / Desk", <TableIcon className="w-5 h-5" />, "bg-amber-600");
  if (/\b(chair|kursi|armchair)\b/.test(s)) return info("chair", "Chair", <ChairIcon className="w-5 h-5" />, "bg-emerald-700");

  // MISC
  if (/\b(keyboard|kbd)\b/.test(s)) return info("keyboard", "Keyboard", <Keyboard className="w-5 h-5" />, "bg-rose-600");
  if (/\b(mouse|trackpad)\b/.test(s)) return info("mouse", "Mouse / Trackpad", <Mouse className="w-5 h-5" />, "bg-amber-600");
  if (/\b(light|lamp|lighting)\b/.test(s)) return info("light", "Lighting", <Lightbulb className="w-5 h-5" />, "bg-yellow-500");
  if (/\b(pencil|stylus|pen)\b/.test(s)) return info("pencil", "Stylus / Pen", <TrendingUp className="w-5 h-5" />, "bg-slate-400");

  // fallback - gray background with darker icon
  return info("other", "Other", <TrendingUp className="w-5 h-5 text-gray-700" />, "bg-gray-200");
}

/* Component (unchanged logic aside from using exported getCategoryInfo) */
export function InvestmentList({ transactions: transactionsProp = null, fetchUrl = "/api/transactions", onDelete, pageSize = 5 }: any) {
  const [transactions, setTransactions] = useState<any[] | null>(transactionsProp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transactionsProp !== null) {
      setTransactions(transactionsProp);
      return;
    }
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const j = await res.json();
        if (!mounted) return;
        setTransactions(Array.isArray(j) ? j : []);
      } catch (e: any) {
        if (mounted) setError(String(e?.message ?? e));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [transactionsProp, fetchUrl]);

  // NOTE: Exclude BTC/Bitcoin from the investment list (moved to InvestmentCrypto)
  const isBTC = (t: any) => /\b(btc|bitcoin)\b/.test(String((t?.label ?? t?.category ?? '')).toLowerCase());
  const investmentTx = useMemo(() => (transactions || []).filter(t => String(t.type || "").toLowerCase() === "investment" && !isBTC(t)), [transactions]);

  const lifetimeTotal = useMemo(() => investmentTx.reduce((s, t) => s + Number(t.amount || 0), 0), [investmentTx]);
  const lifetimeCount = investmentTx.length;

  const [page, setPage] = useState<number>(1);
  const sorted = useMemo(() => [...investmentTx].sort((a, b) => (new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())), [investmentTx]);

  useEffect(() => { setPage(1); }, [sorted.length]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]);

  const visible = useMemo(() => { const start = (page - 1) * pageSize; return sorted.slice(start, start + pageSize); }, [sorted, page, pageSize]);

  const goToPrev = () => setPage(p => Math.max(1, p - 1));
  const goToNext = () => setPage(p => Math.min(totalPages, p + 1));
  const goTo = (n: number) => setPage(Math.min(Math.max(1, n), totalPages));

  const handleDelete = async (id: string | number) => {
    if (onDelete) {
      try { await onDelete(id); } catch { /* ignore */ }
    }
    setTransactions(prev => prev ? prev.filter(t => String(t.id) !== String(id)) : prev);
  };

  return (
    <Card className="p-6 bg-white border-gray-200">
      {/* Header with Icon - Simple style like Report.tsx */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          <h3 className="text-gray-900">Investment Transactions — Lifetime</h3>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">All recorded investment activity (lifetime) — excluding crypto/BTC</p>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Lifetime Total</div>
              <div className="text-lg font-semibold text-green-600">{formatCurrency(lifetimeTotal)}</div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-500">Total Entries</div>
              <div className="text-lg font-semibold text-gray-700">{lifetimeCount}</div>
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="text-center py-12 text-gray-500">Loading investment records…</div>}
      {error && <div className="text-center py-12 text-red-600">Error: {error}</div>}
      {!loading && !error && investmentTx.length === 0 && <div className="text-center py-12 text-gray-500">No investment records yet.</div>}

      {!loading && !error && investmentTx.length > 0 && (
        <>
          <Accordion type="single" collapsible className="space-y-3">
            {visible.map(tx => {
              const { icon, bgColor, name: category } = getCategoryInfo(tx.label || tx.category);
              const isBtc = bgColor === ""; // BTC has empty bgColor
              
              return (
                <AccordionItem key={tx.id} value={String(tx.id)} className="border border-gray-200 rounded-xl px-5 py-4 hover:border-gray-300 transition-colors">
                  <AccordionTrigger className="hover:no-underline py-0">
                    <div className="flex items-center justify-between w-full pr-2">
                      <div className="flex items-center gap-3">
                        {isBtc ? (
                          <div>{icon}</div>
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${bgColor}`}>
                            {icon}
                          </div>
                        )}
                        <div className="text-left">
                          <p className="text-gray-900">{tx.label || tx.category}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500">{category}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-sm text-gray-500">{formatDate(tx.date)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-orange-600 font-semibold">{tx.amount ? `-${formatCurrency(tx.amount)}` : "-"}</div>

                        <div role="button" tabIndex={0}
                          onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDelete(tx.id); }}
                          onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleDelete(tx.id); } }}
                          className="hover:bg-red-50 p-1 rounded-md cursor-pointer"
                          aria-label="Delete investment" title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pt-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-900">Investment Details</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Hash className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-500">Investment ID</span>
                            </div>
                            <p className="text-gray-900 ml-6">INV-{tx.id}</p>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-500">Date & Time</span>
                            </div>
                            <p className="text-gray-900 ml-6">{formatDateTime(tx.date)}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Tag className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-500">Category</span>
                            </div>
                            <p className="text-gray-900 ml-6">{category}</p>
                          </div>
                            
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-500">Status</span>
                            </div>
                            <Badge className="bg-blue-100 text-blue-700 ml-6">Completed</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-blue-200 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Amount</span>
                          <span className="text-gray-900">{formatCurrency(tx.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-900">Total Deducted</span>
                          <span className="text-orange-600">-{formatCurrency(tx.amount)}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-gray-500 text-sm mb-1">Notes</p>
                        <p className="text-gray-900">{tx.note || "No additional notes."}</p>
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
                Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> - <span className="font-medium">{Math.min(page * pageSize, sorted.length)}</span> of <span className="font-medium">{sorted.length}</span>
              </div>

              <div className="flex items-center gap-2">
                <button className="px-3 py-1 rounded-md border border-gray-200 bg-white text-gray-700 disabled:opacity-50" onClick={goToPrev} disabled={page <= 1}>Prev</button>

                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const n = i + 1;
                    return (
                      <button key={n} onClick={() => goTo(n)} className={`px-2 py-1 rounded ${n === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>{n}</button>
                    );
                  })}
                </div>

                <button className="px-3 py-1 rounded-md border border-gray-200 bg-white text-gray-700 disabled:opacity-50" onClick={goToNext} disabled={page >= totalPages}>Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export default InvestmentList;