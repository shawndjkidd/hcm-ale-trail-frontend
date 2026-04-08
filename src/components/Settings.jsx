import { useState } from 'react'
import { changePassword, changeEmail } from '../lib/api'
import translations from '../translations'
import OnboardingFlow from './OnboardingFlow'
import TrailIcon from './TrailIcons'

// Maps for display labels
const LABELS = {
  backpacker: 'Backpacker', digital_nomad: 'Digital Nomad', suit: 'Suit & Tie',
  teacher_ngo: 'Teacher / NGO', student: 'Student', just_vibing: 'Just Vibing',
  rookie: 'Rookie', prime: 'In My Prime', seasoned: 'Seasoned', og: 'OG',
  male: 'Male', female: 'Female', skip: 'Rather Not Say',
  glass: 'Glass', pint: 'Pint', growler: 'Growler', tower: 'Tower',
  d1: 'District 1', d2: 'D2 / Thu Duc', d3: 'District 3', d7: 'District 7',
  binh_thanh: 'Binh Thanh', other_hcmc: 'Other HCMC', visitor: 'Visiting',
  ipa: 'IPA', lager: 'Lager', stout: 'Stout', sour: 'Sour', wheat: 'Wheat', surprise: 'Surprise Me',
}

// Which icon type to use for location values (all map to 'district' except visitor)
const locationIconType = (val) => val === 'visitor' ? 'visitor' : 'district'

export default function Settings({ user, language, onBack }) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [editField, setEditField] = useState(null) // which field to edit: 'lifestyle', 'beer_styles', etc.
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

  // Force re-read from localStorage
  const [, setRefresh] = useState(0)

  const t = translations[language]

  const profile = JSON.parse(localStorage.getItem('hcm-onboarding-profile') || 'null')

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

  const handleFieldEdit = (field) => {
    setEditField(field)
  }

  const handleEditComplete = () => {
    setEditField(null)
    setRefresh(n => n + 1) // re-read localStorage
  }

  // Render a single profile row with icon, label, value, and tap-to-edit
  const ProfileRow = ({ label, field, value, iconType, iconSize = 24 }) => (
    <button
      onClick={() => handleFieldEdit(field)}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        padding: '12px 0',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div style={{ width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <TrailIcon type={iconType} size={iconSize} color="#FFD100" />
      </div>
      <div style={{ flex: 1, marginLeft: 12 }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </div>
        <div style={{ color: '#fff', fontSize: 14, fontWeight: 800, marginTop: 2 }}>
          {value || '—'}
        </div>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18, flexShrink: 0, paddingLeft: 8 }}>›</div>
    </button>
  )

  // Beer styles row — shows multiple icons
  const BeerStylesRow = () => {
    const styles = profile?.beer_styles || []
    return (
      <button
        onClick={() => handleFieldEdit('beer_styles')}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '12px 0',
          background: 'none',
          border: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <TrailIcon type={styles[0] || 'lager'} size={24} color="#FFD100" />
        </div>
        <div style={{ flex: 1, marginLeft: 12 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Beer Styles
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
            {styles.length > 0 ? styles.map(s => (
              <div key={s} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(255,209,0,0.15)', borderRadius: 6, padding: '3px 8px',
              }}>
                <TrailIcon type={s} size={16} color="#FFD100" />
                <span style={{ color: '#FFD100', fontSize: 12, fontWeight: 800 }}>{LABELS[s] || s.toUpperCase()}</span>
              </div>
            )) : (
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>—</span>
            )}
          </div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18, flexShrink: 0, paddingLeft: 8 }}>›</div>
      </button>
    )
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
          {(!profile || !profile.lifestyle) ? (
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
          ) : (
            <div style={{ margin: '0 -4px' }}>
              <ProfileRow
                label="Lifestyle"
                field="lifestyle"
                value={LABELS[profile.lifestyle] || profile.lifestyle}
                iconType={profile.lifestyle}
              />
              <BeerStylesRow />
              <ProfileRow
                label="Location"
                field="location"
                value={
                  (LABELS[profile.neighborhood] || profile.neighborhood || '') +
                  (profile.home_country && profile.home_country !== 'VN' ? ` (${profile.home_country})` : '')
                }
                iconType={locationIconType(profile.neighborhood)}
              />
              <ProfileRow
                label="Beer Experience"
                field="era"
                value={LABELS[profile.era] || profile.era}
                iconType={profile.era}
              />
              <ProfileRow
                label="Gender"
                field="gender"
                value={LABELS[profile.gender] || '—'}
                iconType={profile.gender || 'skip'}
              />
              <ProfileRow
                label="Vessel"
                field="avatar"
                value={LABELS[profile.avatar] || profile.avatar}
                iconType={profile.avatar}
              />
              <ProfileRow
                label="Trail Name"
                field="display_name"
                value={profile.display_name || '—'}
                iconType={profile.avatar || 'pint'}
                iconSize={20}
              />
              <button
                className="settings-submit-btn"
                onClick={() => setShowOnboarding(true)}
                style={{ width: '100%', marginTop: 16 }}
              >
                EDIT ALL
              </button>
            </div>
          )}
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

      {/* Full onboarding flow (edit all) */}
      {showOnboarding && (
        <OnboardingFlow
          user={user}
          onComplete={() => { setShowOnboarding(false); setRefresh(n => n + 1) }}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      {/* Single-field editor */}
      {editField && (
        <OnboardingFlow
          user={user}
          initialStep={editField}
          onComplete={handleEditComplete}
          onClose={() => setEditField(null)}
        />
      )}
    </div>
  )
}
