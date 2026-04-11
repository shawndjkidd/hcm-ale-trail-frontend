import translations from '../translations'

function Leaderboard({ language, onBack, timerStart, completionTime, leaderboard = [], user }) {
  const t = translations[language]
  const leaderboardData = leaderboard || []

  const formatTime = (ms) => {
    if (!ms) return '--:--:--'
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const formatEntryTime = (time) => {
    if (typeof time === 'number') return formatTime(time)
    if (typeof time === 'string') return time
    return '--:--:--'
  }

  const getYourStatus = () => {
    if (completionTime) return t.completed
    if (timerStart) return t.inProgress
    return t.notStarted
  }

  const rankLabel = (index) => {
    if (index === 0) return '1ST'
    if (index === 1) return '2ND'
    if (index === 2) return '3RD'
    return `${index + 1}`
  }

  return (
    <div className="ld-page">
      {/* Header */}
      <div className="ld-header">
        <button className="ld-back-btn" onClick={onBack}>← {t.back}</button>
        <h1 className="ld-title">{t.leaderboardTitle || 'LEADERBOARD'}</h1>
      </div>

      <div className="ld-content">
        {/* Your Time Hero */}
        <div className="ld-hero">
          <div className="ld-hero-label">{t.yourTime || 'Your Time'}</div>
          <div className="ld-hero-time">
            {completionTime ? formatTime(completionTime) : (timerStart ? t.inProgress : '--:--:--')}
          </div>
          <div className="ld-hero-status">{getYourStatus()}</div>
        </div>

        {/* Fastest Completions */}
        <h2 className="ld-section-title">{t.fastestCompletions || 'FASTEST COMPLETIONS'}</h2>

        {leaderboardData.length === 0 ? (
          <div className="ld-empty">
            <p>{t.noCompletionsYet || 'No completions yet. Be the first!'}</p>
          </div>
        ) : (
          <div className="ld-list">
            {leaderboardData.map((entry, index) => (
              <div
                key={entry.id || index}
                className={`ld-row ${index < 3 ? ['ld-gold', 'ld-silver', 'ld-bronze'][index] : ''}`}
              >
                <div className={`ld-rank ${index < 3 ? 'ld-rank-top' : ''}`}>
                  {rankLabel(index)}
                </div>
                <div className="ld-info">
                  <span className="ld-name">{entry.name || 'Anonymous'}</span>
                </div>
                <div className="ld-time">{formatEntryTime(entry.time)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Leaderboard
