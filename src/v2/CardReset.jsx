import { useState } from 'react';
import translations from '../translations';
import { Flags } from './ui';

// Shown once per card after the gift has been collected at a venue: offer a fresh card.
export default function CardReset({ language, setLanguage, onReset, onDismiss }) {
  const t = translations[language] || translations.en;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const reset = async () => {
    setBusy(true); setError(null);
    try { await onReset(); } catch (e) { setError(e?.message || t.error || 'Something went wrong. Try again.'); setBusy(false); }
  };

  return (
    <div className="v2-full v2-cardreset" role="dialog" aria-modal="true" aria-label={t.cardResetTitle || 'Hat claimed'}>
      <div className="wrap">
        <div className="top" style={{ justifyContent: 'center' }}>
          <Flags language={language} setLanguage={setLanguage} />
        </div>
        <h1 className="headline">{t.cardResetTitle || 'HAT CLAIMED!'}</h1>
        <p style={{ fontSize: '1.05rem', maxWidth: '36ch' }}>{t.cardResetSubtext || "You're an official Ale Trail Champion."}</p>
        <div style={{ marginTop: 'auto', display: 'grid', gap: 12 }}>
          <h2 className="display" style={{ fontSize: '1.5rem', color: 'var(--yellow)' }}>{t.cardResetPromptHeader || 'WANT TO DO IT AGAIN?'}</h2>
          {error && <p className="note-err" role="alert">{error}</p>}
          <button type="button" className="btn block" onClick={reset} disabled={busy}>
            {busy ? '…' : (t.cardResetPromptCta || 'RESET CARD & START OVER')}
          </button>
          <button type="button" className="link-btn" style={{ color: '#fff' }} onClick={onDismiss} disabled={busy}>
            {t.cardResetPromptDismiss || "No thanks, I'm done"}
          </button>
        </div>
      </div>
    </div>
  );
}
