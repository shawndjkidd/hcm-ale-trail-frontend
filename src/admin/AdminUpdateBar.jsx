import { useEffect, useState } from 'react';

// Tells anyone using the dashboard when a newer version is live, with a Refresh button.
// A bar, not a blocking screen, so nobody loses a half-filled form.
const CURRENT = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev';
const CHECK_EVERY_MS = 60 * 1000;

export default function AdminUpdateBar() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (CURRENT === 'dev') return undefined;
    let stopped = false;
    const check = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const { id } = await res.json();
        if (!stopped && id && id !== CURRENT) setReady(true);
      } catch {}
    };
    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);
    return () => { stopped = true; clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('focus', check); };
  }, []);

  if (!ready) return null;
  return (
    <div role="status" style={{
      position: 'sticky', top: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap',
      padding: '10px 16px', background: '#FFD100', color: '#111', fontWeight: 700, fontSize: 15, borderBottom: '3px solid #111',
    }}>
      <span>A new version of the dashboard is live. Save anything you're working on, then refresh.</span>
      <button type="button" onClick={() => window.location.reload()} style={{
        background: '#111', color: '#FFD100', border: 0, borderRadius: 6, padding: '8px 16px', fontWeight: 800, fontSize: 14, cursor: 'pointer',
      }}>Refresh</button>
    </div>
  );
}
