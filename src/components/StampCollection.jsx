import { useState } from 'react'

function StampCollection({ breweries, stamps, addStamp }) {
  const [code, setCode] = useState('')
  const [message, setMessage] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!code.trim()) {
      setMessage({ type: 'error', text: 'Please enter a code' })
      return
    }

    // Find brewery by secret code
    const brewery = breweries.find(b => 
      b.secret_code?.toLowerCase() === code.trim().toLowerCase()
    )

    if (!brewery) {
      setMessage({ type: 'error', text: 'Invalid code. Try again!' })
      return
    }

    if (stamps.includes(brewery.id)) {
      setMessage({ type: 'info', text: `You already collected ${brewery.name}!` })
      return
    }

    // Success!
    addStamp(brewery.id)
    setMessage({ type: 'success', text: `🎉 ${brewery.name} stamp collected!` })
    setCode('')

    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000)
  }

  const progress = breweries.length > 0 ? (stamps.length / breweries.length) * 100 : 0
  const isComplete = stamps.length === breweries.length && breweries.length > 0

  return (
    <div className="stamp-collection-page">
      <div className="page-header">
        <h2 className="page-title">My Passport</h2>
        <p className="page-subtitle">
          Collect all {breweries.length} stamps to earn your reward!
        </p>
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="progress-text">
          {stamps.length} / {breweries.length} breweries visited
        </p>
      </div>

      {/* Completion Message */}
      {isComplete && (
        <div className="completion-banner">
          <h3>🎊 CONGRATULATIONS! 🎊</h3>
          <p>You've completed the HCM Ale Trail!</p>
          <p className="reward-text">Claim your FREE hat at any participating brewery!</p>
        </div>
      )}

      {/* Code Entry Form */}
      <div className="code-entry">
        <h3>Enter Brewery Code</h3>
        <p className="code-instructions">
          Ask the bartender for the secret code and enter it here to collect your stamp!
        </p>
        
        <form onSubmit={handleSubmit} className="code-form">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter code (e.g., BIACRAFT2024)"
            className="code-input"
            autoCapitalize="characters"
          />
          <button type="submit" className="submit-button">
            Add Stamp 🎫
          </button>
        </form>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Stamp Grid */}
      <div className="stamps-grid">
        <h3>Your Collection</h3>
        <div className="stamp-cards">
          {breweries.map(brewery => {
            const isCollected = stamps.includes(brewery.id)
            return (
              <div 
                key={brewery.id} 
                className={`stamp-item ${isCollected ? 'collected' : 'uncollected'}`}
              >
                {isCollected ? (
                  <>
                    {brewery.logo_url ? (
                      <img src={brewery.logo_url} alt={brewery.name} className="stamp-logo" />
                    ) : (
                      <div className="stamp-icon">✓</div>
                    )}
                    <div className="stamp-name">{brewery.name}</div>
                  </>
                ) : (
                  <>
                    <div className="stamp-lock">🔒</div>
                    <div className="stamp-name">{brewery.name}</div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default StampCollection
