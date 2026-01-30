import { useState, useEffect } from 'react'
import HomePage from './components/HomePage'
import BreweryList from './components/BreweryList'
import StampCollection from './components/StampCollection'

const API_URL = 'https://aletrail-platform.vercel.app/api'

function App() {
  const [currentView, setCurrentView] = useState('home')
  const [trail, setTrail] = useState(null)
  const [breweries, setBreweries] = useState([])
  const [stamps, setStamps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    loadStampsFromStorage()
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

  const addStamp = (breweryId) => {
    if (!stamps.includes(breweryId)) {
      const newStamps = [...stamps, breweryId]
      setStamps(newStamps)
      localStorage.setItem('hcm-ale-trail-stamps', JSON.stringify(newStamps))
    }
  }

  const navigate = (view) => {
    setCurrentView(view)
    window.scrollTo(0, 0)
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading Saigon's finest breweries...</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="logo" onClick={() => navigate('home')}>
            HCM ALE TRAIL
          </h1>
          <nav className="nav">
            <button 
              className={currentView === 'home' ? 'active' : ''} 
              onClick={() => navigate('home')}
            >
              Home
            </button>
            <button 
              className={currentView === 'breweries' ? 'active' : ''} 
              onClick={() => navigate('breweries')}
            >
              Breweries
            </button>
            <button 
              className={`stamp-btn ${currentView === 'stamps' ? 'active' : ''}`}
              onClick={() => navigate('stamps')}
            >
              <span className="stamp-count">{stamps.length}/{breweries.length}</span>
              Stamps
            </button>
          </nav>
        </div>
      </header>

      <main className="main-content">
        {currentView === 'home' && (
          <HomePage 
            trail={trail} 
            breweries={breweries}
            stamps={stamps}
            onExplore={() => navigate('breweries')}
          />
        )}
        
        {currentView === 'breweries' && (
          <BreweryList 
            breweries={breweries}
            stamps={stamps}
          />
        )}
        
        {currentView === 'stamps' && (
          <StampCollection 
            breweries={breweries}
            stamps={stamps}
            addStamp={addStamp}
          />
        )}
      </main>

      <footer className="footer">
        <p>© 2026 HCM Ale Trail • Discover Saigon's Craft Beer Scene</p>
      </footer>
    </div>
  )
}

export default App
