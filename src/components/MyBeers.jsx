import translations from '../translations'

function MyBeers({ beers, breweries, language, onBack }) {
  const t = translations[language]

  if (beers.length === 0) {
    return (
      <div className="my-beers-page">
        <button className="back-btn" onClick={onBack}>← BACK</button>
        <h1 className="page-title">{t.myBeersTitle}</h1>
        <div className="empty-state">
          {t.noBeerRatings}
        </div>
      </div>
    )
  }

  // Find top-rated beers (5 stars)
  const topRatedBeers = beers.filter(beer => beer.rating === 5)

  // Group beers by brewery
  const beersByBrewery = beers.reduce((acc, beer) => {
    if (!acc[beer.breweryName]) {
      acc[beer.breweryName] = []
    }
    acc[beer.breweryName].push(beer)
    return acc
  }, {})

  // Sort beers within each brewery by rating (highest first)
  Object.keys(beersByBrewery).forEach(breweryName => {
    beersByBrewery[breweryName].sort((a, b) => b.rating - a.rating)
  })

  return (
    <div className="my-beers-page">
      <button className="back-btn" onClick={onBack}>← BACK</button>
      <h1 className="page-title">{t.myBeersTitle}</h1>

      {/* TOP-RATED BEERS SECTION */}
      {topRatedBeers.length > 0 && (
        <div className="top-rated-section">
          <h2 className="section-title">
            🏆 {t.topRatedBeers || "YOUR TOP-RATED BEERS"}
          </h2>
          <div className="top-rated-list">
            {topRatedBeers.map(beer => (
              <div key={beer.id} className="top-rated-beer">
                <div className="beer-rating-large">
                  {'⭐'.repeat(beer.rating)}
                </div>
                <div className="beer-name-large">{beer.name}</div>
                <div className="beer-brewery-small">{beer.breweryName}</div>
                {beer.notes && (
                  <div className="beer-notes-small">{beer.notes}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BEERS GROUPED BY BREWERY */}
      <div className="beers-by-brewery-section">
        <h2 className="section-title">
          📋 {t.allYourBeers || "ALL YOUR BEERS"}
        </h2>
        {Object.keys(beersByBrewery).map(breweryName => (
          <div key={breweryName} className="brewery-group">
            <h3 className="brewery-group-title">
              🍺 {breweryName} ({beersByBrewery[breweryName].length} {beersByBrewery[breweryName].length === 1 ? (t.beer || 'beer') : (t.beers || 'beers')})
            </h3>
            <div className="brewery-group-beers">
              {beersByBrewery[breweryName].map(beer => (
                <div key={beer.id} className="grouped-beer-item">
                  <div className="grouped-beer-header">
                    <div className="grouped-beer-name">{beer.name}</div>
                    <div className="grouped-beer-rating">
                      {'⭐'.repeat(beer.rating)}
                    </div>
                  </div>
                  {beer.notes && (
                    <div className="grouped-beer-notes">{beer.notes}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="stats-summary">
        <div className="stat-item">
          <div className="stat-number">{beers.length}</div>
          <div className="stat-label">{t.totalBeers || "Total Beers"}</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{Object.keys(beersByBrewery).length}</div>
          <div className="stat-label">{t.breweries || "Breweries"}</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{topRatedBeers.length}</div>
          <div className="stat-label">{t.fiveStars || "5-Star Beers"}</div>
        </div>
      </div>
    </div>
  )
}

export default MyBeers
