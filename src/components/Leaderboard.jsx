import translations from '../translations'

function Leaderboard({ language, onBack, userTime, leaderboardData }) {
  const t = translations[language]

  const formatTime = (ms) => {
    if (!ms) return '--:--:--'
    
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  const formatTimeShort = (ms) => {
    if (!ms) return '--:--:--'
    
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Sort leaderboard by time (fastest first)
  const sortedLeaderboard = [...(leaderboardData || [])].sort((a, b) => a.time - b.time)

  return (
    <div className="leaderboard-page">
      <button className="back-btn" onClick={onBack}>← BACK</button>

      <div className="leaderboard-header">
        <div className="trophy-icon">🏆</div>
        <h1 className="leaderboard-title">{t.leaderboardTitle}</h1>
      </div>

      {/* User's own time */}
      <div className="your-time-card">
        <div className="your-time-label">{t.yourTime}</div>
        <div className="your-time-value">
          {userTime ? formatTime(userTime) : t.notStarted}
        </div>
        {userTime && (
          <div className="your-time-status">{t.completed} ✅</div>
        )}
      </div>

      {/* Leaderboard list */}
      <div className="leaderboard-list">
        <div className="leaderboard-header-row">
          <div className="lb-rank">{t.rank}</div>
          <div className="lb-name">{t.name}</div>
          <div className="lb-time">{t.time}</div>
        </div>

        {sortedLeaderboard.length > 0 ? (
          sortedLeaderboard.map((entry, index) => (
            <div 
              key={entry.id || index} 
              className={`leaderboard-row ${index < 3 ? 'top-three' : ''} ${index === 0 ? 'gold' : ''} ${index === 1 ? 'silver' : ''} ${index === 2 ? 'bronze' : ''}`}
            >
              <div className="lb-rank">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && `#${index + 1}`}
              </div>
              <div className="lb-name">{entry.name}</div>
              <div className="lb-time">{formatTimeShort(entry.time)}</div>
            </div>
          ))
        ) : (
          <div className="no-completions">
            <p>{t.noCompletionsYet}</p>
            <div className="first-place-icon">🏆</div>
          </div>
        )}
      </div>

      <div className="leaderboard-footer">
        <p>Complete all 8 breweries as fast as you can!</p>
        <p>⏱️ Timer starts on your first stamp</p>
      </div>
    </div>
  )
}

export default Leaderboard
