import { useState } from 'react'
import translations from '../translations'
import AddBeerModal from './AddBeerModal'

const BREWERY_DATA = {
  'BiaCraft': {
    instagram: 'https://www.instagram.com/biacraftartisanales/',
    facebook: 'https://facebook.com/biacraft',
    maps: 'https://maps.app.goo.gl/jwRQhzZMzijiHYtN7',
    hashtag: '#hcmaletrail @biacraftartisanales'
  },
  'Heart of Darkness': {
    instagram: 'https://www.instagram.com/heartofdarknessbrewery/',
    facebook: 'https://facebook.com/HeartOfDarknessBrewery',
    maps: 'https://maps.app.goo.gl/ah6bzRWZhM6gz3C78',
    hashtag: '#hcmaletrail @heartofdarknessbrewery'
  },
  'Deme': {
    instagram: 'https://www.instagram.com/deme.brewing/',
    facebook: 'https://facebook.com/demebrewing',
    maps: 'https://maps.app.goo.gl/NMMSRCjDehDUvtD5A',
    hashtag: '#hcmaletrail @deme.brewing'
  },
  'Steersman': {
    instagram: 'https://www.instagram.com/steersmanbrewery/',
    facebook: 'https://facebook.com/steersmanbrewery',
    maps: 'https://maps.app.goo.gl/ZtHzaoCea36zqUdWA',
    hashtag: '#hcmaletrail @steersmanbrewery'
  },
  'East West Brewing': {
    instagram: 'https://www.instagram.com/eastwestbrewery/',
    facebook: 'https://facebook.com/eastwestbrewery',
    maps: 'https://maps.app.goo.gl/2CjzhfFS6h2qmNeq8',
    hashtag: '#hcmaletrail @eastwestbrewery'
  },
  'Rooster Beers': {
    instagram: 'https://www.instagram.com/rooster.beers/',
    facebook: 'https://www.facebook.com/theroosterbeers',
    maps: 'https://maps.app.goo.gl/kxQy9aCbHnchCScf8',
    hashtag: '#hcmaletrail @rooster.beers'
  },
  '7 Bridges Brewing Co.': {
    instagram: 'https://www.instagram.com/7bridgesbrewingco/',
    facebook: 'https://facebook.com/7BridgesBrewingCo',
    maps: 'https://www.google.com/maps/search/?api=1&query=38+Dong+Du+Ben+Nghe+Quan+1+Ho+Chi+Minh+City',
    hashtag: '#hcmaletrail @7bridgesbrewingco'
  },
  'Belgo Saigon': {
    instagram: 'https://www.instagram.com/belgo_belgianbrewery/',
    facebook: 'https://www.facebook.com/belgobelgiancraftbeerbrewery',
    maps: 'https://www.google.com/maps/search/?api=1&query=29-31+Ton+That+Thiep+Ben+Nghe+Quan+1+Ho+Chi+Minh+City',
    hashtag: '#hcmaletrail @belgo_belgianbrewery'
  }
}

function BreweryDetail({ brewery, stamps, beers, addStamp, addBeer, language, onBack }) {
  const [code, setCode] = useState('')
  const [message, setMessage] = useState(null)
  const [showAddBeer, setShowAddBeer] = useState(false)

  const t = translations[language]
  const isStamped = stamps.includes(brewery.id)
  const breweryBeers = beers.filter(b => b.breweryId === brewery.id)
  const breweryInfo = BREWERY_DATA[brewery.name] || {}

  const handleCodeSubmit = () => {
    if (!code.trim()) {
      setMessage({ type: 'error', text: t.invalidCode })
      return
    }

    if (code.trim() === brewery.secret_code) {
      if (isStamped) {
        setMessage({ type: 'info', text: t.alreadyCollected })
      } else {
        addStamp(brewery.id)
        setMessage({ type: 'success', text: `🎉 ${t.stampCollected}` })
      }
      setCode('')
    } else {
      setMessage({ type: 'error', text: t.invalidCode })
    }

    setTimeout(() => setMessage(null), 3000)
  }

  const copyHashtag = () => {
    const hashtag = breweryInfo.hashtag || `#hcmaletrail @${brewery.name.toLowerCase().replace(/\s/g, '')}`
    navigator.clipboard.writeText(hashtag)
    alert(`Copied: ${hashtag}`)
  }

  return (
    <div className="brewery-detail">
      <button className="back-btn" onClick={onBack}>← BACK</button>

      <div className="qr-instruction-box">
        <div className="qr-icon">📱</div>
        <div className="qr-instruction-text">
          <strong>{t.scanQRInstruction || "Scan QR code at brewery"}</strong>
          <p>{t.scanQRSubtext || "Use your phone camera to scan the QR code displayed at this brewery"}</p>
        </div>
      </div>

      <div className="brewery-info-card centered">
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
          📍 {t.directions}
        </a>
      )}

      <button 
        className="action-btn yellow"
        onClick={() => setShowAddBeer(true)}
      >
        🍺 {t.addBeer}
      </button>

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

      <div className="hashtag-section">
        <div className="hashtag-text">
          {breweryInfo.hashtag}
        </div>
        <button className="copy-btn" onClick={copyHashtag}>
          📋 COPY
        </button>
      </div>

      <div className="code-section">
        <h3 className="code-title">{t.code}</h3>
        <div className="code-input-container">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="* * * *"
            maxLength="4"
            className="code-input"
          />
          <button className="go-btn" onClick={handleCodeSubmit}>
            {t.go}
          </button>
        </div>
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>

      {showAddBeer && (
        <AddBeerModal
          brewery={brewery}
          addBeer={addBeer}
          language={language}
          onClose={() => setShowAddBeer(false)}
        />
      )}
    </div>
  )
}

export default BreweryDetail
