import { useState, useEffect } from 'react';
import { getTrailOverview, getTrailEvents, getAdminLeaderboard, exportParticipants, deleteEvent, TRAIL_ID } from './adminApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const CHART_COLORS = ['#f97316', '#4d5a3c', '#64748b', '#84cc16', '#fb923c', '#94a3b8'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

async function createTrailEvent(trailId, eventData) {
  const token = localStorage.getItem('hcm-access-token');
  const res = await fetch(`/api/admin/trails/${trailId}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(eventData)
  });
  return res.json();
}

export default function HQDashboard() {
  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [exporting, setExporting] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    titleEn: '', titleVn: '', descriptionEn: '', descriptionVn: '', startsAt: '', endsAt: '', link: ''
  });
  const [savingEvent, setSavingEvent] = useState(false);

  const loadData = async (from, to) => {
    setLoading(true);
    setError('');
    const [overviewResult, eventsResult, leaderboardResult] = await Promise.all([
      getTrailOverview(TRAIL_ID, from, to),
      getTrailEvents(TRAIL_ID),
      getAdminLeaderboard(TRAIL_ID, 50)
    ]);
    if (overviewResult.ok) setData(overviewResult);
    else setError(overviewResult.error || 'Failed to load data');
    if (eventsResult.ok) setEvents(eventsResult.events || []);
    if (leaderboardResult.ok) setLeaderboard(leaderboardResult.leaderboard || []);
    setLoading(false);
  };

  useEffect(() => {
    let from, to;
    const now = new Date();
    to = now.toISOString();
    if (dateRange === '24h') from = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    else if (dateRange === '7d') from = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    else if (dateRange === '30d') from = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    else if (dateRange === 'custom' && fromDate && toDate) {
      from = new Date(fromDate).toISOString();
      to = new Date(toDate + 'T23:59:59').toISOString();
    }
    loadData(from, to);
  }, [dateRange, fromDate, toDate]);

  const formatTime = (ms) => {
    if (!ms) return '--';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handleExport = async (format) => {
    setExporting(true);
    const result = await exportParticipants(TRAIL_ID, format);
    if (result.ok && format === 'json') {
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participants-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } else if (!result.ok) {
      alert(result.error || 'Export failed');
    }
    setExporting(false);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Delete this event?')) return;
    const result = await deleteEvent(eventId);
    if (result.ok) setEvents(events.filter(e => e.id !== eventId));
    else alert(result.error || 'Failed to delete');
  };

  const handleCreateTrailEvent = async () => {
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
    const result = await createTrailEvent(TRAIL_ID, eventData);
    if (result.ok) {
      setEvents([...events, result.event]);
      setShowEventForm(false);
      setEventForm({ titleEn: '', titleVn: '', descriptionEn: '', descriptionVn: '', startsAt: '', endsAt: '', link: '' });
    } else {
      alert(result.error || 'Failed to create event');
    }
    setSavingEvent(false);
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

  const totals = data?.totals || {};
  const completion = data?.completion || {};
  const checkinsByBrewery = data?.checkinsByBrewery || [];
  const dropoffFunnel = data?.dropoffFunnel || [];
  const busiest = data?.busiest || {};
  const participantsByCountry = data?.participantsByCountry || [];
  const avgRatingByBrewery = data?.avgRatingByBrewery || [];
  const checkinsTrend = data?.checkinsTrendDaily || [];
  const journeyStats = data?.journeyStats || {};
  const funnelData = dropoffFunnel.map(d => ({ name: `${d.stamps} stamps`, value: d.count }));
  const trailEvents = events.filter(e => !e.breweryId);
  const breweryEvents = events.filter(e => e.breweryId);

  return (
    <div className="admin-content">
      <h1 className="admin-page-title">HQ Dashboard</h1>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`admin-tab ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>Events ({events.length})</button>
        <button className={`admin-tab ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>Leaderboard</button>
        <button className={`admin-tab ${activeTab === 'export' ? 'active' : ''}`} onClick={() => setActiveTab('export')}>Export</button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="admin-filters">
            <button className={`admin-quick-filter ${dateRange === '24h' ? 'active' : ''}`} onClick={() => setDateRange('24h')}>Last 24h</button>
            <button className={`admin-quick-filter ${dateRange === '7d' ? 'active' : ''}`} onClick={() => setDateRange('7d')}>Last 7 days</button>
            <button className={`admin-quick-filter ${dateRange === '30d' ? 'active' : ''}`} onClick={() => setDateRange('30d')}>Last 30 days</button>
            <span style={{ color: 'var(--admin-text-muted)' }}>|</span>
            <input type="date" className="admin-date-input" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setDateRange('custom'); }} />
            <span style={{ color: 'var(--admin-text-muted)' }}>to</span>
            <input type="date" className="admin-date-input" value={toDate} onChange={(e) => { setToDate(e.target.value); setDateRange('custom'); }} />
          </div>

          <div className="admin-kpi-grid">
            <div className="admin-kpi-card">
              <div className="admin-kpi-label">Total Check-ins</div>
              <div className="admin-kpi-value primary">{totals.checkins || 0}</div>
            </div>
            <div className="admin-kpi-card">
              <div className="admin-kpi-label">New Participants</div>
              <div className="admin-kpi-value primary">{totals.newParticipants || 0}</div>
            </div>
            <div className="admin-kpi-card">
              <div className="admin-kpi-label">Hat Claims</div>
              <div className="admin-kpi-value success">{totals.hatClaims || 0}</div>
            </div>
            <div className="admin-kpi-card">
              <div className="admin-kpi-label">Ratings</div>
              <div className="admin-kpi-value">{totals.ratingsCount || 0}</div>
              <div className="admin-kpi-subtext">Avg: {totals.ratingsAvg?.toFixed(1) || '--'} stars</div>
            </div>
            <div className="admin-kpi-card">
              <div className="admin-kpi-label">Completed Trails</div>
              <div className="admin-kpi-value success">{completion.completedCount || 0}</div>
              <div className="admin-kpi-subtext">{completion.completionRatePercent?.toFixed(1) || 0}% completion rate</div>
            </div>
            <div className="admin-kpi-card">
              <div className="admin-kpi-label">Avg Completion Time</div>
              <div className="admin-kpi-value">{formatTime(completion.avgTimeToCompleteMs)}</div>
            </div>
          </div>

          <div className="admin-grid-3">
            <div className="admin-card">
              <h3 className="admin-card-title">Top Starting Breweries</h3>
              {(journeyStats.topStartingBreweries || []).length === 0 ? (
                <div className="admin-empty">No data yet</div>
              ) : (
                <table className="admin-table">
                  <thead><tr><th>Rank</th><th>Brewery</th><th>Count</th></tr></thead>
                  <tbody>
                    {(journeyStats.topStartingBreweries || []).map((b, i) => (
                      <tr key={b.breweryId}>
                        <td><span className={`admin-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'default'}`}>{b.rank}</span></td>
                        <td>{b.breweryName}</td>
                        <td><strong>{b.count}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="admin-card">
              <h3 className="admin-card-title">Top Ending Breweries</h3>
              {(journeyStats.topEndingBreweries || []).length === 0 ? (
                <div className="admin-empty">No data yet</div>
              ) : (
                <table className="admin-table">
                  <thead><tr><th>Rank</th><th>Brewery</th><th>Count</th></tr></thead>
                  <tbody>
                    {(journeyStats.topEndingBreweries || []).map((b, i) => (
                      <tr key={b.breweryId}>
                        <td><span className={`admin-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'default'}`}>{b.rank}</span></td>
                        <td>{b.breweryName}</td>
                        <td><strong>{b.count}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="admin-card">
              <h3 className="admin-card-title">Top Hat Claim Locations</h3>
              {(journeyStats.topHatClaimLocations || []).length === 0 ? (
                <div className="admin-empty">No data yet</div>
              ) : (
                <table className="admin-table">
                  <thead><tr><th>Rank</th><th>Brewery</th><th>Count</th></tr></thead>
                  <tbody>
                    {(journeyStats.topHatClaimLocations || []).map((b, i) => (
                      <tr key={b.breweryId}>
                        <td><span className={`admin-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'default'}`}>{b.rank}</span></td>
                        <td>{b.breweryName}</td>
                        <td><strong>{b.count}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="admin-grid-2">
            <div className="admin-card">
              <h3 className="admin-card-title">Check-ins by Brewery</h3>
              <table className="admin-table">
                <thead><tr><th>Rank</th><th>Brewery</th><th>Check-ins</th></tr></thead>
                <tbody>
                  {checkinsByBrewery.sort((a, b) => b.count - a.count).map((brewery, index) => (
                    <tr key={brewery.breweryId}>
                      <td><span className={`admin-rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'default'}`}>{index + 1}</span></td>
                      <td>{brewery.breweryName}</td>
                      <td><strong>{brewery.count}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-card">
              <h3 className="admin-card-title">Daily Check-ins</h3>
              <div className="admin-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={checkinsTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--admin-text-muted)', fontSize: 12 }} tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                    <YAxis tick={{ fill: 'var(--admin-text-muted)', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 8 }} />
                    <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="admin-grid-2">
            <div className="admin-card">
              <h3 className="admin-card-title">Drop-off Funnel</h3>
              <div className="admin-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
                    <XAxis type="number" tick={{ fill: 'var(--admin-text-muted)', fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'var(--admin-text-muted)', fontSize: 12 }} width={80} />
                    <Tooltip contentStyle={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 8 }} />
                    <Bar dataKey="value" fill="#4d5a3c" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="admin-card">
              <h3 className="admin-card-title">Ratings by Brewery</h3>
              {avgRatingByBrewery.length === 0 ? (
                <div className="admin-empty">No ratings yet</div>
              ) : (
                <table className="admin-table">
                  <thead><tr><th>Brewery</th><th>Avg Rating</th><th>Count</th></tr></thead>
                  <tbody>
                    {avgRatingByBrewery.sort((a, b) => b.avgRating - a.avgRating).map((brewery) => (
                      <tr key={brewery.breweryId}>
                        <td>{brewery.breweryName}</td>
                        <td>{brewery.avgRating?.toFixed(1)} stars</td>
                        <td>{brewery.ratingsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="admin-grid-3">
            <div className="admin-card">
              <h3 className="admin-card-title">By Country</h3>
              {participantsByCountry.length === 0 ? (
                <div className="admin-empty">No data</div>
              ) : (
                <div className="admin-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={participantsByCountry} cx="50%" cy="50%" labelLine={false} label={({ country, count }) => `${country}: ${count}`} outerRadius={80} dataKey="count" nameKey="country">
                        {participantsByCountry.map((entry, index) => (<Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />))}
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
                <div style={{ marginBottom: 16 }}>
                  <div className="admin-kpi-label">Busiest Day</div>
                  <div style={{ fontSize: 24, fontWeight: 600 }}>{DAY_NAMES[busiest.busiestDayOfWeek] || '--'}</div>
                </div>
                <div>
                  <div className="admin-kpi-label">Peak Hour</div>
                  <div style={{ fontSize: 24, fontWeight: 600 }}>{busiest.busiestHourOfDay !== undefined ? `${busiest.busiestHourOfDay}:00 - ${busiest.busiestHourOfDay + 1}:00` : '--'}</div>
                </div>
              </div>
            </div>
            <div className="admin-card">
              <h3 className="admin-card-title">Top Rated Beers</h3>
              {!data?.topRatedBeers?.length ? (
                <div className="admin-empty"><p>Not enough ratings yet</p><p style={{ fontSize: 12, marginTop: 8 }}>Needs 3+ ratings per beer</p></div>
              ) : (
                <table className="admin-table">
                  <thead><tr><th>Beer</th><th>Brewery</th><th>Rating</th></tr></thead>
                  <tbody>
                    {(data?.topRatedBeers || []).slice(0, 5).map((beer, i) => (
                      <tr key={i}><td>{beer.beerName}</td><td style={{ color: 'var(--admin-text-muted)' }}>{beer.breweryName}</td><td>{beer.avgRating?.toFixed(1)} stars</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'events' && (
        <>
          {showEventForm && (
            <div className="admin-modal-overlay" onClick={() => setShowEventForm(false)}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <h3 style={{ marginBottom: 20 }}>Create Trail Event</h3>
                <p style={{ color: 'var(--admin-text-muted)', marginBottom: 20, fontSize: 14 }}>This event will appear on the main Events page (not tied to any brewery).</p>
                <div className="admin-form-group">
                  <label className="admin-form-label">Title (English) *</label>
                  <input type="text" className="admin-form-input" value={eventForm.titleEn} onChange={(e) => setEventForm({...eventForm, titleEn: e.target.value})} placeholder="Ale Trail Kickoff Party" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Title (Vietnamese)</label>
                  <input type="text" className="admin-form-input" value={eventForm.titleVn} onChange={(e) => setEventForm({...eventForm, titleVn: e.target.value})} placeholder="Tiệc khai mạc Ale Trail" />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Description (English)</label>
                  <textarea className="admin-form-input" value={eventForm.descriptionEn} onChange={(e) => setEventForm({...eventForm, descriptionEn: e.target.value})} placeholder="Join us for the official launch!" rows={2} />
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
                  <input type="url" className="admin-form-input" value={eventForm.link} onChange={(e) => setEventForm({...eventForm, link: e.target.value})} placeholder="https://facebook.com/events/..." />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button className="admin-btn admin-btn-primary" onClick={handleCreateTrailEvent} disabled={savingEvent}>{savingEvent ? 'Creating...' : 'Create Event'}</button>
                  <button className="admin-btn" style={{ background: 'var(--admin-border)', color: 'var(--admin-text)' }} onClick={() => setShowEventForm(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="admin-card-title" style={{ marginBottom: 0 }}>Trail Events</h3>
              <button className="admin-btn admin-btn-primary admin-btn-small" onClick={() => setShowEventForm(true)}>Create Trail Event</button>
            </div>
            {trailEvents.length === 0 ? (<div className="admin-empty">No trail-wide events yet</div>) : (
              <table className="admin-table">
                <thead><tr><th>Event</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {trailEvents.map((event) => (
                    <tr key={event.id}>
                      <td><strong>{event.title?.en || event.title}</strong>{event.description?.en && <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{event.description.en}</div>}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(event.startsAt).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      <td><span className={`admin-badge ${event.status === 'active' ? 'active' : 'inactive'}`}>{event.status}</span></td>
                      <td><button className="admin-btn-small admin-btn-danger" onClick={() => handleDeleteEvent(event.id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="admin-card">
            <h3 className="admin-card-title">Brewery Events</h3>
            {breweryEvents.length === 0 ? (<div className="admin-empty">No brewery events yet</div>) : (
              <table className="admin-table">
                <thead><tr><th>Event</th><th>Brewery</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {breweryEvents.map((event) => (
                    <tr key={event.id}>
                      <td><strong>{event.title?.en || event.title}</strong>{event.description?.en && <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{event.description.en}</div>}</td>
                      <td>{event.breweryName}</td>
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

      {activeTab === 'leaderboard' && (
        <div className="admin-card">
          <h3 className="admin-card-title">Leaderboard (with Contact Info)</h3>
          {leaderboard.length === 0 ? (<div className="admin-empty">No completions yet</div>) : (
            <table className="admin-table">
              <thead><tr><th>Rank</th><th>Name</th><th>Email</th><th>Time</th><th>Completed</th></tr></thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr key={entry.participantId}>
                    <td><span className={`admin-rank ${entry.rank === 1 ? 'gold' : entry.rank === 2 ? 'silver' : entry.rank === 3 ? 'bronze' : 'default'}`}>{entry.rank}</span></td>
                    <td><strong>{entry.displayName || entry.name || '--'}</strong></td>
                    <td><a href={`mailto:${entry.email}`} style={{ color: 'var(--admin-primary)' }}>{entry.email}</a></td>
                    <td>{formatTime(entry.completionTimeMs)}</td>
                    <td style={{ color: 'var(--admin-text-muted)' }}>{new Date(entry.completedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'export' && (
        <div className="admin-card">
          <h3 className="admin-card-title">Export Participants</h3>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: 20 }}>Download a list of all participants with their email, name, country, and progress.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="admin-btn admin-btn-primary" style={{ width: 'auto' }} onClick={() => handleExport('json')} disabled={exporting}>{exporting ? 'Exporting...' : 'Export JSON'}</button>
            <button className="admin-btn admin-btn-secondary" style={{ width: 'auto' }} onClick={() => handleExport('csv')} disabled={exporting}>{exporting ? 'Exporting...' : 'Export CSV'}</button>
          </div>
        </div>
      )}
    </div>
  );
}