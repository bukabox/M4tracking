import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Check } from "lucide-react";
import { Button } from "./ui/button";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning";
  icon?: React.ReactNode;
  checkboxLabel?: string;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  icon,
  checkboxLabel = "I understand the consequences",
}: ConfirmationDialogProps) {
  const [isChecked, setIsChecked] = useState(false);

  const handleConfirm = () => {
    if (isChecked) {
      onConfirm();
      setIsChecked(false);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setIsChecked(false);
    onOpenChange(false);
  };

  const variantColors = {
    danger: {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      icon: "text-red-500 dark:text-red-400",
      button: "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800",
      checkboxBorder: "border-red-300 dark:border-red-700",
      checkboxBg: "bg-red-600 dark:bg-red-700",
      text: "text-red-900 dark:text-red-400",
    },
    warning: {
      bg: "bg-orange-50 dark:bg-orange-900/20",
      border: "border-orange-200 dark:border-orange-800",
      icon: "text-orange-500 dark:text-orange-400",
      button: "bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800",
      checkboxBorder: "border-orange-300 dark:border-orange-700",
      checkboxBg: "bg-orange-600 dark:bg-orange-700",
      text: "text-orange-900 dark:text-orange-400",
    },
  };

  const colors = variantColors[variant];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={handleCancel}
          />

          {/* Dialog */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                type: "spring",
                damping: 25,
                stiffness: 300,
                duration: 0.3
              }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Icon */}
              <div className={`px-6 py-5 ${colors.bg} border-b ${colors.border}`}>
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                    {icon || <AlertTriangle className={`w-6 h-6 ${colors.icon}`} />}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${colors.text}`}>
                      {title}
                    </h3>
                    <button
                      onClick={handleCancel}
                      className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-5">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                  {description}
                </p>

                {/* Checkbox Confirmation */}
                <motion.label
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 ${
                    isChecked
                      ? `${colors.border} ${colors.bg}`
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  } cursor-pointer transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600`}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => setIsChecked(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                        isChecked
                          ? `${colors.checkboxBorder} ${colors.checkboxBg}`
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      }`}
                    >
                      <AnimatePresence>
                        {isChecked && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <span className="text-sm text-gray-900 dark:text-white select-none">
                    {checkboxLabel}
                  </span>
                </motion.label>
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1"
                >
                  {cancelText}
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!isChecked}
                  className={`flex-1 text-white ${colors.button} disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
                  style={{
                    opacity: isChecked ? 1 : 0.5,
                    cursor: isChecked ? "pointer" : "not-allowed",
                  }}
                >
                  {confirmText}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
