import { useState } from 'react'
import { changePassword, changeEmail } from '../lib/api'
import translations from '../translations'
import OnboardingFlow from './OnboardingFlow'

export default function Settings({ user, language, onBack }) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Email change state
  const [editingEmail, setEditingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailBusy, setEmailBusy] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState(false)

  const t = translations[language]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError(t.passwordMismatch || 'Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setError(t.passwordTooShort || 'Password must be at least 6 characters')
      return
    }

    setBusy(true)
    try {
      const res = await changePassword(newPassword)
      if (res?.ok) {
        setSuccess(true)
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(res?.error || 'Failed to change password')
      }
    } finally {
      setBusy(false)
    }
  }

  const handleEmailSave = async () => {
    setEmailError('')
    setEmailSuccess(false)
    if (!newEmail.trim()) return

    setEmailBusy(true)
    try {
      const res = await changeEmail(newEmail.trim())
      if (res?.ok) {
        setEmailSuccess(true)
        setEditingEmail(false)
        setNewEmail('')
      } else {
        setEmailError(res?.error || t.emailChangeError || 'Failed to change email. Please try again.')
      }
    } catch {
      setEmailError(t.emailChangeError || 'Failed to change email. Please try again.')
    } finally {
      setEmailBusy(false)
    }
  }

  const handleEmailCancel = () => {
    setEditingEmail(false)
    setNewEmail('')
    setEmailError('')
    setEmailSuccess(false)
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="settings-back-btn" onClick={onBack}>← {t.back || 'BACK'}</button>
        <h1 className="settings-title">{t.profile || 'PROFILE'}</h1>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h2 className="settings-section-title">{t.accountInfo || 'ACCOUNT'}</h2>
          <div className="settings-field">
            <label className="settings-label">{t.yourEmail || 'Email'}</label>
            {!editingEmail ? (
              <div className="settings-email-row">
                <div className="settings-email-display">{user?.email || '—'}</div>
                <button
                  className="settings-edit-btn"
                  onClick={() => setEditingEmail(true)}
                >
                  {t.editEmail || 'Edit'}
                </button>
              </div>
            ) : (
              <div className="settings-email-edit">
                <label className="settings-label">{t.newEmailLabel || 'New Email'}</label>
                <input
                  type="email"
                  className="settings-input"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={user?.email || 'new@email.com'}
                  autoFocus
                />
                {emailError && <div className="settings-error">{emailError}</div>}
                <div className="settings-email-actions">
                  <button
                    className="settings-submit-btn"
                    onClick={handleEmailSave}
                    disabled={emailBusy || !newEmail.trim()}
                  >
                    {emailBusy ? '...' : (t.saveEmail || 'SAVE')}
                  </button>
                  <button
                    className="settings-cancel-btn"
                    onClick={handleEmailCancel}
                    disabled={emailBusy}
                  >
                    {t.cancelEdit || 'Cancel'}
                  </button>
                </div>
              </div>
            )}
            {emailSuccess && (
              <div className="settings-success">
                {t.emailConfirmationSent || 'Confirmation email sent. Check your new inbox to verify.'}
              </div>
            )}
          </div>
        </div>

        <div className="settings-section">
          <h2 className="settings-section-title">TRAIL PROFILE</h2>
          {(() => {
            const profile = JSON.parse(localStorage.getItem('hcm-onboarding-profile') || 'null')
            if (!profile || !profile.lifestyle) return (
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 12 }}>
                  Tell us about yourself to personalize your trail
                </p>
                <button
                  className="settings-submit-btn"
                  onClick={() => setShowOnboarding(true)}
                  style={{ width: '100%' }}
                >
                  SET UP TRAIL PROFILE
                </button>
              </div>
            )
            const labels = {
              backpacker: '🎒 Backpacker', digital_nomad: '💻 Digital Nomad', suit: '👔 Suit & Tie',
              teacher_ngo: '📚 Teacher/NGO', student: '🎓 Student', just_vibing: '✌️ Just Vibing',
              rookie: '🌱 Rookie', prime: '💪 In My Prime', seasoned: '🎖️ Seasoned', og: '👑 OG',
              male: 'Male', female: 'Female',
              glass: '◇ Glass', pint: '◆ Pint', growler: '⬡ Growler', tower: '⬢ Tower',
              d1: 'District 1', d2: 'D2/Thu Duc', d3: 'District 3', d7: 'District 7',
              binh_thanh: 'Binh Thanh', other_hcmc: 'Other HCMC', visitor: 'Visiting',
            }
            const fieldStyle = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }
            const labelStyle = { color: 'rgba(255,255,255,0.6)', fontSize: 13 }
            const valueStyle = { color: '#FFD100', fontSize: 13, fontWeight: 800 }
            return (
              <div>
                <div style={fieldStyle}>
                  <span style={labelStyle}>Lifestyle</span>
                  <span style={valueStyle}>{labels[profile.lifestyle] || profile.lifestyle}</span>
                </div>
                <div style={fieldStyle}>
                  <span style={labelStyle}>Beer Styles</span>
                  <span style={valueStyle}>{(profile.beer_styles || []).map(s => s.toUpperCase()).join(', ')}</span>
                </div>
                <div style={fieldStyle}>
                  <span style={labelStyle}>Location</span>
                  <span style={valueStyle}>{labels[profile.neighborhood] || profile.neighborhood}{profile.home_country && profile.home_country !== 'VN' ? ` (${profile.home_country})` : ''}</span>
                </div>
                <div style={fieldStyle}>
                  <span style={labelStyle}>Beer Experience</span>
                  <span style={valueStyle}>{labels[profile.era] || profile.era}</span>
                </div>
                <div style={fieldStyle}>
                  <span style={labelStyle}>Gender</span>
                  <span style={valueStyle}>{labels[profile.gender] || '—'}</span>
                </div>
                <div style={{ ...fieldStyle, borderBottom: 'none' }}>
                  <span style={labelStyle}>Vessel</span>
                  <span style={valueStyle}>{labels[profile.avatar] || profile.avatar}</span>
                </div>
                <button
                  className="settings-submit-btn"
                  onClick={() => setShowOnboarding(true)}
                  style={{ width: '100%', marginTop: 12 }}
                >
                  EDIT TRAIL PROFILE
                </button>
              </div>
            )
          })()}
        </div>

        <div className="settings-section">
          <h2 className="settings-section-title">{t.changePasswordTitle || 'CHANGE PASSWORD'}</h2>
          <form onSubmit={handleSubmit} className="settings-form">
            <div className="settings-field">
              <label className="settings-label">{t.newPassword || 'New Password'}</label>
              <input
                type="password"
                className="settings-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">{t.confirmPassword || 'Confirm Password'}</label>
              <input
                type="password"
                className="settings-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            {error && <div className="settings-error">{error}</div>}
            {success && <div className="settings-success">{t.passwordChanged || 'Password updated successfully!'}</div>}
            <button
              type="submit"
              className="settings-submit-btn"
              disabled={busy || !newPassword || !confirmPassword}
            >
              {busy ? '...' : (t.updatePassword || 'UPDATE PASSWORD')}
            </button>
          </form>
        </div>
      </div>

      {showOnboarding && (
        <OnboardingFlow
          user={user}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </div>
  )
}
