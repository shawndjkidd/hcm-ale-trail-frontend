import { useEffect, useState } from 'react';
import { getHqSummary, TRAIL_ID } from './adminApi';

// HQ Home: how the trail is doing this week, what needs attention (each with a
// button to the page that fixes it), every venue's readiness, and app traffic.

const pct = (now, prev) => {
  if (!prev) return now ? 'New this week' : 'No change';
  const d = Math.round(((now - prev) / prev) * 100);
  return `${d > 0 ? '+' : ''}${d}% vs last week`;
};
const trendClass = (now, prev) => (now > prev ? 'hq-up' : now < prev ? 'hq-down' : '');
const timeOf = (iso) => { try { return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }); } catch { return ''; } };
const names = (list) => (list.length <= 3 ? list.map((v) => v.name).join(', ') : `${list.slice(0, 2).map((v) => v.name).join(', ')} and ${list.length - 2} more`);

function Yes({ ok }) {
  return <span className={`hq-st ${ok ? 'ok' : 'bad'}`}>{ok ? 'Yes' : 'Missing'}</span>;
}

export default function HQHome({ onGo }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true); setError('');
    const res = await getHqSummary(TRAIL_ID);
    if (res?.ok) setData(res); else setError(res?.error || 'Could not load');
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (loading && !data) return <div className="admin-loading"><div className="admin-spinner" /></div>;
  if (error && !data) {
    return (
      <div className="hq-card">
        <h3>Couldn't load the overview</h3>
        <p className="hq-note">Check your internet connection, then try again.</p>
        <button type="button" className="hq-btn y" style={{ marginTop: 12 }} onClick={load}>Try again</button>
      </div>
    );
  }

  const { totals, venues, tonight, demo, app } = data;
  const bars = venues.filter((v) => v.kind === 'brewery' && v.status !== 'inactive');
  const quests = venues.filter((v) => v.kind === 'side_quest' && v.status !== 'inactive');
  const noHats = bars.filter((v) => v.hats <= 0);
  const onDefault = [...bars, ...quests].filter((v) => v.codeIsDefault);
  const noBeers = bars.filter((v) => v.beers === 0);
  const incomplete = [...bars, ...quests].filter((v) => !v.hasPhoto || !v.hasHours || !v.hasPin);
  const demoTotal = Object.values(demo).reduce((a, b) => a + b, 0);

  const attention = [
    noHats.length && { level: 'bad', title: `${noHats.length} ${noHats.length === 1 ? 'venue has' : 'venues have'} 0 hats`, sub: `Guests can't claim there · ${names(noHats)}`, go: 'stock', cta: 'Restock' },
    onDefault.length && { level: 'bad', title: `${onDefault.length} still on code 1234`, sub: 'Anyone who guesses it can stamp', go: 'launch', cta: 'Set codes' },
    noBeers.length && { level: 'warn', title: `${noBeers.length} ${noBeers.length === 1 ? 'venue has' : 'venues have'} no beers listed`, sub: names(noBeers), go: 'breweries', cta: 'Open venues' },
    incomplete.length && { level: 'warn', title: `${incomplete.length} missing a photo, hours or map pin`, sub: names(incomplete), go: 'breweries', cta: 'Open venues' },
    demoTotal && { level: 'warn', title: 'Demo content is live', sub: `${demo.participants} people · ${demo.checkins} stamps · ${demo.beers} beers · ${demo.events} events · ${demo.sideQuests} side quests`, go: 'launch', cta: 'Review' },
  ].filter(Boolean);

  const funnelMax = Math.max(app.funnel.seen, 1);

  return (
    <>
      <div className="hq-h">
        <div><h2>Trail overview</h2><p>Last 7 days compared with the 7 days before · demo data left out</p></div>
        <div className="sp" />
        <button type="button" className="hq-btn" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
      </div>

      <div className="hq-g hq-g4">
        <div className="hq-card hq-kpi"><div className="l">Stamps</div><div className="v">{totals.stamps7d}</div><div className={`d ${trendClass(totals.stamps7d, totals.stampsPrev7d)}`}>{pct(totals.stamps7d, totals.stampsPrev7d)}</div></div>
        <div className="hq-card hq-kpi"><div className="l">New guests</div><div className="v">{totals.newGuests7d}</div><div className={`d ${trendClass(totals.newGuests7d, totals.newGuestsPrev7d)}`}>{pct(totals.newGuests7d, totals.newGuestsPrev7d)}</div></div>
        <div className="hq-card hq-kpi"><div className="l">Finished the trail</div><div className="v">{totals.finished}</div><div className="d">of {totals.guests} guests</div></div>
        <div className="hq-card hq-kpi"><div className="l">Hats claimed</div><div className="v">{totals.hats}</div><div className={`d ${noHats.length ? 'hq-down' : ''}`}>{noHats.length ? `${noHats.length} venues at 0` : 'All venues stocked'}</div></div>
      </div>

      <div className="hq-g hq-g21 hq-mt">
        <div className="hq-card">
          <h3>Needs attention</h3>
          {attention.length === 0 && <div className="hq-li"><span className="hq-st ok" /><div className="t"><b>All clear</b><small>Nothing needs you right now</small></div></div>}
          {attention.map((a) => (
            <div className="hq-li" key={a.title}>
              <span className={`hq-st ${a.level}`} />
              <div className="t"><b>{a.title}</b><small>{a.sub}</small></div>
              <button type="button" className={`hq-btn ${a.level === 'bad' ? 'y' : ''}`} onClick={() => onGo(a.go)}>{a.cta}</button>
            </div>
          ))}
        </div>
        <div className="hq-card">
          <h3>Tonight</h3>
          {tonight.length === 0 && <div className="hq-empty">No events today.</div>}
          {tonight.map((e) => {
            const at = venues.find((v) => v.id === e.breweryId);
            return (
              <div className="hq-li" key={e.id}>
                <div className="t"><b>{e.title}</b><small>{[at?.name, timeOf(e.startsAt), e.demo ? 'demo' : null].filter(Boolean).join(' · ')}</small></div>
              </div>
            );
          })}
          <button type="button" className="hq-btn" style={{ marginTop: 10 }} onClick={() => onGo('events')}>Open What's On</button>
        </div>
      </div>

      <div className="hq-g hq-g21 hq-mt">
        <div className="hq-card hq-tscroll">
          <h3>Venue readiness <span className="more">Tap a venue name to open it</span></h3>
          <table className="hq-table">
            <thead><tr><th>Venue</th><th>Code</th><th className="num">Hats</th><th className="num">Beers</th><th>Photo</th><th>Hours</th><th>Map pin</th><th className="num">Stamps 7d</th><th className="num">Rating</th></tr></thead>
            <tbody>
              {bars.map((v) => (
                <tr key={v.id}>
                  <td><button type="button" className="link-like" style={{ background: 'none', border: 0, padding: 0, color: 'inherit', font: 'inherit', fontWeight: 600, cursor: 'pointer' }} onClick={() => onGo('breweries')}>{v.name}</button>{v.locations > 1 && <small style={{ color: 'var(--admin-text-muted)' }}> · {v.locations} locations</small>}</td>
                  <td><span className={`hq-st ${v.codeIsDefault ? 'warn' : 'ok'}`}>{v.codeIsDefault ? '1234' : 'Own code'}</span></td>
                  <td className={`num ${v.hats <= 0 ? 'hq-down' : ''}`}>{v.hats}</td>
                  <td className={`num ${v.beers === 0 ? 'hq-down' : ''}`}>{v.beers}</td>
                  <td><Yes ok={v.hasPhoto} /></td>
                  <td><Yes ok={v.hasHours} /></td>
                  <td><Yes ok={v.hasPin} /></td>
                  <td className="num">{v.stamps7d}</td>
                  <td className="num">{v.rating ?? '–'}</td>
                </tr>
              ))}
              {quests.map((v) => (
                <tr key={v.id}>
                  <td><b>{v.name}</b> <small style={{ color: 'var(--admin-text-muted)' }}>· side quest</small></td>
                  <td><span className={`hq-st ${v.codeIsDefault ? 'warn' : 'ok'}`}>{v.codeIsDefault ? '1234' : 'Own code'}</span></td>
                  <td className="num">–</td><td className="num">–</td>
                  <td><Yes ok={v.hasPhoto} /></td><td><Yes ok={v.hasHours} /></td><td><Yes ok={v.hasPin} /></td>
                  <td className="num">–</td><td className="num">–</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="hq-card">
          <h3>App traffic <span className="more">Last 7 days · people</span></h3>
          <div className="hq-hb"><span className="lab">Opened app</span><span className="bar"><i style={{ width: '100%' }} /></span><span className="val">{app.sessions}</span></div>
          <div className="hq-hb"><span className="lab">Saw a venue</span><span className="bar"><i style={{ width: `${(app.funnel.seen / Math.max(app.sessions, funnelMax)) * 100}%` }} /></span><span className="val">{app.funnel.seen}</span></div>
          <div className="hq-hb"><span className="lab">Opened a venue</span><span className="bar"><i style={{ width: `${(app.funnel.opened / Math.max(app.sessions, funnelMax)) * 100}%` }} /></span><span className="val">{app.funnel.opened}</span></div>
          <div className="hq-hb"><span className="lab">Directions</span><span className="bar"><i style={{ width: `${(app.funnel.directions / Math.max(app.sessions, funnelMax)) * 100}%` }} /></span><span className="val">{app.funnel.directions}</span></div>
          <p className="hq-note">Counting started 28 Sept. Only HQ sees this for now.</p>
          <h3 style={{ marginTop: 16 }}>By venue</h3>
          {bars.map((v) => (
            <div className="hq-li" key={v.id}>
              <div className="t"><b>{v.name}</b><small>{v.app.seen} saw · {v.app.opened} opened · {v.app.directions} directions</small></div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
