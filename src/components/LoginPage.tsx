// src/LoginPage.tsx
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSuccess = async (credentialResponse: any) => {
    console.log("GoogleLogin onSuccess:", credentialResponse);
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      console.warn("No credential from Google login");
      setError("No credential returned from Google. Try again.");
      return;
    }
    try {
      setIsSubmitting(true);
      await login(idToken);
      console.log("Stored token in localStorage:", localStorage.getItem("google_id_token"));
      setError(null);
      // optional: redirect if you want
      // window.location.href = "/";
    } catch (e) {
      console.error("login failed:", e);
      setError("Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginError = (err: any) => {
    console.error("GoogleLogin onError:", err);
    setError("Google sign-in error. Check console for details.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1419] px-4">
      <div className="w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 mb-4 shadow-lg">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl tracking-tight text-gray-900 dark:text-white mb-2">
            FinanceHub
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Professional Finance Tracking Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-[#1a1f28] rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-[#2d3748]">
          <div className="text-center mb-8">
            <h2 className="text-xl text-gray-900 dark:text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sign in to access your financial dashboard
            </p>
          </div>

          {/* Google Sign-In Button */}
          <div className="flex justify-center mb-4">
            {isSubmitting ? (
              <div className="flex items-center justify-center h-12 w-full">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 dark:border-gray-700 border-t-blue-500"></div>
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={handleLoginError}
                useOneTap={false}
                theme="outline"
                size="large"
                width="300"
                text="signin_with"
              />
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-[#2d3748]">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        {/* Features - Clean minimalist design */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-lg bg-white/50 dark:bg-[#1a1f28]/50 border border-gray-200/50 dark:border-[#2d3748]/50">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Analytics</p>
          </div>
          <div className="p-4 rounded-lg bg-white/50 dark:bg-[#1a1f28]/50 border border-gray-200/50 dark:border-[#2d3748]/50">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Track Income</p>
          </div>
          <div className="p-4 rounded-lg bg-white/50 dark:bg-[#1a1f28]/50 border border-gray-200/50 dark:border-[#2d3748]/50">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Secure</p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            BUKABOX M4 Tracker &middot; Powered by Google OAuth 2.0
          </p>
        </div>
      </div>
    </div>
  );
}
