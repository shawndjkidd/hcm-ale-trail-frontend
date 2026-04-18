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
