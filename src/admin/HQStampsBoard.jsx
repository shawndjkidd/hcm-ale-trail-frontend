import { useEffect, useState } from 'react';
import { TRAIL_ID } from './adminApi';

// "Most stamps ever": the same all-time board guests see in the app.
export default function HQStampsBoard() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch(`/api/trails/${TRAIL_ID}/leaderboard?board=stamps`)
      .then((r) => r.json())
      .then((d) => (d?.ok ? setRows(d.leaderboard || []) : setError(d?.error || 'Could not load')))
      .catch(() => setError('Could not load. Check your connection.'));
  }, []);
  if (error) return <div className="admin-empty">{error}</div>;
  if (!rows) return <div className="admin-loading"><div className="admin-spinner" /></div>;
  if (rows.length === 0) return <div className="admin-empty">No stamps yet</div>;
  return (
    <div className="admin-table-wrap"><table className="admin-table">
      <thead><tr><th>Rank</th><th>Name</th><th>Stamps (all time)</th></tr></thead>
      <tbody>{rows.map((r, i) => (
        <tr key={r.userId || r.participantId || i}><td>{r.rank ?? i + 1}</td><td><strong>{r.displayName || '--'}</strong></td><td>{r.stamps}</td></tr>
      ))}</tbody>
    </table></div>
  );
}
