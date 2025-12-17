// AppWithAuth.tsx - Main entry with authentication
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { FeatureLockProvider } from "./contexts/FeatureLockContext";
import LoginPage from "./components/LoginPage";
import VerifyEmail from "./components/VerifyEmail";
import PrivacyPolicyPage from "./components/PrivacyPolicyPage";
import AboutPage from "./components/AboutPage";
import RefundPolicyPage from "./components/RefundPolicyPage";
import App from "./App";

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Check if we're on the about page (public route)
  if (window.location.pathname === "/about") {
    return <AboutPage />;
  }

  // Check if we're on the refund-policy page (public route)
  if (window.location.pathname === "/refund-policy") {
    return <RefundPolicyPage />;
  }

  // Check if we're on the privacy-policy page (public route)
  if (window.location.pathname === "/privacy-policy") {
    return <PrivacyPolicyPage />;
  }

  // Check if we're on the verify-email page
  const urlParams = new URLSearchParams(window.location.search);
  const verifyToken = urlParams.get("token");
  if (
    verifyToken &&
    window.location.pathname === "/verify-email"
  ) {
    return <VerifyEmail token={verifyToken} />;
  }

  console.log(
    "[AppContent] Render - isLoading:",
    isLoading,
    "isAuthenticated:",
    isAuthenticated,
    "user:",
    user?.email,
  );

  if (isLoading) {
    console.log("[AppContent] Showing loading screen");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1419]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("[AppContent] Showing login page");
    return <LoginPage />;
  }

  console.log("[AppContent] Showing main app");
  return (
    <div className="relative">
      {/* Main App - User menu is handled inside App.tsx header */}
      <App />
    </div>
  );
}

function AppWithAuth() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <FeatureLockProvider>
            <NotificationProvider>
              <AppContent />
            </NotificationProvider>
          </FeatureLockProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default AppWithAuth;