export const API_BASE = '';
export const TRAIL_ID = '89e5e2d6-090b-448a-8e53-6d05b731a921';

function getToken() {
  return localStorage.getItem('hcm-admin-token') || localStorage.getItem('admin_token') || localStorage.getItem('token') || localStorage.getItem('access_token');
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

// ==================== LOGIN ====================


export function adminLogout() {
  localStorage.removeItem('hcm-admin-token');
  localStorage.removeItem('admin_token');
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
}

export async function adminLogin(email, password) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.ok && data.access_token) {
      localStorage.setItem('hcm-admin-token', data.access_token);
    }
    return data;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
