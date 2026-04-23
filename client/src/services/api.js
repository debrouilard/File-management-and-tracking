const API_BASE = import.meta.env.VITE_API_URL || "/api";

let csrfToken = null;

function getToken() {
  return localStorage.getItem("token");
}

export function resetCsrf() {
  csrfToken = null;
}

async function ensureCsrf() {
  if (csrfToken) return csrfToken;
  const res = await fetch(`${API_BASE}/auth/csrf`, { credentials: "include" });
  if (!res.ok) throw new Error("Could not load CSRF token");
  const data = await res.json();
  csrfToken = data.csrfToken;
  return csrfToken;
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

export async function api(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrf = await ensureCsrf();
    headers["X-CSRF-Token"] = csrf;
  }
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: "include" });
  if (res.status === 204) return null;
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data?.error || data?.message || res.statusText;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export { API_BASE, getToken };
