import { API_BASE, TRAIL_ID } from "../config";

const ACCESS_KEY = "hcm-access-token";
const REFRESH_KEY = "hcm-refresh-token";
const EXPIRES_AT_KEY = "hcm-expires-at"; // unix seconds (optional)

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setTokens({ access_token, refresh_token, expires_at } = {}) {
  try {
    if (access_token) localStorage.setItem(ACCESS_KEY, access_token);
    if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token);
    if (expires_at) localStorage.setItem(EXPIRES_AT_KEY, String(expires_at));
  } catch {}
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
  } catch {}
}

/**
 * Client-side logout: clears stored auth tokens.
 */
export function logout() {
  clearTokens();
}

async function refreshAccessToken() {
  const refresh_token = getRefreshToken();
  if (!refresh_token) return { ok: false, error: "Missing refresh token" };

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });

  const text = await res.text();
  const data = safeJsonParse(text) || { ok: false, error: text || "Non-JSON response" };

  if (!res.ok || !data?.ok || !data?.access_token) {
    return { ok: false, error: data?.error || `Refresh failed (${res.status})` };
  }

  setTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
  });

  return { ok: true, access_token: data.access_token };
}

// Adds Authorization header if you stored a Supabase access token in localStorage.
function authHeaders(extra = {}) {
  const token = getAccessToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
}

async function request(path, { method = "GET", body, headers } = {}, _retry = false) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: authHeaders({
      "Content-Type": "application/json",
      ...(headers || {}),
    }),
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = safeJsonParse(text) || { ok: false, error: text || "Non-JSON response" };

  // If unauthorized, try refresh once and retry the original request
  if (res.status === 401 && !_retry && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed?.ok) {
      return request(path, { method, body, headers }, true);
    } else {
      clearTokens();
      return { ok: false, error: "Unauthorized" };
    }
  }

  if (!res.ok) {
    return { ok: false, error: data?.error || `Request failed (${res.status})`, status: res.status, data };
  }

  return data;
}

/**
 * Auth helpers (optional, but handy)
 */
export async function login(email, password) {
  const res = await request(`/auth/login`, {
    method: "POST",
    body: { email, password },
  });

  if (res?.ok && res?.access_token) {
    setTokens({
      access_token: res.access_token,
      refresh_token: res.refresh_token,
      expires_at: res.expires_at,
    });
  }

  return res;
}

/**
 * API endpoints
 */
export function getBreweries(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/breweries`);
}

export function getMe(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/me`);
}

export function getMyRatings(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/me/ratings`);
}

export function claimHat(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/me/claim-hat`, { method: "POST" });
}

export function getBreweryDetail(trailId = TRAIL_ID, breweryId) {
  return request(`/trails/${trailId}/breweries/${breweryId}`);
}

export function postCheckin(trailId = TRAIL_ID, breweryId, payload) {
  return request(`/trails/${trailId}/breweries/${breweryId}/checkin`, {
    method: "POST",
    body: payload || {},
  });
}

export function postRating(trailId = TRAIL_ID, breweryId, payload) {
  return request(`/trails/${trailId}/breweries/${breweryId}/ratings`, {
    method: "POST",
    body: payload || {},
  });
}