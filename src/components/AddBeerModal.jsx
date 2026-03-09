import { useState, useEffect, useRef } from 'react'
import translations from '../translations'
import { TRAIL_ID } from '../config'

// Simple fuzzy match: returns a score > 0 if `query` matches `name`, else 0.
// Higher score = better match.
function fuzzyScore(name, query) {
  if (!query) return 0;
  const n = name.toLowerCase();
  const q = query.toLowerCase();
  if (n === q) return 100;
  if (n.startsWith(q)) return 80;
  if (n.includes(q)) return 60 - n.indexOf(q); // earlier match = better
  // character subsequence check
  let ni = 0, qi = 0, gaps = 0;
  while (ni < n.length && qi < q.length) {
    if (n[ni] === q[qi]) { qi++; } else { gaps++; }
    ni++;
  }
  if (qi === q.length) return Math.max(1, 40 - gaps);
  return 0;
}

function BeerAutocomplete({ value, onChange, allNames, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const q = value.trim();
    if (!q || q.length < 2) { setSuggestions([]); setOpen(false); return; }
    const scored = allNames
      .map(name => ({ name, score: fuzzyScore(name, q) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
    setSuggestions(scored.map(x => x.name));
    setOpen(scored.length > 0);
  }, [value, allNames]);

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (name) => {
    onChange(name);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        type="text"
        className="text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus
        autoComplete="off"
        onFocus={() => suggestions.length > 0 && setOpen(true)}
      />
      {open && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#222', border: '1px solid #444', borderRadius: 6,
          margin: '2px 0 0', padding: 0, listStyle: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          {suggestions.map((name, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(name)}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: '0.9rem',
                color: '#fff', borderBottom: i < suggestions.length - 1 ? '1px solid #333' : 'none',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddBeerModal({ brewery, onSave, language, onClose, mandatory = false }) {
  const [selectedBeerId, setSelectedBeerId] = useState('')
  const [customName, setCustomName] = useState('')
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [menuBeers, setMenuBeers] = useState([])
  const [ratedNames, setRatedNames] = useState([])
  const [loadingBeers, setLoadingBeers] = useState(true)

  const t = translations[language]

  useEffect(() => {
    const fetchBeers = async () => {
      try {
        const res = await fetch(`/api/trails/${TRAIL_ID}/breweries/${brewery.id}/beers`)
        const data = await res.json()
        if (data.ok) {
          setMenuBeers(data.beers || [])
          setRatedNames(data.ratedNames || [])
        }
      } catch {
        // silently fall back to free-text only
      }
      setLoadingBeers(false)
    }
    fetchBeers()
  }, [brewery.id])

  const isOther = selectedBeerId === 'other'
  const hasMenu = menuBeers.length > 0

  // All names for autocomplete: menu names + ratedNames
  const allKnownNames = [
    ...menuBeers.map(b => b.name),
    ...ratedNames,
  ]

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
    <div className="modal-overlay" onClick={mandatory ? undefined : onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {!mandatory && <button className="modal-close" onClick={onClose}>✕</button>}

        <h2>{t.addBeer}</h2>
        <p className="modal-subtitle">{brewery.name}</p>
        {mandatory && (
          <p className="mandatory-note">Rate your beer to continue</p>
        )}

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
                <BeerAutocomplete
                  value={customName}
                  onChange={setCustomName}
                  allNames={allKnownNames}
                  placeholder="e.g. Saigon IPA"
                />
              )}
            </>
          ) : (
            <BeerAutocomplete
              value={customName}
              onChange={setCustomName}
              allNames={allKnownNames}
              placeholder="e.g. Saigon IPA"
            />
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
          {!mandatory && (
            <button className="btn-cancel" onClick={onClose}>
              {t.cancel}
            </button>
          )}
          <button className="btn-save" onClick={handleSubmit}>
            {t.save}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddBeerModal
