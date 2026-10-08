import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getHqQrStats, TRAIL_ID } from './adminApi';

// HQ: which venues' QR codes and ad links bring new guests in, and which formats work
// best. Scans -> new sign-ups (joined after scanning) -> first stamp.

const LABEL = { tent: 'Table tent', poster: 'Poster', sticker: 'Sticker', story: 'Story', facebook: 'Facebook', instagram: 'Instagram', link: 'Plain link', custom: "Venues' own spots" };
const labelOf = (s) => (s.startsWith('c-') ? s.slice(2).replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()) : LABEL[s] || s);
const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '—');

function Bars({ data, label }) {
  if (!data.length) return <div className="hq-empty">No scans yet.</div>;
  return (
    <div style={{ height: Math.max(180, data.length * 34 + 30) }} aria-label={label}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="var(--admin-border)" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--admin-text-muted)' }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fill: 'var(--admin-text)' }} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: 'rgba(127,127,127,.12)' }}
            formatter={(v, k, item) => [`${v} sign-ups · ${item.payload.scans} scans · ${item.payload.firstStamps} first stamps`, item.payload.name]} labelFormatter={() => ''} />
          <Bar dataKey="signups" fill="var(--hq-accent)" radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function HQOnboarding() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = async () => {
    setError('');
    const r = await getHqQrStats(TRAIL_ID);
    if (r?.ok) setData(r); else setError(r?.error || 'Could not load');
  };
  useEffect(() => { load(); }, []);

  if (error && !data) {
    return (
      <div className="hq-card">
        <h3>Couldn't load onboarding</h3>
        <p className="hq-note">{error}</p>
        <button type="button" className="hq-btn y" style={{ marginTop: 12 }} onClick={load}>Try again</button>
      </div>
    );
  }
  if (!data) return <div className="admin-loading"><div className="admin-spinner" /></div>;

  const totals = data.venues.reduce((t, v) => ({ scans: t.scans + v.total.scans, signups: t.signups + v.total.signups, firstStamps: t.firstStamps + v.total.firstStamps }), { scans: 0, signups: 0, firstStamps: 0 });
  const byVenue = data.venues.filter((v) => v.total.scans > 0).map((v) => ({ name: v.name, ...v.total }));
  const byFormat = data.bySource.filter((s) => s.scans > 0).sort((a, b) => b.signups - a.signups || b.scans - a.scans).map((s) => ({ name: labelOf(s.source), ...s }));
  const rows = data.venues.flatMap((v) => v.sources.filter((s) => s.scans > 0).map((s) => ({ venue: v.name, ...s })))
    .sort((a, b) => b.signups - a.signups || b.scans - a.scans);

  return (
    <>
      <div className="hq-h">
        <h2>QR &amp; onboarding</h2>
        <div className="sp" />
        <button type="button" className="hq-btn" onClick={load}>Refresh</button>
      </div>
      <div className="hq-g hq-g4">
        <div className="hq-card hq-kpi"><div className="l">Scans</div><div className="v">{totals.scans}</div><div className="d">phones that opened a venue code or link</div></div>
        <div className="hq-card hq-kpi"><div className="l">New sign-ups</div><div className="v">{totals.signups}</div><div className="d">joined after scanning</div></div>
        <div className="hq-card hq-kpi"><div className="l">First stamps</div><div className="v">{totals.firstStamps}</div><div className="d">of those sign-ups</div></div>
        <div className="hq-card hq-kpi"><div className="l">Scan to sign-up</div><div className="v">{pct(totals.signups, totals.scans)}</div><div className="d">sign-up to stamp {pct(totals.firstStamps, totals.signups)}</div></div>
      </div>

      <div className="hq-g hq-g2 hq-mt" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <div className="hq-card"><h3>Sign-ups by venue</h3><Bars data={byVenue} label="Sign-ups by venue" /></div>
        <div className="hq-card"><h3>Sign-ups by format</h3><Bars data={byFormat} label="Sign-ups by format" /></div>
      </div>

      <div className="hq-card hq-mt">
        <h3>Every code</h3>
        <p className="hq-note" style={{ marginBottom: 10 }}>Each venue has its own code per format, plus any spots they named themselves. Best performers first.</p>
        {rows.length === 0 ? <div className="hq-empty">No scans yet. Venues can download their codes from their dashboard's Promote tab.</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="hq-table">
              <thead><tr><th>Venue</th><th>Code</th><th className="num">Scans</th><th className="num">Sign-ups</th><th className="num">Scan → sign-up</th><th className="num">First stamps</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.venue}-${r.source}`}>
                    <td><b>{r.venue}</b></td><td>{labelOf(r.source)}</td>
                    <td className="num">{r.scans}</td><td className="num">{r.signups}</td><td className="num">{pct(r.signups, r.scans)}</td><td className="num">{r.firstStamps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
