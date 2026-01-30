function HomePage({ trail, breweries, stamps, onExplore }) {
  if (!trail) return null

  const progress = breweries.length > 0 ? (stamps.length / breweries.length) * 100 : 0

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">🍺 CRAFT BEER PASSPORT</div>
          <h2 className="hero-title">{trail.name}</h2>
          <p className="hero-location">📍 {trail.city}, {trail.country}</p>
          <p className="hero-description">{trail.description}</p>
          
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-number">{breweries.length}</div>
              <div className="stat-label">Breweries</div>
            </div>
            <div className="stat">
              <div className="stat-number">{stamps.length}</div>
              <div className="stat-label">Collected</div>
            </div>
            <div className="stat">
              <div className="stat-number">{Math.round(progress)}%</div>
              <div className="stat-label">Complete</div>
            </div>
          </div>

          <button className="cta-button" onClick={onExplore}>
            🗺️ Explore Breweries
          </button>
        </div>

        <div className="hero-visual">
          <div className="beer-glass">
            <div className="beer-fill" style={{ height: `${progress}%` }}></div>
            <div className="beer-foam"></div>
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="info-section">
        <h3 className="section-title">How It Works</h3>
        <div className="info-cards">
          <div className="info-card">
            <div className="info-icon">1️⃣</div>
            <h4>Visit Breweries</h4>
            <p>Explore {breweries.length} amazing craft breweries across Saigon</p>
          </div>
          <div className="info-card">
            <div className="info-icon">2️⃣</div>
            <h4>Collect Stamps</h4>
            <p>Get a unique code at each brewery and add it to your passport</p>
          </div>
          <div className="info-card">
            <div className="info-icon">3️⃣</div>
            <h4>Earn Rewards</h4>
            <p>{trail.reward_text}</p>
          </div>
        </div>
      </section>

      {/* Featured Breweries Preview */}
      {breweries.length > 0 && (
        <section className="preview-section">
          <h3 className="section-title">Featured Stops</h3>
          <div className="brewery-preview">
            {breweries.slice(0, 3).map(brewery => (
              <div key={brewery.id} className="preview-card">
                {brewery.logo_url && (
                  <img src={brewery.logo_url} alt={brewery.name} className="preview-logo" />
                )}
                <h4>{brewery.name}</h4>
                <p className="preview-location">{brewery.neighborhood}</p>
                {stamps.includes(brewery.id) && (
                  <div className="stamp-badge">✓ STAMPED</div>
                )}
              </div>
            ))}
          </div>
          <button className="cta-button secondary" onClick={onExplore}>
            View All {breweries.length} Breweries →
          </button>
        </section>
      )}
    </div>
  )
}

export default HomePage
