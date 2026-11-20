import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { toPng } from 'html-to-image';
import { getPostPack, getVenuePostPack, TRAIL_ID } from './adminApi';
import { printFontCss } from './printFonts';
import { trackedLink } from './PromoteTab';
import './post-pack.css';

// Weekly post pack (mockup approved 20 Nov 2026): every Monday, last week's trail post, the event
// of the week story and each venue's own story, ready to download and post with words in English
// and Vietnamese. HQ gets all of them on Home; each venue gets its own story on its Promote tab.

const TZ = 'Asia/Ho_Chi_Minh';
const SITE = 'hcm.thealetrail.app';
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
const eventPhoto = (e) => e?.image || e?.venuePhoto || null;

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

function Story({ photo, tag, title, children, cta }) {
  return (
    <div className="pp pp-story" style={{ width: STORY.w, height: STORY.h }}>
      {photo ? <div className="ph" style={{ backgroundImage: `url("${photo}")` }} /> : <div className="ph none" />}
      <div className="sh" />
      <div className="in">
        <img className="logo" src="/brand/logo-white.png" alt="" />
        <div className="tag">{tag}</div>
        <h2>{title}</h2>
        {children}
        <div className="cta">{cta}</div>
      </div>
    </div>
  );
}

export function EventStory({ event: e }) {
  const blurb = firstLine(pick(e.description));
  return (
    <Story photo={eventPhoto(e)} tag="EVENT OF THE WEEK" title={pick(e.title)} cta={`START THE TRAIL FREE · ${SITE}`}>
      <p>{short(e.place)} · {eventWhen(e)}{blurb ? <><br />{blurb}</> : null}<br />Grab your Ale Trail stamp while you’re there.</p>
    </Story>
  );
}

export function VenueStory({ venue: v }) {
  return (
    <Story photo={v.photo} tag="THIS WEEK ON THE ALE TRAIL" title={short(v.name)} cta={`START HERE · ${SITE}`}>
      {!v.quiet && (
        <div className="big">
          <div><b>{v.stamps}</b><span>trailers stamped in</span></div>
          {v.topBeer ? <div><b>{v.topBeer.avg.toFixed(1)}</b><span>{beer(v.topBeer.name)}, guest fave</span></div> : null}
        </div>
      )}
      {v.quiet && v.topBeer ? <p>Guest fave here: <b>{beer(v.topBeer.name)}</b> · {v.topBeer.avg.toFixed(1)}</p> : null}
      <p>Collect all 8 brewery stamps across Saigon and win a free Ale Trail hat.</p>
    </Story>
  );
}

// ----------------------------------------------------------------- the words

export function trailCaption(pack) {
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

export function eventCaption(e) {
  const en = firstLine(pick(e.description)); const vn = firstLine(pick(e.description, 'vn'));
  return `${pick(e.title)} at ${short(e.place)}, ${eventWhen(e)}.${en ? ` ${en}` : ''}\nGrab your Ale Trail stamp while you're there: ${SITE}\n\n`
    + `${pick(e.title, 'vn')} tại ${short(e.place)}, ${eventWhen(e, 'vn')}.${vn && vn !== en ? ` ${vn}` : ''}\nNhớ lấy tem Ale Trail khi ghé quán: ${SITE}`;
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

export function PostPackCard() {
  useBrandFonts();
  const [pack, setPack] = useState(null);
  const [error, setError] = useState('');
  const a = useActions((s) => s);
  useEffect(() => {
    let live = true;
    getPostPack(TRAIL_ID).then((r) => { if (!live) return; if (r?.ok) setPack(r); else setError(signInAgain(r?.error) || 'Could not load this week’s posts.'); });
    return () => { live = false; };
  }, []);
  if (error) return <div className="hq-card"><h3 style={{ margin: 0 }}>This week’s posts</h3><p className="hq-note">{error}</p></div>;
  if (!pack) return <div className="hq-card"><h3 style={{ margin: 0 }}>This week’s posts</h3><p className="hq-note">Loading…</p></div>;
  const day = pack.week.monday;
  const allVenues = async () => {
    a.setBusy('all');
    try {
      for (const v of pack.venues) {
        save(await renderPng(<VenueStory venue={v} />, STORY), `ale-trail-week-${day}-${slug(short(v.name))}.png`);
        await new Promise((r) => setTimeout(r, 400));
      }
      a.flash(`Downloaded ${pack.venues.length} venue stories`);
    } catch { a.flash('Could not make the pictures. Please try again.'); }
    a.setBusy('');
  };
  return (
    <div className="hq-card pp-card" data-tour="post-pack">
      <div className="pp-head">
        <div><h3 style={{ margin: 0 }}>This week’s posts · {dayMonth(`${day}T12:00:00Z`)}</h3>
          <p className="hq-note" style={{ margin: '2px 0 0' }}>Last week on the trail, ready to post. Download the pictures, copy the words (English and Vietnamese), post. Venues get their own story in their dashboard.</p></div>
        {a.msg && <span className="trp-msg ok" role="status">{a.msg}</span>}
      </div>
      <div className="pp-items">
        <div className="pp-item">
          <h4>Trail post <small>Instagram and Facebook feed</small></h4>
          <Preview size={POST} scale={0.2}><TrailPost pack={pack} /></Preview>
          <div className="pp-btns">
            <button type="button" className="trp-dl" disabled={!!a.busy} onClick={() => a.download('post', <TrailPost pack={pack} />, POST, `ale-trail-week-${day}-post.png`)}>{a.busy === 'post' ? 'Making…' : 'Download picture'}</button>
            <button type="button" className="admin-btn" style={{ width: 'auto' }} onClick={() => a.copy(trailCaption(pack))}>Copy words</button>
          </div>
        </div>
        <div className="pp-item">
          <h4>Event of the week <small>story</small></h4>
          {pack.event ? (
            <>
              <Preview size={STORY} scale={0.1406}><EventStory event={pack.event} /></Preview>
              <div className="pp-btns">
                <button type="button" className="trp-dl" disabled={!!a.busy} onClick={() => a.download('event', <EventStory event={pack.event} />, STORY, `ale-trail-week-${day}-event.png`)}>{a.busy === 'event' ? 'Making…' : 'Download picture'}</button>
                <button type="button" className="admin-btn" style={{ width: 'auto' }} onClick={() => a.copy(eventCaption(pack.event))}>Copy words</button>
              </div>
              <p className="hq-note">Picked automatically. To choose another, open What’s On and press Event of the week on it.</p>
            </>
          ) : <p className="hq-note">No events in the next two weeks. Add some in What’s On and one will be picked.</p>}
        </div>
        <div className="pp-item">
          <h4>Venue stories <small>{pack.venues.length} venues</small></h4>
          <ul className="pp-venues">
            {pack.venues.map((v) => (
              <li key={v.id}>
                <span>{short(v.name)}<small>{v.quiet ? 'quiet week: no numbers' : `${v.stamps} stamps`}</small></span>
                <button type="button" className="admin-btn-small" disabled={!!a.busy} onClick={() => a.download(v.id, <VenueStory venue={v} />, STORY, `ale-trail-week-${day}-${slug(short(v.name))}.png`)}>{a.busy === v.id ? '…' : 'Download'}</button>
              </li>
            ))}
          </ul>
          <div className="pp-btns"><button type="button" className="trp-dl" disabled={!!a.busy} onClick={allVenues}>{a.busy === 'all' ? 'Making…' : 'Download all'}</button></div>
          <p className="hq-note">Each venue also sees its own on its Promote tab.</p>
        </div>
      </div>
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
    getVenuePostPack(breweryId).then((r) => { if (live && r?.ok) setData(r); });
    return () => { live = false; };
  }, [breweryId]);
  if (!data) return null;
  const v = data.venue;
  const day = data.week.monday;
  return (
    <div className="admin-card pp-vcard" data-tour="venue-story">
      <Preview size={STORY} scale={0.16}><VenueStory venue={v} /></Preview>
      <div>
        <h3 className="admin-card-title">{t('This week’s story')}</h3>
        <p style={{ color: 'var(--admin-text-muted)', margin: '0 0 12px' }}>{t('Ready every Monday: your venue’s week on the Ale Trail, sized for an Instagram or Facebook story. Post it to bring new guests in. The words come in English and Vietnamese, with your own app link.')}</p>
        <div className="pp-btns">
          <button type="button" className="trp-dl" disabled={!!a.busy} onClick={() => a.download('v', <VenueStory venue={v} />, STORY, `ale-trail-week-${day}-${slug(short(v.name))}.png`)}>{a.busy === 'v' ? t('Making…') : t('Download picture')}</button>
          <button type="button" className="admin-btn" style={{ width: 'auto' }} onClick={() => a.copy(venueCaption(v))}>{t('Copy words')}</button>
          {a.msg && <span className="trp-msg ok" role="status">{a.msg}</span>}
        </div>
      </div>
    </div>
  );
}
