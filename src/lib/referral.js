// Venue QR codes and ad links open the app as https://hcm.thealetrail.app/?v=<venue ref>&s=<format>.
// We remember the scan on this phone, record it (qr_scan), and once the phone signs in we
// record qr_link so HQ can see which venue and format brought each new guest in.
import { track } from './track';

const KEY = 'hcm-ref';
const SOURCES = ['tent', 'poster', 'sticker', 'story', 'facebook', 'instagram', 'link'];

export function captureReferral() {
  try {
    const url = new URL(window.location.href);
    const v = (url.searchParams.get('v') || '').toLowerCase();
    if (!/^[0-9a-f]{8}$/.test(v)) return;
    const raw = url.searchParams.get('s') || '';
    // A fixed format, or a spot the venue named itself (c-front-window).
    const s = SOURCES.includes(raw) || /^c-[a-z0-9-]{1,24}$/.test(raw) ? raw : 'link';
    const id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^A-Za-z0-9-]/g, '').slice(0, 64);
    // Keep the first code that brought this phone in, unless it's more than 30 days old.
    const prev = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!prev || Date.now() - prev.at > 30 * 86400000) localStorage.setItem(KEY, JSON.stringify({ v, s, id, at: Date.now() }));
    track('qr_scan', { venue_id: v, source: s, scan_id: id });
    url.searchParams.delete('v'); url.searchParams.delete('s');
    window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
  } catch {}
}

export function linkReferral(userId) {
  try {
    if (!userId) return;
    const ref = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!ref || localStorage.getItem(`${KEY}-linked-${userId}`)) return;
    track('qr_link', { venue_id: ref.v, source: ref.s, scan_id: ref.id });
    localStorage.setItem(`${KEY}-linked-${userId}`, '1');
  } catch {}
}
