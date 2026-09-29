// One definition of the venue checklist, used by the venue's own dashboard and by HQ,
// so both always show the same items. `facts` comes from the venue's data.
//   { hasPhoto, realBeers, beersMissingDetails: [names], hasHours, hasMaps, hasDescEn, hasDescVn,
//     hats, hasSocial, demoItems (null = unknown), barStaff, realEvents }

export function buildChecklist(f) {
  const missing = f.beersMissingDetails || [];
  const items = [
    { key: 'photo', done: !!f.hasPhoto, title: 'Add a cover photo', short: 'Photo', why: 'The big picture on your trail card. Venues with a photo get the large card.', go: 'settings', cta: 'Add photo' },
    { key: 'beers', done: f.realBeers > 0, title: 'Add your beers', short: 'Beers', why: 'Guests pick what they are drinking when they check in and rate it.', go: 'beers', cta: 'Add beers' },
    // Only makes sense once they have beers; until then "Add your beers" covers it.
    { key: 'details', done: f.realBeers > 0 && missing.length === 0, hidden: f.realBeers === 0, title: 'Style and strength on every beer', short: 'Beer details',
      why: missing.length ? `Missing on: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ` and ${missing.length - 3} more` : ''}` : 'Shown next to each beer, and used to sort your menu.', go: 'beers', cta: 'Fix beers' },
    { key: 'hours', done: !!f.hasHours, title: 'Set your opening hours', short: 'Hours', why: 'So the app can say "Open now" or "Opens 16:00".', go: 'settings', cta: 'Set hours' },
    { key: 'maps', done: !!f.hasMaps, title: 'Add your Google Maps link', short: 'Maps link', why: 'Makes the Directions button and your map pin work.', go: 'settings', cta: 'Add link' },
    { key: 'descEn', done: !!f.hasDescEn, title: 'Write a short description (English)', short: 'Description EN', why: 'One or two lines on your venue page.', go: 'settings', cta: 'Write it' },
    { key: 'descVn', done: !!f.hasDescVn, title: 'Add the description in Vietnamese', short: 'Description VI', why: 'Shown to guests using the app in Vietnamese.', go: 'settings', cta: 'Add it' },
    { key: 'hats', done: f.hats > 0, title: 'Record your hats', short: 'Hats', why: 'Guests can only claim a hat at your venue when you have some in stock.', go: 'stock', cta: 'Open stock' },
    { key: 'social', done: !!f.hasSocial, title: 'Add Instagram or Facebook', short: 'Socials', why: 'Guests tag you and follow you from your page.', go: 'settings', cta: 'Add links' },
    { key: 'demo', done: f.demoItems === 0, title: 'Remove the demo content', short: 'Remove demo',
      why: f.demoItems ? `${f.demoItems} demo ${f.demoItems === 1 ? 'item still shows' : 'items still show'} on your page. They also go by themselves when you add your own beers and events.` : 'Only your own beers and events show.', action: 'removeDemo', cta: 'Remove demo' },
    { key: 'team', done: f.barStaff > 0, title: 'Add your bar staff', short: 'Bar staff', why: 'Give staff their own login so they can check guests in and see hats left.', go: 'team', cta: 'Open team' },
    { key: 'event', done: f.realEvents > 0, optional: true, title: 'Add an event', short: 'Event', why: "Tap takeovers, live music, quiz nights: they show in What's On.", go: 'events', cta: 'Add event' },
  ];
  const required = items.filter((i) => !i.optional);
  const done = required.filter((i) => i.done).length;
  return { items, done, total: required.length, complete: done === required.length, todo: items.filter((i) => !i.done && !i.hidden) };
}
