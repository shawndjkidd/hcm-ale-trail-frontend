import { useState, useEffect } from 'react'
import HomePage from './components/HomePage'
import BreweryDetail from './components/BreweryDetail'
import MyBeers from './components/MyBeers'
import FAQ from './components/FAQ'
import translations from './translations'

const API_URL = 'https://aletrail-platform.vercel.app/api'

function App() {
  const [currentView, setCurrentView] = useState('home') // home, brewery, mybeers, faq
  const [selectedBrewery, setSelectedBrewery] = useState(null)
  const [language, setLanguage] = useState('en')
  const [trail, setTrail] = useState(null)
  const [breweries, setBreweries] = useState([])
  const [stamps, setStamps] = useState([])
  const [beers, setBeers] = useState([]) // All rated beers
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    loadStampsFromStorage()
    loadBeersFromStorage()
  }, [])

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
          onBreweryClick={(brewery) => navigate('brewery', brewery)}
          onNavigate={navigate}
          resetCard={resetCard}
        />
      )}
      
      {currentView === 'brewery' && selectedBrewery && (
        <BreweryDetail 
          brewery={selectedBrewery}
          stamps={stamps}
