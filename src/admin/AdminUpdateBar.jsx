import { useEffect, useState } from 'react';
import { useT } from './i18n';
import { countUnseen } from './whatsNewData';
import './whats-new.css';

// When a newer version of the dashboard is live, a small notice asks the person to refresh, with how
// many What's new notes they'll see (design/whats-new-mockup.html). After the refresh the What's new
// box shows them.
const CURRENT = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev';
const CHECK_EVERY_MS = 60 * 1000;

export default function AdminUpdateBar({ signedIn = false }) {
  const t = useT();
  const [ready, setReady] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (CURRENT === 'dev') return undefined;
    let stopped = false;
    const check = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const { id } = await res.json();
        if (!stopped && id && id !== CURRENT) {
          setReady(true);
          if (signedIn) { const n = await countUnseen(); if (!stopped) setCount(n); }
        }
      } catch {}
    };
    check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);
    return () => { stopped = true; clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('focus', check); };
  }, [signedIn]);

  if (!ready) return null;
  return (
    <div className="wn-notice" role="status" aria-live="polite">
      <b>{count > 0 ? (count === 1 ? t('New version: 1 update') : t('New version: {n} updates', { n: count })) : t('A new version is ready')}</b>
      <span className="wn-m">{count > 0 ? t("Refresh to see what's new. Anything you've saved is safe.") : t("Refresh to get the latest version. Anything you've saved is safe.")}</span>
      <div className="wn-acts">
        <button type="button" className="wn-btn primary" onClick={() => window.location.reload()}>{t('Refresh')}</button>
      </div>
    </div>
  );
}
