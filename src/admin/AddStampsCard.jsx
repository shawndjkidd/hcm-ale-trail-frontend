import { useState } from 'react';
import { hqLookupStamps, hqAddStamps } from './adminApi';

// HQ-only: move a guest's paper-card stamps into the app. Look them up by email,
// tick the breweries they had on paper, add. Already-stamped breweries are locked.
export default function AddStampsCard({ trailId }) {
  const [email, setEmail] = useState('');
  const [guest, setGuest] = useState(null);
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const lookup = async (e) => {
    e?.preventDefault();
    setMsg(''); setGuest(null); setPicked([]);
    if (!email.trim()) return;
    setBusy(true);
    const r = await hqLookupStamps(trailId, email.trim());
    setBusy(false);
    if (!r.ok) { setMsg(r.error || 'Could not find that guest'); return; }
    setGuest(r);
  };

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const add = async () => {
    if (picked.length === 0) return;
    setBusy(true);
    const r = await hqAddStamps(trailId, guest.email, picked);
    setBusy(false);
    if (!r.ok) { setMsg(r.error || 'Could not add stamps'); return; }
    setMsg(`✓ Added ${r.added.length} stamp${r.added.length === 1 ? '' : 's'}. ${guest.name || guest.email} now has ${r.total} of ${guest.breweries.length}.`
      + (r.failed?.length ? ` ${r.failed.length} could not be added.` : ''));
    const again = await hqLookupStamps(trailId, guest.email);
    if (again.ok) setGuest(again);
    setPicked([]);
  };

  return (
    <div className="admin-card">
      <h3 className="admin-card-title">Add Stamps (paper card transfer)</h3>
      <p style={{ color: 'var(--admin-text-muted)', marginBottom: 12 }}>
        For guests moving from a paper card. Look them up by the email they signed up with, tick the breweries on their paper card,
        and add. Stamps go onto their current app card straight away and are marked as an HQ transfer.
      </p>
      <form onSubmit={lookup} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input className="admin-form-input" type="email" placeholder="guest@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1 }} />
        <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>{busy && !guest ? 'Looking…' : 'Look up'}</button>
      </form>

      {guest && (
        <>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            {guest.name || 'Guest'} · {guest.email} · {guest.breweries.filter((b) => b.stamped).length} of {guest.breweries.length} stamps
          </div>
          <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
            {guest.breweries.map((b, i) => (
              <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', border: '1px solid var(--admin-border)', borderRadius: 6, opacity: b.stamped ? 0.55 : 1, cursor: b.stamped ? 'default' : 'pointer' }}>
                <input type="checkbox" checked={b.stamped || picked.includes(b.id)} disabled={b.stamped} onChange={() => toggle(b.id)} style={{ width: 18, height: 18 }} />
                <span style={{ fontWeight: 600 }}>{i + 1}. {b.name}</span>
                {b.stamped && <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--admin-success)' }}>Already stamped</span>}
              </label>
            ))}
          </div>
          <button type="button" className="admin-btn admin-btn-primary" disabled={busy || picked.length === 0} onClick={add}>
            {busy ? 'Adding…' : `Add ${picked.length || ''} stamp${picked.length === 1 ? '' : 's'}`}
          </button>
        </>
      )}
      {msg && <p style={{ marginTop: 12, fontSize: 14, color: msg.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{msg}</p>}
    </div>
  );
}
