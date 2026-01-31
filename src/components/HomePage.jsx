import translations from '../translations'

const FLAGS = {
  en: '🇬🇧',
  vn: '🇻🇳',
  kr: '🇰🇷',
  jp: '🇯🇵'
}

function HomePage({ trail, breweries, stamps, language, setLanguage, onBreweryClick, onNavigate, resetCard }) {
  if (!trail) return null

  const t = translations[language]
  const progress = breweries.length > 0 ? (stamps.length / breweries.length) * 100 : 0

  return (
    <div className="home-page">
      {/* Language Toggle */}
      <div className="language-toggle">
        {Object.keys(FLAGS).map(lang => (
          <button
            key={lang}
            className={`flag-btn ${language === lang ? 'active' : ''}`}
            onClick={() => setLanguage(lang)}
          >
            {FLAGS[lang]}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="header-badge">
        {t.craftBeerPassport}
      </div>

      {/* Progress */}
      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-label">{t.stamps}</span>
          <span className="progress-count">{stamps.length}/{breweries.length}</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Trail Social Media */}
      <div className="trail-social">
        <a href="https://www.instagram.com/hcm.aletrail/" target="_blank" rel="noopener noreferrer" className="social-btn instagram">
          <span className="social-icon">📷</span> IG
        </a>
        <a href="https://www.facebook.com/hcmaletrail" target="_blank" rel="noopener noreferrer" className="social-btn facebook">
          <span className="social-icon">👍</span> FB
        </a>
      </div>

      {/* Brewery List */}
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
                <div className="brewery-district">{brewery.address}</div>
              </div>
              <div className="brewery-logo">
                {brewery.logo_url ? (
                  <img 
                    src={brewery.logo_url} 
                    alt={brewery.name}
                    className={isStamped ? 'color' : 'grayscale'}
                  />
                ) : (
                  <div className="logo-placeholder">🍺</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button className="nav-btn yellow" onClick={() => onNavigate('faq')}>
          {t.faq}
        </button>
        <button className="nav-btn black" onClick={() => window.open('https://www.hochiminhaletrail.com/', '_blank')}>
          {t.website}
        </button>
        <button className="nav-btn green" onClick={() => window.open('https://www.google.com/maps/d/u/1/viewer?mid=1ZO-30TD2syibuwwqGF7wDxwHACOEsBQ&ll=10.77928527172877%2C106.69519550000001&z=15', '_blank')}>
          {t.maps}
        </button>
        <button className="nav-btn orange" onClick={() => onNavigate('mybeers')}>
          {t.myBeers}
        </button>
      </div>

      {/* Footer */}
      <div className="footer">
        <div className="footer-year">2026 HO CHI MINH ALE TRAIL</div>
        <button className="reset-btn" onClick={resetCard}>
          {t.resetCard}
        </button>
      </div>
    </div>
  )
}

export default HomePage
