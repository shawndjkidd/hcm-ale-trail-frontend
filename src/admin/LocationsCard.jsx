import { useEffect, useState } from 'react';
import { getBreweryLocations, addBreweryLocation, removeBreweryLocation, updateBreweryLocation } from './adminApi';
import { coordsFromMapsLink } from './mapsLink';

const DAYS = [['monday', 'Mon'], ['tuesday', 'Tue'], ['wednesday', 'Wed'], ['thursday', 'Thu'], ['friday', 'Fri'], ['saturday', 'Sat'], ['sunday', 'Sun']];
const FALLBACK_DAY = { open: '16:00', close: '23:00', closed: false };

// Opening hours for one extra location. "Same as main venue" stores nothing, so the
// location keeps following the main hours if those change.
function LocationHours({ breweryId, loc, mainHours, onSaved }) {
  const [own, setOwn] = useState(!!loc.operating_hours);
  const [hours, setHours] = useState(() => {
    const base = loc.operating_hours || mainHours || {};
    return Object.fromEntries(DAYS.map(([d]) => [d, { ...FALLBACK_DAY, ...(base[d] || {}) }]));
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const setDay = (d, k, val) => setHours((h) => ({ ...h, [d]: { ...h[d], [k]: val } }));
  const save = async () => {
    setBusy(true); setMsg('');
    const r = await updateBreweryLocation(breweryId, loc.id, { operating_hours: own ? hours : null });
    setBusy(false);
    if (!r.ok) { setMsg(r.error || 'Could not save hours'); return; }
    setMsg('✓ Hours saved');
    onSaved(own ? hours : null);
  };
  return (
    <div style={{ padding: '10px 10px 12px', borderTop: '1px dashed var(--admin-border)', display: 'grid', gap: 8 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
        <input type="checkbox" checked={own} onChange={(e) => setOwn(e.target.checked)} style={{ width: 18, height: 18 }} />
        Different hours from the main venue
      </label>
      {own && DAYS.map(([d, label]) => (
        <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ width: 38, fontWeight: 600, fontSize: 14 }}>{label}</span>
          <input type="time" className="admin-form-input" style={{ width: 120 }} value={hours[d].open} disabled={hours[d].closed} onChange={(e) => setDay(d, 'open', e.target.value)} aria-label={`${label} opens`} />
          <span>–</span>
          <input type="time" className="admin-form-input" style={{ width: 120 }} value={hours[d].close} disabled={hours[d].closed} onChange={(e) => setDay(d, 'close', e.target.value)} aria-label={`${label} closes`} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!hours[d].closed} onChange={(e) => setDay(d, 'closed', e.target.checked)} /> Closed
          </label>
        </div>
      ))}
      {!own && <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text-muted)' }}>This location uses the main venue's opening hours.</p>}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" className="admin-btn admin-btn-primary settings-btn" onClick={save} disabled={busy} style={{ width: 'auto', flex: 'none' }}>{busy ? 'Saving…' : 'Save hours'}</button>
        {msg && <span style={{ fontSize: 13, color: msg.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{msg}</span>}
      </div>
    </div>
  );
}

const EMPTY = { name: '', address: '', district: '', maps_url: '', latitude: '', longitude: '' };

// A venue's extra locations. Every location counts for the same stamp.
export default function LocationsCard({ breweryId, breweryName, mainHours }) {
  const [list, setList] = useState(null);
  const [hoursOpen, setHoursOpen] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const r = await getBreweryLocations(breweryId);
    setList(r.ok ? r.locations : []);
    if (!r.ok) setMsg(r.error || 'Could not load locations');
  };
  useEffect(() => { if (breweryId) load(); }, [breweryId]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [k]: value };
      if (k === 'maps_url') {
        const c = coordsFromMapsLink(value);
        if (c) Object.assign(next, c);
      }
      return next;
    });
  };

  const add = async () => {
    setMsg('');
    if (!form.name.trim()) { setMsg('Give the location a name, e.g. "Phạm Viết Chánh"'); return; }
    setBusy(true);
    const r = await addBreweryLocation(breweryId, {
      name: form.name, address: form.address, district: form.district, maps_url: form.maps_url,
      latitude: form.latitude === '' ? null : form.latitude, longitude: form.longitude === '' ? null : form.longitude,
    });
    setBusy(false);
    if (!r.ok) { setMsg(r.error || 'Could not add location'); return; }
    setForm(EMPTY);
    setMsg('✓ Location added');
    load();
  };

  // Show or hide a location in the app without deleting it.
  const toggle = async (loc) => {
    const status = loc.status === 'active' ? 'inactive' : 'active';
    setList((xs) => xs.map((x) => (x.id === loc.id ? { ...x, status } : x)));
    const r = await updateBreweryLocation(breweryId, loc.id, { status });
    if (!r.ok) { setMsg(r.error || 'Could not update'); load(); return; }
    setMsg(status === 'active' ? `✓ ${loc.name} is showing in the app` : `✓ ${loc.name} is hidden from the app`);
  };

  const remove = async (loc) => {
    if (!window.confirm(`Remove "${loc.name}" from the app?`)) return;
    const r = await removeBreweryLocation(breweryId, loc.id);
    if (!r.ok) { setMsg(r.error || 'Could not remove'); return; }
    setMsg('✓ Removed');
    load();
  };

  return (
    <div className="admin-card">
      <h3 className="admin-card-title">Locations</h3>
      <p style={{ color: 'var(--admin-text-muted)', marginBottom: 12 }}>
        Have more than one taproom? Add each extra location here. Guests see all of them on your page, sorted by which is nearest,
        and a stamp at any location counts for {breweryName || 'your brewery'}. Untick "Showing" to hide a location without deleting it. Your main address stays in Venue details.
      </p>

      {list === null ? <p>Loading…</p> : list.length === 0 ? (
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>No extra locations yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
          {list.map((l) => (
            <div key={l.id} style={{ border: '1px solid var(--admin-border)', borderRadius: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, opacity: l.status === 'active' ? 1 : 0.55 }}>{l.name}</div>
                <div style={{ fontSize: 13, color: 'var(--admin-text-muted)' }}>
                  {[l.address, l.latitude == null ? 'No map pin yet' : null].filter(Boolean).join(' · ')}
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <input type="checkbox" role="switch" checked={l.status === 'active'} onChange={() => toggle(l)} style={{ width: 18, height: 18 }} />
                {l.status === 'active' ? 'Showing' : 'Hidden'}
              </label>
              <button type="button" className="admin-btn" onClick={() => setHoursOpen((x) => (x === l.id ? null : l.id))} aria-expanded={hoursOpen === l.id}
                style={{ width: 'auto', flex: 'none', background: 'transparent', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}>
                {l.operating_hours ? 'Own hours' : 'Hours'} {hoursOpen === l.id ? '▴' : '▾'}
              </button>
              <button type="button" className="admin-btn admin-btn-danger" onClick={() => remove(l)} style={{ width: 'auto', flex: 'none' }}>Remove</button>
            </div>
            {hoursOpen === l.id && (
              <LocationHours breweryId={breweryId} loc={l} mainHours={mainHours}
                onSaved={(h) => setList((xs) => xs.map((x) => (x.id === l.id ? { ...x, operating_hours: h } : x)))} />
            )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        <input className="admin-form-input" placeholder="Location name, e.g. Phạm Viết Chánh" value={form.name} onChange={set('name')} />
        <input className="admin-form-input" placeholder="Street address" value={form.address} onChange={set('address')} />
        <input className="admin-form-input" placeholder="District, e.g. Binh Thanh" value={form.district} onChange={set('district')} />
        <input className="admin-form-input" placeholder="Google Maps link (https://…)" value={form.maps_url} onChange={set('maps_url')} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="admin-form-input" placeholder="Latitude, e.g. 10.7901" value={form.latitude} onChange={set('latitude')} inputMode="decimal" />
          <input className="admin-form-input" placeholder="Longitude, e.g. 106.7103" value={form.longitude} onChange={set('longitude')} inputMode="decimal" />
        </div>
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 12, margin: 0 }}>
          The map pin and "nearest" need latitude and longitude. In Google Maps, press and hold on your bar and copy the two numbers shown. New locations use your main venue's hours; tap Hours on a location to set its own.
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" className="admin-btn admin-btn-primary settings-btn" onClick={add} disabled={busy} style={{ width: 'auto', flex: 'none' }}>{busy ? 'Adding…' : '+ Add Location'}</button>
          {msg && <span style={{ fontSize: 13, color: msg.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{msg}</span>}
        </div>
      </div>
    </div>
  );
}
