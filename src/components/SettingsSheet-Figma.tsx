import { useState, useEffect, useMemo } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  DollarSign,
  Moon,
  Sun,
  Save,
  RotateCcw,
  Palette,
  Globe,
  Bell,
  Shield,
  Database,
  Settings as SettingsIcon,
  X,
  TrendingUp,
  Laptop,
  User,
  Crown,
  LogOut,
  Trash2,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
  Zap,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useFeatureLock, type UserRole } from "../contexts/FeatureLockContext";
import { toast } from "sonner";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { CapitalItemsDialog, type CapitalItem } from "./CapitalItemsDialog";

type ThemeMode = "auto" | "light" | "dark";
type SettingsTab = "finance" | "appearance" | "system";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capitalItems?: CapitalItem[];
  onCapitalItemsChange?: (items: CapitalItem[]) => void;
  initialModal: number;
  onModalChange: (value: number) => void;
  roiTarget?: number;
  onRoiTargetChange?: (value: number) => void;
  projectName?: string;
  onProjectNameChange?: (value: string) => void;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  onNavigateToPricing?: () => void;
  defaultTab?: SettingsTab; // Add prop to set initial tab
  periode?: number; // Depreciation period in months
  onPeriodeChange?: (value: number) => void;
  residu?: number; // Residual value
  onResiduChange?: (value: number) => void;
}

export function SettingsSheet({
  open,
  onOpenChange,
  capitalItems = [],
  onCapitalItemsChange,
  initialModal,
  onModalChange,
  roiTarget = 200,
  onRoiTargetChange,
  projectName = "M4 Tracking",
  onProjectNameChange,
  userName,
  userEmail,
  onLogout,
  onNavigateToPricing,
  defaultTab = "finance", // Default to finance tab
  periode = 12,
  onPeriodeChange,
  residu = 5000000,
  onResiduChange,
}: SettingsSheetProps) {
  const {
    t,
    language: currentLanguage,
    setLanguage: setGlobalLanguage,
  } = useLanguage();

  const {
    currency: globalCurrency,
    setCurrency: setGlobalCurrency,
    exchangeRates: globalRates,
    setExchangeRates: setGlobalRates,
  } = useCurrency();

  const { addNotification } = useNotifications();
  const { userRole, isMaster } = useFeatureLock();
  const [projectNameInput, setProjectNameInput] =
    useState<string>(projectName);
  const [modalInput, setModalInput] = useState<string>(
    String(initialModal),
  );
  const [roiInput, setRoiInput] = useState<string>(
    String(roiTarget),
  );
  const [periodeInput, setPeriodeInput] = useState<string>(
    String(periode),
  );
  const [residuInput, setResiduInput] = useState<string>(
    String(residu),
  );
  const [themeMode, setThemeMode] = useState<ThemeMode>("auto");
  const [loadingRates, setLoadingRates] =
    useState<boolean>(false);
  const [ratesError, setRatesError] = useState<string | null>(
    null,
  );
  const [localLanguage, setLocalLanguage] =
    useState<string>("id");
  const [notifications, setNotifications] =
    useState<boolean>(true);
  const [autoBackup, setAutoBackup] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [activeTab, setActiveTab] =
    useState<SettingsTab>(defaultTab);
  const [showEmail, setShowEmail] = useState<boolean>(false);
  
  // Confirmation dialogs state
  const [showEraseDialog, setShowEraseDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [showCapitalItemsDialog, setShowCapitalItemsDialog] = useState<boolean>(false);

  // Calculate total initial capital from capital items
  const initialCapital = useMemo(() => {
    if (capitalItems.length > 0) {
      return capitalItems.reduce((sum, item) => sum + item.amount, 0);
    }
    return initialModal; // Fallback to old single modal value
  }, [capitalItems, initialModal]);

  // Calculate depreciation value: Sum of all depreciable assets
  const depreciationValue = useMemo(() => {
    if (capitalItems.length > 0) {
      return capitalItems.reduce((sum, item) => {
        if (item.depreciable && item.periode && item.periode > 0) {
          return sum + (item.amount - (item.residu || 0)) / item.periode;
        }
        return sum;
      }, 0);
    }
    // Fallback to old single calculation
    const modal = Number(modalInput || 0);
    const residuVal = Number(residuInput || 0);
    const periodeVal = Number(periodeInput || 0);
    if (periodeVal > 0) {
      return (modal - residuVal) / periodeVal;
    }
    return 0;
  }, [capitalItems, modalInput, residuInput, periodeInput]);

  // Detect system preference
  const getSystemTheme = (): "light" | "dark" => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
    }
    return "light";
  };

  // Apply theme based on mode
  const applyTheme = (mode: ThemeMode) => {
    let shouldBeDark = false;

    if (mode === "auto") {
      shouldBeDark = getSystemTheme() === "dark";
    } else {
      shouldBeDark = mode === "dark";
    }

    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Fetch real-time exchange rates from API
  const fetchExchangeRates = async () => {
    setLoadingRates(true);
    setRatesError(null);

    try {
      // Using free exchangerate-api.com - fetch USD as base, then convert to IDR
      const response = await fetch(
        "https://api.exchangerate-api.com/v4/latest/USD",
      );

      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates");
      }

      const data = await response.json();

      // data.rates.IDR = how many IDR for 1 USD
      // Example: { USD: 1, IDR: 16668.25, EUR: 0.94, SGD: 1.34 }
      const usdToIdr = data.rates.IDR || 16668;
      const usdToEur = data.rates.EUR || 0.94;
      const usdToSgd = data.rates.SGD || 1.34;

      // Calculate: 1 EUR = (1/usdToEur) USD * usdToIdr IDR
      const rates = {
        IDR: 1,
        USD: Math.round(usdToIdr * 100) / 100, // 1 USD = X IDR (keep 2 decimals)
        EUR: Math.round((usdToIdr / usdToEur) * 100) / 100, // 1 EUR = X IDR
        SGD: Math.round((usdToIdr / usdToSgd) * 100) / 100, // 1 SGD = X IDR
      };

      // Update global context
      setGlobalRates(rates);
      localStorage.setItem(
        "exchangeRates",
        JSON.stringify(rates),
      );
      localStorage.setItem(
        "exchangeRatesTimestamp",
        String(Date.now()),
      );
      console.log(
        "[SettingsSheet] Exchange rates updated (real-time):",
        rates,
      );
      console.log(
        `[SettingsSheet] 1 USD = Rp ${rates.USD.toLocaleString("id-ID")}`,
      );
    } catch (error) {
      console.error(
        "[SettingsSheet] Failed to fetch exchange rates:",
        error,
      );
      setRatesError(
        "Failed to load live rates. Using fallback.",
      );

      // Try to load from localStorage cache
      const cached = localStorage.getItem("exchangeRates");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setGlobalRates(parsed);
          console.log(
            "[SettingsSheet] Using cached rates:",
            parsed,
          );
        } catch (e) {
          console.warn(
            "[SettingsSheet] Failed to parse cached rates, using defaults",
          );
        }
      }
    } finally {
      setLoadingRates(false);
    }
  };

  // Load settings on mount and when sheet opens
  useEffect(() => {
    if (open) {
      const savedThemeMode = (localStorage.getItem(
        "themeMode",
      ) || "auto") as ThemeMode;
      const savedCurrency =
        localStorage.getItem("currency") || "IDR";
      const savedNotifications =
        localStorage.getItem("notifications") !== "false";
      const savedAutoBackup =
        localStorage.getItem("autoBackup") === "true";

      setThemeMode(savedThemeMode);
      setLocalLanguage(currentLanguage);
      setNotifications(savedNotifications);
      setAutoBackup(savedAutoBackup);
      setProjectNameInput(projectName);
      setModalInput(String(initialModal));
      setRoiInput(String(roiTarget));
      setPeriodeInput(String(periode));
      setResiduInput(String(residu));

      // Fetch exchange rates
      fetchExchangeRates();
      setActiveTab(defaultTab); // Set active tab based on defaultTab prop
      setHasChanges(false);
    }
  }, [
    open,
    initialModal,
    roiTarget,
    currentLanguage,
    projectName,
    defaultTab, // Add defaultTab to dependencies
    periode,
    residu,
  ]);

  // Listen to system theme changes when in auto mode
  useEffect(() => {
    if (themeMode !== "auto") return;

    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)",
    );
    const handleChange = () => {
      applyTheme("auto");
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () =>
        mediaQuery.removeEventListener("change", handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [themeMode]);

  const handleThemeModeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    setHasChanges(true);
    applyTheme(mode);
    localStorage.setItem("themeMode", mode);
  };

  const handleSaveProjectName = async () => {
    if (projectNameInput.trim()) {
      onProjectNameChange?.(projectNameInput.trim());
      localStorage.setItem(
        "projectName",
        projectNameInput.trim(),
      );
      setHasChanges(false);

      // optional server save (if not handled by parent)
      try {
        await fetch("/api/user_settings", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectName: projectNameInput.trim(),
          }),
        });
      } catch (e) {
        console.warn("Failed saving projectName to server", e);
      }
    }
  };

  const handleResetProjectName = () => {
    const defaultName = "M4 Tracking";
    setProjectNameInput(defaultName);
    onProjectNameChange?.(defaultName);
    localStorage.setItem("projectName", defaultName);
    setHasChanges(false);
  };

  const handleSaveModal = () => {
    const parsed = Number(modalInput || 0);
    if (!isNaN(parsed) && parsed > 0) {
      onModalChange(parsed); // This will trigger parent callback and save to localStorage
      localStorage.setItem("initialModal", String(parsed));
      setHasChanges(false);
      toast.success("Initial modal updated!");
      addNotification({
        type: "success",
        title: "Settings Updated",
        message: `Initial modal changed to ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(parsed)}`,
      });
    }
  };

  const handleResetModal = () => {
    const defaultModal = 25000000;
    setModalInput(String(defaultModal));
    onModalChange(defaultModal); // This will trigger parent callback
    localStorage.setItem("initialModal", String(defaultModal));
    setHasChanges(false);
  };

  const handleSaveRoiTarget = () => {
    const parsed = Number(roiInput || 0);
    if (!isNaN(parsed) && parsed > 0) {
      onRoiTargetChange?.(parsed); // This will trigger parent callback and save to localStorage
      localStorage.setItem("roiTarget", String(parsed));
      setHasChanges(false);
      toast.success("ROI target updated!");
      addNotification({
        type: "success",
        title: "Settings Updated",
        message: `ROI target changed to ${parsed}%`,
      });
    }
  };

  const handleResetRoiTarget = () => {
    const defaultRoiTarget = 200;
    setRoiInput(String(defaultRoiTarget));
    onRoiTargetChange?.(defaultRoiTarget); // This will trigger parent callback
    localStorage.setItem("roiTarget", String(defaultRoiTarget));
    setHasChanges(false);
  };

  const handleSaveSettings = () => {
    // Currency is already managed by CurrencyContext and saved to localStorage
    // when changed, so no need to save it here again
    
    if (localLanguage !== currentLanguage) {
      setGlobalLanguage(localLanguage as "id" | "en");
      addNotification({
        type: "info",
        title: "Language Changed",
        message: `Language changed to ${localLanguage === "id" ? "Indonesian" : "English"}`,
      });
    }
    localStorage.setItem(
      "notifications",
      String(notifications),
    );
    localStorage.setItem("autoBackup", String(autoBackup));
    setHasChanges(false);
  };

  const handleLanguageChange = (lang: string) => {
    setLocalLanguage(lang);
    setGlobalLanguage(lang as "id" | "en"); // Apply immediately for instant preview
    setHasChanges(true);
  };

  const handleSaveAll = () => {
    // Save project name (if changed)
    if (projectNameInput.trim()) {
      onProjectNameChange?.(projectNameInput.trim());
      localStorage.setItem(
        "projectName",
        projectNameInput.trim(),
      );
    }

    // Save modal first (if changed)
    const parsed = Number(modalInput || 0);
    if (!isNaN(parsed) && parsed > 0) {
      onModalChange(parsed);
      localStorage.setItem("initialModal", String(parsed));
    }

    // Save ROI target (if changed)
    const roiParsed = Number(roiInput || 0);
    if (!isNaN(roiParsed) && roiParsed > 0) {
      onRoiTargetChange?.(roiParsed);
      localStorage.setItem("roiTarget", String(roiParsed));
    }

    // Save periode (if changed)
    const periodeParsed = Number(periodeInput || 0);
    if (!isNaN(periodeParsed) && periodeParsed > 0) {
      onPeriodeChange?.(periodeParsed);
      localStorage.setItem("periode", String(periodeParsed));
    }

    // Save residu (if changed)
    const residuParsed = Number(residuInput || 0);
    if (!isNaN(residuParsed) && residuParsed >= 0) {
      onResiduChange?.(residuParsed);
      localStorage.setItem("residu", String(residuParsed));
    }

    // Save other settings
    handleSaveSettings();

    toast.success("All settings saved!");
    addNotification({
      type: "success",
      title: "Settings Saved",
      message: "All your settings have been saved successfully",
    });

    // Close sheet
    onOpenChange(false);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      onLogout?.();
      toast.success("Logged out successfully");
      addNotification({
        type: "info",
        title: "Logged Out",
        message: "You have been logged out successfully",
      });
    }
  };

  const handleEraseData = () => {
    // Clear all localStorage data except theme and language
    const themeMode = localStorage.getItem("themeMode");
    const language = localStorage.getItem("language");
    localStorage.clear();
    if (themeMode)
      localStorage.setItem("themeMode", themeMode);
    if (language) localStorage.setItem("language", language);

    toast.success("All data has been erased");
    addNotification({
      type: "warning",
      title: "Data Erased",
      message:
        "All your transactions and data have been permanently deleted",
    });

    // Reload page to reset state
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleDeleteAccount = () => {
    toast.error("Account deletion requested");
    addNotification({
      type: "error",
      title: "Account Deletion",
      message:
        "Your account deletion request has been submitted",
    });

    // In real app, call API to delete account
    setTimeout(() => {
      onLogout?.();
    }, 2000);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
        onClick={() => onOpenChange(false)}
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      {/* Settings Sheet - Fixed Right */}
      <div
        className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white dark:bg-gray-900 shadow-xl z-50 overflow-hidden transition-transform duration-300"
        style={{
          transform: open
            ? "translateX(0)"
            : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(to bottom right, #3b82f6, #9333ea)",
                  }}
                >
                  <SettingsIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-gray-900 dark:text-white">
                    {t.settings.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t.settings.subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 pb-4">
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("finance")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all duration-200 ${
                  activeTab === "finance"
                    ? "bg-white dark:bg-gray-700 shadow-sm"
                    : "hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <DollarSign
                  className={`w-4 h-4 ${
                    activeTab === "finance"
                      ? "text-blue-500"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                />
                <span
                  className={`text-sm ${
                    activeTab === "finance"
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Finance
                </span>
              </button>
              <button
                onClick={() => setActiveTab("appearance")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all duration-200 ${
                  activeTab === "appearance"
                    ? "bg-white dark:bg-gray-700 shadow-sm"
                    : "hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <Palette
                  className={`w-4 h-4 ${
                    activeTab === "appearance"
                      ? "text-blue-500"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                />
                <span
                  className={`text-sm ${
                    activeTab === "appearance"
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Appearance
                </span>
              </button>
              <button
                onClick={() => setActiveTab("system")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all duration-200 ${
                  activeTab === "system"
                    ? "bg-white dark:bg-gray-700 shadow-sm"
                    : "hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <Shield
                  className={`w-4 h-4 ${
                    activeTab === "system"
                      ? "text-blue-500"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                />
                <span
                  className={`text-sm ${
                    activeTab === "system"
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  System
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto h-[calc(100%-240px)] p-6 space-y-4">
          {/* Finance Tab */}
          {activeTab === "finance" && (
            <>
              {/* Financial Settings */}
              <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-gray-900 dark:text-white">
                    {t.settings.financial}
                  </h3>
                </div>

                <div className="space-y-6">
                  {/* Project Name */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Project Name
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={projectNameInput}
                        onChange={(e) => {
                          setProjectNameInput(e.target.value);
                          setHasChanges(true);
                        }}
                        className="flex-1"
                        placeholder="M4 Tracking"
                      />
                      <Button
                        onClick={handleSaveProjectName}
                        disabled={
                          !hasChanges ||
                          !projectNameInput.trim()
                        }
                        style={{
                          background:
                            hasChanges &&
                            projectNameInput.trim()
                              ? "linear-gradient(to right, #3b82f6, #9333ea)"
                              : "#e5e7eb",
                          color:
                            hasChanges &&
                            projectNameInput.trim()
                              ? "white"
                              : "#9ca3af",
                          padding: "0.5rem 1rem",
                          minWidth: "80px",
                          border: "none",
                        }}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleResetProjectName}
                        style={{
                          padding: "0.5rem",
                          minWidth: "40px",
                        }}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      This name will appear in the header and
                      PDF exports
                    </p>
                  </div>

                  {/* Initial Capital */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {t.settings.initialCapital}
                    </label>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowCapitalItemsDialog(true)}
                        variant="outline"
                        className="flex-1 justify-between"
                        style={{
                          padding: "0.5rem 1rem",
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <span className="text-sm">
                          Rp {initialCapital.toLocaleString("id-ID")}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {capitalItems.length} item(s) • Click to manage capital items
                    </p>
                  </div>

                  {/* ROI Target */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {t.settings.roiTarget}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={roiInput}
                        onChange={(e) => {
                          setRoiInput(e.target.value);
                          setHasChanges(true);
                        }}
                        className="flex-1"
                        placeholder="200"
                      />
                      <Button
                        onClick={handleSaveRoiTarget}
                        disabled={!hasChanges}
                        style={{
                          background: hasChanges
                            ? "linear-gradient(to right, #3b82f6, #9333ea)"
                            : "#e5e7eb",
                          color: hasChanges
                            ? "white"
                            : "#9ca3af",
                          padding: "0.5rem 1rem",
                          minWidth: "80px",
                          border: "none",
                        }}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {t.settings.save}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleResetRoiTarget}
                        style={{
                          padding: "0.5rem",
                          minWidth: "40px",
                        }}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {t.settings.current}:{" "}
                      {Number(roiInput || 0)}%
                    </p>
                  </div>

                  {/* Periode (Depreciation Period) */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Periode (Bulan)
                    </label>
                    <Input
                      type="number"
                      value={periodeInput}
                      onChange={(e) => {
                        setPeriodeInput(e.target.value);
                        setHasChanges(true);
                      }}
                      className="w-full"
                      placeholder="12"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Periode depresiasi dalam bulan (e.g. 12 bulan)
                    </p>
                  </div>

                  {/* Residu (Residual Value) */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Residu
                    </label>
                    <Input
                      type="number"
                      value={residuInput}
                      onChange={(e) => {
                        setResiduInput(e.target.value);
                        setHasChanges(true);
                      }}
                      className="w-full"
                      placeholder="5000000"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {t.settings.current}: Rp{" "}
                      {Number(residuInput || 0).toLocaleString("id-ID")}
                    </p>
                  </div>

                  {/* Nilai Depresiasi (Calculated) */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Nilai Depresiasi
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-300">
                      Rp {depreciationValue.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Otomatis dihitung: (Initial Modal - Residu) / Periode = Rp{" "}
                      {depreciationValue.toLocaleString("id-ID", { maximumFractionDigits: 0 })}/bulan
                    </p>
                  </div>

                  {/* Currency */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm text-gray-600 dark:text-gray-400">
                        {t.settings.currency}
                      </label>
                      {loadingRates && (
                        <span className="text-xs text-blue-500">
                          Updating rates...
                        </span>
                      )}
                      {ratesError && (
                        <span className="text-xs text-yellow-500">
                          Using cached rates
                        </span>
                      )}
                    </div>
                    <select
                      value={globalCurrency}
                      onChange={(e) => {
                        setGlobalCurrency(e.target.value);
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="IDR">
                        {t.currencyOptions.idr} (Rp)
                      </option>
                      <option value="USD">
                        {t.currencyOptions.usd} ($ - 1 USD = Rp{" "}
                        {globalRates.USD.toLocaleString(
                          "id-ID",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                        )
                      </option>
                      <option value="EUR">
                        {t.currencyOptions.eur} (€ - 1 EUR = Rp{" "}
                        {globalRates.EUR.toLocaleString(
                          "id-ID",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                        )
                      </option>
                      <option value="SGD">
                        {t.currencyOptions.sgd} (S$ - 1 SGD = Rp{" "}
                        {globalRates.SGD.toLocaleString(
                          "id-ID",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                        )
                      </option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Exchange rates are updated when you open settings
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <>
              {/* Appearance Settings */}
              <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-gray-900 dark:text-white">
                    {t.settings.appearance}
                  </h3>
                </div>

                <div className="space-y-6">
                  {/* Theme Mode Selector */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {t.settings.themeMode}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {/* Auto Option */}
                      <button
                        onClick={() =>
                          handleThemeModeChange("auto")
                        }
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                          themeMode === "auto"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <Laptop
                          className={`w-6 h-6 ${
                            themeMode === "auto"
                              ? "text-blue-500"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        />
                        <div className="text-center">
                          <p
                            className={`text-sm ${
                              themeMode === "auto"
                                ? "text-blue-900 dark:text-blue-300"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {t.settings.auto}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {t.settings.system}
                          </p>
                        </div>
                        {themeMode === "auto" && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
                        )}
                      </button>

                      {/* Light Option */}
                      <button
                        onClick={() =>
                          handleThemeModeChange("light")
                        }
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                          themeMode === "light"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <Sun
                          className={`w-6 h-6 ${
                            themeMode === "light"
                              ? "text-blue-500"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        />
                        <div className="text-center">
                          <p
                            className={`text-sm ${
                              themeMode === "light"
                                ? "text-blue-900 dark:text-blue-300"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {t.settings.light}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {t.settings.bright}
                          </p>
                        </div>
                        {themeMode === "light" && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
                        )}
                      </button>

                      {/* Dark Option */}
                      <button
                        onClick={() =>
                          handleThemeModeChange("dark")
                        }
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                          themeMode === "dark"
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <Moon
                          className={`w-6 h-6 ${
                            themeMode === "dark"
                              ? "text-blue-500"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        />
                        <div className="text-center">
                          <p
                            className={`text-sm ${
                              themeMode === "dark"
                                ? "text-blue-900 dark:text-blue-300"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {t.settings.dark}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {t.settings.dim}
                          </p>
                        </div>
                        {themeMode === "dark" && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                      {themeMode === "auto" &&
                        `${t.settings.autoModeDesc} (${t.settings[getSystemTheme() === "light" ? "currentlyLight" : "currentlyDark"]})`}
                      {themeMode === "light" &&
                        t.settings.lightModeDesc}
                      {themeMode === "dark" &&
                        t.settings.darkModeDesc}
                    </p>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {t.settings.language}
                    </label>
                    <select
                      value={localLanguage}
                      onChange={(e) => {
                        handleLanguageChange(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="id">
                        {t.languageOptions.id}
                      </option>
                      <option value="en">
                        {t.languageOptions.en}
                      </option>
                    </select>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* System Tab */}
          {activeTab === "system" && (
            <>
              {/* Account Information */}
              <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-gray-900 dark:text-white">
                    Account Information
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* User Avatar and Name */}
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl"
                      style={{
                        background:
                          "linear-gradient(to bottom right, #3b82f6, #9333ea)",
                      }}
                    >
                      {userName
                        ? userName.charAt(0).toUpperCase()
                        : "U"}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {userName || "User Name"}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {showEmail
                            ? userEmail || "user@example.com"
                            : "••••••••••••••"}
                        </p>
                        <button
                          onClick={() => setShowEmail(!showEmail)}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title={
                            showEmail ? "Hide email" : "Show email"
                          }
                        >
                          {showEmail ? (
                            <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Plan Badge */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="text-sm text-gray-500 dark:text-gray-400 block mb-2">
                      Current Plan
                    </label>
                    {isMaster ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                        <Crown className="w-3 h-3" />
                        <span>MASTER</span>
                      </div>
                    ) : userRole === "pro" ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                        <Crown className="w-3 h-3" />
                        <span>Pro</span>
                      </div>
                    ) : userRole === "premium" ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                        <Crown className="w-3 h-3" />
                        <span>Pro</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        <User className="w-3 h-3" />
                        <span>FREE</span>
                      </div>
                    )}
                  </div>

                  {/* Upgrade Button - Only show if not Pro/Premium and not Master */}
                  {!isMaster && userRole !== "pro" && userRole !== "premium" && (
                    <button
                      onClick={() => {
                        if (onNavigateToPricing) {
                          onNavigateToPricing();
                        }
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 border-blue-500 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            Upgrade to Pro
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Unlock all premium features
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-blue-500 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                  {/* Master Badge Info */}
                  {isMaster && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-xs text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        <span>You have master access with unlimited features</span>
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* System Settings */}
              <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-gray-900 dark:text-white">
                    {t.settings.system}
                  </h3>
                </div>

                <div className="space-y-6">
                  {/* Notifications */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {t.settings.notifications}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t.settings.notificationsDesc}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setNotifications(!notifications);
                        setHasChanges(true);
                      }}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      style={{
                        backgroundColor: notifications
                          ? "#3b82f6"
                          : "#e5e7eb",
                      }}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Auto Backup */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Database className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {t.settings.autoBackup}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t.settings.autoBackupDesc}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setAutoBackup(!autoBackup);
                        setHasChanges(true);
                      }}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      style={{
                        backgroundColor: autoBackup
                          ? "#3b82f6"
                          : "#e5e7eb",
                      }}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoBackup
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </Card>

              {/* Dangerous Actions */}
              <Card className="p-6 bg-white dark:bg-gray-800 border-red-200 dark:border-red-900/50">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="text-red-900 dark:text-red-400">
                    Dangerous Zone
                  </h3>
                </div>

                <div className="space-y-3">
                  {/* Log Out */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div className="text-left">
                        <p className="text-sm text-gray-900 dark:text-white">
                          Log Out
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Sign out from your account
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Erase Data */}
                  <button
                    onClick={() => setShowEraseDialog(true)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-orange-200 dark:border-orange-900/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 className="w-5 h-5 text-orange-500" />
                      <div className="text-left">
                        <p className="text-sm text-orange-900 dark:text-orange-400">
                          Erase All Data
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-500">
                          Delete all transactions and settings
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Delete Account */}
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <div className="text-left">
                        <p className="text-sm text-red-900 dark:text-red-400">
                          Delete Account
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-500">
                          Permanently delete your account
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </Card>

              {/* Version Info */}
              <Card className="p-4 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Version Information
                    </p>
                  </div>
                  <p className="text-xs text-gray-900 dark:text-white">
                    v1.0.0
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    BUKABOX M4 ROI Tracker © 2025
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Last updated: December 11, 2025
                  </p>
                </div>
              </Card>

              {/* Info Banner */}
              <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  <strong>{t.settings.tipTitle}:</strong>{" "}
                  {t.settings.tipMessage}
                </p>
              </Card>
            </>
          )}


        </div>

        {/* Footer Actions - Sticky Bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex gap-3">
            <Button
              onClick={handleSaveAll}
              className="flex-1"
              style={{
                background:
                  "linear-gradient(to right, #3b82f6, #9333ea)",
                color: "white",
                padding: "0.625rem 1.5rem",
                borderRadius: "0.5rem",
                border: "none",
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Save All & Close
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              style={{
                padding: "0.625rem 1.5rem",
                borderRadius: "0.5rem",
                minWidth: "100px",
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={showEraseDialog}
        onOpenChange={setShowEraseDialog}
        onConfirm={handleEraseData}
        title="Erase All Data"
        description="This will permanently delete all your transactions, products, and settings. Your theme and language preferences will be preserved. This action cannot be undone!"
        variant="warning"
        icon={<Trash2 className="w-6 h-6 text-orange-500 dark:text-orange-400" />}
        confirmText="Erase All Data"
        cancelText="Cancel"
        checkboxLabel="Yes, I want to erase all my data permanently"
      />

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description="This will permanently delete your account and all associated data including transactions, products, and settings. You will be logged out and this action CANNOT be undone. Are you absolutely sure?"
        variant="danger"
        icon={<AlertTriangle className="w-6 h-6 text-red-500 dark:text-red-400" />}
        confirmText="Delete Account"
        cancelText="Cancel"
        checkboxLabel="I understand this will permanently delete my account"
      />

      {/* Capital Items Dialog */}
      <CapitalItemsDialog
        open={showCapitalItemsDialog}
        onOpenChange={setShowCapitalItemsDialog}
        capitalItems={capitalItems}
        onCapitalItemsChange={(items) => {
          if (onCapitalItemsChange) {
            onCapitalItemsChange(items);
          }
        }}
      />
    </>
  );
}

export default SettingsSheet;