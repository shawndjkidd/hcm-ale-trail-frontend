import { useState } from 'react'
import translations from '../translations'
import { patchUserMe } from '../lib/api'

export default function AgeGate({ language, onConfirm }) {
  const [busy, setBusy] = useState(false)
  const t = translations[language] || translations.en

  const handleConfirm = async () => {
    setBusy(true)
    try {
      const res = await patchUserMe({ legal_age_confirmed: true })
      if (res?.ok) {
        onConfirm()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="age-gate-overlay">
      <div className="age-gate-card">
        <h2 className="age-gate-title">{t.ageGateTitle || 'Confirm Your Age'}</h2>
        <p className="age-gate-body">{t.ageGateBody || 'You must be 18 or older to use the Ho Chi Minh Ale Trail.'}</p>
        <p className="age-gate-subtext">{t.ageGateSubtext || 'By tapping below, you confirm that you are at least 18 years old and understand this app includes alcohol-related content.'}</p>
        <button className="age-gate-btn" onClick={handleConfirm} disabled={busy}>
          {busy ? '...' : (t.ageGateButton || "I Confirm I'm 18+")}
        </button>
      </div>
    </div>
  )
}
