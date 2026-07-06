import { useState, useEffect, useRef } from 'react'
import translations from '../translations'
import { TRAIL_ID, SHOW_UNTAPPD_INTEGRATION } from '../config'
import { serverCheckin } from '../lib/api'

// Simple fuzzy match: returns a score > 0 if `query` matches `name`, else 0.
function fuzzyScore(name, query) {
  if (!query) return 0;
  const n = name.toLowerCase();
  const q = query.toLowerCase();
  if (n === q) return 100;
  if (n.startsWith(q)) return 80;
  if (n.includes(q)) return 60 - n.indexOf(q);
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

// Extract brewery ID from a QR code URL like https://hcm.thealetrail.app/checkin/[uuid]
function extractBreweryIdFromQR(scannedText) {
  try {
    // Handle full URLs
    if (scannedText.includes('/checkin/')) {
      const parts = scannedText.split('/checkin/')
      const id = parts[1]?.split(/[?#]/)[0]?.trim()
      if (id && id.length >= 10) return id
    }
    // Handle bare paths like /checkin/[uuid]
    if (scannedText.startsWith('/checkin/')) {
      const id = scannedText.replace('/checkin/', '').split(/[?#]/)[0]?.trim()
      if (id && id.length >= 10) return id
    }
    // Handle if someone just scanned a raw UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(scannedText.trim())) {
      return scannedText.trim()
    }
    return null
  } catch {
    return null
  }
}

function AddBeerModal({ brewery, onSave, language, onClose, mandatory = false, isAlreadyStamped = false, userMe }) {
  const [step, setStep] = useState(1) // 1 = beer entry, 2 = PIN verification
  const [selectedBeerId, setSelectedBeerId] = useState('')
  const [customName, setCustomName] = useState('')
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [postToUntappd, setPostToUntappd] = useState(false)
  const [menuBeers, setMenuBeers] = useState([])
  const [ratedNames, setRatedNames] = useState([])
  const [loadingBeers, setLoadingBeers] = useState(true)

  // PIN verification state
  const [pinDigits, setPinDigits] = useState(['', '', '', ''])
  const [pinError, setPinError] = useState(false)
  const [pinShake, setPinShake] = useState(false)
  const [pinErrorMsg, setPinErrorMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const pinRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]

  // QR scanner state
  const [showScanner, setShowScanner] = useState(false)
  const [scanError, setScanError] = useState(null)
  const scannerRef = useRef(null)
  const scannerContainerId = 'pin-qr-scanner'

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

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {})
        } catch {}
        scannerRef.current = null
      }
    }
  }, [])

  const isOther = selectedBeerId === 'other'
  const hasMenu = menuBeers.length > 0

  const allKnownNames = [
    ...menuBeers.map(b => b.name),
    ...ratedNames,
  ]

  const getBeerName = () => {
    if (!hasMenu || isOther) return customName.trim()
    const found = menuBeers.find(b => b.id === selectedBeerId)
    return found ? found.name : customName.trim()
  }

  const selectedMenuBeer = menuBeers.find(b => b.id === selectedBeerId)
  const canPostUntappd =
    userMe?.is_untappd_tester === true &&
    userMe?.untappd?.connected === true &&
    selectedMenuBeer?.untappd_beer_id != null

  // Step 1: validate beer entry, then decide next step
  const handleBeerSubmit = () => {
    const beerName = getBeerName()
    if (!beerName || rating === 0) return
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
    setStep(2)
    setPinDigits(['', '', '', ''])
    setPinError(false)
    setPinErrorMsg('')
    setScanError(null)
    setShowScanner(false)
    setTimeout(() => pinRefs[0]?.current?.focus(), 100)
  }

  // Handle PIN digit input
  const handlePinChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...pinDigits]
    newDigits[index] = digit
    setPinDigits(newDigits)
    setPinError(false)
    setPinErrorMsg('')
    setScanError(null)
    if (digit && index < 3) {
      pinRefs[index + 1]?.current?.focus()
    }
    if (digit && index === 3 && !isSubmitting) {
      const fullPin = [...newDigits.slice(0, 3), digit].join('')
      if (fullPin.length === 4) {
        setTimeout(() => validatePin(fullPin), 150)
      }
    }
  }

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinRefs[index - 1]?.current?.focus()
    }
  }

  // Validate PIN against server — never exposes codes client-side.
  // Uses request() helper which auto-refreshes the access token on 401 before giving up.
  const validatePin = async (pin) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setPinErrorMsg('')
    try {
      const beerName = getBeerName()
      const data = await serverCheckin({
        breweryId: brewery.id,
        pin,
        beerName,
        rating,
        notes: notes.trim() || null,
      })
      if (data.ok) {
        confirmAndSave(true)
      } else {
        let msg
        if (data.status === 429) {
          msg = t.tooManyAttempts || 'Too many attempts. Try again later.'
        } else if (data.status === 401 || data.error === 'Unauthorized') {
          msg = t.sessionExpired || 'Session expired — please refresh the page and try again.'
        } else {
          msg = t.invalidCode || 'Invalid code. Try again!'
        }
        setPinErrorMsg(msg)
        setPinError(true)
        setPinShake(true)
        setPinDigits(['', '', '', ''])
        setTimeout(() => {
          setPinShake(false)
          pinRefs[0]?.current?.focus()
        }, 500)
      }
    } catch {
      setPinErrorMsg(t.invalidCode || 'Invalid code. Try again!')
      setPinError(true)
      setPinShake(true)
      setPinDigits(['', '', '', ''])
      setTimeout(() => {
        setPinShake(false)
        pinRefs[0]?.current?.focus()
      }, 500)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Shared save function for both PIN and QR confirmation
  // ratingSent=true when /api/checkin already recorded the rating server-side
  const confirmAndSave = (ratingSent = false) => {
    const beerName = getBeerName()
    const beer = {
      breweryId: brewery.id,
      breweryName: brewery.name,
      name: beerName,
      rating,
      notes: notes.trim(),
      brewery_beer_id: selectedMenuBeer?.id || null,
      post_to_untappd: canPostUntappd && postToUntappd,
      ratingSent,
    }
    // Stop scanner if running
    if (scannerRef.current) {
      try { scannerRef.current.stop().catch(() => {}) } catch {}
      scannerRef.current = null
    }
    onSave(beer)
  }

  const handlePinSubmit = () => {
    const fullPin = pinDigits.join('')
    if (fullPin.length === 4 && !isSubmitting) {
      validatePin(fullPin)
    }
  }

  // QR Scanner logic
  const startScanner = async () => {
    setScanError(null)
    setShowScanner(true)

    // Wait for the container to render
    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const scanner = new Html5Qrcode(scannerContainerId)
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 200, height: 200 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // QR scanned successfully
            const scannedBreweryId = extractBreweryIdFromQR(decodedText)
            if (scannedBreweryId && scannedBreweryId === brewery.id) {
              // Correct brewery QR — auto-confirm (QR path does not go through /api/checkin)
              scanner.stop().catch(() => {})
              scannerRef.current = null
              setShowScanner(false)
              confirmAndSave(false)
            } else {
              // Wrong brewery or invalid QR
              setScanError(t.wrongBreweryQR || 'Wrong QR code — scan the QR at this brewery')
            }
          },
          () => {} // Ignore scan failures (no QR in frame)
        )
      } catch (err) {
        console.error('QR scanner error:', err)
        setScanError(t.cameraError || 'Could not access camera. Please use the PIN instead.')
        setShowScanner(false)
      }
    }, 300)
  }

  const stopScanner = () => {
    if (scannerRef.current) {
      try { scannerRef.current.stop().catch(() => {}) } catch {}
      scannerRef.current = null
    }
    setShowScanner(false)
    setScanError(null)
  }

  const handleBackToStep1 = () => {
    stopScanner()
    setStep(1)
    setPinDigits(['', '', '', ''])
    setPinError(false)
    setPinErrorMsg('')
    setScanError(null)
  }

  return (
    <div className="fullscreen-takeover-yellow">
      <div className="modal-content">
        {!mandatory && step === 1 && <button className="back-btn" style={{marginBottom: '0.5rem'}} onClick={onClose}>← {t.back || 'BACK'}</button>}

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
                    <option value="">{t.selectBeerPlaceholder || '— Select a beer —'}</option>
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
                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                      <polygon points="16,2 19.2,11.6 29.3,11.7 21.2,17.7 24.2,27.3 16,21.5 7.8,27.3 10.8,17.7 2.7,11.7 12.8,11.6" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>{t.tastingNotes} ({t.optional || 'Optional'})</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.notesPlaceholder || "e.g. Hoppy, citrus notes..."}
                className="textarea-input"
                rows="3"
              />
            </div>

            {/* Untappd cross-post checkbox — hidden behind SHOW_UNTAPPD_INTEGRATION flag */}
            {SHOW_UNTAPPD_INTEGRATION && canPostUntappd && (
              <div className="form-group untappd-toggle-row">
                <label className="untappd-toggle-label">
                  <input
                    type="checkbox"
                    className="untappd-toggle-checkbox"
                    checked={postToUntappd}
                    onChange={(e) => setPostToUntappd(e.target.checked)}
                  />
                  <span>{t.untappdCrossPost || 'Post to Untappd'}</span>
                </label>
              </div>
            )}

            <div className="modal-actions">
              {!mandatory && (
                <button className="btn-cancel" onClick={onClose}>
                  {t.cancel}
                </button>
              )}
              <button className="btn-save" onClick={handleBeerSubmit} disabled={!getBeerName() || rating === 0}>
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

            {!showScanner && (
              <>
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
                      disabled={isSubmitting}
                    />
                  ))}
                </div>

                {pinError && (
                  <p className="pin-error-text">
                    {pinErrorMsg || t.invalidCode || 'Invalid code. Try again!'}
                  </p>
                )}

                <button className="btn-confirm-stamp" onClick={handlePinSubmit} disabled={isSubmitting}>
                  {isSubmitting ? '...' : (t.confirmStamp || 'CONFIRM STAMP ✓')}
                </button>

                <div className="pin-divider">
                  <span className="pin-divider-line"></span>
                  <span className="pin-divider-text">{t.or || 'OR'}</span>
                  <span className="pin-divider-line"></span>
                </div>

                <button className="btn-scan-qr" onClick={startScanner}>
                  📷 {t.scanBreweryQR || 'SCAN BREWERY QR CODE'}
                </button>
              </>
            )}

            {showScanner && (
              <div className="qr-scanner-section">
                <div id={scannerContainerId} className="qr-scanner-container"></div>
                <p className="qr-scanner-hint">
                  {t.pointAtQR || 'Point your camera at the brewery\'s QR code'}
                </p>
                <button className="btn-close-scanner" onClick={stopScanner}>
                  ✕ {t.cancelScan || 'Cancel scan'}
                </button>
              </div>
            )}

            {scanError && (
              <p className="pin-error-text">{scanError}</p>
            )}

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
