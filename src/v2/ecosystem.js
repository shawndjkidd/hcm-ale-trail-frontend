// Made SMPL ecosystem receiver (CONNECT V1).
//
// Another Experience can send people here with
//   ?from=<source id>&return=<https url on an approved host>&lang=<en|vn|kr|jp>
// We capture that on first load (before Welcome, sign-in or the Google redirect can
// drop the query string), keep it for this browser tab's session, strip it from the
// address bar, and show one small "← Back to …" link. Returning is a plain same-tab
// link. Nothing here identifies the person or shares any data with the sender.

// Explicit allowlist. Hosts only, https only, no ports, no wildcards: other
// *.thealetrail.app sites (e.g. the separate SaaS site) are NOT trusted.
export const RETURN_HOSTS = {
  'app.madesmpl.com': 'Made SMPL',
  'brewasia.madesmpl.com': 'Brew Asia',
  'hcm.thealetrail.app': null, // ourselves: valid, but no "back" link is shown
};

// Source ids we recognise. The label shown to people comes from the return host,
// never from the raw parameter, so an unknown id can't put arbitrary text on screen.
export const KNOWN_SOURCES = ['made-smpl', 'brew-asia-2026'];
export const SELF_SOURCE = 'hcmc-ale-trail';
export const ECO_PARAMS = ['from', 'return', 'lang'];
export const STORAGE_KEY = 'hcm-ecosystem';

const LANG_MAP = { en: 'en', vn: 'vn', vi: 'vn', kr: 'kr', ko: 'kr', jp: 'jp', ja: 'jp' };

/** Supported Ale Trail locale for a handoff value, or null (unsupported values are ignored). */
export function normaliseLang(raw) {
  if (typeof raw !== 'string') return null;
  const base = raw.trim().toLowerCase().split(/[-_]/)[0];
  return LANG_MAP[base] || null;
}

/** A URL object if `raw` is an https URL on an allowed host, otherwise null. */
export function trustedReturnUrl(raw, extraHosts = {}) {
  if (typeof raw !== 'string' || raw.length > 2048) return null;
  let u;
  try { u = new URL(raw); } catch { return null; }
  const hosts = { ...RETURN_HOSTS, ...extraHosts };
  const devHttp = u.protocol === 'http:' && Object.prototype.hasOwnProperty.call(extraHosts, u.hostname);
  if (u.protocol !== 'https:' && !devHttp) return null;
  if (u.username || u.password) return null;
  if (u.port && !devHttp) return null;
  if (!Object.prototype.hasOwnProperty.call(hosts, u.hostname)) return null;
  return u;
}

/** Label for the back link ("Brew Asia", "Made SMPL"), or null when no link should show. */
export function returnLabel(url, extraHosts = {}) {
  const hosts = { ...RETURN_HOSTS, ...extraHosts };
  return url ? hosts[url.hostname] ?? null : null;
}

/**
 * Read ecosystem parameters from a query string.
 * Returns { context, lang, search } where search is the query string with the
 * ecosystem parameters removed (other parameters, e.g. ?icon=, are kept).
 */
export function parseEcosystem(search, extraHosts = {}) {
  const params = new URLSearchParams(search || '');
  const present = ECO_PARAMS.some((p) => params.has(p));
  const lang = normaliseLang(params.get('lang'));
  const url = trustedReturnUrl(params.get('return'), extraHosts);
  const label = returnLabel(url, extraHosts);
  const from = params.get('from');
  const context = url && label
    ? { source: KNOWN_SOURCES.includes(from) ? from : null, label, returnUrl: url.toString(), hidden: false }
    : null;
  for (const p of ECO_PARAMS) params.delete(p);
  const rest = params.toString();
  return { present, context, lang, search: rest ? `?${rest}` : '' };
}

function readStored(storage) {
  try {
    const v = JSON.parse(storage.getItem(STORAGE_KEY) || 'null');
    if (!v || typeof v !== 'object') return null;
    // Re-validate on every read: never trust what is in storage
    const url = trustedReturnUrl(v.returnUrl);
    const label = returnLabel(url);
    return url && label ? { source: KNOWN_SOURCES.includes(v.source) ? v.source : null, label, returnUrl: url.toString(), hidden: !!v.hidden } : null;
  } catch { return null; }
}

/**
 * Run once at startup, before the app renders. Stores a valid context in
 * sessionStorage (a new valid link replaces an older one; an invalid one leaves it),
 * applies a supported ?lang=, and removes the ecosystem parameters from the URL.
 */
export function captureEcosystem(win = window, extraHosts = {}) {
  try {
    const { present, context, lang, search } = parseEcosystem(win.location.search, extraHosts);
    if (context) win.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    if (lang) win.localStorage.setItem('hcm-language', lang);
    if (present) {
      const clean = `${win.location.pathname}${search}${win.location.hash}`;
      win.history.replaceState(win.history.state, '', clean);
    }
  } catch { /* storage or history unavailable: the app still works, just without a back link */ }
  return getEcosystem(win);
}

export function getEcosystem(win = window) {
  try { return readStored(win.sessionStorage); } catch { return null; }
}

export function hideEcosystem(win = window) {
  try {
    const cur = readStored(win.sessionStorage);
    if (cur) win.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, hidden: true }));
  } catch { /* ignore */ }
}

/**
 * Outbound same-tab link to another Experience with our context attached:
 *   destination?from=hcmc-ale-trail&return=<this page>
 * Returns null unless the destination is on an approved host. `here` is the page to
 * come back to; ecosystem parameters are stripped from it first.
 */
export function outboundUrl(destination, here = (typeof window !== 'undefined' ? window.location.href : '')) {
  const dest = trustedReturnUrl(destination);
  if (!dest || returnLabel(dest) === null) return null;
  let back;
  try {
    back = new URL(here);
    for (const p of ECO_PARAMS) back.searchParams.delete(p);
    back.hash = '';
  } catch { return null; }
  dest.searchParams.set('from', SELF_SOURCE);
  if (back.protocol === 'https:' && Object.prototype.hasOwnProperty.call(RETURN_HOSTS, back.hostname)) {
    dest.searchParams.set('return', back.toString());
  }
  return dest.toString();
}
