// src/lib/api.ts
// Cookie-first API wrapper for M4 Tracker
// - prevents sending stale Google ID tokens from localStorage
// - forces credentials: 'include' so server session cookie (m4_session) is used
// - exposes helpers apiGet/apiPost and token helpers for compat

type Json = Record<string, any> | null;

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  "http://127.0.0.1:8124";

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
 * Token helpers (kept for compatibility)
 * ------------------------- */
export function setToken(token: string | null) {
  // keep for backward-compat but avoid using it for normal API calls.
  try {
    if (token === null || token === undefined) {
      localStorage.removeItem("google_id_token");
    } else {
      localStorage.setItem("google_id_token", token);
    }
  } catch (e) {
    if ((import.meta as any).env?.DEV) {
      console.warn("[api] setToken error", e);
    }
  }
}

export function clearToken() {
  try {
    localStorage.removeItem("google_id_token");
  } catch (e) {
    if ((import.meta as any).env?.DEV)
      console.warn("[api] clearToken error", e);
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
  if (path.startsWith("http://") || path.startsWith("https://"))
    return path;
  if (!path.startsWith("/")) path = `/${path}`;
  return `${API_BASE}${path}`;
}

function buildHeaders(
  extra?: HeadersInit,
  jsonBody = false,
): Headers {
  // Do NOT automatically inject Authorization header.
  // If a caller really needs to send a bearer token (rare),
  // they must explicitly pass it in init.headers.
  const headers = new Headers(extra || {});
  if (jsonBody && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
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
      (payload &&
        (typeof payload === "object"
          ? (payload as any).error || (payload as any).message
          : payload)) ||
      res.statusText ||
      "API error";
    // dispatch unauthorized event on 401 to let UI handle re-login
    if (res.status === 401) {
      try {
        window.dispatchEvent(
          new CustomEvent("api:unauthorized", {
            detail: { status: 401 },
          }),
        );
      } catch (e) {}
    }
    throw new ApiError(String(msg), res.status, payload);
  }
  return payload;
}

/** -------------------------
 * Low-level fetch wrapper
 * - uses credentials: 'include' (cookie)
 * - does NOT inject Authorization header automatically
 * ------------------------- */
export async function apiFetch(
  path: string,
  opts: RequestInit = {},
) {
  const API_BASE =
    import.meta.env.VITE_API_BASE || "http://127.0.0.1:8124";
  const url = `${API_BASE}${path}`;

  const headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };

  const baseOpts: RequestInit = {
    credentials: "include", // ensure cookie sent
    ...opts,
    headers, // put headers last so opts.headers can override specific keys
  };

  const res = await fetch(url, baseOpts);
  
  // Dispatch 401 event for session expiry handling
  if (res.status === 401) {
    try {
      window.dispatchEvent(
        new CustomEvent("api:unauthorized", {
          detail: { status: 401, path },
        }),
      );
    } catch (e) {
      console.warn("[apiFetch] failed to dispatch unauthorized event", e);
    }
  }
  
  return res;
}

/** -------------------------
 * Convenience HTTP helpers
 * ------------------------- */
export async function apiGet<T = any>(
  path: string,
  query?: Record<string, string | number | boolean>,
) {
  const q = query
    ? "?" +
      Object.entries(query)
        .map(
          ([k, v]) =>
            `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
        )
        .join("&")
    : "";
  const res = await apiFetch(path + q);
  return handleResponse(res) as Promise<T>;
}

export async function apiPost<T = any>(
  path: string,
  body?: any,
) {
  const isFormData = body instanceof FormData;
  const res = await apiFetch(path, {
    method: "POST",
    body: isFormData
      ? body
      : body === undefined
        ? undefined
        : JSON.stringify(body),
    headers: buildHeaders(undefined, !isFormData),
  });
  return handleResponse(res) as Promise<T>;
}

export async function apiPut<T = any>(
  path: string,
  body?: any,
) {
  const isFormData = body instanceof FormData;
  const res = await apiFetch(path, {
    method: "PUT",
    body: isFormData
      ? body
      : body === undefined
        ? undefined
        : JSON.stringify(body),
    headers: buildHeaders(undefined, !isFormData),
  });
  return handleResponse(res) as Promise<T>;
}

export async function apiDelete<T = any>(
  path: string,
  body?: any,
) {
  const isFormData = body instanceof FormData;
  const res = await apiFetch(path, {
    method: "DELETE",
    body: isFormData
      ? body
      : body === undefined
        ? undefined
        : JSON.stringify(body),
    headers: buildHeaders(undefined, !!body && !isFormData),
  });
  return handleResponse(res) as Promise<T>;
}

/** -------------------------
 * High-level API functions (examples - keep as before)
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

/** -------------------------
 * Helpers
 * ------------------------- */
export async function tryApi<T = any>(
  fn: () => Promise<T>,
): Promise<[Error | null, T | null]> {
  try {
    const data = await fn();
    return [null, data];
  } catch (e: any) {
    return [
      e instanceof Error ? e : new Error(String(e)),
      null,
    ];
  }
}

/** -------------------------
 * Default export (compat)
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
  tryApi,
  ApiError,
};

export default defaultExport;