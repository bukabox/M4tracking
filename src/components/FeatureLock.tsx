import React from "react";
import { Lock, Crown, Zap } from "lucide-react";
import { useFeatureLock, type FeatureName } from "../contexts/FeatureLockContext";

interface FeatureLockProps {
  feature: FeatureName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLockIcon?: boolean;
  blurContent?: boolean;
}

export default function FeatureLock({
  feature,
  children,
  fallback,
  showLockIcon = true,
  blurContent = false,
}: FeatureLockProps) {
  const { hasAccess, setShowUpgradeModal, setPendingFeature, getRequiredRole } = useFeatureLock();
  
  const hasFeatureAccess = hasAccess(feature);
  const requiredRole = getRequiredRole(feature);

  const handleUpgradeClick = () => {
    setPendingFeature(feature);
    setShowUpgradeModal(true);
  };

  // If user has access, render children normally
  if (hasFeatureAccess) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default locked state with blur
  if (blurContent) {
    return (
      <div className="relative">
        {/* Blurred content */}
        <div className="blur-sm pointer-events-none select-none opacity-50">
          {children}
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900/10 to-slate-900/5 dark:from-slate-900/20 dark:to-slate-900/10 backdrop-blur-sm rounded-lg">
          <button
            onClick={handleUpgradeClick}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            {requiredRole === "pro" ? (
              <Crown className="w-5 h-5" />
            ) : (
              <Zap className="w-5 h-5" />
            )}
            <span>Upgrade to Pro</span>
          </button>
        </div>
      </div>
    );
  }

  // Default locked state without blur (disabled button style)
  return (
    <div className="relative opacity-50 cursor-not-allowed">
      <div className="pointer-events-none select-none">{children}</div>
      
      {showLockIcon && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Lock className="w-6 h-6 text-slate-400 dark:text-slate-500" />
        </div>
      )}
    </div>
  );
}

// Inline lock badge component
export function PremiumBadge({ role = "premium" }: { role?: "premium" | "pro" }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
    >
      <Crown className="w-3 h-3" />
      Pro
    </span>
  );
}