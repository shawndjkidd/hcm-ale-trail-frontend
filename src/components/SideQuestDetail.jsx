import { useState, useEffect } from 'react'
import { getAccessToken } from '../lib/api'
import translations from '../translations'

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

  const t = translations[language]

  const getTitle = () => {
    if (typeof quest?.title === 'string') return quest.title
    return quest?.title?.[language] || quest?.title?.en || 'Side Quest'
  }

  const getDescription = () => {
    if (typeof quest?.description === 'string') return quest.description
    return quest?.description?.[language] || quest?.description?.en || ''
  }

  // Auto check-in when QR scanned
  useEffect(() => {
    if (qrValidated && !isCompleted && !hasCheckedIn) {
      handleQRCheckin()
    }
  }, [qrValidated])

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

  const handleSkipRating = () => {
    setShowRatingModal(false)
    setMessage({ type: 'success', text: `🎉 ${t.questCompleted || 'Side Quest Completed!'}` })
    setTimeout(() => setMessage(null), 5000)
  }

  return (
    <div className="brewery-detail side-quest-detail">
      <button className="back-btn" onClick={onBack}>← {t.back || 'BACK'}</button>

      <div className="side-quest-hero">
        <div className="side-quest-hero-icon">🎯</div>
        <h1 className="side-quest-hero-title">{getTitle()}</h1>
        {quest?.reward && (
          <div className="side-quest-hero-reward">
            🎁 {t.reward || 'Reward'}: {quest.reward}
          </div>
        )}
      </div>

      {getDescription() && (
        <div className="side-quest-description">
          <p>{getDescription()}</p>
        </div>
      )}

      {quest?.address && (
        <div className="side-quest-location">
          <div className="location-icon">📍</div>
          <div className="location-text">
            <div className="location-address">{quest.address}</div>
            {quest?.district && <div className="location-district">{quest.district}</div>}
          </div>
        </div>
      )}

      {(quest?.maps_url || quest?.instagram_url || quest?.facebook_url) && (
        <div className="brewery-buttons-row">
          {quest.maps_url && (
            <a href={quest.maps_url} target="_blank" rel="noopener noreferrer" className="action-btn green">
              {t.maps}
            </a>
          )}
          {quest.instagram_url && (
            <a href={quest.instagram_url} target="_blank" rel="noopener noreferrer" className="action-btn instagram-btn">
              {t.instagram}
            </a>
          )}
          {quest.facebook_url && (
            <a href={quest.facebook_url} target="_blank" rel="noopener noreferrer" className="action-btn facebook-btn">
              {t.facebook}
            </a>
          )}
        </div>
      )}

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {(hasCheckedIn || isCompleted) ? (
        <div className="side-quest-completed-box">
          <div className="completed-icon">✅</div>
          <div className="completed-text">{wasAlreadyCompleted ? 'Already Completed ✓' : (t.questAlreadyCompleted || 'Quest Completed!')}</div>
          {quest?.reward && (
            <div className="completed-reward">
              {t.claimReward || 'Show this screen to claim your reward:'} <strong>{quest.reward}</strong>
            </div>
          )}
        </div>
      ) : (
        <div className="side-quest-checkin-box">
          <div className="checkin-instruction">
            <div className="checkin-icon">🍻</div>
            <div className="checkin-text">
              <strong>{t.completeQuest || 'Complete this Side Quest'}</strong>
              <p>{t.enterQuestCode || 'Enter the code from the venue to check in'}</p>
            </div>
          </div>

          <div className="manual-code-section">
            <input
              type="text"
              className="manual-code-input"
              placeholder={t.enterCode || 'Enter 4-digit code'}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength="4"
            />
            <button 
              className="manual-code-btn"
              onClick={handleManualCode}
              disabled={isChecking || manualCode.length !== 4}
            >
              {isChecking ? '...' : t.submit || 'SUBMIT'}
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
