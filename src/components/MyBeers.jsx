import translations from '../translations'

function MyBeers({ beers, breweries, language, onBack }) {
  const t = translations[language]

  return (
    <div className="my-beers-page">
      <button className="back-btn" onClick={onBack}>← BACK</button>

      <h1 className="page-title">🍺 {t.myBeersTitle} ({beers.length})</h1>

      {beers.length === 0 ? (
        <div className="empty-state">
          <p>{t.noBeerRatings}</p>
        </div>
      ) : (
        <div className="beer-list">
          {beers.map(beer => (
            <div key={beer.id} className="beer-card">
              <h3 className="beer-name">{beer.name}</h3>
              <p className="beer-brewery">{beer.breweryName}</p>
              <div className="beer-rating">
                {'⭐'.repeat(beer.rating)}{'☆'.repeat(5 - beer.rating)}
              </div>
              {beer.notes && (
                <p className="beer-notes">{beer.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyBeers
