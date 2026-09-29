// One definition of the venue checklist, used by the venue's own dashboard and by HQ,
// so both always show the same items. `facts` comes from the venue's data.
//   { hasPhoto, realBeers, beersMissingDetails: [names], hasHours, hasMaps, hasDescEn, hasDescVn,
//     hats, hasSocial, demoItems (null = unknown), barStaff, realEvents }

export function buildChecklist(f) {
  const missing = f.beersMissingDetails || [];
  const confirmed = new Set(f.confirmed || []);
  // Nothing ticks by itself: the venue clicks each item off. The tick button only appears
  // once the thing exists (e.g. at least one beer), so the list stays honest.
  const item = (key, ready, extra) => ({ key, ready, done: confirmed.has(key), ...extra });
  const items = [
    item('photo', !!f.hasPhoto, { title: f.hasPhoto ? 'Check your cover photo' : 'Add a cover photo', short: 'Photo', why: 'The big picture on your trail card. Venues with a photo get the large card.', go: 'settings', cta: f.hasPhoto ? 'Change it' : 'Add photo', tick: f.hasPhoto ? 'Looks good' : 'Done' }),
    item('beers', f.realBeers > 0, { title: 'Add your beers', short: 'Beers', why: f.realBeers > 0 ? `${f.realBeers} ${f.realBeers === 1 ? 'beer' : 'beers'} added. Add any that are missing, then tick this off.` : 'Guests pick what they are drinking when they check in and rate it.', go: 'beers', cta: 'Add beers', tick: 'Done' }),
    item('details', f.realBeers > 0 && missing.length === 0, { title: 'Style and strength on every beer', short: 'Beer details',
      why: f.realBeers === 0 ? 'Once your beers are in, give each one its style and ABV.'
        : missing.length ? `Missing on: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ` and ${missing.length - 3} more` : ''}` : 'Shown next to each beer, and used to sort your menu.',
      go: 'beers', cta: 'Fix beers', tick: 'Done' }),
    item('hours', !!f.hasHours, { title: f.hasHours ? 'Check your opening hours' : 'Set your opening hours', short: 'Hours', why: 'So the app can say "Open now" or "Opens 16:00".', go: 'settings', cta: f.hasHours ? 'Change them' : 'Set hours', tick: f.hasHours ? 'Looks good' : 'Done' }),
    item('maps', !!f.hasMaps, { title: f.hasMaps ? 'Check your Google Maps link' : 'Add your Google Maps link', short: 'Maps link', why: 'Makes the Directions button and your map pin work.', go: 'settings', cta: f.hasMaps ? 'Change it' : 'Add link', tick: f.hasMaps ? 'Looks good' : 'Done' }),
    item('descEn', !!f.hasDescEn, { title: f.hasDescEn ? 'Check your English description' : 'Write a short description (English)', short: 'Description EN', why: 'One or two lines on your venue page.', go: 'settings', cta: f.hasDescEn ? 'Change it' : 'Write it', tick: f.hasDescEn ? 'Looks good' : 'Done' }),
    item('descVn', !!f.hasDescVn, { title: f.hasDescVn ? 'Check your Vietnamese description' : 'Add the description in Vietnamese', short: 'Description VI', why: 'Shown to guests using the app in Vietnamese.', go: 'settings', cta: f.hasDescVn ? 'Change it' : 'Add it', tick: f.hasDescVn ? 'Looks good' : 'Done' }),
    item('hats', f.hats > 0, { title: 'Record your hats', short: 'Hats', why: f.hats > 0 ? `${f.hats} in stock. Tick this off once the count is right.` : 'Guests can only claim a hat at your venue when you have some in stock.', go: 'stock', cta: 'Open stock', tick: 'Done' }),
    item('social', !!f.hasSocial, { title: f.hasSocial ? 'Check your Instagram and Facebook links' : 'Add Instagram or Facebook', short: 'Socials', why: 'Guests tag you and follow you from your page.', go: 'settings', cta: f.hasSocial ? 'Change them' : 'Add links', tick: f.hasSocial ? 'Looks good' : 'Done' }),
    item('demo', f.demoItems === 0, { title: 'Remove the demo content', short: 'Remove demo',
      why: f.demoItems ? `${f.demoItems} demo ${f.demoItems === 1 ? 'item still shows' : 'items still show'} on your page.` : 'The demo content is gone. Tick this off.', action: 'removeDemo', cta: 'Remove demo', tick: 'Done' }),
    item('team', f.barStaff > 0, { title: 'Add your bar staff', short: 'Bar staff', why: 'Give staff their own login so they can check guests in and see hats left.', go: 'team', cta: 'Open team', tick: 'Done' }),
    item('event', f.realEvents > 0, { optional: true, title: 'Add an event', short: 'Event', why: "Tap takeovers, live music, quiz nights: they show in What's On.", go: 'events', cta: 'Add event', tick: 'Done' }),
  ];
  const required = items.filter((i) => !i.optional);
  const done = required.filter((i) => i.done).length;
  return { items, done, total: required.length, complete: done === required.length, todo: items.filter((i) => !i.done) };
}
