import { API_BASE, TRAIL_ID, AUTH_TOKEN_STORAGE_KEY } from "../config";

const REFRESH_TOKEN_STORAGE_KEY = "hcm-refresh-token";

export function getAccessToken() {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function setTokens({ access_token, refresh_token } = {}) {
  if (access_token) localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, access_token);
  if (refresh_token) localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refresh_token);
}

export function clearTokens() {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

function authHeaders(extra = {}) {
  const token = getAccessToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
}

async function rawRequest(path, { method = "GET", body, headers } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: authHeaders({
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    }),
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
}

export async function refreshAuth() {
  const refresh_token = getRefreshToken();
  if (!refresh_token) return { ok: false, error: "No refresh token" };

  const { res, data } = await rawRequest(`/auth/refresh`, {
    method: "POST",
    body: { refresh_token },
  });

  if (!res.ok || !data?.ok) return { ok: false, error: data?.error || "Refresh failed" };

  setTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  return data;
}

async function request(path, opts = {}) {
  const first = await rawRequest(path, opts);

  if (first.res.status !== 401) {
    if (!first.res.ok) throw new Error(first.data?.error || `Request failed (${first.res.status})`);
    return first.data;
  }

  const refreshed = await refreshAuth();
  if (!refreshed?.ok) {
    clearTokens();
    throw new Error(refreshed?.error || "Unauthorized");
  }

  const second = await rawRequest(path, opts);
  if (!second.res.ok) throw new Error(second.data?.error || `Request failed (${second.res.status})`);
  return second.data;
}

export async function apiLogin(email, password) {
  const { res, data } = await rawRequest(`/auth/login`, {
    method: "POST",
    body: { email, password },
  });

  if (!res.ok || !data?.ok) throw new Error(data?.error || "Login failed");

  setTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  return data;
}

export function apiLogout() {
  clearTokens();
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
