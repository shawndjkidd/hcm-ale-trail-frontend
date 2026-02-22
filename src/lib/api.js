import { API_BASE, TRAIL_ID, AUTH_TOKEN_STORAGE_KEY } from "../config";

const REFRESH_TOKEN_KEY = "hcm-refresh-token";
const EXPIRES_AT_KEY = "hcm-expires-at"; // unix seconds

function getStoredAuth() {
  try {
    const access_token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "";
    const refresh_token = localStorage.getItem(REFRESH_TOKEN_KEY) || "";
    const expires_at_raw = localStorage.getItem(EXPIRES_AT_KEY) || "";
    const expires_at = expires_at_raw ? Number(expires_at_raw) : null;
    return { access_token, refresh_token, expires_at };
  } catch {
    return { access_token: "", refresh_token: "", expires_at: null };
  }
}

function setStoredAuth({ access_token, refresh_token, expires_at } = {}) {
  try {
    if (access_token) localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, access_token);
    if (refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
    if (typeof expires_at === "number" && Number.isFinite(expires_at)) {
      localStorage.setItem(EXPIRES_AT_KEY, String(expires_at));
    }
  } catch {}
}

export async function refreshAccessToken() {
  const { refresh_token } = getStoredAuth();
  if (!refresh_token) return { ok: false, error: "Missing refresh token" };

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) return { ok: false, error: data?.error || "Refresh failed" };

  setStoredAuth({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
  });

  return { ok: true, access_token: data.access_token };
}

export async function getAccessToken({ forceRefresh = false } = {}) {
  const { access_token, refresh_token, expires_at } = getStoredAuth();
  if (!refresh_token) return access_token || "";

  const nowSec = Math.floor(Date.now() / 1000);
  if (!forceRefresh && expires_at && nowSec < expires_at - 60) return access_token || "";

  const r = await refreshAccessToken();
  if (r.ok && r.access_token) return r.access_token;
  return access_token || "";
}

async function request(path, { method = "GET", body, headers } = {}) {
  let token = await getAccessToken({ forceRefresh: false });

  const doFetch = async (useToken) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
        ...(useToken ? { Authorization: `Bearer ${useToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: false, error: text || "Non-JSON response" };
    }
    return { res, data };
  };

  let { res, data } = await doFetch(token);

  if (res.status === 401) {
    const { refresh_token } = getStoredAuth();
    if (refresh_token) {
      const refreshed = await getAccessToken({ forceRefresh: true });
      if (refreshed && refreshed !== token) {
        token = refreshed;
        ({ res, data } = await doFetch(token));
      }
    }
  }

  if (!res.ok) {
    const msg = data?.error || data?.msg || data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

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

export function logout() {
  try {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
  } catch {}
}

export function storeLoginTokens(loginResponse) {
  if (!loginResponse?.ok) return;
  setStoredAuth({
    access_token: loginResponse.access_token,
    refresh_token: loginResponse.refresh_token,
    expires_at: loginResponse.expires_at,
  });
}
