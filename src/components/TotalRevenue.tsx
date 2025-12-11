import { useState, useMemo, useEffect } from "react";
import { HandCoins, Eye, EyeOff, Settings } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface TotalRevenueProps {
  lifetimeRevenue: number;
  initialModal?: number;
  onModalChange?: (value: number) => void;
  roiTarget?: number;
}

function fmtIDR(v: number) {
  return new Intl.NumberFormat("id-ID").format(Math.round(v));
}

export function TotalRevenue({
  lifetimeRevenue,
  initialModal = 25000000,
  onModalChange,
  roiTarget = 2000,
}: TotalRevenueProps) {
  const [modalM4, setModalM4] = useState<number>(initialModal);
  const [isEditingModal, setIsEditingModal] =
    useState<boolean>(false);
  const [modalInput, setModalInput] = useState<string>(
    String(initialModal),
  );
  const [showLifetime, setShowLifetime] =
    useState<boolean>(true);
  const [isDesktop, setIsDesktop] = useState<boolean>(
    typeof window !== "undefined" && window.innerWidth >= 768,
  );

  // Track screen size for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync internal state when prop changes
  useEffect(() => {
    setModalM4(initialModal);
    setModalInput(String(initialModal));
  }, [initialModal]);

  const roiPercentage = useMemo(() => {
    if (!modalM4 || modalM4 <= 0) return 0;
    const profit = lifetimeRevenue - modalM4;
    if (profit <= 0) return 0;
    return (profit / modalM4) * 100;
  }, [lifetimeRevenue, modalM4]);

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
                }}
              >
                Rp {fmtIDR(lifetimeRevenue)}
              </p>
            ) : (
              <p
                className="text-gray-300 mb-2"
                style={{
                  fontSize: "1.875rem",
                  lineHeight: "2.25rem",
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
                  <span>modal</span>
                  <span
                    className="text-gray-900"
                    style={{ fontWeight: 600 }}
                  >
                    Rp {fmtIDR(modalM4)}
                  </span>
                  <button
                    className="text-gray-400"
                    onClick={() => {
                      setModalInput(String(modalM4));
                      setIsEditingModal(true);
                    }}
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

      {/* Modal Editor Inline */}
      {isEditingModal && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p
            className="text-gray-900 mb-2"
            style={{ fontSize: "0.875rem", fontWeight: 500 }}
          >
            Edit Modal Awal
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              className="bg-white border-gray-200"
              placeholder="Masukkan modal"
            />
            <Button
              onClick={() => {
                const parsed = Number(modalInput || 0);
                if (!isNaN(parsed) && parsed > 0) {
                  setModalM4(parsed);
                  if (onModalChange) {
                    onModalChange(parsed);
                  }
                }
                setIsEditingModal(false);
              }}
              style={{
                background:
                  "linear-gradient(to right, #3b82f6, #9333ea)",
                color: "white",
              }}
            >
              Save
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsEditingModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}