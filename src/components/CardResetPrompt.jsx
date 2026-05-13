import { useState } from 'react'
import translations from '../translations'

export default function CardResetPrompt({ language, setLanguage, cardRound, onReset, onDismiss }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const t = translations[language] || translations.en

  const handleReset = async () => {
    setBusy(true)
    setError(null)
    try {
      await onReset()
    } catch (e) {
      setError(e?.message || 'Something went wrong. Try again.')
      setBusy(false)
    }
  }

  return (
    <div className="card-reset-overlay">
      {/* Language selector */}
      <div className="card-reset-flags">
        {[
          { code: 'en', flag: 'us', label: 'English' },
          { code: 'vn', flag: 'vn', label: 'Tiếng Việt' },
          { code: 'kr', flag: 'kr', label: '한국어' },
          { code: 'jp', flag: 'jp', label: '日本語' },
        ].map(({ code, flag, label }) => (
          <button
            key={code}
            className={`flag-btn-large ${language === code ? 'active' : ''}`}
            onClick={() => setLanguage(code)}
          >
            <img src={`https://flagcdn.com/w160/${flag}.png`} alt={label} className="flag-img" />
          </button>
        ))}
      </div>

      {/* Celebration heading */}
      <h1 className="card-reset-title">{t.cardResetTitle || 'HAT CLAIMED!'}</h1>
      <p className="card-reset-subtext">{t.cardResetSubtext || "You're an official Ale Trail Champion."}</p>

      <div className="card-reset-divider" />

      {/* Round again prompt */}
      <h2 className="card-reset-prompt-header">{t.cardResetPromptHeader || 'WANT TO DO IT AGAIN?'}</h2>

      {error && <p className="card-reset-error">{error}</p>}

      <button className="card-reset-btn" onClick={handleReset} disabled={busy}>
        {busy ? '...' : (t.cardResetPromptCta || 'RESET CARD & START OVER')}
      </button>

      <button className="card-reset-dismiss" onClick={onDismiss} disabled={busy}>
        {t.cardResetPromptDismiss || "No thanks, I'm done"}
      </button>
    </div>
  )
}
