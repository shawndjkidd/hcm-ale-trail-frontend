import { useState } from 'react'
import { changePassword, changeEmail } from '../lib/api'
import translations from '../translations'
import OnboardingFlow from './OnboardingFlow'
import TrailIcon from './TrailIcons'
import UntappdSettingsTile from './UntappdSettingsTile'
import { SHOW_UNTAPPD_INTEGRATION } from '../config'

// Map values → translation keys for display
const LABEL_KEYS = {
  backpacker: 'optBackpacker', digital_nomad: 'optDigitalNomad', suit: 'optSuit',
  teacher_ngo: 'optTeacherNgo', student: 'optStudent', just_vibing: 'optJustVibing',
  rookie: 'optRookie', prime: 'optPrime', seasoned: 'optSeasoned', og: 'optOg',
  male: 'optMale', female: 'optFemale', skip: 'optSkip',
  glass: 'optGlass', pint: 'optPint', growler: 'optGrowler', tower: 'optTower',
  d1: 'optDistrict1', d2: 'optD2', d3: 'optDistrict3', d7: 'optDistrict7',
  binh_thanh: 'optBinhThanh', other_hcmc: 'optOtherHcmc',
  ipa: 'optIpa', lager: 'optLager', stout: 'optStout', sour: 'optSour', wheat: 'optWheat', surprise: 'optSurprise',
}

const locationIconType = (val) => val === 'visitor' ? 'visitor' : 'district'

export default function Settings({ user, userMe, language, onBack, onUserMeRefresh }) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [editField, setEditField] = useState(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [editingEmail, setEditingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailBusy, setEmailBusy] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [, setRefresh] = useState(0)

  const t = translations[language] || translations.en
  const label = (val) => (LABEL_KEYS[val] && t[LABEL_KEYS[val]]) || val

  const profile = JSON.parse(localStorage.getItem('hcm-onboarding-profile') || 'null')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (!currentPassword) { setError(t.currentPasswordRequired || 'Current password is required'); return }
    if (newPassword.length < 8) { setError(t.passwordTooShort || 'New password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { setError(t.passwordMismatch || 'Passwords do not match'); return }
    setBusy(true)
    try {
      const res = await changePassword(currentPassword, newPassword)
      if (res?.ok) {
        setSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(res?.error || 'Failed to change password')
      }
    } finally { setBusy(false) }
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
        setEmailError(res?.error || t.emailChangeError || 'Failed to change email.')
      }
    } catch {
      setEmailError(t.emailChangeError || 'Failed to change email.')
    } finally { setEmailBusy(false) }
  }

  const handleEmailCancel = () => { setEditingEmail(false); setNewEmail(''); setEmailError(''); setEmailSuccess(false) }

  const handleEditComplete = () => { setEditField(null); setRefresh(n => n + 1) }

  const canSubmitPassword = currentPassword.length > 0 && newPassword.length >= 8 && confirmPassword.length >= 8

  const ProfileRow = ({ rowLabel, field, value, iconType, iconSize = 24, accent }) => (
    <button onClick={() => setEditField(field)} className="profile-row-card" data-accent={accent || 'red'}>
      <div className="profile-row-icon">
        <TrailIcon type={iconType} size={iconSize} color="#333" />
      </div>
      <div className="profile-row-content">
        <div className="profile-row-label">{rowLabel}</div>
        <div className="profile-row-value">{value || '—'}</div>
      </div>
      <div className="profile-row-chevron">›</div>
    </button>
  )

  const BeerStylesRow = () => {
    const styles = profile?.beer_styles || []
    const displayValue = styles.length > 0 ? styles.map(s => label(s)).join(', ') : '—'
    return (
      <button onClick={() => setEditField('beer_styles')} className="profile-row-card" data-accent="red">
        <div className="profile-row-icon">
          <TrailIcon type={styles[0] || 'lager'} size={24} color="#333" />
        </div>
        <div className="profile-row-content">
          <div className="profile-row-label">{t.profileBeerStyles}</div>
          <div className="profile-row-value">{displayValue}</div>
        </div>
        <div className="profile-row-chevron">›</div>
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
        {/* ─── Hero: Trail Name + Avatar ─── */}
        {profile && profile.display_name && (
          <div className="profile-hero">
            <div className="profile-hero-avatar">
              <TrailIcon type={profile.avatar || 'pint'} size={48} color="#fff" />
            </div>
            <button className="profile-hero-name" onClick={() => setEditField('display_name')}>
              {profile.display_name}
              <span className="profile-hero-edit-icon">✎</span>
            </button>
            <div className="profile-hero-sub">{user?.email || ''}</div>
          </div>
        )}

        {/* ─── Trail Profile Cards ─── */}
        {(!profile || !profile.lifestyle) ? (
          <div className="settings-section">
            <p className="profile-row-label" style={{ fontSize: 14, marginBottom: 12, padding: '12px 16px 0' }}>
              {t.trailProfileDesc || 'Tell us about yourself to personalize your trail'}
            </p>
            <button className="settings-submit-btn" onClick={() => setShowOnboarding(true)} style={{ width: '100%' }}>
              {t.setUpTrailProfile || 'SET UP TRAIL PROFILE'}
            </button>
          </div>
        ) : (
          <div className="profile-cards-grid">
            <ProfileRow rowLabel={t.profileLifestyle} field="lifestyle"
              value={label(profile.lifestyle)} iconType={profile.lifestyle} accent="yellow" />
            <BeerStylesRow />
            <ProfileRow rowLabel={t.profileLocation} field="location"
              value={
                (label(profile.neighborhood) || '') +
                (profile.home_country && profile.home_country !== 'VN' ? ` (${profile.home_country})` : '')
              }
              iconType={locationIconType(profile.neighborhood)} accent="green" />
            <ProfileRow rowLabel={t.profileExperience} field="era"
              value={label(profile.era)} iconType={profile.era} accent="red" />
            <ProfileRow rowLabel={t.profileGender} field="gender"
              value={label(profile.gender) || '—'} iconType={profile.gender || 'skip'} accent="blue" />
            <ProfileRow rowLabel={t.profileVessel} field="avatar"
              value={label(profile.avatar)} iconType={profile.avatar} accent="yellow" />
            <button className="profile-edit-all-btn" onClick={() => setShowOnboarding(true)}>
              {t.editAll || 'EDIT ALL'}
            </button>
          </div>
        )}

        {/* ─── Account Section ─── */}
        <div className="settings-section">
          <div className="settings-field">
            <label className="settings-label">{t.yourEmail || 'Email'}</label>
            {!editingEmail ? (
              <div className="settings-email-row">
                <div className="settings-email-display">{user?.email || '—'}</div>
                <button className="settings-edit-btn" onClick={() => { setEmailSuccess(false); setEditingEmail(true); }}>
                  {t.editEmail || 'Edit'}
                </button>
              </div>
            ) : (
              <div className="settings-email-edit">
                <label className="settings-label">{t.newEmailLabel || 'New Email'}</label>
                <input type="email" className="settings-input" value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={user?.email || 'new@email.com'} autoFocus
                />
                {emailError && <div className="settings-error">{emailError}</div>}
                <div className="settings-email-actions">
                  <button className="settings-submit-btn" onClick={handleEmailSave}
                    disabled={emailBusy || !newEmail.trim()}>
                    {emailBusy ? '...' : (t.saveEmail || 'SAVE')}
                  </button>
                  <button className="settings-cancel-btn" onClick={handleEmailCancel} disabled={emailBusy}>
                    {t.cancelEdit || 'Cancel'}
                  </button>
                </div>
              </div>
            )}
            {emailSuccess && (
              <div className="settings-success">
                {t.emailConfirmationSent || 'Check your new inbox — click the link to confirm the change.'}
              </div>
            )}
          </div>
        </div>

        {/* ─── Untappd (testers only) — hidden behind SHOW_UNTAPPD_INTEGRATION flag ─── */}
        {SHOW_UNTAPPD_INTEGRATION && userMe?.is_untappd_tester && (
          <UntappdSettingsTile
            language={language}
            userMe={userMe}
            onRefresh={onUserMeRefresh || (() => {})}
          />
        )}

        {/* ─── Change Password ─── */}
        <div className="settings-section">
          <h2 className="settings-section-title">{t.changePasswordTitle || 'CHANGE PASSWORD'}</h2>
          <form onSubmit={handleSubmit} className="settings-form">
            <div className="settings-field">
              <label className="settings-label">{t.currentPassword || 'Current Password'}</label>
              <input type="password" className="settings-input" value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            </div>
            <div className="settings-field">
              <label className="settings-label">{t.newPassword || 'New Password'}</label>
              <input type="password" className="settings-input" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            </div>
            <div className="settings-field">
              <label className="settings-label">{t.confirmPassword || 'Confirm Password'}</label>
              <input type="password" className="settings-input" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            </div>
            {error && <div className="settings-error">{error}</div>}
            {success && <div className="settings-success">{t.passwordChanged || 'Password updated!'}</div>}
            <button type="submit" className="settings-submit-btn" disabled={busy || !canSubmitPassword}>
              {busy ? '...' : (t.updatePassword || 'UPDATE PASSWORD')}
            </button>
          </form>
        </div>
      </div>

      {showOnboarding && (
        <OnboardingFlow user={user} language={language}
          onComplete={() => { setShowOnboarding(false); setRefresh(n => n + 1) }}
          onClose={() => setShowOnboarding(false)} />
      )}

      {editField && (
        <OnboardingFlow user={user} language={language} initialStep={editField}
          onComplete={handleEditComplete} onClose={() => setEditField(null)} />
      )}
    </div>
  )
}
