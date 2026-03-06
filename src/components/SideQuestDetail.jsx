import { useState, useEffect } from 'react'
import { getAccessToken } from '../lib/api'
import translations from '../translations'

const TRAIL_ID = '89e5e2d6-090b-448a-8e53-6d05b731a921'

function SideQuestDetail({ quest, isCompleted, onComplete, onBack, language, user, qrValidated }) {
  const [message, setMessage] = useState(null)
  const [manualCode, setManualCode] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [itemName, setItemName] = useState('')
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [wasAlreadyCompleted] = useState(isCompleted)
  const [hasCheckedIn, setHasCheckedIn] = useState(isCompleted)
  const [questDetail, setQuestDetail] = useState(quest)
  const [questEvents, setQuestEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)

  const t = translations[language]

  const getTitle = () => {
    const title = questDetail?.title
    if (!title) return 'Untitled Quest'
    if (typeof title === 'string') {
      const trimmed = title.trim()
      if (!trimmed || /^\d+$/.test(trimmed)) return 'Untitled Quest'
      return trimmed
    }
    if (typeof title === 'object' && !Array.isArray(title)) {
      const resolved = title[language] || title.en || title.vn
      if (!resolved || typeof resolved !== 'string' || /^\d+$/.test(resolved.trim())) return 'Untitled Quest'
      return resolved.trim()
    }
    return 'Untitled Quest'
  }

  const getDescription = () => {
    const desc = questDetail?.description
    if (typeof desc === 'string') return desc
    return desc?.[language] || desc?.en || ''
  }

  // Fetch full quest detail (for social URLs) and events on mount
  useEffect(() => {
    if (!quest?.id) return

    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/trails/${TRAIL_ID}/side-quests/${quest.id}`)
        const data = await res.json()
        const questData = data.sideQuest || data.quest
        if (data.ok && questData) {
          setQuestDetail(prev => ({ ...prev, ...questData }))
        }
      } catch {}
    }

    const fetchEvents = async () => {
      setEventsLoading(true)
      try {
        const res = await fetch(`/api/trails/${TRAIL_ID}/events?v=${Date.now()}`)
        const data = await res.json()
        if (data.ok && data.events) {
          setQuestEvents(data.events.filter(e => e.sideQuestId === quest.id))
        }
      } catch {}
      setEventsLoading(false)
    }

    fetchDetail()
    fetchEvents()
  }, [quest?.id])

  // Auto check-in when QR scanned
  useEffect(() => {
    if (qrValidated && !isCompleted && !hasCheckedIn) {
      handleQRCheckin()
    }
  }, [qrValidated])

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

  const handleQRCheckin = async () => {
    setIsChecking(true)
    try {
      const res = await fetch(`/api/side-quests/${quest.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: user?.id,
          method: 'qr_scan'
        })
      })
      const data = await res.json()
      if (data.ok) {
        setHasCheckedIn(true)
        onComplete(quest.id)
        setShowRatingModal(true)
      } else if (data.error === 'Already checked in to this side quest') {
        setHasCheckedIn(true)
        setMessage({ type: 'info', text: t.alreadyCheckedIn || 'Already checked in!' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Check-in failed' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (err) {
      console.error('Check-in error:', err)
      setMessage({ type: 'error', text: 'Connection error. Try again.' })
      setTimeout(() => setMessage(null), 3000)
    }
    setIsChecking(false)
  }

  const handleManualCode = async () => {
    if (!manualCode.trim()) {
      setMessage({ type: 'error', text: t.enterCode || 'Please enter a code' })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    setIsChecking(true)
    try {
      const res = await fetch(`/api/side-quests/${quest.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: user?.id,
          method: 'pin',
          pin: manualCode.trim()
        })
      })
      const data = await res.json()
      if (data.ok) {
        setHasCheckedIn(true)
        onComplete(quest.id)
        setManualCode('')
        setShowRatingModal(true)
      } else {
        setMessage({ type: 'error', text: data.error || t.invalidCode || 'Invalid code' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (err) {
      console.error('Check-in error:', err)
      setMessage({ type: 'error', text: 'Connection error. Try again.' })
      setTimeout(() => setMessage(null), 3000)
    }
    setIsChecking(false)
  }

  const handleSubmitRating = async () => {
    if (!itemName.trim()) {
      setMessage({ type: 'error', text: t.enterItemName || 'Please enter what you tried' })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    if (rating === 0) {
      setMessage({ type: 'error', text: t.selectRating || 'Please select a rating' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    try {
      const token = getAccessToken()
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`/api/side-quests/${quest.id}/ratings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rating,
          item_name: itemName.trim(),
          notes: notes.trim() || null,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!data?.ok) {
        console.error('Rating save failed:', data?.error)
      }
    } catch (err) {
      console.error('Rating error:', err)
    }

    setShowRatingModal(false)
    setMessage({ type: 'success', text: `🎉 ${t.questCompleted || 'Side Quest Completed!'}` })
    setTimeout(() => setMessage(null), 5000)
  }

  const copyInstagramHandle = () => {
    const handle = questDetail?.instagram_handle || questDetail?.instagramHandle
    if (!handle) return
    navigator.clipboard.writeText(handle)
    setMessage({ type: 'success', text: `✅ Copied: ${handle}` })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleSkipRating = () => {
    setShowRatingModal(false)
    setMessage({ type: 'success', text: `🎉 ${t.questCompleted || 'Side Quest Completed!'}` })
    setTimeout(() => setMessage(null), 5000)
  }

  return (
    <div className="brewery-detail side-quest-detail">
      <button className="back-btn" onClick={onBack}>← {t.back || 'BACK'}</button>

      {!hasCheckedIn && !isCompleted && !qrValidated && (
        <div className="stamp-instruction-box">
          <div className="stamp-icon">🗺️</div>
          <div className="stamp-instruction-text">
            <strong>{t.scanQRToComplete || 'SCAN THE QR CODE'}</strong>
            <p>{t.scanQRFirst || 'Scan the QR code at the venue to complete this quest'}</p>
          </div>
        </div>
      )}

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="brewery-info-card">
        <h1 className="brewery-title">{getTitle()}</h1>
        {questDetail?.address && (
          <p className="brewery-address">
            📍 {questDetail.address}{questDetail?.district ? `, ${questDetail.district}` : ''}
          </p>
        )}
        {questDetail?.reward && (
          <p className="brewery-description">🎁 {t.reward || 'Reward'}: <strong>{questDetail.reward}</strong></p>
        )}
        {getDescription() && (
          <p className="brewery-description">{getDescription()}</p>
        )}
      </div>

      {/* Upcoming Events */}
      <div className="brewery-events-section">
        <h3 className="brewery-events-title">{t.upcomingEvents || 'UPCOMING EVENTS'}</h3>
        {eventsLoading ? (
          <p className="events-loading-text">{t.loading || 'Loading...'}</p>
        ) : questEvents.length > 0 ? (
          questEvents.map(event => (
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

      {/* Social buttons */}
      <div className="brewery-buttons-row">
        {(questDetail?.maps_url || questDetail?.mapsUrl) && (
          <a href={questDetail.maps_url || questDetail.mapsUrl} target="_blank" rel="noopener noreferrer" className="action-btn green">
            {t.maps}
          </a>
        )}
        {(questDetail?.instagram_url || questDetail?.instagramUrl) && (
          <a href={questDetail.instagram_url || questDetail.instagramUrl} target="_blank" rel="noopener noreferrer" className="action-btn instagram-btn">
            {t.instagram}
          </a>
        )}
        {(questDetail?.facebook_url || questDetail?.facebookUrl) && (
          <a href={questDetail.facebook_url || questDetail.facebookUrl} target="_blank" rel="noopener noreferrer" className="action-btn facebook-btn">
            {t.facebook}
          </a>
        )}
      </div>

      {(questDetail?.instagram_handle || questDetail?.instagramHandle) && (
        <div className="hashtag-section">
          <div className="hashtag-text">
            {t.tag || 'Tag'}: {questDetail.instagram_handle || questDetail.instagramHandle}
          </div>
          <button className="copy-btn" onClick={copyInstagramHandle}>
            📋 {t.copyHandle || 'COPY HANDLE'}
          </button>
        </div>
      )}

      {(hasCheckedIn || isCompleted) ? (
        <div className="side-quest-completed-box">
          <div className="completed-icon">✅</div>
          <div className="completed-text">{wasAlreadyCompleted ? 'Already Completed ✓' : (t.questAlreadyCompleted || 'Quest Completed!')}</div>
          {questDetail?.reward && (
            <div className="completed-reward">
              {t.claimReward || 'Show this screen to claim your reward:'} <strong>{questDetail.reward}</strong>
            </div>
          )}
        </div>
      ) : (
        <div className="manual-code-section">
          <p className="code-label side-quest-code-label">{t.completeQuest || 'COMPLETE THIS QUEST'}</p>
          <p className="code-subtext">{t.enterQuestCode || 'Enter the code from the venue to check in'}</p>
          <div className="code-input-row">
            <input
              type="text"
              className="code-input"
              placeholder={t.enterCode || 'Enter code'}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength="4"
            />
            <button
              className="code-btn"
              onClick={handleManualCode}
              disabled={isChecking || manualCode.length !== 4}
            >
              {isChecking ? '...' : t.go || 'GO!'}
            </button>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="modal-overlay">
          <div className="add-beer-modal">
            <button className="modal-close" onClick={handleSkipRating}>✕</button>
            <h2 className="modal-title">{t.rateExperience || 'Rate Your Experience'}</h2>

            <div className="beer-input-group">
              <label>{t.whatDidYouTry || 'What did you try?'}</label>
              <input
                type="text"
                className="beer-name-input"
                placeholder={t.itemNamePlaceholder || 'e.g., Sake Flight, Ramen...'}
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>

            <div className="beer-rating-group">
              <label>{t.rating || 'Rating'}</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={`star-btn ${rating >= star ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <div className="beer-input-group">
              <label>{t.notes || 'Notes'} ({t.optional || 'optional'})</label>
              <textarea
                className="beer-notes-input"
                placeholder={t.notesPlaceholder || 'Any thoughts?'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="modal-buttons">
              <button className="skip-btn" onClick={handleSkipRating}>
                {t.skip || 'SKIP'}
              </button>
              <button className="submit-btn" onClick={handleSubmitRating}>
                {t.submit || 'SUBMIT'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SideQuestDetail
