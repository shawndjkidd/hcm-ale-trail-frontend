import { useEffect, useState } from 'react';
import { getVenueDemo, removeVenueDemo } from './adminApi';
import { useToast, useConfirm } from './AdminFeedback';
import { buildChecklist } from './checklist';

// "Get your venue ready": everything that makes the venue's page in the app complete.
// Items tick themselves off from the venue's real data and drop off the list; each button
// opens the right tab (or removes the demo content). When everything is done the card is gone.

const isDemoBeer = (b) => String(b.id || '').startsWith('de000000-') || /^\s*DEMO\s*·/i.test(b.name || '');

export default function VenueChecklist({ breweryId, photoUrl, hasHours, socialLinks, descriptionEn, descriptionVn, beers, merch, events, staff, onGo, onDemoRemoved }) {
  const [demo, setDemo] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const loadDemo = () => getVenueDemo(breweryId).then((r) => { if (r?.ok) setDemo(r.demo); });
  useEffect(() => { loadDemo(); }, [breweryId]); // eslint-disable-line react-hooks/exhaustive-deps

  const realBeers = (beers || []).filter((b) => !isDemoBeer(b) && b.active !== false);
  const facts = {
    hasPhoto: !!photoUrl,
    realBeers: realBeers.length,
    beersMissingDetails: realBeers.filter((b) => !b.style || b.abv === null || b.abv === undefined || b.abv === '').map((b) => b.name),
    hasHours: !!hasHours,
    hasMaps: !!socialLinks?.mapsUrl,
    hasDescEn: !!(descriptionEn || '').trim(),
    hasDescVn: !!(descriptionVn || '').trim(),
    hats: (merch || []).reduce((n, m) => n + (Number(m.quantity) || 0), 0),
    hasSocial: !!(socialLinks?.instagramUrl || socialLinks?.facebookUrl),
    demoItems: demo ? demo.beers + demo.events + demo.ratings : null,
    barStaff: (staff || []).filter((m) => m.role === 'staff' || m.role === 'manager').length,
    realEvents: (events || []).filter((e) => !String(e.id || '').startsWith('de000000-')).length,
  };
  const list = buildChecklist(facts);
  if (list.complete) return null;

  const removeDemo = async () => {
    const ok = await confirm({
      title: 'Remove demo content?',
      message: `This removes ${facts.demoItems} demo items (beers, events and reviews) from your page for good. Your own beers, events and reviews stay.`,
      confirmLabel: 'Remove demo content', danger: true,
    });
    if (!ok) return;
    setBusy(true);
    const r = await removeVenueDemo(breweryId);
    setBusy(false);
    if (r?.ok) { toast.success('Demo content removed'); await loadDemo(); onDemoRemoved?.(); }
    else toast.error(r?.error || 'Could not remove demo content');
  };

  return (
    <div className="admin-card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h3 className="admin-card-title" style={{ margin: 0 }}>Get your venue ready</h3>
        <span style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>{list.done} of {list.total} done</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'var(--admin-border)', margin: '12px 0 6px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(list.done / list.total) * 100}%`, background: 'var(--hq-good, #22C55E)', borderRadius: 4 }} />
      </div>
      {list.todo.map((i) => (
        <div key={i.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--admin-border)' }}>
          <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--admin-text-muted)', flex: 'none' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{i.title}{i.optional ? <span style={{ color: 'var(--admin-text-muted)', fontWeight: 500 }}> · optional</span> : null}</div>
            <div style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginTop: 2 }}>{i.why}</div>
          </div>
          {i.action === 'removeDemo'
            ? (facts.demoItems > 0 && <button type="button" className="admin-btn admin-btn-primary" style={{ width: 'auto', flex: 'none' }} onClick={removeDemo} disabled={busy}>{busy ? 'Removing…' : i.cta}</button>)
            : i.go && <button type="button" className="admin-btn admin-btn-primary" style={{ width: 'auto', flex: 'none' }} onClick={() => onGo(i.go)}>{i.cta}</button>}
        </div>
      ))}
    </div>
  );
}
