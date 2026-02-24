import { useState, useEffect } from 'react';
import { getTrailOverview } from './adminApi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const TRAIL_ID = '89e5e2d6-090b-448a-8e53-6d05b731a921';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HQDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadData = async (from, to) => {
    setLoading(true);
    setError('');
    
    const result = await getTrailOverview(TRAIL_ID, from, to);
    
    if (result.ok) {
      setData(result);
    } else {
      setError(result.error || 'Failed to load data');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    let from, to;
    const now = new Date();
    to = now.toISOString();
    
    if (dateRange === '24h') {
      from = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    } else if (dateRange === '7d') {
      from = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (dateRange === '30d') {
      from = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (dateRange === 'custom' && fromDate && toDate) {
      from = new Date(fromDate).toISOString();
      to = new Date(toDate + 'T23:59:59').toISOString();
    }
    
    loadData(from, to);
  }, [dateRange, fromDate, toDate]);

  const formatTime = (ms) => {
    if (!ms) return '--';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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

  const funnelData = dropoffFunnel.map(d => ({
    name: `${d.stamps} stamps`,
    value: d.count,
    stamps: d.stamps
  }));

  return (
    <div className="admin-content">
      <h1 className="admin-page-title">HQ Dashboard</h1>

      {/* Date Filters */}
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
        <span style={{ color: 'var(--admin-text-muted)' }}>|</span>
        <input
          type="date"
          className="admin-date-input"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setDateRange('custom'); }}
        />
        <span style={{ color: 'var(--admin-text-muted)' }}>to</span>
        <input
          type="date"
          className="admin-date-input"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setDateRange('custom'); }}
        />
      </div>

      {/* KPI Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Total Check-ins</div>
          <div className="admin-kpi-value primary">{totals.checkins || 0}</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">New Participants</div>
          <div className="admin-kpi-value">{totals.newParticipants || 0}</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Hat Claims</div>
          <div className="admin-kpi-value success">{totals.hatClaims || 0}</div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Ratings</div>
          <div className="admin-kpi-value">{totals.ratingsCount || 0}</div>
          <div className="admin-kpi-subtext">
            Avg: {totals.ratingsAvg?.toFixed(1) || '--'} stars
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Completed Trails</div>
          <div className="admin-kpi-value success">{completion.completedCount || 0}</div>
          <div className="admin-kpi-subtext">
            {completion.completionRatePercent?.toFixed(1) || 0}% completion rate
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-label">Avg Completion Time</div>
          <div className="admin-kpi-value">{formatTime(completion.avgTimeToCompleteMs)}</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="admin-grid-2">
        {/* Check-ins by Brewery */}
        <div className="admin-card">
          <h3 className="admin-card-title">Check-ins by Brewery</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Brewery</th>
                <th>Check-ins</th>
              </tr>
            </thead>
            <tbody>
              {checkinsByBrewery
                .sort((a, b) => b.count - a.count)
                .map((brewery, index) => (
                  <tr key={brewery.breweryId}>
                    <td>
                      <span className={`admin-rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : 'default'}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td>{brewery.breweryName}</td>
                    <td><strong>{brewery.count}</strong></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Daily Trend */}
        <div className="admin-card">
          <h3 className="admin-card-title">Daily Check-ins</h3>
          <div className="admin-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={checkinsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'var(--admin-text-muted)', fontSize: 12 }}
                  tickFormatter={(d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fill: 'var(--admin-text-muted)', fontSize: 12 }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="var(--admin-primary)" 
                  strokeWidth={2}
                  dot={{ fill: 'var(--admin-primary)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="admin-grid-2">
        {/* Drop-off Funnel */}
        <div className="admin-card">
          <h3 className="admin-card-title">Drop-off Funnel</h3>
          <div className="admin-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" />
                <XAxis type="number" tick={{ fill: 'var(--admin-text-muted)', fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fill: 'var(--admin-text-muted)', fontSize: 12 }}
                  width={80}
                />
                <Tooltip />
                <Bar dataKey="value" fill="var(--admin-primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Avg Rating by Brewery */}
        <div className="admin-card">
          <h3 className="admin-card-title">Ratings by Brewery</h3>
          {avgRatingByBrewery.length === 0 ? (
            <div className="admin-empty">No ratings yet</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Brewery</th>
                  <th>Avg Rating</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {avgRatingByBrewery
                  .sort((a, b) => b.avgRating - a.avgRating)
                  .map((brewery) => (
                    <tr key={brewery.breweryId}>
                      <td>{brewery.breweryName}</td>
                      <td>
                        {brewery.avgRating?.toFixed(1)} stars
                      </td>
                      <td>{brewery.ratingsCount}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Row 3 */}
      <div className="admin-grid-3">
        {/* Participants by Country */}
        <div className="admin-card">
          <h3 className="admin-card-title">By Country</h3>
          {participantsByCountry.length === 0 ? (
            <div className="admin-empty">No data</div>
          ) : (
            <div className="admin-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={participantsByCountry}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ country, count }) => `${country}: ${count}`}
                    outerRadius={80}
                    dataKey="count"
                    nameKey="country"
                  >
                    {participantsByCountry.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Busiest Times */}
        <div className="admin-card">
          <h3 className="admin-card-title">Busiest Times</h3>
          <div style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 16 }}>
              <div className="admin-kpi-label">Busiest Day</div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>
                {DAY_NAMES[busiest.busiestDayOfWeek] || '--'}
              </div>
            </div>
            <div>
              <div className="admin-kpi-label">Peak Hour</div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>
                {busiest.busiestHourOfDay !== undefined 
                  ? `${busiest.busiestHourOfDay}:00 - ${busiest.busiestHourOfDay + 1}:00`
                  : '--'}
              </div>
            </div>
          </div>
        </div>

        {/* Top Rated Beers */}
        <div className="admin-card">
          <h3 className="admin-card-title">Top Rated Beers</h3>
          {data?.topRatedBeers?.length === 0 ? (
            <div className="admin-empty">
              <p>Not enough ratings yet</p>
              <p style={{ fontSize: 12, marginTop: 8 }}>Needs 3+ ratings per beer</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Beer</th>
                  <th>Brewery</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topRatedBeers || []).slice(0, 5).map((beer, i) => (
                  <tr key={i}>
                    <td>{beer.beerName}</td>
                    <td style={{ color: 'var(--admin-text-muted)' }}>{beer.breweryName}</td>
                    <td>{beer.avgRating?.toFixed(1)} stars</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}