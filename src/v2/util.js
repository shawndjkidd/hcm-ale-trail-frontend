import { DEMO_MODE } from './demo.js';
// Shared helpers for the v2 screens.

// ── Beer colour + style group ───────────────────────────────────────────────
// Tiles and glasses are coloured like the beer itself, from the style text the
// brewery enters for each beer (or the beer's name when style is blank).
const STYLE_RULES = [
  { re: /imperial stout|stout|porter|schwarz|black|dark/i, color: '#2B160D', ink: '#fff', group: 'dark' },
  { re: /sour|gose|berliner|lambic|kettle|fruit|wild/i, color: '#E86A8A', ink: '#111', group: 'sour' },
  { re: /double|dipa|triple ipa|imperial ipa/i, color: '#C96A1B', ink: '#111', group: 'hoppy' },
  { re: /ipa|pale|apa|hop|neipa|hazy/i, color: '#D9822B', ink: '#111', group: 'hoppy' },
  { re: /red|amber|brown|m[aä]rzen|bock|dubbel|scotch|rauch/i, color: '#A8401F', ink: '#fff', group: 'dark' },
  { re: /wheat|weiss|weizen|wit|hefe|blanche/i, color: '#F6DE9A', ink: '#111', group: 'light' },
  { re: /tripel|saison|belgian|farmhouse/i, color: '#E9B949', ink: '#111', group: 'light' },
  { re: /lager|pils|helles|k[oö]lsch|blonde|golden|cream|light/i, color: '#F2C230', ink: '#111', group: 'light' },
];

export function beerLook(style = '', name = '') {
  const text = `${style || ''} ${name || ''}`;
  for (const r of STYLE_RULES) if (r.re.test(text)) return r;
  return { color: '#E0A040', ink: '#111', group: 'other' };
}

export const STYLE_GROUPS = ['hoppy', 'light', 'dark', 'sour', 'other'];

// ── Saigon time + opening hours ─────────────────────────────────────────────
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function saigonNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const day = DAYS.indexOf(String(get('weekday')).toLowerCase());
  const mins = (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10);
  return { day, mins };
}

const toMins = (hhmm) => {
  if (!hhmm || typeof hhmm !== 'string') return null;
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  return Number.isFinite(h) ? h * 60 + (m || 0) : null;
};

// Returns { open, closesAt, opensAt, opensDay, unknown, tempClosed }.
// Times past midnight ("01:00") belong to the previous day's session.
export function openStatus(brewery) {
  if (!brewery) return { unknown: true };
  if (brewery.status === 'temporarily_closed') return { open: false, tempClosed: true };
  const hours = brewery.operating_hours;
  if (!hours || typeof hours !== 'object') return { unknown: true };
  const { day, mins } = saigonNow();

  const session = (d) => {
    const h = hours[DAYS[(d + 7) % 7]];
    if (!h || h.closed) return null;
    const o = toMins(h.open); let c = toMins(h.close);
    if (o == null || c == null) return null;
    if (c <= o) c += 24 * 60; // closes after midnight
    return { o, c, open: h.open, close: h.close };
  };

  const yesterday = session(day - 1);
  if (yesterday && mins + 24 * 60 < yesterday.c) return { open: true, closesAt: yesterday.close };
  const today = session(day);
  if (today && mins >= today.o && mins < today.c) return { open: true, closesAt: today.close };
  if (today && mins < today.o) return { open: false, opensAt: today.open, opensDay: 0 };
  for (let i = 1; i <= 7; i++) {
    const s = session(day + i);
    if (s) return { open: false, opensAt: s.open, opensDay: i, opensWeekday: (day + i) % 7 };
  }
  return { unknown: true };
}

export function formatClose(hhmm, t) {
  if (hhmm === '00:00' || hhmm === '24:00') return t.midnight;
  return hhmm;
}

// ── Clock ───────────────────────────────────────────────────────────────────
export function splitDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
const p2 = (n) => String(n).padStart(2, '0');
export function formatClock(ms, withSeconds = true) {
  if (ms == null) return '--:--:--';
  const { d, h, m, s } = splitDuration(ms);
  const hms = withSeconds ? `${p2(h)}:${p2(m)}:${p2(s)}` : `${p2(h)}:${p2(m)}`;
  return d > 0 ? `${d}d ${hms}` : hms;
}
// Leaderboard rows come back as "HH:MM:SS" with hours possibly > 24.
export function prettyBoardTime(entry) {
  if (typeof entry?.completionTimeMs === 'number') return formatClock(entry.completionTimeMs, false);
  return entry?.time || '--:--';
}

// ── Places ──────────────────────────────────────────────────────────────────
export function distanceKm(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const R = 6371, toR = (x) => (x * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const formatKm = (km) => (km == null ? '' : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

// "District 3" -> "Quận 3" in Vietnamese; Korean and Japanese keep the English form.
export function districtLabel(district, language) {
  if (!district) return '';
  if (language === 'vn') return district.replace(/^District\s+/i, 'Quận ').replace(/^Binh Thanh$/i, 'Bình Thạnh');
  return district;
}

export function localized(value, language) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[language] || value.en || value.vn || '';
}

export function haptic(pattern = 40) {
  try { navigator.vibrate && navigator.vibrate(pattern); } catch {}
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Stable warm gradient per brewery when no photo has been uploaded yet.
const GRADS = [
  ['#1d1d1d', '#6b4a2b', '#d19a45'], ['#0e0e10', '#3a2a1f', '#8a5a2b'], ['#2a3b2f', '#6f8a5a', '#d8c27a'],
  ['#14222e', '#2f5570', '#9fb8c2'], ['#2b1a14', '#8e3b24', '#e08a4a'], ['#3a1c0c', '#b3561c', '#f0b24a'],
  ['#101820', '#1f4f5c', '#e0643a'], ['#1b1b1b', '#5a4a2a', '#c9a24a'],
];
export function placeGradient(key = '') {
  let h = 0; for (const c of String(key)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const g = GRADS[h % GRADS.length];
  return `linear-gradient(150deg, ${g[0]}, ${g[1]} 55%, ${g[2]})`;
}

// Logos bundled with the app, used until a brewery uploads its own logo_url.
const LOCAL_LOGOS = {
  'BiaCraft': '/logos/biacraft.png',
  'Heart of Darkness': '/logos/hod.png',
  'Deme': '/logos/deme.png',
  'Steersman': '/logos/steersman.png',
  'East West Brewing': '/logos/eastwest.png',
  'Rooster Beers': '/logos/rooster.png',
  '7 Bridges Brewing Co.': '/logos/7bridges.png',
  'Belgo Saigon': '/logos/belgo.png',
};
// Stand-in venue photos for PREVIEW BUILDS ONLY (Google Maps / venue-site images whose
// rights we don't hold). They live in public/preview/, which the production build
// deletes (vite.config.js), and are only referenced when DEMO_MODE is on. Production
// shows a venue's own photo_url (set in the admin) or the designed placeholder.
const PREVIEW_PHOTOS = {
  'Heart of Darkness': '/preview/heart-of-darkness.jpg',
  'East West Brewing': '/preview/east-west.jpg',
  'BiaCraft': '/preview/biacraft.jpg',
  'Deme': '/preview/deme.jpg',
  'Steersman': '/preview/steersman.jpg',
  'Rooster Beers': '/preview/rooster.jpg',
  '7 Bridges Brewing Co.': '/preview/7bridges.jpg',
  'Belgo Saigon': '/preview/belgo.jpg',
};
export const photoFor = (b) => safeImageUrl(b?.photo_url) || (DEMO_MODE ? PREVIEW_PHOTOS[b?.name] || null : null);

// Links and images typed into the admin are only used if they are https (images may
// also be our own /paths). javascript:, data:, http: and junk are dropped.
export function safeHref(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  try { const u = new URL(url.trim()); return u.protocol === 'https:' ? u.toString() : null; } catch { return null; }
}
export function safeImageUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  const s = url.trim();
  if (s.startsWith('/') && !s.startsWith('//')) return s;
  return safeHref(s);
}

// One-colour cut-out of the brewery logo, used as a faint stencil on the card
export const stencilFor = (b) => {
  const local = LOCAL_LOGOS[b?.name];
  return local ? local.replace('/logos/', '/logos/stencil/') : null;
};
export const logoFor = (b) => safeImageUrl(b?.logo_url) || LOCAL_LOGOS[b?.name] || null;

// Short all-caps label for stamps ("7 Bridges Brewing Co." -> "7 BRIDGES").
export function stampLabel(name = '') {
  const clean = name.replace(/\b(Brewing|Brewery|Beers|Co)\b\.?/gi, '').replace(/\s+/g, ' ').trim() || name;
  return (clean.length > 18 ? `${clean.slice(0, 17).trim()}.` : clean).toUpperCase();
}

// Beer personality from the onboarding answers (beer_styles + era).
export function personalityFor(profile) {
  const styles = profile?.beer_styles || [];
  const era = profile?.era;
  if (!styles.length) return null;
  if (styles.includes('surprise') || styles.length >= 4) return { key: 'pWild', color: '#E0A040', style: '' };
  if (styles.includes('ipa') && era !== 'rookie') return { key: 'pHop', color: '#D9822B', style: 'IPA' };
  if (styles.includes('stout')) return { key: 'pDark', color: '#2B160D', style: 'Stout' };
  if (styles.includes('sour')) return { key: 'pSour', color: '#E86A8A', style: 'Sour' };
  if (styles.includes('wheat')) return { key: 'pWheat', color: '#F6DE9A', style: 'Wheat' };
  if (styles.includes('ipa')) return { key: 'pHop', color: '#D9822B', style: 'IPA' };
  return { key: 'pEasy', color: '#F2C230', style: 'Lager' };
}
