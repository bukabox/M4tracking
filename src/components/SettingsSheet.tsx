import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
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
  TrendingUp
} from 'lucide-react';

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialModal: number;
  onModalChange: (value: number) => void;
  roiTarget?: number;
  onRoiTargetChange?: (value: number) => void;
}

export function SettingsSheet({ 
  open, 
  onOpenChange, 
  initialModal, 
  onModalChange,
  roiTarget = 200,
  onRoiTargetChange
}: SettingsSheetProps) {
  const [modalInput, setModalInput] = useState<string>(String(initialModal));
  const [roiInput, setRoiInput] = useState<string>(String(roiTarget));
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [currency, setCurrency] = useState<string>('IDR');
  const [language, setLanguage] = useState<string>('id');
  const [notifications, setNotifications] = useState<boolean>(true);
  const [autoBackup, setAutoBackup] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Load settings on mount and when sheet opens
  useEffect(() => {
    if (open) {
      const savedDarkMode = localStorage.getItem('darkMode') === 'true';
      const savedCurrency = localStorage.getItem('currency') || 'IDR';
      const savedLanguage = localStorage.getItem('language') || 'id';
      const savedNotifications = localStorage.getItem('notifications') !== 'false';
      const savedAutoBackup = localStorage.getItem('autoBackup') === 'true';
      
      setIsDarkMode(savedDarkMode);
      setCurrency(savedCurrency);
      setLanguage(savedLanguage);
      setNotifications(savedNotifications);
      setAutoBackup(savedAutoBackup);
      setModalInput(String(initialModal));
      setRoiInput(String(roiTarget));
      setHasChanges(false);
    }
  }, [open, initialModal, roiTarget]);

  const handleDarkModeToggle = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    setHasChanges(true);
    
    if (newValue) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('darkMode', String(newValue));
  };

  const handleSaveModal = () => {
    const parsed = Number(modalInput || 0);
    if (!isNaN(parsed) && parsed > 0) {
      onModalChange(parsed); // This will trigger parent callback and save to localStorage
      localStorage.setItem('initialModal', String(parsed));
      setHasChanges(false);
    }
  };

  const handleResetModal = () => {
    const defaultModal = 25000000;
    setModalInput(String(defaultModal));
    onModalChange(defaultModal); // This will trigger parent callback
    localStorage.setItem('initialModal', String(defaultModal));
    setHasChanges(false);
  };

  const handleSaveRoiTarget = () => {
    const parsed = Number(roiInput || 0);
    if (!isNaN(parsed) && parsed > 0) {
      onRoiTargetChange?.(parsed); // This will trigger parent callback and save to localStorage
      localStorage.setItem('roiTarget', String(parsed));
      setHasChanges(false);
    }
  };

  const handleResetRoiTarget = () => {
    const defaultRoiTarget = 200;
    setRoiInput(String(defaultRoiTarget));
    onRoiTargetChange?.(defaultRoiTarget); // This will trigger parent callback
    localStorage.setItem('roiTarget', String(defaultRoiTarget));
    setHasChanges(false);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('currency', currency);
    localStorage.setItem('language', language);
    localStorage.setItem('notifications', String(notifications));
    localStorage.setItem('autoBackup', String(autoBackup));
    setHasChanges(false);
  };

  const handleSaveAll = () => {
    // Save modal first (if changed)
    const parsed = Number(modalInput || 0);
    if (!isNaN(parsed) && parsed > 0) {
      onModalChange(parsed);
      localStorage.setItem('initialModal', String(parsed));
    }
    
    // Save ROI target (if changed)
    const roiParsed = Number(roiInput || 0);
    if (!isNaN(roiParsed) && roiParsed > 0) {
      onRoiTargetChange?.(roiParsed);
      localStorage.setItem('roiTarget', String(roiParsed));
    }
    
    // Save other settings
    handleSaveSettings();
    
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
          pointerEvents: open ? 'auto' : 'none'
        }}
      />

      {/* Settings Sheet - Fixed Right */}
      <div
        className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white dark:bg-gray-900 shadow-xl z-50 overflow-hidden transition-transform duration-300"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)'
                }}
              >
                <SettingsIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-gray-900 dark:text-white">Settings</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your app preferences</p>
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
              <h3 className="text-gray-900 dark:text-white">Financial Settings</h3>
            </div>

            <div className="space-y-6">
              {/* Initial Modal */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Initial Capital / Modal Awal
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
                      background: hasChanges ? 'linear-gradient(to right, #3b82f6, #9333ea)' : '#e5e7eb',
                      color: hasChanges ? 'white' : '#9ca3af',
                      padding: '0.5rem 1rem',
                      minWidth: '80px',
                      border: 'none'
                    }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleResetModal}
                    style={{
                      padding: '0.5rem',
                      minWidth: '40px'
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Current: Rp {Number(modalInput || 0).toLocaleString('id-ID')}
                </p>
              </div>

              {/* ROI Target */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                  ROI Target
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
                      background: hasChanges ? 'linear-gradient(to right, #3b82f6, #9333ea)' : '#e5e7eb',
                      color: hasChanges ? 'white' : '#9ca3af',
                      padding: '0.5rem 1rem',
                      minWidth: '80px',
                      border: 'none'
                    }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleResetRoiTarget}
                    style={{
                      padding: '0.5rem',
                      minWidth: '40px'
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Current: {Number(roiInput || 0)}%
                </p>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="IDR">IDR - Indonesian Rupiah</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="SGD">SGD - Singapore Dollar</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Appearance Settings */}
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-gray-900 dark:text-white">Appearance</h3>
            </div>

            <div className="space-y-6">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  {isDarkMode ? (
                    <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">Dark Mode</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isDarkMode ? 'Dark theme enabled' : 'Light theme enabled'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDarkModeToggle}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  style={{
                    backgroundColor: isDarkMode ? '#3b82f6' : '#e5e7eb'
                  }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDarkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </Card>

          {/* System Settings */}
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-gray-900 dark:text-white">System & Privacy</h3>
            </div>

            <div className="space-y-6">
              {/* Notifications */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">Notifications</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Receive transaction alerts
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
                    backgroundColor: notifications ? '#3b82f6' : '#e5e7eb'
                  }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Auto Backup */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">Auto Backup</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Backup data to localStorage
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
                    backgroundColor: autoBackup ? '#3b82f6' : '#e5e7eb'
                  }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoBackup ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>

          {/* Info Banner */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              <strong>💡 Tip:</strong> All settings are saved to your browser's localStorage. 
              Your data is stored locally and never sent to any server.
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
                background: 'linear-gradient(to right, #3b82f6, #9333ea)',
                color: 'white',
                padding: '0.625rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none'
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Save All & Close
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              style={{
                padding: '0.625rem 1.5rem',
                borderRadius: '0.5rem',
                minWidth: '100px'
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