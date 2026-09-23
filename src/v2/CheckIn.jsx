import { useEffect, useMemo, useRef, useState } from 'react';
import { TRAIL_ID } from '../config';
import { serverCheckin, postRating } from '../lib/api';
import { useV, fmt } from './i18n';
import { Icon } from './ui';
import { useBreweryBeers } from './Brewery';
import { beerLook, STYLE_GROUPS, haptic, prefersReducedMotion, stampLabel } from './util';

const DENSE_FROM = 10; // menus this size switch to 3-column tiles grouped by style

// ── Step 1: the tap wall ────────────────────────────────────────────────────
function TapWall({ brewery, language, picked, onPick, onNext, onClose }) {
  const v = useV(language);
  const { beers, recent, loaded } = useBreweryBeers(brewery.id);
  const [q, setQ] = useState('');
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const groupRefs = useRef({});

  // Menu beers, or (for breweries with no menu entered) beers people rated here.
  const menu = useMemo(() => {
    if (beers.length) return beers;
    return recent.map((r, i) => ({ id: `recent-${i}`, name: r.name, style: '', avg_rating: r.avg_rating, recent_count: r.ratings_count }));
  }, [beers, recent]);
  const dense = menu.length >= DENSE_FROM;

  const filtered = q
    ? menu.filter((b) => `${b.name} ${b.style || ''}`.toLowerCase().includes(q.toLowerCase()))
    : menu;

  const popular = [...menu].sort((a, b) => (b.recent_count || 0) - (a.recent_count || 0)).slice(0, dense ? 6 : 0)
    .filter((b) => (b.recent_count || 0) > 0);

  const grouped = STYLE_GROUPS.map((g) => ({ g, list: filtered.filter((b) => beerLook(b.style, b.name).group === g) }))
    .filter((x) => x.list.length);

  const suggestions = typed.trim().length >= 2
    ? [...new Set([...menu.map((b) => b.name)])].filter((n) => n.toLowerCase().includes(typed.trim().toLowerCase())).slice(0, 4)
    : [];

  const tile = (b) => {
    const look = beerLook(b.style, b.name);
    const on = picked?.name === b.name;
    return (
      <button key={b.id} type="button" className="tap" aria-pressed={on}
        style={{ background: look.color, color: look.ink }}
        onClick={() => { onPick({ name: b.name, style: b.style, abv: b.abv, brewery_beer_id: /^(recent|demo)/.test(String(b.id)) ? null : b.id }); setTyping(false); }}>
        <span className="n">{b.name}</span>
        <span className="s">{[b.style, b.abv ? `${b.abv}%` : null].filter(Boolean).join(' · ')}</span>
      </button>
    );
  };

  const jump = (g) => groupRefs.current[g]?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });

  return (
    <div className="v2-flow pick" role="dialog" aria-modal="true" aria-label={v.whatDrinking}>
      <div className="wrap">
        <div className="stickyhead">
          <div className="head">
            <span>{brewery.name}</span>
            <span className="spacer" />
            {dense && (
              <button type="button" className="round-btn light" onClick={() => setSearchOpen((s) => !s)} aria-label={v.searchBeers}>
                <Icon.search />
              </button>
            )}
            <button type="button" className="round-btn light" onClick={onClose} aria-label={v.close}>✕</button>
          </div>
          <h1>{v.whatDrinking}</h1>
          {(searchOpen || (!dense && menu.length > 6)) && (
            <label className="search">
              <Icon.search />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={fmt(v.searchBeers, { n: menu.length })} aria-label={fmt(v.searchBeers, { n: menu.length })} />
            </label>
          )}
          {dense && !q && (
            <div className="seg" role="group" aria-label={v.byStyle} style={{ fontSize: '.8rem' }}>
              {popular.length > 0 && <button type="button" onClick={() => jump('popular')}>{v.popular}</button>}
              {grouped.map(({ g }) => <button key={g} type="button" onClick={() => jump(g)}>{v[g]}</button>)}
            </div>
          )}
        </div>

        {!loaded && <p>{v.loading}</p>}

        {loaded && !dense && (
          <div className="tapwall">
            {filtered.map(tile)}
            <button type="button" className="tap add" onClick={() => setTyping(true)}>
              <span className="n">{v.notListed}</span><span className="s">{v.typeIt}</span>
            </button>
          </div>
        )}

        {loaded && dense && (
          <>
            {!q && popular.length > 0 && (
              <div ref={(el) => { groupRefs.current.popular = el; }} style={{ scrollMarginTop: 190 }}>
                <div className="grouphead"><span>{v.popularTonight}</span><span className="rule" /></div>
                <div className="tapwall dense" style={{ marginTop: 6 }}>{popular.map(tile)}</div>
              </div>
            )}
            {grouped.map(({ g, list }) => (
              <div key={g} ref={(el) => { groupRefs.current[g] = el; }} style={{ scrollMarginTop: 190 }}>
                <div className="grouphead"><span>{v[g].toUpperCase()}</span><span className="rule" /><span className="c">{list.length}</span></div>
                <div className="tapwall dense" style={{ marginTop: 6 }}>{list.map(tile)}</div>
              </div>
            ))}
          </>
        )}

        {(typing || (loaded && menu.length === 0)) && (
          <div className="typebox">
            <input autoFocus={typing} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={v.typeBeerName} aria-label={v.typeBeerName}
              onKeyDown={(e) => { if (e.key === 'Enter' && typed.trim()) onPick({ name: typed.trim() }); }} />
            {suggestions.map((s) => (
              <button key={s} type="button" className="sugg" onClick={() => { onPick({ name: s }); setTyped(s); }}>{s}</button>
            ))}
            {typed.trim() && !suggestions.some((s) => s.toLowerCase() === typed.trim().toLowerCase()) && (
              <button type="button" className="sugg" style={{ color: 'var(--red)' }} onClick={() => onPick({ name: typed.trim() })}>
                + {fmt(v.addNew, { q: typed.trim() })}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="foot">
        <div className="inner">
          {dense && !typing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.82rem' }}>
              <button type="button" className="sq-btn" style={{ borderStyle: 'dashed' }} onClick={() => setTyping(true)}>+ {v.notListed} {v.typeIt}</button>
              <span style={{ flex: 1 }} />
              {picked && <span>{fmt(v.picked, { name: picked.name })}</span>}
            </div>
          )}
          <button type="button" className="btn block" disabled={!picked} onClick={onNext}>
            {picked ? v.nextRate : v.pickBeer}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 2: rate + review ───────────────────────────────────────────────────
function RateStep({ brewery, beer, language, rating, setRating, review, setReview, onBack, onNext, isStamped, busy }) {
  const v = useV(language);
  const look = beerLook(beer.style, beer.name);
  const light = look.ink === '#111';
  return (
    <div className="v2-flow rate" role="dialog" aria-modal="true" aria-label={v.howIsIt} style={{ background: look.color, color: look.ink }}>
      <div className="wrap">
        <div className="head">
          <button type="button" className="round-btn" onClick={onBack} aria-label={v.back}>←</button>
          <span className="spacer" />
          <span>{fmt(v.stepOf, { n: 2 })}</span>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 6 }}>
          <i className="glassbig" style={{ background: light ? '#FFB347' : look.color, boxShadow: 'inset 0 0 0 4px #111' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{brewery.name}</div>
            <h1 style={{ fontSize: '2.2rem' }}>{beer.name}</h1>
            {(beer.style || beer.abv) && <div style={{ fontSize: '.85rem' }}>{[beer.style, beer.abv ? `${beer.abv}%` : null].filter(Boolean).join(' · ')}</div>}
          </div>
        </div>
        <h2 className="display" style={{ fontSize: '1.4rem', marginTop: 8 }}>{v.howIsIt}</h2>
        <div className="stars" role="radiogroup" aria-label={v.howIsIt}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} / 5`}
              className={n <= rating ? 'on' : ''} onClick={() => setRating(n)}>★</button>
          ))}
        </div>
        <div className="eyebrow" style={{ marginTop: 6 }}>{v.yourReview}</div>
        <textarea value={review} maxLength={280} onChange={(e) => setReview(e.target.value)} placeholder={v.reviewPlaceholder} aria-label={v.yourReview} />
        <div className="count">{review.length} / 280</div>
        <p style={{ fontSize: '.8rem' }}>{v.reviewNote}</p>
      </div>
      <div className="foot" style={{ background: 'transparent' }}>
        <div className="inner">
          <button type="button" className="btn ink block" disabled={!rating || busy} onClick={onNext}>
            {!rating ? v.pickRating : isStamped ? v.saveBeer : v.handToStaff}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: staff PIN (also used for side quests) ───────────────────────────
export function StaffPin({ language, title, lines, onSubmit, onBack }) {
  const v = useV(language);
  const [digits, setDigits] = useState(['', '', '', '']);
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const refs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => { setTimeout(() => refs[0].current?.focus(), 120); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (pin) => {
    if (busy) return;
    setBusy(true); setErr('');
    const res = await onSubmit(pin);
    setBusy(false);
    if (res?.ok) return;
    const msg = res?.status === 429 ? v.tooMany : res?.status === 401 ? v.sessionGone : v.wrongPin;
    setErr(msg); setShake(true); haptic([30, 40, 30]);
    setDigits(['', '', '', '']);
    setTimeout(() => { setShake(false); refs[0].current?.focus(); }, 450);
  };

  const change = (i, val) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...digits]; next[i] = d; setDigits(next); setErr('');
    if (d && i < 3) refs[i + 1].current?.focus();
    if (d && i === 3 && next.every(Boolean)) submit(next.join(''));
  };

  return (
    <div className="v2-flow staff" role="dialog" aria-modal="true" aria-label={v.staffOnly}>
      <div className="wrap">
        <span className="tag dark" style={{ alignSelf: 'flex-start', background: 'var(--yellow)', color: 'var(--ink)', borderColor: 'var(--yellow)' }}>{v.staffOnly}</span>
        <h1>{v.staffPin}</h1>
        <div className="summary">
          <span style={{ fontSize: '.8rem', opacity: .75 }}>{title || v.stamping}</span>
          {lines.map((l, i) => <span key={i} style={i === 0 ? { fontWeight: 800 } : undefined}>{l}</span>)}
        </div>
        <div className={`pinrow${shake ? ' shake' : ''}`}>
          {digits.map((d, i) => (
            <input key={i} ref={refs[i]} value={d} inputMode="numeric" pattern="[0-9]*" type="password" autoComplete="one-time-code"
              maxLength={1} aria-label={`PIN digit ${i + 1}`} disabled={busy}
              onChange={(e) => change(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i - 1].current?.focus(); }} />
          ))}
        </div>
        <p className="pinerr" role="alert">{busy ? v.checking : err}</p>
        <p style={{ textAlign: 'center', fontSize: '.85rem', opacity: .85 }}>{v.autoSubmit}</p>
        <button type="button" className="link-btn" style={{ marginTop: 'auto', alignSelf: 'center', color: '#fff' }} onClick={onBack}>{v.giveBack}</button>
      </div>
    </div>
  );
}

// ── The stamp slam ──────────────────────────────────────────────────────────
export function Slam({ language, label, sub, headline, line, onDone }) {
  const v = useV(language);
  useEffect(() => {
    const t1 = setTimeout(() => haptic(45), prefersReducedMotion() ? 0 : 430);
    return () => clearTimeout(t1);
  }, []);
  return (
    <div className="v2-flow slam" role="dialog" aria-modal="true" aria-label={headline}>
      <div className="wrap" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="slam-stage" style={{ position: 'relative' }}>
          <span className="slam-ring" />
          <div className="slam-stamp slam-in">{label}<small>{sub}</small></div>
        </div>
        <div className="slam-msg">
          <div className="display">{headline}</div>
          {line && <p style={{ fontWeight: 600, marginTop: 6 }}>{line}</p>}
        </div>
        <button type="button" className="btn" style={{ marginTop: 20, animation: 'v2-rise .3s .9s both' }} onClick={onDone}>{v.next}</button>
      </div>
    </div>
  );
}

// ── Orchestrator ────────────────────────────────────────────────────────────
export default function CheckInFlow({ brewery, isStamped, stampCount, total, language, onClose, onStamped, onBeerSaved, onToast }) {
  const v = useV(language);
  const [step, setStep] = useState('pick');
  const [beer, setBeer] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [busy, setBusy] = useState(false);
  const [slam, setSlam] = useState(null);

  const saveBeerOnly = async () => {
    setBusy(true);
    const res = await postRating(TRAIL_ID, brewery.id, {
      beer_name: beer.name, rating, notes: review.trim() || null, brewery_beer_id: beer.brewery_beer_id || null,
    });
    setBusy(false);
    if (res?.ok !== false) { onBeerSaved?.(); onToast?.(v.beerSaved); onClose(); }
    else onToast?.(res?.error || v.sessionGone);
  };

  const submitPin = async (pin) => {
    const res = await serverCheckin({ breweryId: brewery.id, pin, beerName: beer.name, rating, notes: review.trim() || null });
    if (res?.ok) {
      if (res.duplicate) {
        // Already stamped here on the server: the check-in route skips the rating, so save it directly
        postRating(TRAIL_ID, brewery.id, { beer_name: beer.name, rating, notes: review.trim() || null, brewery_beer_id: beer.brewery_beer_id || null }).catch(() => {});
      }
      const n = stampCount + (res.duplicate ? 0 : 1);
      const left = Math.max(0, total - n);
      const headline = n >= total ? v.allEight : n === Math.ceil(total / 2) ? `${fmt(v.stampN, { n })} ${v.halfway}` : n === total - 1 ? `${fmt(v.stampN, { n })} ${v.oneLeft}` : fmt(v.stampN, { n });
      setSlam({ n, headline, line: left > 0 ? fmt(v.moreToGo, { n: left }) : v.hatEarned });
      onStamped?.(brewery.id, n);
      return { ok: true };
    }
    return res;
  };

  if (slam) {
    return (
      <Slam language={language} label={stampLabel(brewery.name)}
        sub={new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).replace('/', '·')}
        headline={slam.headline} line={slam.line} onDone={onClose} />
    );
  }
  if (step === 'staff') {
    return (
      <StaffPin language={language} lines={[brewery.name, `${beer.name} · ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}`]}
        onSubmit={submitPin} onBack={() => setStep('rate')} />
    );
  }
  if (step === 'rate') {
    return (
      <RateStep brewery={brewery} beer={beer} language={language} rating={rating} setRating={setRating}
        review={review} setReview={setReview} isStamped={isStamped} busy={busy}
        onBack={() => setStep('pick')} onNext={() => (isStamped ? saveBeerOnly() : setStep('staff'))} />
    );
  }
  return (
    <TapWall brewery={brewery} language={language} picked={beer} onPick={setBeer} onClose={onClose}
      onNext={() => beer && setStep('rate')} />
  );
}
