import { useEffect, useState } from 'react';
import { getVenueDemo, removeVenueDemo } from './adminApi';
import { useToast, useConfirm } from './AdminFeedback';

// Shows only while this venue still has demo items on its page. Adding a real beer or
// event clears those automatically; this button clears everything at once.
export default function VenueDemoCard({ breweryId, refreshKey, onRemoved }) {
  const [demo, setDemo] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    let live = true;
    getVenueDemo(breweryId).then((r) => { if (live && r?.ok) setDemo(r.demo); });
    return () => { live = false; };
  }, [breweryId, refreshKey]);

  if (!demo || demo.beers + demo.events + demo.ratings === 0) return null;
  const parts = [
    demo.beers && `${demo.beers} demo ${demo.beers === 1 ? 'beer' : 'beers'}`,
    demo.events && `${demo.events} demo ${demo.events === 1 ? 'event' : 'events'}`,
    demo.ratings && `${demo.ratings} demo ${demo.ratings === 1 ? 'review' : 'reviews'}`,
  ].filter(Boolean).join(', ');

  const remove = async () => {
    const ok = await confirm({
      title: 'Remove demo content?',
      message: `This removes ${parts} from your page for good. Your own beers, events and reviews stay.`,
      confirmLabel: 'Remove demo content', danger: true,
    });
    if (!ok) return;
    setBusy(true);
    const r = await removeVenueDemo(breweryId);
    setBusy(false);
    if (r?.ok) { setDemo({ beers: 0, events: 0, ratings: 0 }); toast.success('Demo content removed'); onRemoved?.(); }
    else toast.error(r?.error || 'Could not remove demo content');
  };

  return (
    <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 16, borderLeft: '4px solid var(--admin-primary)' }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontWeight: 700 }}>Demo content is showing on your page</div>
        <div style={{ color: 'var(--admin-text-muted)', fontSize: 14, marginTop: 4 }}>
          {parts}. It goes by itself when you add your own beers and events, or remove it all now.
        </div>
      </div>
      <button type="button" className="admin-btn admin-btn-primary" style={{ width: 'auto' }} onClick={remove} disabled={busy}>
        {busy ? 'Removing…' : 'Remove demo content'}
      </button>
    </div>
  );
}
