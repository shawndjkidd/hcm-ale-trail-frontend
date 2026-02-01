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
  const [theme, setTheme] = useState('color')
  const [trail, setTrail] = useState(null)
  const [breweries, setBreweries] = useState([])
  const [stamps, setStamps] = useState([])
  const [beers, setBeers] = useState([])
  const [loading, setLoading] = useState(true)
  const [qrValidated, setQrValidated] = useState(null)

  useEffect(() => {
    loadData()
    loadStampsFromStorage()
    loadBeersFromStorage()
    loadThemeFromStorage()
  }, [])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const breweryParam = urlParams.get('brewery')
    
    if (breweryParam && breweries.length > 0) {
      const breweryIndex = parseInt(breweryParam) - 1
      if (breweryIndex >= 0 && breweryIndex < brewer
