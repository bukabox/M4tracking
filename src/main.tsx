// main.tsx - Entry point with authentication
console.log("=== MAIN.TSX LOADING ===");

import React from "react";
console.log("[main.tsx] React imported successfully");

import ReactDOM from "react-dom/client";
console.log("[main.tsx] ReactDOM imported successfully");

import AppWithAuth from "./AppWithAuth";
console.log("[main.tsx] AppWithAuth imported successfully");

import "./index.css";
console.log("[main.tsx] index.css imported successfully");

import { Toaster } from "./components/ui/sonner";
console.log("[main.tsx] Toaster imported successfully");

import { GoogleOAuthProvider } from "@react-oauth/google";
console.log(
  "[main.tsx] GoogleOAuthProvider imported successfully",
);

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "391690655974-h8o3rjfg55b8al7ttc1v6mpgnoqolppc.apps.googleusercontent.com";

console.log(
  "[main.tsx] Client ID:",
  GOOGLE_CLIENT_ID.substring(0, 20) + "...",
);

const rootElement = document.getElementById("root");
console.log("[main.tsx] Root element found:", !!rootElement);

if (!rootElement) {
  console.error("[main.tsx] ERROR: Root element not found!");
  document.body.innerHTML =
    '<div style="padding: 20px; font-family: sans-serif;"><h1 style="color: red;">ERROR: Root element not found!</h1><p>Please check index.html has <div id="root"></div></p></div>';
  throw new Error("Root element #root not found in index.html");
}
// --- GLOBAL FETCH WRAPPER (replace existing wrapper) ---
(function () {
  const origFetch = window.fetch.bind(window);
  const API_BASE =
    (import.meta as any).env?.VITE_API_BASE ||
    "http://127.0.0.1:8124";

  window.fetch = async (
    input: RequestInfo,
    init?: RequestInit,
  ): Promise<Response> => {
    try {
      const url =
        typeof input === "string"
          ? input
          : (input as Request).url || "";
      const isApiCall =
        url.startsWith("/api") ||
        url.includes("/api/") ||
        url.startsWith(API_BASE);

      if (!isApiCall) return origFetch(input, init);

      init = init ? { ...init } : {};
      const headers = new Headers(init.headers || {});

      // attach token if present (kept)
      const token = localStorage.getItem("google_id_token");
      if (token)
        headers.set("Authorization", `Bearer ${token}`);

      // --- NEW: ensure credentials are included so cookies are sent/received ---
      init.credentials = "include";

      // stringify body if needed (sama seperti semula)
      if (
        init.body &&
        !(init.body instanceof FormData) &&
        !(init.body instanceof Blob) &&
        typeof init.body !== "string"
      ) {
        try {
          init.body = JSON.stringify(init.body);
          if (!headers.has("Content-Type"))
            headers.set("Content-Type", "application/json");
        } catch (e) {
          /* ignore */
        }
      }

      init.headers = headers;

      // debug...
      return origFetch(input, init);
    } catch (e) {
      return origFetch(input, init);
    }
  };
})();
// --- END GLOBAL FETCH WRAPPER ---

console.log("[main.tsx] Creating React root...");
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppWithAuth />
      <Toaster />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);

console.log("[main.tsx] ✅ React app rendered successfully!");