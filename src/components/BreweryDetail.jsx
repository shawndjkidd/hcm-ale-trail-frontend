import { useState, useEffect } from 'react'
import translations from '../translations'
import AddBeerModal from './AddBeerModal'

// Sample events data (will come from Supabase later)
const SAMPLE_EVENTS = [
  { id: 1, title: 'Tap Takeover Night', date: 'Feb 28', time: '7:00 PM', breweryId: 1, description: 'Special guest taps from local breweries', link: 'https://facebook.com/events/123' },
  { id: 2, title: 'IPA Festival', date: 'Mar 5', time: '6:00 PM', breweryId: 2, description: '10+ IPAs on tap, live music', link: 'https://facebook.com/events/456' },
  { id: 3, title: 'Brew & Quiz Night', date: 'Mar 8', time: '8:00 PM', breweryId: 5, description: 'Trivia night with beer prizes', link: null },
  { id: 4, title: 'St. Patrick\'s Day Party', date: 'Mar 17', time: '5:00 PM', breweryId: 8, description: 'Green beer, Irish food, live music all night', link: 'https://facebook.com/events/789' },
  { id: 5, title: 'Meet the Brewer', date: 'Mar 1', time: '6:00 PM', breweryId: 1, description: 'Chat with our head brewer', link: null },
  { id: 6, title: 'Stout Day', date: 'Mar 15', time: '4:00 PM', breweryId: 2, description: 'All stouts 20% off', link: null },
]

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

function BreweryDetail({ brewery, stamps, beers, addStamp, addBeer, language, onBack, qrValidated, timerStart, user }) {
  const [showAddBeer, setShowAddBeer] = useState(false)
  const [message, setMessage] = useState(null)
  const [manualCode, setManualCode] = useState('')
  const [showSharePrompt, setShowSharePrompt] = useState(false)

  const t = translations[language]
  const isStamped = stamps.includes(brewery?.id)
  const breweryBeers = beers.filter(b => b.breweryId === brewery?.id)
  
  // Merge backend data with hardcoded social links (until backend provides these)
  const hardcodedInfo = BREWERY_DATA[brewery?.name] || {}
  const breweryInfo = {
    instagram: brewery?.instagram_url || hardcodedInfo.instagram,
    facebook: brewery?.facebook_url || hardcodedInfo.facebook,
    maps: brewery?.maps_url || hardcodedInfo.maps,
    instagramHandle: brewery?.instagram_handle || hardcodedInfo.instagramHandle,
    code: brewery?.manual_code || hardcodedInfo.code,
  }
  
  const isFirstStamp = stamps.length === 0
  
  // Map brewery names to order numbers (fallback if order field missing)
  const BREWERY_ORDER = {
    'BiaCraft': 1,
    'Heart of Darkness': 2,
    'Deme': 3,
    'Steersman': 4,
    'East West Brewing': 5,
    'Rooster Beers': 6,
    '7 Bridges Brewing Co.': 7,
    'Belgo Saigon': 8
  }
  
  // Get description in current language (with fallbacks)
  const getDescription = () => {
    // Get order number (from field or name mapping)
    const orderKey = brewery?.order || BREWERY_ORDER[brewery?.name]
    
    // 1. Try translation key first (brewery1Desc, brewery2Desc, etc.)
    if (orderKey && t[`brewery${orderKey}Desc`]) {
      return t[`brewery${orderKey}Desc`]
    }
    // 2. Try description_i18n for current language
    if (brewery?.description_i18n?.[language]) {
      return brewery.description_i18n[language]
    }
    // 3. Try description_i18n for English
    if (brewery?.description_i18n?.en) {
      return brewery.description_i18n.en
    }
    // 4. Try normalized description (already a string)
    if (typeof brewery?.description === 'string') {
      return brewery.description
    }
    // 5. Try description object directly (shouldn't happen after normalization)
    if (typeof brewery?.description === 'object' && brewery.description?.[language]) {
      return brewery.description[language]
    }
    if (typeof brewery?.description === 'object' && brewery.description?.en) {
      return brewery.description.en
    }
    // 6. Final fallback
    return ''
  }
  
  // Get events for this brewery
  const breweryEvents = SAMPLE_EVENTS.filter(e => e.breweryId === brewery?.id)

  useEffect(() => {
    if (qrValidated && !isStamped) {
      setShowAddBeer(true)
    }
  }, [qrValidated, isStamped])

  const handleBeerAdded = async (beer) => {
    addBeer(beer)
    
    if (!isStamped) {
      if (isFirstStamp) {
        setMessage({ 
          type: 'success', 
          text: `⏱️ ${t.timerStarted}` 
        })
        setTimeout(() => {
          setMessage({ 
            type: 'success', 
            text: `🎉 ${t.stampCollected} (1/8)` 
          })
          setTimeout(() => setMessage(null), 3000)
        }, 2000)
      } else {
        setMessage({ 
          type: 'success', 
          text: `🎉 ${t.stampCollected} (${stamps.length + 1}/8)` 
        })
        setTimeout(() => setMessage(null), 5000)
      }
      
      addStamp(brewery.id)
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
    const handle = breweryInfo.instagramHandle || `@${(brewery?.name || 'brewery').toLowerCase().replace(/\s/g, '')}`
    navigator.clipboard.writeText(handle)
    setMessage({ type: 'success', text: `✅ Copied: ${handle}` })
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="brewery-detail">
      <button className="back-btn" onClick={onBack}>← {t.back || 'BACK'}</button>

      {!isStamped && !qrValidated && (
        <div className="stamp-instruction-box">
          <div className="stamp-icon">🍺</div>
          <div className="stamp-instruction-text">
            <strong>{t.scanQRToCollect}</strong>
            <p>{t.scanFirst}</p>
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
              <strong>{t.shareYourExperience}</strong>
              <p>{t.shareInstructions}</p>
            </div>
            <button className="share-close" onClick={() => setShowSharePrompt(false)}>✕</button>
          </div>
          <div className="share-actions">
            <button className="share-btn copy" onClick={copyInstagramHandle}>
              📋 {t.copyHandle}
            </button>
            <a 
              href={breweryInfo.instagram} 
              target="_blank" 
              rel="noopener noreferrer"
              className="share-btn instagram"
            >
              📷 {t.instagram}
            </a>
          </div>
        </div>
      )}

      <div className="brewery-info-card">
        <h1 className="brewery-title">{brewery?.name || 'Brewery'}</h1>
        <p className="brewery-address">📍 {brewery?.address || ''}</p>
        <p className="brewery-description">{getDescription()}</p>
      </div>

      {/* Upcoming Events at this Brewery */}
      <div className="brewery-events-section">
        <h3 className="brewery-events-title">{t.upcomingEvents || 'UPCOMING EVENTS'}</h3>
        {breweryEvents.length > 0 ? (
          breweryEvents.map(event => (
            <div key={event.id} className="brewery-event-item">
              <div className="brewery-event-header">
                <span className="brewery-event-name">{event.title}</span>
                <span className="brewery-event-date">{event.date}</span>
              </div>
              <div className="brewery-event-time">🕐 {event.time}</div>
              {event.description && (
                <div className="brewery-event-desc">{event.description}</div>
              )}
              {event.link && (
                <a 
                  href={event.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="event-link-btn"
                  style={{ marginTop: '8px' }}
                >
                  {t.moreInfo || 'MORE INFO'}
                </a>
              )}
            </div>
          ))
        ) : (
          <p className="no-events">{t.noEvents || 'No upcoming events'}</p>
        )}
      </div>

      {/* Three buttons in a row */}
      <div className="brewery-buttons-row">
        {breweryInfo.maps && (
          <a 
            href={breweryInfo.maps} 
            target="_blank" 
            rel="noopener noreferrer"
            className="action-btn green"
          >
            {t.maps}
          </a>
        )}
        {breweryInfo.instagram && (
          <a 
            href={breweryInfo.instagram} 
            target="_blank" 
            rel="noopener noreferrer"
            className="action-btn instagram-btn"
          >
            {t.instagram}
          </a>
        )}
        {breweryInfo.facebook && (
          <a 
            href={breweryInfo.facebook} 
            target="_blank" 
            rel="noopener noreferrer"
            className="action-btn facebook-btn"
          >
            {t.facebook}
          </a>
        )}
      </div>

      {(qrValidated || isStamped) && (
        <button 
          className="action-btn yellow add-beer-cta"
          onClick={() => setShowAddBeer(true)}
        >
          🍺 {isStamped ? t.addAnotherBeer : t.addBeerNow}
        </button>
      )}

      <div className="hashtag-section">
        <div className="hashtag-text">
          {t.tag || "Tag"}: {breweryInfo.instagramHandle}
        </div>
        <button className="copy-btn" onClick={copyInstagramHandle}>
          📋 {t.copyHandle}
        </button>
      </div>

      {breweryBeers.length > 0 && (
        <div className="brewery-beers">
          <h3>{t.beersAt} {brewery?.name || 'this brewery'}:</h3>
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
          <p className="code-label">{t.codeBackup}</p>
          <p className="code-subtext">{t.codeBackupText}</p>
          <div className="code-input-row">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder={t.code || "Code"}
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