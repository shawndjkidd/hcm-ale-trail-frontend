import { useState, useEffect } from 'react';
import { getBreweryDashboard, getBreweryEvents, createBreweryEvent, deleteEvent, updateBreweryPin, updateBreweryHours, getTrailBreweries, TRAIL_ID } from './adminApi';

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

export default function BreweryDashboard({ breweryId: propBreweryId, isHQ = false }) {
  const [selectedBreweryId, setSelectedBreweryId] = useState(propBreweryId || '');
  const [breweries, setBreweries] = useState([]);
  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  const [pinCode, setPinCode] = useState('');
  const [savingPin, setSavingPin] = useState(false);
  const [pinMessage, setPinMessage] = useState('');

  const [operatingHours, setOperatingHours] = useState(DEFAULT_HOURS);
  const [savingHours, setSavingHours] = useState(false);
  const [hoursMessage, setHoursMessage] = useState('');

  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({ titleEn: '', titleVn: '', descriptionEn: '', descriptionVn: '', startsAt: '', endsAt: '', link: '' });
  const [savingEvent, setSavingEvent] = useState(false);

  const breweryId = propBreweryId || selectedBreweryId;

  useEffect(() => {
    if (isHQ) {
      getTrailBreweries(TRAIL_ID).then(result => {
        if (result.ok) {
          setBreweries(result.breweries || []);
          if (!selectedBreweryId && result.breweries?.length > 0) {
            setSelectedBreweryId(result.breweries[0].id);
          }
        }
      });
    }
  }, [isHQ]);

  const loadData = async (from, to) => {
    if (!breweryId) {
      setLoading(false);
      return;
    }
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
    if (!breweryId) return;
    let from, to;
    const now = new Date();
    to = now.toISOString();
    if (dateRange === '24h') from = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    else if (dateRange === '7d') from = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    else if (dateRange === '30d') from = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    loadData(from, to);
  }, [breweryId, dateRange]);

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

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Delete this event?')) return;
    const result = await deleteEvent(eventId);
    if (result.ok) setEvents(events.filter(e => e.id !== eventId));
    else alert(result.error || 'Failed to delete');
  };

  const handleCreateEvent = async () => {
    if (!eventForm.titleEn || !eventForm.startsAt) {
      alert('Title (English) and Start Date/Time are required');
      return;
    }
    setSavingEvent(true);
    const eventData = {
      trail_id: TRAIL_ID,
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

  // Aggregate beer ratings from latest ratings
  const getBeerRatings = () => {
    const latest = data?.ratings?.latest || [];
    const beerMap = {};
    latest.forEach(r => {
      const name = r.beer_name || r.beerName || 'Unknown Beer';
      if (!beerMap[name]) {
        beerMap[name] = { totalRating: 0, count: 0, ratings: [] };
      }
      beerMap[name].totalRating += r.rating;
      beerMap[name].count += 1;
      beerMap[name].ratings.push(r);
    });
    return Object.entries(beerMap)
      .map(([name, data]) => ({
        beerName: name,
        avgRating: data.totalRating / data.count,
        count: data.count,
        ratings: data.ratings
      }))
      .sort((a, b) => b.avgRating - a.avgRating);
  };

  if (isHQ && !breweryId && breweries.length === 0) {
    return <div className="admin-content"><div className="admin-loading"><div className="admin-spinner" /></div></div>;
  }

  if (loading && !data) {
    return (
      <div className="admin-content">
        {isHQ && (
          <div style={{ marginBottom: 20 }}>
            <label className="admin-form-label">Select Brewery</label>
            <select className="admin-form-input" style={{ maxWidth: 300 }} value={selectedBreweryId} onChange={(e) => setSelectedBreweryId(e.target.value)}>
              {breweries.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
        <div className="admin-loading"><div className="admin-spinner" /></div>
      </div>
    );
  }

  if (error && !data) {
    return <div className="admin-content"><div className="admin-error">{error}</div></div>;
  }

  const brewery = data?.brewery || {};
  const totals = data?.totals || {};
  const ratings = data?.ratings || {};
  const ranking = data?.ranking || {};
  const checkinsByBrewery = data?.checkinsByBrewery || [];
  const journeyStats = data?.journeyStats || {};
  const beerRatings = getBeerRatings();

  return (
    <div className="admin-content">
      {isHQ && (
        <div style={{ marginBottom: 20 }}>
          <label className="admin-form-label">Select Brewery</label>
          <select className="admin-form-input" style={{ maxWidth: 300 }} value={selectedBreweryId} onChange={(e) => setSelectedBreweryId(e.target.value)}>
            {breweries.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      <h1 className="admin-page-title">{brewery.name || 'Brewery'} Dashboard</h1>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`admin-tab ${activeTab === 'ratings' ? 'active' : ''}`} onClick={() => setActiveTab('ratings')}>Beer Ratings</button>
        <button className={`admin-tab ${activeTab === 'competition' ? 'active' : ''}`} onClick={() => setActiveTab('competition')}>Trail Competition</button>
        <button className={`admin-tab ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>Events ({events.length})</button>
        <button className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="admin-filters">
            <button className={`admin-quick-filter ${dateRange === '24h' ? 'active' : ''}`} onClick={() => setDateRange('24h')}>Last 24h</button>
            <button className={`admin-quick-filter ${dateRange === '7d' ? 'active' : ''}`} onClick={() => setDateRange('7d')}>Last 7 days</button>
            <button className={`admin-quick-filter ${dateRange === '30d' ? 'active' : ''}`} onClick={() => setDateRange('30d')}>Last 30 days</button>
          </div>

          <div className="admin-kpi-grid">
            <div className="admin-kpi-card"><div className="admin-kpi-label">Total Check-ins</div><div className="admin-kpi-value primary">{totals.checkins || 0}</div></div>
            <div className="admin-kpi-card"><div className="admin-kpi-label">Trail Rank</div><div className="admin-kpi-value primary">{ranking.rank || '--'}<span style={{ fontSize: 14, color: 'var(--admin-text-muted)' }}> / {ranking.totalBreweriesWithCheckins || '--'}</span></div></div>
            <div className="admin-kpi-card"><div className="admin-kpi-label">Avg Beer Rating</div><div className="admin-kpi-value">{ratings.avgRatingVenue?.toFixed(1) || '--'}★</div><div className="admin-kpi-subtext">{ratings.countVenue || 0} ratings</div></div>
            <div className="admin-kpi-card"><div className="admin-kpi-label">Hat Claims Here</div><div className="admin-kpi-value success">{journeyStats.hatClaimsHere || 0}</div></div>
          </div>

          <div className="admin-grid-3">
            <div className="admin-card"><h3 className="admin-card-title">Started Here</h3><div className="admin-kpi-value" style={{ fontSize: 48, textAlign: 'center' }}>{journeyStats.startedHere || 0}</div><div className="admin-kpi-subtext" style={{ textAlign: 'center' }}>participants began their trail here</div></div>
            <div className="admin-card"><h3 className="admin-card-title">Ended Here</h3><div className="admin-kpi-value" style={{ fontSize: 48, textAlign: 'center' }}>{journeyStats.endedHere || 0}</div><div className="admin-kpi-subtext" style={{ textAlign: 'center' }}>participants finished their trail here</div></div>
            <div className="admin-card"><h3 className="admin-card-title">Hat Claims</h3><div className="admin-kpi-value success" style={{ fontSize: 48, textAlign: 'center' }}>{journeyStats.hatClaimsHere || 0}</div><div className="admin-kpi-subtext" style={{ textAlign: 'center' }}>hats claimed at this location</div></div>
          </div>

          {beerRatings.length > 0 && (
            <div className="admin-card">
              <h3 className="admin-card-title">Top Rated Beers</h3>
              <table className="admin-table"><thead><tr><th>Beer</th><th>Avg Rating</th><th># Ratings</th></tr></thead><tbody>
                {beerRatings.slice(0, 5).map((beer, i) => (
                  <tr key={i}><td><strong>{beer.beerName}</strong></td><td>{beer.avgRating.toFixed(2)}★</td><td>{beer.count}</td></tr>
                ))}
              </tbody></table>
            </div>
          )}
        </>
      )}

      {activeTab === 'ratings' && (
        <>
          <div className="admin-grid-2">
            <div className="admin-card">
              <h3 className="admin-card-title">Rating Summary</h3>
              <div className="admin-kpi-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="admin-kpi-card"><div className="admin-kpi-label">Overall Avg</div><div className="admin-kpi-value primary">{ratings.avgRatingVenue?.toFixed(1) || '--'}★</div></div>
                <div className="admin-kpi-card"><div className="admin-kpi-label">Total Ratings</div><div className="admin-kpi-value">{ratings.countVenue || 0}</div></div>
              </div>
              {beerRatings.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--admin-border)' }}>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Highest Rated</span>
                    <span><strong>{beerRatings[0].beerName}</strong> ({beerRatings[0].avgRating.toFixed(2)}★)</span>
                  </div>
                  {beerRatings.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span style={{ color: 'var(--admin-text-muted)' }}>Lowest Rated</span>
                      <span><strong>{beerRatings[beerRatings.length - 1].beerName}</strong> ({beerRatings[beerRatings.length - 1].avgRating.toFixed(2)}★)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="admin-card">
              <h3 className="admin-card-title">Trail Comparison</h3>
              <div className="admin-kpi-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="admin-kpi-card"><div className="admin-kpi-label">Your Avg</div><div className="admin-kpi-value">{ratings.avgRatingVenue?.toFixed(1) || '--'}★</div></div>
                <div className="admin-kpi-card"><div className="admin-kpi-label">Trail Avg</div><div className="admin-kpi-value">{ratings.avgRatingTrail?.toFixed(1) || '--'}★</div></div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title">All Beer Ratings</h3>
            {beerRatings.length === 0 ? (<div className="admin-empty">No beer ratings yet</div>) : (
              <table className="admin-table"><thead><tr><th>Beer</th><th>Avg Rating</th><th># Ratings</th></tr></thead><tbody>
                {beerRatings.map((beer, i) => (
                  <tr key={i}>
                    <td><strong>{beer.beerName}</strong></td>
                    <td><span style={{ color: beer.avgRating >= 4 ? 'var(--admin-success)' : beer.avgRating >= 3 ? 'var(--admin-warning)' : 'var(--admin-danger)' }}>{beer.avgRating.toFixed(2)}★</span></td>
                    <td>{beer.count}</td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title">Recent Reviews</h3>
            {(ratings.latest || []).length === 0 ? (<div className="admin-empty">No reviews yet</div>) : (
              <div>
                {(ratings.latest || []).map((r, i) => (
                  <div key={i} style={{ padding: '12px 0', borderBottom: i < ratings.latest.length - 1 ? '1px solid var(--admin-border)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong>{r.beer_name || r.beerName}</strong>
                      <span style={{ color: r.rating >= 4 ? 'var(--admin-success)' : 'var(--admin-text-muted)' }}>{r.rating}★</span>
                    </div>
                    {r.notes && <div style={{ color: 'var(--admin-text-muted)', fontSize: 14, fontStyle: 'italic' }}>"{r.notes}"</div>}
                    <div style={{ color: 'var(--admin-text-muted)', fontSize: 12, marginTop: 4 }}>{new Date(r.created_at || r.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'competition' && (
        <div className="admin-card">
          <h3 className="admin-card-title">Trail Competition</h3>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: 16 }}>See how you rank against other breweries on the trail.</p>
          {checkinsByBrewery.length === 0 ? (<div className="admin-empty">No data yet</div>) : (
            <table className="admin-table"><thead><tr><th>Rank</th><th>Brewery</th><th>Check-ins</th></tr></thead><tbody>
              {checkinsByBrewery.sort((a, b) => b.count - a.count).map((b, index) => {
                const isYou = b.breweryId === breweryId;
                return (
                  <tr key={b.breweryId} style={isYou ? { background: 'rgba(249, 115, 22, 0.15)' } : {}}>
                    <td>
                      <span className={`admin-rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'default'}`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </span>
                    </td>
                    <td><strong>{b.breweryName}</strong>{isYou && <span style={{ marginLeft: 8, color: 'var(--admin-primary)', fontSize: 12 }}>(You)</span>}</td>
                    <td><strong>{b.count}</strong></td>
                  </tr>
                );
              })}
            </tbody></table>
          )}
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 12, marginTop: 16 }}>
            💡 More stats coming soon: Hat Claims, Avg Rating, Top Beer per brewery
          </p>
        </div>
      )}

      {activeTab === 'events' && (
        <>
          {showEventForm && (
            <div className="admin-modal-overlay" onClick={() => setShowEventForm(false)}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <h3 style={{ marginBottom: 20 }}>Create Event</h3>
                <div className="admin-form-group"><label className="admin-form-label">Title (English) *</label><input type="text" className="admin-form-input" value={eventForm.titleEn} onChange={(e) => setEventForm({...eventForm, titleEn: e.target.value})} /></div>
                <div className="admin-form-group"><label className="admin-form-label">Title (Vietnamese)</label><input type="text" className="admin-form-input" value={eventForm.titleVn} onChange={(e) => setEventForm({...eventForm, titleVn: e.target.value})} /></div>
                <div className="admin-form-group"><label className="admin-form-label">Description</label><textarea className="admin-form-input" value={eventForm.descriptionEn} onChange={(e) => setEventForm({...eventForm, descriptionEn: e.target.value})} rows={2} /></div>
                <div className="admin-form-group"><label className="admin-form-label">Start Date/Time *</label><input type="datetime-local" className="admin-form-input" value={eventForm.startsAt} onChange={(e) => setEventForm({...eventForm, startsAt: e.target.value})} /></div>
                <div className="admin-form-group"><label className="admin-form-label">End Date/Time</label><input type="datetime-local" className="admin-form-input" value={eventForm.endsAt} onChange={(e) => setEventForm({...eventForm, endsAt: e.target.value})} /></div>
                <div className="admin-form-group"><label className="admin-form-label">Link</label><input type="url" className="admin-form-input" value={eventForm.link} onChange={(e) => setEventForm({...eventForm, link: e.target.value})} /></div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}><button className="admin-btn admin-btn-primary" onClick={handleCreateEvent} disabled={savingEvent}>{savingEvent ? 'Creating...' : 'Create Event'}</button><button className="admin-btn" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)' }} onClick={() => setShowEventForm(false)}>Cancel</button></div>
              </div>
            </div>
          )}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><h3 className="admin-card-title" style={{ marginBottom: 0 }}>Events</h3><button className="admin-btn admin-btn-primary admin-btn-small" onClick={() => setShowEventForm(true)}>+ Create Event</button></div>
            {events.length === 0 ? (<div className="admin-empty">No events yet</div>) : (
              <table className="admin-table"><thead><tr><th>Event</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>
                {events.map((event) => (
                  <tr key={event.id}><td><strong>{event.title?.en || event.title}</strong></td><td style={{ whiteSpace: 'nowrap' }}>{new Date(event.startsAt).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td><span className={`admin-badge ${event.status === 'active' ? 'active' : 'inactive'}`}>{event.status}</span></td><td><button className="admin-btn-small admin-btn-danger" onClick={() => handleDeleteEvent(event.id)}>Delete</button></td></tr>
                ))}
              </tbody></table>
            )}
          </div>
        </>
      )}

      {activeTab === 'settings' && (
        <>
          <div className="admin-card">
            <h3 className="admin-card-title">Fallback PIN Code</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 16 }}>4-digit PIN for manual check-ins when QR fails.</p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input type="text" className="admin-form-input" style={{ width: 120, fontSize: 24, textAlign: 'center', letterSpacing: 8 }} value={pinCode} onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength="4" placeholder="1234" />
              <button className="admin-btn admin-btn-primary" onClick={handleSavePin} disabled={savingPin}>{savingPin ? 'Saving...' : 'Save PIN'}</button>
              {pinMessage && <span style={{ color: pinMessage.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{pinMessage}</span>}
            </div>
          </div>

          <div className="admin-card" style={{ marginTop: 20 }}>
            <h3 className="admin-card-title">Operating Hours</h3>
            <p style={{ color: 'var(--admin-text-muted)', marginBottom: 16 }}>Set your weekly operating hours.</p>
            <div className="admin-hours-grid">
              {DAY_NAMES.map((day, index) => (
                <div key={day} className="admin-hours-row">
                  <div className="admin-hours-day">{DAY_LABELS[index]}</div>
                  <div className="admin-hours-inputs">
                    {operatingHours[day]?.closed ? (
                      <span style={{ color: 'var(--admin-text-muted)' }}>Closed</span>
                    ) : (
                      <>
                        <input type="time" className="admin-time-input" value={operatingHours[day]?.open || '11:00'} onChange={(e) => handleHoursChange(day, 'open', e.target.value)} />
                        <span>to</span>
                        <input type="time" className="admin-time-input" value={operatingHours[day]?.close || '23:00'} onChange={(e) => handleHoursChange(day, 'close', e.target.value)} />
                      </>
                    )}
                  </div>
                  <button className={`admin-btn-small ${operatingHours[day]?.closed ? 'admin-btn-danger' : 'admin-btn-success'}`} onClick={() => handleToggleClosed(day)}>{operatingHours[day]?.closed ? 'Closed' : 'Open'}</button>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
              <button className="admin-btn admin-btn-primary" onClick={handleSaveHours} disabled={savingHours}>{savingHours ? 'Saving...' : 'Save Hours'}</button>
              {hoursMessage && <span style={{ color: hoursMessage.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{hoursMessage}</span>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}