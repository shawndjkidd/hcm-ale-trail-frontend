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

function AddBeerModal({ brewery, onSave, language, onClose, mandatory = false, breweryCode, isAlreadyStamped = false }) {
  const [step, setStep] = useState(1) // 1 = beer entry, 2 = PIN verification
  const [selectedBeerId, setSelectedBeerId] = useState('')
  const [customName, setCustomName] = useState('')
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [menuBeers, setMenuBeers] = useState([])
  const [ratedNames, setRatedNames] = useState([])
  const [loadingBeers, setLoadingBeers] = useState(true)

  // PIN verification state
  const [pinDigits, setPinDigits] = useState(['', '', '', ''])
  const [pinError, setPinError] = useState(false)
  const [pinShake, setPinShake] = useState(false)
  const pinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]

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

  // Step 1: validate beer entry, then decide next step
  const handleBeerSubmit = () => {
    const beerName = getBeerName()
    if (!beerName || rating === 0) {
      alert(t.pleaseComplete || 'Please enter a beer name and rating!')
      return
    }

    // If already stamped at this brewery (adding another beer), skip PIN — just save
    if (isAlreadyStamped) {
      const beer = {
        breweryId: brewery.id,
        breweryName: brewery.name,
        name: beerName,
        rating,
        notes: notes.trim()
      }
      onSave(beer)
      return
    }

    // First check-in at this brewery: move to PIN verification step
    setStep(2)
    setPinDigits(['', '', '', ''])
    setPinError(false)
    // Focus first pin input after render
    setTimeout(() => pinRefs[0]?.current?.focus(), 100)
  }

  // Handle PIN digit input
  const handlePinChange = (index, value) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...pinDigits]
    newDigits[index] = digit
    setPinDigits(newDigits)
    setPinError(false)

    // Auto-advance to next input
    if (digit && index < 3) {
      pinRefs[index + 1]?.current?.focus()
    }

    // Auto-submit when all 4 digits entered
    if (digit && index === 3) {
      const fullPin = [...newDigits.slice(0, 3), digit].join('')
      if (fullPin.length === 4) {
        setTimeout(() => validatePin(fullPin), 150)
      }
    }
  }

  // Handle backspace in PIN inputs
  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinRefs[index - 1]?.current?.focus()
    }
  }

  // Validate PIN and submit everything
  const validatePin = (pin) => {
    const correctCode = breweryCode || ''
    if (pin === correctCode) {
      // PIN correct — submit the beer + stamp
      const beerName = getBeerName()
      const beer = {
        breweryId: brewery.id,
        breweryName: brewery.name,
        name: beerName,
        rating,
        notes: notes.trim()
      }
      onSave(beer)
    } else {
      // Wrong PIN — shake and reset
      setPinError(true)
      setPinShake(true)
      setPinDigits(['', '', '', ''])
      setTimeout(() => {
        setPinShake(false)
        pinRefs[0]?.current?.focus()
      }, 500)
    }
  }

  // Manual submit button for PIN
  const handlePinSubmit = () => {
    const fullPin = pinDigits.join('')
    if (fullPin.length === 4) {
      validatePin(fullPin)
    }
  }

  // Go back to beer entry step
  const handleBackToStep1 = () => {
    setStep(1)
    setPinDigits(['', '', '', ''])
    setPinError(false)
  }

  return (
    <div className="modal-overlay" onClick={(mandatory && step === 2) ? undefined : (step === 2 ? undefined : (mandatory ? undefined : onClose))}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {!mandatory && step === 1 && <button className="modal-close" onClick={onClose}>✕</button>}

        {step === 1 && (
          <>
            <h2>{t.addBeer}</h2>
            <p className="modal-subtitle">{brewery.name}</p>
            {mandatory && (
              <p className="mandatory-note">
                {t.addBeerSubtext || 'Rate the beer you\'re drinking to get your stamp'}
              </p>
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
              <button className="btn-save" onClick={handleBeerSubmit}>
                {isAlreadyStamped ? (t.save) : (t.next || 'NEXT →')}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="pin-verification-step">
            <div className="pin-lock-icon">🔒</div>
            <h2 className="pin-title">{t.serverConfirm || 'SERVER CONFIRMATION'}</h2>
            <p className="pin-subtitle">
              {t.askServerPin || 'Show this to your server — they\'ll enter the PIN'}
            </p>

            <div className={`pin-input-row ${pinShake ? 'pin-shake' : ''}`}>
              {[0, 1, 2, 3].map(i => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="1"
                  className={`pin-digit-input ${pinError ? 'pin-error' : ''}`}
                  value={pinDigits[i]}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  autoComplete="off"
                />
              ))}
            </div>

            {pinError && (
              <p className="pin-error-text">
                {t.invalidCode || 'Invalid code. Try again!'}
              </p>
            )}

            <button className="btn-confirm-stamp" onClick={handlePinSubmit}>
              {t.confirmStamp || 'CONFIRM STAMP ✓'}
            </button>

            <button className="btn-back-to-beer" onClick={handleBackToStep1}>
              ← {t.editBeer || 'Edit beer details'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AddBeerModal
