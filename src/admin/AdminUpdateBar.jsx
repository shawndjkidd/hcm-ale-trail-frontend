import { useEffect, useState } from 'react';
import { useT } from './i18n';

// When a newer version of the dashboard is live, blocks the screen until the person
// refreshes (same as the customer app), so nobody keeps working on an old version.
const CURRENT = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev';
const CHECK_EVERY_MS = 60 * 1000;

export default function AdminUpdateBar() {
  const t = useT();
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

  useEffect(() => {
    if (!ready) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [ready]);

  if (!ready) return null;
  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="admin-update-title" style={{
      position: 'fixed', inset: 0, zIndex: 10000, display: 'grid', placeItems: 'center', padding: 16,
      background: 'rgba(10, 11, 13, 0.78)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
    }}>
      <div style={{
        width: 'min(380px, 100%)', background: '#16181B', color: '#F3F4F6', border: '1px solid #383B41', borderRadius: 18,
        padding: 26, textAlign: 'center', boxShadow: '0 30px 60px rgba(0,0,0,.6)', fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#1F2125', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5" />
          </svg>
        </div>
        <h2 id="admin-update-title" style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>{t('A new version is ready')}</h2>
        <p style={{ color: '#A4A8AF', margin: '0 0 18px', fontSize: 14, lineHeight: 1.5 }}>{t("We've updated the dashboard. Refresh to keep going. Anything you've already saved is safe.")}</p>
        <button type="button" autoFocus onClick={() => window.location.reload()} style={{
          width: '100%', background: '#F5A623', color: '#111', border: 0, borderRadius: 10, padding: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer',
        }}>{t('Refresh now')}</button>
      </div>
    </div>
  );
}
