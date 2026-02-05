import { useState, useEffect } from 'react'
import translations from '../translations'
import AddBeerModal from './AddBeerModal'

const BREWERY_DATA = {
  'BiaCraft': {
    instagram: 'https://www.instagram.com/biacraftartisanales/',
    facebook: 'https://facebook.com/biacraft',
    maps: 'https://www.google.com/maps/search/?api=1&query=1+Le+Ngo+Cat+Phuong+Vo+Thi+Sau+Quan+3+Ho+Chi+Minh+City',
    instagramHandle: '@biacraftartisanales',
    code: '1234'
  },
  'Heart of Darkness': {
    instagram: 'https://www.instagram.com/heartofdarknessbrewery/',
    facebook: 'https://facebook.com/HeartOfDarknessBrewery',
    maps: 'https://maps.app.goo.gl/ah6bzRWZhM6gz3C78',
    instagramHandle: '@heartofdarknessbrewery',
    code: '5678'
  },
  'Deme': {
    instagram: 'https://www.instagram.com/deme.brewing/',
    facebook: 'https://facebook.com/demebrewing',
    maps: 'https://maps.app.goo.gl/NMMSRCjDehDUvtD5A',
    instagramHandle: '@deme.brewing',
    code: '9012'
  },
  'Steersman': {
    instagram: 'https://www.instagram.com/steersmanbrewery/',
    facebook: 'https://facebook.com/steersmanbrewery',
    maps: 'https://maps.app.goo.gl/ZtHzaoCea36zqUdWA',
    instagramHandle: '@steersmanbrewery',
    code: '3456'
  },
  'East West Brewing': {
    instagram: 'https://www.instagram.com/eastwestbrewery/',
    facebook: 'https://facebook.com/eastwestbrewery',
    maps: 'https://maps.app.goo.gl/2CjzhfFS6h2qmNeq8',
    instagramHandle: '@eastwestbrewery',
    code: '7890'
  },
  'Rooster Beers': {
    instagram: 'https://www.instagram.com/rooster.beers/',
    facebook: 'https://www.facebook.com/theroosterbeers',
    maps: 'https://www.google.com/maps/search/?api=1&query=40+Bui+Vien+Phuong+Pham+Ngu+Lao+Quan+1+Ho+Chi+Minh+City',
    instagramHandle: '@rooster.beers',
    code: '2468'
  },
  '7 Bridges Brewing Co.': {
    instagram: 'https://www.instagram.com/7bridgesbrewingco/',
    facebook: 'https://facebook.com/7BridgesBrewingCo',
    maps: 'https://www.google.com/maps/search/?api=1&query=38+Dong+Du+Ben+Nghe+Quan+1+Ho+Chi+Minh+City',
    instagramHandle: '@7bridgesbrewingco',
    code: '1357'
  },
  'Belgo Saigon': {
    instagram: 'https://www.instagram.com/belgo_belgianbrewery/',
    facebook: 'https://www.facebook.com/belgobelgiancraftbeerbrewery',
    maps: 'https://www.google.com/maps/search/?api=1&query=29-31+Ton+That+Thiep+Ben+Nghe+Quan+1+Ho+Chi+Minh+City',
    instagramHandle: '@belgo_belgianbrewery',
    code: '9753'
  }
}

function BreweryDetail({ brewery, stamps, beers, addStamp, addBeer, language, onBack, qrValidated }) {
  const [showAddBeer, setShowAddBeer] = useState(false)
  const [message, setMessage] = useState(null)
  const [manualCode, setManualCode] = useState('')
  const [showSharePrompt, setShowSharePrompt] = useState(false)

  const t = translations[language]
  const isStamped = stamps.includes(brewery.id)
  const breweryBeers = beers.filter(b => b.breweryId === brewery.id)
  const breweryInfo = BREWERY_DATA[brewery.name] || {}

  useEffect(() => {
    if (qrValidated && !isStamped) {
      setShowAddBeer(true)
    }
  }, [qrValidated, isStamped])

  const handleBeerAdded = (beer) => {
    addBeer(beer)
    
    if (!isStamped) {
      addStamp(brewery.id)
      setMessage({ 
        type: 'success', 
        text: `🎉 ${t.stampCollected} (${stamps.length + 1}/8)` 
      })
      setTimeout(() => setMessage(null), 5000)
    }
    
    setShowAddBeer(false)
    setShowSharePrompt(true)
  }

  const handleManualCode = () => {
    const correctCode = breweryInfo.code
    if (manualCode.trim() === correctCode) {
      setShowAddBeer(true)
      setManualCode('')
    } else {
      setMessage({ type: 'error', text: t.invalidCode || 'Invalid code. Try again!' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const copyInstagramHandle = () => {
    const handle = breweryInfo.instagramHandle || `@${brewery.name.toLowerCase().replace(/\s/g, '')}`
    navigator.clipboard.writeText(handle)
    setMessage({ type: 'success', text: `✅ Copied: ${handle}` })
    setTimeout(() => setMessage(null), 3000)
  }

  const shareToInstagram = () => {
    const handle = breweryInfo.instagramHandle || `@${brewery.name.toLowerCase().replace(/\s/g, '')}`
    navigator.clipboard.writeText(handle)
    
    const instagramUrl = `instagram://camera`
    const instagramWebUrl = `https://www.instagram.com/`
    
    window.location.href = instagramUrl
    
    setTimeout(() => {
      window.open(instagramWebUrl, '_blank')
    }, 500)
  }

  return (
    <div className="brewery-detail">
      <button className="back-btn" onClick={onBack}>← BACK</button>

      {!isStamped && !qrValidated && (
        <div className="stamp-instruction-box">
          <div className="stamp-icon">🍺</div>
          <div className="stamp-instruction-text">
            <strong>{t.scanQRToCollect || "Scan the QR code at the brewery to collect your stamp!"}</strong>
            <p>{t.scanFirst || "Scan the QR code first to check in your beer"}</p>
          </div>
        </div>
      )}

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {showSharePrompt && (
        <div className="share-prompt">
          <div className="share-prompt-header">
            <span className="share-icon">📸</span>
            <div className="share-text">
              <strong>{t.shareYourExperience || "Share Your Experience!"}</strong>
              <p>{t.shareInstructions || "Take a pic, tag the brewery, and post on Instagram"}</p>
            </div>
            <button className="share-close" onClick={() => setShowSharePrompt(false)}>✕</button>
          </div>
          <div className="share-actions">
            <button className="share-btn copy" onClick={copyInstagramHandle}>
              📋 {t.copyHandle || "COPY @HANDLE"}
            </button>
            <button className="share-btn instagram" onClick={shareToInstagram}>
              📷 {t.postToInstagram || "POST TO INSTAGRAM"}
            </button>
          </div>
        </div>
      )}

      <div className="brewery-info-card">
        <h1 className="brewery-title">{brewery.name}</h1>
        <p className="brewery-address">📍 {brewery.address}</p>
        <p className="brewery-description">{brewery.description}</p>
      </div>

      {breweryInfo.maps && (
        <a 
          href={breweryInfo.maps} 
          target="_blank" 
          rel="noopener noreferrer"
          className="action-btn green"
        >
          📍 {t.findOnMaps || "Find me on Google Maps"}
        </a>
      )}

      {(qrValidated || isStamped) && (
        <button 
          className="action-btn yellow add-beer-cta"
          onClick={() => setShowAddBeer(true)}
        >
          🍺 {isStamped ? (t.addAnotherBeer || t.addBeer) : (t.addBeerNow || "ADD BEER NOW!")}
        </button>
      )}

      {breweryInfo.instagram && (
        <a 
          href={breweryInfo.instagram} 
          target="_blank" 
          rel="noopener noreferrer"
          className="action-btn instagram-btn"
        >
          📷 INSTAGRAM
        </a>
      )}
      {breweryInfo.facebook && (
        <a 
          href={breweryInfo.facebook} 
          target="_blank" 
          rel="noopener noreferrer"
          className="action-btn facebook-btn"
        >
          👍 FACEBOOK
        </a>
      )}

      <div className="hashtag-section">
        <div className="hashtag-text">
          Tag: {breweryInfo.instagramHandle}
        </div>
        <button className="copy-btn" onClick={copyInstagramHandle}>
          📋 COPY HANDLE
        </button>
      </div>

      {breweryBeers.length > 0 && (
        <div className="brewery-beers">
          <h3>{t.beersAt} {brewery.name}:</h3>
          {breweryBeers.map(beer => (
            <div key={beer.id} className="beer-item">
              <div className="beer-name">{beer.name}</div>
              <div className="beer-rating">
                {'⭐'.repeat(beer.rating)}
              </div>
            </div>
          ))}
        </div>
      )}

      {!qrValidated && !isStamped && (
        <div className="manual-code-section">
          <p className="code-label">{t.codeBackup || "Backup: Enter Code"}</p>
          <p className="code-subtext">{t.codeBackupText || "If QR scan doesn't work, ask staff for the code"}</p>
          <div className="code-input-row">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Code"
              maxLength="4"
              className="code-input"
            />
            <button className="code-btn" onClick={handleManualCode}>
              {t.go || "GO!"}
            </button>
          </div>
        </div>
      )}

      {showAddBeer && (
        <AddBeerModal
          brewery={brewery}
          onSave={handleBeerAdded}
          language={language}
          onClose={() => setShowAddBeer(false)}
        />
      )}
    </div>
  )
}

export default BreweryDetail
