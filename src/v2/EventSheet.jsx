import { useV, weekdayName } from './i18n';
import { Sheet, Icon } from './ui';
import { localized, districtLabel, safeHref } from './util';

const TZ = 'Asia/Ho_Chi_Minh';
const clock = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
const saigonDay = (iso) => new Date(new Date(iso).toLocaleString('en-US', { timeZone: TZ }));

export function calendarLink(ev, title) {
  const f = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = ev.endsAt || new Date(new Date(ev.startsAt).getTime() + 2 * 3600 * 1000).toISOString();
  const p = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${f(ev.startsAt)}/${f(end)}`, details: ev.breweryName || 'HCM Ale Trail' });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

// Full event details in a bottom sheet. `brewery` is optional (for directions / district).
export default function EventSheet({ event: e, brewery, language, onClose, onOpenBrewery }) {
  const v = useV(language);
  const title = localized(e.title, language);
  const desc = localized(e.description, language);
  const entry = e.entry ? localized(e.entry, language) : null;
  const highlights = (e.highlights || []).map((h) => localized(h, language)).filter(Boolean);
  const d = saigonDay(e.startsAt);
  const month = new Date(e.startsAt).toLocaleDateString('en-GB', { month: 'short', timeZone: TZ }).toUpperCase();
  const isNew = e.category === 'new_release';
  const when = `${weekdayName(d.getDay(), language)} ${d.getDate()} ${month} · ${clock(e.startsAt)}${e.endsAt ? `–${clock(e.endsAt)}` : ''}`;
  const where = [e.breweryName || brewery?.name, brewery?.district ? districtLabel(brewery.district, language) : null].filter(Boolean).join(' · ');
  const directions = brewery ? (safeHref(brewery.maps_url) || (brewery.latitude != null ? `https://www.google.com/maps/dir/?api=1&destination=${brewery.latitude},${brewery.longitude}` : null)) : null;

  return (
    <Sheet onClose={onClose} label={title}>
      <div className="v2-evsheet">
        <div className="top">
          <span className={`kind${isNew ? ' new' : ''}`}>{isNew ? v.newBeerTag : v.eventTag}</span>
          <span style={{ flex: 1 }} />
          <button type="button" className="x" onClick={onClose} aria-label={v.close}>✕</button>
        </div>
        <div className="head">
          <div className="dateblock"><b>{d.getDate()}</b><span>{month}</span></div>
          <h2>{title}</h2>
        </div>
        <dl className="facts">
          <div><dt>{v.evWhen}</dt><dd>{when}</dd></div>
          {where && <div><dt>{v.evWhere}</dt><dd>{where}</dd></div>}
          {entry && <div><dt>{v.evEntry}</dt><dd>{entry}</dd></div>}
        </dl>
        {desc && <p className="desc">{desc}</p>}
        {highlights.length > 0 && (
          <div className="good">
            <div className="eyebrow">{v.evGood}</div>
            <ul>{highlights.map((h) => <li key={h}>{h}</li>)}</ul>
          </div>
        )}
        <div className="actions">
          <a className="act yellow" href={calendarLink(e, title)} target="_blank" rel="noreferrer">{v.addToCalendar}</a>
          {directions && <a className="act white" href={directions} target="_blank" rel="noreferrer"><Icon.pin />{v.directions}</a>}
        </div>
        {(safeHref(e.link) || onOpenBrewery) && (
          <div className="links">
            {onOpenBrewery && brewery && <button type="button" onClick={() => { onClose(); onOpenBrewery(brewery); }}>{v.viewBrewery} →</button>}
            {safeHref(e.link) && <a href={safeHref(e.link)} target="_blank" rel="noreferrer">{v.moreInfo} ↗</a>}
          </div>
        )}
      </div>
    </Sheet>
  );
}
