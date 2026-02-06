import { useState } from 'react'
import translations from '../translations'

const COUNTRIES = [
  "Vietnam", "United States", "United Kingdom", "Australia", "South Korea", 
  "Japan", "France", "Germany", "Canada", "Singapore", "Thailand", 
  "Malaysia", "Indonesia", "Philippines", "China", "Taiwan", "Hong Kong",
  "Netherlands", "Belgium", "New Zealand", "Ireland", "Sweden", "Denmark",
  "Norway", "Finland", "Switzerland", "Austria", "Italy", "Spain", "Portugal",
  "Brazil", "Mexico", "Argentina", "India", "Russia", "South Africa", "Other"
]

function WelcomeModal({ language, onComplete }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [dob, setDob] = useState('')
  const [country, setCountry] = useState('')
  const [error, setError] = useState('')

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

  const handleSubmit = () => {
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

    const userData = {
      name: name.trim(),
      email: email.trim(),
      dob,
      age,
      country: country || null,
      registeredAt: new Date().toISOString()
    }

    // Save to localStorage
    localStorage.setItem('hcm-user', JSON.stringify(userData))

    // Call completion handler
    onComplete(userData)
  }

  return (
    <div className="modal-overlay">
      <div className="welcome-modal">
        <div className="welcome-icon">🍺</div>
        <h2 className="welcome-title">{t.welcome}</h2>
        <p className="welcome-subtitle">{t.welcomeSubtitle}</p>

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

        {error && (
          <div className="form-error">{error}</div>
        )}

        <button className="welcome-btn" onClick={handleSubmit}>
          {t.startTrail}
        </button>

        <p className="welcome-disclaimer">
          🔒 Your data is stored locally and used only for the Ale Trail experience.
        </p>
      </div>
    </div>
  )
}

export default WelcomeModal
