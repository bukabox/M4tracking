import { useState, useMemo, useEffect } from "react";
import { HandCoins, Eye, EyeOff, Settings } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useCurrency } from "../contexts/CurrencyContext";

interface CapitalItem {
  id: string;
  name: string;
  amount: number;
  depreciable: boolean;
  periode?: number;
  residu?: number;
}

interface TotalRevenueProps {
  lifetimeRevenue: number;
  lifetimeExpenses?: number;
  lifetimeDepreciation?: number;
  lifetimeNetProfit?: number;
  capitalItems?: CapitalItem[];
  initialModal?: number; // Backward compatibility
  roiTarget?: number;
  onOpenSettings?: () => void;
  totalExpenses?: number; // Deprecated - use lifetimeExpenses
  periode?: number; // Backward compatibility
  residu?: number; // Backward compatibility
}

export function TotalRevenue({
  lifetimeRevenue,
  lifetimeExpenses = 0,
  lifetimeDepreciation = 0,
  lifetimeNetProfit = 0,
  capitalItems,
  initialModal = 25000000,
  roiTarget = 2000,
  onOpenSettings,
  totalExpenses = 0, // Deprecated
  periode = 12,
  residu = 5000000,
}: TotalRevenueProps) {
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  
  const [showLifetime, setShowLifetime] =
    useState<boolean>(true);
  const [isDesktop, setIsDesktop] = useState<boolean>(
    typeof window !== "undefined" && window.innerWidth >= 768,
  );

  // Calculate total initial capital from capital items
  const initialCapital = useMemo(() => {
    if (capitalItems && capitalItems.length > 0) {
      return capitalItems.reduce((sum, item) => sum + item.amount, 0);
    }
    return initialModal; // Fallback to old prop
  }, [capitalItems, initialModal]);

  // Calculate total monthly depreciation from depreciable assets
  const depreciationValue = useMemo(() => {
    // Use lifetime depreciation from backend if available
    if (lifetimeDepreciation > 0) {
      return lifetimeDepreciation;
    }
    
    // Fallback: Calculate monthly depreciation (deprecated)
    if (capitalItems && capitalItems.length > 0) {
      return capitalItems.reduce((sum, item) => {
        if (item.depreciable && item.periode && item.periode > 0) {
          const monthly = (item.amount - (item.residu || 0)) / item.periode;
          return sum + monthly;
        }
        return sum;
      }, 0);
    }
    // Fallback to old calculation
    if (periode > 0) {
      return (initialModal - residu) / periode;
    }
    return 0;
  }, [lifetimeDepreciation, capitalItems, initialModal, residu, periode]);

  // Use lifetime expenses from backend if available, otherwise fallback to prop
  const totalExpensesValue = lifetimeExpenses > 0 ? lifetimeExpenses : totalExpenses;

  // Track screen size for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Debug log ROI calculations
  useEffect(() => {
    console.log('[TotalRevenue] ROI Target:', roiTarget + '%');
    console.log('[TotalRevenue] Initial Capital:', initialCapital);
    console.log('[TotalRevenue] Lifetime Revenue:', lifetimeRevenue);
    console.log('[TotalRevenue] Lifetime Expenses:', totalExpensesValue);
    console.log('[TotalRevenue] Lifetime Depreciation:', depreciationValue);
    
    if (capitalItems && capitalItems.length > 0) {
      console.log('[TotalRevenue] Capital Items:', capitalItems);
    }
    
    // CORRECTED FORMULA (Accounting-based):
    // Net Profit = Revenue - OPEX - Depreciation
    // ROI = (Net Profit / Initial Capital) * 100
    // Investment is NOT subtracted (it's capital movement, not expense)
    const netProfit = lifetimeRevenue - totalExpensesValue - depreciationValue;
    const calculatedROI = initialCapital > 0 
      ? (netProfit / initialCapital) * 100 
      : 0;
    console.log('[TotalRevenue] Net Profit:', netProfit);
    console.log('[TotalRevenue] Calculated ROI:', Math.round(calculatedROI) + '%');
    console.log('[TotalRevenue] Formula: (Revenue - OPEX - Depreciation) / Initial Capital × 100');
    console.log('[TotalRevenue] NOTE: Investment tidak dikurangkan (bukan expense)');
  }, [roiTarget, initialCapital, lifetimeRevenue, totalExpensesValue, depreciationValue, capitalItems]);

  const roiPercentage = useMemo(() => {
    if (!initialCapital || initialCapital <= 0) return 0;
    // CORRECTED FORMULA:
    // Net Profit = Revenue - OPEX - Depreciation (Investment NOT subtracted)
    // ROI = (Net Profit / Initial Capital) × 100%
    const netProfit = lifetimeRevenue - totalExpensesValue - depreciationValue;
    return (netProfit / initialCapital) * 100;
  }, [lifetimeRevenue, initialCapital, depreciationValue, totalExpensesValue]);

  const roiProgressPct =
    (Math.min(roiPercentage, roiTarget) / roiTarget) * 100;

  return (
    <Card className="p-6 mb-6 bg-white border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Icon - Conditional rendering: Desktop only */}
          {isDesktop && (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(to bottom right, #3b82f6, #9333ea)",
              }}
            >
              <HandCoins className="w-6 h-6 text-white" />
            </div>
          )}

          {/* Content */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p
                className="text-gray-500"
                style={{ fontSize: "0.875rem" }}
              >
                Total Revenue (Lifetime)
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowLifetime(!showLifetime)}
                style={{ padding: "0.25rem" }}
              >
                {showLifetime ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </Button>
            </div>

            {/* Amount Display */}
            {showLifetime ? (
              <p
                className="text-gray-900 mb-2"
                style={{
                  fontSize: "1.875rem",
                  lineHeight: "2.25rem",
                  fontWeight: 700,
                }}
              >
                {formatCurrency(lifetimeRevenue)}
              </p>
            ) : (
              <p
                className="text-gray-300 mb-2"
                style={{
                  fontSize: "1.875rem",
                  lineHeight: "2.25rem",
                  fontWeight: 700,
                }}
              >
                ••••••••
              </p>
            )}

            {/* ROI Information */}
            {showLifetime && (
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-2 text-gray-600"
                  style={{ fontSize: "0.875rem" }}
                >
                  <span>Initial : </span>
                  <span
                    className="text-gray-900"
                    style={{ fontWeight: 700 }}
                  >
                    {formatCurrency(initialCapital)}
                  </span>
                  <button
                    className="text-gray-400"
                    onClick={onOpenSettings}
                    style={{
                      marginLeft: "0.25rem",
                      cursor: "pointer",
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#4b5563")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#9ca3af")
                    }
                    title="Edit Modal"
                  >
                    <Settings
                      style={{
                        width: "0.875rem",
                        height: "0.875rem",
                      }}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Ring (All screen sizes) */}
        {showLifetime && (
          <div className="flex flex-col items-center">
            <div
              className="relative"
              style={{ width: "5rem", height: "5rem" }}
            >
              {/* Background Circle */}
              <svg
                style={{
                  transform: "rotate(-90deg)",
                  width: "5rem",
                  height: "5rem",
                }}
              >
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  className="stroke-gray-200 dark:stroke-gray-700"
                  strokeWidth="6"
                  fill="none"
                />
                {/* Progress Circle - Gradient */}
                <defs>
                  <linearGradient
                    id="progressGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      style={{ stopColor: "#3b82f6" }}
                    />
                    <stop
                      offset="100%"
                      style={{ stopColor: "#9333ea" }}
                    />
                  </linearGradient>
                </defs>
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="url(#progressGradient)"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - Math.min(roiPercentage / roiTarget, 1))}`}
                  strokeLinecap="round"
                  style={{ transition: "all 0.5s" }}
                />
              </svg>
              {/* Center Text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  style={{
                    background:
                      "linear-gradient(to right, #3b82f6, #9333ea)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                  }}
                >
                  {Math.round(roiPercentage)}%
                </span>
              </div>
            </div>
            <p
              className="text-gray-500 mt-1"
              style={{ fontSize: "0.75rem" }}
            >
              Progress
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {showLifetime && (
        <div className="mt-4">
          <div
            className="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
            style={{ height: "0.5rem" }}
          >
            <div
              className="rounded-full"
              style={{
                height: "0.5rem",
                background:
                  "linear-gradient(to right, #3b82f6, #9333ea)",
                width: `${roiProgressPct}%`,
                transition: "all 0.5s ease-out",
              }}
            />
          </div>
          <div
            className="flex items-center justify-between text-gray-500"
            style={{
              marginTop: "0.375rem",
              fontSize: "0.75rem",
            }}
          >
            <span>0%</span>
            <span style={{ fontWeight: 500 }}>
              Target ROI: {roiTarget}%
            </span>
            <span>{roiTarget}%</span>
          </div>
        </div>
      )}
    </Card>
  );
}