import { useState } from 'react'
import translations from '../translations'
import AddBeerModal from './AddBeerModal'

const BREWERY_DATA = {
  'BiaCraft': {
    instagram: 'https://www.instagram.com/biacraftartisanales/',
    facebook: 'https://facebook.com/biacraft',
    maps: 'https://www.google.com/maps/search/?api=1&query=BiaCraft+Saigon',
    hashtag: '#hcmaletrail @biacraftartisanales',
    code: '1234'
  },
  'Heart of Darkness': {
    instagram: 'https://www.instagram.com/heartofdarknessbrewery/',
    facebook: 'https://facebook.com/HeartOfDarknessBrewery',
    maps: 'https://www.google.com/maps/search/?api=1&query=Heart+of+Darkness+Brewery+Saigon',
    hashtag: '#hcmaletrail @heartofdarknessbrewery',
    code: '5678'
  },
  'Deme': {
    instagram: 'https://www.instagram.com/deme.brewing/',
    facebook: 'https://facebook.com/demebrewing',
    maps: 'https://www.google.com/maps/search/?api=1&query=Deme+Brewing+Saigon',
    hashtag: '#hcmaletrail @deme.brewing',
    code: '9012'
  },
  'Steersman': {
    instagram: 'https://www.instagram.com/steersmanbrewery/',
    facebook: 'https://facebook.com/steersmanbrewery',
    maps: 'https://www.google.com/maps/search/?api=1&query=Steersman+Brewery+Saigon',
    hashtag: '#hcmaletrail @steersmanbrewery',
    code: '3456'
  },
  'East West Brewing': {
    instagram: 'https://www.instagram.com/eastwestbrewery/',
    facebook: 'https://facebook.com/eastwestbrewery',
    maps: 'https://www.google.com/maps/search/?api=1&query=East+West+Brewing+Saigon',
    hashtag: '#hcmaletrail @eastwestbrewery',
    code: '7890'
  },
  'Rooster Beers': {
    instagram: 'https://www.instagram.com/rooster.beers/',
    facebook: 'https://www.facebook.com/theroosterbeers',
    maps: 'https://www.google.com/maps/search/?api=1&query=Rooster+Beers+Saigon',
    hashtag: '#hcmaletrail @rooster.beers',
    code: '2468'
  },
  '7 Bridges Brewing Co.': {
    instagram: 'https://www.instagram.com/7bridgesbrewingco/',
    facebook: 'https://facebook.com/7BridgesBrewingCo',
    maps: 'https://www.google.com/maps/search/?api=1&query=7+Bridges+Brewing+Co+Saigon',
    hashtag: '#hcmaletrail @7bridgesbrewingco',
    code: '1357'
  },
  'Belgo Saigon': {
    instagram: 'https://www.instagram.com/belgo_belgianbrewery/',
    facebook: 'https://www.facebook.com/belgobelgiancraftbeerbrewery',
    maps: 'https://www.google.com/maps/search/?api=1&query=Belgo+Saigon',
    hashtag: '#hcmaletrail @belgo_belgianbrewery',
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

  const handleBeerAdded = (beer) => {
    // Add the beer
    addBeer(beer)
    
    // Auto-stamp if not already stamped
    if (!isStamped) {
      addStamp(brewery.id)
      setMessage({ 
        type: 'success', 
        text: `🎉 ${t.stampCollected} (${stamps.length + 1}/8)` 
      })
      setTimeout(() => setMessage(null), 5000)
    }
    
    setShowAddBeer(false)
    
    // Show share prompt after successful check-in
    setShowSharePrompt(true)
  }

  const handleManualCode = () => {
    const correctCode = breweryInfo.code
    if (manualCode.trim() === correctCode) {
      // Code is correct - allow them to add beer
      setShowAddBeer(true)
      setManualCode('')
    } else {
      setMessage({ type: 'error', text: t.invalidCode || 'Invalid code. Try again!' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const copyHashtag = () => {
    const hashtag = breweryInfo.hashtag || `#hcmaletrail @${brewery.name.toLowerCase().replace(/\s/g, '')}`
    navigator.clipboard.writeText(hashtag)
    setMessage({ type: 'success', text: `✅ Copied: ${hashtag}` })
    setTimeout(() => setMessage(null), 3000)
  }

  const shareToInstagram = () => {
    const hashtag = breweryInfo.hashtag || `#hcmaletrail @${brewery.name.toLowerCase().replace(/\s/g, '')}`
    // Copy hashtag first
    navigator.clipboard.writeText(hashtag)
    
    // Try to open Instagram
    const instagramUrl = `instagram://camera`
    const instagramWebUrl = `https://www.instagram.com/`
    
    window.location.href = instagramUrl
    
    // Fallback to web after a delay
    setTimeout(() => {
      window.open(instagramWebUrl, '_blank')
    }, 500)
  }

  return (
    <div className="brewery-detail">
      <button className="back-btn" onClick={onBack}>← BACK</button>

      {/* INSTRUCTION BOX - Shows if NOT stamped AND NOT QR validated */}
      {!isStamped && !qrValidated && (
        <div className="stamp-instruction-box">
          <div className="stamp-icon">🍺</div>
          <div className="stamp-instruction-text">
            <strong>{t.scanQRToCollect || "Scan the QR code at the brewery to collect your stamp!"}</strong>
            <p>{t.scanFirst || "Scan the QR code first to check in your beer"}</p>
          </div>
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* SHARE PROMPT - Shows after successful check-in */}
      {showSharePrompt && (
        <div className="share-prompt">
          <div className="share-prompt-header">
            <span className="share-icon">📸</span>
            <div className="share-text">
              <strong>{t.shareYourExperience || "Share Your Experience!"}</strong>
              <p>{t.shareInstructions || "Take a pic, copy the hashtag, and post on Instagram"}</p>
            </div>
            <button className="share-close" onClick={() => setShowSharePrompt(false)}>✕</button>
          </div>
          <div className="share-actions">
            <button className="share-btn copy" onClick={copyHashtag}>
              📋 {t.copyHashtag || "COPY HASHTAG"}
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
          📍 {t.directions || "DIRECTIONS"}
        </a>
      )}

      {/* ADD BEER BUTTON - Only shows if QR validated OR already stamped */}
      {(qrValidated || isStamped) && (
        <button 
          className="action-btn yellow add-beer-cta"
          onClick={() => setShowAddBeer(true)}
        >
          🍺 {isStamped ? (t.addAnotherBeer || t.addBeer) : (t.addBeerNow || "ADD BEER NOW!")}
        </button>
      )}

      {/* SOCIAL MEDIA BUTTONS */}
      <div className="brewery-social">
        {breweryInfo.instagram && (
          <a 
            href={breweryInfo.instagram} 
            target="_blank" 
            rel="noopener noreferrer"
            className="social-btn instagram"
          >
            📷 IG
          </a>
        )}
        {breweryInfo.facebook && (
          <a 
            href={breweryInfo.facebook} 
            target="_blank" 
            rel="noopener noreferrer"
            className="social-btn facebook"
          >
            👍 FB
          </a>
        )}
      </div>

      {/* HASHTAG SECTION */}
      <div className="hashtag-section">
        <div className="hashtag-text">
          {breweryInfo.hashtag}
        </div>
        <button className="copy-btn" onClick={copyHashtag}>
          📋 COPY
        </button>
      </div>

      {/* BEERS LIST */}
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

      {/* MANUAL CODE ENTRY - Shows if not validated and not stamped */}
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
