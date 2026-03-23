import { useState, useEffect } from 'react'
import translations from '../translations'
import AddBeerModal from './AddBeerModal'

const TRAIL_ID = '89e5e2d6-090b-448a-8e53-6d05b731a921'

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

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const DAY_LABELS = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  vn: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  kr: ['일', '월', '화', '수', '목', '금', '토'],
  jp: ['日', '月', '火', '水', '木', '金', '土']
}

function BreweryDetail({ brewery, stamps, beers, addStamp, addBeer, language, onBack, qrValidated, timerStart, user, autoOpenBeer = false, onAutoOpenComplete }) {
  const [showAddBeer, setShowAddBeer] = useState(false)
  const [message, setMessage] = useState(null)
  const [breweryEvents, setBreweryEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)

  const t = translations[language]
  const isStamped = stamps.includes(brewery?.id)
  const isTempClosed = brewery?.status === 'temporarily_closed'
  const breweryBeers = beers.filter(b =>
    b.breweryId === brewery?.id || b.breweryName === brewery?.name
  )

  const hardcodedInfo = BREWERY_DATA[brewery?.name] || {}
  const breweryInfo = {
    instagram: brewery?.instagram_url || brewery?.instagramUrl || hardcodedInfo.instagram || null,
    facebook: brewery?.facebook_url || brewery?.facebookUrl || hardcodedInfo.facebook || null,
    maps: brewery?.maps_url || brewery?.mapsUrl || hardcodedInfo.maps || null,
    instagramHandle: brewery?.instagram_handle || brewery?.instagramHandle || hardcodedInfo.instagramHandle,
    code: brewery?.manual_code || brewery?.manualCode || hardcodedInfo.code,
  }

  const isFirstStamp = stamps.length === 0

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

  const getDescription = () => {
    const orderKey = brewery?.order || BREWERY_ORDER[brewery?.name]
    if (orderKey && t[`brewery${orderKey}Desc`]) {
      return t[`brewery${orderKey}Desc`]
    }
    if (brewery?.description_i18n?.[language]) {
      return brewery.description_i18n[language]
    }
    if (brewery?.description_i18n?.en) {
      return brewery.description_i18n.en
    }
    if (typeof brewery?.description === 'string') {
      return brewery.description
    }
    if (typeof brewery?.description === 'object' && brewery.description?.[language]) {
      return brewery.description[language]
    }
    if (typeof brewery?.description === 'object' && brewery.description?.en) {
      return brewery.description.en
    }
    return ''
  }

  // Fetch events for this brewery
  useEffect(() => {
    if (brewery?.id) {
      fetchBreweryEvents()
    }
  }, [brewery?.id])

  const fetchBreweryEvents = async () => {
    setEventsLoading(true)
    try {
      const res = await fetch(`/api/trails/${TRAIL_ID}/events?v=${Date.now()}`)
      const data = await res.json()
      if (data.ok && data.events) {
        // Filter events for this brewery
        const filtered = data.events.filter(e => e.breweryId === brewery.id)
        setBreweryEvents(filtered)
      }
    } catch (err) {
      console.error('Failed to fetch brewery events:', err)
    }
    setEventsLoading(false)
  }

  // Check if brewery is open now
  const isOpenNow = () => {
    const hours = brewery?.operatingHours || brewery?.operating_hours
    if (!hours) return null

    const now = new Date()
    const dayName = DAY_NAMES[now.getDay()]
    const todayHours = hours[dayName]

    if (!todayHours || todayHours.closed) return false

    const currentTime = now.getHours() * 60 + now.getMinutes()
    const [openHour, openMin] = (todayHours.open || '00:00').split(':').map(Number)
    const [closeHour, closeMin] = (todayHours.close || '23:59').split(':').map(Number)

    const openTime = openHour * 60 + openMin
    let closeTime = closeHour * 60 + closeMin

    // Handle midnight crossover (e.g., closes at 01:00)
    if (closeTime < openTime) {
      closeTime += 24 * 60
      if (currentTime < openTime) {
        return currentTime + 24 * 60 >= openTime && currentTime + 24 * 60 <= closeTime
      }
    }

    return currentTime >= openTime && currentTime <= closeTime
  }

  const formatTime = (time) => time === '00:00' ? 'Midnight' : time

  // Format hours for display
  const formatHours = () => {
    const hours = brewery?.operatingHours || brewery?.operating_hours
    if (!hours) return null

    const dayLabels = DAY_LABELS[language] || DAY_LABELS.en
    const result = []

    DAY_NAMES.forEach((day, index) => {
      const dayHours = hours[day]
      if (dayHours) {
        if (dayHours.closed) {
          result.push({ day: dayLabels[index], hours: t.closed || 'Closed' })
        } else {
          result.push({ day: dayLabels[index], hours: `${formatTime(dayHours.open)} - ${formatTime(dayHours.close)}` })
        }
      }
    })

    return result
  }

  const getEventTitle = (event) => {
    if (!event.title) return 'Event'
    if (typeof event.title === 'string') return event.title
    return event.title[language] || event.title.en || 'Event'
  }

  const getEventDescription = (event) => {
    if (!event.description) return null
    if (typeof event.description === 'string') return event.description
    return event.description[language] || event.description.en || null
  }

  const formatEventDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' })
  }

  const formatEventTime = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  }

  // Auto-open modal for QR check-in flow
  useEffect(() => {
    if (autoOpenBeer && !isStamped) {
      setShowAddBeer(true);
    }
  }, [autoOpenBeer]);

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
    if (autoOpenBeer && typeof onAutoOpenComplete === 'function') {
      onAutoOpenComplete();
    }
  }

  const copyInstagramHandle = () => {
    const handle = breweryInfo.instagramHandle || `@${(brewery?.name || 'brewery').toLowerCase().replace(/\s/g, '')}`
    navigator.clipboard.writeText(handle)
    setMessage({ type: 'success', text: `✅ Copied: ${handle}` })
    setTimeout(() => setMessage(null), 3000)
  }

  const openStatus = isOpenNow()
  const hoursData = formatHours()

  return (
    <div className="brewery-detail">
      <button className="back-btn" onClick={onBack}>← {t.back || 'BACK'}</button>

      {isTempClosed && (
        <div className="brewery-closed-notice">
          <div className="brewery-closed-stamp">{t.temporarilyClosed || 'TEMPORARILY CLOSED'}</div>
          <p className="brewery-closed-subtext">{t.temporarilyClosedSubtext || 'This venue is temporarily closed. Check back soon.'}</p>
        </div>
      )}

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="brewery-info-card" style={{ position: 'relative', overflow: 'hidden' }}>
        {isTempClosed && (
          <div className="brewery-closed-diagonal-overlay">
            <span>TEMPORARILY CLOSED</span>
          </div>
        )}
        <h1 className="brewery-title">{brewery?.name || 'Brewery'}</h1>
        <p className="brewery-address">📍 {brewery?.address || ''}</p>

        {/* Open/Closed Status */}
        {openStatus !== null && (
          <div className={`brewery-open-status ${openStatus ? 'open' : 'closed'}`}>
            {openStatus ? (t.openNow || '🟢 Open Now') : (t.closedNow || '🔴 Closed')}
          </div>
        )}

        <p className="brewery-description">{getDescription()}</p>
      </div>

      {/* Operating Hours */}
      {hoursData && hoursData.length > 0 && (
        <div className="brewery-hours-section">
          <h3 className="brewery-hours-title">{t.hours || 'HOURS'}</h3>
          <div className="brewery-hours-grid">
            {hoursData.map((item, index) => (
              <div key={index} className="brewery-hours-row">
                <span className="brewery-hours-day">{item.day}</span>
                <span className="brewery-hours-time">{item.hours}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events at this Brewery */}
      <div className="brewery-events-section">
        <h3 className="brewery-events-title">{t.upcomingEvents || 'UPCOMING EVENTS'}</h3>
        {eventsLoading ? (
          <p className="events-loading-text">{t.loading || 'Loading...'}</p>
        ) : breweryEvents.length > 0 ? (
          breweryEvents.map(event => (
            <div key={event.id} className="brewery-event-item">
              <div className="brewery-event-header">
                <span className="brewery-event-name">{getEventTitle(event)}</span>
                <span className="brewery-event-date">{formatEventDate(event.startsAt)}</span>
              </div>
              <div className="brewery-event-time">🕐 {formatEventTime(event.startsAt)}</div>
              {getEventDescription(event) && (
                <div className="brewery-event-desc">{getEventDescription(event)}</div>
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

      {!isTempClosed && (
        <button
          className="action-btn yellow add-beer-cta"
          onClick={() => setShowAddBeer(true)}
        >
          🍺 {isStamped ? t.addAnotherBeer : (t.checkIn || 'CHECK IN & RATE A BEER')}
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

      {showAddBeer && (
        <AddBeerModal
          brewery={brewery}
          onSave={handleBeerAdded}
          language={language}
          onClose={() => setShowAddBeer(false)}
          mandatory={autoOpenBeer && !isStamped}
          breweryCode={breweryInfo.code}
          isAlreadyStamped={isStamped}
        />
      )}
    </div>
  )
}

export default BreweryDetail
