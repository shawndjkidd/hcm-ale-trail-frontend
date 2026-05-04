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
        <div className="age-gate-icon">🍺</div>
        <h2 className="age-gate-title">{t.ageGateTitle || 'CONFIRM YOUR AGE'}</h2>
        <p className="age-gate-body">{t.ageGateBody || 'You must be 18 or older to use the HCM Ale Trail.'}</p>
        <button className="age-gate-btn" onClick={handleConfirm} disabled={busy}>
          {busy ? '...' : (t.ageGateConfirm || 'I AM 18 OR OLDER')}
        </button>
        <p className="age-gate-note">{t.ageGateNote || 'By continuing, you confirm you are of legal drinking age in your country.'}</p>
      </div>
    </div>
  )
}
