import { useState, useEffect } from 'react'
import translations from '../translations'

function HomePage({ trail, breweries, stamps, language, setLanguage, onBreweryClick, onNavigate, resetCard, user, timerStart, timerEnd }) {
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [hatClaimed, setHatClaimed] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(null)
  
  const t = translations[language]
  const progress = (stamps.length / breweries.length) * 100
  const isComplete = stamps.length === 8

  useEffect(() => {
    const claimed = localStorage.getItem('hcm-hat-claimed')
    if (claimed === 'true') {
      setHatClaimed(true)
    }
  }, [])

  useEffect(() => {
    if (isComplete) {
      setShowCompletionModal(true)
    }
  }, [isComplete])

  // Live timer update
  useEffect(() => {
    if (timerStart && !timerEnd) {
      const interval = setInterval(() => {
        setElapsedTime(Date.now() - timerStart)
      }, 1000)
      return () => clearInterval(interval)
    } else if (timerStart && timerEnd) {
      setElapsedTime(timerEnd - timerStart)
    }
  }, [timerStart, timerEnd])

  const formatTime = (ms) => {
    if (!ms) return null
    
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const handleCloseCompletionModal = () => {
    setShowCompletionModal(false)
  }

  const handleClaimHat = () => {
    localStorage.setItem('hcm-hat-claimed', 'true')
    setHatClaimed(true)
  }

  const handleResetCard = () => {
    localStorage.removeItem('hcm-hat-claimed')
    setHatClaimed(false)
    setShowCompletionModal(false)
    resetCard()
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
        {t.craftBeerPassport}
      </div>

      {/* User greeting */}
      {user && (
        <div className="user-greeting">
          👋 Welcome back, <strong>{user.name}</strong>!
        </div>
      )}

      {/* Timer display */}
      {timerStart && (
        <div className={`timer-display ${timerEnd ? 'completed' : 'running'}`}>
          <div className="timer-icon">⏱️</div>
          <div className="timer-info">
            <div className="timer-value">{formatTime(elapsedTime)}</div>
            <div className="timer-status">
              {timerEnd ? t.completed : t.inProgress}
            </div>
          </div>
        </div>
      )}

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
        <button className="nav-btn-small yellow" onClick={() => onNavigate('leaderboard')}>
          🏆
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
        <button className="social-btn mybeers" onClick={() => onNavigate('mybeers')}>
          🍺 {t.myBeers}
        </button>
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
                <div className="brewery-district">{brewery.district}</div>
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
                  <div className="stamp-text">COMPLETED!</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="footer">
        <div className="footer-year">HCM ALE TRAIL 2025</div>
        <button className="reset-btn" onClick={handleResetCard}>
          {t.resetCard}
        </button>
      </div>

      {showCompletionModal && (
        <div className="modal-overlay">
          <div className="completion-modal">
            <button className="modal-close" onClick={handleCloseCompletionModal}>✕</button>
            <div className="completion-icon">🎉</div>
            <h2 className="completion-title">{t.congratulations}</h2>
            <p className="completion-subtitle">{t.completedTrail}</p>
            
            {/* Show completion time */}
            {timerStart && timerEnd && (
              <div className="completion-time">
                <div className="completion-time-label">{t.yourCompletionTime}</div>
                <div className="completion-time-value">{formatTime(timerEnd - timerStart)}</div>
              </div>
            )}
            
            <div className="completion-steps">
              <div className="completion-step">
                <div className="step-number-circle">1</div>
                <div className="step-text">{t.completionStep1}</div>
              </div>
              <div className="completion-step">
                <div className="step-number-circle">2</div>
                <div className="step-text">{t.completionStep2}</div>
              </div>
              <div className="completion-step">
                <div className="step-number-circle">3</div>
                <div className="step-text">{t.completionStep3}</div>
              </div>
            </div>

            {!hatClaimed ? (
              <button className="completion-ok-btn" onClick={handleClaimHat}>
                {t.claimHat}
              </button>
            ) : (
              <>
                <div className="hat-claimed-message">
                  {t.hatClaimed}
                </div>
                <button className="completion-ok-btn claimed" onClick={handleCloseCompletionModal}>
                  {t.close}
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
