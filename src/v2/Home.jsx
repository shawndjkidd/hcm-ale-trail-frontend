import { useEffect, useMemo, useState } from 'react';
import { useV, fmt, shortDate, weekdayName } from './i18n';
import { TopBar, Pints, Icon } from './ui';
import {
  openStatus, formatClose, formatClock, prettyBoardTime, districtLabel, localized,
  distanceKm, formatKm, placeGradient, logoFor, photoFor, stencilFor,
} from './util';

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
  const photo = photoFor(brewery) ? `url("${photoFor(brewery)}") center/cover` : placeGradient(brewery.id);
  const date = isStamped ? shortDate(stampedAt, language) : '';
  return (
    <button type="button" className={`v2-bcard is-${state}`} onClick={() => onOpen(brewery)}>
      <span className="photo" style={{ background: photo }}>
        <span className="badge">{isStamped ? '✓' : index + 1}</span>
        {isStamped && <span className="stampmark">{date}</span>}
      </span>
      <span className="body">
        {stencilFor(brewery) && <img className="stencil" src={stencilFor(brewery)} alt="" />}
        <span className="name">{brewery.name}</span>
        <span className="sub">
          {districtLabel(brewery.district, language)}
          {km != null ? ` · ${formatKm(km)}` : ''}
          {isStamped && date ? ` · ${date}` : ''}
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

export function SideQuestCard({ quest, language, onOpen }) {
  const v = useV(language);
  const st = quest.operating_hours ? openStatus(quest) : { unknown: true };
  const kind = [quest.kind, quest.district].filter(Boolean).join(' · ').toUpperCase();
  const photo = quest.photo_url ? `url("${quest.photo_url}") center/cover` : placeGradient(`sq-${quest.id}`);
  const ends = quest.ends_at ? fmt(v.endsOn, { d: shortDate(quest.ends_at, language) }).toUpperCase() : '';
  return (
    <button type="button" className="v2-sqcard" onClick={() => onOpen(quest)}>
      <span className="photo" style={{ background: photo }} />
      <span className="body">
        <span className="kind">
          <span>{[kind, ends].filter(Boolean).join(' · ') || v.sideQuest}</span>
          <span className="spacer" />
          {st.open && <span className="tag open" style={{ fontSize: '.6rem' }}>{v.open}</span>}
        </span>
        <span className="name" style={{ display: 'block' }}>{localized(quest.title, language)}</span>
        {quest.reward && <span className="reward">{quest.reward}</span>}
      </span>
    </button>
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
  breweries, stamps, stampDates, timerStart, timerEnd, events, sideQuests, boardTop, user, hatClaimed, cardRound,
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
            {hatClaimed ? fmt(v.hatClaimedLine, { n: cardRound + 1 })
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
        <button type="button" className="v2-tonight" onClick={() => onOpenEvents(tonight[0])}>
          <span className="when">{v.tonight}<br />{eventWhen(tonight[0], language, v).bottom}</span>
          <span className="what">
            <b>{localized(tonight[0].title, language)}</b>
            {tonight[0].breweryName}
            {tonight.length > 1 ? ` · ${fmt(v.moreTonight, { n: tonight.length - 1 })}` : ''}
          </span>
          <b aria-hidden="true">›</b>
        </button>
      )}

      <div style={{ display: 'grid', gap: 14, marginTop: 4 }}>
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

      {sideQuests?.length > 0 && (
        <>
          <div className="v2-section-head">
            <h2>{v.sideQuests}</h2>
            <span className="spacer" />
            <span className="tag light" style={{ fontSize: '.64rem' }}>{v.bonusNote}</span>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {sideQuests.map((q) => <SideQuestCard key={q.id} quest={q} language={language} onOpen={onOpenQuest} />)}
          </div>
        </>
      )}

      {upcoming.length > 0 && (
        <>
          <div className="v2-section-head">
            <h2>{v.whatsOn}</h2>
            <span className="spacer" />
            <button type="button" className="link-btn" style={{ color: '#fff', fontSize: '.85rem' }} onClick={() => onOpenEvents()}>{v.allEvents}</button>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {upcoming.slice(0, 4).map((ev) => (
              <button key={ev.id} type="button" className={`v2-evrow${isTonight(ev) ? ' is-tonight' : ''}`} onClick={() => onOpenEvents(ev)}>
                {(() => { const w = eventWhen(ev, language, v); return <span className="when"><b>{w.top}</b>{w.bottom}</span>; })()}
                <span className="what"><b>{localized(ev.title, language)}</b>{ev.breweryName || ''}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="v2-follow">
        <h3>{v.followTrail.replace(/:$/, '')}</h3>
        <div className="v2-links" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <a href="https://www.instagram.com/hcm.aletrail/" target="_blank" rel="noreferrer" style={{ background: '#E1306C', color: '#fff' }}><Icon.instagram /><span>Instagram</span></a>
          <a href="https://www.facebook.com/hcmaletrail" target="_blank" rel="noreferrer" style={{ background: '#1877F2', color: '#fff' }}><Icon.facebook /><span>Facebook</span></a>
          <a href="https://www.hochiminhaletrail.com/" target="_blank" rel="noreferrer" style={{ background: 'var(--yellow)', color: 'var(--ink)' }}><Icon.globe /><span>{v.website}</span></a>
        </div>
      </div>
    </div>
  );
}
