import { useEffect, useState } from 'react';
import { getVenueDemo, removeVenueDemo } from './adminApi';
import { useToast, useConfirm } from './AdminFeedback';
import { useT } from './i18n';

// Shows only while this venue still has demo items on its page. Adding a real beer or
// event clears those automatically; this button clears everything at once.
export default function VenueDemoCard({ breweryId, refreshKey, onRemoved }) {
  const [demo, setDemo] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const t = useT();

  useEffect(() => {
    let live = true;
    getVenueDemo(breweryId).then((r) => { if (live && r?.ok) setDemo(r.demo); });
    return () => { live = false; };
  }, [breweryId, refreshKey]);

  if (!demo || demo.beers + demo.events + demo.ratings === 0) return null;
  const parts = [
    demo.beers && t(demo.beers === 1 ? '{n} demo beer' : '{n} demo beers', { n: demo.beers }),
    demo.events && t(demo.events === 1 ? '{n} demo event' : '{n} demo events', { n: demo.events }),
    demo.ratings && t(demo.ratings === 1 ? '{n} demo review' : '{n} demo reviews', { n: demo.ratings }),
  ].filter(Boolean).join(', ');

  const remove = async () => {
    const ok = await confirm({
      title: t('Remove demo content?'),
      message: t('This removes {parts} from your page for good. Your own beers, events and reviews stay.', { parts }),
      confirmLabel: t('Remove demo content'), danger: true,
    });
    if (!ok) return;
    setBusy(true);
    const r = await removeVenueDemo(breweryId);
    setBusy(false);
    if (r?.ok) { setDemo({ beers: 0, events: 0, ratings: 0 }); toast.success(t('Demo content removed')); onRemoved?.(); }
    else toast.error(r?.error || t('Could not remove demo content'));
  };

  return (
    <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 16, borderLeft: '4px solid var(--admin-primary)' }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontWeight: 700 }}>{t('Demo content is showing on your page')}</div>
        <div style={{ color: 'var(--admin-text-muted)', fontSize: 14, marginTop: 4 }}>
          {parts}. {t('It goes by itself when you add your own beers and events, or remove it all now.')}
        </div>
      </div>
      <button type="button" className="admin-btn admin-btn-primary" style={{ width: 'auto' }} onClick={remove} disabled={busy}>
        {busy ? t('Removing…') : t('Remove demo content')}
      </button>
    </div>
  );
}
