// Admin API functions
const API_BASE = '/api';
const TRAIL_ID = '89e5e2d6-090b-448a-8e53-6d05b731a921';

function getAccessToken() {
  try {
    return localStorage.getItem('hcm-access-token');
  } catch {
    return null;
  }
}

function authHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  
  const data = await res.json().catch(() => ({ ok: false, error: 'Invalid response' }));
  
  if (!res.ok) {
    return { ok: false, error: data?.error || `Request failed (${res.status})`, status: res.status };
  }
  
  return data;
}

// Auth
export async function adminLogin(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await res.json().catch(() => null);
  
  if (res.ok && data?.ok && data?.access_token) {
    localStorage.setItem('hcm-access-token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('hcm-refresh-token', data.refresh_token);
    }
    return { ok: true, ...data };
  }
  
  return { ok: false, error: data?.error || 'Login failed' };
}

export function adminLogout() {
  localStorage.removeItem('hcm-access-token');
  localStorage.removeItem('hcm-refresh-token');
}

// Admin endpoints
export function getAdminMe() {
  return request('/admin/me');
}

export function getTrailOverview(trailId, from, to) {
  let url = `/admin/trails/${trailId}/overview`;
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (params.toString()) url += `?${params.toString()}`;
  return request(url);
}

export function getBreweryDashboard(breweryId, from, to) {
  let url = `/admin/breweries/${breweryId}/dashboard`;
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (params.toString()) url += `?${params.toString()}`;
  return request(url);
}

// Get list of breweries for dropdown
export function getBreweries(trailId) {
  return request(`/trails/${trailId}/breweries`);
}

// Update brewery PIN code
export function updateBreweryPin(breweryId, pin) {
  return request(`/admin/breweries/${breweryId}/pin`, {
    method: 'PUT',
    body: JSON.stringify({ pin }),
  });
}

// Events - HQ (all events for trail)
export function getTrailEvents(trailId) {
  return request(`/admin/trails/${trailId}/events?v=${Date.now()}`);
}

// Events - Brewery specific
export function getBreweryEvents(breweryId) {
  return request(`/admin/breweries/${breweryId}/events?v=${Date.now()}`);
}

export function createEvent(breweryId, eventData) {
  return request(`/admin/breweries/${breweryId}/events`, {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
}

export function updateEvent(eventId, eventData) {
  return request(`/admin/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(eventData),
  });
}

export function deleteEvent(eventId) {
  return request(`/admin/events/${eventId}`, {
    method: 'DELETE',
  });
}

// Admin Leaderboard (with emails)
export function getAdminLeaderboard(trailId, limit = 50) {
  return request(`/admin/trails/${trailId}/leaderboard?limit=${limit}`);
}

// Participant Export
export function exportParticipants(trailId, format = 'json', from, to) {
  let url = `/admin/trails/${trailId}/participants/export?format=${format}`;
  if (from) url += `&from=${from}`;
  if (to) url += `&to=${to}`;
  return request(url);
}

export { TRAIL_ID };