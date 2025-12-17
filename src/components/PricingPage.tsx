import React from "react";
import { Crown, Zap, Check, X, ArrowLeft } from "lucide-react";
import { useFeatureLock, FEATURES, UserRole } from "../contexts/FeatureLockContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { toast } from "sonner@2.0.3";

interface PricingPageProps {
  onBack: () => void;
  open: boolean;
}

export function PricingPage({ onBack, open }: PricingPageProps) {
  const { userRole, upgradeRole } = useFeatureLock();
  const { t } = useLanguage();

  const handleUpgrade = async (newRole: UserRole) => {
    if (newRole === userRole) {
      toast.info("You're already on this plan");
      return;
    }

    try {
      await upgradeRole(newRole);
      toast.success(`Successfully upgraded to ${newRole.toUpperCase()} plan!`);
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (error) {
      toast.error("Failed to upgrade. Please try again.");
    }
  };

  const plans = [
    {
      role: "free" as UserRole,
      name: "Free",
      price: "Rp 0",
      period: "forever",
      description: "Perfect for getting started",
      icon: <X className="w-6 h-6" />,
      color: "from-slate-500 to-slate-600",
      features: [
        { name: "Basic transaction tracking", included: true },
        { name: "Simple reports", included: true },
        { name: "Unlimited transactions", included: true },
        { name: "Export to PDF", included: false },
        { name: "CSV Import", included: false },
        { name: "Investment Tracking", included: false },
        { name: "Advanced Reports", included: false },
        { name: "Custom Date Range", included: false },
        { name: "Priority Support", included: false },
      ],
    },
    {
      role: "premium" as UserRole,
      name: "Premium",
      price: "Rp 99.000",
      period: "per month",
      description: "For serious finance tracking",
      icon: <Zap className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600",
      popular: true,
      features: [
        { name: "Everything in Free", included: true },
        { name: "Unlimited transactions", included: true },
        { name: "Export to PDF", included: true },
        { name: "CSV Import", included: true },
        { name: "Investment Tracking", included: true },
        { name: "Smart Notifications", included: true },
        { name: "Advanced Reports", included: false },
        { name: "Custom Date Range", included: false },
        { name: "Priority Support", included: false },
      ],
    },
    {
      role: "pro" as UserRole,
      name: "Pro",
      price: "Rp 199.000",
      period: "per month",
      description: "For professionals & businesses",
      icon: <Crown className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600",
      features: [
        { name: "Everything in Premium", included: true },
        { name: "Advanced Reports & Analytics", included: true },
        { name: "Custom Date Range", included: true },
        { name: "Advanced Charts", included: true },
        { name: "Multi-currency Support", included: true },
        { name: "Priority Support", included: true },
        { name: "API Access", included: true },
        { name: "Custom Integrations", included: true },
        { name: "White-label Option", included: true },
      ],
    },
  ];

  if (!open) return null;

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-[100] transition-opacity duration-300"
        onClick={onBack}
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      {/* Pricing Page - Fullscreen Overlay with Animation */}
      <div
        className="fixed inset-0 z-[101] overflow-hidden transition-all duration-500 ease-out"
        style={{
          transform: open ? "translateY(0)" : "translateY(100%)",
          opacity: open ? 1 : 0,
        }}
      >
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={onBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Choose Your Plan
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Upgrade your account to unlock premium features
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Plan Badge */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Current Plan:{" "}
                <span className="font-semibold uppercase">{userRole}</span>
              </p>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card
                  key={plan.role}
                  className={`relative p-6 ${
                    plan.popular
                      ? "ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg"
                      : ""
                  } ${
                    userRole === plan.role
                      ? "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20"
                      : "bg-white dark:bg-gray-800"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-full">
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  {userRole === plan.role && (
                    <div className="absolute -top-3 right-6">
                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                        CURRENT PLAN
                      </span>
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white mb-4`}
                  >
                    {plan.icon}
                  </div>

                  {/* Plan Name & Price */}
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {plan.price}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        /{plan.period}
                      </span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleUpgrade(plan.role)}
                    disabled={userRole === plan.role}
                    className={`w-full mb-6 ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        : userRole === plan.role
                        ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        : "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200"
                    }`}
                  >
                    {userRole === plan.role
                      ? "Current Plan"
                      : plan.role === "free"
                      ? "Downgrade"
                      : "Upgrade Now"}
                  </Button>

                  {/* Features List */}
                  <div className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                        )}
                        <span
                          className={`text-sm ${
                            feature.included
                              ? "text-gray-900 dark:text-gray-100"
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                        >
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            {/* Additional Info */}
            <div className="mt-12 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                💳 All plans include 7-day money-back guarantee
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                📞 Need help choosing? Contact our sales team
              </p>
            </div>

            {/* FAQ Section */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                Frequently Asked Questions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-white dark:bg-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Can I switch plans anytime?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Yes! You can upgrade or downgrade your plan at any time. Changes
                    take effect immediately.
                  </p>
                </Card>
                <Card className="p-6 bg-white dark:bg-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Is my data secure?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Absolutely. We use industry-standard encryption and security
                    practices to protect your financial data.
                  </p>
                </Card>
                <Card className="p-6 bg-white dark:bg-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    What payment methods do you accept?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We accept all major credit cards, debit cards, and bank transfers
                    (Indonesia only).
                  </p>
                </Card>
                <Card className="p-6 bg-white dark:bg-gray-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Do you offer refunds?
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Yes, we offer a 7-day money-back guarantee for all paid plans. No
                    questions asked.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}