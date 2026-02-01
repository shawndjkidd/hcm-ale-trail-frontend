import { useState } from 'react'
import translations from '../translations'

function HomePage({ trail, breweries, stamps, language, setLanguage, theme, toggleTheme, onBreweryClick, onNavigate, resetCard }) {
  const [showFAQ, setShowFAQ] = useState(false)
  
  const t = translations[language]
  const progress = (stamps.length / breweries.length) * 100

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
        <button 
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'color' ? 'Switch to Grayscale' : 'Switch to Color'}
        >
          {theme === 'color' ? '⚫' : '🎨'}
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
          href="https://www.hcmaletrail.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="nav-btn-small red"
        >
          {t.website}
        </a>
        <a 
          href="https://maps.app.goo.gl/hcmaletrail" 
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

      {trail && (
        <div className="trail-social">
          <a 
            href={trail.instagram_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="social-btn instagram"
          >
            📷 IG
          </a>
          <a 
            href={trail.facebook_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="social-btn facebook"
          >
            👍 FB
          </a>
        </div>
      )}

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
                    className={isStamped ? 'color' : 'grayscale'}
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
    </div>
  )
}

export default HomePage
