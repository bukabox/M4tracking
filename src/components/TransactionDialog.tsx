// /mnt/data/components/TransactionDialog.tsx
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
  const [note, setNote] = useState<string>("");
  const [amount, setAmount] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [open]);

  const reset = () => {
    setDate("");
    setLabel("");
    setStream("");
    setNote("");
    setAmount("0");
    setActive("income");
    setError(null);
  };

  const fmt = (v: string) => {
    const n = Number(String(v).replace(/[^0-9]/g, "")) || 0;
    return n.toLocaleString("id-ID");
  };
  const parse = (v: string) => Number(String(v).replace(/[^0-9.-]/g, "")) || 0;

  const onAmountChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "");
    setAmount(digits || "0");
  };

  const validate = (): string | null => {
    if (!date) return "Date is required";
    if (!label) return "Nama product is required";
    if (parse(amount) <= 0) return "Amount must be greater than 0";
    return null;
  };

  const submitTx = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    setError(null);

    // Important:
    // STREAM hanya dikirim pada INCOME
    const payload = {
      type: active,
      date,
      amount: parse(amount),
      category: label,     // backend expects category
      stream: active === "income" ? stream : "", // hanya income
      note,
    };

    try {
      const res = await fetch("/api/add_transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      console.log("[TransactionDialog] add_transaction response:", json);

      if (!res.ok) {
        setError(json?.error || "Server error");
        return;
      }

      try {
        onSaved && onSaved(json.transaction ?? json);
      } catch (err) {
        console.error("[TransactionDialog] onSaved handler threw:", err);
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
              <TabsTrigger value="income"     className="flex-1 text-center mx-1 rounded-md">Income</TabsTrigger>
              <TabsTrigger value="expense"    className="flex-1 text-center mx-1 rounded-md">Expense</TabsTrigger>
              <TabsTrigger value="investment" className="flex-1 text-center mx-1 rounded-md">Investment</TabsTrigger>
            </TabsList>

            {/* ---------------- INCOME ---------------- */}
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

                {/* STREAM hanya untuk INCOME */}
                <div>
                  <Label htmlFor="tx-stream">Stream / Platform</Label>
                  <Input id="tx-stream" type="text" placeholder="LINE, Etsy, Shopee, dll"
                    value={stream} onChange={(e) => setStream(e.target.value)} />
                </div>

                <div>
                  <Label htmlFor="tx-amount">Amount (Rp)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                    <Input id="tx-amount" inputMode="numeric" value={fmt(amount)}
                      onChange={(e) => onAmountChange(e.target.value)} className="pl-10"/>
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

            {/* ---------------- EXPENSE ---------------- */}
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

                {/* TIDAK ADA STREAM DI EXPENSE */}

                <div>
                  <Label htmlFor="tx-amount-e">Amount (Rp)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                    <Input id="tx-amount-e" inputMode="numeric" value={fmt(amount)}
                      onChange={(e) => onAmountChange(e.target.value)} className="pl-10"/>
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

            {/* ---------------- INVESTMENT ---------------- */}
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

                {/* TIDAK ADA STREAM DI INVESTMENT */}

                <div>
                  <Label htmlFor="tx-amount-i">Amount (Rp)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                    <Input id="tx-amount-i" inputMode="numeric" value={fmt(amount)}
                      onChange={(e) => onAmountChange(e.target.value)} className="pl-10"/>
                  </div>
                </div>

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
