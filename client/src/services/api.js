/**
 * API client — JWT via Authorization header only (no CSRF).
 *
 * Next.js (or any cross-origin app): set NEXT_PUBLIC_API_URL to your API origin
 * (e.g. http://localhost:4000) and configure the API CORS allowlist (CLIENT_ORIGINS).
 * Always use credentials: "include" if you later add cookie-based features.
 *
 * Example (client component):
 *   await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
 *     method: "POST",
 *     credentials: "include",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({ email, password }),
 *   });
 */
const API_BASE = import.meta.env.VITE_API_URL || "/api";

function getToken() {
  return localStorage.getItem("token");
}

export async function downloadBlob(path, filename) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { headers, credentials: "include" });
  if (!res.ok) {
    const err = new Error("Download failed");
    err.status = res.status;
    throw err;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "document";
  a.click();
  URL.revokeObjectURL(url);
}

/** Authenticated GET returning a Blob (e.g. inline file preview). */
export async function fetchAuthorizedBlob(pathWithQuery) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${pathWithQuery}`, { headers, credentials: "include" });
  if (!res.ok) {
    let msg = "Could not load file";
    try {
      const t = await res.text();
      const j = t ? JSON.parse(t) : null;
      if (j?.error) msg = j.error;
    } catch {
      /* ignore */
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  const blob = await res.blob();
  return { blob, contentType: res.headers.get("content-type") || blob.type || "" };
}

export async function api(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: "include" });
  if (res.status === 204) return null;
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    let msg = data?.error || data?.message;
    if (!msg && Array.isArray(data?.errors) && data.errors.length) {
      msg = data.errors.map((e) => e.msg || e.message || String(e)).join(" ");
    }
    if (!msg) msg = res.statusText;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export { API_BASE, getToken };
