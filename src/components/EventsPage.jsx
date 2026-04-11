import { useState, useEffect } from 'react'
import translations from '../translations'

const TRAIL_ID = '89e5e2d6-090b-448a-8e53-6d05b731a921'

// Demo events to show until real ones are added
const DEMO_EVENTS = [
  {
    id: 'demo-1',
    category: 'event',
    breweryName: 'BiaCraft',
    title: 'Craft Beer Trivia Night',
    description: 'Test your beer knowledge and win prizes. Teams of up to 4 people welcome.',
    startsAt: '2025-05-10T19:00:00+07:00',
    endsAt: '2025-05-10T22:00:00+07:00',
  },
  {
    id: 'demo-2',
    category: 'new_release',
    breweryName: 'Heart of Darkness',
    title: 'Kurtz IPA — Limited Release',
    description: 'A bold new West Coast IPA with tropical hop notes. First 50 pints get a free glass.',
    startsAt: '2025-05-15T17:00:00+07:00',
    endsAt: '2025-05-15T23:00:00+07:00',
  },
  {
    id: 'demo-3',
    category: 'event',
    breweryName: 'Rooster Beers',
    title: 'Live Music & BBQ Saturday',
    description: 'Local bands, smoked ribs, and cold craft beer. No cover charge.',
    startsAt: '2025-05-17T18:00:00+07:00',
    endsAt: '2025-05-17T23:30:00+07:00',
  },
]

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
      const res = await fetch(`/api/trails/${TRAIL_ID}/events?v=${Date.now()}`)
      const data = await res.json()
      if (data.ok) {
        // Use API events if available, otherwise show demo events
        setEvents(data.events && data.events.length > 0 ? data.events : DEMO_EVENTS)
      } else {
        setEvents(DEMO_EVENTS)
      }
    } catch (err) {
      console.error('Events fetch error:', err)
      setEvents(DEMO_EVENTS)
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

  return (
    <div className="ev-page">
      {/* Header */}
      <div className="ev-header">
        <button className="ev-back-btn" onClick={onClose}>← {t.back || 'BACK'}</button>
        <h1 className="ev-title">{t.upcomingBeerEvents || 'EVENTS'}</h1>
      </div>

      <div className="ev-content">
        {loading && (
          <div className="ev-loading">
            <div className="ev-spinner"></div>
            <p>{t.loading || 'Loading...'}</p>
          </div>
        )}

        {!loading && events.length === 0 && (
          <div className="ev-empty">
            <p>{t.noEvents || 'No upcoming events'}</p>
            <p className="ev-empty-sub">{t.checkBackSoon || 'Check back soon for new events!'}</p>
          </div>
        )}

        {!loading && events.length > 0 && (
          <div className="ev-list">
            {events.map((event) => (
              <div key={event.id} className={`ev-card ${event.category === 'new_release' ? 'ev-card-release' : ''}`}>
                <div className="ev-card-tag-row">
                  {event.category === 'new_release' ? (
                    <span className="ev-tag ev-tag-release">{t.newRelease || 'NEW RELEASE'}</span>
                  ) : (
                    <span className="ev-tag ev-tag-event">{t.event || 'EVENT'}</span>
                  )}
                </div>
                <div className="ev-card-venue">
                  {event.breweryName || 'Trail Event'}
                </div>
                <h3 className="ev-card-title">{getTitle(event)}</h3>
                {getDescription(event) && (
                  <p className="ev-card-desc">{getDescription(event)}</p>
                )}
                <div className="ev-card-datetime">
                  <span className="ev-card-date">{formatDate(event.startsAt)}</span>
                  <span className="ev-card-time">{formatTime(event.startsAt)}</span>
                  {event.endsAt && (
                    <span className="ev-card-time"> – {formatTime(event.endsAt)}</span>
                  )}
                </div>
                {event.link && (
                  <a
                    href={event.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ev-card-link"
                  >
                    {t.moreInfo || 'MORE INFO'} →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EventsPage
