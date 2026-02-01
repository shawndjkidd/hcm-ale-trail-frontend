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
