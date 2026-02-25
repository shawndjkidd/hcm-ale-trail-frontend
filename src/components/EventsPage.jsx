import { useState, useEffect } from 'react'
import translations from '../translations'

const TRAIL_ID = '89e5e2d6-090b-448a-8e53-6d05b731a921'
const API_BASE = 'https://hcm-ale-trail-backend-flm8.vercel.app'

const BREWERY_LOGOS = {
  'BiaCraft': '/logos/biacraft.png',
  'Heart of Darkness': '/logos/hod.png',
  'Deme': '/logos/deme.png',
  'Steersman': '/logos/steersman.png',
  'East West Brewing': '/logos/eastwest.png',
  'Rooster Beers': '/logos/rooster.png',
  '7 Bridges Brewing Co.': '/logos/7bridges.png',
  '7 Bridges Brewing Co': '/logos/7bridges.png',
  'Belgo Saigon': '/logos/belgo.png',
}

function EventsPage({ language, onClose }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const t = translations[language]

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/trails/${TRAIL_ID}/events?v=${Date.now()}`)
      const data = await res.json()
      if (data.ok) {
        setEvents(data.events || [])
      } else {
        setError(data.error || 'Failed to load events')
      }
    } catch (err) {
      console.error('Events fetch error:', err)
      setError('Failed to load events')
    }
    setLoading(false)
  }

  const getTitle = (event) => {
    if (!event.title) return 'Untitled Event'
    if (typeof event.title === 'string') return event.title
    return event.title[language] || event.title.en || 'Untitled Event'
  }

  const getDescription = (event) => {
    if (!event.description) return null
    if (typeof event.description === 'string') return event.description
    return event.description[language] || event.description.en || null
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getBreweryLogo = (breweryName) => {
    if (!breweryName || breweryName === 'Trail Event') {
      return '/logos/HCM Logo-Ale-Trail-2023-BK.png'
    }
    return BREWERY_LOGOS[breweryName] || '/logos/HCM Logo-Ale-Trail-2023-BK.png'
  }

  return (
    <div className="events-page">
      <div className="events-page-header">
        <button className="events-back-btn" onClick={onClose}>
          ← {t.back || 'BACK'}
        </button>
        <h1 className="events-page-title">{t.upcomingBeerEvents || 'UPCOMING BEER EVENTS'}</h1>
      </div>

      <div className="events-page-content">
        {loading && (
          <div className="events-page-loading">
            <div className="events-spinner"></div>
            <p>{t.loading || 'Loading...'}</p>
          </div>
        )}

        {error && !loading && (
          <div className="events-page-error">{error}</div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="events-page-empty">
            <div className="events-empty-icon">🍻</div>
            <p>{t.noEvents || 'No upcoming events'}</p>
            <p className="events-empty-subtext">{t.checkBackSoon || 'Check back soon for new events!'}</p>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="events-page-list">
            {events.map((event) => (
              <div key={event.id} className="event-page-card">
                <div className="event-page-card-logo">
                  <img 
                    src={getBreweryLogo(event.breweryName)} 
                    alt={event.breweryName || 'Trail Event'}
                    onError={(e) => {
                      e.target.src = '/logos/HCM Logo-Ale-Trail-2023-BK.png'
                    }}
                  />
                </div>
                <div className="event-page-card-content">
                  <div className="event-page-card-venue">
                    {event.breweryName || 'Trail Event'}
                  </div>
                  <h3 className="event-page-card-title">{getTitle(event)}</h3>
                  {getDescription(event) && (
                    <p className="event-page-card-description">{getDescription(event)}</p>
                  )}
                  <div className="event-page-card-datetime">
                    <span className="event-page-card-date">{formatDate(event.startsAt)}</span>
                    <span className="event-page-card-time">{formatTime(event.startsAt)}</span>
                    {event.endsAt && (
                      <span className="event-page-card-time"> - {formatTime(event.endsAt)}</span>
                    )}
                  </div>
                  {event.link && (
                    <a 
                      href={event.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="event-page-card-link"
                    >
                      {t.moreInfo || 'MORE INFO'} →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EventsPage