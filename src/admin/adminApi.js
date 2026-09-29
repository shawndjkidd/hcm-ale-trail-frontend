export const API_BASE = '';

// Reads a reply as JSON without throwing on an error page (Safari's res.json() error is
// "The string did not match the expected pattern", which means nothing to a venue).
export async function readJson(res) {
  const text = await res.text().catch(() => '');
  try { return JSON.parse(text); } catch {
    return { ok: false, status: res.status, error: res.status === 404 ? 'This feature is not available yet. Please tell HQ.' : `Something went wrong (${res.status}). Please try again.` };
  }
}

// "Failed to fetch" and friends mean the request never reached the server.
export function netError(err) {
  const m = String(err?.message || err || '');
  return /failed to fetch|networkerror|load failed|network request failed/i.test(m)
    ? "Can't reach the server. Check your internet connection and try again."
    : m || 'Something went wrong. Please try again.';
}
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


// Every dashboard call goes through apiFetch: it renews the login before it expires, and if
// a call is refused as expired (401) it renews once and retries, so saves don't silently
// fail after an hour. If the login can't be renewed, the app is told to show the login
// screen with a clear message instead of failing quietly.
let refreshing = null;
function renewOnce() {
  if (!refreshing) refreshing = refreshAdminSession().finally(() => { setTimeout(() => { refreshing = null; }, 0); });
  return refreshing;
}
export const SESSION_EXPIRED_MESSAGE = 'Your login expired. Please log in again.';
function sessionExpired() {
  try { window.dispatchEvent(new Event('hcm-admin-session-expired')); } catch {}
}
export async function apiFetch(url, opts = {}) {
  const send = () => fetch(url, { ...opts, headers: { ...(opts.headers || {}), ...authHeaders() } });
  if (getToken() && isAdminSessionExpired()) await renewOnce();
  let res = await send();
  if (res.status === 401 && getToken()) {
    const renewed = await renewOnce();
    if (renewed?.ok) res = await send();
    else {
      sessionExpired();
      return new Response(JSON.stringify({ ok: false, status: 401, error: SESSION_EXPIRED_MESSAGE }), { status: 401, headers: { 'content-type': 'application/json' } });
    }
  }
  return res;
}

// ==================== AUTH ====================

export async function getAdminMe() {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/me`, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

// ==================== HQ DASHBOARD ====================

export async function getTrailAnalytics(trailId, scope = 'trail', breweryId = null) {
  try {
    let url = `${API_BASE}/api/admin/trails/${trailId}/analytics?scope=${scope}`;
    if (breweryId) url += `&bid=${breweryId}`;
    const res = await apiFetch(url, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function getTrailOverview(trailId, from, to) {
  try {
    let url = `${API_BASE}/api/admin/trails/${trailId}/overview`;
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (params.toString()) url += `?${params.toString()}`;
    const res = await apiFetch(url, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function getAdminLeaderboard(trailId, limit = 50) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/trails/${trailId}/leaderboard?limit=${limit}`, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function exportParticipants(trailId, format = 'json', from, to) {
  try {
    let url = `${API_BASE}/api/admin/trails/${trailId}/participants/export?format=${format}`;
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;
    const res = await apiFetch(url, { headers: authHeaders() });
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
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

// ==================== EVENTS ====================

export async function getTrailEvents(trailId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/trails/${trailId}/events`, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function createTrailEvent(trailId, eventData) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/trails/${trailId}/events`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(eventData)
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function getBreweryEvents(breweryId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/events`, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function createBreweryEvent(breweryId, eventData) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/events`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(eventData)
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function updateEvent(eventId, patch) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/events/${eventId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(patch)
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function deleteEvent(eventId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/events/${eventId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
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
    const res = await apiFetch(url, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function updateBreweryPin(breweryId, pin) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/pin`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ pin })
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function updateBreweryHours(breweryId, operatingHours) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/hours`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ operating_hours: operatingHours })
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

// ==================== BREWERY MANAGEMENT (HQ) ====================

export async function getTrailBreweries(trailId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/trails/${trailId}/breweries`, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function createBrewery(trailId, breweryData) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/trails/${trailId}/breweries`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(breweryData)
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function updateBrewery(breweryId, breweryData) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(breweryData)
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function deleteBrewery(breweryId, hard = false) {
  try {
    const url = hard 
      ? `${API_BASE}/api/admin/breweries/${breweryId}?hard=1`
      : `${API_BASE}/api/admin/breweries/${breweryId}`;
    const res = await apiFetch(url, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

// ==================== SIDE QUESTS ====================

export async function getSideQuests(trailId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/trails/${trailId}/side-quests`, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function createSideQuest(trailId, questData) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/trails/${trailId}/side-quests`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(questData)
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function updateSideQuest(questId, questData) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/side-quests/${questId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(questData)
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function deleteSideQuest(questId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/side-quests/${questId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

// ==================== BREWERY BEERS ====================

export async function getBreweryBeers(breweryId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/beers`, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function createBreweryBeer(breweryId, beerData) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/beers`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(beerData)
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function updateBreweryBeer(breweryId, beerId, beerData) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/beers/${beerId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(beerData)
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function bulkUploadBeers(breweryId, beers) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/beers/bulk`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ beers })
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function deleteBreweryBeer(breweryId, beerId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/beers/${beerId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function mergeRatings(breweryId, oldName, newName) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/merge-ratings`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ oldName, newName })
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function getMergeSuggestions(trailId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/trails/${trailId}/merge-suggestions`, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

// ==================== BEER RATINGS ====================

export async function getTrailBeerRatings(trailId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/trails/${trailId}/ratings`, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

// ==================== BREWERY STAFF ====================

export async function createBreweryStaff(breweryId, email, password) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/create-login`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email, password })
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function getBreweryLogin(breweryId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/login`, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

// ==================== ACCOUNT SETTINGS ====================

// Settings → Account. (The old /api/admin/account route never existed, so Safari showed
// "The string did not match the expected pattern".) Password and email use the real routes.
export async function updateAdminAccount({ email, currentPassword, password }) {
  if (password) return changeAdminPassword(currentPassword, password);
  try {
    const res = await apiFetch(`${API_BASE}/api/auth/change-email`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email }),
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

// ==================== MERCHANDISE / STOCK ====================

export async function getTrailMerchandise(trailId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/trails/${trailId}/merchandise`, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function createMerchandiseItem(trailId, itemData) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/trails/${trailId}/merchandise`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(itemData)
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function updateMerchandiseItem(trailId, merchId, itemData) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/trails/${trailId}/merchandise/${merchId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(itemData)
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function deleteMerchandiseItem(trailId, merchId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/trails/${trailId}/merchandise/${merchId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function getBreweryMerchandise(breweryId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/merchandise`, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function restockMerchandise(breweryId, merchId, quantity, notes) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/merchandise/${merchId}/restock`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ quantity, notes })
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function recordMerchPickup(breweryId, merchId, participantId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/merchandise/${merchId}/pickup`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ participant_id: participantId })
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

// ==================== SUPER ADMINS ====================

export async function getSuperAdmins() {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/super-admins`, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function addSuperAdmin(email) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/super-admins`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email }),
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function removeSuperAdmin(id) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/super-admins/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

// ==================== BREWERY STAFF ====================

export async function getBreweryStaff(breweryId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/staff`, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function inviteBreweryStaff(breweryId, email, role) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/staff`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email, role }),
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function updateBreweryStaffRole(breweryId, staffId, role) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/staff/${staffId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ role }),
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function removeBreweryStaff(breweryId, staffId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/staff/${staffId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

export async function changeAdminPassword(currentPassword, newPassword) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/auth/change-password`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return await readJson(res);
  } catch (err) {
    return { ok: false, error: netError(err) };
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
    const data = await readJson(res);
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
    return { ok: false, error: netError(err) };
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
    const data = await readJson(res);

    if (data.ok && data.access_token) {
      const store = sessionStorage_();
      store.setItem('hcm-admin-token', data.access_token);
      store.setItem('hcm-admin-refresh', data.refresh_token || '');
      store.setItem('hcm-admin-expires', String(data.expires_at || ''));
    }
    return data;
  } catch (err) {
    return { ok: false, error: netError(err) };
  }
}

// ==================== LOCATIONS (extra taprooms) ====================
export async function getBreweryLocations(breweryId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/locations`, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) { return { ok: false, error: netError(err) }; }
}
export async function addBreweryLocation(breweryId, location) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/locations`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(location) });
    return await readJson(res);
  } catch (err) { return { ok: false, error: netError(err) }; }
}
export async function updateBreweryLocation(breweryId, locationId, fields) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/locations/${locationId}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(fields) });
    return await readJson(res);
  } catch (err) { return { ok: false, error: netError(err) }; }
}
export async function removeBreweryLocation(breweryId, locationId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/locations/${locationId}`, { method: 'DELETE', headers: authHeaders() });
    return await readJson(res);
  } catch (err) { return { ok: false, error: netError(err) }; }
}

// ==================== HQ PAPER-CARD TRANSFER ====================
export async function hqLookupStamps(trailId, email) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/trails/${trailId}/stamps?email=${encodeURIComponent(email)}`, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) { return { ok: false, error: netError(err) }; }
}
export async function hqAddStamps(trailId, email, breweryIds) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/trails/${trailId}/stamps`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ email, breweryIds }) });
    return await readJson(res);
  } catch (err) { return { ok: false, error: netError(err) }; }
}

// ==================== HQ HOME & LAUNCH ====================

export async function getHqSummary(trailId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/trails/${trailId}/hq`, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) { return { ok: false, error: netError(err) }; }
}

export async function hqRemoveDemo(trailId, confirm) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/trails/${trailId}/hq/demo`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ confirm }) });
    return await readJson(res);
  } catch (err) { return { ok: false, error: netError(err) }; }
}

export async function hqGenerateCodes(trailId, confirm) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/trails/${trailId}/hq/codes`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ confirm }) });
    return await readJson(res);
  } catch (err) { return { ok: false, error: netError(err) }; }
}

// Tells HQ a venue opened its dashboard. HQ viewing a venue is ignored by the server.
export async function pingVenueVisit(breweryId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/visit`, { method: 'POST', headers: authHeaders(), body: '{}' });
    return await readJson(res);
  } catch (err) { return { ok: false, error: netError(err) }; }
}

// HQ only: set the exact count on hand (e.g. after counting). The change is kept in history.
export async function setMerchandiseCount(breweryId, merchId, quantity) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/merchandise/${merchId}/stock`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ quantity }) });
    return await readJson(res);
  } catch (err) { return { ok: false, error: netError(err) }; }
}

// ==================== PLANS & ADD-ONS (HQ) ====================

export async function getVenueFeatures(trailId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/trails/${trailId}/features`, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) { return { ok: false, error: netError(err) }; }
}

export async function setVenueFeature(trailId, payload) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/trails/${trailId}/features`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) });
    return await readJson(res);
  } catch (err) { return { ok: false, error: netError(err) }; }
}

// ==================== VENUE DEMO CONTENT ====================

export async function getVenueDemo(breweryId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/demo`, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) { return { ok: false, error: netError(err) }; }
}

export async function removeVenueDemo(breweryId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/demo`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ confirm: 'REMOVE' }) });
    return await readJson(res);
  } catch (err) { return { ok: false, error: netError(err) }; }
}

// ==================== VENUE CHECKLIST CONFIRMATIONS ====================

export async function getChecklistConfirmed(breweryId) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/checklist`, { headers: authHeaders() });
    return await readJson(res);
  } catch (err) { return { ok: false, error: netError(err) }; }
}

export async function confirmChecklistItem(breweryId, item) {
  try {
    const res = await apiFetch(`${API_BASE}/api/admin/breweries/${breweryId}/checklist`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ item }) });
    return await readJson(res);
  } catch (err) { return { ok: false, error: netError(err) }; }
}
