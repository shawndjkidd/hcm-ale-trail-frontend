import { useState } from 'react'
import { saveOnboardingProfile } from '../lib/api'
import TrailIcon from './TrailIcons'
import translations from '../translations'

// Step order: lifestyle → beer styles → where from → beer experience → gender → avatar → display name
const STEPS = ['lifestyle', 'beer_styles', 'location', 'era', 'gender', 'avatar', 'display_name']

const OPTIONS = {
  lifestyle: [
    { value: 'backpacker', labelKey: 'optBackpacker', descKey: 'descBackpacker' },
    { value: 'digital_nomad', labelKey: 'optDigitalNomad', descKey: 'descDigitalNomad' },
    { value: 'suit', labelKey: 'optSuit', descKey: 'descSuit' },
    { value: 'teacher_ngo', labelKey: 'optTeacherNgo', descKey: 'descTeacherNgo' },
    { value: 'student', labelKey: 'optStudent', descKey: 'descStudent' },
    { value: 'just_vibing', labelKey: 'optJustVibing', descKey: 'descJustVibing' },
  ],
  beer_styles: [
    { value: 'ipa', labelKey: 'optIpa' },
    { value: 'lager', labelKey: 'optLager' },
    { value: 'stout', labelKey: 'optStout' },
    { value: 'sour', labelKey: 'optSour' },
    { value: 'wheat', labelKey: 'optWheat' },
    { value: 'surprise', labelKey: 'optSurprise' },
  ],
  location_hcmc: [
    { value: 'd1', labelKey: 'optDistrict1' },
    { value: 'd2', labelKey: 'optD2' },
    { value: 'd3', labelKey: 'optDistrict3' },
    { value: 'd7', labelKey: 'optDistrict7' },
    { value: 'binh_thanh', labelKey: 'optBinhThanh' },
  ],
  era: [
    { value: 'rookie', labelKey: 'optRookie', descKey: 'descRookie' },
    { value: 'prime', labelKey: 'optPrime', descKey: 'descPrime' },
    { value: 'seasoned', labelKey: 'optSeasoned', descKey: 'descSeasoned' },
    { value: 'og', labelKey: 'optOg', descKey: 'descOg' },
  ],
  gender: [
    { value: 'male', labelKey: 'optMale' },
    { value: 'female', labelKey: 'optFemale' },
    { value: 'other', labelKey: 'optOther' },
  ],
  avatar: [
    { value: 'glass', labelKey: 'optGlass', descKey: 'descGlass' },
    { value: 'pint', labelKey: 'optPint', descKey: 'descPint' },
    { value: 'growler', labelKey: 'optGrowler', descKey: 'descGrowler' },
    { value: 'tower', labelKey: 'optTower', descKey: 'descTower' },
  ],
}

const POPULAR_COUNTRIES = [
  { value: 'US', label: '🇺🇸 United States' },
  { value: 'GB', label: '🇬🇧 United Kingdom' },
  { value: 'AU', label: '🇦🇺 Australia' },
  { value: 'KR', label: '🇰🇷 South Korea' },
  { value: 'JP', label: '🇯🇵 Japan' },
  { value: 'FR', label: '🇫🇷 France' },
  { value: 'DE', label: '🇩🇪 Germany' },
  { value: 'CA', label: '🇨🇦 Canada' },
  { value: 'NL', label: '🇳🇱 Netherlands' },
  { value: 'SG', label: '🇸🇬 Singapore' },
  { value: 'TH', label: '🇹🇭 Thailand' },
  { value: 'NZ', label: '🇳🇿 New Zealand' },
  { value: 'IE', label: '🇮🇪 Ireland' },
  { value: 'SE', label: '🇸🇪 Sweden' },
  { value: 'DK', label: '🇩🇰 Denmark' },
  { value: 'RU', label: '🇷🇺 Russia' },
  { value: 'IN', label: '🇮🇳 India' },
  { value: 'CN', label: '🇨🇳 China' },
  { value: 'TW', label: '🇹🇼 Taiwan' },
  { value: 'PH', label: '🇵🇭 Philippines' },
  { value: 'MY', label: '🇲🇾 Malaysia' },
  { value: 'ID', label: '🇮🇩 Indonesia' },
  { value: 'BR', label: '🇧🇷 Brazil' },
  { value: 'MX', label: '🇲🇽 Mexico' },
  { value: 'ZA', label: '🇿🇦 South Africa' },
  { value: 'IT', label: '🇮🇹 Italy' },
  { value: 'ES', label: '🇪🇸 Spain' },
  { value: 'BE', label: '🇧🇪 Belgium' },
  { value: 'CZ', label: '🇨🇿 Czech Republic' },
  { value: 'PL', label: '🇵🇱 Poland' },
]

export default function OnboardingFlow({ onComplete, onClose, user, language = 'en', initialStep }) {
  const t = translations[language] || translations.en

  // If initialStep is provided, jump straight to that step
  const startIndex = initialStep ? STEPS.indexOf(initialStep) : 0
  const [stepIndex, setStepIndex] = useState(startIndex >= 0 ? startIndex : 0)
  const [singleFieldMode] = useState(!!initialStep)

  // Load existing profile data as defaults when editing
  const existingProfile = JSON.parse(localStorage.getItem('hcm-onboarding-profile') || 'null')

  const [selections, setSelections] = useState({
    lifestyle: existingProfile?.lifestyle || null,
    beer_styles: existingProfile?.beer_styles || [],
    neighborhood: existingProfile?.neighborhood || null,
    home_country: existingProfile?.home_country || null,
    era: existingProfile?.era || null,
    gender: existingProfile?.gender || null,
    avatar: existingProfile?.avatar || null,
    display_name: existingProfile?.display_name || '',
  })
  const [locationMode, setLocationMode] = useState(null)
  const [countrySearch, setCountrySearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const currentStep = STEPS[stepIndex]
  const isLocationCountryStep = currentStep === 'location' && locationMode === 'visitor'
  const effectiveStep = isLocationCountryStep ? 'location_country' : currentStep

  const totalSteps = STEPS.length
  const isLastStep = singleFieldMode || stepIndex === STEPS.length - 1
  const progress = ((stepIndex + 1) / totalSteps) * 100

  // Translated step titles and subtitles
  const STEP_TITLES = {
    lifestyle: t.onboardingLifestyleTitle,
    beer_styles: t.onboardingBeerStylesTitle,
    location: t.onboardingLocationTitle,
    location_country: t.onboardingCountryTitle,
    era: t.onboardingEraTitle,
    gender: t.onboardingGenderTitle,
    avatar: t.onboardingAvatarTitle,
    display_name: t.onboardingDisplayNameTitle,
  }

  const STEP_SUBTITLES = {
    lifestyle: t.onboardingLifestyleSubtitle,
    beer_styles: t.onboardingBeerStylesSubtitle,
    location: t.onboardingLocationSubtitle,
    location_country: t.onboardingCountrySubtitle,
    era: t.onboardingEraSubtitle,
    gender: t.onboardingGenderSubtitle,
    avatar: t.onboardingAvatarSubtitle,
    display_name: t.onboardingDisplayNameSubtitle,
  }

  const canAdvance = () => {
    if (effectiveStep === 'beer_styles') return selections.beer_styles.length > 0
    if (effectiveStep === 'display_name') return true // name is optional
    if (effectiveStep === 'location') return selections.neighborhood !== null
    if (effectiveStep === 'location_country') return selections.home_country !== null
    if (effectiveStep === 'lifestyle') return selections.lifestyle !== null
    if (effectiveStep === 'era') return selections.era !== null
    if (effectiveStep === 'gender') return selections.gender !== null
    if (effectiveStep === 'avatar') return selections.avatar !== null
    return false
  }

  const handleSelect = (value) => {
    if (effectiveStep === 'beer_styles') {
      setSelections(prev => {
        const styles = prev.beer_styles.includes(value)
          ? prev.beer_styles.filter(s => s !== value)
          : [...prev.beer_styles, value]
        return { ...prev, beer_styles: styles }
      })
    } else if (effectiveStep === 'location') {
      if (value === '_visitor') {
        setLocationMode('visitor')
      } else {
        setSelections(prev => ({ ...prev, neighborhood: value, home_country: 'VN' }))
      }
    } else if (effectiveStep === 'location_country') {
      setSelections(prev => ({ ...prev, home_country: value, neighborhood: 'visitor' }))
    } else if (effectiveStep === 'lifestyle') {
      setSelections(prev => ({ ...prev, lifestyle: value }))
    } else if (effectiveStep === 'era') {
      setSelections(prev => ({ ...prev, era: value }))
    } else if (effectiveStep === 'gender') {
      setSelections(prev => ({ ...prev, gender: value }))
    } else if (effectiveStep === 'avatar') {
      setSelections(prev => ({ ...prev, avatar: value }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        lifestyle: selections.lifestyle,
        beer_styles: selections.beer_styles,
        neighborhood: selections.neighborhood,
        home_country: selections.home_country,
        era: selections.era,
        gender: selections.gender,
        avatar: selections.avatar,
        display_name: selections.display_name.trim(),
      }
      const res = await saveOnboardingProfile(payload)
      if (res?.ok) {
        localStorage.setItem('hcm-onboarding-complete', 'true')
        localStorage.setItem('hcm-onboarding-profile', JSON.stringify(payload))
        onComplete()
      } else {
        setError(res?.error || t.onboardingSaveError)
      }
    } catch (e) {
      setError(t.onboardingNetworkError)
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    if (!canAdvance()) return
    if (isLastStep) {
      await handleSave()
    } else {
      setStepIndex(i => i + 1)
      setLocationMode(null)
    }
  }

  const handleBack = () => {
    if (isLocationCountryStep) {
      setLocationMode(null)
      return
    }
    if (singleFieldMode) {
      onClose?.()
      return
    }
    if (stepIndex > 0) setStepIndex(i => i - 1)
  }

  const handleSkip = async () => {
    // Save whatever answers we have so far, then complete
    const payload = {
      lifestyle: selections.lifestyle,
      beer_styles: selections.beer_styles,
      neighborhood: selections.neighborhood,
      home_country: selections.home_country,
      era: selections.era,
      gender: selections.gender,
      avatar: selections.avatar,
      display_name: selections.display_name.trim(),
    }
    // Only save to server if we have at least one answer
    const hasAny = payload.lifestyle || payload.beer_styles.length > 0 || payload.era || payload.avatar
    if (hasAny) {
      try { await saveOnboardingProfile(payload) } catch {}
      localStorage.setItem('hcm-onboarding-profile', JSON.stringify(payload))
    }
    localStorage.setItem('hcm-onboarding-complete', 'true')
    onComplete()
  }

  const isSelected = (value) => {
    if (effectiveStep === 'beer_styles') return selections.beer_styles.includes(value)
    if (effectiveStep === 'location') return selections.neighborhood === value
    if (effectiveStep === 'location_country') return selections.home_country === value
    if (effectiveStep === 'lifestyle') return selections.lifestyle === value
    if (effectiveStep === 'era') return selections.era === value
    if (effectiveStep === 'gender') return selections.gender === value
    if (effectiveStep === 'avatar') return selections.avatar === value
    return false
  }

  const iconColor = (value) => isSelected(value) ? '#FFD100' : 'rgba(255,255,255,0.85)'

  const filteredCountries = countrySearch.trim()
    ? POPULAR_COUNTRIES.filter(c => c.label.toLowerCase().includes(countrySearch.toLowerCase()))
    : POPULAR_COUNTRIES

  const renderLocationStep = () => {
    if (isLocationCountryStep) {
      return (
        <div>
          <div style={styles.inputWrap}>
            <input
              type="text"
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              placeholder={t.onboardingSearchCountry}
              style={{ ...styles.textInput, fontSize: 16, textAlign: 'left', padding: '12px 16px' }}
              autoFocus
            />
          </div>
          <div style={{ ...styles.grid, gridTemplateColumns: '1fr', gap: 8, maxHeight: '45vh', overflowY: 'auto' }}>
            {filteredCountries.map(c => (
              <button
                key={c.value}
                onClick={() => handleSelect(c.value)}
                style={{
                  ...styles.optionBtn,
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  padding: '12px 16px',
                  gap: 12,
                  ...(isSelected(c.value) ? styles.optionSelected : {}),
                }}
              >
                <span style={{ ...styles.optionLabel, fontSize: 16 }}>{c.label}</span>
              </button>
            ))}
            {filteredCountries.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: 20 }}>
                {t.onboardingNoMatch}
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div style={styles.grid}>
        {OPTIONS.location_hcmc.map(opt => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            style={{
              ...styles.optionBtn,
              ...(isSelected(opt.value) ? styles.optionSelected : {}),
            }}
          >
            <span style={styles.iconWrap}>
              <TrailIcon type={opt.value} size={36} color={isSelected(opt.value) ? '#FFD100' : 'rgba(255,255,255,0.85)'} />
            </span>
            <span style={styles.optionLabel}>{t[opt.labelKey] || opt.labelKey}</span>
          </button>
        ))}
        <button
          onClick={() => handleSelect('_visitor')}
          style={{
            ...styles.optionBtn,
            gridColumn: '1 / -1',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            background: 'rgba(255,209,0,0.15)',
            border: '3px solid rgba(255,209,0,0.4)',
          }}
        >
          <span style={styles.iconWrap}>
            <TrailIcon type="visitor" size={28} color="rgba(255,255,255,0.9)" />
          </span>
          <span style={styles.optionLabel}>{t.onboardingJustVisiting}</span>
          <span style={styles.optionDesc}>{t.onboardingPickCountryNext}</span>
        </button>
      </div>
    )
  }

  // Button text based on state
  const nextBtnText = saving
    ? t.onboardingSaving
    : singleFieldMode
      ? t.onboardingSave
      : isLastStep
        ? t.onboardingLetsGo
        : t.onboardingNext

  return (
    <div style={styles.container}>
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      <div style={styles.header}>
        <div style={styles.stepCount}>
          {singleFieldMode ? t.onboardingEdit : `${stepIndex + 1} / ${totalSteps}`}
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {!singleFieldMode && (
            <button onClick={handleSkip} style={styles.skipBtn}>
              {t.onboardingSkip}
            </button>
          )}
          {onClose && (
            <button onClick={onClose} style={styles.closeBtn}>
              ✕
            </button>
          )}
        </div>
      </div>

      <h2 style={styles.title}>{STEP_TITLES[effectiveStep]}</h2>
      <p style={styles.subtitle}>{STEP_SUBTITLES[effectiveStep]}</p>

      <div style={styles.optionsContainer}>
        {effectiveStep === 'display_name' ? (
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
        ) : effectiveStep === 'location' || effectiveStep === 'location_country' ? (
          renderLocationStep()
        ) : (
          <div style={styles.grid}>
            {OPTIONS[effectiveStep]?.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                style={{
                  ...styles.optionBtn,
                  ...(isSelected(opt.value) ? styles.optionSelected : {}),
                }}
              >
                <span style={styles.iconWrap}>
                  <TrailIcon type={opt.value} size={40} color={iconColor(opt.value)} />
                </span>
                <span style={styles.optionLabel}>{t[opt.labelKey] || opt.labelKey}</span>
                {opt.descKey && <span style={styles.optionDesc}>{t[opt.descKey] || opt.descKey}</span>}
              </button>
            ))}
          </div>
          {effectiveStep === 'gender' && (
            <button
              onClick={() => handleSelect('skip')}
              style={{
                ...styles.optionBtn,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 16px',
                marginTop: 12,
                background: 'rgba(255,255,255,0.1)',
                border: '2px solid rgba(255,255,255,0.2)',
                ...(isSelected('skip') ? { ...styles.optionSelected, background: 'rgba(0,0,0,0.6)' } : {}),
              }}
            >
              <TrailIcon type="skip" size={20} color={isSelected('skip') ? '#FFD100' : 'rgba(255,255,255,0.6)'} />
              <span style={{ ...styles.optionLabel, fontSize: 13, color: isSelected('skip') ? '#FFD100' : 'rgba(255,255,255,0.6)' }}>
                {t.optSkip}
              </span>
            </button>
          )}
        )}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.navRow}>
        {stepIndex > 0 || isLocationCountryStep || singleFieldMode ? (
          <button onClick={handleBack} style={styles.backBtn}>
            {singleFieldMode ? t.onboardingCancel : t.onboardingBack}
          </button>
        ) : <div />}
        <button
          onClick={handleNext}
          disabled={!canAdvance() || saving}
          style={{
            ...styles.nextBtn,
            opacity: canAdvance() && !saving ? 1 : 0.5,
          }}
        >
          {nextBtnText}
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
  closeBtn: {
    background: 'rgba(0,0,0,0.3)',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: 8,
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 16,
    cursor: 'pointer',
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
  iconWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
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
