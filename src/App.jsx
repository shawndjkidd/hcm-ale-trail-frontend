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

// Ho Chi Minh Ale Trail 2026 trail_id (Supabase UUID)
const TRAIL_ID = '89e5e2d6-090b-448a-8e53-6d05b731a921'

// IMPORTANT: These ids are UUIDs from your backend /breweries endpoint.
// display_order matches stop #1..#8
const BREWERIES = [
  {
    id: '8c3dc4f3-e100-4d63-be0e-ee8b65da8fee',
    display_order: 1,
    name: 'BiaCraft',
    district: 'District 3',
    address: '1 Le Ngo Cat, Phuong Vo Thi Sau, Quan 3',
    description: 'Craft beer bar with a wide selection of local and international brews.',
    logo_url: '/logos/biacraft.png',
  },
  {
    id: '3f80a715-b664-423d-a04d-3d22fcdeb339',
    display_order: 2,
    name: 'Heart of Darkness',
    district: 'District 1',
    address: '31D Ly Tu Trong, Ben Nghe, Quan 1',
    description: 'Award-winning craft brewery with bold, innovative beers.',
    logo_url: '/logos/hod.png',
  },
  {
    id: '6b29d3f2-6b0e-4404-af89-40d7bc7482c5',
    display_order: 3,
    name: 'Deme',
    district: 'District 3',
    address: '25 Ngo Thoi Nhiem, Ward 6, Quan 3',
    description: 'Hidden gem serving unique craft beers in a cozy setting.',
    logo_url: '/logos/deme.png',
  },
  {
    id: 'c1fb805f-4010-4e8c-85cf-634f6a681308',
    display_order: 4,
    name: 'Steersman',
    district: 'District 2',
    address: '34 Nguyen Van Dau, Thao Dien, Quan 2',
    description: 'Relaxed brewery with house-made beers and great food.',
    logo_url: '/logos/steersman.png',
  },
  {
    id: 'f094c3fc-e07d-4678-919a-923a6b80502a',
    display_order: 5,
    name: 'East West Brewing',
    district: 'District 1',
    address: '181-185 Ly Tu Trong, Ben Thanh, Quan 1',
    description: 'Large brewpub with American-style craft beers brewed on-site.',
    logo_url: '/logos/eastwest.png',
  },
  {
    id: '1ba7a599-f91c-425d-98e7-275dd0efbb06',
    display_order: 6,
    name: 'Rooster Beers',
    district: 'District 1',
    address: '40 Bui Vien, Phuong Pham Ngu Lao, Quan 1',
    description: 'Backpacker favorite with affordable craft beer options.',
    logo_url: '/logos/rooster.png',
  },
  {
    id: 'd098db66-258b-445e-ad92-c0e769b427c1',
    display_order: 7,
    name: '7 Bridges Brewing Co.',
    district: 'District 1',
    address: '38 Dong Du, Ben Nghe, Quan 1',
    description: 'Cozy taproom with a focus on hop-forward beers.',
    logo_url: '/logos/7bridges.png',
  },
  {
    id: '64393821-1783-4892-8b18-019898d170ce',
    display_order: 8,
    name: 'Belgo Saigon',
    district: 'District 1',
    address: '29-31 Ton That Thiep, Ben Nghe, Quan 1',
    description: 'Belgian-style brewery with classic and creative brews.',
    logo_url: '/logos/belgo.png',
  },
]

// map 1..8 -> UUID (for legacy ?brewery=1 QR style)
const ORDER_TO_ID = Object.fromEntries(BREWERIES.map(b => [String(b.display_order), b.id]))

function parseBreweryFromUrl() {
  // Supports:
  // 1) /brewery/<uuid>
  // 2) /brewery/<1-8>  (legacy numeric)
  // 3) ?brewery=<uuid> or ?brewery=<1-8>
  const pathname = window.location.pathname || '/'
  const qs = new URLSearchParams(window.location.search)

  // Path: /brewery/:id
  const m = pathname.match(/^\/brewery\/([^/]+)\/?$/i)
  if (m && m[1]) {
    const raw = decodeURIComponent(m[1]).trim()
    if (ORDER_TO_ID[raw]) return ORDER_TO_ID[raw] // numeric -> uuid
    return raw // uuid
  }

  // Query: ?brewery=
  const q = qs.get('brewery')
  if (q) {
    const raw = q.trim()
    if (ORDER_TO_ID[raw]) return ORDER_TO_ID[raw]
    return raw
  }

  return null
}

function App() {
  // stamps now store UUID strings
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

  useEffect(() => {
    const savedStamps = localStorage.getItem('hcm-stamps')
    const savedBeers = localStorage.getItem('hcm-beers')
    const savedLang = localStorage.getItem('hcm-language')
    const savedUser = localStorage.getItem('hcm-user')
    const savedTimerStart = localStorage.getItem('hcm-timer-start')
    const savedTimerEnd = localStorage.getItem('hcm-timer-end')
    const savedLeaderboard = localStorage.getItem('hcm-leaderboard')

    if (savedStamps) {
      try {
        const raw = JSON.parse(savedStamps)
        // migrate old numeric stamps [1,2,...] -> uuid stamps
        const migrated = (Array.isArray(raw) ? raw : [])
          .map((x) => {
            const s = String(x)
            if (ORDER_TO_ID[s]) return ORDER_TO_ID[s]
            return s
          })
          .filter(Boolean)
        setStamps(migrated)
      } catch {
        setStamps([])
      }
    }

    if (savedBeers) setBeers(JSON.parse(savedBeers))
    if (savedLang) setLanguage(savedLang)
    if (savedTimerStart) setTimerStart(parseInt(savedTimerStart))
    if (savedTimerEnd) setTimerEnd(parseInt(savedTimerEnd))
    if (savedLeaderboard) setLeaderboardData(JSON.parse(savedLeaderboard))

    // NEW: accept deep links via /brewery/<uuid> OR ?brewery=<uuid|1-8>
    const breweryId = parseBreweryFromUrl()

    if (breweryId) {
      const brewery = BREWERIES.find((b) => b.id === breweryId)
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

      // Clean URL after processing (nice UX)
      window.history.replaceState({}, '', '/')
    } else {
      if (savedUser) {
        setUser(JSON.parse(savedUser))
        setShowWelcome(false)
      } else {
        setShowWelcome(true)
      }
    }
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
    // breweryId should be UUID string
    if (!stamps.includes(breweryId)) {
      const newStamps = [...stamps, breweryId]
      setStamps(newStamps)

      if (user?.id) {
        try {
          // keep your existing integration – now storing UUID brewery ids
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
            completedAt: new Date().toISOString(),
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
  }

  const handleNavigate = (newView) => {
    setView(newView)
    if (newView !== 'brewery') {
      setSelectedBrewery(null)
      setQrValidated(false)
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
          beers={beers}
          onBreweryClick={handleBreweryClick}
          onNavigate={handleNavigate}
          onReset={resetCard}
          language={language}
          setLanguage={setLanguage}
          completionTime={getUserCompletionTime()}
        />
      )}

      {view === 'brewery' && selectedBrewery && (
        <BreweryDetail
          brewery={selectedBrewery}
          stamps={stamps}
          beers={beers}
          onAddStamp={addStamp}
          onAddBeer={addBeer}
          onNavigate={handleNavigate}
          qrValidated={qrValidated}
          language={language}
          setLanguage={setLanguage}
          trailId={TRAIL_ID}
        />
      )}

      {view === 'faq' && (
        <FAQ
          onNavigate={handleNavigate}
          language={language}
          setLanguage={setLanguage}
        />
      )}

      {view === 'mybeers' && (
        <MyBeers
          beers={beers}
          breweries={BREWERIES}
          onNavigate={handleNavigate}
          language={language}
          setLanguage={setLanguage}
        />
      )}

      {view === 'leaderboard' && (
        <Leaderboard
          leaderboardData={leaderboardData}
          onNavigate={handleNavigate}
          language={language}
          setLanguage={setLanguage}
        />
      )}
    </div>
  )
}

export default App
