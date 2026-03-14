import { useState } from 'react'
import { changePassword } from '../lib/api'
import translations from '../translations'

export default function Settings({ user, language, onBack }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="settings-back-btn" onClick={onBack}>← {t.back || 'BACK'}</button>
        <h1 className="settings-title">{t.settingsTitle || 'SETTINGS'}</h1>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h2 className="settings-section-title">{t.accountInfo || 'ACCOUNT'}</h2>
          <div className="settings-field">
            <label className="settings-label">{t.yourEmail || 'Email'}</label>
            <div className="settings-email-display">{user?.email || '—'}</div>
          </div>
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
    </div>
  )
}
