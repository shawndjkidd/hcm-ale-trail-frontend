import { useState, useEffect } from 'react';
import { getBreweryDashboard, getBreweries, updateBreweryPin } from './adminApi';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
} from 'recharts';

const TRAIL_ID = '89e5e2d6-090b-448a-8e53-6d05b731a921';

const CHART_COLORS = ['#f97316', '#4d5a3c', '#64748b', '#84cc16'];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BreweryDashboard({ breweryId: initialBreweryId, isHQ = false }) {
  const [breweryId, setBreweryId] = useState(initialBreweryId);
  const [breweries, setBreweries] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('7d');
  
  // PIN code state
  const [pinCode, setPinCode] = useState('');
  const [editingPin, setEditingPin] = useState(false);
  const [newPin, setNewPin] = useState('');

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
      // Load PIN from response
      if (result.brewery?.pinCode) {
        setPinCode(result.brewery.pinCode);
      }
    } else {
      setError(result.error || 'Failed to load data');
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
            {ratings.avgRatingVenue?.toFixed(1) || '--'} stars
          </div>
          <div className="admin-kpi-subtext">
            Trail avg: {ratings.avgRatingTrail?.toFixed(1) || '--'} stars
          </div>
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

      {today.participantIds?.length > 0 && (
        <div className="admin-card">
          <h3 className="admin-card-title">Today's Visitors</h3>
          <div style={{ color: 'var(--admin-text-muted)' }}>
            {today.participantIds.length} participant(s) checked in today
          </div>
        </div>
      )}

      {ratings.topRatedBeers?.length > 0 && (
        <div className="admin-card">
          <h3 className="admin-card-title">Your Top Beers</h3>
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
                  <td>{beer.avgRating?.toFixed(1)} stars</td>
                  <td>{beer.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Check-in PIN - Small box at bottom */}
      <div className="admin-card" style={{ maxWidth: 400 }}>
        <h3 className="admin-card-title" style={{ fontSize: 16 }}>Manual Check-in Code</h3>
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
    </div>
  );
}