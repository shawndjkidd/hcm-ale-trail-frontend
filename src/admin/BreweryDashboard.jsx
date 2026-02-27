import { useState, useEffect } from 'react';
import { getBreweryDashboard, getBreweryEvents, createBreweryEvent, deleteEvent, updateBreweryPin, updateBreweryHours } from './adminApi';

const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_HOURS = {
  monday: { open: '11:00', close: '23:00', closed: false },
  tuesday: { open: '11:00', close: '23:00', closed: false },
  wednesday: { open: '11:00', close: '23:00', closed: false },
  thursday: { open: '11:00', close: '23:00', closed: false },
  friday: { open: '11:00', close: '00:00', closed: false },
  saturday: { open: '11:00', close: '00:00', closed: false },
  sunday: { open: '12:00', close: '22:00', closed: false }
};

export default function BreweryDashboard({ breweryId }) {
  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  // PIN settings
  const [pinCode, setPinCode] = useState('');
  const [savingPin, setSavingPin] = useState(false);
  const [pinMessage, setPinMessage] = useState('');

  // Hours settings
  const [operatingHours, setOperatingHours] = useState(DEFAULT_HOURS);
  const [savingHours, setSavingHours] = useState(false);
  const [hoursMessage, setHoursMessage] = useState('');

  // Event form
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ titleEn: '', titleVn: '', descriptionEn: '', descriptionVn: '', startsAt: '', endsAt: '', link: '' });
  const [savingEvent, setSavingEvent] = useState(false);

  const loadData = async (from, to) => {
    if (!breweryId) return;
    setLoading(true);
    setError('');
    const [dashResult, eventsResult] = await Promise.all([
      getBreweryDashboard(breweryId, from, to),
      getBreweryEvents(breweryId)
    ]);
    if (dashResult.ok) {
      setData(dashResult);
      setPinCode(dashResult.brewery?.pinCode || dashResult.brewery?.pin_code || '');
      const hours = dashResult.brewery?.operatingHours || dashResult.brewery?.operating_hours;
      if (hours) {
        setOperatingHours({ ...DEFAULT_HOURS, ...hours });
      }
    } else {
      setError(dashResult.error || 'Failed to load data');
    }
    if (eventsResult.ok) setEvents(eventsResult.events || []);
    setLoading(false);
  };

  useEffect(() => {
    let from, to;
    const now = new Date();
    to = now.toISOString();
    if (dateRange === '24h') from = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    else if (dateRange === '7d') from = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    else if (dateRange === '30d') from = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    loadData(from, to);
  }, [breweryId, dateRange]);

  // ==================== PIN HANDLERS ====================

  const handleSavePin = async () => {
    if (pinCode.length !== 4 || !/^\d{4}$/.test(pinCode)) {
      setPinMessage('PIN must be exactly 4 digits');
      return;
    }
    setSavingPin(true);
    setPinMessage('');
    const result = await updateBreweryPin(breweryId, pinCode);
    if (result.ok) {
      setPinMessage('✓ PIN updated successfully');
      setTimeout(() => setPinMessage(''), 3000);
    } else {
      setPinMessage(result.error || 'Failed to update PIN');
    }
    setSavingPin(false);
  };

  // ==================== HOURS HANDLERS ====================

  const handleHoursChange = (day, field, value) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleToggleClosed = (day) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], closed: !prev[day].closed }
    }));
  };

  const handleSaveHours = async () => {
    setSavingHours(true);
    setHoursMessage('');
    const result = await updateBreweryHours(breweryId, operatingHours);
    if (result.ok) {
      setHoursMessage('✓ Hours updated successfully');
      setTimeout(() => setHoursMessage(''), 3000);
    } else {
      setHoursMessage(result.error || 'Failed to update hours');
    }
    setSavingHours(false);
  };

  // ==================== EVENT HANDLERS ====================

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
    const result = await createBreweryEvent(breweryId, eventData);
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
    if (result.ok) setEvents(events.filter(e => e.id !== eventId));
    else alert(result.error || 'Failed to delete');
  };

  // ==================== RENDER ====================

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
  const journeyStats = data?.journeyStats || {};
  const checkinsByBrewery = data?.checkinsByBrewery || [];

  return (
    <div className="admin-content">
      <h1 className="admin-page-title">{brewery.name || 'Brewery'} Dashboard</h1>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`admin-tab ${activeTab === 'allbreweries' ? 'active' : ''}`} onClick={() => setActiveTab('allbreweries')}>All Breweries</button>
        <button className={`admin-tab ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>Events ({events.length})</button>
        <button className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
      </div>

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === 'overview' && (
        <>
          <div className="admin-filters">
            <button className={`admin-quick-filter ${dateRange === '24h' ? 'active' : ''}`} onClick={() => setDateRange('24h')}>Last 24h</button>
            <button className={`admin-quick-filter ${dateRange === '7d' ? 'active' : ''}`} onClick={() => setDateRange('7d')}>Last 7 days</button>
            <button className={`admin-quick-filter ${dateRange === '30d' ? 'active' : ''}`} onClick={() => setDateRange('30d')}>Last 30 days</button>
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
              <div className="admin-kpi-label">Avg Rating</div>
              <div className="admin-kpi-value success">{ratings.avgRatingVenue?.toFixed(1) || '--'}</div>
              <div className="admin-kpi-subtext">{ratings.countVenue || 0} ratings</div>
            </div>
            <div className="admin-kpi-card">
              <div className="admin-kpi-label">Started Here</div>
              <div className="admin-kpi-value">{journeyStats.startedHere || 0}</div>
            </div>
            <div className="admin-kpi-card">
              <div className="admin-kpi-label">Ended Here</div>
              <div className="admin-kpi-value">{journeyStats.endedHere || 0}</div>
            </div>
            <div className="admin-kpi-card">
              <div className="admin-kpi-label">Hat Claims Here</div>
              <div className="admin-kpi-value success">{journeyStats.hatClaimsHere || 0}</div>
            </div>
          </div>

          <div className="admin-grid-2">
            <div className="admin-card">
              <h3 className="admin-card-title">Check-ins by Method</h3>
              {!totals.checkinsByMethod ? (
                <div className="admin-empty">No data yet</div>
              ) : (
                <table className="admin-table">
                  <thead><tr><th>Method</th><th>Count</th></tr></thead>
                  <tbody>
                    {Object.entries(totals.checkinsByMethod || {}).map(([method, count]) => (
                      <tr key={method}>
                        <td style={{ textTransform: 'capitalize' }}>{method}</td>
                        <td><strong>{count}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="admin-card">
              <h3 className="admin-card-title">Latest Ratings</h3>
              {!ratings.latest?.length ? (
                <div className="admin-empty">No ratings yet</div>
              ) : (
                <table className="admin-table">
                  <thead><tr><th>Beer</th><th>Rating</th><th>Date</th></tr></thead>
                  <tbody>
                    {(ratings.latest || []).slice(0, 10).map((r, i) => (
                      <tr key={i}>
                        <td>{r.beerName || '--'}</td>
                        <td>{'⭐'.repeat(r.rating)}</td>
                        <td style={{ color: 'var(--admin-text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* ==================== ALL BREWERIES TAB ==================== */}
      {activeTab === 'allbreweries' && (
        <>
          <div className="admin-filters">
            <button className={`admin-quick-filter ${dateRange === '24h' ? 'active' : ''}`} onClick={() => setDateRange('24h')}>Last 24h</button>
            <button className={`admin-quick-filter ${dateRange === '7d' ? 'active' : ''}`} onClick={() => setDateRange('7d')}>Last 7 days</button>
            <button className={`admin-quick-filter ${dateRange === '30d' ? 'active' : ''}`} onClick={() => setDateRange('30d')}>Last 30 days</button>
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title">Trail-Wide Check-ins (Friendly Competition)</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 16, fontSize: 14 }}>See how all breweries are performing across the trail.</p>

            {checkinsByBrewery.length === 0 ? (
              <div className="admin-empty">No check-in data yet</div>
            ) : (
              <div className="admin-brewery-grid">
                {checkinsByBrewery.sort((a, b) => b.count - a.count).map((b, index) => {
                  const isYou = b.breweryId === breweryId;
                  return (
                    <div key={b.breweryId} className={`admin-brewery-card ${isYou ? 'highlight' : ''}`}>
                      <div className="admin-brewery-rank">
                        <span className={`admin-rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'default'}`}>
                          #{index + 1}
                        </span>
                      </div>
                      <div className="admin-brewery-info">
                        <div className="admin-brewery-name">
                          {b.breweryName}
                          {isYou && <span className="admin-you-badge">You</span>}
                        </div>
                        <div className="admin-brewery-count">{b.count} check-ins</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ==================== EVENTS TAB ==================== */}
      {activeTab === 'events' && (
        <>
          {showEventForm && (
            <div className="admin-modal-overlay" onClick={() => setShowEventForm(false)}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <h3 style={{ marginBottom: 20 }}>Create Event</h3>
                <div className="admin-form-group">
                  <label className="admin-form-label">Title (English) *</label>
                  <input type="text" className="admin-form-input" value={eventForm.titleEn} onChange={(e) => setEventForm({...eventForm, titleEn: e.target.value})} placeholder="Happy Hour Special" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Title (Vietnamese)</label>
                  <input type="text" className="admin-form-input" value={eventForm.titleVn} onChange={(e) => setEventForm({...eventForm, titleVn: e.target.value})} placeholder="Giờ vui vẻ" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Description (English)</label>
                  <textarea className="admin-form-input" value={eventForm.descriptionEn} onChange={(e) => setEventForm({...eventForm, descriptionEn: e.target.value})} placeholder="50% off all craft beers!" rows={2} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Start Date/Time *</label>
                  <input type="datetime-local" className="admin-form-input" value={eventForm.startsAt} onChange={(e) => setEventForm({...eventForm, startsAt: e.target.value})} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">End Date/Time</label>
                  <input type="datetime-local" className="admin-form-input" value={eventForm.endsAt} onChange={(e) => setEventForm({...eventForm, endsAt: e.target.value})} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Link (optional)</label>
                  <input type="url" className="admin-form-input" value={eventForm.link} onChange={(e) => setEventForm({...eventForm, link: e.target.value})} placeholder="https://..." />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button className="admin-btn admin-btn-primary" onClick={handleCreateEvent} disabled={savingEvent}>{savingEvent ? 'Creating...' : 'Create Event'}</button>
                  <button className="admin-btn" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)' }} onClick={() => setShowEventForm(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="admin-card-title" style={{ marginBottom: 0 }}>Your Events</h3>
              <button className="admin-btn admin-btn-primary admin-btn-small" onClick={() => setShowEventForm(true)}>+ Create Event</button>
            </div>
            {events.length === 0 ? (<div className="admin-empty">No events yet</div>) : (
              <table className="admin-table">
                <thead><tr><th>Event</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <strong>{event.title?.en || event.title}</strong>
                        {event.description?.en && <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{event.description.en}</div>}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(event.startsAt).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      <td><span className={`admin-badge ${event.status === 'active' ? 'active' : 'inactive'}`}>{event.status}</span></td>
                      <td><button className="admin-btn-small admin-btn-danger" onClick={() => handleDeleteEvent(event.id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ==================== SETTINGS TAB ==================== */}
      {activeTab === 'settings' && (
        <>
          {/* PIN Code Section */}
          <div className="admin-card">
            <h3 className="admin-card-title">Manual Check-in PIN</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 16, fontSize: 14 }}>
              This 4-digit PIN can be given to customers when QR scanning isn't working.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', maxWidth: 300 }}>
              <input
                type="text"
                className="admin-form-input"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                maxLength="4"
                style={{ width: 120, textAlign: 'center', fontSize: 24, letterSpacing: 8, fontFamily: 'monospace' }}
              />
              <button className="admin-btn admin-btn-primary" onClick={handleSavePin} disabled={savingPin}>
                {savingPin ? 'Saving...' : 'Save PIN'}
              </button>
            </div>
            {pinMessage && (
              <div style={{ marginTop: 12, color: pinMessage.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>
                {pinMessage}
              </div>
            )}
          </div>

          {/* Operating Hours Section */}
          <div className="admin-card" style={{ marginTop: 20 }}>
            <h3 className="admin-card-title">Operating Hours</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 16, fontSize: 14 }}>
              Set your opening hours. These will be displayed to users in the app.
            </p>

            <div className="admin-hours-grid">
              {DAY_NAMES.map((day, index) => (
                <div key={day} className="admin-hours-row">
                  <div className="admin-hours-day">{DAY_LABELS[index]}</div>
                  <div className="admin-hours-inputs">
                    {operatingHours[day]?.closed ? (
                      <span style={{ color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>Closed</span>
                    ) : (
                      <>
                        <input
                          type="time"
                          className="admin-form-input admin-time-input"
                          value={operatingHours[day]?.open || '11:00'}
                          onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                        />
                        <span style={{ color: 'var(--admin-text-muted)' }}>to</span>
                        <input
                          type="time"
                          className="admin-form-input admin-time-input"
                          value={operatingHours[day]?.close || '23:00'}
                          onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                        />
                      </>
                    )}
                  </div>
                  <button
                    className={`admin-btn-small ${operatingHours[day]?.closed ? 'admin-btn-success' : ''}`}
                    onClick={() => handleToggleClosed(day)}
                    style={{ minWidth: 80 }}
                  >
                    {operatingHours[day]?.closed ? 'Open' : 'Close'}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20 }}>
              <button className="admin-btn admin-btn-primary" onClick={handleSaveHours} disabled={savingHours}>
                {savingHours ? 'Saving...' : 'Save Hours'}
              </button>
              {hoursMessage && (
                <span style={{ marginLeft: 12, color: hoursMessage.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>
                  {hoursMessage}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}