import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useNotifications } from "../contexts/NotificationContext";
import { toast } from "sonner@2.0.3";

type ThemeMode = "auto" | "light" | "dark";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialModal: number;
  onModalChange: (value: number) => void;
  roiTarget?: number;
  onRoiTargetChange?: (value: number) => void;
  projectName?: string;
  onProjectNameChange?: (value: string) => void;
}

export function SettingsSheet({
  open,
  onOpenChange,
  initialModal,
  onModalChange,
  roiTarget = 200,
  onRoiTargetChange,
  projectName = "M4 Tracking",
  onProjectNameChange,
}: SettingsSheetProps) {
  const {
    t,
    language: currentLanguage,
    setLanguage: setGlobalLanguage,
  } = useLanguage();
  const { addNotification } = useNotifications();
  const [projectNameInput, setProjectNameInput] =
    useState<string>(projectName);
  const [modalInput, setModalInput] = useState<string>(
    String(initialModal),
  );
  const [roiInput, setRoiInput] = useState<string>(
    String(roiTarget),
  );
  const [themeMode, setThemeMode] = useState<ThemeMode>("auto");
  const [currency, setCurrency] = useState<string>("IDR");
  const [localLanguage, setLocalLanguage] =
    useState<string>("id");
  const [notifications, setNotifications] =
    useState<boolean>(true);
  const [autoBackup, setAutoBackup] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

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
      setCurrency(savedCurrency);
      setLocalLanguage(currentLanguage);
      setNotifications(savedNotifications);
      setAutoBackup(savedAutoBackup);
      setProjectNameInput(projectName);
      setModalInput(String(initialModal));
      setRoiInput(String(roiTarget));
      setHasChanges(false);
    }
  }, [
    open,
    initialModal,
    roiTarget,
    currentLanguage,
    projectName,
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
        type: 'success',
        title: 'Settings Updated',
        message: `Initial modal changed to ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(parsed)}`,
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
        type: 'success',
        title: 'Settings Updated',
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
    localStorage.setItem("currency", currency);
    if (localLanguage !== currentLanguage) {
      setGlobalLanguage(localLanguage as "id" | "en");
      addNotification({
        type: 'info',
        title: 'Language Changed',
        message: `Language changed to ${localLanguage === 'id' ? 'Indonesian' : 'English'}`,
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

    // Save other settings
    handleSaveSettings();

    toast.success("All settings saved!");
    addNotification({
      type: 'success',
      title: 'Settings Saved',
      message: 'All your settings have been saved successfully',
    });

    // Close sheet
    onOpenChange(false);
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
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
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

        {/* Scrollable Content */}
        <div className="overflow-y-auto h-[calc(100%-180px)] p-6 space-y-4">
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
                      !hasChanges || !projectNameInput.trim()
                    }
                    style={{
                      background:
                        hasChanges && projectNameInput.trim()
                          ? "linear-gradient(to right, #3b82f6, #9333ea)"
                          : "#e5e7eb",
                      color:
                        hasChanges && projectNameInput.trim()
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
                  This name will appear in the header and PDF
                  exports
                </p>
              </div>

              {/* Initial Modal */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {t.settings.initialCapital}
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={modalInput}
                    onChange={(e) => {
                      setModalInput(e.target.value);
                      setHasChanges(true);
                    }}
                    className="flex-1"
                    placeholder="25000000"
                  />
                  <Button
                    onClick={handleSaveModal}
                    disabled={!hasChanges}
                    style={{
                      background: hasChanges
                        ? "linear-gradient(to right, #3b82f6, #9333ea)"
                        : "#e5e7eb",
                      color: hasChanges ? "white" : "#9ca3af",
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
                    onClick={handleResetModal}
                    style={{
                      padding: "0.5rem",
                      minWidth: "40px",
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {t.settings.current}: Rp{" "}
                  {Number(modalInput || 0).toLocaleString(
                    "id-ID",
                  )}
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
                      color: hasChanges ? "white" : "#9ca3af",
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
                  {t.settings.current}: {Number(roiInput || 0)}%
                </p>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {t.settings.currency}
                </label>
                <select
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="IDR">
                    {t.currencyOptions.idr}
                  </option>
                  <option value="USD">
                    {t.currencyOptions.usd}
                  </option>
                  <option value="EUR">
                    {t.currencyOptions.eur}
                  </option>
                  <option value="SGD">
                    {t.currencyOptions.sgd}
                  </option>
                </select>
              </div>
            </div>
          </Card>

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

          {/* Info Banner */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <strong>{t.settings.tipTitle}:</strong>{" "}
              {t.settings.tipMessage}
            </p>
          </Card>
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
    </>
  );
}

export default SettingsSheet;