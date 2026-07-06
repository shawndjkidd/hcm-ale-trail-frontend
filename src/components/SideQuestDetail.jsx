import { useState, useEffect, useRef } from 'react'
import { getAccessToken } from '../lib/api'
import translations from '../translations'

const TRAIL_ID = '89e5e2d6-090b-448a-8e53-6d05b731a921'

function SideQuestDetail({ quest, isCompleted, onComplete, onBack, language, user, qrValidated }) {
  const [message, setMessage] = useState(null)
  const [isChecking, setIsChecking] = useState(false)
  const [wasAlreadyCompleted] = useState(isCompleted)
  const [hasCheckedIn, setHasCheckedIn] = useState(isCompleted)
  const [questDetail, setQuestDetail] = useState(quest)
  const [questEvents, setQuestEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)

  // Check-in modal state
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [step, setStep] = useState(1) // 1 = rate, 2 = PIN
  const [itemName, setItemName] = useState('')
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')

  // PIN state
  const [pinDigits, setPinDigits] = useState(['', '', '', ''])
  const [pinError, setPinError] = useState(false)
  const [pinShake, setPinShake] = useState(false)
  const [pinErrorMsg, setPinErrorMsg] = useState('')
  const pinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]

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

  // Auto-open check-in modal when QR scanned
  useEffect(() => {
    if (qrValidated && !isCompleted && !hasCheckedIn) {
      setShowCheckinModal(true)
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

  // Step 1: Validate rating, move to PIN step
  const handleRatingSubmit = () => {
    if (!itemName.trim()) {
      alert(t.enterItemName || 'Please enter what you tried')
      return
    }
    if (rating === 0) {
      alert(t.selectRating || 'Please select a rating')
      return
    }
    setStep(2)
    setPinDigits(['', '', '', ''])
    setPinError(false)
    setPinErrorMsg('')
    setTimeout(() => pinRefs[0]?.current?.focus(), 100)
  }

  // PIN digit input handling
  const handlePinChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...pinDigits]
    newDigits[index] = digit
    setPinDigits(newDigits)
    setPinError(false)
    setPinErrorMsg('')

    if (digit && index < 3) {
      pinRefs[index + 1]?.current?.focus()
    }

    if (digit && index === 3) {
      const fullPin = [...newDigits.slice(0, 3), digit].join('')
      if (fullPin.length === 4) {
        setTimeout(() => validateAndSubmit(fullPin), 150)
      }
    }
  }

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinRefs[index - 1]?.current?.focus()
    }
  }

  const handlePinSubmit = () => {
    const fullPin = pinDigits.join('')
    if (fullPin.length === 4 && !isChecking) {
      validateAndSubmit(fullPin)
    }
  }

  // Validate PIN via backend — sends rating in same request, never compares PIN client-side
  const validateAndSubmit = async (pin) => {
    setIsChecking(true)
    try {
      const token = getAccessToken()
      const res = await fetch('/api/side-quests/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          questId: quest.id,
          pin,
          beerName: itemName.trim(),
          rating,
          notes: notes.trim() || null,
        }),
      })
      const data = await res.json()

      if (data.ok) {
        setHasCheckedIn(true)
        onComplete(quest.id)
        setShowCheckinModal(false)
        setMessage({ type: 'success', text: `🎉 ${t.questCompleted || 'Side Quest Completed!'}` })
        setTimeout(() => setMessage(null), 5000)
      } else {
        const msg = res.status === 429
          ? (t.tooManyAttempts || 'Too many attempts. Try again later.')
          : (t.invalidCode || 'Invalid code. Try again!')
        setPinErrorMsg(msg)
        setPinError(true)
        setPinShake(true)
        setPinDigits(['', '', '', ''])
        setTimeout(() => {
          setPinShake(false)
          pinRefs[0]?.current?.focus()
        }, 500)
      }
    } catch (err) {
      console.error('Check-in error:', err)
      setMessage({ type: 'error', text: 'Connection error. Try again.' })
      setTimeout(() => setMessage(null), 3000)
    }
    setIsChecking(false)
  }

  const handleBackToStep1 = () => {
    setStep(1)
    setPinDigits(['', '', '', ''])
    setPinError(false)
    setPinErrorMsg('')
  }

  const copyInstagramHandle = () => {
    const handle = questDetail?.instagram_handle || questDetail?.instagramHandle
    if (!handle) return
    navigator.clipboard.writeText(handle)
    setMessage({ type: 'success', text: `✅ Copied: ${handle}` })
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="brewery-detail side-quest-detail">
      <button className="back-btn" onClick={onBack}>← {t.back || 'BACK'}</button>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Quest Info Card */}
      <div className="brewery-info-card">
        <h1 className="brewery-title">{getTitle()}</h1>
        {questDetail?.address && (
          <p className="brewery-address">
            📍 {questDetail.address}{questDetail?.district ? `, ${questDetail.district}` : ''}
          </p>
        )}
        {questDetail?.reward && (
          <p className="brewery-description">🎁 {t.reward || 'Reward'}: <strong>{t.rewardMap?.[questDetail.reward] || questDetail.reward}</strong></p>
        )}
        {getDescription() && (
          <p className="brewery-description">{getDescription()}</p>
        )}
      </div>

      {/* CHECK IN button */}
      {!hasCheckedIn && !isCompleted ? (
        <button
          className="action-btn yellow add-beer-cta"
          onClick={() => { setStep(1); setShowCheckinModal(true); }}
        >
          🗺️ {t.checkInQuest || 'CHECK IN & RATE'}
        </button>
      ) : (
        <div className="side-quest-completed-box">
          <div className="completed-icon">✅</div>
          <div className="completed-text">{wasAlreadyCompleted ? 'Already Completed ✓' : (t.questAlreadyCompleted || 'Quest Completed!')}</div>
          {questDetail?.reward && (
            <div className="completed-reward">
              {t.claimReward || 'Show this screen to claim your reward:'} <strong>{t.rewardMap?.[questDetail.reward] || questDetail.reward}</strong>
            </div>
          )}
        </div>
      )}

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
                <a href={event.link} target="_blank" rel="noopener noreferrer" className="event-link-btn" style={{ marginTop: '8px' }}>
                  {t.moreInfo || 'MORE INFO'}
                </a>
              )}
            </div>
          ))
        ) : (
          <p className="no-events">{t.noEvents || 'No upcoming events'}</p>
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

      {/* Two-step check-in modal: Rate → PIN */}
      {showCheckinModal && (
        <div className="fullscreen-takeover-yellow">
          <div className="modal-content">
            <button className="modal-back-nav" onClick={() => { if (step === 2) { handleBackToStep1() } else { setShowCheckinModal(false) } }}>← {t.back || 'BACK'}</button>

            {step === 1 && (
              <>
                <h2>{t.rateExperience || 'RATE YOUR EXPERIENCE'}</h2>
                <p className="modal-subtitle">{getTitle()}</p>

                <div className="form-group">
                  <label>{t.whatDidYouTry || 'What did you try?'}</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder={t.itemNamePlaceholder || 'e.g., Sake Flight, Ramen...'}
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label>{t.rating || 'Rating'}</label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        className={`star ${rating >= star ? 'active' : ''}`}
                        onClick={() => setRating(star)}
                      >
                        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                          <polygon points="16,2 19.2,11.6 29.3,11.7 21.2,17.7 24.2,27.3 16,21.5 7.8,27.3 10.8,17.7 2.7,11.7 12.8,11.6" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>{t.tastingNotes || 'Notes'} ({t.optional || 'Optional'})</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t.notesPlaceholder || 'Any thoughts?'}
                    className="textarea-input"
                    rows="3"
                  />
                </div>

                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setShowCheckinModal(false)}>
                    {t.cancel}
                  </button>
                  <button className="btn-save" onClick={handleRatingSubmit}>
                    {t.next || 'NEXT →'}
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="pin-verification-step">
                <div className="pin-lock-icon">🔒</div>
                <h2 className="pin-title">{t.serverConfirm || 'SERVER CONFIRMATION'}</h2>
                <p className="pin-subtitle">
                  {t.askServerPin || 'Show this to your server — they\'ll enter the PIN'}
                </p>

                <div className={`pin-input-row ${pinShake ? 'pin-shake' : ''}`}>
                  {[0, 1, 2, 3].map(i => (
                    <input
                      key={i}
                      ref={pinRefs[i]}
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength="1"
                      className={`pin-digit-input ${pinError ? 'pin-error' : ''}`}
                      value={pinDigits[i]}
                      onChange={(e) => handlePinChange(i, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(i, e)}
                      autoComplete="off"
                      disabled={isChecking}
                    />
                  ))}
                </div>

                {pinError && (
                  <p className="pin-error-text">
                    {pinErrorMsg || t.invalidCode || 'Invalid code. Try again!'}
                  </p>
                )}

                <button className="btn-confirm-stamp" onClick={handlePinSubmit} disabled={isChecking}>
                  {isChecking ? '...' : (t.confirmStamp || 'CONFIRM STAMP ✓')}
                </button>

                {/* Back handled by top nav button */}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SideQuestDetail
