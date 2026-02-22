import { API_BASE, TRAIL_ID, AUTH_TOKEN_STORAGE_KEY } from "../config";

// Adds Authorization header if you stored a Supabase access token in localStorage.
function authHeaders(extra = {}) {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  return token
    ? { ...extra, Authorization: `Bearer ${token}` }
    : { ...extra };
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
    throw new Error(msg);
  }
  return data;
}

// ---- Public (no auth needed)
export function fetchBreweries(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/breweries`);
}

export function fetchTrailEvents(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/events`);
}

export function fetchBrewery(trailId = TRAIL_ID, breweryId) {
  return request(`/trails/${trailId}/breweries/${breweryId}`);
}

export function fetchTrailQr(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/qr`);
}

// ---- Auth required (needs token in localStorage)
export function fetchMe(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/me`);
}

export function joinTrail(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/join`, { method: "POST" });
}

export function checkin(trailId = TRAIL_ID, breweryId, payload) {
  return request(`/trails/${trailId}/breweries/${breweryId}/checkin`, {
    method: "POST",
    body: payload || {},
  });
}

export function rateBeer(trailId = TRAIL_ID, breweryId, payload) {
  return request(`/trails/${trailId}/breweries/${breweryId}/ratings`, {
    method: "POST",
    body: payload,
  });
}

export function fetchMyRatings(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/me/ratings`);
}

export function fetchLeaderboard(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/leaderboard`);
}
