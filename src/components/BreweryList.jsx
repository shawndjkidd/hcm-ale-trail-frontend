function BreweryList({ breweries, stamps }) {
  const sortedBreweries = [...breweries].sort((a, b) => {
    // Show stamped breweries first
    const aStamped = stamps.includes(a.id)
    const bStamped = stamps.includes(b.id)
    if (aStamped && !bStamped) return -1
    if (!aStamped && bStamped) return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="brewery-list-page">
      <div className="page-header">
        <h2 className="page-title">All Breweries</h2>
        <p className="page-subtitle">
          {stamps.length} of {breweries.length} collected
        </p>
      </div>

      <div className="brewery-grid">
        {sortedBreweries.map(brewery => (
          <BreweryCard 
            key={brewery.id} 
            brewery={brewery}
            isStamped={stamps.includes(brewery.id)}
          />
        ))}
      </div>
    </div>
  )
}

function BreweryCard({ brewery, isStamped }) {
  return (
    <div className={`brewery-card ${isStamped ? 'stamped' : ''}`}>
      {isStamped && (
        <div className="card-stamp">✓ VISITED</div>
      )}
      
      <div className="card-header">
        {brewery.logo_url ? (
          <img src={brewery.logo_url} alt={brewery.name} className="card-logo" />
        ) : (
          <div className="card-logo-placeholder">🍺</div>
        )}
      </div>

      <div className="card-content">
        <h3 className="card-title">{brewery.name}</h3>
        
        <div className="card-details">
          <div className="detail-row">
            <span className="detail-icon">📍</span>
            <span className="detail-text">{brewery.neighborhood}</span>
          </div>
          
          {brewery.address && (
            <div className="detail-row">
              <span className="detail-icon">🏢</span>
              <span className="detail-text small">{brewery.address}</span>
            </div>
          )}

          {brewery.opening_hours && (
            <div className="detail-row">
              <span className="detail-icon">🕐</span>
              <span className="detail-text small">{brewery.opening_hours}</span>
            </div>
          )}
        </div>

        {brewery.description && (
          <p className="card-description">{brewery.description}</p>
        )}

        <div className="card-actions">
          {brewery.google_maps_url && (
            <a 
              href={brewery.google_maps_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="action-link"
            >
              🗺️ Directions
            </a>
          )}
          {brewery.website_url && (
            <a 
              href={brewery.website_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="action-link"
            >
              🌐 Website
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default BreweryList
