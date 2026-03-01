import { useState } from 'react'
import translations from '../translations'

const TRAIL_ID = '89e5e2d6-090b-448a-8e53-6d05b731a921'

function SideQuestDetail({ quest, isCompleted, onComplete, onBack, language, user }) {
  const [message, setMessage] = useState(null)
  const [manualCode, setManualCode] = useState('')
  const [isChecking, setIsChecking] = useState(false)

  const t = translations[language]

  const getTitle = () => {
    if (typeof quest?.title === 'string') return quest.title
    return quest?.title?.[language] || quest?.title?.en || 'Side Quest'
  }

  const getDescription = () => {
    if (typeof quest?.description === 'string') return quest.description
    return quest?.description?.[language] || quest?.description?.en || ''
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
        setMessage({ type: 'success', text: `🎉 ${t.questCompleted || 'Side Quest Completed!'}` })
        onComplete(quest.id)
        setManualCode('')
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
        setMessage({ type: 'success', text: `🎉 ${t.questCompleted || 'Side Quest Completed!'}` })
        onComplete(quest.id)
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

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {isCompleted ? (
        <div className="side-quest-completed-box">
          <div className="completed-icon">✅</div>
          <div className="completed-text">{t.questAlreadyCompleted || 'Quest Completed!'}</div>
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
    </div>
  )
}

export default SideQuestDetail
