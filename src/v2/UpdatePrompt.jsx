import { useEffect, useState } from 'react';
import { useV } from './i18n';
import { LOGO_WHITE } from './ui';

// Build id baked in at build time (see vite.config.js); /version.json is
// written by the same build, so a mismatch means a newer version is live.
const CURRENT = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev';
const CHECK_EVERY_MS = 60 * 1000;

export default function UpdatePrompt({ language, paused }) {
  const v = useV(language);
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

  // Never interrupt a check-in in progress; show as soon as it's finished.
  if (!ready || paused) return null;

  return (
    <div className="v2-full v2-welcome" role="alertdialog" aria-modal="true" aria-label={v.updateTitle} style={{ zIndex: 200 }}>
      <div className="wrap" style={{ justifyContent: 'center', gap: 18 }}>
        <img src={LOGO_WHITE} alt="Ho Chi Minh Ale Trail" style={{ width: '62%', maxWidth: 280 }} />
        <h1 className="display" style={{ fontSize: '2.8rem', color: 'var(--yellow)', textShadow: '3px 3px 0 var(--ink)' }}>{v.updateTitle}</h1>
        <p style={{ fontSize: '1.05rem', maxWidth: '34ch' }}>{v.updateBody}</p>
        <button type="button" className="btn block" onClick={() => window.location.reload()}>{v.updateBtn}</button>
      </div>
    </div>
  );
}
