import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { toPng } from 'html-to-image';
import { getTrailReport, TRAIL_ID } from './adminApi';
import { printFontCss } from './printFonts';
import './trail-report.css';

// HQ's one-page trail report: pick a period, download an A4 PDF infographic to share with
// the team and the venues. Numbers come from the backend (guests only).

const TZ = 'Asia/Ho_Chi_Minh';
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

const NUMBERS = [
  ['New guests', (r) => r.glance.newGuests],
  ['Stamps collected', (r) => r.glance.stamps],
  ['Guests with a stamp', (r) => r.glance.stampers],
  ['Finished all {N}', (r) => r.glance.finishers],
  ['Hats collected', (r) => r.glance.hats],
  ['Beer ratings', (r) => r.glance.ratings],
  ['Opened the app', (r) => r.journey.visitors],
  ['Taps on Directions', (r) => r.traffic.directions],
];

const Pint = () => (
  <svg className="pint" viewBox="0 0 16 20" aria-hidden="true"><path d="M2 2h12l-1.5 16h-9z" fill="#FFD100" stroke="#111" strokeWidth="1.5" /><path d="M2 2h12v3H2z" fill="#fff" stroke="#111" strokeWidth="1.5" /></svg>
);

// periods: { '7d', '30d', all } reports. The numbers section shows all three side by side;
// everything below it is since launch.
export function ReportSheet({ periods, theme = 'light' }) {
  const data = periods.all;
  const g = data.glance; const j = data.journey;
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
        <div className="per">Since launch<b>{rangeLabel(data.from, data.to)}</b>Made {made}</div>
      </div>
      <div className="trp-body">
        <section className="trp-sec">
          <div className="tab"><span className="n y">1</span>The numbers<small>last 7 days · last 30 days · since launch</small></div>
          <div className="nums">
            {NUMBERS.map(([label, get]) => (
              <div key={label} className="nc">
                <div className="nl">{label.replace('{N}', data.venues.length)}</div>
                <div className="nv">
                  {[['7d', '7 days'], ['30d', '30 days'], ['all', 'Since launch']].map(([k, l]) => (
                    <div key={k} className={k === 'all' ? 'all' : ''}><b>{get(periods[k])}</b><span>{l}</span></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="trp-sec red">
          <div className="tab"><span className="n r">2</span>The guest journey<small>since launch</small></div>
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
            <div className="tab"><span className="n y">3</span>Where guests start<small>first stamp · since launch</small></div>
            <div className="bub">
              {starts.length ? starts.map((s) => {
                const size = Math.round(32 + 32 * Math.sqrt(s.count / maxStart));
                return <div key={s.id} className="bb"><i style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}>{s.count}</i>{shortVenue(s.name)}</div>;
              }) : <div className="empty">No first stamps in this period yet.</div>}
            </div>
            <div className="callout">{startNote}</div>
          </section>
          <section className="trp-sec jade">
            <div className="tab"><span className="n g">4</span>When people drink<small>since launch</small></div>
            <div className="days">
              {data.days.map((d) => {
                const top = data.topDays.days.includes(d.day) && d.stamps > 0;
                return <div key={d.day} className={`day${top ? ' top' : ''}`}><em>{d.stamps}</em><div style={{ height: Math.max(2, Math.round((d.stamps / maxDay) * 46)) }} />{d.day}</div>;
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
          <div className="tab"><span className="n r">5</span>The venues<small>ranked by stamps · since launch</small></div>
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
export async function downloadTrailReport(periods) {
  const data = periods.all;
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-${W * 2}px;top:0;width:${W}px;height:${H}px;pointer-events:none;`;
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    root.render(<ReportSheet periods={periods} theme="dark" />);
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
    pdf.save(`ale-trail-report-${day}.pdf`);
  } finally {
    root.unmount();
    host.remove();
  }
}

// The control on HQ Home: period switch + download button.
export default function TrailReportButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const run = async () => {
    setBusy(true); setMsg('');
    try {
      const rs = await Promise.all(['7d', '30d', 'all'].map((p) => getTrailReport(TRAIL_ID, p)));
      const bad = rs.find((r) => !r?.ok);
      if (bad) throw new Error(/authori[sz]|token|expired|401/i.test(bad?.error || '') ? 'Please sign in again, then try once more.' : (bad?.error || 'Could not load the numbers'));
      await downloadTrailReport({ '7d': rs[0], '30d': rs[1], all: rs[2] });
      setMsg('✓ Downloaded'); setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg(e?.message || 'Could not make the PDF. Please try again.'); }
    setBusy(false);
  };
  return (
    <div className="trp-ctl">
      <button type="button" className="trp-dl" onClick={run} disabled={busy}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 4v11" /><path d="m7 10 5 5 5-5" /><path d="M5 20h14" /></svg>
        {busy ? 'Making the PDF…' : 'Download report (PDF)'}
      </button>
      {msg && <span className={`trp-msg${msg.startsWith('✓') ? ' ok' : ''}`} role="status">{msg}</span>}
    </div>
  );
}
