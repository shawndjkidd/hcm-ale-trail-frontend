import translations from '../translations'

const FLAGS = [
  { code: 'en', flag: 'us', label: 'English' },
  { code: 'vn', flag: 'vn', label: 'Tiếng Việt' },
  { code: 'kr', flag: 'kr', label: '한국어' },
  { code: 'jp', flag: 'jp', label: '日本語' },
]

export default function AgeGate({ language, setLanguage, onConfirm }) {
  const t = translations[language] || translations.en

  return (
    <div className="age-gate-fullscreen">
      <div className="age-gate-flags">
        {FLAGS.map(({ code, flag, label }) => (
          <button
            key={code}
            className={`flag-btn-large ${language === code ? 'active' : ''}`}
            onClick={() => setLanguage(code)}
          >
            <img src={`https://flagcdn.com/w160/${flag}.png`} alt={label} className="flag-img" />
          </button>
        ))}
      </div>
      <div className="age-gate-content">
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
