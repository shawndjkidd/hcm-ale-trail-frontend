import { useState, useEffect, useRef } from 'react'
import HomePage from './components/HomePage'
import BreweryDetail from './components/BreweryDetail'
import FAQ from './components/FAQ'
import MyBeers from './components/MyBeers'
import WelcomeModal from './components/WelcomeModal'
import Leaderboard from './components/Leaderboard'
import translations from './translations'
import { recordCheckin } from './lib/supabase'
import './styles/App.css'

// IMPORTANT: These ids are UUIDs from your backend /breweries endpoint.
const BREWERIES = [
  { id: '8c3dc4f3-e100-4d63-be0e-ee8b65da8fee', name: 'BiaCraft', district: 'District 3', address: '1 Le Ngo Cat, Phuong Vo Thi Sau, Quan 3', description: 'Craft beer bar with a wide selection of local and international brews.', logo_url: '/logos/biacraft.png' },
  { id: '3f80a715-b664-423d-a04d-3d22fcdeb339', name: 'Heart of Darkness', district: 'District 1', address: '31D Ly Tu Trong, Ben Nghe, Quan 1', description: 'Award-winning craft brewery with bold, innovative beers.', logo_url: '/logos/hod.png' },
  { id: '6b29d3f2-6b0e-4404-af89-40d7bc7482c5', name: 'Deme', district: 'District 3', address: '25 Ngo Thoi Nhiem, Ward 6, Quan 3', description: 'Hidden gem serving unique craft beers in a cozy setting.', logo_url: '/logos/deme.png' },
  { id: 'c1fb805f-4010-4e8c-85cf-634f6a681308', name: 'Steersman', district: 'TBD', address: '34 Nguyen Van Dau, Thao Dien, Quan 2', description: 'Relaxed brewery with house-made beers and great food.', logo_url: '/logos/steersman.png' },
  { id: 'f094c3fc-e07d-4678-919a-923a6b80502a', name: 'East West Brewing', district: 'TBD', address: '181-185 Ly Tu Trong, Ben Thanh, Quan 1', description: 'Large brewpub with American-style craft beers brewed on-site.', logo_url: '/logos/eastwest.png' },
  { id: '1ba7a599-f91c-425d-98e7-275dd0efbb06', name: 'Rooster Beers', district: 'TBD', address: '40 Bui Vien, Phuong Pham Ngu Lao, Quan 1', description: 'Backpacker favorite with affordable craft beer options.', logo_url: '/logos/rooster.png' },
  { id: 'd098db66-258b-445e-ad92-c0e769b427c1', name: '7 Bridges Brewing Co.', district: 'TBD', address: '38 Dong Du, Ben Nghe, Quan 1', description: 'Cozy taproom with a focus on hop-forward beers.', logo_url: '/logos/7bridges.png' },
  { id: '64393821-1783-4892-8b18-019898d170ce', name: 'Belgo Saigon', district: 'TBD', address: '29-31 Ton That Thiep, Ben Nghe, Quan 1', description: 'Belgian-style brewery with classic and creative brews.', logo_url: '/logos/belgo.png' }
]

// Accepts BOTH:
// - /brewery/<uuid>
// - ?brewery=<uuid> (legacy)
function parseBreweryFromUrl() {
  try {
    const path = window.location.pathname || '/'
    const parts = path.split('/').filter(Boolean)

    // /brewery/<uuid>
    if (parts.length >= 2 && parts[0] === 'brewery') {
      const id = parts[1]
      if (id && id.length >= 10) return id
    }

    // legacy: ?brewery=<uuid>
    const urlParams = new URLSearchParams(window.location.search)
    const q = urlParams.get('brewery')
    if (q && q.length >= 10) return q

    return null
  } catch {
    return null
  }
}

function App() {
  const [stamps, setStamps] = useState([])
  const [beers, setBeers] = useState([])
  const [selectedBrewery, setSelectedBrewery] = useState(null)
  const [view, setView] = useState('home')
  const [language, setLanguage] = useState('en')
  const [qrValidated, setQrValidated] = useState(false)
  const [user, setUser] = useState(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const [timerStart, setTimerStart] = useState(null)
  const [timerEnd, setTimerEnd] = useState(null)
  const [leaderboardData, setLeaderboardData] = useState([])

  const pendingQR = useRef(null)
  const t = translations[language]

  // HARD "go home" (state + URL)
  const goHome = () => {
    setSelectedBrewery(null)
    setQrValidated(false)
    setView('home')

    // Reset URL so refresh doesn't stick you on a brewery
    try {
      window.history.pushState({}, '', '/')
    } catch {}
  }

  useEffect(() => {
    const savedStamps = localStorage.getItem('hcm-stamps')
    const savedBeers = localStorage.getItem('hcm-beers')
    const savedLang = localStorage.getItem('hcm-language')
    const savedUser = localStorage.getItem('hcm-user')
    const savedTimerStart = localStorage.getItem('hcm-timer-start')
    const savedTimerEnd = localStorage.getItem('hcm-timer-end')
    const savedLeaderboard = localStorage.getItem('hcm-leaderboard')

    if (savedStamps) setStamps(JSON.parse(savedStamps))
    if (savedBeers) setBeers(JSON.parse(savedBeers))
    if (savedLang) setLanguage(savedLang)
    if (savedTimerStart) setTimerStart(parseInt(savedTimerStart))
    if (savedTimerEnd) setTimerEnd(parseInt(savedTimerEnd))
    if (savedLeaderboard) setLeaderboardData(JSON.parse(savedLeaderboard))

    const breweryId = parseBreweryFromUrl()

    if (breweryId) {
      const brewery = BREWERIES.find(b => b.id === breweryId)
      if (brewery) {
        pendingQR.current = { brewery, breweryId }

        if (savedUser) {
          setSelectedBrewery(brewery)
          setQrValidated(true)
          setView('brewery')
          setUser(JSON.parse(savedUser))
          setShowWelcome(false)
        } else {
          setShowWelcome(true)
        }
      }
    } else {
      if (savedUser) {
        setUser(JSON.parse(savedUser))
        setShowWelcome(false)
      } else {
        setShowWelcome(true)
      }
    }

    // If user presses browser back/forward, keep UI in sync
    const onPop = () => {
      const id = parseBreweryFromUrl()
      if (id) {
        const b = BREWERIES.find(x => x.id === id)
        if (b) {
          setSelectedBrewery(b)
          setView('brewery')
          return
        }
      }
      setSelectedBrewery(null)
      setView('home')
    }

    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    localStorage.setItem('hcm-stamps', JSON.stringify(stamps))
  }, [stamps])

  useEffect(() => {
    localStorage.setItem('hcm-beers', JSON.stringify(beers))
  }, [beers])

  useEffect(() => {
    localStorage.setItem('hcm-language', language)
  }, [language])

  const handleUserRegistration = (userData) => {
    setUser(userData)
    setShowWelcome(false)

    if (userData.isExisting && userData.existingStamps && userData.existingStamps.length > 0) {
      setStamps(userData.existingStamps)
      localStorage.setItem('hcm-stamps', JSON.stringify(userData.existingStamps))
    }

    if (pendingQR.current) {
      setSelectedBrewery(pendingQR.current.brewery)
      setQrValidated(true)
      setView('brewery')
      pendingQR.current = null
    }
  }

  const addStamp = async (breweryId) => {
    if (!stamps.includes(breweryId)) {
      const newStamps = [...stamps, breweryId]
      setStamps(newStamps)

      if (user?.id) {
        try {
          const { error } = await recordCheckin(user.id, breweryId, 'qr_scan')
          if (error) {
            console.log('Error saving check-in to Supabase:', error)
          } else {
            console.log('Check-in saved to Supabase for brewery:', breweryId)
          }
        } catch (err) {
          console.log('Check-in error:', err)
        }
      }

      if (newStamps.length === 1 && !timerStart) {
        const startTime = Date.now()
        setTimerStart(startTime)
        localStorage.setItem('hcm-timer-start', startTime.toString())
      }

      if (newStamps.length === 8 && timerStart && !timerEnd) {
        const endTime = Date.now()
        setTimerEnd(endTime)
        localStorage.setItem('hcm-timer-end', endTime.toString())

        if (user) {
          const completionTime = endTime - timerStart
          const newEntry = {
            id: Date.now(),
            name: user.name,
            time: completionTime,
            completedAt: new Date().toISOString()
          }
          const updatedLeaderboard = [...leaderboardData, newEntry]
          setLeaderboardData(updatedLeaderboard)
          localStorage.setItem('hcm-leaderboard', JSON.stringify(updatedLeaderboard))
        }
      }
    }
  }

  const addBeer = (beer) => {
    setBeers([...beers, { ...beer, id: Date.now() }])
  }

  const handleBreweryClick = (brewery) => {
    setSelectedBrewery(brewery)
    setQrValidated(false)
    setView('brewery')

    // Put a nice URL in the bar (works with vercel rewrite)
    try {
      window.history.pushState({}, '', `/brewery/${brewery.id}`)
    } catch {}
  }

  const handleNavigate = (newView) => {
    setView(newView)
    if (newView !== 'brewery') {
      setSelectedBrewery(null)
      setQrValidated(false)
      if (newView === 'home') {
        try {
          window.history.pushState({}, '', '/')
        } catch {}
      }
    }
  }

  const resetCard = () => {
    if (window.confirm(t.resetConfirm)) {
      setStamps([])
      setBeers([])
      setTimerStart(null)
      setTimerEnd(null)
      localStorage.removeItem('hcm-stamps')
      localStorage.removeItem('hcm-beers')
      localStorage.removeItem('hcm-hat-claimed')
      localStorage.removeItem('hcm-timer-start')
      localStorage.removeItem('hcm-timer-end')
      alert(t.resetSuccess)
    }
  }

  const getUserCompletionTime = () => {
    if (timerStart && timerEnd) {
      return timerEnd - timerStart
    }
    return null
  }

  if (!BREWERIES.length) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>{t.loading}</p>
      </div>
    )
  }

  return (
    <div className="app">
      {showWelcome && (
        <WelcomeModal
          language={language}
          setLanguage={setLanguage}
          onComplete={handleUserRegistration}
        />
      )}

      {view === 'home' && (
        <HomePage
          breweries={BREWERIES}
          stamps={stamps}
          onBreweryClick={handleBreweryClick}
          onNavigate={handleNavigate}
          onReset={resetCard}
          language={language}
          setLanguage={setLanguage}
          user={user}
          timerStart={timerStart}
          timerEnd={timerEnd}
        />
      )}

      {view === 'brewery' && selectedBrewery && (
        <BreweryDetail
          brewery={selectedBrewery}
          breweries={BREWERIES}
          stamps={stamps}
          beers={beers}
          addStamp={addStamp}
          addBeer={addBeer}
          qrValidated={qrValidated}
          setQrValidated={setQrValidated}
          onBack={goHome}
          language={language}
          user={user}
        />
      )}

      {view === 'faq' && (
        <FAQ
          onBack={() => handleNavigate('home')}
          language={language}
          user={user}
        />
      )}

      {view === 'beers' && (
        <MyBeers
          beers={beers}
          onBack={() => handleNavigate('home')}
          language={language}
        />
      )}

      {view === 'leaderboard' && (
        <Leaderboard
          leaderboard={leaderboardData}
          user={user}
          completionTime={getUserCompletionTime()}
          onBack={() => handleNavigate('home')}
          language={language}
        />
      )}
    </div>
  )
}

export default App
