// App-lokal.tsx - Clean version untuk project lokal (tanpa mock data/API)
// Updated: Report tab integration with dynamic MetricCards

import {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Search,
  Bell,
  Settings,
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Monitor,
  ChevronDown,
  FileText,
  FileJson,
  BarChart3,
  Wallet,
  Bitcoin,
  LogOut,
  User as UserIcon,
  Box,
  HandCoins,
  BanknoteArrowDown,
  BanknoteArrowUp,
  PieChart,
} from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";
import { useAuthOptional } from "./contexts/AuthContext";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "./components/ui/tabs";
import { Card } from "./components/ui/card";
import { MetricCard } from "./components/MetricCard";
import { PortfolioChart } from "./components/PortfolioChart";
import { TopPerformance } from "./components/TopPerformance";
import { TransactionDialog } from "./components/TransactionDialog";
import {
  TransactionTable,
  TransactionTableRef,
} from "./components/TransactionTable";
import { NetProfitChart } from "./components/NetProfitChart";
import { ProductList } from "./components/ProductList";
import { InvestmentList } from "./components/InvestmentList";
import { InvestmentCrypto } from "./components/InvestmentCrypto";
import Report from "./components/Report";
import { TotalRevenue } from "./components/TotalRevenue";
import { SettingsSheet } from "./components/SettingsSheet";
import { jsPDF } from "jspdf";
import ProductListManager from "./components/ProductListManager";
import { apiFetch } from "./lib/api";
import { toast } from "sonner@2.0.3";
import { Toaster } from "./components/ui/sonner";
import { RevenueChart } from './components/RevenueChart';
import {
  NotificationProvider,
  useNotifications,
} from "./contexts/NotificationContext";
import { NotificationPanel } from "./components/NotificationPanel";

interface Transaction {
  id: string;
  type: "income" | "expense" | "investment";
  date: string;
  label: string;
  category?: string;
  stream?: string;
  amount: number;
  note?: string;
  price_idr?: any;
  btc_amount?: any;
}

interface StreamData {
  name: string;
  value: number;
  color: string;
}

// Professional color palette - Asphalt Blue Theme for PDF
const PDF_COLORS = {
  primary: "#475569",
  secondary: "#64748b",
  accent: "#60a5fa",
  income: "#10b981",
  expense: "#64748b",
  investment: "#94a3b8",
  net: "#3b82f6",
  bgPrimary: "#f8fafc",
  bgSecondary: "#f1f5f9",
  bgDark: "#1e293b",
  border: "#cbd5e1",
  borderLight: "#e2e8f0",
  textPrimary: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  textWhite: "#ffffff",
};

function fmtIDR(v: number) {
  return new Intl.NumberFormat("id-ID").format(Math.round(v));
}

function fmtIDRCurrency(v: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);
}

function pctChange(
  current: number,
  previous: number,
): { text: string; type: "positive" | "negative" | "neutral" } {
  if (previous === 0) {
    if (current === 0) return { text: "—", type: "neutral" };
    return { text: "—", type: "neutral" };
  }
  const raw = ((current - previous) / Math.abs(previous)) * 100;
  const type =
    raw === 0 ? "neutral" : raw > 0 ? "positive" : "negative";
  return {
    text: (raw >= 0 ? "+" : "") + raw.toFixed(1) + "%",
    type: type as any,
  };
}

function AppContent() {
  const { t } = useLanguage();
  const { user, logout } = useAuthOptional();
  const { addNotification, unreadCount } = useNotifications();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactions, setTransactions] = useState<
    Transaction[]
  >([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] =
    useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(
    typeof window !== 'undefined' && window.innerWidth >= 768
  );

  // Search & Scroll state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const transactionTableRef = useRef<TransactionTableRef>(null);

  // Active tab state for Report integration
  const [activeTab, setActiveTab] = useState("overview");

  // Metric state
  const [lifetimeRevenue, setLifetimeRevenue] =
    useState<number>(0);
  const [streamData, setStreamData] = useState<StreamData[]>(
    [],
  );

  // ROI / Modal (M4) - Updated dengan ROI Target dinamis
  const [modalM4, setModalM4] = useState<number>(25000000);
  const [roiTarget, setRoiTarget] = useState<number>(2000); // Default 2000%

  // Project Name
  const [projectName, setProjectName] =
    useState<string>("M4 Tracking");

  // Track screen size for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Chart data states
  const [monthlyLabels, setMonthlyLabels] = useState<string[]>(
    [],
  );
  const [incomeArr, setIncomeArr] = useState<number[]>(
    Array(12).fill(0),
  );
  const [expenseArr, setExpenseArr] = useState<number[]>(
    Array(12).fill(0),
  );
  const [investArr, setInvestArr] = useState<number[]>(
    Array(12).fill(0),
  );
  const [netProfitArr, setNetProfitArr] = useState<number[]>(
    Array(12).fill(0),
  );
  const [lineProducts, setLineProducts] = useState<any[]>([]);

  // Derived metrics for cards
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [netProfitTotal, setNetProfitTotal] =
    useState<number>(0);
  const [changes, setChanges] = useState({
    balance: { text: "—", type: "neutral" as "neutral" },
    revenue: { text: "—", type: "neutral" as "neutral" },
    expenses: { text: "—", type: "neutral" as "neutral" },
    net: { text: "—", type: "neutral" as "neutral" },
  });

  // Crypto state for Investment tab
  const [cryptoHoldings, setCryptoHoldings] = useState<any[]>(
    [],
  );
  const [btcPriceIdr, setBtcPriceIdr] = useState<number>(0);
  const [totalBtcAmount, setTotalBtcAmount] =
    useState<number>(0);
  const [totalInvestedIdr, setTotalInvestedIdr] =
    useState<number>(0);

  // Filter Transactions
  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();

    return transactions
      .filter(
        (tx) =>
          tx.label.toLowerCase().includes(query) ||
          (tx.category &&
            tx.category.toLowerCase().includes(query)) ||
          (tx.stream &&
            tx.stream.toLowerCase().includes(query)) ||
          tx.amount.toString().includes(query),
      )
      .slice(0, 10);
  }, [transactions, searchQuery]);

  // Fetch Functions
  const fetchLifetimeMetrics = async () => {
    try {
      const res = await apiFetch("/api/lifetime_metrics");
      if (!res.ok) return;
      const j = await res.json();
      setLifetimeRevenue(Number(j.lifetime_revenue || 0));
    } catch (e) {
      console.warn("fetchLifetimeMetrics failed", e);
    }
  };

  const fetchLineProductRevenue = async () => {
    try {
      const res = await apiFetch(`/api/product_revenue_line`);
      if (!res.ok) {
        console.warn(
          `Failed to fetch /api/product_revenue_line: ${res.status}`,
        );
        return;
      }
      const data: any[] = await res.json();
      setLineProducts(data);
    } catch (e) {
      console.warn("fetchLineProductRevenue failed", e);
    }
  };

  const fetchStreamPerformance = async () => {
    try {
      const res = await apiFetch(`/api/stream_performance`);
      if (!res.ok) return;
      const j = await res.json();
      setStreamData(j);
    } catch (e) {
      console.warn("fetchStreamPerformance failed", e);
    }
  };

  // Fetch Crypto Holdings for Investment tab
  const fetchCryptoHoldings = async () => {
    try {
      const res = await apiFetch("/api/crypto_holdings");
      if (!res.ok) {
        console.warn(
          `Failed to fetch /api/crypto_holdings: ${res.status}`,
        );
        return;
      }

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (
        !contentType ||
        !contentType.includes("application/json")
      ) {
        console.warn("Crypto holdings response is not JSON");
        return;
      }

      const j = await res.json();
      const arr = Array.isArray(j?.holdings)
        ? j.holdings
        : Array.isArray(j)
          ? j
          : [];
      setCryptoHoldings(arr);

      // Calculate totals from BTC holdings
      const btcHoldings = arr.filter((h: any) => {
        const sym = String(h?.symbol ?? "").toLowerCase();
        const n = String(h?.name ?? "").toLowerCase();
        return (
          sym === "btc" ||
          n.includes("bitcoin") ||
          sym.includes("btc")
        );
      });

      let totalBtc = 0;
      let totalInvested = 0;

      btcHoldings.forEach((h: any) => {
        const buys = Array.isArray(h.buys) ? h.buys : [];
        if (buys.length) {
          buys.forEach((b: any) => {
            const amt = Number(b.amount || 0);
            let invested = Number(
              b.invested_idr ||
                b.investedIdr ||
                b.invested ||
                0,
            );
            if (
              (!invested || invested === 0) &&
              Number(b.price_idr || 0)
            ) {
              invested = Number(b.price_idr || 0) * amt;
            }
            totalBtc += amt;
            totalInvested += invested;
          });
        } else {
          totalBtc += Number(h.amount || 0);
          totalInvested += Number(
            h.total_invested_idr || h.totalInvestedIdr || 0,
          );
        }
      });

      setTotalBtcAmount(totalBtc);
      setTotalInvestedIdr(totalInvested);
    } catch (e) {
      console.warn("fetchCryptoHoldings failed", e);
    }
  };

  // Fetch BTC Price from internal API (with auth)
  const fetchBtcPrice = async () => {
    try {
      // Try internal price first (with auth)
      const res = await apiFetch(
        "/api/crypto_prices?vs_currency=idr&symbols=btc",
      );
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (
          contentType &&
          contentType.includes("application/json")
        ) {
          const j = await res.json();
          const candidate =
            (j && (j["btc"] ?? j["BTC"])) ?? j ?? {};
          const idr =
            (candidate &&
              (candidate["idr"] ??
                candidate["IDR"] ??
                candidate["price_idr"])) ??
            (j && j["price_idr"]) ??
            null;
          if (idr != null && Number.isFinite(Number(idr))) {
            setBtcPriceIdr(Number(idr));
            return;
          }
        }
      }

      // Note: CoinGecko fallback removed due to CORS + rate limits
      // Using mock price as fallback (current BTC price ~1.48B IDR)
      console.log("[BTC Price] Using fallback price");
      setBtcPriceIdr(1480000000);
    } catch (e) {
      // Silently fail - use mock price
      console.log(
        "[BTC Price] Fetch failed, using fallback:",
        e,
      );
      setBtcPriceIdr(1480000000);
    }
  };

  const refreshMonthlyAndMetrics = async () => {
    try {
      const year = new Date().getFullYear();
      const res = await apiFetch(`/api/monthly?year=${year}`);
      if (!res.ok) {
        console.warn(
          `Failed to fetch /api/monthly: ${res.status}`,
        );
        return;
      }
      const j = await res.json();

      const openingBalance = Number(j.opening_balance || 0);
      const labels = j.labels || [];
      const income = (j.income || []).map((x: any) =>
        Number(x || 0),
      );
      const expense = (j.expense || []).map((x: any) =>
        Number(x || 0),
      );
      const invest = (j.investment || []).map((x: any) =>
        Number(x || 0),
      );

      setMonthlyLabels(labels);
      setIncomeArr(income);
      setExpenseArr(expense);
      setInvestArr(invest);

      const now = new Date();
      const idx = now.getMonth();
      const prevIdx = idx - 1;

      const sumIncome = income.reduce(
        (s: number, v: number) => s + v,
        0,
      );
      const sumExpense = expense.reduce(
        (s: number, v: number) => s + v,
        0,
      );

      const nettArr = income.map(
        (inc: number, i: number) =>
          inc - (expense[i] || 0) - (invest[i] || 0),
      );
      setNetProfitArr(nettArr);

      const currentYearProfit = nettArr
        .slice(0, idx + 1)
        .reduce((s: number, v: number) => s + v, 0);
      const cumulativeUpToIdx =
        openingBalance + currentYearProfit;

      const prevYearProfit =
        prevIdx >= 0
          ? nettArr
              .slice(0, prevIdx + 1)
              .reduce((s: number, v: number) => s + v, 0)
          : 0;
      const cumulativeUpToPrev =
        openingBalance + prevYearProfit;

      const revenueThisMonth = income[idx] || 0;
      const expenseThisMonth = expense[idx] || 0;
      const netThisMonth = nettArr[idx] || 0;

      setTotalRevenue(revenueThisMonth);
      setTotalExpenses(expenseThisMonth);
      setNetProfitTotal(netThisMonth);
      setTotalBalance(cumulativeUpToIdx);

      setChanges({
        balance: pctChange(
          cumulativeUpToIdx,
          cumulativeUpToPrev,
        ),
        revenue: pctChange(
          revenueThisMonth,
          prevIdx >= 0 ? income[prevIdx] || 0 : 0,
        ),
        expenses: pctChange(
          expenseThisMonth,
          prevIdx >= 0 ? expense[prevIdx] || 0 : 0,
        ),
        net: pctChange(
          netThisMonth,
          prevIdx >= 0 ? nettArr[prevIdx] || 0 : 0,
        ),
      });
    } catch (e) {
      console.warn("refreshMonthlyAndMetrics failed", e);
    }
  };

  // Initial Data Fetch
  const loadInitialData = () => {
    async function loadTx() {
      try {
        const res = await apiFetch("/api/transactions");
        if (!res.ok)
          throw new Error("failed to fetch transactions");
        const json = await res.json();
        const mapped = (json || []).map((t: any) => ({
          id: String(t.id),
          type: (
            t.type || ""
          ).toLowerCase() as Transaction["type"],
          date: t.date || "",
          label: t.label || t.category || t.title || "",
          category: t.category || "",
          stream: t.stream ?? "",
          amount: Number(t.amount || t.amount_idr || 0),
          note: t.note || "",
          price_idr: t.price_idr ?? t.btc_price_idr ?? null,
          btc_amount: t.btc_amount ?? t.btcAmount ?? null,
        })) as Transaction[];
        setTransactions(mapped);
      } catch (e) {
        console.warn("load transactions failed", e);
      }
    }

    loadTx();
    refreshMonthlyAndMetrics();
    fetchLifetimeMetrics();
    fetchStreamPerformance();
    fetchLineProductRevenue();
    fetchCryptoHoldings();
    fetchBtcPrice();
  };

  useEffect(() => {
    let mounted = true;

    // define fetchUserSettings as async (move definition here or keep above)
    const fetchUserSettings = async (): Promise<boolean> => {
      try {
        const res = await apiFetch("/api/user_settings");
        if (!res.ok) {
          // unauthenticated or server rejected => indicate failure so caller will use fallback
          return false;
        }
        const j = await res.json();
        if (mounted && j && j.projectName) {
          setProjectName(String(j.projectName));
          // keep localStorage in sync for offline/fallback
          localStorage.setItem(
            "projectName",
            String(j.projectName),
          );
        }
        return true;
      } catch (e) {
        console.debug("[APP] fetchUserSettings failed", e);
        return false;
      }
    };

    // async init runner so we can await server settings before localStorage fallback
    (async () => {
      // load main app data (transactions etc.)
      loadInitialData();

      // try server first
      const ok = await fetchUserSettings();

      // Now load modal & ROI & theme (these are local-only)
      const savedModal = localStorage.getItem("initialModal");
      if (savedModal) {
        const parsed = Number(savedModal);
        if (!isNaN(parsed) && parsed > 0) {
          setModalM4(parsed);
        }
      }

      const savedRoiTarget = localStorage.getItem("roiTarget");
      if (savedRoiTarget) {
        const parsed = Number(savedRoiTarget);
        if (!isNaN(parsed) && parsed > 0) {
          setRoiTarget(parsed);
        }
      }

      // Only use localStorage projectName if server did not provide one
      if (!ok) {
        const savedProjectName =
          localStorage.getItem("projectName");
        if (savedProjectName) {
          setProjectName(savedProjectName);
        }
      }

      // Load and apply theme from localStorage (unchanged)
      const savedThemeMode = (localStorage.getItem(
        "themeMode",
      ) || "auto") as "auto" | "light" | "dark";
      const getSystemTheme = (): "light" | "dark" => {
        if (
          typeof window !== "undefined" &&
          window.matchMedia
        ) {
          return window.matchMedia(
            "(prefers-color-scheme: dark)",
          ).matches
            ? "dark"
            : "light";
        }
        return "light";
      };

      let shouldBeDark = false;
      if (savedThemeMode === "auto") {
        shouldBeDark = getSystemTheme() === "dark";
      } else {
        shouldBeDark = savedThemeMode === "dark";
      }

      if (shouldBeDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    })();

    // Listen for 401 unauthorized errors and handle session expiry
    const handleUnauthorized = (event: any) => {
      console.warn(
        "[APP] Session expired (401), logging out...",
      );
      toast.error("Session expired. Please login again.");

      // Use logout from auth context if available
      if (logout) {
        logout();
      } else {
        // Fallback: clear local storage and reload
        localStorage.removeItem("user");
        localStorage.removeItem("google_id_token");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    };

    window.addEventListener(
      "api:unauthorized",
      handleUnauthorized,
    );

    return () => {
      mounted = false;
      window.removeEventListener(
        "api:unauthorized",
        handleUnauthorized,
      );
    };
  }, [logout]);

  // Update document title when projectName changes
  useEffect(() => {
    document.title = projectName || "FinanceHub";
  }, [projectName]);

  // Handlers
  const mergeTransactionIntoState = useCallback((tx: any) => {
    if (!tx) return;
    setTransactions((prev) => {
      const idStr = String(tx.id);
      const idx = prev.findIndex((p) => String(p.id) === idStr);
      const normalized = {
        id: idStr,
        type: (
          tx.type ||
          tx.category ||
          "income"
        ).toLowerCase(),
        date: tx.date ?? new Date().toISOString(),
        label: tx.label ?? tx.category ?? "",
        category: tx.category ?? "",
        stream: tx.stream ?? "",
        amount: Number(tx.amount ?? tx.amount_idr ?? 0),
        note: tx.note ?? "",
        price_idr: tx.price_idr ?? tx.btc_price_idr ?? null,
        btc_amount: tx.btc_amount ?? tx.btcAmount ?? null,
      } as Transaction;

      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...normalized };
        return copy;
      }
      return [normalized, ...prev];
    });
  }, []);

  const handleAddTransaction = async (transaction: any) => {
    const normalized: Transaction = {
      id: (transaction as any)?.id
        ? String((transaction as any).id)
        : Date.now().toString(),
      type: (
        (transaction as any)?.type ||
        (transaction as any)?.category ||
        "income"
      ).toLowerCase() as any,
      date:
        (transaction as any)?.date || new Date().toISOString(),
      label:
        (transaction as any)?.label ??
        (transaction as any)?.category ??
        "",
      category: (transaction as any)?.category ?? "",
      stream: (transaction as any)?.stream ?? "",
      amount: Number(
        (transaction as any)?.amount ??
          transaction?.amount_idr ??
          0,
      ),
      note: (transaction as any)?.note ?? "",
      price_idr:
        transaction?.price_idr ??
        transaction?.btc_price_idr ??
        null,
      btc_amount:
        transaction?.btc_amount ??
        transaction?.btcAmount ??
        null,
    };
    setTransactions((prev) => [normalized, ...prev]);

    try {
      const res = await apiFetch("/api/transactions");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) {
          const mapped = (json || []).map((t: any) => ({
            id: String(t.id),
            type: (
              t.type || ""
            ).toLowerCase() as Transaction["type"],
            date: t.date || "",
            label: t.label || t.category || t.title || "",
            category: t.category || "",
            stream: t.stream ?? "",
            amount: Number(t.amount || t.amount_idr || 0),
            note: t.note || "",
            price_idr: t.price_idr ?? t.btc_price_idr ?? null,
            btc_amount: t.btc_amount ?? t.btcAmount ?? null,
          })) as Transaction[];
          setTransactions(mapped);
        }
      }
      toast.success("Transaction added successfully!");
      addNotification({
        type: "success",
        title: "Transaction Added",
        message: `Successfully added ${normalized.type} transaction: ${normalized.label || "Unnamed"} - ${fmtIDRCurrency(normalized.amount)}`,
      });
    } catch (e) {
      console.warn("refresh transactions after add failed", e);
      toast.error("Failed to add transaction");
      addNotification({
        type: "error",
        title: "Transaction Failed",
        message: "Failed to add transaction. Please try again.",
      });
    }

    refreshMonthlyAndMetrics();
    fetchLifetimeMetrics();
    fetchStreamPerformance();
  };

  useEffect(() => {
    const handler = (e: any) => {
      const tx = e?.detail ?? null;
      if (!tx) return;
      mergeTransactionIntoState(tx);
      console.debug("[APP] transaction:added event merged", tx);
    };
    window.addEventListener(
      "transaction:added",
      handler as EventListener,
    );
    return () =>
      window.removeEventListener(
        "transaction:added",
        handler as EventListener,
      );
  }, [mergeTransactionIntoState]);

  // Listen for crypto:updated events
  useEffect(() => {
    const handler = () => {
      console.debug("[APP] crypto:updated event received");
      fetchCryptoHoldings();
      fetchBtcPrice();
    };
    window.addEventListener(
      "crypto:updated",
      handler as EventListener,
    );
    return () =>
      window.removeEventListener(
        "crypto:updated",
        handler as EventListener,
      );
  }, []);

  const handleDeleteTransaction = async (id: string) => {
    try {
      setTransactions((prev) =>
        prev.filter((t) => t.id !== id),
      );

      const res = await apiFetch("/api/delete_transaction", {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("delete failed");

      refreshMonthlyAndMetrics();
      fetchLifetimeMetrics();
      fetchStreamPerformance();

      toast.success("Transaction deleted successfully!");
      addNotification({
        type: "success",
        title: "Transaction Deleted",
        message: `Transaction #${id} has been successfully deleted.`,
      });
    } catch (e) {
      console.error("delete transaction failed", e);
      toast.error("Failed to delete transaction");
      addNotification({
        type: "error",
        title: "Delete Failed",
        message:
          "Failed to delete transaction. Please try again.",
      });
      loadInitialData();
    }
  };

  // Export Combined JSON
  const buildNormalizedCashflowArray = () => {
    const normalized = transactions.map((tx) => {
      const parsedId = (() => {
        const n = Number(String(tx.id).replace(/\D/g, ""));
        return Number.isFinite(n) && n > 0
          ? Math.floor(n)
          : null;
      })();
      const idNum =
        parsedId ??
        Date.now() + Math.floor(Math.random() * 1000);

      let d = tx.date || new Date().toISOString();
      try {
        d = new Date(d).toISOString().slice(0, 10);
      } catch (e) {
        d = (tx.date || new Date().toISOString()).slice(0, 10);
      }

      return {
        id: Number(idNum),
        type: (tx.type || "income").toLowerCase(),
        date: d,
        amount: Number(tx.amount || 0),
        category: tx.category ?? tx.label ?? "",
        stream: tx.stream ?? "",
        note: tx.note ?? "",
        price_idr: tx.price_idr ?? null,
        btc_amount: tx.btc_amount ?? null,
        label: tx.label ?? undefined,
      };
    });

    normalized.sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id,
    );
    return normalized;
  };

  const exportCombinedJSON = async () => {
    const cash = buildNormalizedCashflowArray();
    let crypto = { holdings: [], meta: {} };
    try {
      const r = await apiFetch("/api/crypto_holdings");
      if (r.ok) crypto = await r.json();
    } catch (e) {
      /* ignore */
    }

    const payload = {
      exportDate: new Date().toISOString(),
      cashflow: cash,
      crypto: crypto,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `m4-combined-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    toast.success("JSON exported successfully!");
    addNotification({
      type: "success",
      title: "Data Exported",
      message: `Combined JSON file downloaded successfully`,
    });
  };

  // Helper: Convert hex to RGB for PDF
  const hexToRgb = (hex: string): [number, number, number] => {
    const result =
      /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 0, 0];
  };

  // Helper: Draw line chart on PDF
  const drawLineChart = (
    doc: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    data: any[],
  ) => {
    const marginLeft = 25;
    const marginBottom = 20;
    const marginTop = 10;
    const chartWidth = width - marginLeft - 10;
    const chartHeight = height - marginTop - marginBottom;

    doc.setFillColor(...hexToRgb(PDF_COLORS.bgSecondary));
    doc.roundedRect(x, y, width, height, 2, 2, "F");

    const maxValue = Math.max(
      ...data.map((d) =>
        Math.max(
          d.income || 0,
          d.expense || 0,
          d.investment || 0,
        ),
      ),
    );
    const scale = chartHeight / (maxValue * 1.1);

    doc.setDrawColor(...hexToRgb(PDF_COLORS.borderLight));
    doc.setLineWidth(0.2);
    for (let i = 0; i <= 4; i++) {
      const gridY = y + marginTop + (chartHeight / 4) * i;
      doc.line(
        x + marginLeft,
        gridY,
        x + marginLeft + chartWidth,
        gridY,
      );
    }

    doc.setDrawColor(...hexToRgb(PDF_COLORS.border));
    doc.setLineWidth(0.5);
    doc.line(
      x + marginLeft,
      y + marginTop,
      x + marginLeft,
      y + marginTop + chartHeight,
    );
    doc.line(
      x + marginLeft,
      y + marginTop + chartHeight,
      x + marginLeft + chartWidth,
      y + marginTop + chartHeight,
    );

    const plotLine = (dataKey: string, color: string) => {
      doc.setDrawColor(...hexToRgb(color));
      doc.setLineWidth(1.5);

      for (let i = 0; i < data.length - 1; i++) {
        const x1 =
          x + marginLeft + (chartWidth / (data.length - 1)) * i;
        const y1 =
          y +
          marginTop +
          chartHeight -
          (data[i][dataKey] || 0) * scale;
        const x2 =
          x +
          marginLeft +
          (chartWidth / (data.length - 1)) * (i + 1);
        const y2 =
          y +
          marginTop +
          chartHeight -
          (data[i + 1][dataKey] || 0) * scale;

        doc.line(x1, y1, x2, y2);

        doc.setFillColor(...hexToRgb(color));
        doc.circle(x1, y1, 1.5, "F");
        if (i === data.length - 2) {
          doc.circle(x2, y2, 1.5, "F");
        }
      }
    };

    plotLine("income", PDF_COLORS.income);
    plotLine("expense", PDF_COLORS.expense);
    plotLine("investment", PDF_COLORS.investment);

    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
    data.forEach((d, i) => {
      if (i % 2 === 0) {
        const labelX =
          x + marginLeft + (chartWidth / (data.length - 1)) * i;
        doc.text(
          d.month || d.label,
          labelX,
          y + marginTop + chartHeight + 6,
          { align: "center" },
        );
      }
    });

    for (let i = 0; i <= 4; i++) {
      const value = ((maxValue * 1.1) / 4) * (4 - i);
      const labelY = y + marginTop + (chartHeight / 4) * i;
      doc.text(
        `${Math.round(value / 1000000)}M`,
        x + marginLeft - 3,
        labelY + 1,
        { align: "right" },
      );
    }

    const legendY = y + height - 5;
    const legendStartX = x + width / 2 - 40;

    const legends = [
      { label: "Income", color: PDF_COLORS.income },
      { label: "Expense", color: PDF_COLORS.expense },
      { label: "Investment", color: PDF_COLORS.investment },
    ];

    legends.forEach((leg, idx) => {
      const legX = legendStartX + idx * 28;
      doc.setFillColor(...hexToRgb(leg.color));
      doc.circle(legX, legendY - 0.5, 1.5, "F");
      doc.setFontSize(7);
      doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
      doc.text(leg.label, legX + 3, legendY);
    });
  };

  // Helper: Draw donut chart on PDF
  const drawDonutChart = (
    doc: jsPDF,
    centerX: number,
    centerY: number,
    radius: number,
    data: any[],
  ) => {
    const total = data.reduce(
      (sum: number, item: any) => sum + item.value,
      0,
    );
    let currentAngle = -90;

    data.forEach((item, idx) => {
      const colors = [
        PDF_COLORS.income,
        PDF_COLORS.expense,
        PDF_COLORS.investment,
      ];
      const sliceAngle = (item.value / total) * 360;

      doc.setFillColor(...hexToRgb(colors[idx]));
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;

      for (
        let angle = startAngle;
        angle <= endAngle;
        angle += 2
      ) {
        const rad = (angle * Math.PI) / 180;
        const x1 = centerX + Math.cos(rad) * radius;
        const y1 = centerY + Math.sin(rad) * radius;
        const nextRad = ((angle + 2) * Math.PI) / 180;
        const x2 = centerX + Math.cos(nextRad) * radius;
        const y2 = centerY + Math.sin(nextRad) * radius;

        doc.setDrawColor(...hexToRgb(colors[idx]));
        doc.setLineWidth(8);
        doc.line(x1, y1, x2, y2);
      }

      currentAngle += sliceAngle;
    });

    doc.setFillColor(255, 255, 255);
    doc.circle(centerX, centerY, radius - 8, "F");

    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
    doc.text("Total", centerX, centerY - 3, {
      align: "center",
    });
    doc.setFontSize(11);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
    doc.text(fmtIDRCurrency(total), centerX, centerY + 3, {
      align: "center",
    });
  };

  // Generate Yearly PDF Report
  const generateYearlyPDF = () => {
    const year = new Date().getFullYear();
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 15;

    doc.setFillColor(...hexToRgb(PDF_COLORS.bgDark));
    doc.rect(0, 0, pageWidth, 35, "F");

    doc.setFillColor(...hexToRgb(PDF_COLORS.accent));
    doc.roundedRect(14, 8, 6, 6, 1, 1, "F");

    doc.setTextColor(...hexToRgb(PDF_COLORS.textWhite));
    doc.setFontSize(20);
    doc.text(`${projectName} - Annual Report`, 25, 13);

    doc.setFontSize(11);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
    doc.text(`Fiscal Year ${year}`, 25, 20);

    doc.setFontSize(8);
    doc.text(
      `Generated: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}`,
      pageWidth - 14,
      13,
      { align: "right" },
    );

    yPos = 45;

    doc.setFontSize(12);
    doc.setTextColor(...hexToRgb(PDF_COLORS.primary));
    doc.text("Key Financial Metrics", 14, yPos);
    yPos += 8;

    const yearIncome = incomeArr.reduce(
      (sum, val) => sum + val,
      0,
    );
    const yearExpense = expenseArr.reduce(
      (sum, val) => sum + val,
      0,
    );
    const yearInvestment = investArr.reduce(
      (sum, val) => sum + val,
      0,
    );
    const yearNet = yearIncome - yearExpense - yearInvestment;

    const cardData = [
      {
        label: "Total Income",
        value: fmtIDR(yearIncome),
        bgColor: PDF_COLORS.bgSecondary,
        accentColor: PDF_COLORS.income,
      },
      {
        label: "Total Expense",
        value: fmtIDR(yearExpense),
        bgColor: PDF_COLORS.bgSecondary,
        accentColor: PDF_COLORS.expense,
      },
      {
        label: "Investment",
        value: fmtIDR(yearInvestment),
        bgColor: PDF_COLORS.bgSecondary,
        accentColor: PDF_COLORS.investment,
      },
      {
        label: "Net Profit",
        value: fmtIDR(yearNet),
        bgColor: PDF_COLORS.bgSecondary,
        accentColor:
          yearNet >= 0 ? PDF_COLORS.net : PDF_COLORS.expense,
      },
    ];

    cardData.forEach((card, idx) => {
      const cardY = yPos + Math.floor(idx / 2) * 26;
      const cardX = 14 + (idx % 2) * 96;

      doc.setFillColor(...hexToRgb(PDF_COLORS.bgSecondary));
      doc.roundedRect(cardX, cardY, 90, 22, 2, 2, "F");

      doc.setFillColor(...hexToRgb(card.accentColor));
      doc.roundedRect(cardX, cardY, 3, 22, 2, 2, "F");

      doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
      doc.setFontSize(8);
      doc.text(card.label, cardX + 8, cardY + 7);

      doc.setFontSize(11);
      doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
      doc.text(card.value, cardX + 8, cardY + 16);
    });

    yPos += 60;

    doc.setFontSize(12);
    doc.setTextColor(...hexToRgb(PDF_COLORS.primary));
    doc.text("Monthly Trend Analysis", 14, yPos);
    yPos += 5;

    const monthlyChartData = monthlyLabels.map(
      (label, idx) => ({
        month: label.substring(0, 3),
        income: incomeArr[idx] || 0,
        expense: expenseArr[idx] || 0,
        investment: investArr[idx] || 0,
      }),
    );

    const totalIncome = incomeArr.reduce(
      (sum, val) => sum + val,
      0,
    );
    const totalExpense = expenseArr.reduce(
      (sum, val) => sum + val,
      0,
    );
    const totalInvest = investArr.reduce(
      (sum, val) => sum + val,
      0,
    );
    const pieData = [
      { name: "Income", value: totalIncome },
      { name: "Expense", value: totalExpense },
      { name: "Investment", value: totalInvest },
    ].filter((item) => item.value > 0);

    drawLineChart(doc, 14, yPos, 120, 55, monthlyChartData);

    const donutCenterX = 160;
    const donutCenterY = yPos + 20;
    drawDonutChart(
      doc,
      donutCenterX,
      donutCenterY,
      18,
      pieData,
    );

    const legendStartY = yPos + 40;
    pieData.forEach((item, idx) => {
      const colors = [
        PDF_COLORS.income,
        PDF_COLORS.expense,
        PDF_COLORS.investment,
      ];
      const legY = legendStartY + idx * 5;
      const totalAll = totalIncome + totalExpense + totalInvest;
      const percentage =
        totalAll > 0
          ? ((item.value / totalAll) * 100).toFixed(1)
          : "0.0";

      doc.setFillColor(...hexToRgb(colors[idx]));
      doc.circle(145, legY - 1, 1.5, "F");

      doc.setFontSize(7);
      doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
      doc.text(item.name, 150, legY);

      doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
      doc.text(`${percentage}%`, 180, legY, { align: "right" });
    });

    yPos += 65;

    doc.setFontSize(12);
    doc.setTextColor(...hexToRgb(PDF_COLORS.primary));
    doc.text("Monthly Breakdown", 14, yPos);
    yPos += 8;

    doc.setFillColor(...hexToRgb(PDF_COLORS.bgDark));
    doc.roundedRect(14, yPos, 182, 7, 1, 1, "F");

    doc.setTextColor(...hexToRgb(PDF_COLORS.textWhite));
    doc.setFontSize(8);
    doc.text("Month", 18, yPos + 4.5);
    doc.text("Income", 122, yPos + 4.5, { align: "right" });
    doc.text("Expense", 148, yPos + 4.5, { align: "right" });
    doc.text("Investment", 170, yPos + 4.5, { align: "right" });
    doc.text("Net", 193, yPos + 4.5, { align: "right" });

    yPos += 7;

    for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
      const monthName = new Date(
        year,
        monthIdx,
        1,
      ).toLocaleString("en-US", { month: "short" });
      const income = incomeArr[monthIdx] || 0;
      const expense = expenseArr[monthIdx] || 0;
      const investment = investArr[monthIdx] || 0;
      const net = income - expense - investment;

      if (monthIdx % 2 === 0) {
        doc.setFillColor(...hexToRgb(PDF_COLORS.bgPrimary));
        doc.rect(14, yPos, 182, 6, "F");
      }

      doc.setTextColor(...hexToRgb(PDF_COLORS.textPrimary));
      doc.setFontSize(7);
      doc.text(monthName, 18, yPos + 4);

      doc.setTextColor(...hexToRgb(PDF_COLORS.textSecondary));
      doc.text(fmtIDR(income), 122, yPos + 4, {
        align: "right",
      });
      doc.text(fmtIDR(expense), 148, yPos + 4, {
        align: "right",
      });
      doc.text(fmtIDR(investment), 170, yPos + 4, {
        align: "right",
      });

      doc.setTextColor(
        ...hexToRgb(
          net >= 0 ? PDF_COLORS.income : PDF_COLORS.expense,
        ),
      );
      doc.text(fmtIDR(net), 193, yPos + 4, { align: "right" });

      yPos += 6;
    }

    doc.setDrawColor(...hexToRgb(PDF_COLORS.border));
    doc.setLineWidth(0.3);
    doc.roundedRect(14, yPos - 72, 182, 79, 1, 1, "S");

    yPos += 10;

    const footerY = pageHeight - 15;
    doc.setDrawColor(...hexToRgb(PDF_COLORS.borderLight));
    doc.setLineWidth(0.3);
    doc.line(14, footerY, pageWidth - 14, footerY);

    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb(PDF_COLORS.textMuted));
    doc.text(
      `${projectName} Financial Report`,
      14,
      footerY + 5,
    );
    doc.text("Page 1 of 1", pageWidth - 14, footerY + 5, {
      align: "right",
    });

    doc.setFontSize(6);
    doc.text(
      `© ${new Date().getFullYear()} BUKABOX M4 Tracking system. All rights reserved.`,
      pageWidth / 2,
      footerY + 8,
      { align: "center" },
    );

    doc.save(
      `${projectName.replace(/\s+/g, "-")}-Annual-Report-${year}.pdf`,
    );
    setShowExportMenu(false);
    toast.success("PDF exported successfully!");
    addNotification({
      type: "success",
      title: "PDF Report Generated",
      message: `Annual report for ${year} downloaded successfully`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header - Mobile Responsive */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 relative">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shrink-0">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900 dark:text-gray-100">
                {projectName}
              </h1>
              <p className="text-gray-500 text-sm">
                BUKABOX tracking system
              </p>
            </div>
          </div>

          {/* User Icon - Pojok Kanan Atas (Absolute positioned on mobile) */}
          <div className="absolute top-4 right-4 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || 'User'}
                  className="w-6 h-6 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                />
              ) : (
                <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </Button>

            {showUserMenu && (
              <>
                {/* Backdrop overlay to close menu */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />

                {/* User dropdown menu */}
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      {user?.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name || 'User'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {user?.name || 'User'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {user?.email || 'user@example.com'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3"
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Sign Out</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Log out from your account
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Box */}
            <div
              className="relative flex-1 md:flex-initial"
              onBlur={() =>
                setTimeout(() => setIsSearchOpen(false), 200)
              }
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <Input
                placeholder="Search transactions..."
                className="pl-10 md:w-80 w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length > 0) {
                    setIsSearchOpen(true);
                  } else {
                    setIsSearchOpen(false);
                  }
                }}
                onFocus={() => {
                  if (searchQuery.length > 0)
                    setIsSearchOpen(true);
                }}
              />

              {/* Search Results Panel */}
              {isSearchOpen && searchQuery && (
                <div className="absolute top-full mt-2 w-full md:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="p-3 bg-gray-50 dark:bg-gray-750 border-b px-5 py-4 border-gray-200 dark:border-gray-700">
                    <p className="text-gray-900 dark:text-gray-100 font-semibold">
                      Search Results (
                      {filteredTransactions.length})
                    </p>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map(
                        (transaction) => (
                          <button
                            key={transaction.id}
                            onClick={() => {
                              setIsSearchOpen(false);
                              setSearchQuery("");
                              if (transactionTableRef.current) {
                                transactionTableRef.current.scrollToTransaction(
                                  transaction.id,
                                );
                              }
                            }}
                            className="w-full px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left border-b border-gray-100 dark:border-gray-700 last:border-0"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-gray-900 dark:text-gray-100 font-medium mb-1">
                                  {transaction.label}
                                </p>
                                <p className="text-gray-500 text-sm flex items-center gap-1">
                                  {transaction.type ===
                                    "income" &&
                                  transaction.stream ? (
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      {transaction.stream}
                                    </span>
                                  ) : (
                                    <span className="capitalize">
                                      {transaction.category ||
                                        transaction.type}
                                    </span>
                                  )}
                                  <span className="text-gray-400">
                                    {" "}
                                    •{" "}
                                  </span>
                                  {new Date(
                                    transaction.date,
                                  ).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </p>
                              </div>
                              <span
                                className={`font-semibold ${
                                  transaction.type === "income"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {transaction.type === "income"
                                  ? "+"
                                  : "-"}
                                Rp{" "}
                                {fmtIDR(
                                  Math.abs(transaction.amount),
                                )}
                              </span>
                            </div>
                          </button>
                        ),
                      )
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-gray-500">
                          No transactions found
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Icon Buttons Group */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setNotificationPanelOpen(true)}
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
                )}
              </Button>

              {/* User Icon - Desktop only (sebelah notification bell) */}
              {isDesktop && (
                <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name || "User"}
                    className="w-6 h-6 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                  />
                ) : (
                  <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </Button>

              {showUserMenu && (
                <>
                  {/* Backdrop overlay to close menu */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />

                  {/* User dropdown menu */}
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        {user?.picture ? (
                          <img
                            src={user.picture}
                            alt={user.name || "User"}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {user?.name || "User"}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {user?.email || "user@example.com"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button
                        className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3"
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                        <div>
                          <div className="font-medium">
                            Sign Out
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Log out from your account
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Button>
            </div>

            <Button
              className={`bg-green-500 hover:bg-green-600 ${isDesktop ? '' : 'hidden'}`}
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Transaction
            </Button>

            {/* Export Dropdown - Visible on all screen sizes */}
            <div className="relative">
              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                onClick={() =>
                  setShowExportMenu(!showExportMenu)
                }
              >
                <Download className="w-4 h-4 mr-2" />
                Export
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>

              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportMenu(false)}
                  />

                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
                    <div className="py-1">
                      <button
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                        onClick={generateYearlyPDF}
                      >
                        <FileText className="w-4 h-4 text-blue-500" />
                        <div>
                          <div className="font-medium">
                            Export PDF
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Complete report in PDF
                          </div>
                        </div>
                      </button>

                      <div className="border-t border-gray-200 dark:border-gray-700" />

                      <button
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                        onClick={exportCombinedJSON}
                      >
                        <FileJson className="w-4 h-4 text-green-500" />
                        <div>
                          <div className="font-medium">
                            Export Data (JSON)
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Raw data in JSON format
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-8 pb-24 md:pb-8">
        {/* TotalRevenue Component */}
        <TotalRevenue
          lifetimeRevenue={lifetimeRevenue}
          initialModal={modalM4}
          roiTarget={roiTarget}
          onModalChange={(value) => {
            setModalM4(value);
            localStorage.setItem("initialModal", String(value));
          }}
        />

        {/* Metric Cards - Conditional Rendering */}
        {activeTab === "overview" ? (
          // Overview Tab: 3 MetricCards + PortfolioChart
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              icon={<Wallet className="w-5 h-5" />}
              iconBgColor="bg-cyan-500"
              title="Total Balance"
              value={`Rp ${fmtIDR(totalBalance)}`}
              change={changes.balance.text}
              changeType={changes.balance.type}
              comparison="vs last month"
            />
            <MetricCard
              icon={<BanknoteArrowDown className="w-5 h-5" />}
              iconBgColor="bg-green-500"
              title="Total Revenue"
              value={`Rp ${fmtIDR(totalRevenue)}`}
              change={changes.revenue.text}
              changeType={changes.revenue.type}
              comparison="vs last month"
            />
            <MetricCard
              icon={<BanknoteArrowUp className="w-5 h-5" />}
              iconBgColor="bg-orange-500"
              title="Total Expenses"
              value={`Rp ${fmtIDR(totalExpenses)}`}
              change={changes.expenses.text}
              changeType={changes.expenses.type}
              comparison="vs last month"
            />
            {/* PortfolioChart replaces Net Profit card */}
            <div className="h-full">
              <PortfolioChart transactions={transactions} />
            </div>
          </div>
        ) : activeTab === "investment" ? (
          // Investment Tab: Balance, Revenue, Total Investment, BTC Holdings
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              icon={<Wallet className="w-5 h-5" />}
              iconBgColor="bg-cyan-500"
              title="Total Balance"
              value={`Rp ${fmtIDR(totalBalance)}`}
              change={changes.balance.text}
              changeType={changes.balance.type}
              comparison="vs last month"
            />
            <MetricCard
              icon={<BanknoteArrowDown className="w-5 h-5" />}
              iconBgColor="bg-green-500"
              title="Total Revenue"
              value={`Rp ${fmtIDR(totalRevenue)}`}
              change={changes.revenue.text}
              changeType={changes.revenue.type}
              comparison="vs last month"
            />
            {/* Total Investment replaces Expenses */}
            <MetricCard
              icon={<Wallet className="w-5 h-5" />}
              iconBgColor="bg-blue-500"
              title="Total Investment"
              value={`Rp ${fmtIDR(totalInvestedIdr)}`}
              change={
                totalInvestedIdr > 0 && btcPriceIdr > 0
                  ? `${((btcPriceIdr * totalBtcAmount - totalInvestedIdr) / totalInvestedIdr) * 100 >= 0 ? "+" : ""}${(((btcPriceIdr * totalBtcAmount - totalInvestedIdr) / totalInvestedIdr) * 100).toFixed(1)}%`
                  : "—"
              }
              changeType={
                totalInvestedIdr > 0 &&
                btcPriceIdr > 0 &&
                btcPriceIdr * totalBtcAmount -
                  totalInvestedIdr >=
                  0
                  ? "positive"
                  : totalInvestedIdr > 0 && btcPriceIdr > 0
                    ? "negative"
                    : "neutral"
              }
              comparison="P&L"
            />
            {/* BTC Holdings replaces Net Profit */}
            <MetricCard
              icon={
                <img
                  src="https://www.svgrepo.com/show/303287/bitcoin-logo.svg"
                  alt="BTC"
                  className="w-8 h-8"
                />
              }
              iconBgColor="bg-[#f7921a]"
              title="BTC Holdings"
              value={`${totalBtcAmount.toFixed(8)} BTC`}
              change={
                totalInvestedIdr > 0 && btcPriceIdr > 0
                  ? `${((btcPriceIdr * totalBtcAmount - totalInvestedIdr) / totalInvestedIdr) * 100 >= 0 ? "+" : ""}${(((btcPriceIdr * totalBtcAmount - totalInvestedIdr) / totalInvestedIdr) * 100).toFixed(1)}%`
                  : "—"
              }
              changeType={
                totalInvestedIdr > 0 &&
                btcPriceIdr > 0 &&
                btcPriceIdr * totalBtcAmount -
                  totalInvestedIdr >=
                  0
                  ? "positive"
                  : totalInvestedIdr > 0 && btcPriceIdr > 0
                    ? "negative"
                    : "neutral"
              }
              comparison={
                btcPriceIdr > 0
                  ? `Rp ${fmtIDR(btcPriceIdr * totalBtcAmount)}`
                  : "—"
              }
            />
          </div>
        ) : activeTab === "analytic" ? (
          // Analytic Tab: Show all 4 normal MetricCards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              icon={<Wallet className="w-5 h-5" />}
              iconBgColor="bg-cyan-500"
              title="Total Balance"
              value={`Rp ${fmtIDR(totalBalance)}`}
              change={changes.balance.text}
              changeType={changes.balance.type}
              comparison="vs last month"
            />
            <MetricCard
              icon={<BanknoteArrowDown className="w-5 h-5" />}
              iconBgColor="bg-green-500"
              title="Total Revenue"
              value={`Rp ${fmtIDR(totalRevenue)}`}
              change={changes.revenue.text}
              changeType={changes.revenue.type}
              comparison="vs last month"
            />
            <MetricCard
              icon={<BanknoteArrowUp className="w-5 h-5" />}
              iconBgColor="bg-orange-500"
              title="Total Expenses"
              value={`Rp ${fmtIDR(totalExpenses)}`}
              change={changes.expenses.text}
              changeType={changes.expenses.type}
              comparison="vs last month"
            />
            <MetricCard
              icon={<DollarSign className="w-5 h-5" />}
              iconBgColor="bg-purple-500"
              title="Net Profit"
              value={`Rp ${fmtIDR(netProfitTotal)}`}
              change={changes.net.text}
              changeType={changes.net.type}
              comparison="vs last month"
            />
          </div>
        ) : (
          // Report Tab: Show Year Summary Cards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="px-2 py-1 rounded bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm">
                  Income
                </span>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                  Total Revenue
                </p>
                <p className="text-gray-900 dark:text-gray-100 mb-1">
                  {fmtIDRCurrency(
                    incomeArr.reduce(
                      (sum, val) => sum + val,
                      0,
                    ),
                  )}
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">
                  year {new Date().getFullYear()}
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center text-white">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <span className="px-2 py-1 rounded bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
                  Expense
                </span>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                  Total Expenses
                </p>
                <p className="text-gray-900 dark:text-gray-100 mb-1">
                  {fmtIDRCurrency(
                    expenseArr.reduce(
                      (sum, val) => sum + val,
                      0,
                    ),
                  )}
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">
                  year {new Date().getFullYear()}
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="px-2 py-1 rounded bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-sm">
                  Investment
                </span>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                  Total Investment
                </p>
                <p className="text-gray-900 dark:text-gray-100 mb-1">
                  {fmtIDRCurrency(
                    investArr.reduce(
                      (sum, val) => sum + val,
                      0,
                    ),
                  )}
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">
                  year {new Date().getFullYear()}
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl ${incomeArr.reduce((sum, val) => sum + val, 0) - expenseArr.reduce((sum, val) => sum + val, 0) - investArr.reduce((sum, val) => sum + val, 0) >= 0 ? "bg-purple-500" : "bg-gray-500"} flex items-center justify-center text-white`}
                >
                  <DollarSign className="w-5 h-5" />
                </div>
                <span
                  className={`px-2 py-1 rounded text-sm ${incomeArr.reduce((sum, val) => sum + val, 0) - expenseArr.reduce((sum, val) => sum + val, 0) - investArr.reduce((sum, val) => sum + val, 0) >= 0 ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}
                >
                  Net
                </span>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                  Net Profit
                </p>
                <p
                  className={`mb-1 ${incomeArr.reduce((sum, val) => sum + val, 0) - expenseArr.reduce((sum, val) => sum + val, 0) - investArr.reduce((sum, val) => sum + val, 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {fmtIDRCurrency(
                    incomeArr.reduce(
                      (sum, val) => sum + val,
                      0,
                    ) -
                      expenseArr.reduce(
                        (sum, val) => sum + val,
                        0,
                      ) -
                      investArr.reduce(
                        (sum, val) => sum + val,
                        0,
                      ),
                  )}
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">
                  year {new Date().getFullYear()}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          defaultValue="overview"
          className="mb-6"
          onValueChange={setActiveTab}
        >
           {isDesktop && (
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="investment">
              Investment
            </TabsTrigger>
            <TabsTrigger value="analytic">Analytic</TabsTrigger>
            <TabsTrigger value="report">Report</TabsTrigger>
          </TabsList>
          )}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TransactionTable
                  ref={transactionTableRef}
                  transactions={transactions}
                  onDelete={handleDeleteTransaction}
                />
              </div>
              <div className="lg:col-span-1">
                <TopPerformance streamData={streamData} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="investment" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <InvestmentList
                  transactions={transactions}
                  onDelete={handleDeleteTransaction}
                />
              </div>
              <div className="lg:col-span-1">
                <InvestmentCrypto />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytic" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                
                
              <RevenueChart
                monthlyLabels={monthlyLabels}
                incomeArr={incomeArr}
                transactions={transactions}
                currentYear={new Date().getFullYear()}
              />
            
                {/* <NetProfitChart
                  netProfitData={netProfitArr}
                  monthlyLabels={monthlyLabels}
                  currentYear={new Date().getFullYear()}
                /> */}
                <ProductListManager />
              </div>

              <div className="lg:col-span-1">
                <ProductList
                  products={lineProducts}
                  pageSize={10}
                  transactions={transactions}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="report" className="mt-6">
            <Report
              transactions={transactions}
              projectName={projectName}
            />
          </TabsContent>
        </Tabs>

        {/* Bottom Navigation - Mobile Only */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40">
          <div className="relative max-w-screen-sm mx-auto">
            {/* FAB Add Transaction - Floating above menu */}
            <button
              onClick={() => setDialogOpen(true)}
              className="absolute left-1/2 -translate-x-1/2 -top-7 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
            >
              <Plus className="w-6 h-6" />
            </button>
            
            {/* Navigation Items */}
            <div className="grid grid-cols-4 px-2 py-3">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
                  activeTab === 'overview' 
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs font-medium">Overview</span>
              </button>
              
              <button
                onClick={() => setActiveTab('investment')}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
                  activeTab === 'investment' 
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="text-xs font-medium">Investment</span>
              </button>
              
              <button
                onClick={() => setActiveTab('analytic')}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
                  activeTab === 'analytic' 
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <PieChart className="w-5 h-5" />
                <span className="text-xs font-medium">Analytic</span>
              </button>
              
              <button
                onClick={() => setActiveTab('report')}
                className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
                  activeTab === 'report' 
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="text-xs font-medium">Report</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Transaction Dialog */}
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={(tx: any) => {
          mergeTransactionIntoState(tx);
          handleAddTransaction(tx);
        }}
      />

      {/* Settings Sheet */}
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        initialModal={modalM4}
        roiTarget={roiTarget}
        projectName={projectName}
        onModalChange={(value) => {
          setModalM4(value);
          localStorage.setItem("initialModal", String(value));
        }}
        onRoiTargetChange={(value) => {
          setRoiTarget(value);
          localStorage.setItem("roiTarget", String(value));
        }}
        onProjectNameChange={(value) => {
          console.log(
            "[APP] onProjectNameChange called with:",
            value,
          );
          setProjectName(value);
          localStorage.setItem("projectName", value);

          // try persist to server (silent)
          apiFetch("/api/user_settings", {
            method: "POST",
            body: JSON.stringify({
              projectName: String(value),
            }),
          })
            .then((res) => {
              if (res.ok) {
                toast.success("Project name updated!");
                addNotification({
                  type: "success",
                  title: "Settings Updated",
                  message: `Project name changed to "${value}"`,
                });
              }
            })
            .catch((e) => {
              console.debug(
                "[APP] saveProjectNameToServer failed",
                e,
              );
            });
        }}
      />

      {/* Notification Panel */}
      <NotificationPanel
        open={notificationPanelOpen}
        onOpenChange={setNotificationPanelOpen}
      />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}