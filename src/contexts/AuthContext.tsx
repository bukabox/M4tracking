// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { setToken, clearToken } from "../lib/api";

/**
 * AuthContext yang stabil dan HMR-friendly.
 *
 * - Pastikan file ini diexport tanpa default export yang berubah-ubah.
 * - Gunakan useMemo/useCallback untuk menjaga referensi fungsi agar tidak menyebabkan
 *   "incompatible export" pada Fast Refresh.
 */

type User = {
  email: string;
  name?: string;
  picture?: string;
  sub?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credential: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Boot: baca user dari localStorage (jika ada)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed);
      }
    } catch (err) {
      console.warn(
        "[AuthProvider] failed to parse stored user",
        err,
      );
      localStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Stable login function (useCallback)
  const login = useCallback(async (credential: string) => {
    try {
      // Save token centrally (lib/api.setToken should also put to localStorage 'google_id_token')
      setToken(credential); // expected to save token into localStorage, and configure global fetch wrapper if implemented

      // Try decode client-side for quick UX
      let decoded: any | null = null;
      try {
        const parts = credential.split(".");
        if (parts.length >= 2) {
          const base64 = parts[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map(
                (c) =>
                  "%" +
                  ("00" + c.charCodeAt(0).toString(16)).slice(
                    -2,
                  ),
              )
              .join(""),
          );
          decoded = JSON.parse(jsonPayload);
        }
      } catch (err) {
        // ignore decode errors
        decoded = null;
      }

      // Attempt backend verification (optional) - read VITE_API_BASE
      const API_BASE =
        import.meta.env.VITE_API_BASE ||
        "http://127.0.0.1:8124";
      if (API_BASE) {
        try {
          const resp = await fetch(
            `${API_BASE}/api/auth/google`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential }),
            },
          );
          if (resp.ok) {
            const data = await resp.json();
            // backend may return 'user' field
            if (data && data.user) {
              setUser(data.user);
              localStorage.setItem(
                "user",
                JSON.stringify(data.user),
              );
              // backend accepted token => we're done
              setIsLoading(false);
              return;
            }
          } else {
            console.warn(
              "[AuthProvider] backend verification failed:",
              resp.status,
            );
          }
        } catch (err) {
          console.warn(
            "[AuthProvider] backend verify error:",
            err,
          );
        }
      }

      // Fallback: use client-side decoded token payload (if available)
      if (decoded && decoded.email) {
        const u: User = {
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture,
          sub: decoded.sub,
        };
        setUser(u);
        localStorage.setItem("user", JSON.stringify(u));
      } else {
        // If no decoded payload, still mark logged-in (minimal) by storing token only
        setUser((prev) => prev ?? { email: "unknown" });
      }
    } catch (err) {
      // If setToken throws or other errors, rethrow so caller can handle UI
      console.error("[AuthProvider] login error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Stable logout function (useCallback)
  const logout = useCallback(() => {
    // Clear local state and storage synchronously
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("google_id_token");
    // clear helper from lib/api (if provided)
    try {
      clearToken();
    } catch (e) {
      // ignore
    }

    // Notify backend asynchronously (fire & forget)
    try {
      const API_BASE =
        import.meta.env.VITE_API_BASE ||
        "http://127.0.0.1:8124";
      fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
      }).catch(() => {});
    } catch (e) {
      /* ignore */
    }

    // Hard reload UI to ensure all components re-evaluate auth state
    // (this is immediate and synchronous after clearing localStorage)
    window.location.reload();
  }, []);

  // memoize context value to keep stable reference across renders
  const contextValue: AuthContextType = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hooks exported as named functions (stable identity) to avoid HMR "incompatible export".
 * - useAuth throws if used outside provider (strict)
 * - useAuthOptional returns safe defaults if provider not present (useful for components that can render outside provider)
 */

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      "useAuth must be used within an AuthProvider",
    );
  }
  return ctx;
}

export function useAuthOptional(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Safe default (no-op login/logout) when provider missing (development or SSR edgecases)
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => {
        // no-op
      },
      logout: () => {
        localStorage.removeItem("user");
        localStorage.removeItem("google_id_token");
        try {
          const API_BASE =
            import.meta.env.VITE_API_BASE ||
            "http://127.0.0.1:8124";
          fetch(`${API_BASE}/api/auth/logout`, {
            method: "POST",
          }).catch(() => {});
        } catch (e) {}
        // small redirect to home
        window.location.href = "/";
      },
    };
  }
  return ctx;
}