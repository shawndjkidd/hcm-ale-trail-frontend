import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { toPng } from 'html-to-image';
import { getPostPack, getVenuePostPack, TRAIL_ID } from './adminApi';
import { printFontCss } from './printFonts';
import { trackedLink } from './PromoteTab';
import { logoFor } from '../v2/util';
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

// HQ's three stories a week (mockup approved 20 Nov 2026), all about the whole trail so every
// brewery can be tagged: the big Ale Trail logo and slogan on top, all 8 brewery logos below.
function TrailFrame({ kick, children, venues }) {
  return (
    <div className="pp pp-bs pp-tf" style={{ width: STORY.w, height: STORY.h }}>
      <div className="in">
        <img className="biglogo" src="/brand/logo-white-900.png" alt="" />
        <div className="tagline">8 breweries. 8 stamps. 1 free hat.</div>
        <div className="kick2">{kick}</div>
        {children}
        <div className="logos">
          <small>{venues.length} BREWERIES · 1 STAMP AT EACH</small>
          {venues.slice(0, 8).map((v) => {
            // The app's own copy of the logo first (same website, so it always draws in the picture).
            const src = logoFor({ id: v.id, name: v.name }) || logoFor({ logo_url: v.logo });
            return <span key={v.id}>{src ? <img src={src} alt="" /> : <b>{stampName(v.name)}</b>}</span>;
          })}
        </div>
        <div className="tap"><div className="lbl">Tap the link · start free</div><div className="arrow">↓</div><div className="space" /></div>
      </div>
    </div>
  );
}

// Monday: last week on the trail.
export function MondayStory({ pack }) {
  const t = pack.trail;
  const head = t.hats > 0 ? [`${t.hats} more hat${t.hats === 1 ? '' : 's'}`, 'handed out.'] : headline(t);
  const lines = [
    t.busiest.length ? ['Busiest', t.busiest.map((b) => short(b.name)).join(' · ')] : null,
    t.topBeer ? ['Guest fave', `${beer(t.topBeer.name)} · ${t.topBeer.avg.toFixed(1)}`] : null,
  ].filter(Boolean);
  return (
    <TrailFrame kick={`LAST WEEK ON THE TRAIL · ${weekLabel(pack.week)}`} venues={pack.venues}>
      <div className="h1c">{head[0]}<br />{head[1]}</div>
      <div className="boxes2">
        <div><b>{t.stamps}</b><span>stamps</span></div>
        <div><b>{t.newGuests}</b><span>new trailers</span></div>
        <div><b>{t.finishers}</b><span>finished all 8</span></div>
      </div>
      {lines.length > 0 && <div className="hl2">{lines.map(([k, v]) => <div key={k}><i>{k}:</i> {v}</div>)}</div>}
    </TrailFrame>
  );
}

// Thursday: every event on the trail this weekend.
export function ThursdayStory({ pack }) {
  const list = (pack.weekend || []).slice(0, 3);
  return (
    <TrailFrame kick="WHAT'S ON THIS WEEKEND" venues={pack.venues}>
      {list.length ? list.map((e) => (
        <div key={e.id} className="evr">
          <div className="d"><small>{weekday(e.startsAt).toUpperCase()}</small><b>{new Date(e.startsAt).toLocaleDateString('en-GB', { day: 'numeric', timeZone: TZ })}</b><small>{new Date(e.startsAt).toLocaleDateString('en-GB', { month: 'short', timeZone: TZ }).toUpperCase()}</small></div>
          <div className="t"><b>{pick(e.title)}</b><span>{short(e.place)} · {time12(e.startsAt)}</span></div>
        </div>
      )) : (
        <><div className="h1c">8 breweries.<br />All weekend.</div><div className="hl2"><div>Start at any of them and collect a stamp at each.</div></div></>
      )}
    </TrailFrame>
  );
}

// Saturday: start tonight, win the hat.
export function SaturdayStory({ pack }) {
  const hats = pack.allTime?.hats || 0;
  return (
    <TrailFrame kick="TONIGHT ON THE TRAIL" venues={pack.venues}>
      <div className="h1c">Start tonight.<br />Win the hat.</div>
      <svg className="hat" viewBox="0 0 120 80" aria-hidden="true">
        <path d="M14 58c0-26 20-44 46-44s46 18 46 44z" fill="#FFD100" stroke="#111" strokeWidth="5" />
        <path d="M60 58h56c2 0 3 6-2 8H60z" fill="#FFD100" stroke="#111" strokeWidth="5" strokeLinejoin="round" />
        <circle cx="60" cy="14" r="5" fill="#111" />
        <text x="60" y="47" textAnchor="middle" fontFamily="Anton, Impact, sans-serif" fontSize="16" fill="#C8102E">ALE TRAIL</text>
      </svg>
      <div className="hl2"><div>Start at any of the 8. Collect a stamp at each.</div>{hats > 0 && <div><i>{hats} trailers have their hat already.</i></div>}</div>
    </TrailFrame>
  );
}

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

const HQ_STORIES = [
  { key: 'mon', day: 'Monday', title: 'Last week on the trail', Story: MondayStory, words: (p) => trailCaption({ ...p, story: { kind: 'numbers' } }) },
  { key: 'thu', day: 'Thursday', title: 'What’s on this weekend', Story: ThursdayStory, words: weekendCaption },
  { key: 'sat', day: 'Saturday', title: 'Tonight on the trail', Story: SaturdayStory, words: tonightCaption },
];

export function PostPackCard() {
  useBrandFonts();
  const [pack, setPack] = useState(null);
  const [error, setError] = useState('');
  const a = useActions((s) => s);
  useEffect(() => {
    let live = true;
    getPostPack(TRAIL_ID).then((r) => { if (!live) return; if (r?.ok && r.week && r.trail) setPack(r); else setError(signInAgain(r?.error) || 'Could not load this week’s stories.'); });
    return () => { live = false; };
  }, []);
  if (error) return <div className="hq-card"><h3 style={{ margin: 0 }}>This week’s stories</h3><p className="hq-note">{error}</p></div>;
  if (!pack) return <div className="hq-card"><h3 style={{ margin: 0 }}>This week’s stories</h3><p className="hq-note">Loading…</p></div>;
  const day = pack.week.monday;
  const tags = tagLine(pack.tags || []);
  return (
    <div className="hq-card pp-card" data-tour="post-pack">
      <div className="pp-head">
        <div><h3 style={{ margin: 0 }}>This week’s stories · {dayMonth(`${day}T12:00:00Z`)}</h3>
          <p className="hq-note" style={{ margin: '2px 0 0' }}>Three stories a week, all about the whole trail. Post each one, add the link sticker, and tag every brewery.</p></div>
        {a.msg && <span className="trp-msg ok" role="status">{a.msg}</span>}
      </div>
      <div className="pp-items">
        {HQ_STORIES.map(({ key, day: d, title, Story, words }) => (
          <div key={key} className="pp-item">
            <h4>{d} <small>{title}</small></h4>
            <Preview size={STORY} scale={0.15}><Story pack={pack} /></Preview>
            <div className="pp-btns">
              <button type="button" className="trp-dl" disabled={!!a.busy} onClick={() => a.download(key, <Story pack={pack} />, STORY, `ale-trail-${day}-${key}.png`)}>{a.busy === key ? 'Making…' : 'Download picture'}</button>
            </div>
            <div className="pp-btns">
              <button type="button" className="admin-btn" style={{ width: 'auto' }} onClick={() => a.copy(STORY_LINK)}>Copy link</button>
              <button type="button" className="admin-btn" style={{ width: 'auto' }} onClick={() => a.copy(tags)}>Copy tags</button>
              <button type="button" className="admin-btn" style={{ width: 'auto' }} onClick={() => a.copy(words(pack))}>Copy words</button>
            </div>
          </div>
        ))}
      </div>
      <div className="pp-tags" style={{ marginTop: 12 }}>{tags}</div>
      <p className="hq-note">Want a feed post too? <button type="button" className="wn-link" disabled={!!a.busy} onClick={() => a.download('post', <TrailPost pack={pack} />, POST, `ale-trail-${day}-post.png`)}>Download last week as a feed post</button></p>
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
