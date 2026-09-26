import { useEffect, useMemo, useRef, useState } from 'react';
import { useV, fmt, shortDate, weekdayName } from './i18n';
import { TopBar, Pints, Icon } from './ui';
import SmplPint from './SmplPint';
import {
  openStatus, formatClose, formatClock, prettyBoardTime, districtLabel, localized,
  distanceKm, formatKm, placeGradient, logoFor, photoFor, stencilFor, safeImageUrl, demoSplit } from './util';

export function useNow(intervalMs = 1000, active = true) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, active]);
  return now;
}

export function statusText(st, v, language) {
  if (st.tempClosed) return v.tempClosed;
  if (st.unknown) return v.hoursSoon;
  if (st.open) return fmt(v.openTill, { t: formatClose(st.closesAt, v) });
  if (st.opensDay === 0) return fmt(v.opensAt, { t: st.opensAt });
  return fmt(v.opensDayAt, { day: weekdayName(st.opensWeekday, language), t: st.opensAt });
}

export function BreweryCard({ brewery, index, stampedAt, language, onOpen, here }) {
  const v = useV(language);
  const st = openStatus(brewery);
  const isStamped = !!stampedAt;
  const state = isStamped ? 'stamped' : st.open ? 'open' : 'closed';
  const km = here && brewery.latitude != null ? distanceKm(here, { lat: brewery.latitude, lng: brewery.longitude }) : null;
  const img = photoFor(brewery);
  const photo = img ? `url("${img}") center/cover` : placeGradient(brewery.id);
  // A venue with its own photo gets the big card; the rest stay compact until they add one.
  if (img) {
    const logo = logoFor(brewery);
    return (
      <button type="button" data-id={brewery.id} className={`v2-bcard is-big is-${state}`} onClick={() => onOpen(brewery)}>
        <span className="photo" style={{ background: photo }}>
          <span className="badge">{isStamped ? '✓' : index + 1}</span>
          {!isStamped && <span className="corner"><span className={`tag ${st.open ? 'open' : 'closed'}`}>{statusText(st, v, language)}</span></span>}
          {isStamped && <span className="bigstamp">{v.completedTag}</span>}
          {logo && <img className="logo" src={logo} alt="" loading="lazy" />}
        </span>
        <span className="body">
          <span className="name">{brewery.name}</span>
          <span className="sub">{[districtLabel(brewery.district, language), brewery.address && String(brewery.address).split(',')[0]].filter(Boolean).join(' · ')}</span>
          <span className="foot">
            <span className={isStamped ? 'ok' : ''}>
              {isStamped ? `✓ ${fmt(v.stamped, { date: shortDate(stampedAt, language) })}` : km != null ? formatKm(km) : ''}
            </span>
            <span className="go">{v.moreInfo} ›</span>
          </span>
        </span>
      </button>
    );
  }
  return (
    <button type="button" data-id={brewery.id} className={`v2-bcard is-${state}`} onClick={() => onOpen(brewery)}>
      <span className="photo" style={{ background: photo }}>
        <span className="badge">{isStamped ? '✓' : index + 1}</span>
      </span>
      <span className="body">
        {stencilFor(brewery) && <img className="stencil" src={stencilFor(brewery)} alt="" />}
        <span className="name">{brewery.name}</span>
        <span className="sub">
          {districtLabel(brewery.district, language)}
          {km != null ? ` · ${formatKm(km)}` : ''}
        </span>
        <span className="status">
          {isStamped ? (
            <span className="tag done">{v.completedTag}</span>
          ) : (
            <span className={`tag ${st.open ? 'open' : 'closed'}`}>{statusText(st, v, language)}</span>
          )}
        </span>
      </span>
    </button>
  );
}

export function SideQuestCard({ quest, language, onOpen, claimed }) {
  const v = useV(language);
  const st = quest.operating_hours ? openStatus(quest) : { unknown: true };
  const kind = [quest.kind, quest.district].filter(Boolean).join(' · ').toUpperCase();
  const img = safeImageUrl(quest.photo_url);
  const photo = img ? `url("${img}") center/cover` : placeGradient(`sq-${quest.id}`);
  const ends = quest.ends_at ? fmt(v.endsOn, { d: shortDate(quest.ends_at, language) }).toUpperCase() : '';
  const title = demoSplit(localized(quest.title, language));
  const reward = demoSplit(quest.reward);
  const blurb = demoSplit(localized(quest.description, language)).text;
  return (
    <button type="button" className="v2-sq2" onClick={() => onOpen(quest)}>
      <span className="photo" style={{ background: photo }}>
        <span className="kind">{[kind, ends].filter(Boolean).join(' · ') || v.sideQuest}</span>
        <span className="state">
          {claimed ? <span className="tag done-dark">✓ {v.claimedQuest}</span> : st.open && <span className="tag open">{v.open}</span>}
        </span>
        {(title.demo || reward.demo) && <span className="tag demo">DEMO</span>}
      </span>
      <span className="body">
        <span className="name">{title.text}</span>
        {blurb && !/^DEMO/i.test(blurb) && <span className="blurb">{blurb}</span>}
        {quest.reward && <span className="reward"><small>{v.yourReward}</small>{reward.text}</span>}
      </span>
    </button>
  );
}

const EVENT_PLACEHOLDER = {
  event: 'https://images.unsplash.com/photo-1778794944415-1656a72993c6?w=1000&q=70&fm=jpg&fit=crop&ar=16:9',
  new: 'https://images.unsplash.com/photo-1777558578003-e65755409d8e?w=1000&q=70&fm=jpg&fit=crop&ar=16:9',
};

// Big swipeable card for What's On: date block, venue logo, event type, title, venue.
function EventCard({ ev, brewery, language, onOpen }) {
  const v = useV(language);
  const tonight = isTonight(ev);
  const d = new Date(ev.startsAt);
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
  const w = eventWhen(ev, language, v);
  const day = d.toLocaleDateString('en-GB', { day: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
  const title = demoSplit(localized(ev.title, language));
  const logo = brewery ? logoFor(brewery) : null;
  const stencil = brewery ? stencilFor(brewery) : null;
  const isNew = ev.category === 'new_release';
  // Event photo: the venue's photo, else a placeholder beer shot, so every card shows a picture.
  const img = safeImageUrl(ev.photo_url) || (brewery && photoFor(brewery)) || (isNew ? EVENT_PLACEHOLDER.new : EVENT_PLACEHOLDER.event);
  return (
    <button type="button" className={`v2-evcard${tonight ? ' is-tonight' : ''}`} onClick={() => onOpen(ev)}>
      <span className={`top${img ? ' has-photo' : ''}`} style={{ background: img ? `url("${img}") center/cover` : placeGradient(ev.breweryId || ev.id) }}>
        {!img && stencil && <span className="stencil" style={{ backgroundImage: `url("${stencil}")` }} />}
        <span className="date">
          {tonight
            ? <><span className="sm">{v.tonight}</span><span className="big">{time}</span></>
            : <><span className="sm">{w.top}</span><span className="big">{day}</span><span className="sm">{w.bottom.replace(/^\d+\s*/, '')} · {time}</span></>}
        </span>
        {title.demo && <span className="tag demo">DEMO</span>}
        {logo && <img className="logo" src={logo} alt="" loading="lazy" />}
      </span>
      <span className="body">
        <span className="cat">{isNew ? v.newBeerTag : v.eventTag}</span>
        <span className="ttl">{title.text}</span>
        <span className="ven">
          <span>{ev.breweryName || ''}</span>
          <span>{brewery ? districtLabel(brewery.district, language) : ''}</span>
        </span>
      </span>
    </button>
  );
}

// Tonight: a flickering neon sign at the top of the home page, with a live countdown.
function TonightNeon({ events, breweries, language, here, onOpen }) {
  const v = useV(language);
  const now = useNow(1000);
  const ev = events[0];
  const b = (breweries || []).find((x) => x.id === ev.breweryId);
  const start = new Date(ev.startsAt).getTime();
  const end = ev.endsAt ? new Date(ev.endsAt).getTime() : start + 4 * 3600e3;
  const ms = start - now;
  const on = ms <= 0 && now < end;
  const h = Math.floor(ms / 3600e3), m = Math.floor((ms % 3600e3) / 60e3), sec = Math.floor((ms % 60e3) / 1e3);
  const pad = (n) => String(Math.max(0, n)).padStart(2, '0');
  const hm = (t) => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
  const title = demoSplit(localized(ev.title, language));
  const logo = b ? logoFor(b) : null;
  const km = here && b?.latitude != null ? distanceKm(here, { lat: b.latitude, lng: b.longitude }) : null;
  return (
    <button type="button" className="v2-neon" onClick={() => onOpen(ev)}>
      {title.demo && <span className="tag demo">DEMO</span>}
      <span className="sign">{v.tonight}</span>
      <span className="sub">{shortDate(ev.startsAt, language).toUpperCase()} · {hm(start)}{events.length > 1 ? ` · ${fmt(v.moreTonight, { n: events.length - 1 })}` : ''}</span>
      <span className="ev">
        {logo && <img src={logo} alt="" />}
        <span>
          <b>{title.text}</b>
          <span>{[ev.breweryName, b && districtLabel(b.district, language), km != null && formatKm(km)].filter(Boolean).join(' · ')}</span>
        </span>
      </span>
      <span className="time">
        <span>{on ? v.onNow : v.startsIn}</span>
        <big>{on ? `${v.tillTime} ${hm(end)}` : `${h}h ${pad(m)}m ${pad(sec)}s`}</big>
      </span>
    </button>
  );
}

// What's On: its own yellow zone with one big card at a time; swipe left/right, dots show where you are.
function EventCarousel({ events, breweries, language, onOpenEvents }) {
  const v = useV(language);
  const rail = useRef(null);
  const [at, setAt] = useState(0);
  const onScroll = () => {
    const el = rail.current;
    if (!el || !el.firstElementChild) return;
    const step = el.firstElementChild.getBoundingClientRect().width + 14;
    setAt(Math.max(0, Math.min(events.length - 1, Math.round(el.scrollLeft / step))));
  };
  const go = (i) => {
    const el = rail.current;
    const card = el?.children?.[i];
    if (card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft - 16, behavior: 'smooth' });
  };
  return (
    <section className="v2-evzone" aria-label={v.whatsOn}>
      <div className="zhead">
        <span className="eyebrow">{v.evEyebrow}</span>
        <div className="row">
          <h2>{v.whatsOn}</h2>
          <button type="button" className="all" onClick={() => onOpenEvents()}>{v.allEvents} ›</button>
        </div>
      </div>
      <div className="v2-carousel" ref={rail} onScroll={onScroll}>
        {events.map((ev) => (
          <EventCard key={ev.id} ev={ev} language={language} onOpen={onOpenEvents}
            brewery={(breweries || []).find((b) => b.id === ev.breweryId)} />
        ))}
      </div>
      {events.length > 1 && (
        <div className="dots">
          <button type="button" className="arrow" aria-label="Previous" disabled={at === 0} onClick={() => go(at - 1)}>‹</button>
          {events.map((ev, i) => (
            <button key={ev.id} type="button" className={`dot${i === at ? ' on' : ''}`} aria-label={`${i + 1} / ${events.length}`} onClick={() => go(i)} />
          ))}
          <button type="button" className="arrow" aria-label="Next" disabled={at === events.length - 1} onClick={() => go(at + 1)}>›</button>
        </div>
      )}
    </section>
  );
}

function eventWhen(ev, language, v) {
  const d = new Date(ev.startsAt);
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
  if (isTonight(ev)) return { top: v.tonight, bottom: time, tonight: true };
  const dow = d.toLocaleDateString(language === 'vn' ? 'vi-VN' : language === 'kr' ? 'ko-KR' : language === 'jp' ? 'ja-JP' : 'en-GB', { weekday: 'short', timeZone: 'Asia/Ho_Chi_Minh' });
  return { top: dow.toUpperCase(), bottom: shortDate(ev.startsAt, language).toUpperCase(), tonight: false };
}

export function isTonight(ev) {
  const key = (x) => new Date(x).toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  return key(ev.startsAt) === key(Date.now());
}

export default function Home({
  breweries, stamps, stampDates, timerStart, timerEnd, events, sideQuests, questClaims, boardTop, user, hatClaimed, cardRound,
  language, setLanguage, nightMode, toggleNightMode, onMenu, onOpenBrewery, onOpenQuest, onOpenEvents, onOpenGuide,
  onOpenBoard, milestone, onDismissMilestone, here, requestLocation, onClaimHat,
}) {
  const v = useV(language);
  const running = !!timerStart && !timerEnd;
  const now = useNow(1000, running);
  const [order, setOrder] = useState('trail');

  const active = breweries.filter((b) => b.status !== 'inactive');
  const total = active.length || 8;
  const count = stamps.filter((id) => active.some((b) => b.id === id)).length;

  const list = useMemo(() => {
    const byTrail = [...active].sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));
    if (order !== 'nearest' || !here) return byTrail.map((b, i) => ({ b, i }));
    return byTrail
      .map((b, i) => ({ b, i, km: b.latitude != null ? distanceKm(here, { lat: b.latitude, lng: b.longitude }) : 999 }))
      .sort((x, y) => {
        const sx = stamps.includes(x.b.id) ? 1 : 0; const sy = stamps.includes(y.b.id) ? 1 : 0;
        if (sx !== sy) return sx - sy;
        const ox = openStatus(x.b).open ? 0 : 1; const oy = openStatus(y.b).open ? 0 : 1;
        if (ox !== oy) return ox - oy;
        return x.km - y.km;
      });
  }, [active, order, here, stamps]);

  const upcoming = (events || []).filter((e) => new Date(e.endsAt || e.startsAt) >= new Date());
  const tonight = upcoming.filter(isTonight);
  const topEntry = boardTop?.[0];

  const clockMs = timerStart ? (timerEnd || now) - timerStart : null;

  return (
    <div className="v2-screen">
      <TopBar language={language} setLanguage={setLanguage} nightMode={nightMode} toggleNightMode={toggleNightMode} onMenu={onMenu} />

      {milestone && (
        <div className="v2-milestone" role="status">
          <span className="n">{milestone.count}/{total}</span>
          <span className="txt"><b>{milestone.title}</b>{milestone.line}</span>
          <button type="button" onClick={onDismissMilestone} aria-label={v.close}>✕</button>
        </div>
      )}

      <section className="v2-stampcard" aria-label={v.beerStamps}>
        <div className="row">
          <div className="title">{v.beerStamps.split(' ').map((w, i) => <span key={i} style={{ display: 'block' }}>{w}</span>)}</div>
          <div className="count num">{count}/{total}</div>
        </div>
        <Pints count={count} total={total} />
        <div className="foot">
          <span>
            {hatClaimed ? v.hatCollectedLine
              : count >= total ? v.hatEarned
              : fmt(v.moreToHat, { n: total - count })}
          </span>
          <span className="spacer" />
          <button type="button" onClick={onOpenGuide}>{v.howItWorks}</button>
        </div>
        {user && count >= total && !hatClaimed && (
          <button type="button" className="btn block" style={{ marginTop: 12 }} onClick={onClaimHat}>{v.claimHat}</button>
        )}
      </section>

      <button type="button" className="v2-clockbar" onClick={onOpenBoard}>
        <span>
          <span className="eyebrow" style={{ color: 'var(--yellow)', display: 'block', fontSize: '.64rem' }}>
            {timerEnd ? v.yourTime : v.yourClock}
          </span>
          <span className="t">{clockMs != null ? formatClock(clockMs) : '--:--:--'}</span>
        </span>
        <span className="right">
          <b>{v.leaderboard} ›</b><br />
          {clockMs == null ? v.clockStarts
            : topEntry ? fmt(v.topTime, { name: topEntry.displayName || topEntry.name, time: prettyBoardTime(topEntry) })
            : v.noFinishers}
        </span>
      </button>

      {tonight.length > 0 && (
        <TonightNeon events={tonight} breweries={breweries} language={language} here={here} onOpen={onOpenEvents} />
      )}

      <section className="v2-trailzone" aria-label={v.theTrail}>
      <div className="zhead">
        <span className="eyebrow">{v.theTrail}</span>
        <h2>{fmt(v.trailTitle, { n: list.length })}</h2>
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        {list.map(({ b, i }) => (
          <BreweryCard
            key={b.id}
            brewery={b}
            index={i}
            stampedAt={stamps.includes(b.id) ? (stampDates?.[b.id] || new Date().toISOString()) : null}
            language={language}
            onOpen={onOpenBrewery}
            here={here}
          />
        ))}
      </div>
      </section>

      {sideQuests?.length > 0 && (
        <section className="v2-sqzone" aria-label={v.sideQuests}>
          <div className="zhead">
            <span className="eyebrow">{v.sqEyebrow}</span>
            <h2>{v.sideQuests}</h2>
            <p>{v.sqExplain}</p>
            <span className="tag bonus">{v.bonusNote}</span>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            {sideQuests.map((q) => <SideQuestCard key={q.id} quest={q} language={language} onOpen={onOpenQuest} claimed={questClaims?.includes(q.id)} />)}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <EventCarousel events={upcoming.slice(0, 8)} breweries={breweries} language={language} onOpenEvents={onOpenEvents} />
      )}

      <SmplPint language={language} />
    </div>
  );
}
