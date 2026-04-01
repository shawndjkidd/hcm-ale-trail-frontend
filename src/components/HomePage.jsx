import { useState, useEffect } from 'react'

const Star = ({ filled, num }) => (
  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg viewBox="0 0 24 24" className={`progress-star ${filled ? 'complete' : 'incomplete'}`}>
      <polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        fill="currentColor"
        stroke="var(--black)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
    <span className={`star-number ${filled ? 'star-number-complete' : 'star-number-incomplete'}`}>
      {num}
    </span>
  </div>
)
import translations from '../translations'
import EventsPage from './EventsPage'
import { claimHat } from '../lib/api'

const TRAIL_ID = '89e5e2d6-090b-448a-8e53-6d05b731a921'

const BREWERY_LOGOS = {
  'BiaCraft': '/logos/biacraft.png',
  'Heart of Darkness': '/logos/hod.png',
  'Deme': '/logos/deme.png',
  'Steersman': '/logos/steersman.png',
  'East West Brewing': '/logos/eastwest.png',
  'Rooster Beers': '/logos/rooster.png',
  '7 Bridges Brewing Co.': '/logos/7bridges.png',
  'Belgo Saigon': '/logos/belgo.png',
}

const getBreweryLogo = (brewery) => {
  if (brewery?.logo_url) return brewery.logo_url
  return BREWERY_LOGOS[brewery?.name] || null
}

function HomePage({ trail, breweries, stamps, language, setLanguage, onBreweryClick, onSideQuestClick, sideQuestCheckins = [], onNavigate, resetCard, activeEvents = [], nightMode, toggleNightMode, user, onLogout, onSettings, onProfile, hatClaimed, onHatClaimed }) {
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [showEventsPage, setShowEventsPage] = useState(false)
  const [hatClaimError, setHatClaimError] = useState(null)
  const [claimingHat, setClaimingHat] = useState(false)
  const [sideQuests, setSideQuests] = useState([])

  const t = translations[language]
  const requiredBreweries = breweries.filter(b => b.status !== 'temporarily_closed')
  const requiredCount = requiredBreweries.length || 8
  const totalCount = breweries.length || 8
  const progress = Math.min((stamps.length / requiredCount) * 100, 100)
  const isComplete = stamps.length >= requiredCount

  useEffect(() => {
    const fetchSideQuests = async () => {
      try {
        const res = await fetch(`/api/trails/${TRAIL_ID}/side-quests`)
        const data = await res.json()
        if (data.ok) {
          setSideQuests(data.sideQuests || [])
        }
      } catch (err) {
        console.error('Failed to fetch side quests:', err)
      }
    }
    fetchSideQuests()
  }, [])

  useEffect(() => {
    if (isComplete && !localStorage.getItem('hcm-completion-modal-shown')) {
      setShowCompletionModal(true)
    }
  }, [isComplete])

  const handleCloseCompletionModal = () => {
    setShowCompletionModal(false)
    setHatClaimError(null)
    localStorage.setItem('hcm-completion-modal-shown', 'true')
  }

  const handleClaimHat = async () => {
    setHatClaimError(null)
    setClaimingHat(true)
    try {
      const res = await claimHat()
      if (res?.ok) {
        onHatClaimed()
        if (!res.alreadyClaimed) {
          setShowCompletionModal(false)
        }
      } else {
        setHatClaimError(res?.error || 'Failed to claim hat. Please try again.')
      }
    } catch {
      setHatClaimError('Failed to claim hat. Please try again.')
    } finally {
      setClaimingHat(false)
    }
  }

  const getQuestTitle = (quest) => {
    const title = quest?.title
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

  if (showEventsPage) {
    return (
      <EventsPage
        language={language}
        onClose={() => setShowEventsPage(false)}
      />
    )
  }

  return (
    <div className="home-page">
      <div className="language-toggle-large">
        <button
          className={`flag-btn-large ${language === 'en' ? 'active' : ''}`}
          onClick={() => setLanguage('en')}
        >
          <img src="https://flagcdn.com/w160/us.png" alt="English" className="flag-img" />
        </button>
        <button
          className={`flag-btn-large ${language === 'vn' ? 'active' : ''}`}
          onClick={() => setLanguage('vn')}
        >
          <img src="https://flagcdn.com/w160/vn.png" alt="Tiếng Việt" className="flag-img" />
        </button>
        <button
          className={`flag-btn-large ${language === 'kr' ? 'active' : ''}`}
          onClick={() => setLanguage('kr')}
        >
          <img src="https://flagcdn.com/w160/kr.png" alt="한국어" className="flag-img" />
        </button>
        <button
          className={`flag-btn-large ${language === 'jp' ? 'active' : ''}`}
          onClick={() => setLanguage('jp')}
        >
          <img src="https://flagcdn.com/w160/jp.png" alt="日本語" className="flag-img" />
        </button>
        <button
          className={`night-mode-toggle${nightMode ? ' is-night' : ''}`}
          onClick={toggleNightMode}
          title={nightMode ? 'Switch to bright mode' : 'Switch to night mode'}
          aria-label={nightMode ? 'Switch to bright mode' : 'Switch to night mode'}
        >
          <span className="toggle-sun">☀</span>
          <span className="toggle-moon">☾</span>
        </button>
        {user && onProfile && (
          <button className="profile-icon-btn" onClick={onProfile} title="My Profile">
            <span className="profile-icon-emoji">👤</span>
          </button>
        )}
      </div>

      <div className="header-logo">
        <img
          src="/logos/HCM Logo-Ale-Trail-2023-BK.png"
          alt="HCM Ale Trail"
          className="header-logo-img"
        />
      </div>

      <div className="nav-row-full">
        <button className="nav-btn-third yellow" onClick={() => onNavigate('faq')}>
          {t.trailGuide || 'TRAIL GUIDE'}
        </button>
        <a
          href="https://www.hochiminhaletrail.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-btn-third red"
        >
          {t.website}
        </a>
        <button
          className="nav-btn-third green"
          onClick={() => onNavigate('map')}
        >
          {t.trailMap || 'ALE TRAIL MAP'}
        </button>
      </div>

      <div className="nav-row-full">
        <a
          href="https://www.instagram.com/hcm.aletrail/"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-btn-third instagram"
        >
          {t.instagram}
        </a>
        <a
          href="https://www.facebook.com/hcmaletrail"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-btn-third facebook"
        >
          {t.facebook}
        </a>
        <a
          href="https://www.messenger.com/t/115480196509607/?messaging_source=source%3Apages%3Amessage_shortlink&source_id=1441792&recurring_notification=0"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-btn-third messenger"
        >
          {t.messenger}
        </a>
      </div>

      <div className="progress-section">
        <div className="progress-header">
          <div className="progress-label">{t.stamps}</div>
          <div className="progress-count">{stamps.length + breweries.filter(b => b.status === 'temporarily_closed' && !stamps.includes(b.id)).length}/{totalCount}</div>
        </div>
        <div className="progress-stars">
          {breweries.slice(0, totalCount).map((brewery, i) => (
            <Star
              key={i}
              num={i + 1}
              filled={stamps.includes(brewery.id) || brewery.status === 'temporarily_closed'}
            />
          ))}
          {Array.from({ length: Math.max(0, totalCount - breweries.length) }, (_, i) => (
            <Star key={`extra-${i}`} num={breweries.length + i + 1} filled={false} />
          ))}
        </div>
      </div>

      <div className="nav-row-full">
        <button className="nav-btn-half yellow" onClick={() => onNavigate('mybeers')}>
          {t.myBeers}
        </button>
        <button className="nav-btn-half yellow" onClick={() => onNavigate('leaderboard')}>
          {t.leaderboard}
        </button>
      </div>

      <div className="brewery-list">
        {breweries.map((brewery, index) => {
          const isStamped = stamps.includes(brewery.id)
          const breweryEvent = activeEvents.find(e => e.breweryId === brewery.id)
          return (
            <div
              key={brewery.id}
              className={`brewery-item ${isStamped ? 'stamped' : ''}`}
              onClick={() => onBreweryClick(brewery)}
            >
              <div className="brewery-number">{index + 1}</div>
              <div className="brewery-info">
                <div className="brewery-name">{brewery.name}</div>
                <div className="brewery-district">{brewery.district}</div>
              </div>
              <div className="brewery-logo">
                {getBreweryLogo(brewery) ? (
                  <img
                    src={getBreweryLogo(brewery)}
                    alt={brewery.name}
                    className="color"
                  />
                ) : (
                  <span className="logo-placeholder">🍺</span>
                )}
              </div>
              {isStamped && (
                <div className="completed-stamp">
                  <div className="stamp-text">{(t.completed || 'Completed!').toUpperCase()}</div>
                </div>
              )}
              {brewery.status === 'temporarily_closed' && (
                <div className="temp-closed-overlay">
                  <span>{t.temporarilyClosed || 'TEMPORARILY CLOSED'}</span>
                </div>
              )}
              {breweryEvent && <div className="event-banner">🎉 Event happening now!</div>}
            </div>
          )
        })}
      </div>

      {sideQuests.length > 0 && (
        <div className="side-quests-section">
          <h2 className="side-quests-section-title">{t.sideQuests || 'SIDE QUESTS'}</h2>
          <div className="side-quest-list-home">
            {sideQuests.map((quest) => {
              const isCompleted = sideQuestCheckins.includes(quest.id)
              const questEvent = activeEvents.find(e => e.sideQuestId === quest.id)
              return (
                <div
                  key={quest.id}
                  className={`side-quest-item-home ${isCompleted ? 'completed' : ''}`}
                  onClick={() => onSideQuestClick(quest)}
                >
                  <div className="side-quest-icon-home">{isCompleted ? '✅' : '🎯'}</div>
                  <div className="side-quest-info-home">
                    <div className="side-quest-name-home">{getQuestTitle(quest)}</div>
                    {quest.reward && <div className="side-quest-reward-home">🎁 {t.rewardMap?.[quest.reward] || quest.reward}</div>}
                  </div>
                  <div className="side-quest-arrow-home">→</div>
                  {questEvent && <div className="event-banner">🎉 Event happening now!</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="special-buttons">
        <button
          className="special-btn yellow"
          onClick={() => setShowEventsPage(true)}
        >
          {t.upcomingBeerEvents || 'UPCOMING BEER EVENTS'}
        </button>
      </div>

      <div className="footer">
        <div className="footer-year">HCM ALE TRAIL 2026</div>
        <button className="reset-btn" onClick={resetCard}>
          {t.resetCard}
        </button>
        {user && onSettings && (
          <button className="logout-link" onClick={onSettings}>
            {t.settings || 'Settings'}
          </button>
        )}
        {user && onLogout && (
          <button className="logout-link" onClick={onLogout}>
            {t.logOut || 'Log out'}
          </button>
        )}
      </div>

      {showCompletionModal && (
        <div className="modal-overlay">
          <div className="completion-modal">
            <button className="modal-close" onClick={handleCloseCompletionModal}>✕</button>
            <div className="completion-icon">🎉</div>
            <h2 className="completion-title">{t.congratulations}</h2>
            <p className="completion-subtitle">{t.completedTrail}</p>
            <div className="completion-steps">
              <div className="completion-step">
                <div className="step-number-circle">1</div>
                <div className="step-text">{t.completionStep1}</div>
              </div>
              <div className="completion-step">
                <div className="step-number-circle">2</div>
                <div className="step-text">{t.completionStep2}</div>
              </div>
              <div className="completion-step">
                <div className="step-number-circle">3</div>
                <div className="step-text">{t.completionStep3}</div>
              </div>
            </div>
            {hatClaimError && (
              <div className="hat-claim-error">{hatClaimError}</div>
            )}
            {!hatClaimed ? (
              <button className="completion-ok-btn" onClick={handleClaimHat} disabled={claimingHat}>
                {claimingHat ? '...' : t.claimHat}
              </button>
            ) : (
              <>
                <div className="hat-claimed-message">
                  {t.hatClaimed}
                </div>
                <button className="completion-ok-btn claimed" onClick={handleCloseCompletionModal}>
                  {t.close}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage

