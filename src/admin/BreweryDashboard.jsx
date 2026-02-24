import { useState, useEffect } from 'react';
import { getBreweryDashboard, getBreweries, updateBreweryPin, getBreweryEvents, createEvent, deleteEvent, TRAIL_ID } from './adminApi';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';

const CHART_COLORS = ['#f97316', '#4d5a3c', '#64748b', '#84cc16'];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BreweryDashboard({ breweryId: initialBreweryId, isHQ = false }) {
  const [breweryId, setBreweryId] = useState(initialBreweryId);
  const [breweries, setBreweries] = useState([]);
  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');
  
  // PIN code state
  const [pinCode, setPinCode] = useState('');
  const [editingPin, setEditingPin] = useState(false);
  const [newPin, setNewPin] = useState('');

  // Event form state
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    titleEn: '',
    titleVn: '',
    descriptionEn: '',
    descriptionVn: '',
    startsAt: '',
    endsAt: '',
    link: ''
  });
  const [savingEvent, setSavingEvent] = useState(false);

  useEffect(() => {
    if (isHQ) {
      getBreweries(TRAIL_ID).then((result) => {
        if (result.ok && result.breweries) {
          setBreweries(result.breweries);
          if (!breweryId && result.breweries.length > 0) {
            setBreweryId(result.breweries[0].id);
          }
        }
      });
    }
  }, [isHQ]);

  const loadData = async () => {
    if (!breweryId) return;
    
    setLoading(true);
    setError('');
    
    let from, to;
    const now = new Date();
    to = now.toISOString();
    
    if (dateRange === '24h') {
      from = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    } else if (dateRange === '7d') {
      from = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (dateRange === '30d') {
      from = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    const [dashResult, eventsResult] = await Promise.all([
      getBreweryDashboard(breweryId, from, to),
      getBreweryEvents(breweryId)
    ]);
    
    if (dashResult.ok) {
      setData(dashResult);
      if (dashResult.brewery?.pinCode) {
        setPinCode(dashResult.brewery.pinCode);
      }
    } else {
      setError(dashResult.error || 'Failed to load data');
    }
    
    if (eventsResult.ok) {
      setEvents(eventsResult.events || []);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [breweryId, dateRange]);

  const handleSavePin = async () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      alert('PIN must be exactly 4 digits');
      return;
    }
    
    const result = await updateBreweryPin(breweryId, newPin);
    
    if (result.ok) {
      setPinCode(newPin);
      setEditingPin(false);
      setNewPin('');
    } else {
      alert(result.error || 'Failed to update PIN');
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.titleEn || !eventForm.startsAt) {
      alert('Title (English) and Start Date/Time are required');
      return;
    }

    setSavingEvent(true);
    
    const eventData = {
      title: { en: eventForm.titleEn, vn: eventForm.titleVn || eventForm.titleEn },
      description: eventForm.descriptionEn ? { en: eventForm.descriptionEn, vn: eventForm.descriptionVn || eventForm.descriptionEn } : null,
      starts_at: new Date(eventForm.startsAt).toISOString(),
      ends_at: eventForm.endsAt ? new Date(eventForm.endsAt).toISOString() : null,
      link: eventForm.link || null,
      status: 'active'
    };

    const result = await createEvent(breweryId, eventData);
    
    if (result.ok) {
      setEvents([...events, result.event]);
      setShowEventForm(false);
      setEventForm({ titleEn: '', titleVn: '', descriptionEn: '', descriptionVn: '', startsAt: '', endsAt: '', link: '' });
    } else {
      alert(result.error || 'Failed to create event');
    }
    
    setSavingEvent(false);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Delete this event?')) return;
    const result = await deleteEvent(eventId);
    if (result.ok) {
      setEvents(events.filter(e => e.id !== eventId));
    } else {
      alert(result.error || 'Failed to delete');
    }
  };

  if (loading && !data) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="admin-content">
        <div className="admin-error">{error}</div>
      </div>
    );
  }

  const brewery = data?.brewery || {};
  const today = data?.today || {};
  const totals = data?.totals || {};
  const ratings = data?.ratings || {};
  const ranking = data?.ranking || {};
  const busiest = data?.busiest || {};
  const journeyStats = data?.journeyStats || {};

  const methodData = (totals.checkinsByMethod || []).map(m => ({
    name: m.method === 'qr_scan' ? 'QR Scan' : 'Manual Code',
    value: m.count
  }));

  return (
    <div className="admin-content">
      <h1 className="admin-page-title">
        {brewery.name || 'Brewery'} Dashboard
      </h1>

      {isHQ && breweries.length > 0 && (
        <div className="admin-filters">
          <select
            className="admin-brewery-select"
            value={breweryId}
            onChange={(e) => setBreweryId(e.target.value)}
          >
            {breweries.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`admin-tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Events ({events.length})
        </button>
        <button 
          className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="admin-filters">
            <button 
              className={`admin-quick-filter ${dateRange === '24h' ? 'active' : ''}`}
              onClick={() => setDateRange('24h')}
            >
              Last 24h
            </button>
            <button 
              className={`admin-quick-filter ${dateRange === '7d' ? 'active' : ''}`}
              onClick={() => setDateRange('7d')}
            >
              Last 7 days
            </button>
            <button 
              className={`admin-quick-filter ${dateRange === '30d' ? 'active' : ''}`}
              onClick={() => setDateRange('30d')}
            >
              Last 30 days
            </button>
          </div>

          <div className="admin-kpi-grid">
            <div className="admin-kpi-card">
              <div className="admin-kpi-label">Today's Check-ins</div>
              <div className="admin-kpi-value primary">{today.checkins || 0}</div>
            </div>
            <div className="admin-kpi-card">
              <div className="admin-kpi-label">Total Check-ins</div>
              <div className="admin-kpi-value">{totals.checkins || 0}</div>
            </div>
            <div className="admin-kpi-card">
              <div className="admin-kpi-label">Your Ranking</div>
              <div className="admin-kpi-value success">
                #{ranking.rank || '--'}
              </div>
              <div className="admin-kpi-subtext">
                of {ranking.totalBreweriesWithCheckins || 8} breweries
              </div>
            </div>
            <div className="admin-kpi-card">
              <div className="admin-kpi-label">Your Avg Rating</div>
              <div className="admin-kpi-value">
                {ratings.avgRatingVenue?.toFixed(1) || '--'} stars
              </div>
              <div className="admin-kpi-subtext">
                Trail avg: {ratings.avgRatingTrail?.toFixed(1) || '--'} stars
              </div>
            </div>
          </div>

          {/* Journey Stats for this Brewery */}
          <div className="admin-grid-3">
            <div className="admin-kpi-card">
              <div className="admin-kpi-label">Started Here</div>
              <div className="admin-kpi-value primary">{journeyStats.startedHere || 0}</div>
              <div className="admin-kpi-subtext">First stamp at your venue</div>
            </div>
            <div className="admin-kpi-card">
              <div className="admin-kpi-label">Ended Here</div>
              <div className="admin-kpi-value success">{journeyStats.endedHere || 0}</div>
              <div className="admin-kpi-subtext">8th stamp at your venue</div>
            </div>
            <div className="admin-kpi-card">
              <div className="admin-kpi-label">Hats Claimed Here</div>
              <div className="admin-kpi-value success">{journeyStats.hatClaimsHere || 0}</div>
              <div className="admin-kpi-subtext">Completed at your venue</div>
            </div>
          </div>

          <div className="admin-grid-2">
            <div className="admin-card">
              <h3 className="admin-card-title">Check-in Methods</h3>
              {methodData.length === 0 ? (
                <div className="admin-empty">No check-ins yet</div>
              ) : (
                <div className="admin-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={methodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {methodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="admin-card">
              <h3 className="admin-card-title">Busiest Times</h3>
              <div style={{ padding: '20px 0' }}>
                <div style={{ marginBottom: 24 }}>
                  <div className="admin-kpi-label">Busiest Day</div>
                  <div style={{ fontSize: 28, fontWeight: 600 }}>
                    {DAY_NAMES[busiest.busiestDayOfWeek] || '--'}
                  </div>
                </div>
                <div>
                  <div className="admin-kpi-label">Peak Hour</div>
                  <div style={{ fontSize: 28, fontWeight: 600 }}>
                    {busiest.busiestHourOfDay !== undefined 
                      ? `${busiest.busiestHourOfDay}:00 - ${busiest.busiestHourOfDay + 1}:00`
                      : '--'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title">Recent Ratings ({ratings.countVenue || 0} total)</h3>
            {(ratings.latest || []).length === 0 ? (
              <div className="admin-empty">No ratings yet</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Beer</th>
                    <th>Rating</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(ratings.latest || []).map((rating) => (
                    <tr key={rating.id}>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--admin-text-muted)' }}>
                        {new Date(rating.created_at).toLocaleDateString('en', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td><strong>{rating.beer_name}</strong></td>
                      <td>{rating.rating} stars</td>
                      <td style={{ color: 'var(--admin-text-muted)', maxWidth: 300 }}>
                        {rating.notes || '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="admin-card-title" style={{ marginBottom: 0 }}>Your Events</h3>
            <button 
              className="admin-btn admin-btn-primary admin-btn-small"
              onClick={() => setShowEventForm(true)}
            >
              Add Event
            </button>
          </div>

          {/* Event Form Modal */}
          {showEventForm && (
            <div className="admin-modal-overlay" onClick={() => setShowEventForm(false)}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <h3 style={{ marginBottom: 20 }}>Add New Event</h3>
                
                <div className="admin-form-group">
                  <label className="admin-form-label">Title (English) *</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={eventForm.titleEn}
                    onChange={(e) => setEventForm({...eventForm, titleEn: e.target.value})}
                    placeholder="Trivia Night"
                  />
                </div>
                
                <div className="admin-form-group">
                  <label className="admin-form-label">Title (Vietnamese)</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={eventForm.titleVn}
                    onChange={(e) => setEventForm({...eventForm, titleVn: e.target.value})}
                    placeholder="Đêm Trivia"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Description (English)</label>
                  <textarea
                    className="admin-form-input"
                    value={eventForm.descriptionEn}
                    onChange={(e) => setEventForm({...eventForm, descriptionEn: e.target.value})}
                    placeholder="Join us for fun trivia with prizes!"
                    rows={2}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Start Date/Time *</label>
                  <input
                    type="datetime-local"
                    className="admin-form-input"
                    value={eventForm.startsAt}
                    onChange={(e) => setEventForm({...eventForm, startsAt: e.target.value})}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">End Date/Time</label>
                  <input
                    type="datetime-local"
                    className="admin-form-input"
                    value={eventForm.endsAt}
                    onChange={(e) => setEventForm({...eventForm, endsAt: e.target.value})}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Link (optional)</label>
                  <input
                    type="url"
                    className="admin-form-input"
                    value={eventForm.link}
                    onChange={(e) => setEventForm({...eventForm, link: e.target.value})}
                    placeholder="https://facebook.com/events/..."
                  />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button 
                    className="admin-btn admin-btn-primary"
                    onClick={handleCreateEvent}
                    disabled={savingEvent}
                  >
                    {savingEvent ? 'Saving...' : 'Create Event'}
                  </button>
                  <button 
                    className="admin-btn"
                    style={{ background: 'var(--admin-border)', color: 'var(--admin-text)' }}
                    onClick={() => setShowEventForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {events.length === 0 ? (
            <div className="admin-empty">No events yet. Click "Add Event" to create one.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <strong>{event.title?.en || event.title}</strong>
                      {event.description?.en && (
                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>
                          {event.description.en}
                        </div>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(event.startsAt).toLocaleDateString('en', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <span className={`admin-badge ${event.status === 'active' ? 'active' : 'inactive'}`}>
                        {event.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="admin-btn-small admin-btn-danger"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="admin-card" style={{ maxWidth: 400 }}>
          <h3 className="admin-card-title">Manual Check-in Code</h3>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: 12, fontSize: 13 }}>
            Backup code if QR scanning fails
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {editingPin ? (
              <>
                <input
                  type="text"
                  className="admin-pin-input"
                  style={{ width: 80, fontSize: 18, padding: 6 }}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0000"
                  maxLength={4}
                  autoFocus
                />
                <button 
                  className="admin-btn admin-btn-primary admin-btn-small"
                  style={{ padding: '6px 12px', fontSize: 13 }}
                  onClick={handleSavePin}
                >
                  Save
                </button>
                <button 
                  className="admin-btn admin-btn-small"
                  style={{ padding: '6px 12px', fontSize: 13, background: 'var(--admin-border)', color: 'var(--admin-text)' }}
                  onClick={() => { setEditingPin(false); setNewPin(''); }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span style={{ 
                  fontSize: 24, 
                  fontWeight: 700, 
                  fontFamily: 'Monaco, Consolas, monospace',
                  letterSpacing: 4,
                  color: 'var(--admin-primary)'
                }}>
                  {pinCode || '----'}
                </span>
                <button 
                  className="admin-btn admin-btn-small"
                  style={{ padding: '6px 12px', fontSize: 13, background: 'var(--admin-border)', color: 'var(--admin-text)' }}
                  onClick={() => { setEditingPin(true); setNewPin(pinCode); }}
                >
                  Change
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}