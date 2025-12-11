// AppWithAuth.tsx - Main entry with authentication
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import LoginPage from "./components/LoginPage";
import App from "./App";

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();

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
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default AppWithAuth;