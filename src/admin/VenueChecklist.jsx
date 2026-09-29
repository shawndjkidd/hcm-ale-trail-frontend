import { useEffect, useState } from 'react';
import { getVenueDemo } from './adminApi';

// "Get your venue ready": everything that makes the venue's page in the app complete.
// Items tick themselves off from the venue's real data and drop off the list; each button opens
// the right tab. When everything is done the whole card is gone.

const isDemoBeer = (b) => String(b.id || '').startsWith('de000000-') || /^\s*DEMO\s*·/i.test(b.name || '');

export default function VenueChecklist({ breweryId, photoUrl, hasHours, socialLinks, descriptionEn, descriptionVn, beers, merch, events, staff, onGo }) {
  const [demo, setDemo] = useState(null);
  useEffect(() => {
    let live = true;
    getVenueDemo(breweryId).then((r) => { if (live && r?.ok) setDemo(r.demo); });
    return () => { live = false; };
  }, [breweryId]);

  const realBeers = (beers || []).filter((b) => !isDemoBeer(b) && b.active !== false);
  const missingDetails = realBeers.filter((b) => !b.style || b.abv === null || b.abv === undefined || b.abv === '');
  const hats = (merch || []).reduce((n, m) => n + (Number(m.quantity) || 0), 0);
  const demoLeft = demo ? demo.beers + demo.events + demo.ratings : 0;
  const realEvents = (events || []).filter((e) => !String(e.id || '').startsWith('de000000-'));
  const bar = (staff || []).filter((m) => m.role === 'staff' || m.role === 'manager');

  const items = [
    { key: 'photo', done: !!photoUrl, title: 'Add a cover photo', why: 'The big picture on your trail card. Venues with a photo get the large card.', go: 'settings', cta: 'Add photo' },
    { key: 'beers', done: realBeers.length > 0, title: 'Add your beers', why: 'Guests pick what they are drinking when they check in and rate it.', go: 'beers', cta: 'Add beers' },
    { key: 'details', done: realBeers.length > 0 && missingDetails.length === 0, title: 'Style and strength on every beer',
      why: missingDetails.length ? `Missing on: ${missingDetails.slice(0, 3).map((b) => b.name).join(', ')}${missingDetails.length > 3 ? ` and ${missingDetails.length - 3} more` : ''}` : 'Shown next to each beer, and used to sort your menu.', go: 'beers', cta: 'Fix beers' },
    { key: 'hours', done: !!hasHours, title: 'Set your opening hours', why: 'So the app can say "Open now" or "Opens 16:00".', go: 'settings', cta: 'Set hours' },
    { key: 'maps', done: !!socialLinks?.mapsUrl, title: 'Add your Google Maps link', why: 'Makes the Directions button and your map pin work.', go: 'settings', cta: 'Add link' },
    { key: 'descEn', done: !!(descriptionEn || '').trim(), title: 'Write a short description (English)', why: 'One or two lines on your venue page.', go: 'settings', cta: 'Write it' },
    { key: 'descVn', done: !!(descriptionVn || '').trim(), title: 'Add the description in Vietnamese', why: 'Shown to guests using the app in Vietnamese.', go: 'settings', cta: 'Add it' },
    { key: 'hats', done: hats > 0, title: 'Record your hats', why: 'Guests can only claim a hat at your venue when you have some in stock.', go: 'stock', cta: 'Open stock' },
    { key: 'social', done: !!(socialLinks?.instagramUrl || socialLinks?.facebookUrl), title: 'Add Instagram or Facebook', why: 'Guests tag you and follow you from your page.', go: 'settings', cta: 'Add links' },
    { key: 'demo', done: demo !== null && demoLeft === 0, title: 'Remove the demo content', why: demoLeft ? `${demoLeft} demo items still show on your page. Use the Remove demo content box below, or they go when you add your own.` : 'Only your own beers and events show.', go: null, cta: null },
    { key: 'team', done: bar.length > 0, title: 'Add your bar staff', why: 'Give staff their own login so they can check guests in and see hats left.', go: 'team', cta: 'Open team' },
    { key: 'event', done: realEvents.length > 0, optional: true, title: 'Add an event', why: 'Tap takeovers, live music, quiz nights: they show in What\'s On.', go: 'events', cta: 'Add event' },
  ];
  const required = items.filter((i) => !i.optional);
  const doneCount = required.filter((i) => i.done).length;
  const allDone = doneCount === required.length;

  // Once everything is done the checklist disappears. (The optional event never keeps it open.)
  if (allDone) return null;

  const todo = items.filter((i) => !i.done);
  return (
    <div className="admin-card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h3 className="admin-card-title" style={{ margin: 0 }}>Get your venue ready</h3>
        <span style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>{doneCount} of {required.length} done</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'var(--admin-border)', margin: '12px 0 6px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(doneCount / required.length) * 100}%`, background: 'var(--hq-good, #22C55E)', borderRadius: 4 }} />
      </div>
      {todo.map((i) => (
        <div key={i.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--admin-border)' }}>
          <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--admin-text-muted)', flex: 'none' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{i.title}{i.optional ? <span style={{ color: 'var(--admin-text-muted)', fontWeight: 500 }}> · optional</span> : null}</div>
            <div style={{ color: 'var(--admin-text-muted)', fontSize: 13, marginTop: 2 }}>{i.why}</div>
          </div>
          {i.go && <button type="button" className="admin-btn admin-btn-primary" style={{ width: 'auto', flex: 'none' }} onClick={() => onGo(i.go)}>{i.cta}</button>}
        </div>
      ))}
    </div>
  );
}
