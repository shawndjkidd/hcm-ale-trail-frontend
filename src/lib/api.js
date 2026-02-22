import { API_BASE, TRAIL_ID, AUTH_TOKEN_STORAGE_KEY } from "../config";

const REFRESH_TOKEN_STORAGE_KEY = "hcm-refresh-token";

// --- token helpers ---
export function getAccessToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setTokens({ access_token, refresh_token } = {}) {
  try {
    if (access_token) localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, access_token);
    if (refresh_token) localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refresh_token);
  } catch {}
}

export function clearTokens() {
  try {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {}
}

function authHeaders(extra = {}) {
  const token = getAccessToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
}

async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: text || "Non-JSON response" };
  }
}

async function refreshIfPossible() {
  const refresh_token = getRefreshToken();
  if (!refresh_token) return { ok: false };

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });

  const data = await safeJson(res);
  if (!res.ok || !data?.ok) return { ok: false, error: data?.error || "Refresh failed" };

  setTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
  return { ok: true, access_token: data.access_token };
}

async function request(path, { method = "GET", body, headers } = {}, { retryOn401 = true } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: authHeaders({
      "Content-Type": "application/json",
      ...(headers || {}),
    }),
    body: body ? JSON.stringify(body) : undefined,
  });

  // If expired token, try refresh once then retry
  if (res.status === 401 && retryOn401) {
    const refreshed = await refreshIfPossible();
    if (refreshed.ok) {
      return request(path, { method, body, headers }, { retryOn401: false });
    }
  }

  const data = await safeJson(res);
  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    return { ok: false, status: res.status, error: msg, data };
  }

  return data;
}

// --- auth ---
export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: (email || "").trim(), password: password || "" }),
  });

  const data = await safeJson(res);
  if (!res.ok || !data?.ok) {
    return { ok: false, error: data?.error || "Login failed" };
  }

  setTokens({ access_token: data.access_token, refresh_token: data.refresh_token });
  return data;
}

export function logout() {
  clearTokens();
}

// --- trail endpoints ---
export function getTrailQr(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/qr`);
}

export function getBreweries(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/breweries`);
}

export function getEvents(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/events`);
}

export function getLeaderboard(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/leaderboard`);
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
