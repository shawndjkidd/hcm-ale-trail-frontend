// One definition of the venue checklist, used by the venue's own dashboard and by HQ,
// so both always show the same items. `facts` comes from the venue's data.
//   { hasPhoto, realBeers, beersMissingDetails: [names], hasHours, hasMaps, hasDescEn, hasDescVn,
//     hats, hasSocial, demoItems (null = unknown), barStaff, realEvents }

export function buildChecklist(f) {
  const missing = f.beersMissingDetails || [];
  const confirmed = new Set(f.confirmed || []);
  // HQ pre-filled some details at setup. They only count once the venue itself checks them
  // ("Looks good") or changes them, so a venue that has never logged in starts at 0.
  const prefilled = (key, has, add, check, short, why, cta) => ({
    key, short, why, go: 'settings', cta,
    done: has && confirmed.has(key),
    canConfirm: has && !confirmed.has(key),
    title: has ? check : add,
  });
  const items = [
    prefilled('photo', !!f.hasPhoto, 'Add a cover photo', 'Check your cover photo', 'Photo', 'The big picture on your trail card. Venues with a photo get the large card.', 'Change it'),
    { key: 'beers', done: f.realBeers > 0, title: 'Add your beers', short: 'Beers', why: 'Guests pick what they are drinking when they check in and rate it.', go: 'beers', cta: 'Add beers' },
    { key: 'details', done: f.realBeers > 0 && missing.length === 0, blocked: f.realBeers === 0, title: 'Style and strength on every beer', short: 'Beer details',
      why: f.realBeers === 0 ? 'Once your beers are in, give each one its style and ABV.'
        : missing.length ? `Missing on: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ` and ${missing.length - 3} more` : ''}` : 'Shown next to each beer, and used to sort your menu.',
      go: 'beers', cta: 'Fix beers' },
    prefilled('hours', !!f.hasHours, 'Set your opening hours', 'Check your opening hours', 'Hours', 'So the app can say "Open now" or "Opens 16:00".', 'Change them'),
    prefilled('maps', !!f.hasMaps, 'Add your Google Maps link', 'Check your Google Maps link', 'Maps link', 'Makes the Directions button and your map pin work.', 'Change it'),
    prefilled('descEn', !!f.hasDescEn, 'Write a short description (English)', 'Check your English description', 'Description EN', 'One or two lines on your venue page.', 'Change it'),
    prefilled('descVn', !!f.hasDescVn, 'Add the description in Vietnamese', 'Check your Vietnamese description', 'Description VI', 'Shown to guests using the app in Vietnamese.', 'Change it'),
    { key: 'hats', done: f.hats > 0, title: 'Record your hats', short: 'Hats', why: 'Guests can only claim a hat at your venue when you have some in stock.', go: 'stock', cta: 'Open stock' },
    prefilled('social', !!f.hasSocial, 'Add Instagram or Facebook', 'Check your Instagram and Facebook links', 'Socials', 'Guests tag you and follow you from your page.', 'Change them'),
    { key: 'demo', done: f.demoItems === 0, title: 'Remove the demo content', short: 'Remove demo',
      why: f.demoItems ? `${f.demoItems} demo ${f.demoItems === 1 ? 'item still shows' : 'items still show'} on your page. They also go by themselves when you add your own beers and events.` : 'Only your own beers and events show.', action: 'removeDemo', cta: 'Remove demo' },
    { key: 'team', done: f.barStaff > 0, title: 'Add your bar staff', short: 'Bar staff', why: 'Give staff their own login so they can check guests in and see hats left.', go: 'team', cta: 'Open team' },
    { key: 'event', done: f.realEvents > 0, optional: true, title: 'Add an event', short: 'Event', why: "Tap takeovers, live music, quiz nights: they show in What's On.", go: 'events', cta: 'Add event' },
  ];
  const required = items.filter((i) => !i.optional);
  const done = required.filter((i) => i.done).length;
  return { items, done, total: required.length, complete: done === required.length, todo: items.filter((i) => !i.done) };
}
