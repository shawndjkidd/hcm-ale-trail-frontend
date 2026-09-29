import { useEffect, useState } from 'react';
import { getVenueFeatures, setVenueFeature, TRAIL_ID } from './adminApi';

// Plans & add-ons: switch paid features on for one venue at a time. A venue only sees a
// feature once it is built ("Ready") AND switched on here; until then nothing changes for them.

const VERTICAL = { all: 'Any trail', drinks: 'Drinks trails', food: 'Food trails' };

export default function HQPlans() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState('');

  const load = async () => {
    setError('');
    const r = await getVenueFeatures(TRAIL_ID);
    if (r?.ok) setData(r); else setError(r?.error || 'Could not load');
  };
  useEffect(() => { load(); }, []);

  if (error && !data) {
    return (
      <div className="hq-card"><h3>Couldn't load Plans &amp; add-ons</h3><p className="hq-note">Check your connection and try again.</p>
        <button type="button" className="hq-btn y" style={{ marginTop: 12 }} onClick={load}>Try again</button></div>
    );
  }
  if (!data) return <div className="admin-loading"><div className="admin-spinner" /></div>;

  const on = (venueId, key) => data.switches.some((s) => s.breweryId === venueId && s.featureKey === key && s.enabled);
  const toggle = async (venueId, key) => {
    const next = !on(venueId, key);
    setSaving(`${venueId}:${key}`);
    const r = await setVenueFeature(TRAIL_ID, { breweryId: venueId, featureKey: key, enabled: next });
    setSaving('');
    if (r?.ok) {
      setData((d) => ({
        ...d,
        switches: [...d.switches.filter((s) => !(s.breweryId === venueId && s.featureKey === key)), { breweryId: venueId, featureKey: key, enabled: next }],
      }));
    } else setError(r?.error || 'Could not save that switch');
  };
  const count = (key) => data.venues.filter((v) => on(v.id, key)).length;

  return (
    <>
      <div className="hq-h"><div><h2>Plans &amp; add-ons</h2><p>Paid extras, switched on one venue at a time. Venues see nothing new until a feature is built and switched on for them.</p></div></div>
      {!data.tableReady && <div className="hq-card" style={{ marginBottom: 14, borderColor: 'var(--hq-bad)' }}><b>The add-ons table isn't set up yet, so switches can't be saved.</b></div>}
      {error && <div className="hq-card" style={{ marginBottom: 14, borderColor: 'var(--hq-bad)' }}><b>{error}</b></div>}

      <div className="hq-card hq-tscroll">
        <h3>Who has what <span className="more">Switches save straight away</span></h3>
        <table className="hq-table center">
          <thead><tr><th>Venue</th>{data.features.map((f) => <th key={f.key} title={f.description}>{f.name}</th>)}</tr></thead>
          <tbody>
            {data.venues.map((v) => (
              <tr key={v.id}>
                <td><b>{v.name}</b></td>
                {data.features.map((f) => (
                  <td key={f.key}>
                    <button type="button" className="hq-sw" role="switch" aria-checked={on(v.id, f.key)} aria-label={`${f.name} for ${v.name}`}
                      disabled={!data.tableReady || saving === `${v.id}:${f.key}`} onClick={() => toggle(v.id, f.key)} style={{ margin: '0 auto', display: 'block' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hq-card hq-mt">
        <h3>Add-on catalogue</h3>
        {data.features.map((f) => (
          <div className="hq-li" key={f.key}>
            <div className="t">
              <b>{f.name}</b>
              <small>{f.description}</small>
              <small style={{ display: 'block', marginTop: 2 }}>{f.verticals.map((x) => VERTICAL[x] || x).join(', ')} · suggested {f.suggestedPrice} · on for {count(f.key)} {count(f.key) === 1 ? 'venue' : 'venues'}</small>
            </div>
            <span className={`hq-st ${f.ready ? 'ok' : ''}`}>{f.ready ? 'Ready' : 'Not built yet'}</span>
          </div>
        ))}
        <p className="hq-note">"Not built yet" means switching it on has no effect for the venue until we build it. You can still set who gets it first.</p>
      </div>
    </>
  );
}
