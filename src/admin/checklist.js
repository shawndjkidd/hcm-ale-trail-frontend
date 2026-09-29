// One definition of the venue checklist, used by the venue's own dashboard and by HQ,
// so both always show the same items. `facts` comes from the venue's data.
//   { hasPhoto, realBeers, beersMissingDetails: [names], hasHours, hasMaps, hasDescEn, hasDescVn,
//     hats, hasSocial, demoItems (null = unknown), barStaff, realEvents }

const plain = (text, vars) => (vars ? String(text).replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m)) : text);

export function buildChecklist(f, t = plain) {
  const missing = f.beersMissingDetails || [];
  const confirmed = new Set(f.confirmed || []);
  // Nothing ticks by itself: the venue clicks each item off. The tick button only appears
  // once the thing exists (e.g. at least one beer), so the list stays honest.
  const item = (key, ready, extra) => ({ key, ready, done: confirmed.has(key), ...extra });
  const items = [
    item('photo', !!f.hasPhoto, { notReady: t('Add a cover photo first'), title: f.hasPhoto ? t('Check your cover photo') : t('Add a cover photo'), short: 'Photo', why: t('The big picture on your trail card. Venues with a photo get the large card.'), go: 'settings', cta: t('Check it'), tick: f.hasPhoto ? t('Looks good') : t('Done') }),
    item('beers', f.realBeers > 0, { notReady: t('Add at least one beer first'), title: t('Add your beers'), short: 'Beers', why: f.realBeers > 0 ? t(f.realBeers === 1 ? '{n} beer added. Add any that are missing, then tick this off.' : '{n} beers added. Add any that are missing, then tick this off.', { n: f.realBeers }) : t('Guests pick what they are drinking when they check in and rate it.'), go: 'beers', cta: t('Add beers'), tick: t('Done') }),
    item('details', f.realBeers > 0 && missing.length === 0, { notReady: f.realBeers === 0 ? t('Add at least one beer first') : t('Give every beer its style and ABV first'), title: t('Style and strength on every beer'), short: 'Beer details',
      why: f.realBeers === 0 ? t('Once your beers are in, give each one its style and ABV.')
        : missing.length ? t('Missing on: {names}', { names: `${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ` +${missing.length - 3}` : ''}` }) : t('Shown next to each beer, and used to sort your menu.'),
      go: 'beers', cta: t('Check it'), tick: t('Done') }),
    item('hours', !!f.hasHours, { notReady: t('Set your opening hours first'), title: f.hasHours ? t('Check your opening hours') : t('Set your opening hours'), short: 'Hours', why: t('So the app can say "Open now" or "Opens 16:00".'), go: 'settings', cta: t('Check it'), tick: f.hasHours ? t('Looks good') : t('Done') }),
    item('maps', !!f.hasMaps, { notReady: t('Add your Google Maps link first'), title: f.hasMaps ? t('Check your Google Maps link') : t('Add your Google Maps link'), short: 'Maps link', why: t('Makes the Directions button and your map pin work.'), go: 'settings', cta: t('Check it'), tick: f.hasMaps ? t('Looks good') : t('Done') }),
    item('descEn', !!f.hasDescEn, { notReady: t('Write the English description first'), title: f.hasDescEn ? t('Check your English description') : t('Write a short description (English)'), short: 'Description EN', why: t('One or two lines on your venue page.'), go: 'settings', cta: t('Check it'), tick: f.hasDescEn ? t('Looks good') : t('Done') }),
    item('descVn', !!f.hasDescVn, { notReady: t('Write the Vietnamese description first'), title: f.hasDescVn ? t('Check your Vietnamese description') : t('Add the description in Vietnamese'), short: 'Description VI', why: t('Shown to guests using the app in Vietnamese.'), go: 'settings', cta: t('Check it'), tick: f.hasDescVn ? t('Looks good') : t('Done') }),
    item('hats', f.hats > 0, { notReady: t('Record at least one hat first'), title: t('Record your hats'), short: 'Hats', why: f.hats > 0 ? t('{n} in stock. Tick this off once the count is right.', { n: f.hats }) : t('Guests can only claim a hat at your venue when you have some in stock.'), go: 'stock', cta: t('Open stock'), tick: t('Done') }),
    item('social', !!f.hasSocial, { notReady: t('Add Instagram or Facebook first'), title: f.hasSocial ? t('Check your Instagram and Facebook links') : t('Add Instagram or Facebook'), short: 'Socials', why: t('Guests tag you and follow you from your page.'), go: 'settings', cta: t('Check it'), tick: f.hasSocial ? t('Looks good') : t('Done') }),
    item('code', !!f.codeSet, { notReady: t('Change your code from 1234 first'), title: t('Choose your own check-in code'), short: 'Own code',
      why: t("Every venue starts on 1234. Pick a 4-digit code only your staff know, so guests can't stamp themselves."), go: 'settings', cta: t('Change code'), tick: t('Done') }),
    item('demo', f.demoItems === 0, { notReady: t('Remove the demo content first'), title: t('Remove the demo content'), short: 'Remove demo',
      why: f.demoItems ? t(f.demoItems === 1 ? '{n} demo item still shows on your page.' : '{n} demo items still show on your page.', { n: f.demoItems }) : t('The demo content is gone. Tick this off.'), action: 'removeDemo', cta: t('Remove demo'), tick: t('Done') }),
    item('team', f.barStaff > 0, { notReady: t('Add at least one staff member first'), title: t('Add your bar staff'), short: 'Bar staff', why: t('Give staff their own login so they can check guests in and see hats left.'), go: 'team', cta: t('Open team'), tick: t('Done') }),
    item('event', f.realEvents > 0, { notReady: t('Add an event first'), optional: true, title: t('Add an event'), short: 'Event', why: t("Tap takeovers, live music, quiz nights: they show in What's On."), go: 'events', cta: t('Add event'), tick: t('Done') }),
  ];
  const required = items.filter((i) => !i.optional);
  const done = required.filter((i) => i.done).length;
  return { items, done, total: required.length, complete: done === required.length, todo: items.filter((i) => !i.done) };
}
