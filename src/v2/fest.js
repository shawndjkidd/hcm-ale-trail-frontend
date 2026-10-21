import { useCallback, useEffect, useState } from 'react';
import { getFestBeers, getMyFest, saveFestTasting } from '../lib/api';
import { TRAIL_ID } from '../config';

// Festival beer list (Collab Fest): the beers come from the festival's feed, and each
// guest's own ticks and ratings are saved to their account, or on the phone until they
// sign in (then moved to the account). Just for fun: nobody checks it.

export const FEST = 'collabfest-2026';
// The one night it happens (Saigon): Sat 31 Oct, 4pm to midnight. Ticking off unlocks at the start.
export const FEST_STARTS = '2026-10-31T09:00:00Z';
export const FEST_POSTER = '/events/collabfest-halloween.jpg';
export const festLive = (now = Date.now()) => now >= Date.parse(FEST_STARTS);
const LOCAL = `hcm-fest-${FEST}`;

const readLocal = () => { try { return JSON.parse(localStorage.getItem(LOCAL) || '{}') || {}; } catch { return {}; } };
const writeLocal = (m) => { try { localStorage.setItem(LOCAL, JSON.stringify(m)); } catch {} };

// Card art at the size a spot needs (the image route resizes: 256 for rows, 640 big).
export const artAt = (beer, w) => (beer?.image ? `${beer.image}&w=${w}` : null);

// Beer colour for the tasting paddle, from the style.
export function beerColour(style) {
  const s = String(style || '').toLowerCase();
  if (/cider/.test(s)) return '#efd77a';
  if (/kokum/.test(s)) return '#d9636b';
  if (/red/.test(s)) return '#a8401c';
  if (/amber/.test(s)) return '#c9781f';
  if (/wheat/.test(s)) return '#f2c96a';
  if (/haz/.test(s)) return '#f0b445';
  if (/lager|pils/.test(s)) return '#f2cf55';
  return '#e0a12a';
}

export const beerBy = (b) => [b.brewery, ...(b.with || [])].filter(Boolean).join(' × ');

/** The festival's beers plus this guest's list. `tastings` is { beerKey: { rating, tags, triedAt } }. */
export function useFest(user) {
  const [beers, setBeers] = useState(null);
  const [info, setInfo] = useState(null);
  const [tastings, setTastings] = useState(() => readLocal());
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    getFestBeers(FEST).then((r) => {
      if (!live) return;
      if (r?.ok) { setBeers(r.beers || []); setInfo({ title: r.title, opensAt: r.opensAt, closesAt: r.closesAt }); }
      else setError(r?.error || 'unavailable');
    });
    return () => { live = false; };
  }, []);

  // Signed in: load the account's list, and move anything ticked on this phone before signing in.
  useEffect(() => {
    if (!user) { setTastings(readLocal()); return undefined; }
    let live = true;
    (async () => {
      const r = await getMyFest(TRAIL_ID, FEST);
      if (!live || !r?.ok) return;
      const server = Object.fromEntries((r.tastings || []).map((t) => [t.beerKey, { rating: t.rating, tags: t.tags || [], triedAt: t.triedAt }]));
      const local = readLocal();
      const moved = Object.entries(local).filter(([k]) => !server[k]);
      for (const [beerKey, t] of moved) {
        const s = await saveFestTasting(TRAIL_ID, FEST, { beerKey, tried: true, rating: t.rating ?? null, tags: t.tags || [] });
        if (s?.ok) server[beerKey] = { rating: t.rating ?? null, tags: t.tags || [], triedAt: s.tasting?.triedAt || t.triedAt };
      }
      if (moved.length) writeLocal({});
      if (live) setTastings(server);
    })();
    return () => { live = false; };
  }, [user?.id]);

  // Save one beer: tried with an optional rating and tags, or untick (tried: false).
  const save = useCallback(async (beerKey, { tried = true, rating = null, tags = [] } = {}) => {
    const before = tastings;
    const next = { ...tastings };
    if (tried) next[beerKey] = { rating, tags, triedAt: tastings[beerKey]?.triedAt || new Date().toISOString() };
    else delete next[beerKey];
    setTastings(next);
    if (!user) { writeLocal(next); return true; }
    const r = await saveFestTasting(TRAIL_ID, FEST, { beerKey, tried, rating, tags });
    if (!r?.ok) { setTastings(before); return false; }
    return true;
  }, [tastings, user]);

  const now = Date.now();
  const open = !!info && now >= Date.parse(info.opensAt) && now < Date.parse(info.closesAt);
  return { beers, info, open, tastings, save, error };
}
