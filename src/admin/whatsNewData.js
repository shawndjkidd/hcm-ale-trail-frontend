import { useCallback, useEffect, useMemo, useState } from 'react';
import { getWhatsNew, markWhatsNewSeen } from './adminApi';

// What's new on the dashboard (design/whats-new-mockup.html; backend /api/admin/whats-new). Every update
// ships with plain-words notes in the database; the backend only returns notes this person may read.
// After a refresh each person sees the notes of updates newer than the last one they saw, once
// (someone new: the last week's).

export const releaseDate = (r, lang = 'en') => new Date(`${r.released_on}T12:00:00`)
  .toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', { day: 'numeric', month: 'short' });

/** The note in the dashboard's language (Vietnamese when there is some). */
export const noteText = (x, lang) => ({
  title: (lang === 'vi' && x.title_vi) || x.title,
  body: (lang === 'vi' && x.body_vi) || x.body,
});

/** Updates this person hasn't seen: newer than their marker, or (never marked) the last week's. */
export function freshReleases(releases, mark) {
  if (mark) return releases.filter((r) => r.id > mark);
  if (!releases.length) return [];
  const since = new Date(`${releases[0].released_on}T12:00:00`);
  since.setDate(since.getDate() - 7);
  return releases.filter((r) => new Date(`${r.released_on}T12:00:00`) >= since);
}

export function useWhatsNew(enabled) {
  const [releases, setReleases] = useState([]);
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [mark, setMark] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    getWhatsNew().then((r) => {
      if (!alive) return;
      if (r?.ok) { setReleases(r.releases || []); setItems(r.items || []); setMark(r.lastSeen || null); }
      setLoaded(true);
    });
    return () => { alive = false; };
  }, [enabled]);

  const latest = releases[0]?.id ?? null;
  const fresh = useMemo(() => freshReleases(releases, mark), [releases, mark]);
  const freshIds = useMemo(() => new Set(fresh.map((r) => r.id)), [fresh]);
  const unseen = useMemo(() => items.filter((x) => freshIds.has(x.release_id))
    .sort((a, b) => b.release_id.localeCompare(a.release_id) || a.pos - b.pos), [items, freshIds]);
  const smallFixes = fresh.reduce((s, r) => s + (r.small_fixes || 0), 0);

  const markSeen = useCallback(async () => {
    if (!latest || !enabled) return;
    setMark(latest);
    await markWhatsNewSeen(latest);
  }, [latest, enabled]);

  // Updates with nothing this person can open are marked seen quietly.
  useEffect(() => {
    if (loaded && fresh.length && !unseen.length && !smallFixes) markSeen();
  }, [loaded, fresh.length, unseen.length, smallFixes, markSeen]);

  return { loaded, releases, items, fresh, freshIds, unseen, smallFixes, newest: fresh[0] ?? null, markSeen };
}

/** Number of notes the person will see after refreshing (used by the update notice). */
export async function countUnseen() {
  const r = await getWhatsNew();
  if (!r?.ok) return 0;
  const ids = new Set(freshReleases(r.releases || [], r.lastSeen || null).map((x) => x.id));
  return (r.items || []).filter((x) => ids.has(x.release_id)).length;
}
