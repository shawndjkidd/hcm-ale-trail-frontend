import { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom'

import HomePage from './components/HomePage'
import BreweryDetail from './components/BreweryDetail'
import FAQ from './components/FAQ'
import MyBeers from './components/MyBeers'
import WelcomeModal from './components/WelcomeModal'
import Leaderboard from './components/Leaderboard'
import translations from './translations'
import { recordCheckin } from './lib/supabase'
import './styles/App.css'

const BREWERIES = [
  { id: 1, name: 'BiaCraft', district: 'District 3', address: '1 Le Ngo Cat, Phuong Vo Thi Sau, Quan 3', description: 'Craft beer bar with a wide selection of local and international brews.', logo_url: '/logos/biacraft.png' },
  { id: 2, name: 'Heart of Darkness', district: 'District 1', address: '31D Ly Tu Trong, Ben Nghe, Quan 1', description: 'Award-winning craft brewery with bold, innovative beers.', logo_url: '/logos/hod.png' },
  { id: 3, name: 'Deme', district: 'District 1', address: '25 Ngo Thoi Nhiem, Ward 6, Quan 3', description: 'Hidden gem serving unique craft beers in a cozy setting.', logo_url: '/logos/deme.png' },
  { id: 4, name: 'Steersman', district: 'District 2', address: '34 Nguyen Van Dau, Thao Dien, Quan 2', description: 'Relaxed brewery with house-made beers and great food.', logo_url: '/logos/steersman.png' },
  { id: 5, name: 'East West Brewing', district: 'District 1', address: '181-185 Ly Tu Trong, Ben Thanh, Quan 1', description: 'Large brewpub with American-style craft beers brewed on-site.', logo_url: '/logos/eastwest.png' },
  { id: 6, name: 'Rooster Beers', district: 'District 1', address: '40 Bui Vien, Phuong Pham Ngu Lao, Quan 1', description: 'Backpacker favorite with affordable craft beer options.', logo_url: '/logos/rooster.png' },
  { id: 7, name: '7 Bridges Brewing Co.', district: 'District 1', address: '38 Dong Du, Ben Nghe, Quan 1', description: 'Cozy taproom with a focus on hop-forward beers.', logo_url: '/logos/7bridges.png' },
  { id: 8, name: 'Belgo Saigon', district: 'District 1', address: '29-31 Ton That Thiep, Ben Nghe, Quan 1', description: 'Belgian-style brewery with classic and creative brews.', logo_url: '/logos/belgo.png' }
]

function BreweryRoute({
  breweries,
  stamps,
  beers,
  addStamp,
  addBeer,
  language,
  onBack,
  qrValidated,
  timerStart,
  user
}) {
  const { id } = useParams()
  const breweryId = parseInt(id, 10)
  const brewery = breweries.find(b => b.id === breweryId)

  if (!brewery) return <Navigate to="/" replace />

  return (
    <BreweryDetail
      brewery={brewery}
      stamps={stamps}
      beers={beers}
      addStamp={addStamp}
      addBeer={addBeer}
      language={language}
      onBack={onBack}
      qrValidated={qrValidated}
      timerStart={timerStart}
      user={user}
    />
  )
}

function App() {
  const navigate = useNavigate()

  const [stamps, setStamps] = useState([])
  const [beers, setBeers] = useState([])
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

    if (savedStamps) setStamps(JSON.parse(savedStamps))
    if (savedBeers) setBeers(JSON.parse(savedBeers))
    if (savedLang) setLanguage(savedLang)
    if (savedTimerStart) setTimerStart(parseInt(savedTimerStart))
    if (savedTimerEnd) setTimerEnd(parseInt(savedTimerEnd))
    if (savedLeaderboard) setLeaderboardData(JSON.parse(savedLeaderboard))

    const urlParams = new URLSearchParams(window.location.search)
    const breweryIdParam = urlParams.get('brewery')

    if (breweryIdParam) {
      const brewery = BREWERIES.find(b => b.id === parseInt(breweryIdParam))
      if (brewery) {
        pendingQR.current = { brewery, breweryId: parseInt(breweryIdParam) }

        if (savedUser) {
          setQrValidated(true)
          setUser(JSON.parse(savedUser))
          setShowWelcome(false)
          navigate(`/brewery/${brewery.id}`, { replace: true })
        } else {
          setShowWelcome(true)
          // Wait for welcome completion, then navigate
        }
      }

      // Keep your old behavior: strip query param after reading it
      window.history.replaceState({}, '', window.location.pathname)
    } else {
      if (savedUser) {
        setUser(JSON.parse(savedUser))
        setShowWelcome(false)
      } else {
        setShowWelcome(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const breweryId = pendingQR.current.brewery.id
      setQrValidated(true)
      navigate(`/brewery/${breweryId}`, { replace: true })
      pendingQR.current = null
    } else {
      navigate('/', { replace: true })
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
    setQrValidated(false)
    navigate(`/brewery/${brewery.id}`)
  }

  const handleNavigate = (newView) => {
    if (newView === 'home') navigate('/')
    if (newView === 'brewery') navigate('/') // safety fallback
    if (newView === 'faq') navigate('/faq')
    if (newView === 'mybeers') navigate('/mybeers')
    if (newView === 'leaderboard') navigate('/leaderboard')
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
      navigate('/', { replace: true })
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

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              breweries={BREWERIES}
              stamps={stamps}
              language={language}
              setLanguage={setLanguage}
              onBreweryClick={handleBreweryClick}
              onNavigate={handleNavigate}
              resetCard={resetCard}
              user={user}
              timerStart={timerStart}
              timerEnd={timerEnd}
            />
          }
        />

        <Route
          path="/brewery/:id"
          element={
            <BreweryRoute
              breweries={BREWERIES}
              stamps={stamps}
              beers={beers}
              addStamp={addStamp}
              addBeer={addBeer}
              language={language}
              onBack={() => navigate('/')}
              qrValidated={qrValidated}
              timerStart={timerStart}
              user={user}
            />
          }
        />

        <Route
          path="/faq"
          element={<FAQ language={language} onBack={() => navigate('/')} />}
        />

        <Route
          path="/mybeers"
          element={
            <MyBeers
              beers={beers}
              breweries={BREWERIES}
              language={language}
              onBack={() => navigate('/')}
            />
          }
        />

        <Route
          path="/leaderboard"
          element={
            <Leaderboard
              language={language}
              onBack={() => navigate('/')}
              userTime={getUserCompletionTime()}
              leaderboardData={leaderboardData}
            />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
