import translations from '../translations'

function MyBeers({ beers, breweries, language, onBack }) {
  const t = translations[language]
  
  const totalBeers = beers.length
  const uniqueBreweries = [...new Set(beers.map(b => b.breweryId))].length
  const fiveStarBeers = beers.filter(b => b.rating === 5).length
  
  // Get top rated beers (5 stars first, then 4, etc.)
  const topRated = [...beers].sort((a, b) => b.rating - a.rating).slice(0, 3)
  
  // Group beers by brewery
  const beersByBrewery = {}
  beers.forEach(beer => {
    const brewery = breweries.find(b => b.id === beer.breweryId)
    const breweryName = brewery?.name || 'Unknown'
    if (!beersByBrewery[breweryName]) {
      beersByBrewery[breweryName] = []
    }
    beersByBrewery[breweryName].push(beer)
  })

  return (
    <div className="my-beers-page">
      <button className="back-btn" onClick={onBack}>← {t.back}</button>

      {/* Stats at top */}
      <div className="stats-summary">
        <div className="stat-item">
          <div className="stat-number">{totalBeers}</div>
          <div className="stat-label">{t.totalBeers}</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{uniqueBreweries}</div>
          <div className="stat-label">{t.breweries}</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{fiveStarBeers}</div>
          <div className="stat-label">{t.fiveStars}</div>
        </div>
      </div>

      {beers.length === 0 ? (
        <div className="empty-state">
          <p>{t.noBeerRatings}</p>
        </div>
      ) : (
        <>
          {/* Top Rated - Compact */}
          {topRated.length > 0 && (
            <div className="top-rated-section">
              <h2 className="section-title">🏆 {t.topRatedBeers}</h2>
              <div className="top-rated-list-compact">
                {topRated.map(beer => {
                  const brewery = breweries.find(b => b.id === beer.breweryId)
                  return (
                    <div key={beer.id} className="top-beer-compact">
                      <div className="top-beer-header">
                        <span className="top-beer-name">{beer.name}</span>
                        <span className="top-beer-stars">{'⭐'.repeat(beer.rating)}</span>
                      </div>
                      <div className="top-beer-brewery">{brewery?.name}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* All Beers by Brewery */}
          <div className="beers-by-brewery-section">
            <h2 className="page-title">{t.allYourBeers}</h2>
            {Object.entries(beersByBrewery).map(([breweryName, breweryBeers]) => (
              <div key={breweryName} className="brewery-group">
                <h3 className="brewery-group-title">🍺 {breweryName} ({breweryBeers.length} {breweryBeers.length === 1 ? t.beer : t.beers})</h3>
                <div className="brewery-group-beers">
                  {breweryBeers.map(beer => (
                    <div key={beer.id} className="grouped-beer-item">
                      <div className="grouped-beer-header">
                        <span className="grouped-beer-name">{beer.name}</span>
                        <span className="grouped-beer-rating">{'⭐'.repeat(beer.rating)}</span>
                      </div>
                      {beer.notes && <p className="grouped-beer-notes">{beer.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default MyBeers