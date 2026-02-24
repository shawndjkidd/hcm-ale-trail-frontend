import { useState, useEffect } from 'react';
import { getBreweryDashboard, getBreweries } from './adminApi';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';

const TRAIL_ID = '89e5e2d6-090b-448a-8e53-6d05b731a921';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BreweryDashboard({ breweryId: initialBreweryId, isHQ = false }) {
  const [breweryId, setBreweryId] = useState(initialBreweryId);
  const [breweries, setBreweries] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('7d');

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
    
    const result = await getBreweryDashboard(breweryId, from, to);
    
    if (result.ok) {
      setData(result);
    } else {
      setError(result.error || 'Failed to load data');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [breweryId, dateRange]);

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
            {ratings.avgRatingVenue?.toFixed(1) || '--'} ⭐
          </div>
          <div className="admin-kpi-subtext">
            Trail avg: {ratings.avgRatingTrail?.toFixed(1) || '--'} ⭐
          </div>
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <h3 className="admin-card-title">📱 Check-in Methods</h3>
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="admin-card">
          <h3 className="admin-card-title">⏰ Busiest Times</h3>
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
        <h3 className="admin-card-title">⭐ Recent Ratings ({ratings.countVenue || 0} total)</h3>
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
                  <td>
                    <span className="admin-stars">
                      {'⭐'.repeat(rating.rating)}
                    </span>
                  </td>
                  <td style={{ color: 'var(--admin-text-muted)', maxWidth: 300 }}>
                    {rating.notes || '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {today.participantIds?.length > 0 && (
        <div className="admin-card">
          <h3 className="admin-card-title">👥 Today's Visitors</h3>
          <div style={{ color: 'var(--admin-text-muted)' }}>
            {today.participantIds.length} participant(s) checked in today
          </div>
        </div>
      )}

      {ratings.topRatedBeers?.length > 0 && (
        <div className="admin-card">
          <h3 className="admin-card-title">🏆 Your Top Beers</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Beer</th>
                <th>Rating</th>
                <th>Reviews</th>
              </tr>
            </thead>
            <tbody>
              {ratings.topRatedBeers.slice(0, 5).map((beer, i) => (
                <tr key={i}>
                  <td><strong>{beer.beerName}</strong></td>
                  <td>⭐ {beer.avgRating?.toFixed(1)}</td>
                  <td>{beer.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}