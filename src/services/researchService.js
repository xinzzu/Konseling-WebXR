/**
 * researchService — Akses dashboard riset (protected JWT peneliti).
 *   POST /api/auth/login            → { token, expiresAt }
 *   GET  /api/research/summary      → statistik agregat
 *   GET  /api/research/data         → baris lengkap
 *   GET  /api/research/export.csv   → unduhan CSV (Excel, BOM)
 * Token simpan di localStorage (kunci: konseling_research_token).
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3100";
const TOKEN_KEY = "konseling_research_token";

export const UNAUTHORIZED_MESSAGE = "UNAUTHORIZED";

function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage tidak tersedia → abaikan
  }
}

function authHeaders(extra = {}) {
  const token = getStoredToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: authHeaders({ "Content-Type": "application/json" }),
    ...options,
  });
  if (res.status === 401) {
    setStoredToken(null);
    throw new Error(UNAUTHORIZED_MESSAGE);
  }
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.message || `HTTP ${res.status} — ${path}`);
  }
  return res.json();
}

function buildQuery(filters = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function login(username, password) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setStoredToken(data.token);
  return data;
}

export async function fetchSummary(filters = {}) {
  return request(`/api/research/summary${buildQuery(filters)}`);
}

export async function fetchData(filters = {}) {
  const data = await request(`/api/research/data${buildQuery(filters)}`);
  return data.rows || [];
}

export async function downloadCsv(filters = {}, raw = false) {
  const query = buildQuery({ ...filters, raw: raw ? "1" : undefined });
  const res = await fetch(`${API_BASE_URL}/api/research/export.csv${query}`, {
    headers: authHeaders(),
  });
  if (res.status === 401) {
    setStoredToken(null);
    throw new Error(UNAUTHORIZED_MESSAGE);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} — export.csv`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `riset-${new Date().toISOString().slice(0, 10)}-${raw ? "raw" : "ringkas"}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function isLoggedIn() {
  return !!getStoredToken();
}

export default {
  login,
  fetchSummary,
  fetchData,
  downloadCsv,
  isLoggedIn,
  setStoredToken,
  UNAUTHORIZED_MESSAGE,
};