import { useState, useEffect } from 'react'
import translations from '../translations'

function HomePage({ trail, breweries, stamps, language, setLanguage, onBreweryClick, onNavigate, resetCard }) {
  const [showFAQ, setShowFAQ] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [hatClaimed, setHatClaimed] = useState(false)
  
  const t = translations[language]
  const progress = (stamps.length / breweries.length) * 100
  const isComplete = stamps.length === 8

  useEffect(() => {
    // Check if hat was already claimed
    const claimed = localStorage.getItem('hcm-hat-claimed')
    if (claimed === 'true') {
      setHatClaimed(true)
    }
  }, [])

  useEffect(() => {
    // Show completion modal when all 8 stamps are collected
    if (isComplete && !localStorage.getItem('hcm-completion-modal-shown')) {
      setShowCompletionModal(true)
    }
  }, [isComplete])

  const handleCloseCompletionModal = () => {
    setShowCompletionModal(false)
    localStorage.setItem('hcm-completion-modal-shown', 'true')
  }

  const handleClaimHat = () => {
    localStorage.setItem('hcm-hat-claimed', 'true')
    setHatClaimed(true)
    setShowCompletionModal(false)
  }

  return (
    <div className="home-page">
      <div className="language-toggle">
        <button 
          className={`flag-btn ${language === 'en' ? 'active' : ''}`}
          onClick={() => setLanguage('en')}
        >
          🇺🇸
        </button>
        <button 
          className={`flag-btn ${language === 'vn' ? 'active' : ''}`}
          onClick={() => setLanguage('vn')}
        >
          🇻🇳
        </button>
        <button 
          className={`flag-btn ${language === 'kr' ? 'active' : ''}`}
          onClick={() => setLanguage('kr')}
        >
          🇰🇷
        </button>
        <button 
          className={`flag-btn ${language === 'jp' ? 'active' : ''}`}
          onClick={() => setLanguage('jp')}
        >
          🇯🇵
        </button>
      </div>

      <div className="header-badge">
        <h1>{t.craftBeerPassport}</h1>
        <p>Saigon's Craft Beer Passport</p>
      </div>

      <div className="top-nav">
        <button className="nav-btn-small yellow" onClick={() => onNavigate('faq')}>
          {t.faq}
        </button>
        <a 
          href="https://www.hochiminhaletrail.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="nav-btn-small red"
        >
          {t.website}
        </a>
        <a 
          href="https://www.google.com/maps/d/u/1/viewer?mid=1ZO-30TD2syibuwwqGF7wDxwHACOEsBQ&ll=10.77928527172877%2C106.69519550000001&z=15" 
          target="_blank" 
          rel="noopener noreferrer"
          className="nav-btn-small green"
        >
          {t.maps}
        </a>
        <button className="nav-btn-small yellow" onClick={() => onNavigate('mybeers')}>
          {t.myBeers}
        </button>
      </div>

      <div className="progress-section">
        <div className="progress-header">
          <div className="progress-label">{t.stamps}</div>
          <div className="progress-count">{stamps.length}/8</div>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="trail-social">
        <a 
          href="https://www.instagram.com/hcm.aletrail/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="social-btn instagram"
        >
          📷 IG
        </a>
        <a 
          href="https://www.facebook.com/hcmaletrail" 
          target="_blank" 
          rel="noopener noreferrer"
          className="social-btn facebook"
        >
          👍 FB
        </a>
        <a 
          href="https://www.messenger.com/t/115480196509607/?messaging_source=source%3Apages%3Amessage_shortlink&source_id=1441792&recurring_notification=0" 
          target="_blank" 
          rel="noopener noreferrer"
          className="social-btn messenger"
        >
          💬 MSG
        </a>
      </div>

      <div className="brewery-list">
        {breweries.map((brewery, index) => {
          const isStamped = stamps.includes(brewery.id)
          return (
            <div 
              key={brewery.id}
              className={`brewery-item ${isStamped ? 'stamped' : ''}`}
              onClick={() => onBreweryClick(brewery)}
            >
              <div className="brewery-number">{index + 1}</div>
              <div className="brewery-info">
                <div className="brewery-name">{brewery.name}</div>
                <div className="brewery-address-small">{brewery.address}</div>
              </div>
              <div className="brewery-logo">
                {brewery.logo_url ? (
                  <img 
                    src={brewery.logo_url} 
                    alt={brewery.name}
                    className="color"
                  />
                ) : (
                  <span className="logo-placeholder">🍺</span>
                )}
              </div>
              
              {isStamped && (
                <div className="completed-stamp">
                  <div className="stamp-text">COMPLETED</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="footer">
        <div className="footer-year">HCM ALE TRAIL 2025</div>
        <div className="powered-by">Powered by Laidback Labs</div>
        <button className="reset-btn" onClick={resetCard}>
          {t.resetCard}
        </button>
      </div>

      {/* COMPLETION MODAL */}
      {showCompletionModal && (
        <div className="modal-overlay">
          <div className="completion-modal">
            <button className="modal-close" onClick={handleCloseCompletionModal}>✕</button>
            <div className="completion-icon">🎉</div>
            <h2 className="completion-title">CONGRATULATIONS!</h2>
            <p className="completion-subtitle">You've completed the HCM Ale Trail!</p>
            
            <div className="completion-steps">
              <div className="completion-step">
                <div className="step-number-circle">1</div>
                <div className="step-text">Show your server, bartender, or staff your completed card</div>
              </div>
              <div className="completion-step">
                <div className="step-number-circle">2</div>
                <div className="step-text">The staff will get you your free hat</div>
              </div>
              <div className="completion-step">
                <div className="step-number-circle">3</div>
                <div className="step-text">Help us grow! Share your experience and tag us on social media. Thank you for supporting Saigon's craft beer scene! 🍺</div>
              </div>
            </div>

            {!hatClaimed ? (
              <button className="completion-ok-btn" onClick={handleClaimHat}>
                CLAIM MY FREE HAT!
              </button>
            ) : (
              <>
                <div className="hat-claimed-message">
                  ✅ Hat already claimed! Thank you for participating!
                </div>
                <button className="completion-ok-btn claimed" onClick={handleCloseCompletionModal}>
                  CLOSE
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage
