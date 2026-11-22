import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { toPng } from 'html-to-image';
import { getInstagram, getPostPack, getVenuePostPack, instagramAction, TRAIL_ID } from './adminApi';
import { printFontCss } from './printFonts';
import { trackedLink } from './PromoteTab';
import './post-pack.css';

// Weekly post pack (mockup approved 20 Nov 2026): every Monday, last week's trail post, the event
// of the week story and each venue's own story, ready to download and post with words in English
// and Vietnamese. HQ gets all of them on Home; each venue gets its own story on its Promote tab.

const TZ = 'Asia/Ho_Chi_Minh';
const SITE = 'hcm.thealetrail.app';
// HQ's stories link here (v=hq): the app records each visit, so stories can be counted.
export const STORY_LINK = `https://${SITE}/?v=hq&s=story`;
const POST = { w: 1080, h: 1350 };
const STORY = { w: 1080, h: 1920 };

const titleCase = (s) => s.toLowerCase().replace(/(^|[\s(/-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
// "BELGO TON THAT THIEP - BELGIAN CRAFT BEER & RESTAURANT" -> "Belgo Ton That Thiep"
const short = (name) => { let n = String(name || '').split(' - ')[0].trim(); if (n.length > 3 && n === n.toUpperCase()) n = titleCase(n); return n; };
const beer = (s) => { const n = String(s || '').split(' - ')[0].trim(); return n.length > 3 && n === n.toUpperCase() ? titleCase(n) : n; };
const pick = (v, lang = 'en') => (v && typeof v === 'object' ? (lang === 'vn' ? v.vn || v.en : v.en || v.vn) || '' : String(v || ''));
const firstLine = (s) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); const m = t.match(/^.{20,140}?[.!?](\s|$)/); return (m ? m[0] : t.slice(0, 140)).trim(); };
const dayMonth = (iso, lang = 'en') => new Date(iso).toLocaleDateString(lang === 'vn' ? 'vi-VN' : 'en-GB', { day: 'numeric', month: 'short', timeZone: TZ });
const weekday = (iso, lang = 'en') => new Date(iso).toLocaleDateString(lang === 'vn' ? 'vi-VN' : 'en-GB', { weekday: 'short', timeZone: TZ });
const time12 = (iso) => { const h = Number(new Date(iso).toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: TZ })); const m = new Date(iso).toLocaleString('en-GB', { minute: '2-digit', timeZone: TZ }).padStart(2, '0'); return `${h % 12 || 12}${m === '00' ? '' : `:${m}`} ${h < 12 ? 'am' : 'pm'}`; };
const time24 = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
const eventWhen = (e, lang = 'en') => (lang === 'vn' ? `${time24(e.startsAt)} ${weekday(e.startsAt, 'vn')}, ${dayMonth(e.startsAt, 'vn')}` : `${weekday(e.startsAt)} ${dayMonth(e.startsAt)}, ${time12(e.startsAt)}`);
const SHORT_EN = { GB: 'the UK', US: 'the US', AE: 'the UAE', NL: 'the Netherlands', PH: 'the Philippines', KR: 'South Korea' };
const countryName = (lang) => { let dn = null; try { dn = new Intl.DisplayNames([lang === 'vn' ? 'vi' : 'en'], { type: 'region' }); } catch {} return (c) => (lang !== 'vn' && SHORT_EN[c]) || dn?.of(c) || c; };
const listOf = (items, and = 'and') => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`);
const weekLabel = (wk) => { const a = new Date(wk.from); const b = new Date(wk.to); const f = (d, m) => d.toLocaleDateString('en-GB', { day: 'numeric', ...(m ? { month: 'short' } : {}), timeZone: TZ }); return `${f(a, a.getUTCMonth() !== b.getUTCMonth())} – ${f(b, true)}`.toUpperCase(); };

function headline(t) {
  if (t.finishers > 0 && t.hats > 0) return [`${t.finishers} more finisher${t.finishers === 1 ? '' : 's'}.`, `${t.hats} more hat${t.hats === 1 ? '' : 's'}.`];
  if (t.finishers > 0) return [`${t.finishers} more finisher${t.finishers === 1 ? '' : 's'}.`, 'Who’s next?'];
  if (t.stamps > 0) return [`${t.stamps} stamps`, 'this week.'];
  return ['New week.', '8 stamps to get.'];
}

// ----------------------------------------------------------------- the pictures

export function TrailPost({ pack }) {
  const t = pack.trail; const e = pack.event;
  const [l1, l2] = headline(t);
  const en = countryName('en');
  const lines = [
    t.busiest.length ? ['Busiest', <><b>{short(t.busiest[0].name)}</b>{t.busiest[1] ? <> and <b>{short(t.busiest[1].name)}</b></> : null}</>] : null,
    t.topBeer ? ['Guest fave', <><b>{beer(t.topBeer.name)}</b> at {short(t.topBeer.venue)} · {t.topBeer.avg.toFixed(1)}</>] : null,
    t.countries.length ? ['Trailers from', <b>{listOf(t.countries.map(en))}</b>] : null,
  ].filter(Boolean);
  return (
    <div className="pp pp-post" style={{ width: POST.w, height: POST.h }}>
      <div className="top"><img className="logo" src="/brand/logo-white.png" alt="" /><div className="wk">THIS WEEK ON THE TRAIL<br />{weekLabel(pack.week)}</div></div>
      <h1>{l1}<br />{l2}</h1>
      <div className="stats">
        <div className="st"><b>{t.stamps}</b><span>stamps</span></div>
        <div className="st"><b>{t.newGuests}</b><span>new trailers</span></div>
        <div className="st"><b>{t.finishers}</b><span>finished all 8</span></div>
      </div>
      <div className="lines">{lines.map(([k, v]) => <div key={k} className="ln"><i>{k}</i><span>{v}</span></div>)}</div>
      {e ? (
        <div className="ev"><small>EVENT OF THE WEEK</small><b>{pick(e.title)}</b><span>{short(e.place)} · {eventWhen(e)}</span></div>
      ) : (
        <div className="ev"><small>THE ALE TRAIL</small><b>8 breweries. 8 stamps.</b><span>Collect them all across Saigon and win a free hat.</span></div>
      )}
      <div className="foot"><span>8 breweries. 8 stamps. 1 free hat.</span><b>{SITE}</b></div>
    </div>
  );
}

// Branded stories (mockup approved 20 Nov 2026): Ale Trail red with a dotted texture, the photo in a
// bold tilted frame with a yellow "stamp" badge, the trail slogan, and a yellow button.
const DROP = /\b(brewing|brewery|brewpub|co\.?|company|bar|taproom|craft beer)\b/gi;
// The name on the round stamp: short enough to fit (at most 3 words, else the first word).
export function stampName(name) {
  const words = short(name).replace(DROP, '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const pickW = words.length > 3 ? words.slice(0, 1) : words;
  return pickW.join(' ').toUpperCase() || short(name).toUpperCase();
}
const stampSize = (text) => Math.max(30, Math.min(56, Math.floor(215 / (0.5 * Math.max(...text.split(' ').map((w) => w.length), 1)))));

function Pints({ filled }) {
  return <div className="pints">{Array.from({ length: 8 }, (_, i) => <i key={i} className={`pint${i < filled ? ' on' : ''}`} />)}</div>;
}

function Frame({ photo, top, big, bottom }) {
  return (
    <div className="frame">
      {photo ? <div className="ph" style={{ backgroundImage: `url("${photo}")` }} /> : <div className="ph none" />}
      <div className="stamp"><div><small>{top}</small><b style={{ fontSize: stampSize(big) }}>{big}</b><small>{bottom}</small></div></div>
    </div>
  );
}

// tap: HQ's stories leave clear space at the bottom for Instagram's link sticker, with a label
// pointing at it. Venue stories end with the yellow button instead (venues may not add a sticker).
function Branded({ corner, children, cta, tap }) {
  return (
    <div className="pp pp-bs" style={{ width: STORY.w, height: STORY.h }}>
      <div className="in">
        <div className="hdr"><img src="/brand/logo-white.png" alt="" /><div className="wk">{corner}</div></div>
        {children}
        {tap
          ? <div className="tap"><div className="lbl">Tap the link · start free</div><div className="arrow">↓</div><div className="space" /></div>
          : <div className="cta"><b>{cta}</b><span>{SITE}</span></div>}
      </div>
    </div>
  );
}

const weekShort = (wk) => weekLabel(wk);

export function VenueStory({ venue: v, week }) {
  return (
    <Branded corner={v.quiet || !week ? <>GET YOUR<br />STAMP HERE</> : <>THIS WEEK<br />{weekShort(week)}</>} cta="START THE TRAIL HERE">
      <Frame photo={v.photo} top="STAMP HERE" big={stampName(v.name)} bottom="ALE TRAIL" />
      <div className="slogan">8 breweries.<br />8 stamps.<br />1 free hat.</div>
      {v.quiet
        ? <Pints filled={1} />
        : <div className="stat"><b>{v.stamps}</b><span>trailers got their<br />{short(v.name)} stamp this week</span></div>}
    </Branded>
  );
}

// ----------------------------------------------------------------- the words

export function trailCaption(pack) {
  const st = pack.story || { kind: 'numbers' };
  if (st.kind === 'spotlight') {
    const v = st.venue; const name = short(v.name);
    const fave = v.topBeer ? ` Guest fave here: ${beer(v.topBeer.name)} (${v.topBeer.avg.toFixed(1)}).` : '';
    const faveVn = v.topBeer ? ` Bia được yêu thích ở đây: ${beer(v.topBeer.name)} (${v.topBeer.avg.toFixed(1)}).` : '';
    return `Brewery spotlight: ${name}, stamp ${v.position} of ${v.of} on the Ho Chi Minh Ale Trail.${fave} Collect all ${v.of} stamps across Saigon and win a free hat.\nStart free: ${SITE}\n\n`
      + `Gương mặt tuần này: ${name}, con tem ${v.position}/${v.of} trên Ho Chi Minh Ale Trail.${faveVn} Sưu tập đủ ${v.of} con tem khắp Sài Gòn để nhận mũ miễn phí.\nTham gia miễn phí: ${SITE}`;
  }
  if (st.kind === 'beer') {
    const b = st.beer;
    return `Beer of the week on the Ho Chi Minh Ale Trail: ${beer(b.name)} at ${short(b.venue)}, rated ${b.avg.toFixed(1)} by ${b.count} trailer${b.count === 1 ? '' : 's'}. Get your stamp and try it.\nStart free: ${SITE}\n\n`
      + `Bia của tuần trên Ho Chi Minh Ale Trail: ${beer(b.name)} tại ${short(b.venue)}, được ${b.count} người chấm ${b.avg.toFixed(1)} điểm. Ghé lấy tem và thử ngay.\nTham gia miễn phí: ${SITE}`;
  }
  const t = pack.trail; const e = pack.event;
  const en = countryName('en'); const vi = countryName('vn');
  const [l1, l2] = headline(t);
  const EN = [
    `${l1} ${l2}`.replace('this week.', 'this week!'),
    `This week on the Ho Chi Minh Ale Trail: ${t.stamps} stamps, ${t.newGuests} new trailers and ${t.finishers} finished all 8.`,
    t.busiest.length ? `Busiest: ${listOf(t.busiest.map((b) => short(b.name)))}.` : '',
    t.topBeer ? `Guest fave: ${beer(t.topBeer.name)} at ${short(t.topBeer.venue)} (${t.topBeer.avg.toFixed(1)}).` : '',
    t.countries.length ? `Trailers from ${listOf(t.countries.map(en))}.` : '',
    e ? `Event of the week: ${pick(e.title)} at ${short(e.place)}, ${eventWhen(e)}.` : '',
    `Start free: ${SITE}`,
  ].filter(Boolean).join(' ').replace(` Start free:`, `\nStart free:`);
  const VN = [
    `Tuần qua trên Ho Chi Minh Ale Trail: ${t.stamps} tem, ${t.newGuests} người mới tham gia và ${t.finishers} người hoàn thành cả 8 quán.`,
    t.busiest.length ? `Đông nhất: ${listOf(t.busiest.map((b) => short(b.name)), 'và')}.` : '',
    t.topBeer ? `Bia được yêu thích: ${beer(t.topBeer.name)} tại ${short(t.topBeer.venue)} (${t.topBeer.avg.toFixed(1)}).` : '',
    t.countries.length ? `Người tham gia đến từ ${listOf(t.countries.map(vi), 'và')}.` : '',
    e ? `Sự kiện của tuần: ${pick(e.title, 'vn')} tại ${short(e.place)}, ${eventWhen(e, 'vn')}.` : '',
    `Tham gia miễn phí: ${SITE}`,
  ].filter(Boolean).join(' ').replace(` Tham gia miễn phí:`, `\nTham gia miễn phí:`);
  return `${EN}\n\n${VN}`;
}

export function weekendCaption(pack) {
  const list = pack.weekend || [];
  const en = list.length ? `This weekend on the Ho Chi Minh Ale Trail: ${list.map((e) => `${pick(e.title)} at ${short(e.place)} (${eventWhen(e)})`).join('; ')}.` : 'This weekend on the Ho Chi Minh Ale Trail: 8 breweries, all weekend.';
  const vn = list.length ? `Cuối tuần này trên Ho Chi Minh Ale Trail: ${list.map((e) => `${pick(e.title, 'vn')} tại ${short(e.place)} (${eventWhen(e, 'vn')})`).join('; ')}.` : 'Cuối tuần này trên Ho Chi Minh Ale Trail: 8 nhà máy bia, cả cuối tuần.';
  return `${en} Collect a stamp at each of the 8 breweries and win a free hat.\nStart free: ${SITE}\n\n${vn} Sưu tập đủ 8 con tem để nhận mũ miễn phí.\nTham gia miễn phí: ${SITE}`;
}

export function tonightCaption(pack) {
  const hats = pack.allTime?.hats || 0;
  return `Start the Ho Chi Minh Ale Trail tonight! 8 breweries, 8 stamps, 1 free hat.${hats ? ` ${hats} trailers have their hat already.` : ''}\nStart free: ${SITE}\n\n`
    + `Bắt đầu Ho Chi Minh Ale Trail ngay tối nay! 8 nhà máy bia, 8 con tem, 1 chiếc mũ miễn phí.${hats ? ` Đã có ${hats} người nhận mũ.` : ''}\nTham gia miễn phí: ${SITE}`;
}


export function venueCaption(v) {
  const link = trackedLink(v.id, 'weekly');
  const name = short(v.name);
  const en = v.quiet
    ? `Start the Ho Chi Minh Ale Trail at ${name}! Collect all 8 brewery stamps across Saigon and win a free Ale Trail hat.`
    : `${v.stamps} Ale Trail guests stamped in at ${name} this week!${v.topBeer ? ` Guest fave: ${beer(v.topBeer.name)} (${v.topBeer.avg.toFixed(1)}).` : ''} Collect all 8 brewery stamps across Saigon and win a free hat.`;
  const vn = v.quiet
    ? `Bắt đầu Ho Chi Minh Ale Trail tại ${name}! Sưu tập đủ 8 con tem của các nhà máy bia khắp Sài Gòn để nhận mũ Ale Trail miễn phí.`
    : `Tuần này có ${v.stamps} khách Ale Trail check-in tại ${name}!${v.topBeer ? ` Bia được yêu thích: ${beer(v.topBeer.name)} (${v.topBeer.avg.toFixed(1)}).` : ''} Sưu tập đủ 8 con tem khắp Sài Gòn để nhận mũ miễn phí.`;
  return `${en}\nStart here: ${link}\n\n${vn}\nBắt đầu tại đây: ${link}`;
}

// ----------------------------------------------------------------- making the PNGs

let fontsLinked = false;
function useBrandFonts() {
  useEffect(() => {
    if (fontsLinked) return;
    fontsLinked = true;
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/fonts/print/print-fonts.css'; document.head.appendChild(l);
  }, []);
}

async function renderPng(element, size) {
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-${size.w * 2}px;top:0;width:${size.w}px;height:${size.h}px;pointer-events:none;`;
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    root.render(element);
    await new Promise((r) => setTimeout(r, 80));
    const node = host.firstElementChild;
    await Promise.all([...node.querySelectorAll('img')].map((im) => (im.complete && im.naturalWidth ? null : im.decode().catch(() => {}))));
    const bg = node.querySelector('.ph');
    const url = bg && (bg.style.backgroundImage.match(/url\("?(.*?)"?\)/) || [])[1];
    if (url) await new Promise((r) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = r; im.onerror = r; im.src = url; });
    const fontEmbedCSS = await printFontCss();
    const imagePlaceholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const opts = { width: size.w, height: size.h, cacheBust: true, fontEmbedCSS, imagePlaceholder };
    // Safari paints the first draw before inner images are ready; warm it up first (see Promote tab).
    const safari = /^((?!chrome|chromium|crios|android|edg|fxios).)*safari/i.test(navigator.userAgent) || /iP(hone|ad|od)/.test(navigator.userAgent);
    for (let i = 0; i < (safari ? 3 : 1); i++) await toPng(node, { ...opts, pixelRatio: 0.2 });
    return await toPng(node, { ...opts, pixelRatio: 1 });
  } finally {
    root.unmount();
    host.remove();
  }
}
const save = (url, name) => { const a = document.createElement('a'); a.href = url; a.download = name; a.click(); };
const slug = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// A small live preview of a design (the real thing, scaled down).
function Preview({ size, scale, children }) {
  return (
    <div className="pp-prev" style={{ width: size.w * scale, height: size.h * scale }}>
      <div style={{ width: size.w, height: size.h, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
    </div>
  );
}

function useActions(t) {
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };
  const download = async (key, element, size, name) => {
    setBusy(key);
    try { save(await renderPng(element, size), name); flash(t('Downloaded')); } catch { flash(t('Could not make the picture. Please try again.')); }
    setBusy('');
  };
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); flash(t('Words copied')); } catch { flash(t('Could not copy. Select the text and copy it yourself.')); }
  };
  return { busy, setBusy, msg, flash, download, copy };
}

const signInAgain = (e) => (/authori[sz]|token|expired|401/i.test(e || '') ? 'Please sign in again, then try once more.' : e);

// ----------------------------------------------------------------- HQ Home card

const tagLine = (handles) => handles.filter(Boolean).map((h) => `@${h}`).join(' ');

// HQ's three stories are drawn on the server (18 rotating designs, approved 20 Nov 2026), so the
// preview here is exactly what posts to Instagram. Each preview shows the next one of that day.
const HQ_STORIES = [
  { key: 'mon', dow: 1, day: 'Monday', title: 'Last week on the trail', words: (p) => trailCaption({ ...p, story: { kind: 'numbers' } }) },
  { key: 'thu', dow: 4, day: 'Thursday', title: 'What’s on this weekend', words: weekendCaption },
  { key: 'sat', dow: 6, day: 'Saturday', title: 'Tonight on the trail', words: tonightCaption },
];
const SAIGON = 7 * 3600000;
/** The next posting time (10:00 Saigon) of a weekday; today counts until 10:00. */
export function nextPostAt(dow, now = Date.now()) {
  const sg = new Date(now + SAIGON);
  const midnight = Date.UTC(sg.getUTCFullYear(), sg.getUTCMonth(), sg.getUTCDate()) - SAIGON;
  for (let i = 0; i < 8; i++) {
    const at = midnight + i * 86400000 + 10 * 3600000;
    if (new Date(at + SAIGON).getUTCDay() === dow && at > now) return at;
  }
  return now;
}
export const storyImage = (kind, at) => `/api/trails/${TRAIL_ID}/stories/${kind}.jpg?at=${encodeURIComponent(new Date(at).toISOString())}`;

const DAY_NAME = { mon: 'Monday', thu: 'Thursday', sat: 'Saturday' };
const hourText = (h) => `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}`;
const n = (v) => (typeof v === 'number' ? v : '–');

function LastResult({ r, d }) {
  if (!r) return <div className="ig-last"><div className="k">Results show here after {d}’s first story.</div></div>;
  return (
    <div className="ig-last">
      <div className="k">Last {d}’s story ({whenText(r.postedAt)})</div>
      <div className="ig-nums">
        <div><b>{n(r.seenBy)}</b><span>seen by</span></div>
        <div><b>{n(r.visits)}</b><span>app visits</span></div>
        <div><b>{n(r.signups)}</b><span>sign-ups</span></div>
        <div><b>{n(r.replies)}</b><span>replies</span></div>
      </div>
    </div>
  );
}

// Story results (approved 22 Nov 2026): followers online by Saigon hour, a time suggestion once there are
// enough stories to compare, and the last 8 stories.
function StoryResults({ ins, usual, busy, onUse }) {
  if (!ins) return null;
  const max = ins.online ? Math.max(...ins.online, 1) : 1;
  const top = ins.online ? [...ins.online].sort((x, y) => y - x)[3] ?? 0 : 0;
  const sug = ins.suggestion;
  const already = sug && usual[sug.kind] === `${String(sug.hour).padStart(2, '0')}:00`;
  return (
    <div className="ig-results">
      <h4>When your followers are online</h4>
      {ins.online ? (
        <>
          <p className="hq-note" style={{ margin: '0 0 8px' }}>Average over the last 30 days, Saigon time. Orange = the busiest hours.</p>
          <div className="ig-chart" role="img" aria-label="Followers online by hour">
            {ins.online.map((v, h) => <div key={h} className={`b${v >= top && v > 0 ? ' best' : ''}`} style={{ height: `${(v / max) * 100}%` }} title={`${hourText(h)}: ${v}`}><i>{h % 3 === 0 ? h : ''}</i></div>)}
          </div>
        </>
      ) : <p className="hq-note" style={{ margin: 0 }}>Instagram shares this once the account has 100 followers.</p>}
      {sug && !already && (
        <div className="ig-sugg">
          <span><b>Suggestion:</b> {DAY_NAME[sug.kind]}’s story gets {sug.lift}% more views at {hourText(sug.hour)} ({sug.weeks} stories compared).</span>
          <button type="button" className="trp-dl" disabled={!!busy} onClick={() => onUse(sug.kind, sug.hour)}>Use {hourText(sug.hour)} for {DAY_NAME[sug.kind]}s</button>
        </div>
      )}
      <h4 style={{ marginTop: 16 }}>Recent stories</h4>
      {ins.recent?.length ? (
        <div className="ig-table-wrap"><table className="ig-table">
          <thead><tr><th>Story</th><th>Posted</th><th>Seen by</th><th>Kept watching</th><th>App visits</th><th>Sign-ups</th></tr></thead>
          <tbody>{ins.recent.map((r) => (
            <tr key={r.postedAt}><td>{DAY_NAME[r.kind] || 'Other'}</td><td>{whenText(r.postedAt)}</td><td>{n(r.seenBy)}</td><td>{typeof r.keptWatching === 'number' ? `${r.keptWatching}%` : '–'}</td><td>{n(r.visits)}</td><td>{n(r.signups)}</td></tr>
          ))}</tbody>
        </table></div>
      ) : <p className="hq-note" style={{ margin: 0 }}>Each story’s results are saved here while it’s up (Instagram deletes them after 24 hours).</p>}
    </div>
  );
}

const toSaigonInput = (iso) => new Date(Date.parse(iso) + SAIGON).toISOString().slice(0, 16);
const fromSaigonInput = (v) => new Date(Date.parse(`${v}:00+07:00`)).toISOString();
const whenText = (iso) => new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: TZ }).replace(',', '').replace(/ (\d\d:\d\d)$/, ' · $1');

// HQ Home: "Instagram stories" (mockup approved 22 Nov 2026). One box: each story's real picture with the
// live numbers (tap to enlarge), when it goes out (changeable for that week), Post now (straight to
// Instagram without a link, or to the phone page to post with a link sticker) and Download. Below: one
// switch to send them at their times, and how they go out. Connecting Instagram lives here too.
export function PostPackCard() {
  useBrandFonts();
  const [pack, setPack] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [s, setS] = useState(null);
  const [big, setBig] = useState(null);
  const [edit, setEdit] = useState(null);
  const [ask, setAsk] = useState(null);
  const [token, setToken] = useState('');
  const a = useActions((x) => x);
  const load = () => getInstagram(TRAIL_ID).then((r) => setS(r?.ok || r?.connected !== undefined ? r : { connected: false, error: r?.error }));
  useEffect(() => {
    let live = true;
    getPostPack(TRAIL_ID).then((r) => { if (!live) return; if (r?.ok && r.week && r.trail) setPack(r); else setError(signInAgain(r?.error) || 'Could not load this week’s stories.'); });
    load();
    return () => { live = false; };
  }, []);
  if (error) return <div className="hq-card"><h3 style={{ margin: 0 }}>Instagram stories</h3><p className="hq-note">{error}</p></div>;
  if (!pack || !s) return <div className="hq-card"><h3 style={{ margin: 0 }}>Instagram stories</h3><p className="hq-note">Loading…</p></div>;
  const tags = tagLine(pack.tags || []);
  const act = async (body, done) => {
    setBusy(`${body.action}-${body.kind || ''}`);
    const r = await instagramAction(TRAIL_ID, body);
    setBusy('');
    if (r?.connected !== undefined) setS(r);
    if (r?.ok) { if (done) a.flash(done); if (body.action === 'connect') setToken(''); return r; }
    a.flash(r?.error || 'Something went wrong. Please try again.');
    return null;
  };
  const download = async (key, url, at) => {
    setBusy(`dl-${key}`);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const href = URL.createObjectURL(await res.blob());
      save(href, `ale-trail-${new Date(Date.parse(at) + SAIGON).toISOString().slice(0, 10)}-${key}.jpg`);
      setTimeout(() => URL.revokeObjectURL(href), 5000);
      a.flash('Downloaded');
    } catch { a.flash('Could not get the picture. Please try again.'); }
    setBusy('');
  };
  // Each story's next slot: from the server when connected, else the usual 10:00 on its day.
  const slots = HQ_STORIES.map((h) => {
    const n = s.next?.find((x) => x.kind === h.key);
    const usual = new Date(nextPostAt(h.dow)).toISOString();
    return { ...h, at: n?.at || usual, renderAt: n?.renderAt || usual, custom: !!n?.custom };
  });
  const ready = (s.log || []).filter((r) => r.status === 'ready');
  return (
    <div className="hq-card pp-card" data-tour="post-pack">
      <div className="pp-head">
        <div><h3 style={{ margin: 0 }}>Instagram stories</h3>
          <p className="hq-note" style={{ margin: '2px 0 0' }}>Each picture is exactly what will post, with the live numbers. Tap it to see it full size.</p></div>
        <span className="ig-acct">{s.connected ? `Posting to @${s.username}` : 'Instagram not connected'}</span>
      </div>
      {a.msg && <p className="trp-msg ok" role="status" style={{ margin: '8px 0 0' }}>{a.msg}</p>}

      {ready.map((r) => (
        <div key={r.id} className="ig-ready">
          <span><b>Ready to post:</b> {HQ_STORIES.find((h) => h.key === r.kind)?.day}’s story{r.manual ? ' (sent from Post now)' : ''}. Open it on your phone from Command Centre, or here.</span>
          {r.readyUrl && <a className="trp-dl" href={r.readyUrl} target="_blank" rel="noreferrer">Get the story</a>}
          <button type="button" className="admin-btn" style={{ width: 'auto' }} disabled={!!busy} onClick={() => act({ action: 'posted', id: r.id }, 'Marked as posted with link.')}>Mark as posted</button>
        </div>
      ))}

      <div className="pp-items">
        {slots.map(({ key, day: d, title, at, renderAt, custom }) => {
          // v = the design version, so a new design shows straight away instead of a saved old picture.
          const url = `${storyImage(key, renderAt)}${s.designVersion ? `&v=${s.designVersion}` : ''}`;
          return (
            <div key={key} className="pp-item ig-tile">
              <h4>{d} <small>{title}</small></h4>
              <button type="button" className="ig-shot" onClick={() => setBig({ url, d })} aria-label={`See ${d}’s story full size`}>
                <img className="pp-shot" src={url} alt={`${d} story`} loading="lazy" width={162} height={288} />
                <em>Tap to enlarge</em>
              </button>
              {edit?.key === key ? (
                <div className="ig-when edit">
                  <input type="datetime-local" value={edit.v} onChange={(e) => setEdit({ key, v: e.target.value })} aria-label="Day and time (Saigon)" />
                  <button type="button" className="trp-dl" disabled={!!busy || !edit.v} onClick={async () => { if (await act({ action: 'time', kind: key, at: fromSaigonInput(edit.v) }, 'Time saved.')) setEdit(null); }}>Save time</button>
                  {custom && <button type="button" className="admin-btn" style={{ width: 'auto' }} disabled={!!busy} onClick={async () => { if (await act({ action: 'time', kind: key, at: null }, 'Back to the usual time.')) setEdit(null); }}>Usual time</button>}
                  <button type="button" className="wn-link" onClick={() => setEdit(null)}>Cancel</button>
                  <small>Only this week’s story moves. Saigon time.</small>
                </div>
              ) : (
                <div className="ig-when">
                  <span>Goes out <b>{whenText(at)}</b>{custom ? ' (moved)' : ''}</span>
                  {s.connected && <button type="button" className="wn-link" onClick={() => setEdit({ key, v: toSaigonInput(at) })}>Change</button>}
                </div>
              )}
              {ask === key ? (
                <div className="ig-ask">
                  <span>Post {d}’s story to @{s.username} now?</span>
                  <button type="button" className="trp-dl" disabled={!!busy} onClick={async () => { if (await act({ action: 'post', kind: key, how: 'now' }, 'Posted. Check the story on Instagram.')) setAsk(null); }}>{busy === `post-${key}` ? 'Posting… (up to a minute)' : 'Post it now (no link)'}</button>
                  <button type="button" className="admin-btn" disabled={!!busy} onClick={async () => { await act({ action: 'post', kind: key, how: 'phone' }, 'Sent. It’s in Command Centre on your phone, and under Ready to post at the top of this box.'); setAsk(null); }}>Send to my phone (with link)</button>
                  <button type="button" className="wn-link" onClick={() => setAsk(null)}>Cancel</button>
                </div>
              ) : (
                <div className="pp-btns ig-btns">
                  {s.connected && <button type="button" className="trp-dl" disabled={!!busy} onClick={() => setAsk(key)}>Post now</button>}
                  <button type="button" className="admin-btn" style={{ width: 'auto' }} disabled={!!busy} onClick={() => download(key, url, renderAt)}>{busy === `dl-${key}` ? 'Getting it…' : 'Download'}</button>
                </div>
              )}
              <button type="button" className="wn-link" onClick={() => a.copy(tags)}>Copy brewery tags</button>
              {s.connected && <LastResult r={s.insights?.last?.[key]} d={d} />}
            </div>
          );
        })}
      </div>
      {s.connected && <StoryResults ins={s.insights} usual={s.postTimes || {}} busy={busy} onUse={(kind, hour) => act({ action: 'usual', kind, at: `${String(hour).padStart(2, '0')}:00` }, 'Saved. That story now goes out at the new time each week.')} />}

      {s.connected ? (
        <div className="ig-auto" data-tour="auto-post">
          <label className="ap-switch">
            <input type="checkbox" checked={!!s.enabled} disabled={!!busy} onChange={(e) => act({ action: e.target.checked ? 'enable' : 'disable' }, e.target.checked ? 'Stories will go out at their times.' : 'Stories won’t go out by themselves.')} />
            <span className="ap-track" aria-hidden="true" />
            Send the stories at their times
          </label>
          <div className="ig-how" role="radiogroup" aria-label="How stories go out">
            {[['assist', 'With a clickable link (recommended)', 'At the time, you get a phone task: save the picture and post it with a link sticker. About 30 seconds.'], ['auto', 'Post by itself', 'Goes up on its own at the time. Instagram doesn’t allow a clickable link this way.']].map(([m, t, sub]) => (
              <button key={m} type="button" role="radio" aria-checked={s.mode === m} className={s.mode === m ? 'on' : ''} disabled={!!busy} onClick={() => s.mode !== m && act({ action: 'mode', mode: m }, 'Saved.')}>
                <b>{t}</b><span>{sub}</span>
              </button>
            ))}
          </div>
          <p className="hq-note" style={{ margin: '10px 0 0' }}>
            {(s.log || []).filter((r) => r.status !== 'ready').slice(0, 3).map((r) => `${whenText(r.created_at)}: ${HQ_STORIES.find((h) => h.key === r.kind)?.day} ${r.status === 'posted' ? (r.with_link ? 'posted with link' : 'posted') : r.status === 'failed' ? 'didn’t post' : 'posting'}`).join(' · ') || 'Nothing posted yet.'}
            {' '}<button type="button" className="wn-link" disabled={!!busy} onClick={() => act({ action: 'disconnect' }, 'Disconnected. Nothing will post.')}>Disconnect Instagram</button>
          </p>
        </div>
      ) : (
        <div className="ig-auto" data-tour="auto-post">
          <p className="hq-note" style={{ margin: 0 }}>Connect @hcm.aletrail to post from here. Get a token from Meta for the Facebook Page linked to it, then paste it below.</p>
          <div className="ap-connect" style={{ marginTop: 8 }}>
            <input type="password" autoComplete="off" spellCheck={false} placeholder="Paste the token" value={token} onChange={(e) => setToken(e.target.value)} />
            <button type="button" className="trp-dl" disabled={!token.trim() || !!busy} onClick={() => act({ action: 'connect', token }, 'Connected.')}>{busy === 'connect-' ? 'Checking…' : 'Connect Instagram'}</button>
          </div>
        </div>
      )}

      <p className="hq-note">Want a feed post too? <button type="button" className="wn-link" disabled={!!a.busy} onClick={() => a.download('post', <TrailPost pack={pack} />, POST, `ale-trail-${pack.week.monday}-post.png`)}>Download last week as a feed post</button></p>

      {big && (
        <div className="ig-big" role="dialog" aria-label={`${big.d}’s story`} onClick={() => setBig(null)}>
          <div className="ig-big-card" onClick={(e) => e.stopPropagation()}>
            <img src={big.url} alt={`${big.d} story full size`} />
            <button type="button" className="admin-btn" onClick={() => setBig(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------- the venue's Promote tab

export function VenueStoryCard({ breweryId, t = (s) => s }) {
  useBrandFonts();
  const [data, setData] = useState(null);
  const a = useActions(t);
  useEffect(() => {
    let live = true;
    getVenuePostPack(breweryId).then((r) => { if (live && r?.ok && r.week && r.venue) setData(r); });
    return () => { live = false; };
  }, [breweryId]);
  if (!data) return null;
  const v = data.venue;
  const day = data.week.monday;
  return (
    <div className="admin-card pp-vcard" data-tour="venue-story">
      <Preview size={STORY} scale={0.16}><VenueStory venue={v} week={data.week} /></Preview>
      <div>
        <h3 className="admin-card-title">{t('This week’s story')}</h3>
        <p style={{ color: 'var(--admin-text-muted)', margin: '0 0 12px' }}>{t('Ready every Monday: your venue’s week on the Ale Trail, sized for an Instagram or Facebook story. Post it to bring new guests in. The words come in English and Vietnamese, with your own app link.')}</p>
        <div className="pp-btns">
          <button type="button" className="trp-dl" disabled={!!a.busy} onClick={() => a.download('v', <VenueStory venue={v} week={data.week} />, STORY, `ale-trail-week-${day}-${slug(short(v.name))}.png`)}>{a.busy === 'v' ? t('Making…') : t('Download picture')}</button>
          <button type="button" className="admin-btn" style={{ width: 'auto' }} onClick={() => a.copy(venueCaption(v))}>{t('Copy words')}</button>
          {a.msg && <span className="trp-msg ok" role="status">{a.msg}</span>}
        </div>
      </div>
    </div>
  );
}
