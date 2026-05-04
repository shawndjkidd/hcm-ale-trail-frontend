import { useState } from 'react'
import translations from '../translations'
import { disconnectUntappd } from '../lib/api'

function getUntappdStartUrl() {
  try {
    const u = JSON.parse(localStorage.getItem('hcm-user') || 'null')
    if (u?.id) return `/api/untappd/oauth/start?user_id=${encodeURIComponent(u.id)}`
  } catch {}
  return '/api/untappd/oauth/start'
}

export default function UntappdSettingsTile({ language, userMe, onRefresh }) {
  const [busy, setBusy] = useState(false)
  const t = translations[language] || translations.en

  const connected = userMe?.untappd?.connected
  const username = userMe?.untappd?.username

  const handleConnect = () => {
    window.location.href = getUntappdStartUrl()
  }

  const handleDisconnect = async () => {
    if (!window.confirm(t.untappdDisconnectConfirm || 'Disconnect your Untappd account?')) return
    setBusy(true)
    try {
      await disconnectUntappd()
      await onRefresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="settings-section">
      <h2 className="settings-section-title">{t.untappdTitle || 'UNTAPPD'}</h2>
      <div className="untappd-tile">
        {connected ? (
          <>
            <div className="untappd-tile-status untappd-tile-connected">
              {t.untappdConnectedBadge || '✓ Connected to Untappd'}
              {username && <span className="untappd-username"> @{username}</span>}
            </div>
            <button
              className="settings-cancel-btn"
              onClick={handleDisconnect}
              disabled={busy}
              style={{ marginTop: 8 }}
            >
              {busy ? '...' : (t.untappdDisconnect || 'DISCONNECT')}
            </button>
          </>
        ) : (
          <>
            <div className="untappd-tile-status">
              {t.untappdNotConnected || 'Not connected'}
            </div>
            <button
              className="settings-submit-btn"
              onClick={handleConnect}
              style={{ marginTop: 8 }}
            >
              {t.untappdConnect || 'CONNECT'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
