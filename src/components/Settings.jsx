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
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 12 }}>
            Your vibe, beer preferences, and trail avatar
          </p>
          <button
            className="settings-submit-btn"
            onClick={() => {
              localStorage.removeItem('hcm-onboarding-complete')
              localStorage.removeItem('hcm-onboarding-profile')
              setShowOnboarding(true)
            }}
            style={{ width: '100%' }}
          >
            EDIT TRAIL PROFILE
          </button>
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
