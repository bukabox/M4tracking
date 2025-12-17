import React, { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Shield,
  Smartphone,
  Zap,
  Box,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  Check,
  X,
  Home,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ROITracker } from "./ROITracker";
import { useAuth } from "../contexts/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

type ViewMode = "hero" | "signin" | "signup" | "success";

export default function LoginPage() {
  const { login } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("hero");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  // Email verification states
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [showResendButton, setShowResendButton] =
    useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const isSignIn = viewMode === "signin";

    try {
      setIsSubmitting(true);
      setError(null);
      setShowResendButton(false);

      if (!formData.email || !formData.password) {
        setError("Please fill in all fields");
        return;
      }

      if (!isSignIn && !formData.name) {
        setError("Please enter your name");
        return;
      }

      if (
        !isSignIn &&
        formData.password !== formData.confirmPassword
      ) {
        setError("Passwords do not match");
        return;
      }

      if (!isSignIn && formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      const API_BASE =
        (import.meta as any).env?.VITE_API_BASE ||
        "http://127.0.0.1:8124";

      const endpoint = isSignIn
        ? "/api/auth/direct"
        : "/api/auth/register";
      const payload = isSignIn
        ? { email: formData.email, password: formData.password }
        : {
            email: formData.email,
            password: formData.password,
            name: formData.name,
          };

      const resp = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await resp.json();

      if (resp.ok) {
        // Registration Success
        if (!isSignIn) {
          setViewMode("success");
          setRegisteredEmail(formData.email);
          setFormData({
            email: "",
            password: "",
            confirmPassword: "",
            name: "",
          });
          return;
        }

        // Login Success
        if (data && data.user) {
          // Save user info
          localStorage.setItem(
            "user",
            JSON.stringify(data.user),
          );
          // Save session token (acts like Google ID token)
          if (data.session_token) {
            localStorage.setItem("google_id_token", data.session_token);
          }
          window.location.reload();
        } else {
          setError(
            "Login successful but no user data returned",
          );
        }
      } else {
        if (data.error === "Email not verified") {
          setShowResendButton(true);
          setRegisteredEmail(formData.email);
        }
        setError(
          data.message ||
            data.error ||
            `${isSignIn ? "Login" : "Registration"} failed`,
        );
      }
    } catch (e) {
      console.error("Operation failed:", e);
      setError(
        "Network error. Please check if backend is running.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      setError(null);

      const API_BASE =
        (import.meta as any).env?.VITE_API_BASE ||
        "http://127.0.0.1:8124";

      const resp = await fetch(
        `${API_BASE}/api/auth/resend-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: registeredEmail }),
          credentials: "include",
        },
      );

      const data = await resp.json();

      if (resp.ok) {
        setError(null);
        alert(
          "✓ Verification email sent! Please check your inbox.",
        );
      } else {
        setError(
          data.error || "Failed to resend verification email",
        );
      }
    } catch (error) {
      console.error("Resend failed:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleLoginSuccess = async (
    credentialResponse: any,
  ) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      setError(
        "No credential returned from Google. Try again.",
      );
      return;
    }
    try {
      setIsSubmitting(true);
      await login(idToken);
      setError(null);
    } catch (e) {
      console.error("login failed:", e);
      setError("Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLoginError = (err: any) => {
    console.error("GoogleLogin onError:", err);
    setError(
      "Google sign-in error. Check console for details.",
    );
  };

  const resetToHero = () => {
    setViewMode("hero");
    setError(null);
    setShowResendButton(false);
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation Bar */}
      <nav className="border-b border-green-200 dark:border-green-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 shadow-lg">
                <Box className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl text-slate-900 dark:text-white">
                M4 ROI
              </span>
            </div>

            <div className="flex items-center gap-3">
              {viewMode !== "hero" && (
                <button
                  onClick={resetToHero}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Home
                </button>
              )}
              {viewMode === "hero" && (
                <>
                  <button
                    onClick={() => setViewMode("signin")}
                    className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setViewMode("signup")}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Hero Section with Dynamic Left Panel */}
      <section className="relative py-12 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* LEFT PANEL - DYNAMIC */}
            <div className="relative">
              <AnimatePresence mode="wait">
                {/* HERO VIEW */}
                {viewMode === "hero" && (
                  <motion.div
                    key="hero"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm">
                        Powered by BUKABOX
                      </span>
                    </div>

                    <h1 className="text-5xl md:text-6xl text-slate-900 dark:text-white leading-tight">
                      <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        Track Your ROI
                      </span>
                      Like a Pro
                    </h1>

                    <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                      Set Modal, input data dan dashboard akan
                      menghitung dan menampilkannya dengan
                      visualisasi terbaik.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => setViewMode("signup")}
                        className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all"
                      >
                        Get Started
                      </button>
                      <button
                        onClick={() => setViewMode("signin")}
                        className="px-8 py-4 border-2 border-green-600 dark:border-green-500 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                      >
                        Sign In
                      </button>
                    </div>

                    <div className="flex items-center gap-6 pt-8 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <div className="text-3xl text-slate-900 dark:text-white">
                          500+
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Active Users
                        </div>
                      </div>
                      <div>
                        <div className="text-3xl text-slate-900 dark:text-white">
                          Rp 50M+
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Assets Tracked
                        </div>
                      </div>
                      <div>
                        <div className="text-3xl text-slate-900 dark:text-white">
                          98%
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          Satisfaction
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* SIGN IN VIEW */}
                {viewMode === "signin" && (
                  <motion.div
                    key="signin"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-md"
                  >
                    <div className="mb-8">
                      <h1 className="text-5xl md:text-6xl text-slate-900 dark:text-white leading-tight">
                        <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          Welcome
                        </span>
                        Back !
                      </h1>
                      <p className="text-lg text-slate-600 dark:text-slate-400">
                        Sign in untuk akses Dashboard
                      </p>
                    </div>

                    {/* Email Not Verified Warning */}
                    {showResendButton && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
                              Email Not Verified
                            </h3>
                            <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                              Verifikasi email dulu BOS, sebelum
                              login.
                            </p>
                            <button
                              onClick={handleResendVerification}
                              disabled={isResending}
                              className="inline-flex items-center gap-2 text-sm px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                            >
                              {isResending ? (
                                <>
                                  <svg
                                    className="animate-spin h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <RefreshCcw className="w-4 h-4" />
                                  Resend Verification
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {error && !showResendButton && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {error}
                        </p>
                      </div>
                    )}

                    <form
                      onSubmit={handleFormLogin}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 pl-10 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-green-500 focus:outline-none text-gray-900 dark:text-white"
                            placeholder="your@email.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type={
                              showPassword ? "text" : "password"
                            }
                            value={formData.password}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                password: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 pl-10 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-green-500 focus:outline-none text-gray-900 dark:text-white"
                            placeholder="Enter password"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword(!showPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {isSubmitting
                          ? "Signing in..."
                          : "Sign In"}
                      </button>
                    </form>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gradient-to-b from-green-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-center mb-6">
                      <GoogleLogin
                        onSuccess={handleGoogleLoginSuccess}
                        onError={handleGoogleLoginError}
                        theme="outline"
                        size="large"
                        text="signin_with"
                      />
                    </div>

                    <p className="text-center text-slate-600 dark:text-slate-400">
                      Don't have an account?{" "}
                      <button
                        onClick={() => {
                          setViewMode("signup");
                          setError(null);
                          setShowResendButton(false);
                        }}
                        className="text-green-600 dark:text-green-400 hover:underline"
                      >
                        Sign up
                      </button>
                    </p>
                  </motion.div>
                )}

                {/* SIGN UP VIEW */}
                {viewMode === "signup" && (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-md"
                  >
                    <div className="mb-8">
                      <h1 className="text-5xl md:text-6xl text-slate-900 dark:text-white leading-tight">
                        <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          Get
                        </span>
                        Started
                      </h1>
                      <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                        Buat akun dan mulai tracking ROI
                        sekarang juga!
                      </p>
                    </div>

                    {error && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {error}
                        </p>
                      </div>
                    )}

                    <form
                      onSubmit={handleFormLogin}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-green-500 focus:outline-none text-gray-900 dark:text-white"
                          placeholder="Enter your name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 pl-10 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-green-500 focus:outline-none text-gray-900 dark:text-white"
                            placeholder="your@email.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type={
                              showPassword ? "text" : "password"
                            }
                            value={formData.password}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                password: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 pl-10 bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-green-500 focus:outline-none text-gray-900 dark:text-white"
                            placeholder="Enter password"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword(!showPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        {formData.password && (
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <div
                              className={`w-3 h-3 rounded-full ${formData.password.length >= 6 ? "bg-green-500" : "bg-gray-300"}`}
                            />
                            <span
                              className={
                                formData.password.length >= 6
                                  ? "text-green-600"
                                  : "text-gray-500"
                              }
                            >
                              At least 6 characters
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type={
                              showConfirmPassword
                                ? "text"
                                : "password"
                            }
                            value={formData.confirmPassword}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                confirmPassword: e.target.value,
                              })
                            }
                            className={`w-full px-4 py-3 pl-10 bg-gray-50 dark:bg-slate-800 border-2 rounded-lg focus:outline-none text-gray-900 dark:text-white ${
                              formData.confirmPassword &&
                              formData.password &&
                              formData.confirmPassword ===
                                formData.password
                                ? "border-green-500"
                                : formData.confirmPassword &&
                                    formData.password
                                  ? "border-red-500"
                                  : "border-gray-200 dark:border-gray-600 focus:border-green-500"
                            }`}
                            placeholder="Confirm password"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(
                                !showConfirmPassword,
                              )
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        {formData.confirmPassword &&
                          formData.password && (
                            <div className="mt-2 flex items-center gap-2 text-sm">
                              {formData.confirmPassword ===
                              formData.password ? (
                                <>
                                  <Check className="w-4 h-4 text-green-600" />
                                  <span className="text-green-600">
                                    Passwords match
                                  </span>
                                </>
                              ) : (
                                <>
                                  <X className="w-4 h-4 text-red-600" />
                                  <span className="text-red-600">
                                    Passwords do not match
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {isSubmitting
                          ? "Creating account..."
                          : "Create Account"}
                      </button>
                    </form>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gradient-to-b from-green-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-center mb-6">
                      <GoogleLogin
                        onSuccess={handleGoogleLoginSuccess}
                        onError={handleGoogleLoginError}
                        theme="outline"
                        size="large"
                        text="signup_with"
                      />
                    </div>

                    <p className="text-center text-slate-600 dark:text-slate-400">
                      Already have an account?{" "}
                      <button
                        onClick={() => {
                          setViewMode("signin");
                          setError(null);
                        }}
                        className="text-green-600 dark:text-green-400 hover:underline"
                      >
                        Sign in
                      </button>
                    </p>
                  </motion.div>
                )}

                {/* SUCCESS NOTIFICATION VIEW */}
                {viewMode === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    {/* Main Heading - MATCH HERO TYPOGRAPHY */}
                    <h1 className="text-5xl md:text-6xl text-slate-900 dark:text-white leading-tight">
                      Check Your Email!
                    </h1>

                    {/* Description - MATCH HERO TYPOGRAPHY */}
                    <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                      We've sent a verification email to:
                    </p>

                    {/* Email Display - Simple, no heavy box */}
                    <div className="inline-block">
                      <p className="text-xl text-green-600 dark:text-green-400 font-mono">
                        {registeredEmail}
                      </p>
                    </div>

                    {/* Next Steps - Clean list, no box */}
                    <div className="pt-4">
                      <p className="text-xl text-slate-600 dark:text-slate-400 mb-4">
                        Next Steps:
                      </p>
                      <ol className="space-y-3 text-lg text-slate-600 dark:text-slate-400">
                        <li className="flex items-start">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-sm mr-3 flex-shrink-0 mt-0.5">
                            1
                          </span>
                          <span>
                            Check your email inbox (and spam
                            folder)
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-sm mr-3 flex-shrink-0 mt-0.5">
                            2
                          </span>
                          <span>
                            Click the verification link
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-sm mr-3 flex-shrink-0 mt-0.5">
                            3
                          </span>
                          <span>
                            Return and sign in to start
                            tracking!
                          </span>
                        </li>
                      </ol>
                    </div>

                    {/* Buttons - MATCH HERO BUTTON POSITIONS */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button
                        onClick={resetToHero}
                        className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all"
                      >
                        Got It!
                      </button>
                      <button
                        onClick={handleResendVerification}
                        disabled={isResending}
                        className="px-8 py-4 border-2 border-green-600 dark:border-green-500 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                      >
                        {isResending ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg
                              className="animate-spin h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Sending...
                          </span>
                        ) : (
                          "Resend Email"
                        )}
                      </button>
                    </div>

                    {/* Footer text */}
                    <p className="text-slate-600 dark:text-slate-400 pt-4">
                      Didn't receive the email?{" "}
                      <a
                        href="mailto:support@bukabox.co.id"
                        className="text-green-600 dark:text-green-400 hover:underline"
                      >
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

      {/* Features Section */}
      <section className="py-20 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl mb-4 text-slate-900 dark:text-white">
              Everything You Need
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Fitur paling lengkap yang pernah ada yang dibuat
              khusus menghitung ROI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl shadow-lg">
              <BarChart3 className="w-10 h-10 text-green-600 dark:text-green-400 mb-4" />
              <h3 className="text-xl mb-2 text-slate-900 dark:text-white">
                Advanced Analytics
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Data chart, analytic, Reports !
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl shadow-lg">
              <Shield className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl mb-2 text-slate-900 dark:text-white">
                Bank-Level Security
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Encrypted lebih aman dari data lu di Bank (Gak
                dijual ke pihak ketiga).
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl shadow-lg">
              <Smartphone className="w-10 h-10 text-purple-600 dark:text-purple-400 mb-4" />
              <h3 className="text-xl mb-2 text-slate-900 dark:text-white">
                Mobile Ready
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Akses darimana saja
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-200 dark:border-green-800 bg-white dark:bg-slate-900 py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Logo & Brand */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 shadow-lg">
              <Box className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl text-slate-900 dark:text-white">
              M4 ROI
            </span>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
            <a
              href="/about"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              About
            </a>
            <a
              href="#pricing"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              Pricing
            </a>
            <a
              href="/privacy-policy"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/refund-policy"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              Refund Policy
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
            &copy; 2025 M4 ROI . Powered by BUKABOX
          </p>
        </div>
      </footer>
    </div>
  );
}