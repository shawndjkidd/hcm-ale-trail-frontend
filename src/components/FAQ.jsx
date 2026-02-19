import translations from '../translations'

function FAQ({ language, onBack }) {
  const t = translations[language]

  return (
    <div className="modal-overlay" onClick={onBack}>
      <div className="faq-content retro" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close retro" onClick={onBack}>✕</button>
        
        <div className="retro-header">
          <div className="retro-title-box">
            <h1 className="retro-title">HOW TO PLAY</h1>
          </div>
          <div className="retro-subtitle">INSERT BEER TO CONTINUE</div>
        </div>

        <div className="retro-steps">
          <div className="retro-step">
            <div className="retro-step-number">▸ 1</div>
            <div className="retro-step-text">{t.step1}</div>
            <div className="retro-dots">. . . . . . . .</div>
          </div>

          <div className="retro-step">
            <div className="retro-step-number">▸ 2</div>
            <div className="retro-step-text">{t.step2}</div>
            <div className="retro-step-subtext">» {t.step2sub}</div>
            <div className="retro-dots">. . . . . . . .</div>
          </div>

          <div className="retro-step">
            <div className="retro-step-number">▸ 3</div>
            <div className="retro-step-text">{t.step3}</div>
            <div className="retro-dots">. . . . . . . .</div>
          </div>

          <div className="retro-step bonus">
            <div className="retro-step-number">★ 4</div>
            <div className="retro-step-text">{t.step4}</div>
            <div className="retro-prize">🎁 BONUS UNLOCKED!</div>
          </div>
        </div>

        <div className="retro-banner">
          <span className="blink">►</span> {t.noRush} <span className="blink">◄</span>
        </div>

        <div className="retro-score">
          <span>HIGH SCORE: 8 STAMPS</span>
        </div>

        <button className="retro-btn" onClick={onBack}>
          <span className="btn-text">START GAME</span>
        </button>

        <div className="retro-footer">
          <span>© 2025 HCM ALE TRAIL</span>
          <span className="retro-lives">🍺 🍺 🍺</span>
        </div>
      </div>
    </div>
  )
}

export default FAQ