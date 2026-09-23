import { useState } from 'react';
import { useV, shortDate } from './i18n';
import { Seg } from './ui';
import { isTonight } from './Home';
import { localized, logoFor } from './util';
import EventSheet, { calendarLink } from './EventSheet';

export default function Events({ events, breweries, language, onBack, onOpenBrewery }) {
  const v = useV(language);
  const [filter, setFilter] = useState('all');
  const [openEvent, setOpenEvent] = useState(null);
  const now = Date.now();
  const weekEnd = now + 7 * 24 * 3600 * 1000;

  const upcoming = (events || [])
    .filter((e) => new Date(e.endsAt || e.startsAt).getTime() >= now)
    .filter((e) => filter === 'all' || (filter === 'new' ? e.category === 'new_release' : e.category !== 'new_release'))
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

  const groups = [
    { key: 'tonight', label: v.today, list: upcoming.filter(isTonight) },
    { key: 'week', label: v.thisWeek, list: upcoming.filter((e) => !isTonight(e) && new Date(e.startsAt).getTime() < weekEnd) },
    { key: 'later', label: v.later, list: upcoming.filter((e) => !isTonight(e) && new Date(e.startsAt).getTime() >= weekEnd) },
  ].filter((g) => g.list.length);

  const breweryOf = (e) => breweries.find((b) => b.id === e.breweryId || b.name === e.breweryName);

  return (
    <div className="v2-screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button type="button" className="round-btn" onClick={onBack} aria-label={v.back}>←</button>
        <h1 className="display" style={{ fontSize: '2rem' }}>{v.whatsOnTitle}</h1>
      </div>
      <Seg value={filter} onChange={setFilter} label={v.whatsOnTitle}
        options={[{ value: 'all', label: v.all }, { value: 'events', label: v.filterEvents }, { value: 'new', label: v.filterNew }]} />

      {groups.length === 0 && (
        <div style={{ background: 'var(--ink)', padding: 16 }}>
          <b style={{ display: 'block', fontSize: '1.1rem' }}>{v.nothingOn}</b>
          <span style={{ opacity: .9 }}>{v.nothingOnSub}</span>
        </div>
      )}

      {groups.map((g) => (
        <section key={g.key} style={{ display: 'grid', gap: 8 }}>
          <div className="v2-section-head"><h2>{g.label}</h2></div>
          {g.list.map((e) => {
            const b = breweryOf(e);
            const title = localized(e.title, language);
            const time = new Date(e.startsAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
            const logo = b ? logoFor(b) : null;
            return (
              <div key={e.id} className={`v2-evrow${g.key === 'tonight' ? ' is-tonight' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <button type="button" onClick={() => setOpenEvent(e)} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'none', border: 0, padding: 0, textAlign: 'left', color: 'inherit' }}>
                  <span className="logo">{logo ? <img src={logo} alt="" /> : (e.breweryName || 'A')[0]}</span>
                  <span className="what">
                    <span style={{ fontSize: '.7rem', fontWeight: 800, letterSpacing: '.04em' }}>
                      {g.key === 'tonight' ? time : `${shortDate(e.startsAt, language).toUpperCase()} · ${time}`} · {(e.breweryName || 'HCM Ale Trail').toUpperCase()}
                      {e.category === 'new_release' && <span className="tag" style={{ marginLeft: 6, background: 'var(--jade)', color: '#fff', borderColor: 'var(--jade)', padding: '0 4px' }}>{v.newBeerTag}</span>}
                    </span>
                    <b>{title}</b>
                  </span>
                </button>
                {localized(e.description, language) && <p style={{ fontSize: '.85rem', marginTop: 4 }}>{localized(e.description, language)}</p>}
                <div style={{ display: 'flex', gap: 14, fontSize: '.82rem', fontWeight: 700, marginTop: 6 }}>
                  <a href={calendarLink(e, title)} target="_blank" rel="noreferrer">{v.addCalendar}</a>
                  {e.link && <a href={e.link} target="_blank" rel="noreferrer">{v.moreInfo} ↗</a>}
                </div>
              </div>
            );
          })}
        </section>
      ))}
      {openEvent && <EventSheet event={openEvent} brewery={breweryOf(openEvent)} language={language} onClose={() => setOpenEvent(null)} onOpenBrewery={onOpenBrewery} />}
    </div>
  );
}
