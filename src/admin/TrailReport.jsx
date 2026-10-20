import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { toPng } from 'html-to-image';
import { getTrailReport, TRAIL_ID } from './adminApi';
import { printFontCss } from './printFonts';
import './trail-report.css';

// HQ's one-page trail report: pick a period, download an A4 PDF infographic to share with
// the team and the venues. Numbers come from the backend (guests only).

const TZ = 'Asia/Ho_Chi_Minh';
const PERIODS = [{ value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }, { value: 'all', label: 'Since launch' }];
const W = 794; const H = 1123; // A4 at 96 dpi

const dayMonth = (iso, opts = {}) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: TZ, ...opts });
const clock = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
const titleCase = (s) => s.toLowerCase().replace(/(^|[\s(/-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
// "BELGO NGUYEN VAN THU - BELGIAN CRAFT BEER & RESTAURANT" -> "Belgo Nguyen Van Thu"
export function shortVenue(name) {
  let n = String(name || '').split(' - ')[0].trim();
  if (n.length > 3 && n === n.toUpperCase()) n = titleCase(n);
  return n.length > 24 ? `${n.slice(0, 23).trim()}…` : n;
}
const hourLabel = (h) => (h == null ? '—' : h === 0 ? '12 am' : h < 12 ? `${h} am` : h === 12 ? '12 pm' : `${h - 12} pm`);
function rangeLabel(from, to) {
  const sameMonth = dayMonth(from, { month: 'short' }).split(' ')[1] === dayMonth(to, { month: 'short' }).split(' ')[1];
  const year = new Date(to).toLocaleDateString('en-GB', { year: 'numeric', timeZone: TZ });
  return sameMonth ? `${dayMonth(from, { month: undefined })} – ${dayMonth(to)} ${year}` : `${dayMonth(from)} – ${dayMonth(to)} ${year}`;
}
const hours = (h) => (h < 1 ? 'Under 1 hour' : h < 24 ? `About ${Math.round(h)} hour${Math.round(h) === 1 ? '' : 's'}` : `About ${Math.round(h / 24 * 10) / 10} days`);

const Pint = () => (
  <svg className="pint" viewBox="0 0 16 20" aria-hidden="true"><path d="M2 2h12l-1.5 16h-9z" fill="#FFD100" stroke="#111" strokeWidth="1.5" /><path d="M2 2h12v3H2z" fill="#fff" stroke="#111" strokeWidth="1.5" /></svg>
);

export function ReportSheet({ data, theme = 'light' }) {
  const g = data.glance; const j = data.journey;
  const label = PERIODS.find((p) => p.value === data.period)?.label || '';
  const maxStamps = Math.max(1, ...data.venues.map((v) => v.stamps));
  const maxDay = Math.max(1, ...data.days.map((d) => d.stamps));
  const starts = data.starts.slice(0, 5);
  const maxStart = Math.max(1, ...starts.map((s) => s.count));
  const made = `${dayMonth(data.generatedAt)}, ${clock(data.generatedAt)}`;
  const topDays = data.topDays.days.join(' + ');
  const startNote = data.startsAtVenue.total
    ? `${data.startsAtVenue.count} of ${data.startsAtVenue.total} guests signed up at a venue${data.startsAtVenue.avgMinutes != null ? `, about ${data.startsAtVenue.avgMinutes} minutes before their first stamp` : ''}.`
    : 'No first stamps in this period yet.';

  return (
    <div className={`trp${theme === 'dark' ? ' dark' : ''}`} style={{ width: W, height: H }}>
      <div className="trp-band">
        <img src="/brand/logo-white.png" alt="" />
        <div className="t"><div className="eb">TRAIL REPORT</div><h1>How the trail is going</h1></div>
        <div className="per">{label}<b>{rangeLabel(data.from, data.to)}</b>Made {made}</div>
      </div>
      <div className="trp-body">
        <section className="trp-sec">
          <div className="tab"><span className="n y">1</span>At a glance</div>
          <div className="kpis">
            <div className="k"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.2"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg></span><div><div className="v">{g.newGuests}</div><div className="l">new guests<br />signed up</div></div></div>
            <div className="k"><span className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.2"><circle cx="12" cy="12" r="8" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg></span><div><div className="v">{g.stamps}</div><div className="l">stamps collected<br />by {g.stampers} guest{g.stampers === 1 ? '' : 's'}</div></div></div>
            <div className="k"><span className="ic jade"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M4 15c0-5 3.5-8 8-8s8 3 8 8" /><path d="M2 15h20v2H2z" /><path d="M12 7V4" /></svg></span><div><div className="v">{g.finishers}</div><div className="l">finished all {data.venues.length}<br />{g.hats} hat{g.hats === 1 ? '' : 's'} collected</div></div></div>
            <div className="k"><span className="ic red"><svg viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></svg></span><div><div className="v">{g.avgRating ?? '—'}</div><div className="l">average rating<br />from {g.ratings} review{g.ratings === 1 ? '' : 's'}</div></div></div>
          </div>
        </section>

        <section className="trp-sec red">
          <div className="tab"><span className="n r">2</span>The guest journey<small>how far people get</small></div>
          <div className="funnel">
            {[[j.visitors, 'opened the app', 'f1'], [j.signups, 'signed up', 'f2'], [j.stamped, 'got a stamp', 'f3'], [j.threePlus, '3 or more stamps', 'f4'], [j.finished, `finished all ${data.venues.length}`, 'f5'], [j.hats, 'collected a hat', 'f6']].map(([n, l, c]) => (
              <div key={l} className={`step ${c}`}><b>{n}</b><span>{l}</span></div>
            ))}
          </div>
          <div className="fnote">{!data.finishing ? 'Nobody finished the trail in this period yet.'
            : g.finishers === 1 ? `One guest finished the whole trail, in ${hours(data.finishing.fastestHours).toLowerCase()}.`
            : `Fastest full trail: ${hours(data.finishing.fastestHours).toLowerCase()}. Typical finish: ${data.finishing.typicalDays < 1 ? 'the same day' : `about ${data.finishing.typicalDays} day${data.finishing.typicalDays === 1 ? '' : 's'}`}.`}</div>
        </section>

        <div className="row2">
          <section className="trp-sec yel">
            <div className="tab"><span className="n y">3</span>Where guests start<small>first stamp</small></div>
            <div className="bub">
              {starts.length ? starts.map((s) => {
                const size = Math.round(36 + 38 * Math.sqrt(s.count / maxStart));
                return <div key={s.id} className="bb"><i style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}>{s.count}</i>{shortVenue(s.name)}</div>;
              }) : <div className="empty">No first stamps in this period yet.</div>}
            </div>
            <div className="callout">{startNote}</div>
          </section>
          <section className="trp-sec jade">
            <div className="tab"><span className="n g">4</span>When people drink<small>stamps by day</small></div>
            <div className="days">
              {data.days.map((d) => {
                const top = data.topDays.days.includes(d.day) && d.stamps > 0;
                return <div key={d.day} className={`day${top ? ' top' : ''}`}><em>{d.stamps}</em><div style={{ height: Math.max(2, Math.round((d.stamps / maxDay) * 58)) }} />{d.day}</div>;
              })}
            </div>
            <div className="minifacts">
              <div className="mf"><b>{g.stamps ? `${data.topDays.pct}%` : '—'}</b>{topDays ? `on ${topDays}` : 'busiest days'}</div>
              <div className="mf"><b>{hourLabel(data.busiestHour)}</b>busiest hour</div>
              <div className="mf"><b>{data.stampsPerGuest || '—'}</b>stamps per guest</div>
            </div>
          </section>
        </div>

        <section className="trp-sec">
          <div className="tab"><span className="n r">5</span>The venues<small>ranked by stamps</small></div>
          <table>
            <thead><tr><th>Venue</th><th className="n">Started here</th><th>Stamps</th><th className="n">Page views</th><th className="n">Directions</th><th className="n">Rating</th></tr></thead>
            <tbody>
              {data.venues.map((v) => (
                <tr key={v.id}>
                  <td><span className="rank">{v.rank}</span>{shortVenue(v.name)}</td>
                  <td className="n">{v.startedHere ? <span className="start">{v.startedHere}</span> : <span className="zero">0</span>}</td>
                  <td><span className="bar" style={{ width: Math.max(v.stamps ? 6 : 0, Math.round((v.stamps / maxStamps) * 110)) }} />{v.stamps}</td>
                  <td className="n">{v.views}</td>
                  <td className="n">{v.directions}</td>
                  <td className="n">{v.rating != null ? <><span className="stars">★</span> {v.rating.toFixed(1)}</> : <span className="zero">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="row2">
          <section className="trp-sec">
            <div className="tab"><span className="n y">6</span>Guest favourites<small>{data.beers.some((b) => b.count >= 2) ? '2+ ratings' : 'top rated'}</small></div>
            {data.beers.length ? data.beers.map((b) => (
              <div key={`${b.venue}-${b.name}`} className="beer"><Pint /><div><b>{b.name}</b><small>{shortVenue(b.venue)}</small></div><span className="st"><i>★</i> {b.avg.toFixed(1)} · {b.count}</span></div>
            )) : <div className="empty">No beer ratings in this period yet.</div>}
          </section>
          <section className="trp-sec red">
            <div className="tab"><span className="n r">7</span>Coming up<small>tell your guests</small></div>
            {data.comingUp.length ? data.comingUp.map((e) => {
              const multi = e.endsAt && new Date(e.endsAt) - new Date(e.startsAt) > 20 * 3600e3;
              const title = (e.title && (e.title.en || e.title.vn)) || (typeof e.title === 'string' ? e.title : 'Event');
              const when = multi ? `${dayMonth(e.startsAt, { month: undefined })}–${dayMonth(e.endsAt)}` : clock(e.startsAt);
              return (
                <div key={`${e.startsAt}-${title}`} className="ev">
                  <div className="d"><b>{dayMonth(e.startsAt, { month: undefined })}</b><span>{dayMonth(e.startsAt, { day: undefined }).toUpperCase()}</span></div>
                  <div><strong>{title}</strong><small>{shortVenue(e.place)} · {when}</small></div>
                </div>
              );
            }) : <div className="empty">No upcoming events yet. Add them in What's On.</div>}
          </section>
        </div>
      </div>
      <div className="trp-foot"><span>HCM Ale Trail · hcm.thealetrail.app · Guests only: HQ and venue staff are left out.</span><span className="sp" /><span className="smpl">smpl.</span></div>
    </div>
  );
}

// Draws the sheet off screen, turns it into an image and saves a one-page A4 PDF.
export async function downloadTrailReport(data) {
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-${W * 2}px;top:0;width:${W}px;height:${H}px;pointer-events:none;`;
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    root.render(<ReportSheet data={data} theme="dark" />);
    await new Promise((r) => setTimeout(r, 60));
    const node = host.firstElementChild;
    await Promise.all([...node.querySelectorAll('img')].map((im) => (im.complete && im.naturalWidth ? null : im.decode().catch(() => {}))));
    const fontEmbedCSS = await printFontCss();
    const opts = { width: W, height: H, cacheBust: true, fontEmbedCSS };
    // Safari paints the first draw before inner images are ready; warm it up first (see Promote tab).
    const safari = /^((?!chrome|chromium|crios|android|edg|fxios).)*safari/i.test(navigator.userAgent) || /iP(hone|ad|od)/.test(navigator.userAgent);
    for (let i = 0; i < (safari ? 3 : 1); i++) await toPng(node, { ...opts, pixelRatio: 0.25 });
    const png = await toPng(node, { ...opts, pixelRatio: 2.5 });
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    pdf.addImage(png, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
    const day = new Date(data.generatedAt).toLocaleDateString('en-CA', { timeZone: TZ });
    const slug = { '7d': 'last-7-days', '30d': 'last-30-days', all: 'since-launch' }[data.period] || data.period;
    pdf.save(`ale-trail-report-${slug}-${day}.pdf`);
  } finally {
    root.unmount();
    host.remove();
  }
}

// The control on HQ Home: period switch + download button.
export default function TrailReportButton() {
  const [period, setPeriod] = useState('7d');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const run = async () => {
    setBusy(true); setMsg('');
    try {
      const r = await getTrailReport(TRAIL_ID, period);
      if (!r?.ok) throw new Error(/authori[sz]|token|expired|401/i.test(r?.error || '') ? 'Please sign in again, then try once more.' : (r?.error || 'Could not load the numbers'));
      await downloadTrailReport(r);
      setMsg('✓ Downloaded'); setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg(e?.message || 'Could not make the PDF. Please try again.'); }
    setBusy(false);
  };
  return (
    <div className="trp-ctl">
      <div className="trp-seg" role="tablist" aria-label="Report period">
        {PERIODS.map((p) => <button key={p.value} type="button" role="tab" aria-selected={period === p.value} className={period === p.value ? 'on' : ''} onClick={() => setPeriod(p.value)}>{p.label}</button>)}
      </div>
      <button type="button" className="trp-dl" onClick={run} disabled={busy}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 4v11" /><path d="m7 10 5 5 5-5" /><path d="M5 20h14" /></svg>
        {busy ? 'Making the PDF…' : 'Download report (PDF)'}
      </button>
      {msg && <span className={`trp-msg${msg.startsWith('✓') ? ' ok' : ''}`} role="status">{msg}</span>}
    </div>
  );
}
