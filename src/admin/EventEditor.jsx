import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from './i18n';
import { createBreweryEvent, createTrailEvent, updateEvent, saveEventPoster, TRAIL_ID } from './adminApi';
import { logoFor, photoFor } from '../v2/util';
import './event-editor.css';

// Create / edit an event, for venues (their own events) and HQ (trail-wide events).
// Poster on top, the form in sections, and a live phone preview of how guests see it:
// the What's On card and the Tonight sign. Times are always Saigon time.
const TZ = 'Asia/Ho_Chi_Minh';
const emptyPoster = (url = null) => ({ url, file: null, removed: false });

function saigonParts(iso) {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-CA', { timeZone: TZ }),
    time: d.toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
  };
}
const toIso = (date, time) => new Date(`${date}T${time}:00+07:00`).toISOString();
// "70% 50%" <-> { x: 70, y: 50 }: the part of the poster the app keeps when it crops it.
const parseFocus = (v) => {
  const m = typeof v === 'string' && v.match(/^(\d+(?:\.\d+)?)% (\d+(?:\.\d+)?)%$/);
  return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: 50, y: 50 };
};
const clamp = (n) => Math.max(0, Math.min(100, n));

// The poster shown whole inside the 16:9 box, with a square you drag along its long side
// to choose the crop. Landscape posters slide left/right, tall ones up/down.
function FocusPicker({ src, focus, onFocus, showSquare, label }) {
  const box = useRef(null);
  const [nat, setNat] = useState(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const drag = useRef(null);
  useEffect(() => {
    const el = box.current; if (!el) return undefined;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el); setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);
  useEffect(() => { setNat(null); }, [src]);
  let sq = null;
  if (nat && size.w) {
    const r = nat.w / nat.h;
    const dw = r >= size.w / size.h ? size.w : size.h * r;
    const dh = r >= size.w / size.h ? size.w / r : size.h;
    const left0 = (size.w - dw) / 2; const top0 = (size.h - dh) / 2;
    const side = Math.min(dw, dh);
    const wide = dw > dh;
    sq = { side, wide, room: wide ? dw - side : dh - side,
      left: left0 + (wide ? (dw - side) * focus.x / 100 : 0),
      top: top0 + (wide ? 0 : (dh - side) * focus.y / 100) };
  }
  const down = (e) => { if (!sq) return; e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, f: { ...focus } }; };
  const move = (e) => {
    const d = drag.current; if (!d || !sq || sq.room <= 0) return;
    if (sq.wide) onFocus({ x: clamp(d.f.x + (e.clientX - d.x) / sq.room * 100), y: 50 });
    else onFocus({ x: 50, y: clamp(d.f.y + (e.clientY - d.y) / sq.room * 100) });
  };
  const key = (e) => {
    if (!sq) return;
    const step = e.shiftKey ? 10 : 2;
    const dir = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
    if (!dir) return; e.preventDefault();
    onFocus(sq.wide ? { x: clamp(focus.x + dir * step), y: 50 } : { x: 50, y: clamp(focus.y + dir * step) });
  };
  return (
    <div ref={box} className="eved-focus">
      <img src={src} alt="" onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} />
      {showSquare && sq && (
        <div className="eved-square" role="slider" tabIndex={0} aria-label={label} aria-valuemin={0} aria-valuemax={100}
          aria-valuenow={Math.round(sq.wide ? focus.x : focus.y)}
          style={{ left: sq.left, top: sq.top, width: sq.side, height: sq.side }}
          onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onKeyDown={key}>
          <span className="tag">TONIGHT SIGN</span>
          {sq.room > 0 && (
            <span className="grip">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: sq.wide ? 'none' : 'rotate(90deg)' }}><path d="m8 7-5 5 5 5" /><path d="m16 7 5 5-5 5" /></svg>
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Seg({ value, onChange, options, full }) {
  return (
    <div className={`eved-seg${full ? ' full' : ''}`} role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

function Toggle({ on, onChange, children }) {
  return (
    <button type="button" className={`eved-toggle${on ? ' on' : ''}`} aria-pressed={on} onClick={() => onChange(!on)}>
      <span className="sw" />{children}
    </button>
  );
}

export default function EventEditor({ mode, event, venue, breweries = [], onClose, onSaved }) {
  const t = useT();
  const isHq = mode === 'hq';
  const start0 = saigonParts(event?.startsAt);
  const end0 = saigonParts(event?.endsAt);
  const [f, setF] = useState(() => ({
    titleEn: event?.title?.en || (typeof event?.title === 'string' ? event.title : ''),
    titleVn: event?.title?.vn && event.title.vn !== event.title.en ? event.title.vn : '',
    descEn: event?.description?.en || (typeof event?.description === 'string' ? event.description : ''),
    descVn: event?.description?.vn && event.description.vn !== event.description.en ? event.description.vn : '',
    date: start0.date,
    start: start0.time || '19:00',
    end: end0.time || '22:00',
    noEnd: event ? !event.endsAt : false,
    where: event?.breweryId ? 'brewery' : 'else',
    breweryId: event?.breweryId || '',
    venueName: event?.venueName || '',
    venueAddress: event?.venueAddress || '',
    mapsUrl: event?.venueMapsUrl || '',
    link: event?.link || '',
    category: event?.category || 'event',
    show: event ? event.status !== 'hidden' : true,
  }));
  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const [nameLang, setNameLang] = useState('en');
  const [descLang, setDescLang] = useState('en');
  const [poster, setPoster] = useState(() => emptyPoster(event?.photoUrl || null));
  const [showSafe, setShowSafe] = useState(false);
  const [focus, setFocus] = useState(() => parseFocus(event?.photoFocus));
  const [dragging, setDragging] = useState(false);
  const [pv, setPv] = useState('card');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !saving) onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [saving]);

  const posterSrc = useMemo(() => (poster.file ? URL.createObjectURL(poster.file) : poster.removed ? null : poster.url), [poster]);
  useEffect(() => () => { if (poster.file && posterSrc) URL.revokeObjectURL(posterSrc); }, [posterSrc]);

  const pickFile = (file) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setError(t('Poster must be a JPG, PNG or WebP image')); return; }
    setError(''); setPoster((p) => ({ ...p, file, removed: false })); setFocus({ x: 50, y: 50 });
  };

  // Who/where for the preview.
  const atBrewery = isHq ? (f.where === 'brewery' ? breweries.find((b) => b.id === f.breweryId) : null) : venue;
  const placeName = isHq && f.where === 'else' ? (f.venueName || t('Place name')) : (atBrewery?.name || t('Choose a brewery'));
  const fallbackImg = atBrewery ? photoFor(atBrewery) : null;
  const previewImg = posterSrc || fallbackImg;
  const thumb = posterSrc || (atBrewery ? logoFor(atBrewery) : null);
  const focusCss = `${Math.round(focus.x)}% ${Math.round(focus.y)}%`;
  const previewTitle = (nameLang === 'vn' && f.titleVn) || f.titleEn || t('Event name');
  const d = f.date ? new Date(`${f.date}T12:00:00+07:00`) : null;
  const dow = d ? d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: TZ }).toUpperCase() : 'DAY';
  const day = d ? d.toLocaleDateString('en-GB', { day: 'numeric', timeZone: TZ }) : '--';
  const mon = d ? d.toLocaleDateString('en-GB', { month: 'short', timeZone: TZ }).toUpperCase() : 'MON';

  const save = async () => {
    if (!f.titleEn.trim()) { setError(t('Add the event name in English')); setNameLang('en'); return; }
    if (!f.date || !f.start) { setError(t('Add the date and start time')); return; }
    if (isHq && f.where === 'brewery' && !f.breweryId) { setError(t('Choose the brewery')); return; }
    const startsAt = toIso(f.date, f.start);
    let endsAt = null;
    if (!f.noEnd && f.end) {
      endsAt = toIso(f.date, f.end);
      if (new Date(endsAt) <= new Date(startsAt)) endsAt = new Date(new Date(endsAt).getTime() + 86400e3).toISOString(); // ends after midnight
    }
    const body = {
      title: { en: f.titleEn.trim(), vn: f.titleVn.trim() || f.titleEn.trim() },
      description: f.descEn.trim() ? { en: f.descEn.trim(), vn: f.descVn.trim() || f.descEn.trim() } : null,
      starts_at: startsAt,
      ends_at: endsAt,
      link: f.link.trim() || null,
      category: f.category,
      status: f.show ? 'active' : 'hidden',
      image_focus: posterSrc ? focusCss : null,
      ...(isHq ? (f.where === 'brewery'
        ? { brewery_id: f.breweryId }
        : { brewery_id: null, venue_name: f.venueName, venue_address: f.venueAddress, venue_maps_url: f.mapsUrl }) : {}),
    };
    setSaving(true); setError('');
    const r = event ? await updateEvent(event.id, body)
      : isHq ? await createTrailEvent(TRAIL_ID, body)
      : await createBreweryEvent(venue.id, body);
    if (!r?.ok) { setSaving(false); setError(t(r?.error || 'Could not save. Please try again.')); return; }
    let ev = r.event;
    const pr = await saveEventPoster(ev.id, poster);
    setSaving(false);
    if (pr.ok) ev = { ...ev, photoUrl: pr.photoUrl };
    onSaved(ev, { isNew: !event, posterError: pr.ok ? null : pr.error });
  };

  const crumb = isHq ? `${t("What's On")} · ${t('Trail-wide')}` : `${t('Events')} · ${venue?.name || ''}`;

  return (
    <div className="eved-overlay" role="dialog" aria-modal="true" aria-label={event ? t('Edit event') : t('New event')}>
      <div className="eved-sheet">
        <div className="eved-head">
          <div><div className="crumb">{crumb}</div><h2>{event ? t('Edit event') : t('New event')}</h2></div>
          <span className="sp" />
          <button type="button" className="eved-icon" onClick={onClose} aria-label={t('Close')} disabled={saving}>×</button>
        </div>

        <div className="eved-body">
          <div className="eved-form">
            <section className="eved-card">
              <div className="eved-labrow">
                <h3>{t('Poster')}</h3>
                {posterSrc && <Toggle on={showSafe} onChange={setShowSafe}>{t('Choose what the Tonight sign shows')}</Toggle>}
              </div>
              <div
                className={`eved-drop${dragging ? ' drag' : ''}${showSafe && posterSrc ? ' safe-on' : ''}${posterSrc ? ' has' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files?.[0]); }}
                onClick={() => !posterSrc && fileRef.current?.click()}
              >
                {posterSrc ? (
                  <FocusPicker src={posterSrc} focus={focus} onFocus={setFocus} showSquare={showSafe} label={t('Drag to choose')} />
                ) : (
                  <div className="empty">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" /></svg>
                    <b>{t('Drop a poster here')}</b>
                    <span>{t('or choose a file from your computer or phone')}</span>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }} />
              <div className="eved-posterbar">
                <button type="button" className="eved-btn primary" onClick={() => fileRef.current?.click()}>{posterSrc ? t('Replace poster') : t('Choose poster')}</button>
                {posterSrc && <button type="button" className="eved-btn ghost" onClick={() => { setShowSafe(false); setPoster((p) => ({ ...p, file: null, removed: true })); }}>{t('Remove')}</button>}
                <div className="eved-spec"><span>1600 × 900 px</span><span>{t('Landscape 16:9')}</span><span>{t('JPG or PNG')}</span><span>{t('Words in the middle')}</span></div>
              </div>
              {posterSrc && showSafe && (
                <div className="eved-focusrow">
                  <span>{t('Drag the yellow square to the best part of the poster. The Tonight sign and the event card both use that spot.')}</span>
                  <button type="button" onClick={() => setFocus({ x: 50, y: 50 })}>{t('Reset to centre')}</button>
                </div>
              )}
              <p className="eved-hint">{posterSrc ? t('The event card trims the edges. Tall posters still work and show in full when a guest opens the event.') : t('No poster: the app shows the venue photo instead.')}</p>
            </section>

            <section className="eved-card">
              <div className="eved-labrow">
                <h3>{t('Name')}</h3>
                <Seg value={nameLang} onChange={setNameLang} options={[{ value: 'en', label: 'English' }, { value: 'vn', label: 'Tiếng Việt' }]} />
              </div>
              {nameLang === 'en'
                ? <input className="eved-in" value={f.titleEn} onChange={(e) => set({ titleEn: e.target.value })} placeholder={t('e.g. Halloween Collab Fest')} aria-label={t('Event name in English')} />
                : <input className="eved-in" value={f.titleVn} onChange={(e) => set({ titleVn: e.target.value })} placeholder={f.titleEn || t('Vietnamese name')} aria-label={t('Event name in Vietnamese')} />}
              <p className="eved-hint">{t('Leave Tiếng Việt empty and guests see the English name.')}</p>
            </section>

            <section className="eved-card">
              <h3>{t('When')}</h3>
              <p className="eved-sub">{t('Saigon time.')}</p>
              <div className="eved-grid r3">
                <label className="wide"><span className="l">{t('Date')}</span><input className="eved-in" type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} /></label>
                <label><span className="l">{t('Starts')}</span><input className="eved-in" type="time" value={f.start} onChange={(e) => set({ start: e.target.value })} /></label>
                <label className={f.noEnd ? 'dim' : ''}><span className="l">{t('Ends')}</span><input className="eved-in" type="time" value={f.end} disabled={f.noEnd} onChange={(e) => set({ end: e.target.value })} /></label>
              </div>
              <div className="eved-mt"><Toggle on={f.noEnd} onChange={(v) => set({ noEnd: v })}>{t('No end time (stays on the Tonight sign until midnight)')}</Toggle></div>
            </section>

            {isHq && (
              <section className="eved-card">
                <div className="eved-labrow">
                  <h3>{t('Where')}</h3>
                  <Seg value={f.where} onChange={(v) => set({ where: v })} options={[{ value: 'brewery', label: t('A trail brewery') }, { value: 'else', label: t('Somewhere else') }]} />
                </div>
                {f.where === 'brewery' ? (
                  <label><span className="l">{t('Brewery')}</span>
                    <select className="eved-in" value={f.breweryId} onChange={(e) => set({ breweryId: e.target.value })}>
                      <option value="">{t('Choose a brewery')}</option>
                      {breweries.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </label>
                ) : (
                  <>
                    <div className="eved-grid r2">
                      <label><span className="l">{t('Place name')}</span><input className="eved-in" value={f.venueName} onChange={(e) => set({ venueName: e.target.value })} placeholder="BigBamBoo Saigon" /></label>
                      <label><span className="l">{t('Address')}</span><input className="eved-in" value={f.venueAddress} onChange={(e) => set({ venueAddress: e.target.value })} placeholder="10 An Phú, An Khánh, Hồ Chí Minh" /></label>
                      <label className="span2"><span className="l">{t('Google Maps link')}</span><input className="eved-in" type="url" value={f.mapsUrl} onChange={(e) => set({ mapsUrl: e.target.value })} placeholder="https://maps.app.goo.gl/…" /></label>
                    </div>
                    <p className="eved-hint">{t("Paste the place's Google Maps link and the Directions button goes straight to the right door.")}</p>
                  </>
                )}
              </section>
            )}

            <section className="eved-card">
              <div className="eved-labrow">
                <h3>{t('Details')}</h3>
                <Seg value={descLang} onChange={setDescLang} options={[{ value: 'en', label: 'English' }, { value: 'vn', label: 'Tiếng Việt' }]} />
              </div>
              {descLang === 'en'
                ? <textarea className="eved-in" rows={5} value={f.descEn} onChange={(e) => set({ descEn: e.target.value })} placeholder={t('What is happening, who is pouring, anything guests should know.')} aria-label={t('Details in English')} />
                : <textarea className="eved-in" rows={5} value={f.descVn} onChange={(e) => set({ descVn: e.target.value })} placeholder={t('Leave empty to show the English text.')} aria-label={t('Details in Vietnamese')} />}
              <div className="eved-grid r2 eved-mt">
                <label><span className="l">{t('Link (optional)')}</span><input className="eved-in" type="url" value={f.link} onChange={(e) => set({ link: e.target.value })} placeholder="https://" /></label>
                <div><span className="l">{t('Type')}</span><Seg full value={f.category} onChange={(v) => set({ category: v })} options={[{ value: 'event', label: t('Event') }, { value: 'new_release', label: t('New beer') }]} /></div>
              </div>
              <div className="eved-mt"><Toggle on={f.show} onChange={(v) => set({ show: v })}>{t('Show in the app')}</Toggle></div>
            </section>
          </div>

          <aside className="eved-preview">
            <div className="sticky">
              <h3>{t('How guests see it')}</h3>
              <p className="eved-sub">{t('Updates as you type.')}</p>
              <div className="eved-pvtabs"><Seg value={pv} onChange={setPv} options={[{ value: 'card', label: t("What's On card") }, { value: 'tonight', label: t('Tonight sign') }]} /></div>
              <div className="eved-phone">
                {pv === 'card' ? (
                  <div className="zone">
                    <div className="eb">{t('COMING UP')}</div><div className="zh">{t("What's on")}</div>
                    <div className="evc">
                      <div className="top" style={previewImg ? { backgroundImage: `url("${previewImg}")`, backgroundPosition: posterSrc ? focusCss : 'center' } : undefined}>
                        <div className="date"><span className="sm">{dow}</span><span className="big">{day}</span><span className="sm">{mon} · {f.start || '--:--'}</span></div>
                      </div>
                      <div className="bd"><span className={`cat${f.category === 'new_release' ? ' new' : ''}`}>{f.category === 'new_release' ? t('NEW BEER') : t('EVENT')}</span><div className="ttl">{previewTitle}</div><div className="ven">{placeName}</div></div>
                    </div>
                  </div>
                ) : (
                  <div className="neon">
                    <div className="sign">{t('TONIGHT')}</div>
                    <div className="when">{day} {mon} · {f.start || '--:--'}</div>
                    <div className="ev">
                      <div className="th" style={thumb ? { backgroundImage: `url("${thumb}")`, backgroundPosition: posterSrc ? focusCss : 'center' } : undefined} />
                      <div><b>{previewTitle}</b><small>{placeName}</small></div>
                    </div>
                    <div className="bar"><span>{t('STARTS IN')}</span><big>3h 12m</big></div>
                  </div>
                )}
              </div>
              {!f.show && <p className="eved-hint center">{t('Hidden: guests will not see this event.')}</p>}
            </div>
          </aside>
        </div>

        <div className="eved-foot">
          <span className={`status${error ? ' err' : ''}`} role={error ? 'alert' : undefined}>{error || t('Saved changes go live in the app straight away.')}</span>
          <span className="sp" />
          <button type="button" className="eved-btn ghost" onClick={onClose} disabled={saving}>{t('Cancel')}</button>
          <button type="button" className="eved-btn primary" onClick={save} disabled={saving}>{saving ? t('Saving…') : event ? t('Save event') : t('Create event')}</button>
        </div>
      </div>
    </div>
  );
}
