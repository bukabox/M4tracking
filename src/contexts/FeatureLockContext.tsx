import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuthOptional } from "./AuthContext";
import { apiFetch } from "../lib/api";

// Role types
export type UserRole = "free" | "premium" | "pro";

// Feature definitions with role requirements
export type FeatureName =
  | "export_pdf"
  | "csv_import"
  | "investment_tab"
  | "advanced_reports"
  | "custom_date_range"
  | "unlimited_transactions"
  | "advanced_charts"
  | "notification_system";

interface FeatureConfig {
  name: FeatureName;
  displayName: string;
  description: string;
  requiredRole: UserRole;
  icon?: string;
}

// Feature configuration
export const FEATURES: Record<FeatureName, FeatureConfig> = {
  export_pdf: {
    name: "export_pdf",
    displayName: "Export to PDF",
    description: "Download professional PDF reports",
    requiredRole: "premium",
    icon: "FileDown",
  },
  csv_import: {
    name: "csv_import",
    displayName: "CSV Import",
    description: "Import transactions from CSV files",
    requiredRole: "premium",
    icon: "Upload",
  },
  investment_tab: {
    name: "investment_tab",
    displayName: "Investment Tracking",
    description: "Track and analyze your investments",
    requiredRole: "premium",
    icon: "TrendingUp",
  },
  advanced_reports: {
    name: "advanced_reports",
    displayName: "Advanced Reports",
    description: "Detailed analytics and insights",
    requiredRole: "pro",
    icon: "BarChart3",
  },
  custom_date_range: {
    name: "custom_date_range",
    displayName: "Custom Date Range",
    description: "Filter data by any date range",
    requiredRole: "pro",
    icon: "Calendar",
  },
  unlimited_transactions: {
    name: "unlimited_transactions",
    displayName: "Unlimited Transactions",
    description: "No limits on transaction count",
    requiredRole: "free",
    icon: "Infinity",
  },
  advanced_charts: {
    name: "advanced_charts",
    displayName: "Advanced Charts",
    description: "Interactive charts and visualizations",
    requiredRole: "pro",
    icon: "PieChart",
  },
  notification_system: {
    name: "notification_system",
    displayName: "Smart Notifications",
    description: "Real-time alerts and reminders",
    requiredRole: "premium",
    icon: "Bell",
  },
};

interface FeatureLockContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  hasAccess: (feature: FeatureName) => boolean;
  getRequiredRole: (feature: FeatureName) => UserRole;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  pendingFeature: FeatureName | null;
  setPendingFeature: (feature: FeatureName | null) => void;
  upgradeRole: (newRole: UserRole) => Promise<void>;
  isMaster: boolean;
  setIsMaster: (value: boolean) => void;
}

const FeatureLockContext = createContext<FeatureLockContextType | undefined>(
  undefined
);

export function FeatureLockProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthOptional();
  const [userRole, setUserRole] = useState<UserRole>("free");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [pendingFeature, setPendingFeature] = useState<FeatureName | null>(null);
  const [isMaster, setIsMaster] = useState(false);

  // Initialize role and isMaster from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem("userRole");
    if (savedRole && (savedRole === "free" || savedRole === "premium" || savedRole === "pro")) {
      setUserRole(savedRole as UserRole);
    }
    
    const savedIsMaster = localStorage.getItem("isMaster");
    if (savedIsMaster === "true") {
      setIsMaster(true);
    }
  }, []);

  // Sync role and isMaster from user object (if auth is present)
  useEffect(() => {
    if (user) {
      // Check for role
      if ("role" in user) {
        const role = (user as any).role || "free";
        setUserRole(role);
        localStorage.setItem("userRole", role);
      }
      
      // Check for is_master
      if ("is_master" in user && (user as any).is_master === true) {
        setIsMaster(true);
        localStorage.setItem("isMaster", "true");
      } else {
        const savedIsMaster = localStorage.getItem("isMaster");
        if (savedIsMaster !== "true") {
          setIsMaster(false);
        }
      }
    }
  }, [user]);

  // Check if user has access to a feature
  const hasAccess = (feature: FeatureName): boolean => {
    // Master users bypass all restrictions
    if (isMaster) {
      return true;
    }
    
    const featureConfig = FEATURES[feature];
    if (!featureConfig) return true; // Unknown feature = allow by default

    const roleHierarchy: UserRole[] = ["free", "premium", "pro"];
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const requiredRoleIndex = roleHierarchy.indexOf(featureConfig.requiredRole);

    return userRoleIndex >= requiredRoleIndex;
  };

  // Get required role for a feature
  const getRequiredRole = (feature: FeatureName): UserRole => {
    return FEATURES[feature]?.requiredRole || "free";
  };

  // Upgrade user role (localStorage demo mode with optional backend sync)
  const upgradeRole = async (newRole: UserRole) => {
    try {
      // Try backend API first (if available)
      try {
        const resp = await apiFetch("/api/auth/upgrade-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
          credentials: "include",
        });

        if (resp.ok) {
          const data = await resp.json();
          if (data.user) {
            // Update localStorage
            localStorage.setItem("user", JSON.stringify(data.user));
            setUserRole(newRole);
            localStorage.setItem("userRole", newRole);
            console.log(`[FeatureLock] Role upgraded to ${newRole} via API`);
            return;
          }
        }
      } catch (apiError) {
        // Backend not available, fallback to localStorage mode
        console.log("[FeatureLock] Backend not available, using localStorage mode");
      }

      // Fallback: Demo mode with localStorage only
      setUserRole(newRole);
      localStorage.setItem("userRole", newRole);
      
      // Update user object in localStorage if it exists
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          userData.role = newRole;
          localStorage.setItem("user", JSON.stringify(userData));
        } catch (e) {
          console.error("[FeatureLock] Failed to parse user data:", e);
        }
      }
      
      console.log(`[FeatureLock] Role upgraded to ${newRole} (demo mode)`);
    } catch (e) {
      console.error("[FeatureLock] Upgrade failed:", e);
      // Don't throw - allow demo mode to work
      setUserRole(newRole);
      localStorage.setItem("userRole", newRole);
    }
  };

  return (
    <FeatureLockContext.Provider
      value={{
        userRole,
        setUserRole,
        hasAccess,
        getRequiredRole,
        showUpgradeModal,
        setShowUpgradeModal,
        pendingFeature,
        setPendingFeature,
        upgradeRole,
        isMaster,
        setIsMaster,
      }}
    >
      {children}
    </FeatureLockContext.Provider>
  );
}

export function useFeatureLock() {
  const context = useContext(FeatureLockContext);
  if (!context) {
    throw new Error("useFeatureLock must be used within FeatureLockProvider");
  }
  return context;
}