import { useState, useEffect, useRef, useCallback } from 'react'

const PintGlass = ({ filled, num }) => (
  <div className={`pint-icon ${filled ? 'pint-filled' : 'pint-empty'}`}>
    <svg viewBox="0 0 32 40" className="pint-svg">
      {/* Glass outline */}
      <path
        d="M6 2 L26 2 L24 36 C24 38 22 39 20 39 L12 39 C10 39 8 38 8 36 Z"
        fill={filled ? 'var(--pint-fill, #FFD100)' : 'var(--pint-empty, rgba(255,255,255,0.15))'}
        stroke="var(--pint-stroke, #000)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Beer liquid level (only when filled) */}
      {filled && (
        <path
          d="M7.2 8 L24.8 8 L23.2 33 C23.2 34.5 21.8 35.5 20 35.5 L12 35.5 C10.2 35.5 8.8 34.5 8.8 33 Z"
          fill="var(--pint-beer, #F5A623)"
          opacity="0.6"
        />
      )}
      {/* Foam top (only when filled) */}
      {filled && (
        <ellipse cx="16" cy="8" rx="8.8" ry="2.5" fill="var(--pint-foam, #fff)" opacity="0.5" />
      )}
    </svg>
    <span className="pint-num">{num}</span>
  </div>
)
const QuestIcon = () => (
  <svg viewBox="0 0 24 24" className="quest-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" opacity="0.9"/>
    <circle cx="12" cy="9" r="3" fill="#fff" opacity="0.9"/>
  </svg>
)

import translations from '../translations'
import EventsPage from './EventsPage'
import { claimHat, getMyMerchandise, claimMerchandise } from '../lib/api'

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

function HomePage({ trail, breweries, stamps, language, setLanguage, onBreweryClick, onSideQuestClick, sideQuestCheckins = [], onNavigate, resetCard, activeEvents = [], nightMode, toggleNightMode, user, onLogout, onSettings, hatClaimed, onHatClaimed, cardRound = 1, meLoaded = false, onCardResetPrompt }) {
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [showClaimHatTakeover, setShowClaimHatTakeover] = useState(false)
  const [showEventsPage, setShowEventsPage] = useState(false)
  const [sideQuests, setSideQuests] = useState([])
  const [merchItems, setMerchItems] = useState(null) // null = not loaded, [] = loaded but empty

  // Claim flow state
  const [claimStep, setClaimStep] = useState('rewards') // 'rewards' | 'brewery' | 'pin' | 'success' | 'error'
  const [claimingItem, setClaimingItem] = useState(null) // the merch item being claimed
  const [selectedBrewery, setSelectedBrewery] = useState(null)
  const [pinDigits, setPinDigits] = useState(['', '', '', ''])
  const [pinError, setPinError] = useState(false)
  const [pinShake, setPinShake] = useState(false)
  const [claimBusy, setClaimBusy] = useState(false)
  const [claimError, setClaimError] = useState(null)
  const [claimSuccess, setClaimSuccess] = useState(null) // { breweryName, itemName }
  const pinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]

  const t = translations[language]
  const requiredBreweries = breweries.filter(b => b.status !== 'temporarily_closed')
  const requiredCount = requiredBreweries.length || 8
  const totalCount = breweries.length || 8
  const progress = Math.min((stamps.length / requiredCount) * 100, 100)
  const isComplete = stamps.length >= requiredCount

  // Check if user has unclaimed merch (for the banner)
  const hasUnclaimedMerch = merchItems && merchItems.some(item => !item.pickedUp)

  const fetchMerchItems = useCallback(() => {
    getMyMerchandise().then(res => {
      if (res?.ok) setMerchItems(res.merchandise || [])
    }).catch(() => {})
  }, [])

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

  // Fetch merch status when trail is complete (for banner + modal)
  useEffect(() => {
    if (isComplete) {
      fetchMerchItems()
    }
  }, [isComplete, fetchMerchItems])

  // Show claim-hat takeover on first completion (before completion modal)
  useEffect(() => {
    const deferredKey = `hcm-claim-hat-deferred-${TRAIL_ID}-${cardRound}`
    if (meLoaded && isComplete && !hatClaimed && !localStorage.getItem(deferredKey)) {
      setShowClaimHatTakeover(true)
    }
  }, [meLoaded, isComplete, hatClaimed, cardRound])

  // Show completion modal only after user has deferred the claim-hat takeover
  useEffect(() => {
    const deferredKey = `hcm-claim-hat-deferred-${TRAIL_ID}-${cardRound}`
    if (meLoaded && isComplete && !hatClaimed && localStorage.getItem(deferredKey) && !localStorage.getItem('hcm-completion-modal-shown')) {
      setShowCompletionModal(true)
    }
  }, [meLoaded, isComplete, hatClaimed, cardRound])

  const handleCloseCompletionModal = () => {
    setShowCompletionModal(false)
    setClaimStep('rewards')
    setClaimingItem(null)
    setSelectedBrewery(null)
    setPinDigits(['', '', '', ''])
    setPinError(false)
    setClaimError(null)
    localStorage.setItem('hcm-completion-modal-shown', 'true')
  }

  const openClaimModal = () => {
    setClaimStep('rewards')
    setClaimingItem(null)
    setSelectedBrewery(null)
    setPinDigits(['', '', '', ''])
    setPinError(false)
    setClaimError(null)
    setClaimSuccess(null)
    setShowCompletionModal(true)
  }

  const handleClaimHatCTA = () => {
    setShowClaimHatTakeover(false)
    if (merchItems && merchItems.length > 0) {
      const item = merchItems.find(i => !i.pickedUp) || merchItems[0]
      setClaimingItem(item)
      setClaimStep('brewery')
      setClaimError(null)
      setSelectedBrewery(null)
      setPinDigits(['', '', '', ''])
      setPinError(false)
      setClaimSuccess(null)
      setShowCompletionModal(true)
    } else {
      openClaimModal()
    }
  }

  const handleDeferClaimHat = () => {
    localStorage.setItem(`hcm-claim-hat-deferred-${TRAIL_ID}-${cardRound}`, '1')
    setShowClaimHatTakeover(false)
    if (!localStorage.getItem('hcm-completion-modal-shown')) {
      setShowCompletionModal(true)
    }
  }

  const handleStartClaim = (item) => {
    setClaimingItem(item)
    setClaimStep('brewery')
    setClaimError(null)
  }

  const handleSelectBrewery = (brewery) => {
    setSelectedBrewery(brewery)
    setClaimStep('pin')
    setPinDigits(['', '', '', ''])
    setPinError(false)
    setClaimError(null)
    setTimeout(() => pinRefs[0]?.current?.focus(), 100)
  }

  const handlePinInput = (index, value) => {
    if (!/^\d?$/.test(value)) return
    const newDigits = [...pinDigits]
    newDigits[index] = value
    setPinDigits(newDigits)
    setPinError(false)

    if (value && index < 3) {
      pinRefs[index + 1]?.current?.focus()
    }

    // Auto-submit when all 4 digits entered
    if (value && index === 3 && newDigits.every(d => d !== '')) {
      handlePinSubmit(newDigits.join(''))
    }
  }

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinRefs[index - 1]?.current?.focus()
    }
  }

  const handlePinSubmit = async (pin) => {
    if (!claimingItem || !selectedBrewery || pin.length !== 4) return

    setClaimBusy(true)
    setClaimError(null)
    try {
      const res = await claimMerchandise(claimingItem.id, selectedBrewery.id, pin)
      if (res?.ok) {
        setClaimSuccess({ breweryName: res.breweryName || selectedBrewery.name, itemName: res.itemName || claimingItem.name })
        setClaimStep('success')
        // Refresh merch items to update pickup status
        fetchMerchItems()
        if (onHatClaimed) onHatClaimed()
      } else if (res?.error === 'Invalid code') {
        setPinError(true)
        setPinShake(true)
        setPinDigits(['', '', '', ''])
        setTimeout(() => { setPinShake(false); pinRefs[0]?.current?.focus() }, 500)
      } else if (res?.data?.outOfStock) {
        setClaimError(t.merchOutOfStock || 'Out of stock at this location. Try another brewery!')
        setClaimStep('brewery')
      } else if (res?.data?.alreadyClaimed) {
        setClaimError(t.merchAlreadyClaimed || 'You already claimed this item!')
        setClaimStep('rewards')
        fetchMerchItems()
      } else {
        setClaimError(res?.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setClaimError('Something went wrong. Please try again.')
    } finally {
      setClaimBusy(false)
    }
  }

  const handleBackFromPin = () => {
    setClaimStep('brewery')
    setPinDigits(['', '', '', ''])
    setPinError(false)
  }

  const handleBackFromBrewery = () => {
    setClaimStep('rewards')
    setClaimingItem(null)
    setSelectedBrewery(null)
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
        <button
          className="nav-btn-third yellow"
          onClick={() => onNavigate('chat')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '5px', flexShrink: 0 }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {t.navChat || 'CHAT'}
        </button>
      </div>

      {cardRound > 1 && (
        <div className="round-badge">
          {t.roundLabel || 'ROUND'} {cardRound}
        </div>
      )}

      <div className="progress-section">
        <div className="progress-header">
          <div className="progress-label">{t.stamps}</div>
          <div className="progress-count">{stamps.length + breweries.filter(b => b.status === 'temporarily_closed' && !stamps.includes(b.id)).length}/{totalCount}</div>
        </div>
        <div className="progress-stars">
          {breweries.slice(0, totalCount).map((brewery, i) => (
            <PintGlass
              key={i}
              num={i + 1}
              filled={stamps.includes(brewery.id) || brewery.status === 'temporarily_closed'}
            />
          ))}
          {Array.from({ length: Math.max(0, totalCount - breweries.length) }, (_, i) => (
            <PintGlass key={`extra-${i}`} num={breweries.length + i + 1} filled={false} />
          ))}
        </div>
      </div>

      <div className="nav-row-full">
        <button className="nav-btn-third yellow" onClick={() => onNavigate('settings')}>
          {t.profile || 'PROFILE'}
        </button>
        <button className="nav-btn-third yellow" onClick={() => onNavigate('mybeers')}>
          {t.myBeers}
        </button>
        <button className="nav-btn-third yellow" onClick={() => onNavigate('leaderboard')}>
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
              className={`brewery-item ${isStamped ? 'stamped' : ''} ${brewery.status === 'temporarily_closed' && !isStamped ? 'temp-closed' : ''}`}
              onClick={() => onBreweryClick(brewery)}
            >
              <div className={`brewery-number ${isStamped ? 'brewery-number-done' : ''} ${brewery.status === 'temporarily_closed' && !isStamped ? 'brewery-number-closed' : ''}`}>
                {isStamped ? <span className="brewery-check">✓</span> : (brewery.status === 'temporarily_closed' ? <span className="brewery-check">✕</span> : index + 1)}
              </div>
              <div className="brewery-info">
                <div className="brewery-name">{brewery.name}</div>
                <div className="brewery-district">{brewery.district}</div>
                {isStamped && (
                  <div className="stamped-badge">{(t.completed || 'COMPLETED!').toUpperCase()}</div>
                )}
                {brewery.status === 'temporarily_closed' && !isStamped && (
                  <div className="closed-badge">{t.temporarilyClosed || 'TEMPORARILY CLOSED'}</div>
                )}
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
              {/* temp-closed-overlay removed — now using inline badge like completed cards */}
              {breweryEvent && <div className="event-banner">Event happening now!</div>}
            </div>
          )
        })}
      </div>

      {sideQuests.length > 0 && (
        <div className="side-quests-section">
          <h2 className="side-quests-section-title">{t.sideQuests || 'SIDE QUESTS'}</h2>
          <div className="brewery-list">
            {sideQuests.map((quest, index) => {
              const isCompleted = sideQuestCheckins.includes(quest.id)
              const questEvent = activeEvents.find(e => e.sideQuestId === quest.id)
              return (
                <div
                  key={quest.id}
                  className={`brewery-item sq-card ${isCompleted ? 'stamped' : ''}`}
                  onClick={() => onSideQuestClick(quest)}
                >
                  <div className={`brewery-number sq-number ${isCompleted ? 'brewery-number-done' : ''}`}>
                    {isCompleted ? <span className="brewery-check">✓</span> : <span className="sq-quest-icon"><QuestIcon /></span>}
                  </div>
                  <div className="brewery-info">
                    <div className="brewery-name sq-name">{getQuestTitle(quest)}</div>
                    {quest.reward && <div className="brewery-district sq-reward">{t.rewardMap?.[quest.reward] || quest.reward}</div>}
                    {isCompleted && (
                      <div className="stamped-badge">{(t.completed || 'COMPLETED!').toUpperCase()}</div>
                    )}
                  </div>
                  <div className="brewery-logo sq-arrow">
                    <span className="sq-chevron">&rsaquo;</span>
                  </div>
                  {questEvent && <div className="event-banner">Event happening now!</div>}
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
        {user && onLogout && (
          <button className="logout-link" onClick={onLogout}>
            {t.logOut || 'Log out'}
          </button>
        )}
      </div>

      {showClaimHatTakeover && (
        <div className="claim-hat-takeover">
          <div className="claim-hat-flags">
            {[
              { code: 'en', flag: 'us', label: 'English' },
              { code: 'vn', flag: 'vn', label: 'Tiếng Việt' },
              { code: 'kr', flag: 'kr', label: '한국어' },
              { code: 'jp', flag: 'jp', label: '日本語' },
            ].map(({ code, flag, label }) => (
              <button
                key={code}
                className={`flag-btn-large ${language === code ? 'active' : ''}`}
                onClick={() => setLanguage(code)}
              >
                <img src={`https://flagcdn.com/w160/${flag}.png`} alt={label} className="flag-img" />
              </button>
            ))}
          </div>
          <div className="claim-hat-inner">
            {/* Baseball cap SVG from svgrepo.com, colorized for AleTrail brand */}
            <svg
              width="120"
              height="120"
              viewBox="0 0 38.678 38.677"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Free Ale Trail baseball cap"
            >
              <g>
                <g>
                  <path
                    d="M25.397,28.345c-7.439,0-13.89-1.248-17.932-3.541c-1.391,0.675-5.772,2.859-6.931,4.242
                    C0.296,29.33,0.018,30.061,0,30.429c-0.013,0.287,0.314,1.101,0.314,1.101c9.837,4.158,15.337,2.574,20.836,1.49
                    c5.85-1.149,11.155-4.894,11.155-4.894c0.044-0.049,0.097-0.098,0.144-0.145C30.036,28.22,27.669,28.345,25.397,28.345z"
                    fill="#000000"
                  />
                  <path
                    d="M25.554,6.096l-0.083,0.002c-0.069-0.925-1.188-1.661-2.569-1.661c-1.426,0-2.582,0.783-2.582,1.75
                    c0,0.016,0.006,0.03,0.006,0.046C7.254,7.591,7.789,16.74,8.055,21.679c0.047,0.865-0.015,1.716-0.073,2.272
                    c5.331,3.036,15.178,4.151,25.915,2.866c1.989-1.371,4.705-2.686,4.705-2.686s0.168-5.074,0-6.754
                    C37.717,8.554,30.172,6.521,25.554,6.096z"
                    fill="#E31E24"
                  />
                </g>
              </g>
            </svg>
            <h1 className="claim-hat-title">{t.youEarnedFreeHat || 'YOU EARNED A FREE HAT!'}</h1>
            <p className="claim-hat-subtext">{t.claimHatSubtext || 'Show your completed card to staff at any participating brewery.'}</p>
            <button className="claim-hat-cta-btn" onClick={handleClaimHatCTA}>
              {t.claimAtBrewery || 'CLAIM AT A BREWERY'}
            </button>
            <button className="claim-hat-defer-btn" onClick={handleDeferClaimHat}>
              {t.claimLater || "I'll claim later"}
            </button>
          </div>
        </div>
      )}

      {showCompletionModal && (
        <div className="completion-fullscreen">
          <div className="completion-modal">

            {/* ─── STEP: rewards (default view) ─── */}
            {claimStep === 'rewards' && (
              <>
                <h2 className="completion-title">{t.congratulations}</h2>
                <p className="completion-subtitle">{t.completedTrail}</p>

                {merchItems && merchItems.length > 0 && (
                  <div className="completion-merch">
                    <div className="completion-merch-title">{t.yourRewards || 'YOUR REWARDS'}</div>
                    {merchItems.map(item => (
                      <div key={item.id} className={`completion-merch-item ${item.pickedUp ? 'picked-up' : ''}`}>
                        <div className="completion-merch-icon">{item.pickedUp ? '✅' : '🎁'}</div>
                        <div className="completion-merch-info">
                          <div className="completion-merch-name">{item.name}</div>
                          {item.pickedUp ? (
                            <div className="completion-merch-status">{t.merchPickedUp || 'Collected!'}</div>
                          ) : (
                            <div className="completion-merch-status pending">{t.merchReady || 'Ready to collect at any brewery'}</div>
                          )}
                        </div>
                        {!item.pickedUp && (
                          <button className="merch-claim-btn" onClick={() => handleStartClaim(item)}>
                            {t.claimNow || 'CLAIM'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {claimError && <div className="hat-claim-error">{claimError}</div>}

                <div className="completion-steps">
                  <div className="completion-step">
                    <div className="step-badge">1</div>
                    <div className="step-text">{t.completionStep1Merch || 'Show a staff member your completed card'}</div>
                  </div>
                  <div className="completion-step">
                    <div className="step-badge">2</div>
                    <div className="step-text">{t.completionStep2Merch || 'Tap CLAIM and the staff will enter their code'}</div>
                  </div>
                  <div className="completion-step">
                    <div className="step-badge">3</div>
                    <div className="step-text">{t.completionStep3}</div>
                  </div>
                </div>

                {hatClaimed ? (
                  <button className="completion-ok-btn" onClick={() => { handleCloseCompletionModal(); onCardResetPrompt?.(); }}>
                    {t.whatsNext || "WHAT'S NEXT?"}
                  </button>
                ) : (
                  <button className="completion-ok-btn" onClick={handleCloseCompletionModal}>
                    {t.close}
                  </button>
                )}
              </>
            )}

            {/* ─── STEP: brewery picker ─── */}
            {claimStep === 'brewery' && claimingItem && (
              <>
                <button className="modal-back-nav" onClick={() => { setClaimStep('rewards'); setClaimingItem(null); }}>← {t.back || 'BACK'}</button>
                <h2 className="completion-title">{t.selectBrewery || 'Which brewery are you at?'}</h2>
                <p className="completion-subtitle">{t.selectBreweryDesc || 'Show a staff member and they\'ll confirm your pickup'}</p>

                {claimError && <div className="hat-claim-error">{claimError}</div>}

                <div className="brewery-picker">
                  {breweries.filter(b => b.status === 'active' || b.status === 'temporarily_closed').map(brewery => (
                    <button
                      key={brewery.id}
                      className={`brewery-picker-item${brewery.status === 'temporarily_closed' ? ' picker-temp-closed' : ''}`}
                      onClick={() => handleSelectBrewery(brewery)}
                    >
                      <div className="brewery-picker-logo">
                        {getBreweryLogo(brewery) ? (
                          <img src={getBreweryLogo(brewery)} alt={brewery.name} />
                        ) : (
                          <span>🍺</span>
                        )}
                      </div>
                      <div className="brewery-picker-name">
                        {brewery.name}
                        {brewery.status === 'temporarily_closed' && (
                          <span className="picker-closed-label">{t.temporarilyClosed || 'Temporarily closed'}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

              </>
            )}

            {/* ─── STEP: PIN entry ─── */}
            {claimStep === 'pin' && selectedBrewery && (
              <>
                <button className="modal-back-nav" onClick={() => { setClaimStep('brewery'); setSelectedBrewery(null); setPinDigits(['','','','']); setPinError(false); }}>← {t.back || 'BACK'}</button>
                <h2 className="completion-title">{t.staffVerify || 'Staff Verification'}</h2>
                <p className="completion-subtitle">
                  {t.handToStaff || 'Hand your phone to the staff at'} <strong>{selectedBrewery.name}</strong>
                </p>
                <p className="pin-instruction">{t.enterPinMerch || 'Staff: enter your brewery code to confirm pickup'}</p>

                <div className={`pin-input-row ${pinShake ? 'pin-shake' : ''}`}>
                  {pinDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={pinRefs[i]}
                      type="tel"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinInput(i, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(i, e)}
                      className={`pin-digit ${pinError ? 'pin-error' : ''}`}
                      disabled={claimBusy}
                      autoComplete="off"
                    />
                  ))}
                </div>

                {pinError && (
                  <div className="hat-claim-error">{t.wrongPin || 'Wrong code. Try again.'}</div>
                )}
                {claimError && (
                  <div className="hat-claim-error">{claimError}</div>
                )}
                {claimBusy && (
                  <div className="claim-loading">{t.verifying || 'Verifying...'}</div>
                )}
              </>
            )}

            {/* ─── STEP: success ─── */}
            {claimStep === 'success' && claimSuccess && (
              <>
                <div className="completion-icon claim-success-bounce">✅</div>
                <h2 className="completion-title">{t.merchClaimSuccess || 'Enjoy your reward!'}</h2>
                <p className="completion-subtitle">
                  {t.merchClaimedAt || 'Picked up at'} <strong>{claimSuccess.breweryName}</strong>
                </p>
                <div className="claim-success-item">
                  <span className="claim-success-icon">✅</span>
                  <span className="claim-success-name">{claimSuccess.itemName}</span>
                </div>

                <button className="completion-ok-btn" onClick={() => {
                  setClaimStep('rewards')
                  setClaimSuccess(null)
                }}>
                  {t.done || 'DONE'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating claim button — always visible when unclaimed merch exists */}
      {isComplete && hasUnclaimedMerch && !showCompletionModal && (
        <button className="floating-claim-btn" onClick={openClaimModal}>
          <span className="floating-claim-icon">🧢</span>
          <span className="floating-claim-label">{t.claimRewards || 'Claim Free Hat'}</span>
        </button>
      )}
    </div>
  )
}

export default HomePage
