import { useState, useEffect } from 'react'
import HomePage from './components/HomePage'
import BreweryDetail from './components/BreweryDetail'
import MyBeers from './components/MyBeers'
import FAQ from './components/FAQ'
import translations from './translations'

const API_URL = 'https://aletrail-platform.vercel.app/api'

function App() {
  const [currentView, setCurrentView] = useState('home')
  const [selectedBrewery, setSelectedBrewery] = useState(null)
  const [language, setLanguage] = useState('en')
  const [trail, setTrail] = useState(null)
  const [breweries, setBreweries] = useState([])
  const [stamps, setStamps] = useState([])
  const [beers, setBeers] = useState([])
  const [loading, setLoading] = useState(true)
  const [qrValidated, setQrValidated] = useState(null) // Track which brewery was scanned

  useEffect(() => {
    loadData()
    loadStampsFromStorage()
    loadBeersFromStorage()
  }, [])

  useEffect(() => {
    // Check for URL parameters from QR code scan
    const urlParams = new URLSearchParams(window.location.search)
    const breweryParam = urlParams.get('brewery')
    
    if (breweryParam && breweries.length > 0) {
      const breweryIndex = parseInt(breweryParam) - 1
      if (breweryIndex >= 0 && breweryIndex < breweries.length) {
        const brewery = breweries[breweryIndex]
        setQrValidated(brewery.id) // Mark this brewery as QR-validated
        navigate('brewery', brewery)
        // Clean URL without reloading
        window.history.replaceState({}, '', window.location.pathname)
      }
    }
  }, [breweries])

  const loadData = async () => {
    try {
      const trailRes = await fetch(`${API_URL}/trails/hcm`)
      const trailData = await trailRes.json()
      
      if (trailData.success) {
        setTrail(trailData.trail)
      }

      const breweriesRes = await fetch(`${API_URL}/breweries?trail=hcm`)
      const breweriesData = await breweriesRes.json()
      
      if (breweriesData.success) {
        setBreweries(breweriesData.breweries)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  const loadStampsFromStorage = () => {
    const saved = localStorage.getItem('hcm-ale-trail-stamps')
    if (saved) {
      setStamps(JSON.parse(saved))
    }
  }

  const loadBeersFromStorage = () => {
    const saved = localStorage.getItem('hcm-ale-trail-beers')
    if (saved) {
      setBeers(JSON.parse(saved))
    }
  }

  const addStamp = (breweryId) => {
    if (!stamps.includes(breweryId)) {
      const newStamps = [...stamps, breweryId]
      setStamps(newStamps)
      localStorage.setItem('hcm-ale-trail-stamps', JSON.stringify(newStamps))
    }
  }

  const addBeer = (beer) => {
    const newBeers = [...beers, { ...beer, id: Date.now(), timestamp: new Date().toISOString() }]
    setBeers(newBeers)
    localStorage.setItem('hcm-ale-trail-beers', JSON.stringify(newBeers))
  }

  const navigate = (view, brewery = null) => {
    setCurrentView(view)
    setSelectedBrewery(brewery)
    window.scrollTo(0, 0)
  }

  const handleBreweryClick = (brewery) => {
    // When clicked from home page (not QR scan), don't validate
    setQrValidated(null)
    navigate('brewery', brewery)
  }

  const resetCard = () => {
    if (window.confirm(translations[language].resetConfirm)) {
      localStorage.removeItem('hcm-ale-trail-stamps')
      localStorage.removeItem('hcm-ale-trail-beers')
      setStamps([])
      setBeers([])
      alert(translations[language].resetSuccess)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>{translations[language].loading}</p>
      </div>
    )
  }

  return (
    <div className="app">
      {currentView === 'home' && (
        <HomePage 
          trail={trail}
          breweries={breweries}
          stamps={stamps}
          language={language}
          setLanguage={setLanguage}
          onBreweryClick={handleBreweryClick}
          onNavigate={navigate}
          resetCard={resetCard}
        />
      )}
      
      {currentView === 'brewery' && selectedBrewery && (
        <BreweryDetail 
          brewery={selectedBrewery}
          stamps={stamps}
          beers={beers}
          addStamp={addStamp}
          addBeer={addBeer}
          language={language}
          onBack={() => navigate('home')}
          qrValidated={qrValidated === selectedBrewery.id}
        />
      )}
      
      {currentView === 'mybeers' && (
        <MyBeers 
          beers={beers}
          breweries={breweries}
          language={language}
          onBack={() => navigate('home')}
        />
      )}
      
      {currentView === 'faq' && (
        <FAQ 
          language={language}
          onClose={() => navigate('home')}
        />
      )}
    </div>
  )
}

export default App
