// VerifyEmail.tsx - Email verification with clean minimal design
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Home, Box } from "lucide-react";
import { ROITracker } from "./ROITracker";

interface VerifyEmailProps {
  token: string;
}

export default function VerifyEmail({ token }: VerifyEmailProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await fetch(
        `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message || "Email verified successfully!");

        // Redirect after 3 seconds
        setTimeout(() => {
          window.location.href = "/";
        }, 300000);
      } else {
        setStatus("error");
        setMessage(data.message || data.error || "Verification failed");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Network error. Please try again.");
      console.error("Verification error:", error);
    }
  };

  const handleBackToLogin = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-green-200 dark:border-green-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 shadow-lg">
                <Box className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl text-slate-900 dark:text-white">M4 Tracker</span>
            </div>
            <button
              onClick={handleBackToLogin}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="h-[calc(100vh-182px)] relative py-12 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* LEFT PANEL - DYNAMIC */}
            <div className="relative">
              <AnimatePresence mode="wait">
                {/* LOADING STATE */}
                {status === "loading" && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    {/* MATCH HERO TYPOGRAPHY */}
                    <h1 className="text-5xl md:text-6xl text-slate-900 dark:text-white leading-tight">
                      Verifying Email
                    </h1>

                    <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                      Please wait while we verify your email address...
                    </p>

                    {/* Loading dots */}
                    <div className="flex space-x-3 pt-4">
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                        className="w-3 h-3 bg-green-500 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        className="w-3 h-3 bg-emerald-500 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        className="w-3 h-3 bg-green-600 rounded-full"
                      />
                    </div>
                  </motion.div>
                )}

                {/* SUCCESS STATE */}
                {status === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    {/* MATCH HERO TYPOGRAPHY */}
                    <h1 className="text-5xl md:text-6xl text-slate-900 dark:text-white leading-tight">
                      <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        Email Verified!
                      </span>
                    </h1>

                    <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                      {message}
                    </p>

                    <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                      You can now sign in to your account and start tracking your finances!
                    </p>

                    {/* Redirect notice - Simple text, no box */}
                    <div className="pt-4">
                      <p className="text-lg text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Loader2 className="w-5 h-5 text-green-600 dark:text-green-400 animate-spin" />
                        Redirecting to login page...
                      </p>
                    </div>

                    {/* Button - MATCH HERO BUTTON */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button
                        onClick={handleBackToLogin}
                        className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all"
                      >
                        Go to Login Now
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ERROR STATE */}
                {status === "error" && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    {/* MATCH HERO TYPOGRAPHY */}
                    <h1 className="text-5xl md:text-6xl text-slate-900 dark:text-white leading-tight">
                      Verification Failed
                    </h1>

                    {/* Error message - NO RED BOX, just clean text */}
                    <div className="space-y-4">
                      <p className="text-xl text-red-600 dark:text-red-400 leading-relaxed">
                        {message}
                      </p>
                      
                      <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                        The verification link may have expired or is invalid. Please try requesting a new verification email from the login page.
                      </p>
                    </div>

                    {/* Buttons - MATCH HERO BUTTON POSITIONS */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button
                        onClick={handleBackToLogin}
                        className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all"
                      >
                        Back to Login
                      </button>
                    </div>

                    {/* Footer text */}
                    <p className="text-slate-600 dark:text-slate-400 pt-4">
                      Need help?{" "}
                      <a href="mailto:support@example.com" className="text-green-600 dark:text-green-400 hover:underline">
                        Contact Support
                      </a>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RIGHT PANEL - ROI TRACKER (Static) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-green-100 dark:border-green-800">
                <ROITracker />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-200 dark:border-green-800 bg-white dark:bg-slate-900 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            &copy; 2025 M4 Tracker. Powered by BUKABOX
          </p>
        </div>
      </footer>
    </div>
  );
}
