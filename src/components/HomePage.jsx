import { useState, useEffect } from 'react'
import translations from '../translations'
import EventsPage from './EventsPage'

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

function HomePage({ trail, breweries, stamps, language, setLanguage, onBreweryClick, onNavigate, resetCard }) {
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [showSideQuestModal, setShowSideQuestModal] = useState(false)
  const [showEventsPage, setShowEventsPage] = useState(false)
  const [hatClaimed, setHatClaimed] = useState(false)
  const [sideQuests, setSideQuests] = useState([])
  
  const t = translations[language]
  const progress = (stamps.length / breweries.length) * 100
  const isComplete = stamps.length === 8

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
    const claimed = localStorage.getItem('hcm-hat-claimed')
    if (claimed === 'true') {
      setHatClaimed(true)
    }
  }, [])

  useEffect(() => {
    if (isComplete && !localStorage.getItem('hcm-completion-modal-shown')) {
      setShowCompletionModal(true)
    }
  }, [isComplete])

  const handleCloseCompletionModal = () => {
    setShowCompletionModal(false)
    localStorage.setItem('hcm-completion-modal-shown', 'true')
  }

  const handleClaimHat = () => {
    localStorage.setItem('hcm-hat-claimed', 'true')
    setHatClaimed(true)
    setShowCompletionModal(false)
  }

  const getQuestTitle = (quest) => {
    if (typeof quest.title === 'string') return quest.title
    return quest.title?.[language] || quest.title?.en || 'Side Quest'
  }

  const getQuestDescription = (quest) => {
    if (typeof quest.description === 'string') return quest.description
    return quest.description?.[language] || quest.description?.en || ''
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
        <a 
          href="https://www.google.com/maps/d/u/1/viewer?mid=1ZO-30TD2syibuwwqGF7wDxwHACOEsBQ&ll=10.77928527172877%2C106.69519550000001&z=15" 
          target="_blank" 
          rel="noopener noreferrer"
          className="nav-btn-third green"
        >
          {t.maps}
        </a>
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
          <div className="progress-count">{stamps.length}/8</div>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progress}%` }}
          />
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
                  <div className="stamp-text">COMPLETED!</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="special-buttons">
        <button 
          className="special-btn green"
          onClick={() => setShowSideQuestModal(true)}
        >
          {t.sideQuest || 'SIDE QUEST'}
        </button>
        <button 
          className="special-btn yellow"
          onClick={() => setShowEventsPage(true)}
        >
          {t.upcomingBeerEvents || 'UPCOMING BEER EVENTS'}
        </button>
      </div>

      <div className="footer">
        <div className="footer-year">HCM ALE TRAIL 2025</div>
        <button className="reset-btn" onClick={resetCard}>
          {t.resetCard}
        </button>
      </div>

      {showSideQuestModal && (
        <div className="modal-overlay" onClick={() => setShowSideQuestModal(false)}>
          <div className="side-quest-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSideQuestModal(false)}>✕</button>
            <div className="side-quest-header">
              <div className="side-quest-icon">🎯</div>
              <h2 className="side-quest-title">{t.sideQuest || 'SIDE QUESTS'}</h2>
            </div>
            {sideQuests.length === 0 ? (
              <div className="side-quest-empty">
                <p>{t.noSideQuests || 'No active side quests right now. Check back soon!'}</p>
              </div>
            ) : (
              <div className="side-quest-list">
                {sideQuests.map((quest) => (
                  <div key={quest.id} className="side-quest-item">
                    <div className="side-quest-item-title">{getQuestTitle(quest)}</div>
                    {getQuestDescription(quest) && (
                      <div className="side-quest-item-desc">{getQuestDescription(quest)}</div>
                    )}
                    {quest.reward && (
                      <div className="side-quest-item-reward">
                        🎁 {t.reward || 'Reward'}: {quest.reward}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button className="ok-btn" onClick={() => setShowSideQuestModal(false)}>
              {t.ok || 'OK'}
            </button>
          </div>
        </div>
      )}

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
            {!hatClaimed ? (
              <button className="completion-ok-btn" onClick={handleClaimHat}>
                {t.claimHat}
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