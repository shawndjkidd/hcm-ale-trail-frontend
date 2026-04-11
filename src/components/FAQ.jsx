import translations from '../translations'

function FAQ({ language, onBack }) {
  const t = translations[language]

  return (
    <div className="tg-page">
      {/* Header bar */}
      <div className="tg-header">
        <button className="tg-back-btn" onClick={onBack}>← {t.back || 'BACK'}</button>
        <h1 className="tg-title">{t.trailGuide || 'TRAIL GUIDE'}</h1>
      </div>

      <div className="tg-content">
        {/* Hero */}
        <div className="tg-hero">
          <div className="tg-hero-icon-text">TRAIL GUIDE</div>
          <h2 className="tg-hero-title">{t.howToPlay || 'HOW TO PLAY'}</h2>
          <p className="tg-hero-sub">{t.trailGuideSubtitle || 'Your guide to the HCM Ale Trail'}</p>
        </div>

        {/* Steps */}
        <div className="tg-steps">
          <div className="tg-step">
            <div className="tg-step-num">1</div>
            <div className="tg-step-body">
              <div className="tg-step-text">{t.step1}</div>
            </div>
          </div>

          <div className="tg-step">
            <div className="tg-step-num">2</div>
            <div className="tg-step-body">
              <div className="tg-step-text">{t.step2}</div>
              <div className="tg-step-sub">» {t.step2sub}</div>
            </div>
          </div>

          <div className="tg-step">
            <div className="tg-step-num">3</div>
            <div className="tg-step-body">
              <div className="tg-step-text">{t.step3}</div>
            </div>
          </div>

          <div className="tg-step tg-step-bonus">
            <div className="tg-step-num">★</div>
            <div className="tg-step-body">
              <div className="tg-step-text">{t.step4}</div>
              <div className="tg-step-prize">{t.bonusUnlocked || 'BONUS UNLOCKED!'}</div>
            </div>
          </div>
        </div>

        {/* Banner */}
        <div className="tg-banner">
          {t.noRush}
        </div>

        {/* CTA */}
        <button className="tg-cta" onClick={onBack}>
          {t.startTrail || 'START THE TRAIL'}
        </button>

        <div className="tg-footer">
          © 2025 HCM ALE TRAIL
        </div>
      </div>
    </div>
  )
}

export default FAQ
