import { useEffect, useMemo, useState } from 'react';
import { getLeaderboard } from '../lib/api';
import { useV, fmt, shortDate, monthName } from './i18n';
import { Seg, Icon } from './ui';
import { useNow } from './Home';
import { beerLook, formatClock, prettyBoardTime, stampLabel } from './util';

const stars = (n) => '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n));

function Passport({ breweries, stamps, stampDates, language }) {
  const ordered = [...breweries].sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));
  return (
    <div className="v2-passport">
      {ordered.map((b) => {
        const got = stamps.includes(b.id);
        return (
          <div key={b.id} className={`pstamp ${got ? 'got' : 'empty'}`} aria-label={`${b.name}${got ? ' ✓' : ''}`}>
            <span>
              {stampLabel(b.name)}
              {got && stampDates?.[b.id] && <small>{shortDate(stampDates[b.id], language)}</small>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StampsView({ breweries, stamps, stampDates, timerStart, timerEnd, hatClaimed, language, onShare, firstPlace, onClaimHat }) {
  const v = useV(language);
  const running = !!timerStart && !timerEnd;
  const now = useNow(1000, running);
  const total = breweries.length || 8;
  const count = stamps.filter((id) => breweries.some((b) => b.id === id)).length;
  const ms = timerStart ? (timerEnd || now) - timerStart : null;
  return (
    <>
      <div className="v2-clock">
        <div className="row eyebrow" style={{ color: 'var(--yellow)' }}>
          <span>{v.trailClock}</span><span className="spacer" />
          {running && <span style={{ color: '#fff', letterSpacing: 0, fontWeight: 600 }}>● {v.running}</span>}
        </div>
        <div className="t">{ms != null ? formatClock(ms) : '--:--:--'}</div>
        <div style={{ fontSize: '.8rem', opacity: .9, marginTop: 4 }}>
          {!timerStart ? v.clockStarts
            : timerEnd ? fmt(v.finishedIn, { date: shortDate(timerEnd, language) })
            : fmt(v.startedAt, { date: shortDate(timerStart, language), place: firstPlace || '' })}
        </div>
      </div>
      <Passport breweries={breweries} stamps={stamps} stampDates={stampDates} language={language} />
      <div className="v2-hatrow">
        <Icon.cap />
        <b>{v.freeHat}</b>
        <span className="spacer" />
        <span style={{ fontSize: '.9rem' }}>{hatClaimed ? '✓' : count >= total ? v.hatReady : fmt(v.toGo, { n: total - count })}</span>
      </div>
      {!hatClaimed && count >= total && <button type="button" className="btn block" onClick={onClaimHat}>{v.claimHat}</button>}
      {count > 0 && <button type="button" className="btn block" onClick={onShare}>{v.shareCard}</button>}
    </>
  );
}

function BeersView({ breweries, beers, language }) {
  const v = useV(language);
  const [closed, setClosed] = useState({});
  const groups = useMemo(() => {
    const order = [...breweries].sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));
    const map = new Map();
    for (const beer of beers) {
      const key = beer.breweryId || beer.breweryName;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(beer);
    }
    const out = [];
    for (const b of order) if (map.has(b.id)) { out.push({ brewery: b, list: map.get(b.id) }); map.delete(b.id); }
    for (const [key, list] of map) out.push({ brewery: { id: key, name: list[0].breweryName || '—' }, list });
    for (const g of out) g.list.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    return out;
  }, [breweries, beers]);

  const rated = beers.filter((b) => b.rating);
  const avg = rated.length ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1) : '—';
  const styleCounts = {};
  for (const b of beers) { const g = beerLook(b.style, b.name).group; styleCounts[g] = (styleCounts[g] || 0) + 1; }
  const top = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  if (!beers.length) return <p style={{ fontWeight: 600 }}>{v.noBeersLogged}</p>;

  return (
    <>
      <div className="v2-stats">
        <div><b>{beers.length}</b><span>{v.beersLabel}</span></div>
        <div><b>{groups.length}</b><span>{v.breweriesLabel}</span></div>
        <div><b>{avg}</b><span>{v.avgLabel}</span></div>
        <div><b style={{ fontSize: top && v[top]?.length > 5 ? '1rem' : undefined }}>{top ? v[top] : '—'}</b><span>{v.topStyleLabel}</span></div>
      </div>
      {groups.map(({ brewery, list }) => {
        const isClosed = closed[brewery.id];
        const a = list.filter((x) => x.rating);
        const bAvg = a.length ? (a.reduce((s, x) => s + x.rating, 0) / a.length).toFixed(1) : '—';
        return (
          <div key={brewery.id} className="v2-brewlog">
            <button type="button" className="head" aria-expanded={!isClosed} onClick={() => setClosed((c) => ({ ...c, [brewery.id]: !c[brewery.id] }))}>
              <span className="mini">{stampLabel(brewery.name).slice(0, 6)}</span>
              <span style={{ minWidth: 0 }}>
                <b style={{ display: 'block' }}>{brewery.name}</b>
                <span style={{ fontSize: '.78rem', opacity: .85 }}>{fmt(v.visits, { n: list.length, x: bAvg })}</span>
              </span>
              <span className="spacer" />
              <span aria-hidden="true">{isClosed ? '▸' : '▾'}</span>
            </button>
            {!isClosed && list.map((beer) => {
              const look = beerLook(beer.style, beer.name);
              return (
                <div key={beer.id} className="beer">
                  <div className="top">
                    <i className="glass" style={{ background: look.color }} />
                    <span className="n">{beer.name}</span>
                    <span className="stars" aria-label={`${beer.rating} / 5`}>{stars(beer.rating || 0)}</span>
                  </div>
                  {beer.createdAt && <div className="meta">{shortDate(beer.createdAt, language)}</div>}
                  {beer.notes && <div className="review">{beer.notes}</div>}
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

function RankingView({ timerStart, timerEnd, language, userId }) {
  const v = useV(language);
  const [board, setBoard] = useState('fastest');
  const [rows, setRows] = useState(null);
  const running = !!timerStart && !timerEnd;
  const now = useNow(1000, running);

  useEffect(() => {
    let alive = true;
    setRows(null);
    getLeaderboard(undefined, board).then((res) => { if (alive) setRows(res?.ok ? res.leaderboard || [] : []); }).catch(() => alive && setRows([]));
    return () => { alive = false; };
  }, [board]);

  const myMs = timerStart ? (timerEnd || now) - timerStart : null;
  const wouldRank = rows && myMs != null ? rows.filter((r) => (r.completionTimeMs ?? Infinity) < myMs).length + 1 : null;
  const myRow = rows?.findIndex((r) => r.userId && r.userId === userId);

  return (
    <>
      <Seg value={board} onChange={setBoard} label={v.ranking}
        options={[{ value: 'fastest', label: v.fastestTrail }, { value: 'month', label: fmt(v.mostStamps, { month: monthName(language) }) }]} />
      {rows === null && <p>{v.loading}</p>}
      {rows && rows.length === 0 && <p style={{ fontWeight: 600 }}>{board === 'fastest' ? v.boardEmpty : v.monthEmpty}</p>}
      {rows && rows.length > 0 && (
        <div className="v2-board">
          {rows.slice(0, 20).map((r, i) => (
            <div key={`${r.userId || r.participantId}-${i}`} className={`r${i > 2 ? ' dim' : ''}${i === myRow ? ' me' : ''}`}>
              <span className="rank">{i + 1}</span>
              <span className="who">{r.displayName || r.name}</span>
              <span className="time">{board === 'fastest' ? prettyBoardTime(r) : fmt(v.stampsN, { n: r.stamps })}</span>
            </div>
          ))}
        </div>
      )}
      {board === 'fastest' && myMs != null && (
        <div className="v2-you">
          <div>
            <div className="eyebrow" style={{ fontSize: '.64rem' }}>{running ? v.stillRunning : fmt(v.yourBest, { n: myRow >= 0 ? myRow + 1 : wouldRank || '—' })}</div>
            <div className="t">{formatClock(myMs, !running ? false : true)}</div>
          </div>
          <span className="spacer" />
          {running && wouldRank && <span style={{ fontSize: '.8rem', fontWeight: 700, textAlign: 'right' }}>{fmt(v.finishToRank, { n: wouldRank })}</span>}
        </div>
      )}
    </>
  );
}

export default function MyCard({ tab, setTab, user, breweries, stamps, stampDates, beers, timerStart, timerEnd, hatClaimed, language, onSignIn, onShare, onLoadBeers, onClaimHat }) {
  const v = useV(language);
  useEffect(() => { if (tab === 'beers' && user) onLoadBeers?.(); }, [tab, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const firstId = stampDates ? Object.entries(stampDates).sort((a, b) => String(a[1]).localeCompare(String(b[1])))[0]?.[0] : null;
  const firstPlace = breweries.find((b) => b.id === firstId)?.name;

  return (
    <div className="v2-screen">
      <h1 className="display" style={{ fontSize: '2.2rem' }}>{v.myCard}</h1>
      {!user ? (
        <>
          <p style={{ fontWeight: 600 }}>{v.signInForCard}</p>
          <button type="button" className="btn block" onClick={onSignIn}>{v.signIn}</button>
        </>
      ) : (
        <>
          <Seg value={tab} onChange={setTab} label={v.myCard}
            options={[{ value: 'stamps', label: v.stamps }, { value: 'beers', label: `${v.beers}${beers.length ? ` ${beers.length}` : ''}` }, { value: 'ranking', label: v.ranking }]} />
          {tab === 'stamps' && (
            <StampsView breweries={breweries} stamps={stamps} stampDates={stampDates} timerStart={timerStart} timerEnd={timerEnd}
              hatClaimed={hatClaimed} language={language} onShare={onShare} firstPlace={firstPlace} onClaimHat={onClaimHat} />
          )}
          {tab === 'beers' && <BeersView breweries={breweries} beers={beers} language={language} />}
          {tab === 'ranking' && <RankingView timerStart={timerStart} timerEnd={timerEnd} language={language} userId={user?.id} />}
        </>
      )}
    </div>
  );
}
