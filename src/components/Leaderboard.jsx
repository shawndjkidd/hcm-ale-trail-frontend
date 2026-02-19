import translations from '../translations'

function Leaderboard({ language, onBack, timerStart, completionTime }) {
  const t = translations[language]
  
  // Mock leaderboard data - will be replaced with Supabase data
  const leaderboardData = [
    // { rank: 1, name: 'John D.', time: '2:34:15' },
    // { rank: 2, name: 'Sarah M.', time: '3:12:45' },
  ]

  const formatTime = (ms) => {
    if (!ms) return '--:--:--'
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const getYourStatus = () => {
    if (completionTime) return t.completed
    if (timerStart) return t.inProgress
    return t.notStarted
  }

  return (
    <div className="leaderboard-page">
      <button className="back-btn" onClick={onBack}>← {t.back}</button>

      <h1 className="leaderboard-title-compact">{t.leaderboardTitle}</h1>

      {/* Your Time Card - Compact */}
      <div className="your-time-card-compact">
        <span className="your-time-label-inline">{t.yourTime}:</span>
        <span className="your-time-value-inline">
          {completionTime ? formatTime(completionTime) : (timerStart ? t.inProgress : '--:--:--')}
        </span>
      </div>

      {/* Leaderboard List */}
      <div className="leaderboard-list">
        <div className="leaderboard-header-row">
          <span>{t.rank}</span>
          <span>{t.name}</span>
          <span>{t.time}</span>
        </div>
        
        {leaderboardData.length === 0 ? (
          <div className="no-completions">
            <p>{t.noCompletionsYet}</p>
          </div>
        ) : (
          leaderboardData.map((entry, index) => (
            <div 
              key={index} 
              className={`leaderboard-row ${index < 3 ? ['gold', 'silver', 'bronze'][index] : ''}`}
            >
              <span className="lb-rank">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : entry.rank}
              </span>
              <span className="lb-name">{entry.name}</span>
              <span className="lb-time">{entry.time}</span>
            </div>
          ))
        )}
      </div>

      <div className="leaderboard-footer">
        <p>{t.yourCompletionTime}: {getYourStatus()}</p>
      </div>
    </div>
  )
}

export default Leaderboard