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
    const brewery = breweries.find(b => b.id === beer.breweryId || b.name === beer.breweryName)
    const breweryName = brewery?.name || beer.breweryName || 'Unknown'
    if (!beersByBrewery[breweryName]) {
      beersByBrewery[breweryName] = []
    }
    beersByBrewery[breweryName].push(beer)
  })

  // Render star display for a rating
  const Stars = ({ rating }) => (
    <span className="mb-stars">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= rating ? 'mb-star filled' : 'mb-star empty'}>★</span>
      ))}
    </span>
  )

  return (
    <div className="mb-page">
      {/* Header bar — matches profile page */}
      <div className="mb-header">
        <button className="mb-back-btn" onClick={onBack}>← {t.back}</button>
        <h1 className="mb-title">{t.myBeersTitle || 'MY BEERS'}</h1>
      </div>

      <div className="mb-content">
        {/* Stats row */}
        <div className="mb-stats">
          <div className="mb-stat">
            <div className="mb-stat-num">{totalBeers}</div>
            <div className="mb-stat-label">{t.totalBeers}</div>
          </div>
          <div className="mb-stat">
            <div className="mb-stat-num">{uniqueBreweries}</div>
            <div className="mb-stat-label">{t.breweries}</div>
          </div>
          <div className="mb-stat mb-stat-star">
            <div className="mb-stat-num">{fiveStarBeers}</div>
            <div className="mb-stat-label">★ {t.fiveStars}</div>
          </div>
        </div>

        {beers.length === 0 ? (
          <div className="mb-empty">
            <p>{t.noBeerRatings}</p>
          </div>
        ) : (
          <>
            {/* Top Rated */}
            {topRated.length > 0 && (
              <div className="mb-top-section">
                <h2 className="mb-section-title">🏆 {t.topRatedBeers}</h2>
                <div className="mb-top-list">
                  {topRated.map((beer, idx) => {
                    const brewery = breweries.find(b => b.id === beer.breweryId || b.name === beer.breweryName)
                    return (
                      <div key={beer.id} className="mb-top-card" data-rank={idx + 1}>
                        <div className="mb-top-rank">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>
                        <div className="mb-top-info">
                          <div className="mb-top-name">{beer.name}</div>
                          <div className="mb-top-brewery">{brewery?.name || beer.breweryName}</div>
                        </div>
                        <Stars rating={beer.rating} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* All Beers by Brewery */}
            <div className="mb-all-section">
              <h2 className="mb-section-title">{t.allYourBeers}</h2>
              {Object.entries(beersByBrewery).map(([breweryName, breweryBeers]) => (
                <div key={breweryName} className="mb-brewery-card">
                  <div className="mb-brewery-header">
                    <span className="mb-brewery-name">{breweryName}</span>
                    <span className="mb-brewery-count">{breweryBeers.length} {breweryBeers.length === 1 ? t.beer : t.beers}</span>
                  </div>
                  <div className="mb-brewery-beers">
                    {breweryBeers.map(beer => (
                      <div key={beer.id} className="mb-beer-row">
                        <div className="mb-beer-info">
                          <span className="mb-beer-name">{beer.name}</span>
                          {beer.notes && <span className="mb-beer-notes">{beer.notes}</span>}
                        </div>
                        <Stars rating={beer.rating} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MyBeers
