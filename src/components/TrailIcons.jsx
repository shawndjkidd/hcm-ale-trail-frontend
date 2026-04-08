// Shared SVG icon set for the Ale Trail — single color, minimal, consistent style
// Usage: <TrailIcon type="backpacker" size={32} />

export default function TrailIcon({ type, size = 32, color = 'currentColor' }) {
  const s = { width: size, height: size, display: 'block', flexShrink: 0 }

  // ── LIFESTYLE ──────────────────────────────────────────────
  if (type === 'backpacker') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <rect x="10" y="4" width="12" height="18" rx="3"/>
      <rect x="12" y="7" width="8" height="4" rx="1" fill="rgba(0,0,0,0.3)"/>
      <rect x="8" y="10" width="2" height="8" rx="1"/>
      <rect x="22" y="10" width="2" height="8" rx="1"/>
      <rect x="13" y="22" width="2" height="5" rx="1"/>
      <rect x="17" y="22" width="2" height="5" rx="1"/>
    </svg>
  )
  if (type === 'digital_nomad') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <rect x="4" y="8" width="24" height="15" rx="2"/>
      <rect x="6" y="10" width="20" height="11" rx="1" fill="rgba(0,0,0,0.3)"/>
      <rect x="8" y="24" width="16" height="2" rx="1"/>
      <circle cx="16" cy="15" r="2" fill="rgba(0,0,0,0.3)"/>
    </svg>
  )
  if (type === 'suit') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <path d="M8 10L16 4l8 6v18H8V10z"/>
      <path d="M14 4h4v8l-2 2-2-2V4z" fill="rgba(0,0,0,0.3)"/>
      <circle cx="16" cy="18" r="1.5" fill="rgba(0,0,0,0.3)"/>
      <circle cx="16" cy="23" r="1.5" fill="rgba(0,0,0,0.3)"/>
    </svg>
  )
  if (type === 'teacher_ngo') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <rect x="6" y="6" width="16" height="20" rx="2"/>
      <rect x="9" y="10" width="10" height="1.5" rx="0.75" fill="rgba(0,0,0,0.3)"/>
      <rect x="9" y="14" width="10" height="1.5" rx="0.75" fill="rgba(0,0,0,0.3)"/>
      <rect x="9" y="18" width="7" height="1.5" rx="0.75" fill="rgba(0,0,0,0.3)"/>
      <path d="M22 12l4-4v20l-4-4V12z" opacity="0.7"/>
    </svg>
  )
  if (type === 'student') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <path d="M16 4L2 12l14 8 14-8L16 4z"/>
      <path d="M8 15v7c0 2 3.5 4 8 4s8-2 8-4v-7l-8 4.5L8 15z" opacity="0.8"/>
      <rect x="27" y="12" width="2" height="12" rx="1" opacity="0.6"/>
    </svg>
  )
  if (type === 'just_vibing') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <path d="M14 6c-1 0-2 1-2 2v5c0 2 1.5 4 4 4s4-2 4-4V8c0-1-1-2-2-2" opacity="0.8"/>
      <path d="M10 16c-2 0-3 1-3 3v2c0 1 .5 2 1.5 2" opacity="0.6"/>
      <path d="M22 16c2 0 3 1 3 3v2c0 1-.5 2-1.5 2" opacity="0.6"/>
      <circle cx="16" cy="24" r="4"/>
    </svg>
  )

  // ── BEER STYLES ────────────────────────────────────────────
  if (type === 'ipa') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <path d="M16 2c-2 0-4 3-4 6 0 2 1 3.5 2.5 4.5L13 28h6l-1.5-15.5C19 11.5 20 10 20 8c0-3-2-6-4-6z"/>
      <path d="M10 7c-1.5 0-3 1.5-3 3s1 2 2 2.5" opacity="0.6"/>
      <path d="M22 7c1.5 0 3 1.5 3 3s-1 2-2 2.5" opacity="0.6"/>
    </svg>
  )
  if (type === 'lager') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <rect x="10" y="6" width="12" height="22" rx="2"/>
      <rect x="12" y="6" width="8" height="5" rx="1" fill="rgba(0,0,0,0.3)"/>
      <rect x="22" y="10" width="4" height="10" rx="2" opacity="0.6"/>
    </svg>
  )
  if (type === 'stout') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <path d="M10 4h12l1 24H9L10 4z"/>
      <rect x="10" y="4" width="12" height="8" rx="1" opacity="0.9"/>
      <rect x="12" y="6" width="8" height="4" rx="1" fill="rgba(0,0,0,0.3)"/>
    </svg>
  )
  if (type === 'sour') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <circle cx="16" cy="16" r="11"/>
      <path d="M11 13c0-1 1-2 2-1s0 3-1 3" fill="rgba(0,0,0,0.3)"/>
      <path d="M19 13c0-1 1-2 2-1s0 3-1 3" fill="rgba(0,0,0,0.3)"/>
      <path d="M12 21c1.5 1.5 5 1.5 8 0" stroke="rgba(0,0,0,0.3)" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  )
  if (type === 'wheat') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <rect x="15" y="14" width="2" height="16" rx="1"/>
      <ellipse cx="16" cy="12" rx="3" ry="4"/>
      <ellipse cx="11" cy="14" rx="2.5" ry="3.5" transform="rotate(-20 11 14)" opacity="0.7"/>
      <ellipse cx="21" cy="14" rx="2.5" ry="3.5" transform="rotate(20 21 14)" opacity="0.7"/>
      <ellipse cx="9" cy="19" rx="2" ry="3" transform="rotate(-30 9 19)" opacity="0.5"/>
      <ellipse cx="23" cy="19" rx="2" ry="3" transform="rotate(30 23 19)" opacity="0.5"/>
    </svg>
  )
  if (type === 'surprise') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <rect x="6" y="6" width="20" height="20" rx="4"/>
      <circle cx="11" cy="13" r="2.5" fill="rgba(0,0,0,0.3)"/>
      <circle cx="21" cy="13" r="2.5" fill="rgba(0,0,0,0.3)"/>
      <circle cx="11" cy="22" r="2.5" fill="rgba(0,0,0,0.3)"/>
      <circle cx="21" cy="22" r="2.5" fill="rgba(0,0,0,0.3)"/>
      <circle cx="16" cy="17.5" r="2.5" fill="rgba(0,0,0,0.3)"/>
    </svg>
  )

  // ── BEER EXPERIENCE ────────────────────────────────────────
  if (type === 'rookie') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <rect x="14" y="16" width="4" height="12" rx="2"/>
      <ellipse cx="16" cy="12" rx="5" ry="6"/>
      <path d="M13 9c1-2 5-2 6 0" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" fill="none"/>
    </svg>
  )
  if (type === 'prime') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <path d="M16 4l-6 4v8l6 4 6-4V8l-6-4z"/>
      <path d="M16 20v8" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <path d="M10 26h12" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
  if (type === 'seasoned') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <path d="M16 2l4 8h8l-6.5 5 2.5 9L16 19l-8 5 2.5-9L4 10h8l4-8z"/>
    </svg>
  )
  if (type === 'og') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <path d="M6 14L9 6h14l3 8-2 4H8l-2-4z"/>
      <circle cx="11" cy="10" r="1.5" fill="rgba(0,0,0,0.3)"/>
      <circle cx="16" cy="8" r="2" fill="rgba(0,0,0,0.3)"/>
      <circle cx="21" cy="10" r="1.5" fill="rgba(0,0,0,0.3)"/>
      <rect x="8" y="18" width="16" height="4" rx="1"/>
      <rect x="10" y="22" width="12" height="6" rx="1" opacity="0.7"/>
    </svg>
  )

  // ── GENDER ─────────────────────────────────────────────────
  if (type === 'male') return (
    <svg viewBox="0 0 32 32" style={s} fill="none" stroke={color} strokeWidth="2.5">
      <circle cx="14" cy="20" r="8"/>
      <line x1="20" y1="14" x2="28" y2="6"/>
      <polyline points="22,6 28,6 28,12"/>
    </svg>
  )
  if (type === 'female') return (
    <svg viewBox="0 0 32 32" style={s} fill="none" stroke={color} strokeWidth="2.5">
      <circle cx="16" cy="13" r="8"/>
      <line x1="16" y1="21" x2="16" y2="30"/>
      <line x1="12" y1="26" x2="20" y2="26"/>
    </svg>
  )
  if (type === 'skip') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <circle cx="16" cy="16" r="12" opacity="0.3"/>
      <rect x="10" y="14.5" width="12" height="3" rx="1.5"/>
    </svg>
  )

  // ── VESSELS / AVATARS ──────────────────────────────────────
  if (type === 'glass') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <path d="M11 4h10l-1.5 16h-7L11 4z"/>
      <rect x="14" y="20" width="4" height="4" rx="1"/>
      <rect x="10" y="24" width="12" height="3" rx="1.5"/>
    </svg>
  )
  if (type === 'pint') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <path d="M9 3h14l-2 26h-10L9 3z"/>
      <rect x="9" y="3" width="14" height="5" rx="1" opacity="0.6"/>
    </svg>
  )
  if (type === 'growler') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <rect x="13" y="2" width="6" height="3" rx="1.5"/>
      <path d="M11 5h10c1 0 2 1 2 2v2c0 1-.5 1.5-1.5 2L20 12v14c0 2-1.5 3-3 3h-2c-1.5 0-3-1-3-3V12l-1.5-1C9.5 10.5 9 10 9 9V7c0-1 1-2 2-2z"/>
    </svg>
  )
  if (type === 'tower') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <rect x="14" y="1" width="4" height="2" rx="1"/>
      <circle cx="16" cy="6" r="3"/>
      <rect x="14.5" y="9" width="3" height="14" rx="1"/>
      <path d="M18 14h3c1 0 1.5.5 1.5 1.5v2c0 1-.5 1.5-1.5 1.5h-3" opacity="0.7"/>
      <rect x="11" y="23" width="10" height="3" rx="1.5"/>
      <rect x="9" y="26" width="14" height="3" rx="1.5"/>
    </svg>
  )

  // ── LOCATION ───────────────────────────────────────────────
  if (type === 'district') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <rect x="4" y="14" width="8" height="14" rx="1"/>
      <rect x="12" y="8" width="8" height="20" rx="1" opacity="0.8"/>
      <rect x="20" y="12" width="8" height="16" rx="1" opacity="0.6"/>
      <rect x="6" y="17" width="2" height="2" rx="0.5" fill="rgba(0,0,0,0.3)"/>
      <rect x="6" y="22" width="2" height="2" rx="0.5" fill="rgba(0,0,0,0.3)"/>
      <rect x="14" y="11" width="2" height="2" rx="0.5" fill="rgba(0,0,0,0.3)"/>
      <rect x="14" y="17" width="2" height="2" rx="0.5" fill="rgba(0,0,0,0.3)"/>
    </svg>
  )
  if (type === 'visitor') return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <path d="M4 16L16 4l8 6-8 12H8l-4-6z" opacity="0.8"/>
      <path d="M16 4l12 8-4 6-8-2V4z"/>
      <rect x="14" y="22" width="4" height="8" rx="1" opacity="0.5"/>
    </svg>
  )

  // fallback
  return (
    <svg viewBox="0 0 32 32" style={s} fill={color}>
      <circle cx="16" cy="16" r="12" opacity="0.3"/>
    </svg>
  )
}
