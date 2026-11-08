import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useT, useAdminLang } from './i18n';
import { noteText, releaseDate } from './whatsNewData';
import './whats-new.css';

// What's new after an update (design/whats-new-mockup.html): the box listing the updates, the guided
// tour that goes to each one and points at it, and the What's new page with every past update.

// One stop: open a page (nav) and point at something (data-tour="target"). A "Show me how" walkthrough
// has several steps, each with its own words; "click" means Next clicks the target for them; "missing"
// is said when the thing isn't on screen.
export const stopsOf = (items, lang) => items.flatMap((x) => (x.tour?.steps?.length
  ? x.tour.steps.map((st, k) => ({ key: `${x.id}:${k}`, ...st, ...(lang === 'vi' ? { title: st.title_vi || st.title, body: st.body_vi || st.body, missing: st.missing_vi || st.missing } : {}) }))
  : [{ key: x.id, ...noteText(x, lang), nav: x.tour?.nav, target: x.tour?.target }]));
export const stepCount = (x) => x.tour?.steps?.length ?? (x.tour ? 1 : 0);

const useEscape = (fn) => {
  const ref = useRef(fn);
  useEffect(() => { ref.current = fn; });
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') ref.current(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
};

// The box shown once after a refresh. Close or the tour marks the updates seen.
export function WhatsNewBox({ wn, onTour, onClose }) {
  const t = useT();
  const lang = useAdminLang();
  const close = () => { wn.markSeen(); onClose(); };
  useEscape(close);
  const tour = (list) => { wn.markSeen(); onTour(list); };
  return (
    <div className="wn-scrim" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="wn-box" role="dialog" aria-modal="true" aria-labelledby="wn-title">
        <div>
          <span className="wn-m">{t('Updated {d}', { d: wn.newest ? releaseDate(wn.newest, lang) : '' })}</span>
          <h2 id="wn-title">{t("What's new")} <span className="wn-count">{wn.unseen.length}</span></h2>
        </div>
        {wn.unseen.length > 0 && (
          <ol className="wn-list">
            {wn.unseen.map((x, i) => {
              const n = noteText(x, lang);
              return (
                <li key={x.id}>
                  <span className="wn-num">{i + 1}</span>
                  <div><b>{n.title}</b><span className="wn-m">{n.body}</span></div>
                  {stepCount(x) > 1 && <button type="button" className="wn-link" onClick={() => tour([x])}>{t('Show me how · {n} steps', { n: stepCount(x) })}</button>}
                </li>
              );
            })}
          </ol>
        )}
        {wn.smallFixes > 0 && <span className="wn-m">{wn.smallFixes === 1 ? t('Plus 1 small fix.') : t('Plus {n} small fixes.', { n: wn.smallFixes })}</span>}
        <div className="wn-acts">
          <button type="button" className="wn-btn" onClick={close}>{t('Close')}</button>
          {wn.unseen.some((x) => x.tour) && <button type="button" className="wn-btn primary" autoFocus onClick={() => tour(wn.unseen.filter((x) => x.tour))}>{t('Take the tour')}</button>}
        </div>
      </div>
    </div>
  );
}

// The tour. When the page changes, the bubble and ring fade out, the page changes behind a steady dim,
// and they fade back in once the target has stopped moving. Stops on the same page glide.
export function Tour({ items, nav, onDone }) {
  const t = useT();
  const lang = useAdminLang();
  const [stops] = useState(() => stopsOf(items, lang));
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const [shown, setShown] = useState(false);
  const [glide, setGlide] = useState(false);
  const [missing, setMissing] = useState(false);
  const bubble = useRef(null);
  const [bh, setBh] = useState(170);
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const stop = stops[i];
  const go = useRef(nav);
  useEffect(() => { go.current = nav; });
  const prev = useRef(null);
  useEscape(onDone);

  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!stop) return undefined;
    const before = prev.current;
    prev.current = stop;
    const same = !!before && !stop.nav && !before.click;
    let alive = true; let frame = 0;
    const timers = [];
    const wait = (ms) => new Promise((r) => { timers.push(setTimeout(r, ms)); });
    // Ready when it hasn't moved for 4 frames in a row (page drawn, scrolling finished).
    const settle = (el) => new Promise((resolve) => {
      let last = ''; let calm = 0;
      const tick = () => {
        if (!alive) return;
        const r = el.getBoundingClientRect();
        const k = `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}`;
        calm = k === last ? calm + 1 : 0; last = k;
        if (calm >= 4) resolve(r); else frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    (async () => {
      setGlide(same);
      if (!same) { setShown(false); await wait(200); if (!alive) return; }
      if (stop.nav) go.current(stop.nav);
      let el = null;
      const t0 = Date.now();
      while (alive && stop.target && Date.now() - t0 < 3500) {
        const x = document.querySelector(`[data-tour="${CSS.escape(stop.target)}"]`);
        if (x && x.getBoundingClientRect().width > 0) { el = x; break; }
        await wait(80);
      }
      if (!alive) return;
      if (el) {
        const r0 = el.getBoundingClientRect();
        // Gently bring it into view, sideways too (the venue tabs scroll sideways on a phone).
        if (r0.top < 70 || r0.bottom > window.innerHeight - 70 || r0.left < 8 || r0.right > window.innerWidth - 8) {
          el.scrollIntoView({ block: r0.top < 70 || r0.bottom > window.innerHeight - 70 ? 'center' : 'nearest', inline: 'center', behavior: 'smooth' });
        }
        const r = await settle(el);
        if (!alive) return;
        setRect(r); setMissing(false);
      } else { setRect(null); setMissing(!!stop.target); }
      setShown(true);
      // Keep the ring on it if the page moves later (resizing, scrolling).
      const follow = () => {
        if (!alive) return;
        const r = el?.getBoundingClientRect();
        if (r && r.width > 0) setRect((o) => (o && Math.abs(o.left - r.left) < 1 && Math.abs(o.top - r.top) < 1 && Math.abs(o.width - r.width) < 1 && Math.abs(o.height - r.height) < 1 ? o : r));
        frame = requestAnimationFrame(follow);
      };
      if (el) frame = requestAnimationFrame(follow);
    })();
    return () => { alive = false; cancelAnimationFrame(frame); timers.forEach(clearTimeout); };
  }, [stop]);
  useLayoutEffect(() => { if (bubble.current) setBh(bubble.current.offsetHeight); }, [i, rect, missing]);
  if (!stop) return null;

  const last = i === stops.length - 1;
  const next = () => {
    if (stop.click && stop.target) document.querySelector(`[data-tour="${CSS.escape(stop.target)}"]`)?.click();
    if (last) onDone(); else setI(i + 1);
  };
  const pad = 6; const vw = vp.w; const vh = vp.h; const w = Math.min(320, vw - 32);
  const spot = rect ? { left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 } : null;
  let pos = { left: (vw - w) / 2, top: Math.max(16, (vh - bh) / 2), width: w };
  if (rect) {
    const below = rect.bottom + pad + 12 + bh < vh;
    const above = rect.top - pad - 12 - bh > 0;
    const right = rect.right + pad + 12 + w < vw;
    const left = Math.max(16, Math.min(rect.left, vw - w - 16));
    const midTop = Math.max(16, Math.min(rect.top, vh - bh - 16));
    // Below, else above, else beside it (a tall thing like the menu), else at the bottom.
    pos = below ? { left, width: w, top: rect.bottom + pad + 12 }
      : above ? { left, width: w, top: rect.top - pad - 12 - bh }
        : right ? { left: rect.right + pad + 12, width: w, top: midTop }
          : { left, width: w, top: Math.max(16, vh - bh - 16) };
  }
  const lit = shown && !!spot;
  return (
    <div className={`wn-tour${glide ? ' glide' : ''}`} role="dialog" aria-modal="true" aria-label={t("Tour of what's new")}>
      <div className="wn-dim" style={{ opacity: lit ? 0 : 1 }} />
      {spot && <div className="wn-spot" style={{ ...spot, opacity: lit ? 1 : 0 }} />}
      <div className="wn-bubble" ref={bubble} style={{ ...pos, opacity: shown ? 1 : 0 }}>
        <b>{stop.title}</b>
        <span className="wn-m">{missing && stop.missing ? stop.missing : stop.body}</span>
        {stops.length > 1 && (
          <div className="wn-row">
            <span className="wn-dots">{stops.map((s, k) => <i key={s.key} className={k === i ? 'on' : ''} />)}</span>
            <span>{t('{a} of {b}', { a: i + 1, b: stops.length })}</span>
          </div>
        )}
        <div className="wn-acts">
          {!last && <button type="button" className="wn-btn" onClick={onDone}>{t('Skip tour')}</button>}
          {i > 0 && !stops[i - 1].click && <button type="button" className="wn-btn" onClick={() => setI(i - 1)}>{t('Back')}</button>}
          <button type="button" className="wn-btn primary" autoFocus onClick={next} disabled={!shown}>{last ? t('Done') : t('Next')}</button>
        </div>
      </div>
    </div>
  );
}

// The What's new page: every update, newest first, with what this person can open.
export function WhatsNewPage({ wn, onTour }) {
  const t = useT();
  const lang = useAdminLang();
  // "New" stays on what was new when the page opened, even after it's marked seen.
  const [wasNew] = useState(() => wn.freshIds);
  if (!wn.loaded) return <div className="admin-content wn-page"><p className="wn-m">{t('Loading…')}</p></div>;
  const rows = wn.releases
    .map((r) => ({ r, list: wn.items.filter((x) => x.release_id === r.id).sort((a, b) => a.pos - b.pos) }))
    .filter(({ r, list }) => list.length || r.small_fixes);
  const fixes = (n) => (n === 1 ? t('1 small fix') : t('{n} small fixes', { n }));
  return (
    <div className="admin-content wn-page">
      <h1>{t("What's new")}</h1>
      <span className="wn-m">{t('Every update to the dashboard, newest first')}</span>
      {!rows.length ? <p className="wn-m" style={{ marginTop: 18 }}>{t('No updates yet.')}</p> : rows.map(({ r, list }) => (
        <section key={r.id} className={`wn-rel${wasNew.has(r.id) ? ' new' : ''}`}>
          <h2>
            {releaseDate(r, lang)} · {list.length ? (list.length === 1 ? t('1 update') : t('{n} updates', { n: list.length })) : fixes(r.small_fixes)}
            {wasNew.has(r.id) && <span className="wn-tag">{t('New')}</span>}
          </h2>
          {list.length > 0 && (
            <ul>{list.map((x) => { const n = noteText(x, lang); return <li key={x.id}><b>{n.title}</b><span className="wn-m">{n.body}</span></li>; })}</ul>
          )}
          {r.small_fixes > 0 && list.length > 0 && <span className="wn-m">{r.small_fixes === 1 ? t('Plus 1 small fix.') : t('Plus {n} small fixes.', { n: r.small_fixes })}</span>}
          {list.some((x) => x.tour) && (
            <div><button type="button" className="wn-link" onClick={() => onTour(list.filter((x) => x.tour))}>{wasNew.has(r.id) ? t('Take the tour') : t('Take the tour again')}</button></div>
          )}
        </section>
      ))}
    </div>
  );
}
