import React from "react";
import {
  X,
  Check,
  Crown,
  Zap,
  Sparkles,
  FileDown,
  Upload,
  TrendingUp,
  BarChart3,
  Calendar,
  Infinity,
  PieChart,
  Bell,
} from "lucide-react";
import { useFeatureLock, FEATURES, type FeatureName, type UserRole } from "../contexts/FeatureLockContext";
import { motion, AnimatePresence } from "framer-motion";

const iconMap: Record<string, any> = {
  FileDown,
  Upload,
  TrendingUp,
  BarChart3,
  Calendar,
  Infinity,
  PieChart,
  Bell,
};

interface PricingTier {
  role: UserRole;
  name: string;
  price: string;
  description: string;
  icon: React.ReactNode;
  features: FeatureName[];
  popular?: boolean;
  color: string;
  bgGradient: string;
}

const PRICING_TIERS: PricingTier[] = [
  {
    role: "free",
    name: "Free",
    price: "Rp 0",
    description: "Perfect for getting started",
    icon: <Sparkles className="w-6 h-6" />,
    features: [],
    color: "text-slate-600",
    bgGradient: "from-slate-100 to-slate-200",
  },
  {
    role: "premium",
    name: "Premium",
    price: "Rp 99K",
    description: "For serious tracking",
    icon: <Zap className="w-6 h-6" />,
    features: [
      "export_pdf",
      "csv_import",
      "investment_tab",
      "unlimited_transactions",
      "notification_system",
    ],
    popular: true,
    color: "text-blue-600",
    bgGradient: "from-blue-500 to-indigo-600",
  },
  {
    role: "pro",
    name: "Pro",
    price: "Rp 199K",
    description: "Advanced analytics & insights",
    icon: <Crown className="w-6 h-6" />,
    features: [
      "export_pdf",
      "csv_import",
      "investment_tab",
      "unlimited_transactions",
      "notification_system",
      "advanced_reports",
      "custom_date_range",
      "advanced_charts",
    ],
    color: "text-purple-600",
    bgGradient: "from-purple-500 to-pink-600",
  },
];

export default function PremiumModal() {
  const {
    showUpgradeModal,
    setShowUpgradeModal,
    pendingFeature,
    userRole,
    upgradeRole,
  } = useFeatureLock();

  const [isUpgrading, setIsUpgrading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleUpgrade = async (targetRole: UserRole) => {
    if (targetRole === "free" || targetRole === userRole) return;

    try {
      setIsUpgrading(true);
      setError(null);
      
      // In production, this would integrate with payment gateway
      // For now, directly upgrade (mock payment)
      await upgradeRole(targetRole);
      
      // Close modal and reload
      setShowUpgradeModal(false);
      window.location.reload();
    } catch (e: any) {
      setError(e.message || "Upgrade failed. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const getFeatureIcon = (featureName: FeatureName) => {
    const iconName = FEATURES[featureName]?.icon;
    if (!iconName) return null;
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
  };

  return (
    <AnimatePresence>
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-[#1a1f28] rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-[#1a1f28] border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl text-slate-900 dark:text-white flex items-center gap-2">
                  <Crown className="w-7 h-7 text-yellow-500" />
                  Upgrade Your Plan
                </h2>
                {pendingFeature && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Unlock <span className="font-semibold">{FEATURES[pendingFeature]?.displayName}</span> and more premium features
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Pricing Cards */}
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                {PRICING_TIERS.map((tier) => {
                  const isCurrentPlan = tier.role === userRole;
                  const isDowngrade = PRICING_TIERS.findIndex(t => t.role === tier.role) < PRICING_TIERS.findIndex(t => t.role === userRole);

                  return (
                    <div
                      key={tier.role}
                      className={`relative rounded-xl p-6 border-2 transition-all ${
                        tier.popular
                          ? "border-blue-500 shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10"
                          : "border-slate-200 dark:border-slate-700"
                      } ${isCurrentPlan ? "ring-4 ring-green-500/20" : ""}`}
                    >
                      {/* Popular Badge */}
                      {tier.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <div className={`px-4 py-1 bg-gradient-to-r ${tier.bgGradient} text-white text-xs rounded-full shadow-lg`}>
                            Most Popular
                          </div>
                        </div>
                      )}

                      {/* Current Plan Badge */}
                      {isCurrentPlan && (
                        <div className="absolute -top-3 right-4">
                          <div className="px-3 py-1 bg-green-500 text-white text-xs rounded-full shadow-lg">
                            Current Plan
                          </div>
                        </div>
                      )}

                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tier.bgGradient} flex items-center justify-center text-white mb-4`}>
                        {tier.icon}
                      </div>

                      {/* Title */}
                      <h3 className={`text-2xl mb-1 ${tier.color} dark:text-white`}>
                        {tier.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        {tier.description}
                      </p>

                      {/* Price */}
                      <div className="mb-6">
                        <span className="text-3xl text-slate-900 dark:text-white">
                          {tier.price}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">/month</span>
                      </div>

                      {/* Features */}
                      <div className="space-y-3 mb-6">
                        {tier.role === "free" ? (
                          <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                            <Check className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">Basic tracking features</span>
                          </div>
                        ) : (
                          tier.features.slice(0, 5).map((featureName) => {
                            const feature = FEATURES[featureName];
                            return (
                              <div
                                key={featureName}
                                className="flex items-start gap-2 text-slate-700 dark:text-slate-300"
                              >
                                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <div className="flex items-center gap-2">
                                  {getFeatureIcon(featureName)}
                                  <span className="text-sm">{feature?.displayName}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                        {tier.features.length > 5 && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 pl-7">
                            + {tier.features.length - 5} more features
                          </div>
                        )}
                      </div>

                      {/* CTA Button */}
                      <button
                        onClick={() => handleUpgrade(tier.role)}
                        disabled={isCurrentPlan || isDowngrade || isUpgrading}
                        className={`w-full py-3 rounded-lg transition-all ${
                          isCurrentPlan
                            ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 cursor-default"
                            : isDowngrade
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                            : tier.popular
                            ? `bg-gradient-to-r ${tier.bgGradient} text-white hover:shadow-lg`
                            : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100"
                        } disabled:opacity-50`}
                      >
                        {isUpgrading ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            <span>Processing...</span>
                          </div>
                        ) : isCurrentPlan ? (
                          "Current Plan"
                        ) : isDowngrade ? (
                          "Downgrade"
                        ) : (
                          `Upgrade to ${tier.name}`
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 text-center">
                    {error}
                  </p>
                </div>
              )}

              {/* Footer Note */}
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                  💡 <strong>Demo Mode:</strong> This is a demonstration. In production, payment integration would be required.
                  For testing, you can directly upgrade without payment.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
