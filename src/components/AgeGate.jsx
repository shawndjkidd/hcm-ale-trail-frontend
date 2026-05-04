import { useState } from 'react'
import translations from '../translations'
import { patchUserMe } from '../lib/api'

export default function AgeGate({ language, onConfirm }) {
  const [busy, setBusy] = useState(false)
  const [checked, setChecked] = useState(false)
  const t = translations[language] || translations.en

  const handleContinue = async () => {
    if (!checked) return
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
        <p className="age-gate-body">{t.ageGateBody || 'AleTrail includes craft beer and beverage experiences.'}</p>
        <div className="age-gate-checkbox-row">
          <input
            type="checkbox"
            id="age-gate-checkbox"
            className="age-gate-checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
          />
          <label htmlFor="age-gate-checkbox" className="age-gate-checkbox-label">
            {t.ageGateCheckbox || 'I confirm I am of legal drinking age in my location.'}
          </label>
        </div>
        <p className="age-gate-helper">{t.ageGateHelper || 'For Vietnam and Taiwan trails, this means 18 years or older.'}</p>
        <button
          className="age-gate-btn"
          onClick={handleContinue}
          disabled={!checked || busy}
        >
          {busy ? '...' : (t.ageGateContinue || 'Continue')}
        </button>
      </div>
    </div>
  )
}
