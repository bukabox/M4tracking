// TransactionDialog.tsx
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type TxType = "income" | "expense" | "investment";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved?: (tx: any) => void;
}

export function TransactionDialog({ open, onOpenChange, onSaved }: Props) {
  const [active, setActive] = useState<TxType>("income");
  const [date, setDate] = useState<string>("");
  const [label, setLabel] = useState<string>("");      // Nama product
  const [stream, setStream] = useState<string>("");    // STREAM → hanya Income
  const [stickerId, setStickerId] = useState<string>(""); // Sticker ID for LINE stream (optional)
  const [note, setNote] = useState<string>("");
  const [amount, setAmount] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- BTC specific state (editable price) ---
  const [btcPriceIdr, setBtcPriceIdr] = useState<number | null>(null); // numeric internal
  const [btcPriceInput, setBtcPriceInput] = useState<string>("");     // raw digits string
  const [userEditedBtcPrice, setUserEditedBtcPrice] = useState<boolean>(false);
  const [btcUnits, setBtcUnits] = useState<number>(0);
  const [loadingBtcPrice, setLoadingBtcPrice] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [open]);

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
  const parse = (v: string) => Number(String(v).replace(/[^0-9.-]/g, "")) || 0;

  // when amount changes: update BTC units if BTC mode active
  const onAmountChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "");
    setAmount(digits || "0");

    const invested = Number(digits || "0");
    const priceToUse = (userEditedBtcPrice && btcPriceInput) ? Number(btcPriceInput.replace(/[^0-9.-]/g, "")) : (btcPriceIdr || 0);
    if ((active === "investment") && String(label || "").trim().toLowerCase() === "btc" && priceToUse && invested > 0) {
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
    if (parse(amount) <= 0) return "Amount must be greater than 0";
    return null;
  };

  // fetch BTC price when dialog opened or when label becomes BTC while tab is investment
  useEffect(() => {
    let mounted = true;
    async function loadBtcPrice() {
      const isBtc = (active === "investment") && String(label || "").trim().toLowerCase() === "btc";
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
        const API_BASE = import.meta.env.VITE_API_BASE || '';
        const res = await fetch(`${API_BASE}/api/crypto_prices?vs_currency=idr&symbols=btc`);

        if (!res.ok) {
          setLoadingBtcPrice(false);
          return;
        }
        const j = await res.json();
        const price = (j?.bitcoin?.idr) ?? (j?.btc?.idr) ?? (j?.btc) ?? null;
        if (mounted && price) {
          setBtcPriceIdr(Number(price));
          if (!userEditedBtcPrice) setBtcPriceInput(String(Math.round(Number(price))));
          const invested = Number(amount || "0");
          const usedPrice = (userEditedBtcPrice && btcPriceInput) ? Number(btcPriceInput.replace(/[^0-9.-]/g, "")) : Number(price);
          if (invested > 0 && usedPrice > 0) {
            setBtcUnits(Number((invested / usedPrice).toFixed(8)));
          }
        }
      } catch (e) {
        console.warn("loadBtcPrice failed", e);
      } finally {
        if (mounted) setLoadingBtcPrice(false);
      }
    }
    loadBtcPrice();
    return () => { mounted = false; };
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
    if (active === "income" && (stream || "").toString().toLowerCase() === "line" && stickerId.trim().length > 0) {
      payload.stickerId = stickerId.trim();
      const marker = `sticker:${stickerId.trim()}`;
      if (!payload.note.includes('sticker:')) payload.note = payload.note.trim() ? `${payload.note.trim()} ${marker}` : marker;
      else payload.note = payload.note.replace(/sticker[:=]\s*\d+/i, marker);
    }

    // --- If BTC investment: attach price_idr and btc_amount to add_transaction payload (so table shows directly) ---
    const isBtc = (active === "investment") && String(label || "").trim().toLowerCase() === "btc";
    let usedPriceNumber: number | null = null;
    let btcAmountComputed = 0;
    if (isBtc) {
      usedPriceNumber = (userEditedBtcPrice && btcPriceInput) ? Number(btcPriceInput.replace(/[^0-9.-]/g, "")) : (btcPriceIdr || null);
      const investedIdr = Number(parse(amount));
      btcAmountComputed = usedPriceNumber && usedPriceNumber > 0 ? Number((investedIdr / usedPriceNumber).toFixed(8)) : 0;

      // attach fields to payload for immediate display in TransactionTable
      payload.price_idr = usedPriceNumber ? Math.round(usedPriceNumber) : null;
      payload.btc_amount = btcAmountComputed;
    }

    try {
      const res = await fetch("/api/add_transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error || "Server error");
        setLoading(false);
        return;
      }

      try { onSaved && onSaved(json.transaction ?? json); } catch (err) { console.error(err); }

      try {
        window.dispatchEvent(new CustomEvent('transaction:added', { detail: json.transaction ?? json }));
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
            note: note || "" 
          };
          const r2 = await fetch("/api/add_crypto_buy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cryptoBody)
          });
          if (!r2.ok) {
            console.warn("add_crypto_buy failed", await r2.text());
          } else {
            try { window.dispatchEvent(new Event("crypto:updated")); } catch(e){}
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
    active === "income" ? "Add Income" :
      active === "expense" ? "Add Expense" :
        "Add Investment";

  const showStickerInput = active === "income" && (stream || "").toString().toLowerCase() === "line";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
          <DialogDescription>Add a new income, expense or investment.</DialogDescription>
        </DialogHeader>

        <div className="mt-3">
          <Tabs value={active} onValueChange={(v) => setActive(v as TxType)}>

            <TabsList className="flex flex-row items-center justify-between gap-2 w-full mb-4 px-1">
              <TabsTrigger value="income" className="flex-1 text-center mx-1 rounded-md">Income</TabsTrigger>
              <TabsTrigger value="expense" className="flex-1 text-center mx-1 rounded-md">Expense</TabsTrigger>
              <TabsTrigger value="investment" className="flex-1 text-center mx-1 rounded-md">Investment</TabsTrigger>
            </TabsList>

            {/* INCOME */}
            <TabsContent value="income">
              <form onSubmit={submitTx} className="space-y-4">
                <div>
                  <Label htmlFor="tx-date">Date</Label>
                  <Input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>

                <div>
                  <Label htmlFor="tx-label">Nama product</Label>
                  <Input id="tx-label" type="text" placeholder="Nama product (contoh: Sticker Set A)"
                    value={label} onChange={(e) => setLabel(e.target.value)} />
                </div>

                <div>
                  <Label htmlFor="tx-stream">Stream / Platform</Label>
                  <Input id="tx-stream" type="text" placeholder="LINE, Etsy, Shopee, dll"
                    value={stream} onChange={(e) => setStream(e.target.value)} />
                </div>

                {showStickerInput && (
                  <div>
                    <Label htmlFor="tx-sticker-id">Sticker ID (LINE)</Label>
                    <Input id="tx-sticker-id" type="text" placeholder="Masukkan Sticker ID (contoh: 12345678)"
                      value={stickerId} onChange={(e) => setStickerId(e.target.value)} />
                    <p className="text-xs text-gray-400 mt-1">Opsional — masukkan jika transaksi berhubungan dengan penjualan sticker LINE.</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="tx-amount">Amount (Rp)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                    <Input id="tx-amount" inputMode="numeric" value={fmt(amount)}
                      onChange={(e) => onAmountChange(e.target.value)} className="pl-10" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tx-note">Note</Label>
                  <Input id="tx-note" type="text" placeholder="optional note"
                    value={note} onChange={(e) => setNote(e.target.value)} />
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline"
                    onClick={() => { reset(); onOpenChange(false); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving…" : submitLabel}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* EXPENSE */}
            <TabsContent value="expense">
              <form onSubmit={submitTx} className="space-y-4">
                <div>
                  <Label htmlFor="tx-date-e">Date</Label>
                  <Input id="tx-date-e" type="date" value={date}
                    onChange={(e) => setDate(e.target.value)} />
                </div>

                <div>
                  <Label htmlFor="tx-label-e">Nama product</Label>
                  <Input id="tx-label-e" type="text" placeholder="Nama expense (contoh: Office Rent)"
                    value={label} onChange={(e) => setLabel(e.target.value)} />
                </div>

                <div>
                  <Label htmlFor="tx-amount-e">Amount (Rp)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                    <Input id="tx-amount-e" inputMode="numeric" value={fmt(amount)}
                      onChange={(e) => onAmountChange(e.target.value)} className="pl-10" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tx-note-e">Note</Label>
                  <Input id="tx-note-e" type="text" placeholder="optional note"
                    value={note} onChange={(e) => setNote(e.target.value)} />
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline"
                    onClick={() => { reset(); onOpenChange(false); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving…" : submitLabel}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* INVESTMENT */}
            <TabsContent value="investment">
              <form onSubmit={submitTx} className="space-y-4">
                <div>
                  <Label htmlFor="tx-date-i">Date</Label>
                  <Input id="tx-date-i" type="date" value={date}
                    onChange={(e) => setDate(e.target.value)} />
                </div>

                <div>
                  <Label htmlFor="tx-label-i">Nama product</Label>
                  <Input id="tx-label-i" type="text" placeholder="Nama investasi"
                    value={label} onChange={(e) => setLabel(e.target.value)} />
                </div>

                <div>
                  <Label htmlFor="tx-amount-i">Amount (Rp)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                    <Input id="tx-amount-i" inputMode="numeric" value={fmt(amount)}
                      onChange={(e) => onAmountChange(e.target.value)} className="pl-10" />
                  </div>
                </div>

                {/* BTC helper UI — editable Harga Entry + computed Unit */}
                {(active === "investment") && String(label || "").trim().toLowerCase() === "btc" && (
                  <div>
                    <Label>Harga Entry (IDR)</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="tx-btc-price"
                        inputMode="numeric"
                        value={btcPriceInput ? new Intl.NumberFormat('id-ID').format(Number(btcPriceInput)) : (loadingBtcPrice ? "Loading..." : "")}
                        placeholder={loadingBtcPrice ? "Loading..." : "Harga Entry (IDR)"}
                        onChange={(e) => onBtcPriceChange(e.target.value)}
                        className="w-48"
                      />
                      <div className="text-xs text-gray-500">Unit: {btcUnits > 0 ? `${btcUnits} BTC` : "—"}</div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Unit = Nominal ÷ Harga Entry. Jika kosong, sistem pakai harga realtime.</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="tx-note-i">Note</Label>
                  <Input id="tx-note-i" type="text" placeholder="optional note"
                    value={note} onChange={(e) => setNote(e.target.value)} />
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline"
                    onClick={() => { reset(); onOpenChange(false); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving…" : submitLabel}
                  </Button>
                </div>
              </form>
            </TabsContent>

          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TransactionDialog;
