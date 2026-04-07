import { useState } from 'react'
import { saveOnboardingProfile } from '../lib/api'

const STEPS = ['vibe', 'beer_styles', 'era', 'group_size', 'neighborhood', 'avatar', 'display_name']

const OPTIONS = {
  vibe: [
    { value: 'chill', label: 'Chill', emoji: '😎', desc: 'Easy going, no rush' },
    { value: 'explorer', label: 'Explorer', emoji: '🧭', desc: 'Hit every spot!' },
    { value: 'social', label: 'Social', emoji: '🎉', desc: 'Here for the people' },
    { value: 'craftnerd', label: 'Craft Nerd', emoji: '🍺', desc: 'All about the beer' },
  ],
  beer_styles: [
    { value: 'ipa', label: 'IPA', emoji: '🌿' },
    { value: 'lager', label: 'Lager', emoji: '🍺' },
    { value: 'stout', label: 'Stout', emoji: '🖤' },
    { value: 'sour', label: 'Sour', emoji: '🍋' },
    { value: 'wheat', label: 'Wheat', emoji: '🌾' },
    { value: 'surprise', label: 'Surprise Me', emoji: '🎲' },
  ],
  era: [
    { value: 'rookie', label: 'Rookie', emoji: '🌱', desc: 'New to craft beer' },
    { value: 'prime', label: 'In My Prime', emoji: '💪', desc: 'Know what I like' },
    { value: 'seasoned', label: 'Seasoned', emoji: '🎖️', desc: 'Tried it all' },
    { value: 'og', label: 'OG', emoji: '👑', desc: 'Craft beer veteran' },
  ],
  group_size: [
    { value: 'solo', label: 'Solo', emoji: '🐺' },
    { value: 'duo', label: 'Duo', emoji: '👫' },
    { value: 'crew', label: 'Crew (3-5)', emoji: '👥' },
    { value: 'party', label: 'Party (6+)', emoji: '🎊' },
  ],
  neighborhood: [
    { value: 'd1', label: 'District 1', emoji: '🏙️' },
    { value: 'd2', label: 'District 2 / Thu Duc', emoji: '🌳' },
    { value: 'd3', label: 'District 3', emoji: '🏘️' },
    { value: 'd7', label: 'District 7', emoji: '🌆' },
    { value: 'other_vn', label: 'Other VN', emoji: '🇻🇳' },
    { value: 'visitor', label: 'Just Visiting', emoji: '✈️' },
  ],
  avatar: [
    { value: 'dude', label: 'Dude', emoji: '🧔' },
    { value: 'lady', label: 'Lady', emoji: '👩' },
    { value: 'mystery', label: 'Mystery', emoji: '🎭' },
  ],
}

const STEP_TITLES = {
  vibe: "What's your vibe?",
  beer_styles: 'Pick your styles',
  era: 'Your beer era?',
  group_size: "Who's coming?",
  neighborhood: 'Your hood?',
  avatar: 'Pick your look',
  display_name: 'Trail name',
}

const STEP_SUBTITLES = {
  vibe: 'How do you roll on the trail?',
  beer_styles: 'Select all that sound good',
  era: 'How deep is your craft beer game?',
  group_size: 'Rolling solo or squad deep?',
  neighborhood: 'Where are you based?',
  avatar: 'Choose your trail avatar',
  display_name: 'What should we call you on the leaderboard?',
}

export default function OnboardingFlow({ onComplete, user }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [selections, setSelections] = useState({
    vibe: null,
    beer_styles: [],
    era: null,
    group_size: null,
    neighborhood: null,
    avatar: null,
    display_name: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const currentStep = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1
  const progress = ((stepIndex + 1) / STEPS.length) * 100

  const canAdvance = () => {
    if (currentStep === 'beer_styles') return selections.beer_styles.length > 0
    if (currentStep === 'display_name') return selections.display_name.trim().length > 0
    return selections[currentStep] !== null
  }

  const handleSelect = (value) => {
    if (currentStep === 'beer_styles') {
      setSelections(prev => {
        const styles = prev.beer_styles.includes(value)
          ? prev.beer_styles.filter(s => s !== value)
          : [...prev.beer_styles, value]
        return { ...prev, beer_styles: styles }
      })
    } else {
      setSelections(prev => ({ ...prev, [currentStep]: value }))
    }
  }

  const handleNext = async () => {
    if (!canAdvance()) return

    if (isLastStep) {
      setSaving(true)
      setError(null)
      try {
        const payload = {
          vibe: selections.vibe,
          beer_styles: selections.beer_styles,
          era: selections.era,
          group_size: selections.group_size,
          neighborhood: selections.neighborhood,
          avatar: selections.avatar,
          display_name: selections.display_name.trim(),
        }
        const res = await saveOnboardingProfile(payload)
        if (res?.ok) {
          localStorage.setItem('hcm-onboarding-complete', 'true')
          localStorage.setItem('hcm-onboarding-profile', JSON.stringify(payload))
          onComplete()
        } else {
          setError(res?.error || 'Failed to save — tap to retry')
        }
      } catch (e) {
        setError('Network error — tap to retry')
      } finally {
        setSaving(false)
      }
    } else {
      setStepIndex(i => i + 1)
    }
  }

  const handleBack = () => {
    if (stepIndex > 0) setStepIndex(i => i - 1)
  }

  const handleSkip = () => {
    localStorage.setItem('hcm-onboarding-complete', 'true')
    onComplete()
  }

  const isSelected = (value) => {
    if (currentStep === 'beer_styles') return selections.beer_styles.includes(value)
    return selections[currentStep] === value
  }

  return (
    <div style={styles.container}>
      {/* Progress bar */}
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.stepCount}>
          {stepIndex + 1} / {STEPS.length}
        </div>
        <button onClick={handleSkip} style={styles.skipBtn}>
          Skip
        </button>
      </div>

      {/* Title */}
      <h2 style={styles.title}>{STEP_TITLES[currentStep]}</h2>
      <p style={styles.subtitle}>{STEP_SUBTITLES[currentStep]}</p>

      {/* Options */}
      <div style={styles.optionsContainer}>
        {currentStep === 'display_name' ? (
          <div style={styles.inputWrap}>
            <input
              type="text"
              value={selections.display_name}
              onChange={(e) => setSelections(prev => ({ ...prev, display_name: e.target.value }))}
              placeholder={user?.email?.split('@')[0] || 'Your trail name'}
              maxLength={50}
              style={styles.textInput}
              autoFocus
            />
            <div style={styles.charCount}>{selections.display_name.length}/50</div>
          </div>
        ) : (
          <div style={styles.grid}>
            {OPTIONS[currentStep]?.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                style={{
                  ...styles.optionBtn,
                  ...(isSelected(opt.value) ? styles.optionSelected : {}),
                }}
              >
                <span style={styles.optionEmoji}>{opt.emoji}</span>
                <span style={styles.optionLabel}>{opt.label}</span>
                {opt.desc && <span style={styles.optionDesc}>{opt.desc}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && <div style={styles.error}>{error}</div>}

      {/* Nav buttons */}
      <div style={styles.navRow}>
        {stepIndex > 0 ? (
          <button onClick={handleBack} style={styles.backBtn}>Back</button>
        ) : <div />}
        <button
          onClick={handleNext}
          disabled={!canAdvance() || saving}
          style={{
            ...styles.nextBtn,
            opacity: canAdvance() && !saving ? 1 : 0.5,
          }}
        >
          {saving ? 'Saving...' : isLastStep ? "Let's Go!" : 'Next'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: '#E31E24',
    display: 'flex',
    flexDirection: 'column',
    padding: '0 16px 24px',
    maxWidth: 480,
    margin: '0 auto',
    overflow: 'auto',
  },
  progressBar: {
    width: '100%',
    height: 4,
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    background: '#FFD100',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
  },
  stepCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: 700,
  },
  skipBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  title: {
    color: '#FFD100',
    fontSize: 28,
    fontWeight: 900,
    fontFamily: "'Inter', 'Impact', sans-serif",
    textTransform: 'uppercase',
    margin: '8px 0 4px',
    textShadow: '2px 2px 0 #000',
  },
  subtitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 20,
    opacity: 0.85,
  },
  optionsContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
  },
  optionBtn: {
    background: 'rgba(0,0,0,0.25)',
    border: '3px solid transparent',
    borderRadius: 12,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  optionSelected: {
    background: 'rgba(0,0,0,0.6)',
    borderColor: '#FFD100',
    transform: 'scale(1.03)',
  },
  optionEmoji: {
    fontSize: 32,
  },
  optionLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 800,
  },
  optionDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: 700,
  },
  inputWrap: {
    padding: '20px 0',
  },
  textInput: {
    width: '100%',
    padding: '16px',
    fontSize: 20,
    fontWeight: 800,
    background: 'rgba(0,0,0,0.3)',
    border: '3px solid #FFD100',
    borderRadius: 12,
    color: '#fff',
    outline: 'none',
    textAlign: 'center',
    fontFamily: "'Inter', sans-serif",
  },
  charCount: {
    textAlign: 'right',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 8,
  },
  error: {
    background: 'rgba(0,0,0,0.5)',
    color: '#FFD100',
    padding: '10px 16px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 8,
  },
  navRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    gap: 12,
  },
  backBtn: {
    background: 'rgba(0,0,0,0.3)',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: 10,
    padding: '12px 24px',
    color: '#fff',
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
  },
  nextBtn: {
    background: '#FFD100',
    border: '3px solid #000',
    borderRadius: 10,
    padding: '12px 32px',
    color: '#000',
    fontSize: 16,
    fontWeight: 900,
    cursor: 'pointer',
    boxShadow: '3px 3px 0 #000',
    fontFamily: "'Inter', 'Impact', sans-serif",
    textTransform: 'uppercase',
  },
}
