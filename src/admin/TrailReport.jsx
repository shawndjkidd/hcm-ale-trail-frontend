import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { toPng } from 'html-to-image';
import { getTrailReport, getVenueScorecard, TRAIL_ID } from './adminApi';
import { printFontCss } from './printFonts';
import './trail-report.css';

// One-page A4 PDFs (mockups approved 8 Nov 2026, kept outside this public repo):
// HQ's trail report (to share with the team and the venues) and each venue's private
// scorecard. Numbers come from the backend (guests only).

const TZ = 'Asia/Ho_Chi_Minh';
const W = 794; const H = 1123; // A4 at 96 dpi

const dayMonth = (iso, opts = {}) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: TZ, ...opts });
const clock = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const weekLabel = (ymd) => { const [, m, dd] = String(ymd).split('-').map(Number); return `${dd} ${MONTHS[m - 1]}`; };
const titleCase = (s) => s.toLowerCase().replace(/(^|[\s(/-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
// "BELGO NGUYEN VAN THU - BELGIAN CRAFT BEER & RESTAURANT" -> "Belgo Nguyen Van Thu"
export function shortVenue(name) {
  let n = String(name || '').split(' - ')[0].trim();
  if (n.length > 3 && n === n.toUpperCase()) n = titleCase(n);
  return n.length > 26 ? `${n.slice(0, 25).trim()}…` : n;
}
// Beer names as guests typed them: ALL CAPS becomes Title Case so the list reads evenly.
const beerName = (s) => { const n = String(s || '').trim(); return n.length > 3 && n === n.toUpperCase() ? titleCase(n) : n; };
const hourLabel = (h) => (h == null ? '—' : h === 0 ? '12 am' : h < 12 ? `${h} am` : h === 12 ? '12 pm' : `${h - 12} pm`);
const weekBars = (weeks) => weeks.map((w, i) => ({ label: i === weeks.length - 1 ? 'This week' : weekLabel(w.start), value: w.stamps }));
const bestLabel = (weeks) => { let b = -1; weeks.forEach((w, i) => { if (b < 0 || w.stamps > weeks[b].stamps) b = i; }); return b < 0 ? [] : [weekBars(weeks)[b].label]; };
const rangeLabel = (from, to) => `${dayMonth(from)} – ${dayMonth(to)} ${new Date(to).toLocaleDateString('en-GB', { year: 'numeric', timeZone: TZ })}`;
const hoursText = (h) => (h < 1 ? 'under 1 hour' : h < 24 ? `about ${Math.round(h)} hour${Math.round(h) === 1 ? '' : 's'}` : `about ${Math.round(h / 24 * 10) / 10} days`);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const countryName = (() => { let dn = null; try { dn = new Intl.DisplayNames(['en'], { type: 'region' }); } catch {} return (c) => dn?.of(c) || c; })();
const ordinal = (n) => `${n}${[, 'st', 'nd', 'rd'][(n % 100 >> 3) ^ 1 && n % 10] || 'th'}`;
const rankBar = (placeN, of) => Math.round(((of - placeN + 1) / Math.max(1, of)) * 100);
const place = (r, of) => `${r.joint ? 'joint ' : ''}${ordinal(r.place)} of ${of}`;

// ----------------------------------------------------------------- shared pieces

function Header({ eyebrow, title, from, to, made }) {
  return (
    <header className="trv-head">
      <img src="/brand/logo-white.png" alt="" />
      <div className="ttl"><small>{eyebrow}</small><h1>{title}</h1></div>
      <div className="per"><b>{rangeLabel(from, to)}</b><span>Since launch · made {dayMonth(made)}, {clock(made)}</span></div>
    </header>
  );
}

function Bars({ items, height = 70, hi = [], low = [] }) {
  const max = Math.max(1, ...items.map((x) => x.value));
  return (
    <div className="trv-bars" style={{ height }}>
      {items.map((x) => (
        <div key={x.label} className={`bar${hi.includes(x.label) ? ' hi' : ''}${low.includes(x.label) ? ' lo' : ''}`}>
          <b>{x.value}</b><i style={{ height: `${Math.max(2, Math.round((x.value / max) * 100))}%` }} /><span>{x.label}</span>
        </div>
      ))}
    </div>
  );
}

function Rows({ items, label = 108, color, max: fixedMax }) {
  const max = fixedMax || Math.max(1, ...items.map((x) => x.value));
  return (
    <div className="trv-rows">
      {items.map((x) => (
        <div key={x.label} className="row" style={{ gridTemplateColumns: `${label}px 1fr auto` }}>
          <span className="t">{x.label}</span>
          <span className="b"><i style={{ width: `${Math.round((x.value / max) * 100)}%`, background: x.color || color }} /></span>
          <span className="n">{x.text ?? x.value}</span>
        </div>
      ))}
    </div>
  );
}

const Todo = ({ items, title = 'Worth doing next' }) => (
  <section className="trv-sec todo"><h2>{title}</h2>
    <ol>{items.map((x, i) => <li key={i}><i>{i + 1}</i><span><b>{x.b}</b> {x.t}</span></li>)}</ol>
  </section>
);

// ----------------------------------------------------------------- HQ trail report

const NUMBERS = [
  ['New guests', (r) => r.glance.newGuests, true],
  ['Stamps collected', (r) => r.glance.stamps, true],
  ['Finished all {N}', (r) => r.glance.finishers, true],
  ['Hats collected', (r) => r.glance.hats, true],
  ['Guests with a stamp', (r) => r.glance.stampers],
  ['Beer ratings', (r) => r.glance.ratings],
  ['Opened the app', (r) => r.journey.visitors],
  ['Taps on directions', (r) => r.traffic.directions],
];

function trailTodo(d) {
  const out = [];
  if (d.hatsOwed > 0) out.push({ b: `${d.hatsOwed} finisher${d.hatsOwed === 1 ? " hasn't" : "s haven't"} collected a hat.`, t: `${d.journey.finished} finished all ${d.venues.length}, ${d.journey.hats} hats collected.` });
  if (d.oneStamp > 0) out.push({ b: `${d.oneStamp} guest${d.oneStamp === 1 ? '' : 's'} stopped after 1 stamp.`, t: 'A nudge to a second venue would lift finishers most.' });
  const low = d.venues.filter((v) => v.views >= 50 && v.directions / v.views < 0.08).sort((a, b) => a.directions / a.views - b.directions / b.views)[0];
  if (low) out.push({ b: `${shortVenue(low.name)}: ${low.views} page views, ${low.directions} direction taps.`, t: 'Check its map link works.' });
  if (!d.comingUp.length) out.push({ b: 'No events coming up.', t: "Add the next ones in What's On so guests have a reason to come back." });
  const signup = pct(d.journey.signups, d.journey.visitors);
  if (out.length < 4 && d.journey.visitors && signup < 25) out.push({ b: `Only ${signup}% of people who open the app sign up.`, t: 'Venue staff inviting guests to scan and sign up at the bar helps most.' });
  return out.slice(0, 4);
}

// periods: { '7d', '30d', all } reports. The numbers show all three; the rest is since launch.
export function ReportSheet({ periods }) {
  const d = periods.all; const j = d.journey;
  const n = d.venues.length;
  const weeks = d.weeks || [];
  const best = weeks.reduce((m, w) => (w.stamps > (m?.stamps ?? -1) ? w : m), null);
  const lastWeek = weeks.length > 1 ? weeks[weeks.length - 2] : null;
  const thisWeek = weeks[weeks.length - 1];
  const steps = [
    ['opened the app', j.visitors], ['signed up', j.signups], ['got a stamp', j.stamped],
    ['3 or more stamps', j.threePlus], [`finished all ${n}`, j.finished], ['collected a hat', j.hats],
  ];
  const events = d.comingUp || [];
  const o = d.origin || { countries: [], answered: 0, total: 0, visitors: 0, locals: 0 };
  return (
    <div className="trv" style={{ width: W, height: H }}>
      <Header eyebrow="TRAIL REPORT" title="How the trail is going" from={d.from} to={d.to} made={d.generatedAt} />
      <main className="trv-main">
        <section className="trv-sec c12"><h2>The numbers <em>since launch, with the last 7 and 30 days</em></h2>
          {[NUMBERS.slice(0, 4), NUMBERS.slice(4)].map((row, k) => (
            <div key={k} className={`kpis${k ? ' small' : ''}`}>
              {row.map(([label, get]) => (
                <div key={label} className="kpi">
                  <div className="l">{label.replace('{N}', n)}</div>
                  <div className="v">{get(periods.all)}</div>
                  <div className="s">7 days <b>{get(periods['7d'])}</b> · 30 days <b>{get(periods['30d'])}</b></div>
                </div>
              ))}
            </div>
          ))}
        </section>

        <section className="trv-sec c7"><h2>Stamps each week <em>week starting</em></h2>
          <Bars items={weekBars(weeks)} hi={bestLabel(weeks)} />
          {best && <div className="note">Best week: <b>{weekLabel(best.start)}</b>, with <b>{pct(best.stamps, d.glance.stamps)}%</b> of all stamps.{lastWeek && lastWeek !== best ? <> Last week: <b>{lastWeek.stamps}</b>.</> : null}{thisWeek ? <> This week so far: <b>{thisWeek.stamps}</b>.</> : null}</div>}
        </section>

        <section className="trv-sec c5"><h2>When people drink</h2>
          <Bars items={d.days.map((x) => ({ label: x.day, value: x.stamps }))} hi={d.topDays.days} />
          <div className="note"><b>{d.topDays.pct}%</b> of stamps on {d.topDays.days.join(' + ')} · busiest hour <b>{hourLabel(d.busiestHour)}</b> · <b>{d.stampsPerGuest}</b> stamps per guest</div>
        </section>

        <section className="trv-sec c12"><h2>The guest journey <em>since launch · % kept from the step before</em></h2>
          <div className="trv-fun">
            {steps.map(([label, v], i) => (
              <div key={label} className={`st${i >= 4 ? ' end' : ''}`}>
                <div className="v">{v}</div><div className="l">{label}</div>
                {i > 0 && <span className="p">{pct(v, steps[i - 1][1])}%</span>}
              </div>
            ))}
          </div>
          {d.finishing && <div className="note">Fastest full trail: <b>{hoursText(d.finishing.fastestHours)}</b>. Typical finish: <b>{hoursText(d.finishing.typicalDays * 24)}</b>.</div>}
        </section>

        <section className="trv-sec c4"><h2>Where people stop <em>stamps per guest</em></h2>
          <Rows label={52} items={(d.stops || []).map((s, i, a) => ({ label: s.label, value: s.count, color: i === 0 ? '#E35D6A' : i === a.length - 1 ? '#2E9E5B' : undefined }))} />
          <div className="note">Most people who reach 3 stamps finish.</div>
        </section>

        <section className="trv-sec c4"><h2>Where guests start <em>first stamp</em></h2>
          <Rows items={d.starts.slice(0, 5).map((s) => ({ label: shortVenue(s.name), value: s.count }))} />
          {d.startsAtVenue.total > 0 && <div className="note"><b>{d.startsAtVenue.count} of {d.startsAtVenue.total}</b> signed up at a venue{d.startsAtVenue.avgMinutes != null ? `, about ${d.startsAtVenue.avgMinutes} min before their first stamp` : ''}.</div>}
        </section>

        <section className="trv-sec c4"><h2>Where guests are from</h2>
          {o.countries.length ? <Rows label={74} items={o.countries.map((c) => ({ label: countryName(c.code), value: c.count }))} /> : <div className="note">Not enough answers yet.</div>}
          <div className="note">{o.visitors + o.locals > 0 && <><b>{pct(o.visitors, o.visitors + o.locals)}%</b> are visiting. </>}{o.answered} of {o.total} told us.</div>
        </section>

        <section className="trv-sec c12"><h2>The venues <em>ranked by stamps · since launch</em></h2>
          <table className="trv-table">
            <thead><tr><th className="l" colSpan={2}>Venue</th><th>Started here</th><th>Stamps</th><th>Page views</th><th>Directions</th><th>Rating</th></tr></thead>
            <tbody>
              {d.venues.map((v) => {
                const max = Math.max(1, ...d.venues.map((x) => x.stamps));
                const lowDir = v.views >= 50 && v.directions / v.views < 0.08;
                return (
                  <tr key={v.id}>
                    <td className="rk">{v.rank}</td><td className="l v">{shortVenue(v.name)}</td><td>{v.startedHere}</td>
                    <td><span className="sb"><i style={{ width: Math.round((v.stamps / max) * 70) }} />{v.stamps}</span></td>
                    <td>{v.views}</td><td className={lowDir ? 'flag' : ''}>{v.directions}</td><td>{v.rating ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className={`trv-sec ${events.length ? 'c4' : 'c6'}`}><h2>Guest favourites <em>{d.beers.some((b) => b.count >= 3) ? '3+ ratings' : 'top rated'}</em></h2>
          {d.beers.length ? d.beers.map((b) => (
            <div key={`${b.venue}-${b.name}`} className="fav"><b>{beerName(b.name)}</b><span className="sc">{b.avg.toFixed(1)}<small>{b.count} rating{b.count === 1 ? '' : 's'}</small></span><span>{shortVenue(b.venue)}</span></div>
          )) : <div className="note">No ratings yet.</div>}
        </section>

        {events.length > 0 && (
          <section className="trv-sec c4"><h2>Coming up</h2>
            {events.map((e) => {
              const title = (e.title && (e.title.en || e.title.vn)) || (typeof e.title === 'string' ? e.title : 'Event');
              return <div key={`${e.startsAt}-${title}`} className="fav"><b>{title}</b><span className="sc">{dayMonth(e.startsAt)}<small>{clock(e.startsAt)}</small></span><span>{shortVenue(e.place)}</span></div>;
            })}
          </section>
        )}

        <div className={events.length ? 'c4' : 'c6'} style={{ display: 'grid' }}><Todo items={trailTodo(d)} /></div>
      </main>
      <footer className="trv-foot"><span>HCM Ale Trail · hcm.thealetrail.app · Guests only: HQ and venue staff are left out.</span><b>smpl.</b></footer>
    </div>
  );
}

// ----------------------------------------------------------------- venue scorecard

function venueTodo(c) {
  const out = [];
  if (c.win.notYet > 0) out.push({ b: `${c.win.notYet} trail guest${c.win.notYet === 1 ? " hasn't" : "s haven't"} visited you yet.`, t: 'An offer in the app (a free taster with your stamp, say) gives them a reason to come.' });
  const q = c.quietest[0]; const qd = c.days.find((x) => x.day === q);
  if (q && qd) out.push({ b: `${dayFull(q)} is your quietest day (${qd.stamps} stamp${qd.stamps === 1 ? '' : 's'}).`, t: `Try a ${dayFull(q)} deal or event and add it in What's On.` });
  if (c.compare.events30.mine < c.compare.events30.avg) out.push({ b: 'Add an event.', t: `Venues ran about ${c.compare.events30.avg} events each in the last 30 days; you ran ${c.compare.events30.mine}. Events give trail guests a reason to come back.` });
  const miss = c.checklist.find((x) => !x.ok);
  if (miss) out.push({ b: `Add your ${miss.label.charAt(0).toLowerCase()}${miss.label.slice(1)}.`, t: "It's missing from your guest page. A complete page gets more visits." });
  if (c.numbers.startedHere > 0) out.push({ b: 'Keep your QR code out.', t: `${c.numbers.startedHere} guest${c.numbers.startedHere === 1 ? '' : 's'} started the trail with you; new starters come back for their hat.` });
  else out.push({ b: 'Put your QR code where guests can see it.', t: 'Guests who sign up at your bar start the trail with you.' });
  return out.slice(0, 4);
}
const DAY_FULL = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };
const dayFull = (d) => DAY_FULL[d] || d;

export function ScorecardSheet({ card: c }) {
  const nm = c.numbers; const cmp = c.compare;
  const diff = nm.last7 - nm.prev7;
  const best = c.weeks.reduce((m, w) => (w.stamps > (m?.stamps ?? -1) ? w : m), null);
  const ready = c.checklist.filter((x) => x.ok).length;
  const avgBar = (mine, avg) => Math.min(100, Math.round((mine / Math.max(mine, avg * 2, 1)) * 100));
  return (
    <div className="trv" style={{ width: W, height: H }}>
      <Header eyebrow="VENUE SCORECARD" title={shortVenue(c.venue.name)} from={c.from} to={c.to} made={c.generatedAt} />
      <main className="trv-main roomy">
        <section className="trv-sec c12"><h2>Your numbers <em>since launch, with the last 7 days compared with the 7 before</em></h2>
          <div className="kpis">
            <div className="kpi"><div className="l">Stamps</div><div className="v">{nm.stamps}</div><div className="s">7 days <b>{nm.last7}</b> · week before <b>{nm.prev7}</b>{diff !== 0 && <span className={diff > 0 ? 'up' : 'dn'}> {diff > 0 ? '+' : '−'}{Math.abs(diff)}</span>}</div></div>
            <div className="kpi"><div className="l">Guests you brought in</div><div className="v">{nm.startedHere}</div><div className="s">started the trail with you</div></div>
            <div className="kpi"><div className="l">Page views</div><div className="v">{nm.views}</div><div className="s">directions tapped <b>{nm.directions}</b></div></div>
            <div className="kpi"><div className="l">Guest rating</div><div className="v">{nm.rating ?? '—'}</div><div className="s">from <b>{nm.ratings}</b> rating{nm.ratings === 1 ? '' : 's'}</div></div>
          </div>
        </section>

        <section className="trv-sec c6"><h2>How you compare <em>other venues are never named</em></h2>
          <Rows label={118} items={[
            { label: 'Stamps', value: rankBar(cmp.stamps.place, cmp.venues), text: place(cmp.stamps, cmp.venues) },
            { label: 'Guests brought in', value: rankBar(cmp.startedHere.place, cmp.venues), text: place(cmp.startedHere, cmp.venues) },
            { label: 'Views into visits', value: avgBar(cmp.conversion.mine, cmp.conversion.avg), text: `${cmp.conversion.mine}% · avg ${cmp.conversion.avg}%` },
            { label: 'Rating', value: avgBar(cmp.rating.mine || 0, cmp.rating.avg || 0), text: `${cmp.rating.mine ?? '—'} · avg ${cmp.rating.avg ?? '—'}` },
            { label: 'Events, last 30 days', value: avgBar(cmp.events30.mine, cmp.events30.avg), text: `${cmp.events30.mine} · avg ${cmp.events30.avg}` },
          ]} max={100} />
        </section>

        <section className="trv-sec c6"><h2>Your week <em>stamps by day, since launch</em></h2>
          <Bars height={96} items={c.days.map((x) => ({ label: x.day, value: x.stamps }))} hi={c.busiest ? [c.busiest] : []} low={c.quietest.slice(0, 1)} />
          {c.busiest && <div className="note">Busiest: <b>{dayFull(c.busiest)}</b>. Quietest: {c.quietest.map((q, i) => <span key={q}>{i ? ' and ' : ''}<b>{dayFull(q)}</b></span>)}.</div>}
        </section>

        <section className="trv-sec c6"><h2>Your guest page <em>{ready} of {c.checklist.length} ready</em></h2>
          <div className="trv-ck">{c.checklist.map((x) => <span key={x.key} className={x.ok ? 'y' : 'n'}><i>{x.ok ? '✓' : '–'}</i>{x.label}</span>)}</div>
          <div className="note">{ready === c.checklist.length ? 'Everything guests look for is there. Keep the beer list up to date as taps change.' : 'A complete page gets more views and more direction taps.'}</div>
        </section>

        <section className="trv-sec c6"><h2>Guests you can still win</h2>
          <div className="kpis two">
            <div className="kpi"><div className="l">On the trail, not here yet</div><div className="v">{c.win.notYet}</div><div className="s">have stamps at other venues</div></div>
            <div className="kpi"><div className="l">Open to offers</div><div className="v">{c.win.offers}</div><div className="s">guests said yes to trail bar offers</div></div>
          </div>
        </section>

        <section className="trv-sec c12"><h2>Your stamps each week <em>week starting</em></h2>
          <Bars height={80} items={weekBars(c.weeks)} hi={bestLabel(c.weeks)} />
          {best && best.stamps > 0 && <div className="note">Your best week: <b>{weekLabel(best.start)}</b>, with <b>{best.stamps}</b> stamps.</div>}
        </section>

        <section className="trv-sec c12"><h2>Your top beers <em>{c.topBeers.some((b) => b.count >= 3) ? 'guest ratings, 3+ ratings' : 'guest ratings'}</em></h2>
          {c.topBeers.length ? c.topBeers.map((b, i) => (
            <div key={b.name} className="fav"><b>{beerName(b.name)}</b><span className="sc">{b.avg.toFixed(1)}<small>{b.count} rating{b.count === 1 ? '' : 's'}</small></span><span>{i === 0 ? 'Your most rated beer' : ' '}</span></div>
          )) : <div className="note">No ratings yet. Ask guests to rate what they drink when they check in.</div>}
        </section>

        <div className="c12" style={{ display: 'grid' }}><Todo title="Worth trying next" items={venueTodo(c)} /></div>
      </main>
      <footer className="trv-foot"><span>Private to {shortVenue(c.venue.name)} · HCM Ale Trail · Guests only: staff are left out.</span><b>smpl.</b></footer>
    </div>
  );
}

// ----------------------------------------------------------------- PDF

// Draws a sheet off screen, turns it into an image and saves a one-page A4 PDF.
async function savePdf(element, filename) {
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-${W * 2}px;top:0;width:${W}px;height:${H}px;pointer-events:none;`;
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    root.render(element);
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
    pdf.save(filename);
  } finally {
    root.unmount();
    host.remove();
  }
}
const fileDay = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ });
const slug = (s) => String(s || 'venue').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const downloadTrailReport = (periods) => savePdf(<ReportSheet periods={periods} />, `ale-trail-report-${fileDay(periods.all.generatedAt)}.pdf`);
export const downloadScorecard = (card) => savePdf(<ScorecardSheet card={card} />, `${slug(shortVenue(card.venue.name))}-scorecard-${fileDay(card.generatedAt)}.pdf`);

const signInAgain = (e) => (/authori[sz]|token|expired|401/i.test(e || '') ? 'Please sign in again, then try once more.' : e);
const DownloadIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 4v11" /><path d="m7 10 5 5 5-5" /><path d="M5 20h14" /></svg>;

// The control on HQ Home.
export default function TrailReportButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const run = async () => {
    setBusy(true); setMsg('');
    try {
      const rs = await Promise.all(['7d', '30d', 'all'].map((p) => getTrailReport(TRAIL_ID, p)));
      const bad = rs.find((r) => !r?.ok);
      if (bad) throw new Error(signInAgain(bad?.error) || 'Could not load the numbers');
      await downloadTrailReport({ '7d': rs[0], '30d': rs[1], all: rs[2] });
      setMsg('Downloaded'); setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg(e?.message || 'Could not make the PDF. Please try again.'); }
    setBusy(false);
  };
  return (
    <div className="trp-ctl">
      <button type="button" className="trp-dl" data-tour="trail-report" onClick={run} disabled={busy}><DownloadIcon />{busy ? 'Making the PDF…' : 'Download report (PDF)'}</button>
      {msg && <span className={`trp-msg${msg === 'Downloaded' ? ' ok' : ''}`} role="status">{msg}</span>}
    </div>
  );
}

// The card on a venue's Overview tab: their private scorecard.
export function ScorecardCard({ breweryId, t = (s) => s }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const run = async () => {
    setBusy(true); setMsg('');
    try {
      const r = await getVenueScorecard(breweryId);
      if (!r?.ok) throw new Error(signInAgain(r?.error) || t('Could not load your numbers'));
      await downloadScorecard(r);
      setMsg(t('Downloaded')); setTimeout(() => setMsg(''), 3000);
    } catch (e) { setMsg(e?.message || t('Could not make the PDF. Please try again.')); }
    setBusy(false);
  };
  return (
    <div className="admin-card trv-card">
      <div>
        <h3>{t('Your scorecard')}</h3>
        <p>{t('A one-page PDF of how your venue is doing on the trail, and what to try next. Only your team can see it.')}</p>
        {msg && <span className="trp-msg" role="status">{msg}</span>}
      </div>
      <button type="button" className="trp-dl" data-tour="scorecard" onClick={run} disabled={busy}><DownloadIcon />{busy ? t('Making the PDF…') : t('Download scorecard')}</button>
    </div>
  );
}
