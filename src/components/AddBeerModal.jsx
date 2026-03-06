import { useState, useEffect } from 'react'
import translations from '../translations'
import { TRAIL_ID } from '../config'

function AddBeerModal({ brewery, onSave, language, onClose }) {
  const [selectedBeerId, setSelectedBeerId] = useState('')
  const [customName, setCustomName] = useState('')
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [menuBeers, setMenuBeers] = useState([])
  const [loadingBeers, setLoadingBeers] = useState(true)

  const t = translations[language]

  useEffect(() => {
    const fetchBeers = async () => {
      try {
        const res = await fetch(`/api/trails/${TRAIL_ID}/breweries/${brewery.id}/beers`)
        const data = await res.json()
        if (data.ok) setMenuBeers(data.beers || [])
      } catch {
        // silently fall back to free-text only
      }
      setLoadingBeers(false)
    }
    fetchBeers()
  }, [brewery.id])

  const isOther = selectedBeerId === 'other'
  const hasMenu = menuBeers.length > 0

  const getBeerName = () => {
    if (!hasMenu || isOther) return customName.trim()
    const found = menuBeers.find(b => b.id === selectedBeerId)
    return found ? found.name : customName.trim()
  }

  const handleSubmit = () => {
    const beerName = getBeerName()
    if (!beerName || rating === 0) {
      alert(t.pleaseComplete || 'Please enter a beer name and rating!')
      return
    }

    const beer = {
      breweryId: brewery.id,
      breweryName: brewery.name,
      name: beerName,
      rating,
      notes: notes.trim()
    }

    onSave(beer)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <h2>{t.addBeer}</h2>
        <p className="modal-subtitle">{brewery.name}</p>

        <div className="form-group">
          <label>{t.beerName}</label>
          {loadingBeers ? (
            <input type="text" className="text-input" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Saigon IPA" />
          ) : hasMenu ? (
            <>
              <select
                className="text-input"
                value={selectedBeerId}
                onChange={(e) => { setSelectedBeerId(e.target.value); setCustomName('') }}
                style={{ marginBottom: isOther ? '0.5rem' : 0 }}
              >
                <option value="">— Select a beer —</option>
                {menuBeers.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}{b.style ? ` (${b.style})` : ''}{b.abv != null ? ` · ${b.abv}%` : ''}
                  </option>
                ))}
                <option value="other">Other (type your own)</option>
              </select>
              {isOther && (
                <input
                  type="text"
                  className="text-input"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Saigon IPA"
                  autoFocus
                />
              )}
            </>
          ) : (
            <input type="text" className="text-input" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Saigon IPA" />
          )}
        </div>

        <div className="form-group">
          <label>{t.rating}</label>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                className={`star ${rating >= star ? 'active' : ''}`}
                onClick={() => setRating(star)}
              >
                ⭐
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>{t.tastingNotes} ({t.optional || 'Optional'})</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Hoppy, citrus notes..."
            className="textarea-input"
            rows="3"
          />
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            {t.cancel}
          </button>
          <button className="btn-save" onClick={handleSubmit}>
            {t.save}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddBeerModal
