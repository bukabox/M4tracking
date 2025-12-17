// TransactionDialog.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useLanguage } from "../contexts/LanguageContext";
import { useNotifications } from "../contexts/NotificationContext";
import { apiFetch } from "../lib/api";
import { Upload } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";

type TxType = "income" | "expense" | "investment";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved?: (tx: any) => void;
}

export function TransactionDialog({
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const { addNotification } = useNotifications();
  const [active, setActive] = useState<TxType>("income");
  const [date, setDate] = useState<string>("");
  const [label, setLabel] = useState<string>(""); // Nama product
  const [stream, setStream] = useState<string>(""); // STREAM → hanya Income
  const [stickerId, setStickerId] = useState<string>(""); // Sticker ID for LINE stream (optional)
  const [note, setNote] = useState<string>("");
  const [amount, setAmount] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] =
    useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(
    null,
  );
  const [importFile, setImportFile] = useState<File | null>(
    null,
  );
  const [importResult, setImportResult] = useState<any>(null);
  const [importType, setImportType] = useState<"csv" | "json">(
    "csv",
  );
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [currencyRate, setCurrencyRate] =
    useState<string>("16000");

  // User role state
  const [me, setMe] = useState<{email?:string, is_master?:boolean} | null>(null);

  // new states for enhanced CSV import
  const [productList, setProductList] = useState<any[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [rateJpyToIdr, setRateJpyToIdr] = useState<
    number | null
  >(null);
  const [taxPct, setTaxPct] = useState<number>(10); // default 10%
  const [importMode, setImportMode] = useState<
    "merge" | "replace"
  >("merge");

  // --- BTC specific state (editable price) ---
  const [btcPriceIdr, setBtcPriceIdr] = useState<number | null>(
    null,
  ); // numeric internal
  const [btcPriceInput, setBtcPriceInput] =
    useState<string>(""); // raw digits string
  const [userEditedBtcPrice, setUserEditedBtcPrice] =
    useState<boolean>(false);
  const [btcUnits, setBtcUnits] = useState<number>(0);
  const [loadingBtcPrice, setLoadingBtcPrice] =
    useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [open]);

  // Fetch user info to check if master
  useEffect(() => {
    (async () => {
      try {
        const m = await apiFetch("/api/me")
          .then(r => r.json())
          .catch(() => null);
        setMe(m);
      } catch(e) { 
        console.warn("whoami failed", e); 
      }
    })();
  }, []);

  const reset = () => {
    setDate("");
    setLabel("");
    setStream("");
    setStickerId("");
    setNote("");
    setAmount("0");
    setActive("income");
    setError(null);
    setBtcPriceIdr(null);
    setBtcPriceInput("");
    setUserEditedBtcPrice(false);
    setBtcUnits(0);
  };

  const fmt = (v: string) => {
    const n = Number(String(v).replace(/[^0-9]/g, "")) || 0;
    return n.toLocaleString("id-ID");
  };
  const parse = (v: string) =>
    Number(String(v).replace(/[^0-9.-]/g, "")) || 0;

  // when amount changes: update BTC units if BTC mode active
  const onAmountChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "");
    setAmount(digits || "0");

    const invested = Number(digits || "0");
    const priceToUse =
      userEditedBtcPrice && btcPriceInput
        ? Number(btcPriceInput.replace(/[^0-9.-]/g, ""))
        : btcPriceIdr || 0;
    if (
      active === "investment" &&
      String(label || "")
        .trim()
        .toLowerCase() === "btc" &&
      priceToUse &&
      invested > 0
    ) {
      setBtcUnits(Number((invested / priceToUse).toFixed(8)));
    } else {
      setBtcUnits(0);
    }
  };

  // handler for editable Harga Entry input
  const onBtcPriceChange = (raw: string) => {
    setUserEditedBtcPrice(true);
    const digits = String(raw).replace(/[^0-9]/g, "");
    setBtcPriceInput(digits || "");
    const priceNum = Number(digits || "0") || null;
    setBtcPriceIdr(priceNum);

    const invested = Number(amount || "0");
    if (priceNum && invested > 0) {
      setBtcUnits(Number((invested / priceNum).toFixed(8)));
    } else {
      setBtcUnits(0);
    }
  };

  const validate = (): string | null => {
    if (!date) return "Date is required";
    if (!label) return "Nama product is required";
    if (parse(amount) <= 0)
      return "Amount must be greater than 0";
    return null;
  };

  // fetch BTC price when dialog opened or when label becomes BTC while tab is investment
  useEffect(() => {
    let mounted = true;
    async function loadBtcPrice() {
      const isBtc =
        active === "investment" &&
        String(label || "")
          .trim()
          .toLowerCase() === "btc";
      if (!isBtc) {
        if (mounted) {
          setBtcPriceIdr(null);
          if (!userEditedBtcPrice) setBtcPriceInput("");
          setBtcUnits(0);
        }
        return;
      }
      setLoadingBtcPrice(true);
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || "";
        const res = await fetch(
          `${API_BASE}/api/crypto_prices?vs_currency=idr&symbols=btc`,
        );

        if (!res.ok) {
          setLoadingBtcPrice(false);
          return;
        }
        const j = await res.json();
        const price =
          j?.bitcoin?.idr ?? j?.btc?.idr ?? j?.btc ?? null;
        if (mounted && price) {
          setBtcPriceIdr(Number(price));
          if (!userEditedBtcPrice)
            setBtcPriceInput(String(Math.round(Number(price))));
          const invested = Number(amount || "0");
          const usedPrice =
            userEditedBtcPrice && btcPriceInput
              ? Number(btcPriceInput.replace(/[^0-9.-]/g, ""))
              : Number(price);
          if (invested > 0 && usedPrice > 0) {
            setBtcUnits(
              Number((invested / usedPrice).toFixed(8)),
            );
          }
        }
      } catch (e) {
        console.warn("loadBtcPrice failed", e);
      } finally {
        if (mounted) setLoadingBtcPrice(false);
      }
    }
    loadBtcPrice();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active, label, userEditedBtcPrice]);

  const submitTx = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    setError(null);

    // base payload for add_transaction
    const payload: any = {
      type: active,
      date,
      amount: parse(amount),
      category: label,
      stream: active === "income" ? stream : "",
      note: note || "",
    };

    // If INCOME & stream LINE → sticker handling (unchanged)
    if (
      active === "income" &&
      (stream || "").toString().toLowerCase() === "line" &&
      stickerId.trim().length > 0
    ) {
      payload.stickerId = stickerId.trim();
      const marker = `sticker:${stickerId.trim()}`;
      if (!payload.note.includes("sticker:"))
        payload.note = payload.note.trim()
          ? `${payload.note.trim()} ${marker}`
          : marker;
      else
        payload.note = payload.note.replace(
          /sticker[:=]\s*\d+/i,
          marker,
        );
    }

    // --- If BTC investment: attach price_idr and btc_amount to add_transaction payload (so table shows directly) ---
    const isBtc =
      active === "investment" &&
      String(label || "")
        .trim()
        .toLowerCase() === "btc";
    let usedPriceNumber: number | null = null;
    let btcAmountComputed = 0;
    if (isBtc) {
      usedPriceNumber =
        userEditedBtcPrice && btcPriceInput
          ? Number(btcPriceInput.replace(/[^0-9.-]/g, ""))
          : btcPriceIdr || null;
      const investedIdr = Number(parse(amount));
      btcAmountComputed =
        usedPriceNumber && usedPriceNumber > 0
          ? Number((investedIdr / usedPriceNumber).toFixed(8))
          : 0;

      // attach fields to payload for immediate display in TransactionTable
      payload.price_idr = usedPriceNumber
        ? Math.round(usedPriceNumber)
        : null;
      payload.btc_amount = btcAmountComputed;
    }

    try {
      const res = await apiFetch("/api/add_transaction", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error || "Server error");
        setLoading(false);
        return;
      }

      try {
        onSaved && onSaved(json.transaction ?? json);
      } catch (err) {
        console.error(err);
      }

      try {
        window.dispatchEvent(
          new CustomEvent("transaction:added", {
            detail: json.transaction ?? json,
          }),
        );
      } catch (e) {}

      // Also save to crypto holdings (same as before)
      if (isBtc) {
        try {
          const investedIdr = Number(parse(amount));
          const usedPrice = usedPriceNumber || 0;
          const btcAmount = btcAmountComputed;
          const cryptoBody = {
            symbol: "btc",
            name: "Bitcoin",
            amount: btcAmount,
            price_idr: usedPrice ? Math.round(usedPrice) : null,
            invested_idr: Math.round(investedIdr),
            date,
            note: note || "",
          };
          const r2 = await apiFetch("/api/add_crypto_buy", {
            method: "POST",
            body: JSON.stringify(cryptoBody),
          });
          if (!r2.ok) {
            console.warn(
              "add_crypto_buy failed",
              await r2.text(),
            );
          } else {
            try {
              window.dispatchEvent(new Event("crypto:updated"));
            } catch (e) {}
          }
        } catch (e) {
          console.warn("posting to add_crypto_buy failed", e);
        }
      }

      reset();
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const submitLabel =
    active === "income"
      ? "Add Income"
      : active === "expense"
        ? "Add Expense"
        : "Add Investment";

  const showStickerInput =
    active === "income" &&
    (stream || "").toString().toLowerCase() === "line";

  // fetch product list from backend
  const fetchProductList = async () => {
    try {
      const r = await apiFetch("/api/product_list");
      if (!r.ok) return setProductList([]);
      const j = await r.json();
      setProductList(Array.isArray(j) ? j : []);
    } catch (e) {
      console.warn("fetchProductList failed", e);
      setProductList([]);
    }
  };

  // parse CSV -> group per Item ID -> build previewRows
  async function parseCsvAndPreview(file: File) {
    setImportLoading(true);
    setImportError(null);
    try {
      // Use Papa.parse instead of manual parsing
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            if (!results.data || results.data.length === 0) {
              setImportError(
                "CSV kosong atau header tidak ditemukan",
              );
              setParsedRows([]);
              setPreviewRows([]);
              setImportLoading(false);
              return;
            }

            // Process the parsed data
            const rows: any[] = results.data.map((row: any) => {
              // Find item ID from various possible column names
              const itemId =
                row["item id"] ||
                row["itemid"] ||
                row["item_id"] ||
                row["id"] ||
                row["Item ID"] ||
                "";
              const title =
                row["item title"] ||
                row["title"] ||
                row["name"] ||
                row["Item Title"] ||
                "";

              // Find revenue from various possible column names
              let revRaw = 0;
              const revenueKeys = [
                "revenue share",
                "revenue share (pre-tax)",
                "revenue share (jpy)",
                "revenue",
                "revenue_share",
                "amount",
                "revenue share (pre tax)",
              ];
              for (const key of revenueKeys) {
                const val =
                  row[key] ||
                  row[key.toLowerCase()] ||
                  row[key.toUpperCase()];
                if (
                  val !== undefined &&
                  val !== null &&
                  val !== ""
                ) {
                  revRaw =
                    Number(
                      String(val).replace(/[^\d.-]/g, ""),
                    ) || 0;
                  break;
                }
              }

              // If still no revenue, try to find first numeric column
              if (revRaw === 0) {
                for (const val of Object.values(row)) {
                  const n = String(val).replace(/[^\d.-]/g, "");
                  if (n && /[0-9]/.test(n)) {
                    revRaw = Number(n);
                    break;
                  }
                }
              }

              return {
                itemId: String(itemId).trim(),
                title: String(title).trim(),
                revenue_jpy: revRaw,
                rawLine: JSON.stringify(row),
              };
            });

            setParsedRows(rows);
            (window as any).parsedRows = rows;

            // ensure product list loaded
            if (!productList || !productList.length) {
              await fetchProductList();
            }
            const idSet = new Set(
              (productList || []).map((p: any) =>
                String(p.product_id || p.id || "").trim(),
              ),
            );

            // group by Item ID and sum revenue_jpy
            const grouped = new Map<
              string,
              {
                product_id: string;
                name: string;
                total_jpy: number;
                rows: any[];
              }
            >();
            for (const r of rows) {
              const pid = (r.itemId || "").toString().trim();
              if (!pid) continue;
              if (!grouped.has(pid))
                grouped.set(pid, {
                  product_id: pid,
                  name: r.title || pid,
                  total_jpy: 0,
                  rows: [],
                });
              const g = grouped.get(pid)!;
              g.total_jpy += Number(r.revenue_jpy || 0);
              g.rows.push(r);
            }

            // build previewRows but only include products present in productList (filter)
            const preview: any[] = [];
            let matched = 0,
              skipped = 0;
            for (const [pid, g] of grouped.entries()) {
              if (idSet.has(String(pid))) {
                preview.push({
                  product_id: pid,
                  name: g.name,
                  total_jpy:
                    Math.round(g.total_jpy * 100) / 100,
                  rows_count: g.rows.length,
                  raw_rows: g.rows,
                  include: true,
                });
                matched++;
              } else {
                skipped++;
              }
            }

            // sort preview by total_jpy desc
            preview.sort((a, b) => b.total_jpy - a.total_jpy);

            setPreviewRows(preview);
            (window as any).previewRows = preview;

            if (!preview.length) {
              setImportError(
                `No matched products in product_list (matched ${matched}, skipped ${skipped}).`,
              );
            }
            setImportLoading(false);
          } catch (err: any) {
            console.error(err);
            setImportError(
              err?.message || "Failed to process CSV",
            );
            setParsedRows([]);
            setPreviewRows([]);
            setImportLoading(false);
          }
        },
        error: (error) => {
          console.error("Papa.parse error:", error);
          setImportError(
            error?.message || "Failed to parse CSV",
          );
          setParsedRows([]);
          setPreviewRows([]);
          setImportLoading(false);
        },
      });
    } catch (err: any) {
      console.error(err);
      setImportError(err?.message || "Failed to parse CSV");
      setParsedRows([]);
      setPreviewRows([]);
      setImportLoading(false);
    }
  }

  // file select (no auto-upload) -> parse preview
  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const f = e.target.files?.[0] || null;
    setImportFile(f);
    setImportError(null);
    setPreviewRows([]);
    if (f) {
      await parseCsvAndPreview(f);
    }
  };

  // file select for general CSV import
  const handleGeneralCsvSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const f = e.target.files?.[0] || null;
    setImportFile(f);
    setImportError(null);
    setPreviewRows([]);
    if (f) {
      await parseCsvAndPreview(f);
    }
  };

  // returns { gross_idr, tax_amount, payable_idr }
  function computeIdrFromJpy(
    totalJpy: number,
    rateJpyToIdr: number,
    taxPct: number,
  ) {
    const gross = Math.round(totalJpy * rateJpyToIdr); // gross in IDR
    const taxAmount = Math.round((gross * (taxPct || 0)) / 100);
    const payable = gross - taxAmount;
    return {
      gross_idr: gross,
      tax_amount: taxAmount,
      payable_idr: payable,
    };
  }

  // finalize import -> build cashflow payload (one tx per preview item) and POST to backend
  const handleDoImportWithPreview = async () => {
    if (!previewRows.length) {
      setImportError("No preview items to import");
      return;
    }
    if (!rateJpyToIdr) {
      setImportError(
        "Please enter JPY→IDR rate before importing",
      );
      return;
    }

    setImportLoading(true);
    setImportError(null);
    try {
      const txs: any[] = previewRows
        .filter((r) => r.include)
        .map((r) => {
          const { gross_idr, tax_amount, payable_idr } =
            computeIdrFromJpy(
              r.total_jpy,
              rateJpyToIdr || 0,
              taxPct || 0,
            );
          return {
            id: null,
            type: "income",
            date: new Date().toISOString().slice(0, 10),
            amount: payable_idr,
            category: "LINE Sticker",
            stream: "LINE",
            label: r.name || r.product_id,
            product_id: r.product_id,
            raw_jpy: r.total_jpy,
            rate_used: rateJpyToIdr,
            tax_pct: taxPct,
            tax_amount_idr: tax_amount,
            gross_idr: gross_idr,
            note: `imported_from_csv raw_jpy=${r.total_jpy} gross_idr=${gross_idr} tax=${tax_amount}`,
          };
        });

      const res = await apiFetch(
        `/api/import_combined?mode=${importMode}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cashflow: txs }),
        },
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Import failed");

      // success
      const successCount = previewRows.filter(r => r.include).length;
      setPreviewRows([]);
      setImportFile(null);
      window.dispatchEvent(new Event("transaction:added"));
      toast.success(`CSV imported successfully! (${successCount} transactions)`);
      addNotification({
        type: 'success',
        title: 'CSV Import Complete',
        message: `Successfully imported ${successCount} transaction${successCount > 1 ? 's' : ''} from CSV file`,
      });
      setShowImportDialog(false);
    } catch (err: any) {
      setImportError(err?.message || String(err));
    } finally {
      setImportLoading(false);
    }
  };

  // Generic importer fallback — gunakan previewRows atau parsed JSON file
  const doImportGeneric = async () => {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 IMPORT JSON FUNCTION CALLED");
    console.log("=".repeat(60));
    console.log("  Import Type:", importType);
    console.log("  Import File:", importFile?.name, importFile?.size, "bytes");
    console.log("  Import Mode:", importMode);
    console.log("  Preview Rows:", previewRows?.length || 0);
    console.log("=".repeat(60));
    
    setImportLoading(true);
    setImportError(null);
    try {
      let payload: any = {};
      if (importType === "csv") {
        // assume previewRows contains normalized rows (one per product)
        if (!previewRows?.length)
          throw new Error("No preview rows to import.");
        // build cashflow from previewRows if previewRows shape is not raw txs
        const txs = previewRows
          .filter((r: any) => r.include)
          .map((r: any) => {
            const { gross_idr, tax_amount, payable_idr } =
              computeIdrFromJpy(
                r.total_jpy,
                rateJpyToIdr || 1,
                taxPct || 0,
              );
            return {
              id: null,
              type: "income",
              date: new Date().toISOString().slice(0, 10),
              amount: payable_idr,
              category: r.category || "LINE Sticker",
              stream: r.stream || "LINE",
              label: r.name || r.product_id,
              product_id: r.product_id,
              raw_jpy: r.total_jpy,
              rate_used: rateJpyToIdr || null,
              tax_pct: taxPct,
              tax_amount_idr: tax_amount,
              gross_idr: gross_idr,
              note: `imported_from_csv product_id=${r.product_id} gross=${gross_idr} tax=${tax_amount}`,
            };
          });
        payload.cashflow = txs;
      } else {
        // json
        // if previewRows filled from JSON, try use that; else try to parse file quickly
        if (previewRows && previewRows.length) {
          payload.cashflow = previewRows.map((r: any) => ({
            ...r,
            id: r.id || null,
          }));
        } else if (importFile) {
          const txt = await importFile.text();
          const j = JSON.parse(txt);
          if (Array.isArray(j.cashflow))
            payload.cashflow = j.cashflow;
          else if (Array.isArray(j)) payload.cashflow = j;
          else throw new Error("JSON not in expected shape");
          
          // Include crypto if present
          if (j.crypto) payload.crypto = j.crypto;
          
          // Include products if present
          if (Array.isArray(j.products)) {
            payload.products = j.products;
          }
        } else {
          throw new Error("No file selected");
        }
      }

      console.log("\n📦 PAYLOAD PREPARED");
      console.log("  Cashflow items:", payload.cashflow?.length || 0);
      console.log("  Crypto exists:", !!payload.crypto);
      console.log("  Products items:", payload.products?.length || 0);
      console.log("  First transaction:", payload.cashflow?.[0]);
      
      console.log("\n📡 CALLING API: /api/import_combined");
      console.log("  URL:", `/api/import_combined?mode=${importMode}`);
      console.log("  Method: POST");

      const res = await apiFetch(
        `/api/import_combined?mode=${importMode}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      
      console.log("\n✅ API RESPONSE RECEIVED");
      console.log("  Status:", res.status);
      console.log("  OK:", res.ok);
      
      const j = await res.json();
      console.log("  Response data:", j);
      
      if (!res.ok) throw new Error(j?.error || "Import failed");
      
      const successCount = payload.cashflow ? payload.cashflow.length : 0;
      console.log("\n🎉 IMPORT SUCCESS!");
      console.log("  Imported:", successCount, "transactions");
      console.log("=".repeat(60) + "\n");
      
      // Dispatch bulk import event to trigger full data reload
      window.dispatchEvent(new CustomEvent("transaction:bulk-imported", { 
        detail: { count: successCount } 
      }));
      
      toast.success(`JSON imported successfully! (${successCount} transactions)`);
      addNotification({
        type: 'success',
        title: 'JSON Import Complete',
        message: `Successfully imported ${successCount} transaction${successCount > 1 ? 's' : ''} from JSON file`,
      });
      setShowImportDialog(false);
      setImportFile(null);
      setPreviewRows([]);
    } catch (err: any) {
      console.error("\n❌ IMPORT FAILED");
      console.error("=".repeat(60));
      console.error("  Error type:", err?.constructor?.name);
      console.error("  Error message:", err?.message);
      console.error("  Full error:", err);
      console.error("=".repeat(60) + "\n");
      setImportError(err?.message || String(err));
    } finally {
      console.log("🏁 Import process ended\n");
      setImportLoading(false);
    }
  };

  // Legacy JSON import handler - for backward compatibility
  const handleImportJSON = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const f = e.target.files?.[0] || null;
    setImportFile(f);
    setImportError(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>New Transaction</DialogTitle>
                <DialogDescription>
                  Add a new income, expense or investment.
                </DialogDescription>
              </div>
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                onClick={() => setShowImportDialog(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>
          </DialogHeader>

          <div className="mt-3">
            <Tabs
              value={active}
              onValueChange={(v) => setActive(v as TxType)}
            >
              <TabsList className="flex flex-row items-center justify-between gap-2 w-full mb-4 px-1">
                <TabsTrigger
                  value="income"
                  className="flex-1 text-center mx-1 rounded-md"
                >
                  Income
                </TabsTrigger>
                <TabsTrigger
                  value="expense"
                  className="flex-1 text-center mx-1 rounded-md"
                >
                  Expense
                </TabsTrigger>
                <TabsTrigger
                  value="investment"
                  className="flex-1 text-center mx-1 rounded-md"
                >
                  Investment
                </TabsTrigger>
              </TabsList>

              {/* INCOME */}
              <TabsContent value="income">
                <form onSubmit={submitTx} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="tx-date">Date</Label>
                    <Input
                      id="tx-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="tx-label">
                      Nama product
                    </Label>
                    <Input
                      id="tx-label"
                      type="text"
                      placeholder="Nama product (contoh: Sticker Set A)"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="tx-stream">
                      Stream / Platform
                    </Label>
                    <Input
                      id="tx-stream"
                      type="text"
                      placeholder="Streamline"
                      value={stream}
                      onChange={(e) =>
                        setStream(e.target.value)
                      }
                    />
                  </div>

                  {showStickerInput && (
                    <div className="space-y-1.5">
                      <Label htmlFor="tx-sticker-id">
                        Sticker ID (LINE)
                      </Label>
                      <Input
                        id="tx-sticker-id"
                        type="text"
                        placeholder="Masukkan Sticker ID (contoh: 12345678)"
                        value={stickerId}
                        onChange={(e) =>
                          setStickerId(e.target.value)
                        }
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Opsional — masukkan jika transaksi
                        berhubungan dengan penjualan sticker
                        LINE.
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="tx-amount">
                      Amount (Rp)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        Rp
                      </span>
                      <Input
                        id="tx-amount"
                        inputMode="numeric"
                        value={fmt(amount)}
                        onChange={(e) =>
                          onAmountChange(e.target.value)
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="tx-note">Note</Label>
                    <Input
                      id="tx-note"
                      type="text"
                      placeholder="optional note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        reset();
                        onOpenChange(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      {loading ? "Saving…" : submitLabel}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* EXPENSE */}
              <TabsContent value="expense">
                <form onSubmit={submitTx} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="tx-date-e">Date</Label>
                    <Input
                      id="tx-date-e"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="tx-label-e">
                      Nama product
                    </Label>
                    <Input
                      id="tx-label-e"
                      type="text"
                      placeholder="Nama expense (contoh: Office Rent)"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="tx-amount-e">
                      Amount (Rp)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        Rp
                      </span>
                      <Input
                        id="tx-amount-e"
                        inputMode="numeric"
                        value={fmt(amount)}
                        onChange={(e) =>
                          onAmountChange(e.target.value)
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="tx-note-e">Note</Label>
                    <Input
                      id="tx-note-e"
                      type="text"
                      placeholder="optional note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        reset();
                        onOpenChange(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      {loading ? "Saving…" : submitLabel}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* INVESTMENT */}
              <TabsContent value="investment">
                <form onSubmit={submitTx} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="tx-date-i">Date</Label>
                    <Input
                      id="tx-date-i"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="tx-label-i">
                      Nama product
                    </Label>
                    <Input
                      id="tx-label-i"
                      type="text"
                      placeholder="Nama investasi"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="tx-amount-i">
                      Amount (Rp)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        Rp
                      </span>
                      <Input
                        id="tx-amount-i"
                        inputMode="numeric"
                        value={fmt(amount)}
                        onChange={(e) =>
                          onAmountChange(e.target.value)
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* BTC helper UI — editable Harga Entry + computed Unit */}
                  {active === "investment" &&
                    String(label || "")
                      .trim()
                      .toLowerCase() === "btc" && (
                      <div className="space-y-1.5">
                        <Label>Harga Entry (IDR)</Label>
                        <div className="flex items-center gap-3">
                          <Input
                            id="tx-btc-price"
                            inputMode="numeric"
                            value={
                              btcPriceInput
                                ? new Intl.NumberFormat(
                                    "id-ID",
                                  ).format(
                                    Number(btcPriceInput),
                                  )
                                : loadingBtcPrice
                                  ? "Loading..."
                                  : ""
                            }
                            placeholder={
                              loadingBtcPrice
                                ? "Loading..."
                                : "Harga Entry (IDR)"
                            }
                            onChange={(e) =>
                              onBtcPriceChange(e.target.value)
                            }
                            className="w-48"
                          />
                          <div className="text-xs text-gray-500">
                            Unit:{" "}
                            {btcUnits > 0
                              ? `${btcUnits} BTC`
                              : "—"}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Unit = Nominal ÷ Harga Entry. Jika
                          kosong, sistem pakai harga realtime.
                        </p>
                      </div>
                    )}

                  <div className="space-y-1.5">
                    <Label htmlFor="tx-note-i">Note</Label>
                    <Input
                      id="tx-note-i"
                      type="text"
                      placeholder="optional note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        reset();
                        onOpenChange(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      {loading ? "Saving…" : submitLabel}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Import Transactions</DialogTitle>
            <DialogDescription>
              {me?.is_master 
                ? "Upload LINE CSV file for JPY→IDR conversion and product matching."
                : "Upload CSV file with your transaction data including product_id for grouping."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 space-y-4">
            {/* Import Type Dropdown - Only for master */}
            {me?.is_master && (
              <div className="space-y-1.5">
                <Label htmlFor="import-type">Import Type</Label>
                <select
                  id="import-type"
                  value={importType}
                  onChange={(e) =>
                    setImportType(
                      e.target.value as "csv" | "json",
                    )
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-input-background px-3 py-1 text-sm transition-colors focus:border-ring focus:outline-none focus:ring-[3px] focus:ring-ring/50 dark:bg-input/30"
                >
                  <option value="csv">Import CSV</option>
                  <option value="json">Import JSON</option>
                </select>
              </div>
            )}

            {/* File Input */}
            <div className="space-y-1.5">
              <Label htmlFor="import-file">Choose File</Label>
              <Input
                id="import-file"
                type="file"
                accept={me?.is_master ? (importType === 'csv' ? '.csv' : '.json') : '.csv'}
                onChange={me?.is_master 
                  ? (importType === 'csv' ? handleFileSelect : (e) => { 
                      const f = e.target.files?.[0] || null;
                      setImportFile(f);
                      setImportError(null);
                    })
                  : handleGeneralCsvSelect
                }
                className="w-full"
              />
              {me?.is_master ? (
                <>
                  {importType === 'csv' && (
                    <p className="text-xs text-gray-400 mt-1">
                      LINE CSV format with sticker sales data (JPY)
                    </p>
                  )}
                  {importType === 'json' && (
                    <p className="text-xs text-gray-400 mt-1">
                      Format JSON: {'{cashflow: [...]}'}  or {' [...] '}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-400 mt-1">
                  CSV headers: date, type, category, amount, currency, stream/client, description, product_id (optional)
                </p>
              )}
            </div>

            {/* show preview controls when previewRows available */}
            {importType === "csv" && previewRows.length > 0 && (
              <>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">
                      JPY → IDR Rate
                    </Label>
                    <Input
                      type="text"
                      value={rateJpyToIdr ?? ""}
                      onChange={(e) =>
                        setRateJpyToIdr(
                          Number(e.target.value || 0) || null,
                        )
                      }
                      placeholder="e.g. 104.54658"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">
                      Withholding Tax %
                    </Label>
                    <Input
                      type="text"
                      value={taxPct}
                      onChange={(e) =>
                        setTaxPct(
                          Number(
                            String(e.target.value).replace(
                              /[^0-9.]/g,
                              "",
                            ),
                          ) || 0,
                        )
                      }
                      placeholder="e.g. 10"
                    />
                    <p className="text-xs text-muted-foreground">
                      e.g. 10
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs">
                      Import Mode
                    </Label>
                    <select
                      value={importMode}
                      onChange={(e) =>
                        setImportMode(e.target.value as any)
                      }
                      className="w-full h-9 p-2 border rounded-md border-input bg-input-background text-sm dark:bg-input/30"
                    >
                      <option value="merge">
                        Merge (dedupe by id)
                      </option>
                      <option value="replace">Replace</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-sm font-medium">
                    Preview ({previewRows.length})
                  </div>
                  <div className="max-h-48 overflow-auto border rounded mt-2">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="p-1"></th>
                          <th className="p-1">ID</th>
                          <th className="p-1">Name</th>
                          <th className="p-1">JPY</th>
                          <th className="p-1">Gross IDR</th>
                          <th className="p-1">Tax</th>
                          <th className="p-1">Payable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((r, idx) => {
                          const est = rateJpyToIdr
                            ? computeIdrFromJpy(
                                r.total_jpy,
                                rateJpyToIdr,
                                taxPct,
                              )
                            : null;
                          return (
                            <tr
                              key={r.product_id}
                              className="border-t dark:border-gray-700"
                            >
                              <td className="p-1">
                                <input
                                  type="checkbox"
                                  checked={r.include}
                                  onChange={() => {
                                    const cp = [...previewRows];
                                    cp[idx].include =
                                      !cp[idx].include;
                                    setPreviewRows(cp);
                                  }}
                                />
                              </td>
                              <td className="p-1">
                                {r.product_id}
                              </td>
                              <td className="p-1">{r.name}</td>
                              <td className="p-1">
                                {r.total_jpy}
                              </td>
                              <td className="p-1">
                                {est
                                  ? est.gross_idr.toLocaleString(
                                      "id-ID",
                                    )
                                  : "—"}
                              </td>
                              <td className="p-1">
                                {est
                                  ? est.tax_amount.toLocaleString(
                                      "id-ID",
                                    )
                                  : "—"}
                              </td>
                              <td className="p-1">
                                {est
                                  ? est.payable_idr.toLocaleString(
                                      "id-ID",
                                    )
                                  : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>

          {importError && (
            <div className="text-sm text-red-600 mt-3">
              {importError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowImportDialog(false);
                setPreviewRows([]);
                setImportFile(null);
                setImportError(null);
              }}
            >
              Cancel
            </Button>

            {/* Import Button - shows for both CSV and JSON */}
            {importType === "csv" && previewRows.length > 0 && (
              <Button
                disabled={
                  !previewRows.length ||
                  !rateJpyToIdr ||
                  importLoading
                }
                onClick={handleDoImportWithPreview}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {importLoading ? "Importing…" : "Import"}
              </Button>
            )}

            {importType === "json" && importFile && (
              <Button
                disabled={!importFile || importLoading}
                onClick={doImportGeneric}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {importLoading ? "Importing…" : "Import JSON"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TransactionDialog;