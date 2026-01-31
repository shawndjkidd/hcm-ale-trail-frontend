import { useState } from 'react'
import translations from '../translations'

function AddBeerModal({ brewery, addBeer, language, onClose }) {
  const [beerName, setBeerName] = useState('')
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')

  const t = translations[language]

  const handleSave = () => {
    if (!beerName.trim() || rating === 0) {
      alert('Please enter a beer name and rating!')
      return
    }

    addBeer({
      breweryId: brewery.id,
      breweryName: brewery.name,
      name: beerName,
      rating,
      notes
    })

    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <h2>{t.addBeer}</h2>
        <p className="modal-subtitle">{brewery.name}</p>

        <div className="form-group">
          <label>{t.beerName}</label>
          <input
            type="text"
            value={beerName}
            onChange={(e) => setBeerName(e.target.value)}
            placeholder="e.g. Gorilla IPA"
            className="text-input"
          />
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
          <label>{t.tastingNotes}</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional tasting notes..."
            className="textarea-input"
            rows="3"
          />
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            {t.cancel}
          </button>
          <button className="btn-save" onClick={handleSave}>
            {t.save}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddBeerModal
