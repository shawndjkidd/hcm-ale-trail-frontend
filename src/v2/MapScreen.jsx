import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, AttributionControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useV } from './i18n';
import { statusText } from './Home';
import { openStatus, districtLabel, distanceKm, formatKm, photoFor, logoFor, placeGradient, safeHref } from './util';

const pinIcon = (cls, label) => L.divIcon({
  className: '',
  html: `<div class="v2-pin ${cls}"><span>${label}</span></div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});
const meIcon = L.divIcon({ className: '', html: '<div class="v2-pin me"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });

function FitAll({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return undefined;
    // Wait for the full-screen container to have its final size, then zoom to fit
    const t = setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(L.latLngBounds(points), { paddingTopLeft: [30, 80], paddingBottomRight: [30, 110], maxZoom: 16 });
    }, 120);
    return () => clearTimeout(t);
  }, [points.length]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function MapScreen({ breweries, sideQuests = [], stamps, language, here, requestLocation, onOpenBrewery, onOpenQuest }) {
  const v = useV(language);
  const [openOnly, setOpenOnly] = useState(false);
  const [notStamped, setNotStamped] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => { requestLocation?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const items = useMemo(() => {
    const sorted = [...breweries].filter((b) => b.latitude != null && b.status !== 'inactive')
      .sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));
    return sorted.map((b, i) => {
      const st = openStatus(b);
      const stamped = stamps.includes(b.id);
      return { kind: 'brewery', item: b, n: i + 1, st, stamped, state: stamped ? 'stamped' : st.open ? 'open' : 'closed' };
    });
  }, [breweries, stamps]);

  const quests = sideQuests.filter((q) => q.latitude != null);
  const visible = items.filter((x) => (!openOnly || x.st.open) && (!notStamped || !x.stamped));
  const points = items.map((x) => [x.item.latitude, x.item.longitude]);

  const sel = selected;
  const km = sel && here ? distanceKm(here, { lat: sel.item.latitude, lng: sel.item.longitude }) : null;
  const directions = sel ? (safeHref(sel.item.maps_url) || `https://www.google.com/maps/dir/?api=1&destination=${sel.item.latitude},${sel.item.longitude}`) : null;

  return (
    <div className="v2-map">
      <MapContainer center={[10.778, 106.695]} zoom={14} minZoom={12} maxZoom={18} zoomControl={false} attributionControl={false} style={{ height: '100%' }}>
        <AttributionControl position="topright" prefix={false} />
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
        <FitAll points={points} />
        {visible.map((x) => (
          <Marker key={x.item.id} position={[x.item.latitude, x.item.longitude]}
            icon={pinIcon(x.state, x.stamped ? '✓' : x.n)}
            eventHandlers={{ click: () => setSelected(x) }} />
        ))}
        {quests.map((q) => (
          <Marker key={q.id} position={[q.latitude, q.longitude]} icon={pinIcon('quest', '★')}
            eventHandlers={{ click: () => onOpenQuest(q) }} />
        ))}
        {here && <Marker position={[here.lat, here.lng]} icon={meIcon} interactive={false} />}
      </MapContainer>

      <div className="overlay-top">
        <button type="button" aria-pressed={openOnly} onClick={() => setOpenOnly((s) => !s)}>{v.openNow}</button>
        <button type="button" aria-pressed={notStamped} onClick={() => setNotStamped((s) => !s)}>{v.notStamped}</button>
      </div>

      {sel && (
        <div className="card" role="dialog" aria-label={sel.item.name}>
          <span className="photo" style={{ background: photoFor(sel.item) ? `url("${photoFor(sel.item)}") center/cover` : placeGradient(sel.item.id) }}>
            <span className={`badge ${sel.state}`}>{sel.stamped ? '✓' : sel.n}</span>
            {logoFor(sel.item) && <img className="logo" src={logoFor(sel.item)} alt="" />}
          </span>
          <span className="body">
            <span className="toprow">
              <span className="name">{sel.item.name}</span>
              <button type="button" className="x" onClick={() => setSelected(null)} aria-label={v.close}>✕</button>
            </span>
            <span className="sub">{[districtLabel(sel.item.district, language), km != null ? formatKm(km) : null].filter(Boolean).join(' · ')}</span>
            <span>
              {sel.stamped ? <span className="tag done-map">{v.completedTag}</span>
                : <span className={`tag ${sel.st.open ? 'open' : 'closed-map'}`}>{statusText(sel.st, v, language)}</span>}
            </span>
            <span className="actions">
              <a className="mbtn light" href={directions} target="_blank" rel="noreferrer">{v.directions}</a>
              <button type="button" className="mbtn" onClick={() => onOpenBrewery(sel.item)}>{v.view} →</button>
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

