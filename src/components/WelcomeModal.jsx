import { useState } from 'react'
import translations from '../translations'
import { registerParticipant, getParticipantCheckins } from '../lib/supabase'

const COUNTRIES = [
  "Vietnam", "United States", "United Kingdom", "Australia", "South Korea", 
  "Japan", "France", "Germany", "Canada", "Singapore", "Thailand", 
  "Malaysia", "Indonesia", "Philippines", "China", "Taiwan", "Hong Kong",
  "Netherlands", "Belgium", "New Zealand", "Ireland", "Sweden", "Denmark",
  "Norway", "Finland", "Switzerland", "Austria", "Italy", "Spain", "Portugal",
  "Brazil", "Mexico", "Argentina", "India", "Russia", "South Africa", "Other"
]

function WelcomeModal({ language, setLanguage, onComplete, onSignIn }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [dob, setDob] = useState('')
  const [country, setCountry] = useState('')
  const [gender, setGender] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const t = translations[language]

  const calculateAge = (birthDate) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async () => {
    setError('')

    if (!name.trim()) {
      setError(t.nameRequired)
      return
    }

    if (!email.trim() || !validateEmail(email)) {
      setError(t.emailRequired)
      return
    }

    if (!dob) {
      setError(t.dobRequired)
      return
    }

    const age = calculateAge(dob)
    if (age < 18) {
      setError(t.mustBe18)
      return
    }

    setIsLoading(true)

    try {
      const { data: participant, error: supabaseError, isExisting } = await registerParticipant({
        name: name.trim(),
        email: email.trim(),
        dateOfBirth: dob,
        country: country || null,
        gender: gender || null,
      })

      if (supabaseError) {
        console.error('Supabase error:', supabaseError)
        setError('Registration failed. Please try again.')
        setIsLoading(false)
        return
      }

      // If existing user, fetch their stamps from Supabase
      let existingStamps = []
      if (isExisting && participant?.id) {
        const { data: stamps } = await getParticipantCheckins(participant.id)
        existingStamps = stamps || []
      }

      const userData = {
        id: participant.id,
        name: isExisting ? participant.display_name : name.trim(),
        email: email.trim(),
        dob,
        age,
        country: country || null,
        gender: gender || null,
        registeredAt: new Date().toISOString(),
        isExisting,
        existingStamps
      }

      localStorage.setItem('hcm-user', JSON.stringify(userData))
      onComplete(userData)

    } catch (err) {
      console.error('Registration error:', err)
      setError('Registration failed. Please try again.')
    }

    setIsLoading(false)
  }

  return (
    <div className="modal-overlay">
      <div className="welcome-modal">
        {/* Language Toggle - Flat rectangular flags */}
        <div className="language-toggle">
          <button 
            className={`flag-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
          >
            <img src="https://flagcdn.com/w80/us.png" alt="EN" className="flag-img-sm" />
          </button>
          <button 
            className={`flag-btn ${language === 'vn' ? 'active' : ''}`}
            onClick={() => setLanguage('vn')}
          >
            <img src="https://flagcdn.com/w80/vn.png" alt="VN" className="flag-img-sm" />
          </button>
          <button 
            className={`flag-btn ${language === 'kr' ? 'active' : ''}`}
            onClick={() => setLanguage('kr')}
          >
            <img src="https://flagcdn.com/w80/kr.png" alt="KR" className="flag-img-sm" />
          </button>
          <button 
            className={`flag-btn ${language === 'jp' ? 'active' : ''}`}
            onClick={() => setLanguage('jp')}
          >
            <img src="https://flagcdn.com/w80/jp.png" alt="JP" className="flag-img-sm" />
          </button>
        </div>

        {/* Logo */}
        <img 
          src="/logos/HCM Logo-Ale-Trail-2023-BK.png" 
          alt="HCM Ale Trail" 
          className="welcome-logo"
        />
        
        <h2 className="welcome-title">{t.welcome}</h2>
        <p className="welcome-subtitle">{t.welcomeSubtitle}</p>

        {onSignIn && (
          <p style={{ textAlign: 'center', marginTop: '-1.25rem', marginBottom: '1rem', fontWeight: 'bold', color: '#000' }}>
            {t.alreadyHaveAccount}{' '}
            <button className="auth-link-btn" type="button" onClick={onSignIn} style={{ fontSize: 'inherit', fontWeight: 'bold', color: '#c0392b' }}>
              {t.signInLink}
            </button>
          </p>
        )}

        <div className="form-group">
          <label>{t.yourName} *</label>
          <input
            type="text"
            className="text-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
          />
        </div>

        <div className="form-group">
          <label>{t.yourEmail} *</label>
          <input
            type="email"
            className="text-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
          />
        </div>

        <div className="form-group">
          <label>{t.dateOfBirth} *</label>
          <input
            type="date"
            className="text-input"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="form-group">
          <label>{t.country}</label>
          <select
            className="text-input"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">{t.selectCountry}</option>
            {COUNTRIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Gender Toggle */}
        <div className="form-group">
          <label>{t.gender || 'Gender'} ({t.optional || 'Optional'})</label>
          <div className="gender-toggle">
            <button
              type="button"
              className={`gender-btn ${gender === 'male' ? 'active' : ''}`}
              onClick={() => setGender(gender === 'male' ? '' : 'male')}
            >
              {t.male || 'Male'}
            </button>
            <button
              type="button"
              className={`gender-btn ${gender === 'female' ? 'active' : ''}`}
              onClick={() => setGender(gender === 'female' ? '' : 'female')}
            >
              {t.female || 'Female'}
            </button>
          </div>
        </div>

        {error && (
          <div className="form-error">{error}</div>
        )}

        <button 
          className="welcome-btn" 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : t.startTrail}
        </button>

        <p className="welcome-disclaimer">
          🔒 {t.disclaimer || 'Your data is securely stored and used only for the Ale Trail experience.'}
        </p>

      </div>
    </div>
  )
}

export default WelcomeModal