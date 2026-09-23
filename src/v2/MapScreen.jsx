import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, AttributionControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useV } from './i18n';
import { statusText } from './Home';
import { openStatus, districtLabel, distanceKm, formatKm } from './util';

const pinIcon = (cls, label) => L.divIcon({
  className: '',
  html: `<div class="v2-pin ${cls}"><span>${label}</span></div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
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
  const directions = sel ? (sel.item.maps_url || `https://www.google.com/maps/dir/?api=1&destination=${sel.item.latitude},${sel.item.longitude}`) : null;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <b style={{ fontSize: '1.05rem', flex: 1 }}>{sel.item.name}</b>
            <button type="button" className="link-btn" onClick={() => setSelected(null)} aria-label={v.close}>✕</button>
          </div>
          <div style={{ fontSize: '.85rem', color: 'var(--muted)' }}>
            {[districtLabel(sel.item.district, language), statusText(sel.st, v, language), km != null ? formatKm(km) : null].filter(Boolean).join(' · ')}
          </div>
          <div className="actions">
            <a className="btn plain" style={{ fontSize: '.95rem', padding: '8px 12px', boxShadow: 'none' }} href={directions} target="_blank" rel="noreferrer">{v.directions}</a>
            <button type="button" className="btn" style={{ fontSize: '.95rem', padding: '8px 16px' }} onClick={() => onOpenBrewery(sel.item)}>{v.view}</button>
          </div>
        </div>
      )}
    </div>
  );
}

