// src/lib/api.ts
// Centralized API utilities for M4Tracker
// - Provides both low-level apiFetch and high-level helpers
// - Exposes setToken / clearToken required by AuthContext
// - Robust error handling via ApiError

type Json = Record<string, any> | null;

const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://127.0.0.1:8124";

/** -------------------------
 * ApiError
 * ------------------------- */
export class ApiError extends Error {
  public status: number;
  public data?: any;
  constructor(message: string, status = 0, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/** -------------------------
 * Token helpers (named exports)
 * ------------------------- */
export function setToken(token: string | null) {
  try {
    if (token === null || token === undefined) {
      localStorage.removeItem("google_id_token");
    } else {
      localStorage.setItem("google_id_token", token);
    }
  } catch (e) {
    // ignore storage errors in environments without localStorage
    // but still log in dev
    if ((import.meta as any).env?.DEV) {
      console.warn("[api] setToken error", e);
    }
  }
}

export function clearToken() {
  try {
    localStorage.removeItem("google_id_token");
  } catch (e) {
    if ((import.meta as any).env?.DEV) console.warn("[api] clearToken error", e);
  }
}

export function currentToken(): string | null {
  try {
    return localStorage.getItem("google_id_token");
  } catch {
    return null;
  }
}

/** -------------------------
 * Internal helpers
 * ------------------------- */
function apiUrl(path: string): string {
  // accept absolute urls as-is
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (!path.startsWith("/")) path = `/${path}`;
  return `${API_BASE}${path}`;
}

function buildHeaders(extra?: HeadersInit, jsonBody = false): Headers {
  const headers = new Headers(extra || {});
  const token = currentToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (jsonBody && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return headers;
}

async function readResponseBody(res: Response): Promise<Json> {
  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  if (isJson) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  } else {
    try {
      const text = await res.text();
      return text === "" ? null : (text as unknown as Json);
    } catch {
      return null;
    }
  }
}

async function handleResponse(res: Response) {
  const payload = await readResponseBody(res);
  if (!res.ok) {
    const msg =
      (payload && (typeof payload === "object" ? (payload as any).error || (payload as any).message : payload)) ||
      res.statusText ||
      "API error";
    throw new ApiError(String(msg), res.status, payload);
  }
  return payload;
}

/** -------------------------
 * Low-level fetch wrapper
 * - apiFetch resolves relative path against API_BASE
 * - injects Authorization header automatically
 * - uses handleResponse for parsing and errors
 * ------------------------- */
export async function apiFetch(path: string, init?: RequestInit) {
  const url = apiUrl(path);
  const isFormData = init?.body instanceof FormData;
  const headers = buildHeaders(init?.headers, !isFormData);

  const merged: RequestInit = {
    ...init,
    headers,
  };

  const res = await fetch(url, merged);
  return handleResponse(res);
}

/** -------------------------
 * Convenience HTTP helpers
 * ------------------------- */
export async function apiGet<T = any>(path: string, query?: Record<string, string | number | boolean>) {
  const q = query
    ? "?" +
      Object.entries(query)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&")
    : "";
  return apiFetch(path + q) as Promise<T>;
}

export async function apiPost<T = any>(path: string, body?: any) {
  const isFormData = body instanceof FormData;
  return apiFetch(path, {
    method: "POST",
    body: isFormData ? body : body === undefined ? undefined : JSON.stringify(body),
    headers: buildHeaders(undefined, !isFormData),
  }) as Promise<T>;
}

export async function apiPut<T = any>(path: string, body?: any) {
  const isFormData = body instanceof FormData;
  return apiFetch(path, {
    method: "PUT",
    body: isFormData ? body : body === undefined ? undefined : JSON.stringify(body),
    headers: buildHeaders(undefined, !isFormData),
  }) as Promise<T>;
}

export async function apiDelete<T = any>(path: string, body?: any) {
  const isFormData = body instanceof FormData;
  return apiFetch(path, {
    method: "DELETE",
    body: isFormData ? body : body === undefined ? undefined : JSON.stringify(body),
    headers: buildHeaders(undefined, !!body && !isFormData),
  }) as Promise<T>;
}

/** -------------------------
 * High-level API functions
 * ------------------------- */
export async function postAuthGoogle(credential: string) {
  return apiPost("/api/auth/google", { credential });
}

export async function postLogout() {
  try {
    await apiPost("/api/auth/logout", {});
  } finally {
    clearToken();
  }
}

export type TransactionInput = {
  date: string; // YYYY-MM-DD
  amount: number;
  type: "income" | "expense";
  category?: string;
  note?: string;
  product_id?: number | string;
};

export async function addTransaction(tx: TransactionInput) {
  return apiPost("/api/add_transaction", tx);
}

export async function getTransactions(params?: { limit?: number; offset?: number }) {
  return apiGet("/api/transactions", params as any);
}

export async function getMonthly(year: number) {
  return apiGet("/api/monthly", { year });
}

export async function getLifetimeMetrics() {
  return apiGet("/api/lifetime_metrics");
}

export async function getProductRevenueLine() {
  return apiGet("/api/product_revenue_line");
}

export async function getStreamPerformance() {
  return apiGet("/api/stream_performance");
}

export async function getCryptoHoldings() {
  return apiGet("/api/crypto_holdings");
}

export async function getCryptoPrices(vs_currency = "idr", symbols = "btc") {
  return apiGet("/api/crypto_prices", { vs_currency, symbols });
}

/** -------------------------
 * Helpers
 * ------------------------- */
export async function tryApi<T = any>(fn: () => Promise<T>): Promise<[Error | null, T | null]> {
  try {
    const data = await fn();
    return [null, data];
  } catch (e: any) {
    return [e instanceof Error ? e : new Error(String(e)), null];
  }
}

/** -------------------------
 * Default export (legacy)
 * ------------------------- */
const defaultExport = {
  setToken,
  clearToken,
  currentToken,
  apiFetch,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  postAuthGoogle,
  postLogout,
  addTransaction,
  getTransactions,
  getMonthly,
  getLifetimeMetrics,
  getProductRevenueLine,
  getStreamPerformance,
  getCryptoHoldings,
  getCryptoPrices,
  tryApi,
  ApiError,
};

export default defaultExport;
