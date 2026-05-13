import translations from '../translations'

export default function AgeGate({ language, onConfirm }) {
  const t = translations[language] || translations.en

  return (
    <div className="age-gate-overlay">
      <div className="age-gate-card">
        <h2 className="age-gate-title">{t.ageGateTitle || 'Confirm Your Age'}</h2>
        <p className="age-gate-body">{t.ageGateBody || 'You must be 18 or older to use the Ho Chi Minh Ale Trail.'}</p>
        <p className="age-gate-subtext">{t.ageGateSubtext || 'By tapping below, you confirm that you are at least 18 years old and understand this app includes alcohol-related content.'}</p>
        <button className="age-gate-btn" onClick={onConfirm}>
          {t.ageGateButton || "I Confirm I'm 18+"}
        </button>
      </div>
    </div>
  )
}
