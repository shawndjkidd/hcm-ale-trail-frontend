// src/lib/api.js
import { API_BASE, TRAIL_ID, AUTH_TOKEN_STORAGE_KEY } from "../config";

// Adds Authorization header if you stored a Supabase access token in localStorage.
function authHeaders(extra = {}) {
  // localStorage only exists in browser
  let token = null;
  try {
    token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {}
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
}

async function request(path, { method = "GET", body, headers } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: authHeaders({
      "Content-Type": "application/json",
      ...(headers || {}),
    }),
    body: body ? JSON.stringify(body) : undefined,
  });

  // Try to parse JSON, but don’t explode if backend returns HTML
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { ok: false, error: text || "Non-JSON response" };
  }

  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// -------------------------
// Trail-level endpoints
// -------------------------
export function health() {
  return request(`/health`);
}

export function getTrailQr(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/qr`);
}

export function getBreweries(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/breweries`);
}

// -------------------------
// Authenticated endpoints
// -------------------------
export function getMe(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/me`);
}

export function getMyRatings(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/me/ratings`);
}

export function claimHat(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/me/claim-hat`, { method: "POST" });
}

// -------------------------
// Brewery endpoints
// -------------------------
export function getBrewery(trailId = TRAIL_ID, breweryId) {
  return request(`/trails/${trailId}/breweries/${breweryId}`);
}

export function checkinWithManualCode(trailId = TRAIL_ID, breweryId, code) {
  return request(`/trails/${trailId}/breweries/${breweryId}/checkin`, {
    method: "POST",
    body: { method: "manual_code", code },
  });
}

// If you later enable QR validation routes, you can swap this
// to call /qr or /qr.png endpoints.
export function checkinWithQr(trailId = TRAIL_ID, breweryId, payload = {}) {
  return request(`/trails/${trailId}/breweries/${breweryId}/checkin`, {
    method: "POST",
    body: { method: "qr_scan", ...payload },
  });
}

export function submitRating(trailId = TRAIL_ID, breweryId, { beer_name, rating, notes }) {
  return request(`/trails/${trailId}/breweries/${breweryId}/ratings`, {
    method: "POST",
    body: { beer_name, rating, notes },
  });
}