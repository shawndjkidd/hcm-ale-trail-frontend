import translations from '../translations'

function FAQ({ language, onBack }) {
  const t = translations[language]

  return (
    <div className="modal-overlay" onClick={onBack}>
      <div className="faq-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onBack}>✕</button>
        
        <h1 className="faq-title">{t.howToPlay}</h1>

        <div className="faq-steps">
          <div className="faq-step red">
            <div className="step-number">1</div>
            <div className="step-text">{t.step1}</div>
          </div>

          <div className="faq-step red">
            <div className="step-number">2</div>
            <div className="step-content">
              <div className="step-text">{t.step2}</div>
              <div className="step-subtext">{t.step2sub}</div>
            </div>
          </div>

          <div className="faq-step red">
            <div className="step-number">3</div>
            <div className="step-text">{t.step3}</div>
          </div>

          <div className="faq-step green">
            <div className="step-number">4</div>
            <div className="step-text">{t.step4}</div>
          </div>

          <div className="faq-banner black">
            {t.noRush}
          </div>

          <div className="faq-tips">
            <h3>💡 {t.keepStamps}</h3>
            <ul>
              <li>• {t.sameBrowser}</li>
              <li>• {t.noPrivate}</li>
              <li>• {t.noClear}</li>
            </ul>
          </div>

          <button className="ok-btn" onClick={onBack}>
            {t.ok}
          </button>
        </div>
      </div>
    </div>
  )
}