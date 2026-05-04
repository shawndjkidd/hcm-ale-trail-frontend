import translations from '../translations'

function getUntappdStartUrl() {
  try {
    const u = JSON.parse(localStorage.getItem('hcm-user') || 'null')
    if (u?.id) return `/api/untappd/oauth/start?user_id=${encodeURIComponent(u.id)}`
  } catch {}
  return '/api/untappd/oauth/start'
}

export default function UntappdOnboarding({ language, onDismiss, connectStatus }) {
  const t = translations[language] || translations.en

  const handleConnect = () => {
    window.location.href = getUntappdStartUrl()
  }

  return (
    <div className="untappd-onboarding-overlay">
      <div className="untappd-onboarding-card">
        {connectStatus === 'error' && (
          <div className="untappd-connect-error">
            {t.untappdConnectError || 'Connection failed. Try again.'}
          </div>
        )}
        <div className="untappd-onboarding-logo">🍺</div>
        <h2 className="untappd-onboarding-title">{t.untappdConnectTitle || 'CONNECT UNTAPPD'}</h2>
        <p className="untappd-onboarding-body">
          {t.untappdConnectBody || 'Cross-post your check-ins to Untappd automatically when you rate a beer.'}
        </p>
        <button className="untappd-connect-btn" onClick={handleConnect}>
          {t.untappdConnectBtn || 'CONNECT UNTAPPD'}
        </button>
        <button className="untappd-later-btn" onClick={onDismiss}>
          {t.untappdConnectLater || 'Maybe later'}
        </button>
      </div>
    </div>
  )
}
