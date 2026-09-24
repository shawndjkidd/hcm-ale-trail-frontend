import { useEffect, useMemo, useState } from 'react';
import { TRAIL_ID } from '../config';
import { useV, fmt, shortDate, weekdayName } from './i18n';
import { Icon, Seg, Sheet, Glass } from './ui';
import { statusText } from './Home';
import EventSheet from './EventSheet';
import { DEMO_MODE, demoBeers } from './demo';
import { openStatus, localized, districtLabel, beerLook, placeGradient, logoFor, photoFor, STYLE_GROUPS, safeHref } from './util';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function useBreweryBeers(breweryId) {
  const [data, setData] = useState({ beers: [], recent: [], loaded: false });
  useEffect(() => {
    let alive = true;
    setData({ beers: [], recent: [], loaded: false });
    fetch(`/api/trails/${TRAIL_ID}/breweries/${breweryId}/beers`)
      .then((r) => r.json())
      .then((d) => { if (alive) setData({ beers: d?.beers?.length ? d.beers : (DEMO_MODE ? demoBeers(breweryId) : []), recent: d?.recent || [], ratedNames: d?.ratedNames || [], loaded: true }); })
      .catch(() => { if (alive) setData({ beers: DEMO_MODE ? demoBeers(breweryId) : [], recent: [], loaded: true }); });
    return () => { alive = false; };
  }, [breweryId]);
  return data;
}

function handleFrom(url) {
  if (!url) return null;
  const m = String(url).match(/instagram\.com\/([^/?#]+)/i);
  return m ? `@${m[1]}` : null;
}

function BeerRow({ beer }) {
  const look = beerLook(beer.style, beer.name);
  return (
    <div className="beerrow">
      <Glass color={look.color} />
      <span className="n">{beer.name}</span>
      <span className="m">
        {[beer.style, beer.abv ? `${beer.abv}%` : null, beer.avg_rating ? `${beer.avg_rating}★` : null].filter(Boolean).join(' · ')}
      </span>
    </div>
  );
}

export default function Brewery({ brewery, stampedAt, beerCountHere = 0, events = [], language, onBack, onCheckIn }) {
  const v = useV(language);
  const st = openStatus(brewery);
  const { beers, recent, loaded } = useBreweryBeers(brewery.id);
  const [sort, setSort] = useState('popular');
  const [showHours, setShowHours] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openEvent, setOpenEvent] = useState(null);
  const isStamped = !!stampedAt;
  const handle = handleFrom(brewery.instagram_url);
  const logo = logoFor(brewery);
  const hero = photoFor(brewery) ? `url("${photoFor(brewery)}") center/cover` : placeGradient(brewery.id);
  const desc = brewery.description_i18n ? localized(brewery.description_i18n, language) : brewery.description;

  const sorted = useMemo(() => {
    const list = [...beers];
    if (sort === 'new') list.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    else if (sort === 'style') list.sort((a, b) => STYLE_GROUPS.indexOf(beerLook(a.style, a.name).group) - STYLE_GROUPS.indexOf(beerLook(b.style, b.name).group));
    else list.sort((a, b) => (b.recent_count - a.recent_count) || (b.ratings_count - a.ratings_count) || a.name.localeCompare(b.name));
    return list;
  }, [beers, sort]);

  const myEvents = events
    .filter((e) => (e.breweryId && e.breweryId === brewery.id) || (e.breweryName && e.breweryName === brewery.name))
    .filter((e) => new Date(e.endsAt || e.startsAt) >= new Date())
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

  const copyHandle = async () => {
    try { await navigator.clipboard.writeText(handle); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'Asia/Ho_Chi_Minh' }).toLowerCase();
  const hours = brewery.operating_hours || {};

  const socials = [
    safeHref(brewery.instagram_url) && { label: 'Instagram', href: safeHref(brewery.instagram_url), bg: '#E1306C', fg: '#fff', icon: Icon.instagram },
    safeHref(brewery.facebook_url) && { label: 'Facebook', href: safeHref(brewery.facebook_url), bg: '#1877F2', fg: '#fff', icon: Icon.facebook },
    safeHref(brewery.website_url) && { label: v.website, href: safeHref(brewery.website_url), bg: '#fff', fg: '#111', icon: Icon.globe },
    (safeHref(brewery.maps_url) || brewery.latitude != null) && {
      label: v.directions,
      href: safeHref(brewery.maps_url) || `https://www.google.com/maps/dir/?api=1&destination=${brewery.latitude},${brewery.longitude}`,
      bg: '#FFD100', fg: '#111', icon: Icon.pin,
    },
  ].filter(Boolean);

  return (
    <div className="v2-brewery">
      <div className="hero" style={{ background: hero }}>
        <button type="button" className="round-btn" onClick={onBack} aria-label={v.back}>←</button>
        {logo && <img className="hero-logo" src={logo} alt="" />}
      </div>

      <div className="content">
        <h1>{brewery.name}</h1>
        <div className="statusline">
          <span className={`dot${st.open ? ' on' : ''}`} />
          <span>{statusText(st, v, language)}</span>
          <span style={{ color: 'var(--muted)', fontWeight: 500 }}>· {districtLabel(brewery.district, language)}</span>
          <span style={{ flex: 1 }} />
          <button type="button" className="link-btn" onClick={() => setShowHours((s) => !s)} aria-expanded={showHours}>
            {v.hours} {showHours ? '▴' : '▾'}
          </button>
        </div>
        {showHours && (
          <table className="hours card">
            <tbody>
              {DAY_KEYS.map((d, i) => {
                const h = hours[d];
                return (
                  <tr key={d} className={d === today ? 'today' : ''}>
                    <td>{weekdayName((i + 1) % 7, language)}</td>
                    <td>{!h || h.closed ? '—' : `${h.open} – ${h.close === '00:00' ? v.midnight : h.close}`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {brewery.address && <p className="desc" style={{ marginTop: -6 }}>{brewery.address}</p>}

        {st.tempClosed && <div className="banner-closed">{v.tempClosed}</div>}

        {socials.length > 0 && (
          <div className="v2-links" style={{ gridTemplateColumns: `repeat(${socials.length}, minmax(0, 1fr))` }}>
            {socials.map((s) => {
              const I = s.icon;
              return (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" style={{ background: s.bg, color: s.fg }}>
                  <I />
                  <span>{s.label}</span>
                </a>
              );
            })}
          </div>
        )}
        {handle && (
          <div className="tagrow">
            <span>{v.tagUs} <b>{handle}</b></span>
            <span className="spacer" />
            <button type="button" onClick={copyHandle}>{copied ? v.copied : v.copy}</button>
          </div>
        )}

        {isStamped && (
          <div className="yourstamp">
            <span style={{ fontSize: '1.3rem' }}>✓</span>
            <span>{fmt(v.stamped, { date: shortDate(stampedAt, language) })}{beerCountHere ? ` · ${(beerCountHere === 1 && v.beersCount1) || fmt(v.beersCount, { n: beerCountHere })}` : ''}</span>
          </div>
        )}

        {desc && <p className="desc">{desc}</p>}

        {loaded && beers.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <h2>{v.onTapNow}</h2>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: '.85rem', fontWeight: 700 }}>{(beers.length === 1 && v.beersCount1) || fmt(v.beersCount, { n: beers.length })}</span>
            </div>
            {beers.length > 5 && (
              <Seg value={sort} onChange={setSort} label={v.onTapNow}
                options={[{ value: 'popular', label: v.popular }, { value: 'new', label: v.newest }, { value: 'style', label: v.byStyle }]} />
            )}
            <div className="beerlist card" style={{ marginTop: 8 }}>
              {sorted.slice(0, 5).map((b) => <BeerRow key={b.id} beer={b} />)}
            </div>
            {beers.length > 5 && (
              <button type="button" className="btn plain block" style={{ marginTop: 10, fontSize: '1rem', boxShadow: 'none' }} onClick={() => setShowMenu(true)}>
                {fmt(v.seeAllBeers, { n: beers.length })} →
              </button>
            )}
          </section>
        )}

        {loaded && beers.length === 0 && (
          <section>
            <h2 style={{ marginBottom: 4 }}>{recent.length ? v.recentlyHere : v.onTapNow}</h2>
            {recent.length ? (
              <>
                <p style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.85)', marginBottom: 6 }}>{v.recentNote}</p>
                <div className="beerlist card">
                  {recent.slice(0, 5).map((b) => <BeerRow key={b.name} beer={b} />)}
                </div>
              </>
            ) : (
              <p className="desc">{v.noBeersYet}</p>
            )}
          </section>
        )}

        {myEvents.length > 0 && (
          <section style={{ display: 'grid', gap: 8 }}>
            <h2>{v.comingUp}</h2>
            {myEvents.slice(0, 3).map((e) => (
              <button key={e.id} type="button" className="event" onClick={() => setOpenEvent(e)}>
                <span className="when">{shortDate(e.startsAt, language)}, {new Date(e.startsAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })}</span>
                <span className="t">{localized(e.title, language)}</span>
                <span className="more">{v.moreInfo} →</span>
              </button>
            ))}
          </section>
        )}
      </div>

      {!st.tempClosed && (
        <div className="sticky">
          <div className="inner">
            <button type="button" className="btn block" onClick={onCheckIn}>
              {isStamped ? v.logAnother : v.checkInHere}
            </button>
          </div>
        </div>
      )}

      {openEvent && <EventSheet event={openEvent} brewery={brewery} language={language} onClose={() => setOpenEvent(null)} />}

      {showMenu && (
        <Sheet onClose={() => setShowMenu(false)} label={v.fullMenu}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h2 className="display" style={{ fontSize: '1.6rem', color: 'var(--red)' }}>{v.fullMenu}</h2>
            <span style={{ flex: 1 }} />
            <button type="button" className="round-btn" onClick={() => setShowMenu(false)} aria-label={v.close}>✕</button>
          </div>
          {STYLE_GROUPS.map((g) => {
            const list = beers.filter((b) => beerLook(b.style, b.name).group === g);
            if (!list.length) return null;
            return (
              <div key={g} className="v2-brewery" style={{ minHeight: 0, padding: 0, background: 'transparent' }}>
                <div className="eyebrow" style={{ color: 'var(--muted)', marginTop: 6 }}>{v[g]} · {list.length}</div>
                <div className="beerlist">{list.map((b) => <BeerRow key={b.id} beer={b} />)}</div>
              </div>
            );
          })}
        </Sheet>
      )}
    </div>
  );
}
