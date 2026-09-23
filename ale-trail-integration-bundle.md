# HCM Ale Trail — Integration Bundle

Two apps, both deployed on Vercel, sharing one Supabase Postgres DB.
- FRONTEND: React + Vite  (repo: hcm-ale-trail-frontend)
- BACKEND: Next.js App Router, TypeScript (repo: hcm-ale-trail-backend)
- Frontend calls backend ONLY via relative /api/* paths; Vercel rewrites proxy them.

## Backend API route tree
```
/admin/auth/change-password
/admin/breweries/[breweryId]
/admin/breweries/[breweryId]/beers
/admin/breweries/[breweryId]/beers/[beerId]
/admin/breweries/[breweryId]/beers/bulk
/admin/breweries/[breweryId]/dashboard
/admin/breweries/[breweryId]/events
/admin/breweries/[breweryId]/hours
/admin/breweries/[breweryId]/merchandise
/admin/breweries/[breweryId]/merchandise/[merchId]/pickup
/admin/breweries/[breweryId]/merchandise/[merchId]/restock
/admin/breweries/[breweryId]/merge-ratings
/admin/breweries/[breweryId]/pin
/admin/breweries/[breweryId]/staff
/admin/breweries/[breweryId]/staff/[staffId]
/admin/events
/admin/events/[eventId]
/admin/me
/admin/side-quests/[questId]
/admin/super-admins
/admin/super-admins/[userId]
/admin/trails/[trailId]/analytics
/admin/trails/[trailId]/breweries
/admin/trails/[trailId]/events
/admin/trails/[trailId]/leaderboard
/admin/trails/[trailId]/merchandise
/admin/trails/[trailId]/merchandise/[merchId]
/admin/trails/[trailId]/merge-suggestions
/admin/trails/[trailId]/overview
/admin/trails/[trailId]/participants/export
/admin/trails/[trailId]/ratings
/admin/trails/[trailId]/side-quests
/auth/change-email
/auth/change-password
/auth/google
/auth/login
/auth/refresh
/auth/register
/breweries/[breweryId]/events
/checkin
/checkins
/health
/side-quests/[questId]/checkin
/side-quests/checkin
/trails/[trailId]/breweries
/trails/[trailId]/breweries/[breweryId]
/trails/[trailId]/breweries/[breweryId]/beers
/trails/[trailId]/breweries/[breweryId]/checkin
/trails/[trailId]/breweries/[breweryId]/qr
/trails/[trailId]/breweries/[breweryId]/qr.png
/trails/[trailId]/breweries/[breweryId]/ratings
/trails/[trailId]/events
/trails/[trailId]/join
/trails/[trailId]/leaderboard
/trails/[trailId]/me
/trails/[trailId]/me/claim-hat
/trails/[trailId]/me/merchandise
/trails/[trailId]/me/merchandise/[merchId]/claim
/trails/[trailId]/me/new-run
/trails/[trailId]/me/ratings
/trails/[trailId]/me/reset-card
/trails/[trailId]/nudges
/trails/[trailId]/nudges/scan
/trails/[trailId]/nudges/seen
/trails/[trailId]/qr
/trails/[trailId]/side-quests
/trails/[trailId]/side-quests/[questId]/qr
/untappd/disconnect
/untappd/oauth/callback
/untappd/oauth/start
/user/profile
/users/me
```

## hcm-ale-trail-frontend/package.json
```
{
  "name": "hcm-ale-trail-v2",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.95.3",
    "html5-qrcode": "^2.3.8",
    "leaflet": "^1.9.4",
    "qrcode": "^1.5.4",
    "qrcode.react": "^4.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-leaflet": "^4.2.1",
    "recharts": "^2.12.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}
```

## hcm-ale-trail-frontend/vite.config.js
```
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev proxy so localhost can call backend without CORS issues.
// Any request to /api/* will be forwarded to the backend.
const BACKEND = "https://hcm-ale-trail-backend-flm8.vercel.app";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: BACKEND,
        changeOrigin: true,
        secure: true,
        // Keep path exactly the same: /api/... -> /api/...
        // If you ever see double /api/api, we can adjust rewrite.
      },
    },
  },
});
```

## hcm-ale-trail-frontend/vercel.json
```
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://hcm-ale-trail-backend-flm8.vercel.app/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(self), geolocation=(self), microphone=()"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' blob:; connect-src 'self' https://gfubghgsrehabqanaosp.supabase.co wss://gfubghgsrehabqanaosp.supabase.co; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
        }
      ]
    }
  ]
}
```

## hcm-ale-trail-frontend/src/config.js
```
// src/config.js

// Keep this centralized so the app doesn't have random hardcoded IDs everywhere.
export const TRAIL_ID = "89e5e2d6-090b-448a-8e53-6d05b731a921";

// We're using Vercel rewrites so frontend can call backend via same-origin /api.
export const API_BASE = "/api";

// Optional: store a Supabase JWT access token here for "real mode" /me + checkins.
// Set it in browser DevTools console:
// localStorage.setItem('hcm-access-token', '<PASTE_TOKEN>')
export const AUTH_TOKEN_STORAGE_KEY = "hcm-access-token";

// Set to true to re-enable the Untappd OAuth integration UI.
// When false, hides the post-signup onboarding overlay, the Settings tile, and
// the cross-post checkbox in AddBeerModal. All Untappd state and API code stays intact.
export const SHOW_UNTAPPD_INTEGRATION = false;
```

## hcm-ale-trail-frontend/src/lib/api.js
```
import { API_BASE, TRAIL_ID } from "../config";
import { supabase } from "./supabase";

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

// Adds Authorization: Bearer if a token is stored; otherwise falls back to
// X-User-Id so the backend can identify the caller from the client-stored user.
function authHeaders(extra = {}) {
  const token = getAccessToken();
  if (token) return { ...extra, Authorization: `Bearer ${token}` };

  try {
    const u = JSON.parse(localStorage.getItem("hcm-user") || "null");
    if (u?.id) return { ...extra, "X-User-Id": u.id };
  } catch {}

  return { ...extra };
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
    // Seed the Supabase client so it owns a real, auto-refreshing session.
    // Without this, supabase.auth.getSession() returns null for email/password
    // users and token-dependent flows (e.g. check-in PIN) 401 after ~1 hour.
    try {
      await supabase.auth.setSession({
        access_token: res.access_token,
        refresh_token: res.refresh_token,
      });
    } catch {}
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

export function getMyMerchandise(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/me/merchandise`);
}

export function claimMerchandise(merchId, breweryId, code, trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/me/merchandise/${merchId}/claim`, {
    method: "POST",
    body: { brewery_id: breweryId, code },
  });
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

export function getLeaderboard(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/leaderboard`);
}

/**
 * Start a new run - archives current progress and creates fresh participant
 */
export function startNewRun(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/me/new-run`, { method: "POST" });
}

/**
 * Back-compat helper (older AuthModal expects this).
 * Stores tokens returned by /api/auth/login.
 */
export function changePassword(currentPassword, newPassword) {
  return request(`/auth/change-password`, {
    method: "POST",
    body: { currentPassword, newPassword },
  });
}

export function changeEmail(newEmail) {
  return request(`/auth/change-email`, {
    method: "POST",
    body: { email: newEmail },
  });
}

// --- Nudge / Milestone APIs ---
export function getUnseenNudges(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/nudges`);
}

export function markNudgesSeen(nudgeIds, trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/nudges/seen`, {
    method: "POST",
    body: { nudgeIds },
  });
}

export function saveOnboardingProfile(profileData) {
  return request(`/user/profile`, {
    method: "POST",
    body: profileData,
  });
}

// --- User Me ---
export function getUserMe() {
  return request(`/user/me`);
}

export function patchUserMe(payload) {
  return request(`/user/me`, {
    method: "PATCH",
    body: payload,
  });
}

export function postResetCard(trailId = TRAIL_ID) {
  return request(`/trails/${trailId}/me/reset-card`, { method: "POST" });
}

export function disconnectUntappd() {
  return request(`/user/untappd/disconnect`, { method: "POST" });
}

export function serverCheckin(payload) {
  return request(`/checkin`, { method: "POST", body: payload });
}

export function storeLoginTokens(data) {
  if (data?.access_token) {
    setTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
    });
  }
}
```

## hcm-ale-trail-frontend/src/lib/supabase.js
```
import { createClient } from '@supabase/supabase-js';
import { TRAIL_ID } from '../config';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Re-export TRAIL_ID for backwards compatibility
export { TRAIL_ID };

// Map frontend brewery IDs (1-8) to Supabase UUIDs
const BREWERY_MAP = {
  1: '8c3dc4f3-e100-4d63-be0e-ee8b65da8fe8', // BiaCraft
  2: '3f80a715-b664-423d-a04d-3d22fcdeb335', // Heart of Darkness
  3: '6b29d3f2-6b0e-4404-af89-40d7bc7482c5', // Deme
  4: 'c1fb805f-4010-4e8c-85cf-634f6a681308', // Steersman
  5: 'f094c3fc-e07d-4678-919a-923a6b805028', // East West Brewing
  6: '1ba7a599-f91c-425d-98e7-275dd0efbb06', // Rooster Beers
  7: 'd098db66-258b-445e-ad92-c0e769b4270c', // 7 Bridges Brewing Co.
  8: '64393821-1783-4892-8b18-019898d170ce', // Belgo Saigon
};

// Reverse map: UUID to frontend ID
const BREWERY_REVERSE_MAP = Object.fromEntries(
  Object.entries(BREWERY_MAP).map(([k, v]) => [v, parseInt(k)])
);

// Register a new participant
export async function registerParticipant(data) {
  const { name, email, dateOfBirth, country, gender } = data;
  
  // Check if email already exists
  const { data: existingUsers, error: checkError } = await supabase
    .from('participants')
    .select('*')
    .eq('email', email.toLowerCase());
  
  // If user already exists, return their data
  if (existingUsers && existingUsers.length > 0) {
    return { data: existingUsers[0], error: null, isExisting: true };
  }
  
  // Extract birth year from date
  const birthYear = new Date(dateOfBirth).getFullYear();
  
  // Create new participant
  const { data: participant, error } = await supabase
    .from('participants')
    .insert({
      trail_id: TRAIL_ID,
      display_name: name,
      email: email.toLowerCase(),
      birth_year: birthYear,
      home_country: country || null,
      country: country || null,
      gender: gender || null,
    })
    .select()
    .single();
  
  if (error) {
    console.log('Insert error details:', error);
  }
  
  return { data: participant, error, isExisting: false };
}

// Record a check-in (stamp)
// frontendBreweryId can be either an integer key (1-8) OR a UUID string from the API
export async function recordCheckin(participantId, frontendBreweryId, method = 'qr_scan') {
  // Try integer key first, then fall back to treating it as a direct UUID
  let breweryUUID = BREWERY_MAP[frontendBreweryId];
  if (!breweryUUID && typeof frontendBreweryId === 'string' && frontendBreweryId.includes('-')) {
    breweryUUID = frontendBreweryId;
  }

  if (!breweryUUID) {
    console.log('Invalid brewery ID:', frontendBreweryId);
    return { data: null, error: { message: 'Invalid brewery ID' }, isExisting: false };
  }

  // Ensure the Supabase client has an active session so RLS auth.uid() resolves.
  // Google OAuth users already have one; email/password users stored their JWT
  // under a custom localStorage key and need it hydrated into the client.
  let authedUid = null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      authedUid = session.user.id;
    } else {
      const accessToken = localStorage.getItem('hcm-access-token');
      const refreshToken = localStorage.getItem('hcm-refresh-token');
      if (accessToken && refreshToken) {
        const { data: { session: s } } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        authedUid = s?.user?.id ?? null;
      }
    }
  } catch {}

  if (!authedUid) {
    console.log('Check-in fallback skipped: no auth session');
    return { data: null, error: { message: 'No auth session for direct check-in' }, isExisting: false };
  }

  // Check if already checked in — filter by user_id (what the RLS USING policy sees)
  const { data: existingCheckins } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', authedUid)
    .eq('brewery_id', breweryUUID);

  if (existingCheckins && existingCheckins.length > 0) {
    return { data: existingCheckins[0], error: null, isExisting: true };
  }

  // Create new check-in; user_id must be set to satisfy RLS WITH CHECK
  const { data, error } = await supabase
    .from('checkins')
    .insert({
      participant_id: participantId,
      brewery_id: breweryUUID,
      trail_id: TRAIL_ID,
      method: method,
      checked_in_at: new Date().toISOString(),
      user_id: authedUid,
    })
    .select()
    .single();

  if (error) {
    console.log('Check-in insert error:', error);
  } else {
    console.log('Check-in saved:', breweryUUID, data);
  }

  return { data, error, isExisting: false };
}

// Get participant's check-ins (returns frontend IDs 1-8)
export async function getParticipantCheckins(participantId) {
  const { data: checkins, error } = await supabase
    .from('checkins')
    .select('brewery_id')
    .eq('participant_id', participantId);
  
  if (error || !checkins) {
    return { data: [], error };
  }
  
  // Convert UUIDs to frontend IDs (1-8)
  const stamps = checkins
    .map(c => BREWERY_REVERSE_MAP[c.brewery_id])
    .filter(id => id !== undefined);
  
  return { data: stamps, error: null };
}

// Reset password using a recovery token from a Supabase password-reset email
export async function resetPassword(accessToken, refreshToken, newPassword) {
  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (sessionError) return { ok: false, error: sessionError.message };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

// Get participant by email
export async function getParticipantByEmail(email) {
  const { data: participants, error } = await supabase
    .from('participants')
    .select('*')
    .eq('email', email.toLowerCase());
  
  if (participants && participants.length > 0) {
    return { data: participants[0], error: null };
  }
  
  return { data: null, error };
}```

## hcm-ale-trail-frontend/src/admin/adminApi.js
```
export const API_BASE = '';
export const TRAIL_ID = '89e5e2d6-090b-448a-8e53-6d05b731a921';

function getToken() {
  return (
    localStorage.getItem('hcm-admin-token') ||
    sessionStorage.getItem('hcm-admin-token') ||
    localStorage.getItem('admin_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token')
  );
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

// ==================== AUTH ====================

export async function getAdminMe() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/me`, { headers: authHeaders() });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ==================== HQ DASHBOARD ====================

export async function getTrailAnalytics(trailId, scope = 'trail', breweryId = null) {
  try {
    let url = `${API_BASE}/api/admin/trails/${trailId}/analytics?scope=${scope}`;
    if (breweryId) url += `&bid=${breweryId}`;
    const res = await fetch(url, { headers: authHeaders() });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function getTrailOverview(trailId, from, to) {
  try {
    let url = `${API_BASE}/api/admin/trails/${trailId}/overview`;
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (params.toString()) url += `?${params.toString()}`;
    const res = await fetch(url, { headers: authHeaders() });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function getAdminLeaderboard(trailId, limit = 50) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/trails/${trailId}/leaderboard?limit=${limit}`, { headers: authHeaders() });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function exportParticipants(trailId, format = 'json', from, to) {
  try {
    let url = `${API_BASE}/api/admin/trails/${trailId}/participants/export?format=${format}`;
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;
    const res = await fetch(url, { headers: authHeaders() });
    if (format === 'csv') {
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/csv' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `participants-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      return { ok: true };
    }
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ==================== EVENTS ====================

export async function getTrailEvents(trailId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/trails/${trailId}/events`, { headers: authHeaders() });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function createTrailEvent(trailId, eventData) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/trails/${trailId}/events`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(eventData)
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function getBreweryEvents(breweryId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/breweries/${breweryId}/events`, { headers: authHeaders() });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function createBreweryEvent(breweryId, eventData) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/breweries/${breweryId}/events`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(eventData)
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function updateEvent(eventId, patch) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/events/${eventId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(patch)
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function deleteEvent(eventId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/events/${eventId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ==================== BREWERY DASHBOARD ====================

export async function getBreweryDashboard(breweryId, from, to) {
  try {
    let url = `${API_BASE}/api/admin/breweries/${breweryId}/dashboard`;
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (params.toString()) url += `?${params.toString()}`;
    const res = await fetch(url, { headers: authHeaders() });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function updateBreweryPin(breweryId, pin) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/breweries/${breweryId}/pin`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ pin })
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function updateBreweryHours(breweryId, operatingHours) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/breweries/${breweryId}/hours`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ operating_hours: operatingHours })
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ==================== BREWERY MANAGEMENT (HQ) ====================

export async function getTrailBreweries(trailId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/trails/${trailId}/breweries`, { headers: authHeaders() });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function createBrewery(trailId, breweryData) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/trails/${trailId}/breweries`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(breweryData)
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function updateBrewery(breweryId, breweryData) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/breweries/${breweryId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(breweryData)
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function deleteBrewery(breweryId, hard = false) {
  try {
    const url = hard 
      ? `${API_BASE}/api/admin/breweries/${breweryId}?hard=1`
      : `${API_BASE}/api/admin/breweries/${breweryId}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ==================== SIDE QUESTS ====================

export async function getSideQuests(trailId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/trails/${trailId}/side-quests`, { headers: authHeaders() });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function createSideQuest(trailId, questData) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/trails/${trailId}/side-quests`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(questData)
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function updateSideQuest(questId, questData) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/side-quests/${questId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(questData)
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function deleteSideQuest(questId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/side-quests/${questId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ==================== BREWERY BEERS ====================

export async function getBreweryBeers(breweryId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/breweries/${breweryId}/beers`, { headers: authHeaders() });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function createBreweryBeer(breweryId, beerData) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/breweries/${breweryId}/beers`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(beerData)
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function updateBreweryBeer(breweryId, beerId, beerData) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/breweries/${breweryId}/beers/${beerId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(beerData)
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function bulkUploadBeers(breweryId, beers) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/breweries/${breweryId}/beers/bulk`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ beers })
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function deleteBreweryBeer(breweryId, beerId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/breweries/${breweryId}/beers/${beerId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function mergeRatings(breweryId, oldName, newName) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/breweries/${breweryId}/merge-ratings`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ oldName, newName })
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function getMergeSuggestions(trailId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/trails/${trailId}/merge-suggestions`, { headers: authHeaders() });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ==================== BEER RATINGS ====================

export async function getTrailBeerRatings(trailId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/trails/${trailId}/ratings`, { headers: authHeaders() });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ==================== BREWERY STAFF ====================

export async function createBreweryStaff(breweryId, email, password) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/breweries/${breweryId}/create-login`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email, password })
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function getBreweryLogin(breweryId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/breweries/${breweryId}/login`, { headers: authHeaders() });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ==================== ACCOUNT SETTINGS ====================

export async function updateAdminAccount({ email, currentPassword, password }) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/account`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ email, currentPassword, password })
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ==================== MERCHANDISE / STOCK ====================

export async function getTrailMerchandise(trailId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/trails/${trailId}/merchandise`, { headers: authHeaders() });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function createMerchandiseItem(trailId, itemData) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/trails/${trailId}/merchandise`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(itemData)
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function updateMerchandiseItem(trailId, merchId, itemData) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/trails/${trailId}/merchandise/${merchId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(itemData)
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function deleteMerchandiseItem(trailId, merchId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/trails/${trailId}/merchandise/${merchId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function getBreweryMerchandise(breweryId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/breweries/${breweryId}/merchandise`, { headers: authHeaders() });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function restockMerchandise(breweryId, merchId, quantity, notes) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/breweries/${breweryId}/merchandise/${merchId}/restock`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ quantity, notes })
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function recordMerchPickup(breweryId, merchId, participantId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/breweries/${breweryId}/merchandise/${merchId}/pickup`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ participant_id: participantId })
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ==================== SUPER ADMINS ====================

export async function getSuperAdmins() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/super-admins`, { headers: authHeaders() });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function addSuperAdmin(email) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/super-admins`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function removeSuperAdmin(id) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/super-admins/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ==================== BREWERY STAFF ====================

export async function getBreweryStaff(breweryId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/breweries/${breweryId}/staff`, { headers: authHeaders() });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function inviteBreweryStaff(breweryId, email, role) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/breweries/${breweryId}/staff`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email, role }),
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function updateBreweryStaffRole(breweryId, staffId, role) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/breweries/${breweryId}/staff/${staffId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ role }),
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function removeBreweryStaff(breweryId, staffId) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/breweries/${breweryId}/staff/${staffId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function changeAdminPassword(currentPassword, newPassword) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/auth/change-password`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return await res.json();
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ==================== LOGIN / SESSION ====================

const SESSION_KEYS = ['hcm-admin-token', 'hcm-admin-refresh', 'hcm-admin-expires', 'hcm-admin-remember'];
const LEGACY_KEYS  = ['admin_token', 'token', 'access_token'];

function sessionStorage_() {
  // Use localStorage for "remember me", sessionStorage otherwise
  return localStorage.getItem('hcm-admin-remember') === '1' ? localStorage : sessionStorage;
}

export function adminLogout() {
  [...SESSION_KEYS, ...LEGACY_KEYS].forEach(k => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}

export async function adminLogin(email, password, rememberMe = true) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.ok && data.access_token) {
      // Clear both storages before writing to avoid stale cross-storage tokens
      SESSION_KEYS.forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });

      const store = rememberMe ? localStorage : sessionStorage;
      store.setItem('hcm-admin-token', data.access_token);
      store.setItem('hcm-admin-refresh', data.refresh_token || '');
      store.setItem('hcm-admin-expires', String(data.expires_at || ''));
      if (rememberMe) store.setItem('hcm-admin-remember', '1');
    }
    return data;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export function isAdminSessionExpired() {
  const expiresAt =
    localStorage.getItem('hcm-admin-expires') ||
    sessionStorage.getItem('hcm-admin-expires');
  if (!expiresAt) return !getToken(); // no expiry info — treat as expired only if no token
  return Date.now() / 1000 >= Number(expiresAt) - 60; // 60s early buffer
}

export async function refreshAdminSession() {
  try {
    const refreshToken =
      localStorage.getItem('hcm-admin-refresh') ||
      sessionStorage.getItem('hcm-admin-refresh');
    if (!refreshToken) return { ok: false, error: 'No refresh token' };

    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const data = await res.json();

    if (data.ok && data.access_token) {
      const store = sessionStorage_();
      store.setItem('hcm-admin-token', data.access_token);
      store.setItem('hcm-admin-refresh', data.refresh_token || '');
      store.setItem('hcm-admin-expires', String(data.expires_at || ''));
    }
    return data;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
```

## hcm-ale-trail-backend/package.json
```
{
  "name": "nexttmp",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@supabase/ssr": "^0.8.0",
    "@supabase/supabase-js": "^2.97.0",
    "next": "16.1.6",
    "qrcode": "^1.5.4",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-hook-form": "^7.71.1",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/qrcode": "^1.5.6",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "dotenv": "^17.3.1",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

## hcm-ale-trail-backend/next.config.ts
```
import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), geolocation=(self), microphone=()",
  },
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' blob:; connect-src 'self' https://gfubghgsrehabqanaosp.supabase.co wss://gfubghgsrehabqanaosp.supabase.co; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
```

## hcm-ale-trail-backend/vercel.json
```
{
  "crons": [
    {
      "path": "/api/trails/89e5e2d6-090b-448a-8e53-6d05b731a921/nudges/scan",
      "schedule": "0 3 * * *"
    }
  ]
}
```

## hcm-ale-trail-backend/src/lib/supabase/server.ts
```
import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

/**
 * Server-side Supabase client.
 * Uses SERVICE ROLE key (server-only) so it can read/write regardless of RLS.
 * Never import this file into client components.
 */
export function createSupabaseServerAdmin() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRole = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}```

## hcm-ale-trail-backend/src/lib/auth.ts
```
import { createSupabaseServerAdmin } from "@/lib/supabase/server";

export type AuthResult =
  | { ok: true; userId: string; email?: string | null }
  | { ok: false; status: number; error: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getBearerToken(req: Request): string | null {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || null;
}

/**
 * Validates Authorization: Bearer <access_token> using Supabase auth.
 * Returns the authenticated user's UUID (auth.users id).
 */
export async function requireUser(req: Request): Promise<AuthResult> {
  const token = getBearerToken(req);
  if (!token) return { ok: false, status: 401, error: "Unauthorized" };

  const supabase = createSupabaseServerAdmin();

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user?.id) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized",
    };
  }

  return { ok: true, userId: data.user.id, email: data.user.email };
}

/**
 * Returns the caller's user ID, or null.
 *
 * Tries in order:
 *   1. Authorization: Bearer <token>  — full Supabase JWT verification.
 *   2. X-User-Id: <uuid>             — trust-the-client fallback that
 *      matches the existing app pattern (user ID stored in localStorage).
 *
 * Use this for endpoints where the existing app doesn't carry a JWT
 * (age gate, Untappd connect, ratings). The Bearer path is preserved so
 * clients that do send a token still get full verification.
 */
export async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const token = getBearerToken(req);
  if (token) {
    const supabase = createSupabaseServerAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    return error || !data?.user?.id ? null : data.user.id;
  }

  const xUserId = req.headers.get("x-user-id");
  if (xUserId && UUID_RE.test(xUserId.trim())) {
    return xUserId.trim();
  }

  return null;
}```

## hcm-ale-trail-backend/src/lib/admin-auth.ts
```
import { createClient } from "@supabase/supabase-js";

function getEnv(name: string) {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

function getSupabaseUrl() {
  return (
    getEnv("SUPABASE_URL") ||
    getEnv("NEXT_PUBLIC_SUPABASE_URL") ||
    getEnv("SUPABASE_PROJECT_URL")
  );
}

function getAnonKey() {
  return (
    getEnv("SUPABASE_ANON_KEY") ||
    getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    getEnv("NEXT_PUBLIC_SUPABASE_KEY")
  );
}

function getServiceKey() {
  return (
    getEnv("SUPABASE_SERVICE_ROLE_KEY") ||
    getEnv("SERVICE_ROLE_KEY")
  );
}

export type AdminRole = "super_admin" | "management" | "brewery_admin";
export type BreweryStaffRole = "owner" | "manager" | "staff";

export type AdminContext = {
  userId: string;
  email: string | null;
  roles: Array<{ role: AdminRole; breweryId: string | null }>;
  primaryRole: AdminRole | null;
  staffRole: BreweryStaffRole | null; // role in brewery_staff for the scoped brewery
};

function parseBearer(req: Request) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export async function requireAuthedUser(req: Request) {
  const url = getSupabaseUrl();
  const anon = getAnonKey();
  if (!url || !anon) throw new Error("Missing SUPABASE_URL / SUPABASE_ANON_KEY env vars");

  const token = parseBearer(req);
  if (!token) return { ok: false as const, status: 401, error: "Missing Authorization Bearer token" };

  const supa = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await supa.auth.getUser(token);

  if (error || !data?.user?.id) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  return {
    ok: true as const,
    token,
    userId: data.user.id,
    email: data.user.email ?? null,
  };
}

export async function requireAdmin(req: Request, opts?: { breweryId?: string }) {
  const authed = await requireAuthedUser(req);
  if (!authed.ok) return authed;

  const url = getSupabaseUrl();
  const service = getServiceKey();
  if (!url || !service) throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars");

  const adminSupa = createClient(url, service, { auth: { persistSession: false } });

  // Check admin_access (super_admin / management / brewery_admin)
  const { data: rolesRaw, error: rolesErr } = await adminSupa
    .from("admin_access")
    .select("role, brewery_id")
    .eq("user_id", authed.userId);

  if (rolesErr) {
    return { ok: false as const, status: 500, error: rolesErr.message };
  }

  const roles =
    (rolesRaw ?? []).map((r: any) => ({
      role: r.role as AdminRole,
      breweryId: r.brewery_id ?? null,
    })) ?? [];

  const hasAdminAccess = roles.length > 0;

  // Also check brewery_staff for the scoped brewery (or any, to allow login)
  let staffRole: BreweryStaffRole | null = null;
  if (opts?.breweryId || !hasAdminAccess) {
    let staffQuery = adminSupa
      .from("brewery_staff")
      .select("role")
      .eq("user_id", authed.userId)
      .eq("status", "active");

    if (opts?.breweryId) staffQuery = staffQuery.eq("brewery_id", opts.breweryId);

    const { data: staffRows } = await staffQuery.limit(1).maybeSingle();
    staffRole = (staffRows as any)?.role ?? null;
  }

  // Grant access if: in admin_access OR is active brewery_staff member
  if (!hasAdminAccess && !staffRole) {
    return { ok: false as const, status: 403, error: "Forbidden (not an admin)" };
  }

  // If only a brewery_staff member (not in admin_access), synthesize a brewery_admin context
  if (!hasAdminAccess && staffRole) {
    if (!opts?.breweryId) {
      return { ok: false as const, status: 403, error: "Forbidden (brewery scope required)" };
    }
    const syntheticRoles: Array<{ role: AdminRole; breweryId: string | null }> = [
      { role: "brewery_admin", breweryId: opts.breweryId },
    ];
    const ctx: AdminContext = {
      userId: authed.userId,
      email: authed.email,
      roles: syntheticRoles,
      primaryRole: "brewery_admin",
      staffRole,
    };
    return { ok: true as const, status: 200, ctx, adminSupa };
  }

  // Has admin_access — enforce brewery scope check if requested
  if (opts?.breweryId) {
    const hasGlobal = roles.some((r) => r.role === "super_admin" || r.role === "management");
    const hasBrewery = roles.some((r) => r.role === "brewery_admin" && r.breweryId === opts.breweryId);
    if (!hasGlobal && !hasBrewery && !staffRole) {
      return { ok: false as const, status: 403, error: "Forbidden (brewery scope)" };
    }
  }

  const primary =
    roles.find((r) => r.role === "super_admin") ||
    roles.find((r) => r.role === "management") ||
    roles[0] ||
    null;

  // Super admins implicitly have owner-level staff access
  if (!staffRole && primary?.role === "super_admin") {
    staffRole = "owner";
  }

  const ctx: AdminContext = {
    userId: authed.userId,
    email: authed.email,
    roles,
    primaryRole: primary?.role ?? null,
    staffRole,
  };

  return { ok: true as const, status: 200, ctx, adminSupa };
}

// Convenience: require the user to be an owner for the given brewery
export async function requireBreweryOwner(req: Request, breweryId: string) {
  const result = await requireAdmin(req, { breweryId });
  if (!result.ok) return result;

  const isSuperAdmin = result.ctx.roles.some((r) => r.role === "super_admin");
  const isOwner = result.ctx.staffRole === "owner";
  if (!isSuperAdmin && !isOwner) {
    return { ok: false as const, status: 403, error: "Forbidden (owner required)" };
  }
  return result;
}
```

## hcm-ale-trail-backend/src/app/api/health/route.ts
```
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getEnv(name: string) {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v.trim() : null;
}

async function authHealth(supabaseUrl: string, anonKey: string) {
  const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
    },
    cache: "no-store",
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // ignore
  }

  return {
    ok: res.ok,
    status: res.status,
    body: json ?? text,
  };
}

async function dbHealth(supabaseUrl: string, anonKey: string) {
  // PostgREST endpoint
  const res = await fetch(`${supabaseUrl}/rest/v1/trails?select=id&limit=1`, {
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
    },
    cache: "no-store",
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // ignore
  }

  // If trails table doesn't exist yet, Supabase will usually return 404 or an error object.
  // We treat that as "schema not initialized" rather than "Supabase down".
  if (!res.ok) {
    const msg = (json?.message || json?.error || text || "").toString().toLowerCase();

    const looksLikeMissingTable =
      res.status === 404 ||
      msg.includes("does not exist") ||
      msg.includes("relation") ||
      msg.includes("schema cache");

    return {
      ok: looksLikeMissingTable, // ok-ish
      status: res.status,
      state: looksLikeMissingTable ? "schema_not_initialized" : "db_error",
      body: json ?? text,
    };
  }

  return {
    ok: true,
    status: res.status,
    state: "ok",
    body: json ?? text,
  };
}

export async function GET() {
  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      {
        ok: false,
        where: "env",
        error: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      },
      { status: 500 }
    );
  }

  try {
    const [auth, db] = await Promise.all([
      authHealth(supabaseUrl, anonKey),
      dbHealth(supabaseUrl, anonKey),
    ]);

    const ok = auth.ok && db.ok;

    return NextResponse.json(
      {
        ok,
        supabaseUrl,
        auth,
        db,
        ts: new Date().toISOString(),
      },
      { status: ok ? 200 : 500 }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        where: "server",
        error: e?.message || String(e),
      },
      { status: 500 }
    );
  }
}
```

## hcm-ale-trail-backend/src/app/api/auth/login/route.ts
```
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getEnv(name: string) {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

function getSupabaseAnonClient() {
  const url =
    getEnv("SUPABASE_URL") ||
    getEnv("NEXT_PUBLIC_SUPABASE_URL") ||
    getEnv("SUPABASE_PROJECT_URL");

  const anon =
    getEnv("SUPABASE_ANON_KEY") ||
    getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    getEnv("NEXT_PUBLIC_SUPABASE_KEY");

  if (!url || !anon) {
    throw new Error("Missing SUPABASE_URL / SUPABASE_ANON_KEY env vars");
  }

  return createClient(url, anon, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Missing email or password" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAnonClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.session?.access_token || !data?.session?.refresh_token) {
      return NextResponse.json(
        { ok: false, error: error?.message || "Invalid login credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      token_type: data.session.token_type,
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
```

## hcm-ale-trail-backend/src/app/api/trails/[trailId]/breweries/route.ts
```
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getEnv(name: string) {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

function getSupabase() {
  const url =
    getEnv("SUPABASE_URL") ||
    getEnv("NEXT_PUBLIC_SUPABASE_URL") ||
    getEnv("SUPABASE_PROJECT_URL");

  const anon =
    getEnv("SUPABASE_ANON_KEY") ||
    getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    getEnv("NEXT_PUBLIC_SUPABASE_KEY");

  if (!url || !anon) throw new Error("Missing SUPABASE_URL / SUPABASE_ANON_KEY env vars");

  return createClient(url, anon, { auth: { persistSession: false } });
}

export async function GET(req: Request, ctx: { params: Promise<{ trailId: string }> }) {
  try {
    const { trailId } = await ctx.params;

    if (!trailId) {
      return NextResponse.json({ ok: false, error: "Missing trailId" }, { status: 400 });
    }

    const supabase = getSupabase();

    // FLAT SELECT ONLY (no nested relationships). Avoid recursion/stack depth issues.
    // Select * and whitelist response fields so adding new columns (latitude/longitude)
    // doesn't break if migration hasn't run yet, and sensitive fields are never exposed.
    const { data, error } = await supabase
      .from("breweries")
      .select("*")
      .eq("trail_id", trailId)
      .in("status", ["active", "temporarily_closed"])
      .order("display_order", { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, where: "supabase", error: error.message }, { status: 500 });
    }

    const breweries = (data ?? []).map((row: any) => ({
      id: row.id,
      trail_id: row.trail_id,
      display_order: row.display_order,
      name: row.name,
      address: row.address,
      district: row.district,
      description: row.description,
      logo_url: row.logo_url,
      website_url: row.website_url,
      instagram_url: row.instagram_url,
      facebook_url: row.facebook_url,
      maps_url: row.maps_url,
      status: row.status,
      checkin_enabled: row.checkin_enabled,
      operating_hours: row.operating_hours,
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
    }));

    return NextResponse.json({
      ok: true,
      trailId,
      count: breweries.length,
      breweries,
      ts: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, where: "server", error: e?.message ?? String(e) }, { status: 500 });
  }
}
```
