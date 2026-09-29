import { useEffect, useState } from 'react';
import { getVenueDemo, removeVenueDemo, getChecklistConfirmed, confirmChecklistItem } from './adminApi';
import { useToast, useConfirm } from './AdminFeedback';
import { buildChecklist } from './checklist';
import { useT } from './i18n';

// "Get your venue ready": everything that makes the venue's page in the app complete.
// Items tick themselves off from the venue's real data and drop off the list; each button
// opens the right tab (or removes the demo content). When everything is done the card is gone.

const isDemoBeer = (b) => String(b.id || '').startsWith('de000000-') || /^\s*DEMO\s*·/i.test(b.name || '');

export default function VenueChecklist({ breweryId, isHQ = false, photoUrl, hasHours, socialLinks, descriptionEn, descriptionVn, beers, merch, events, staff, onGo, onDemoRemoved }) {
  const [demo, setDemo] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const t = useT();

  const [confirmed, setConfirmed] = useState([]);
  const loadDemo = () => getVenueDemo(breweryId).then((r) => { if (r?.ok) setDemo(r.demo); });
  useEffect(() => {
    loadDemo();
    getChecklistConfirmed(breweryId).then((r) => { if (r?.ok) setConfirmed(r.confirmed || []); });
  }, [breweryId]); // eslint-disable-line react-hooks/exhaustive-deps
  const confirmItem = async (key) => {
    setConfirmed((c) => [...new Set([...c, key])]);
    const r = await confirmChecklistItem(breweryId, key);
    if (!r?.ok) { setConfirmed((c) => c.filter((k) => k !== key)); toast.error(r?.error || t('Could not save')); }
  };

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
    confirmed,
  };
  const list = buildChecklist(facts, t);
  if (list.complete) return null;

  const removeDemo = async () => {
    const ok = await confirm({
      title: t('Remove demo content?'),
      message: t('This removes {n} demo items (beers, events and reviews) from your page for good. Your own beers, events and reviews stay.', { n: facts.demoItems }),
      confirmLabel: t('Remove demo content'), danger: true,
    });
    if (!ok) return;
    setBusy(true);
    const r = await removeVenueDemo(breweryId);
    setBusy(false);
    if (r?.ok) { toast.success(t('Demo content removed')); await loadDemo(); onDemoRemoved?.(); }
    else toast.error(r?.error || t('Could not remove demo content'));
  };

  return (
    <div className="admin-card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h3 className="admin-card-title" style={{ margin: 0 }}>{t('Get your venue ready')}</h3>
        <span style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>{t('{done} of {total} done', { done: list.done, total: list.total })}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'var(--admin-border)', margin: '12px 0 6px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(list.done / list.total) * 100}%`, background: 'var(--hq-good, #22C55E)', borderRadius: 4 }} />
      </div>
      {list.items.map((i) => (
        <div key={i.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--admin-border)', opacity: i.done ? 0.62 : 1 }}>
          {i.done
            ? <span aria-label="done" style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--hq-good, #22C55E)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, flex: 'none' }}>✓</span>
            : <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--admin-text-muted)', flex: 'none' }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, textDecoration: i.done ? 'line-through' : 'none' }}>{i.title}{i.optional ? <span style={{ color: 'var(--admin-text-muted)', fontWeight: 500 }}> · {t('optional')}</span> : null}</div>
            {!i.done && <div style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginTop: 2 }}>{i.why}</div>}
          </div>
          {!i.done && (
            <div style={{ display: 'flex', gap: 8, flex: 'none', alignItems: 'center' }}>
              {i.ready && (isHQ
                ? <span style={{ color: 'var(--admin-text-muted)', fontSize: 13 }}>{t('Waiting for the venue')}</span>
                : <button type="button" className="admin-btn admin-btn-primary" style={{ width: 'auto' }} onClick={() => confirmItem(i.key)}>{i.tick}</button>)}
              {i.action === 'removeDemo'
                ? (facts.demoItems > 0 && <button type="button" className="admin-btn admin-btn-primary" style={{ width: 'auto' }} onClick={removeDemo} disabled={busy}>{busy ? t('Removing…') : i.cta}</button>)
                : i.go && <button type="button" className={`admin-btn ${i.ready ? '' : 'admin-btn-primary'}`} style={{ width: 'auto', ...(i.ready ? { background: 'transparent', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' } : {}) }} onClick={() => onGo(i.go)}>{i.cta}</button>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
