// Demo side quests and events, shown ONLY on preview/local addresses so the
// founder can see the full layout. Never shown on the live domain.

export const DEMO_MODE =
  typeof window !== 'undefined' &&
  !/^(hcm\.)?thealetrail\.app$/i.test(window.location.hostname);

// ISO time for a Saigon wall-clock time, `dayOffset` days from today.
function saigonAt(dayOffset, hh, mm = 0) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }); // YYYY-MM-DD
  const base = new Date(`${today}T00:00:00+07:00`);
  base.setDate(base.getDate() + dayOffset);
  const d = base.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  return new Date(`${d}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00+07:00`).toISOString();
}

const byName = (breweries, name) => breweries.find((b) => b.name === name) || {};

export function demoEvents(breweries) {
  const bia = byName(breweries, 'BiaCraft');
  const hod = byName(breweries, 'Heart of Darkness');
  const roo = byName(breweries, 'Rooster Beers');
  const ste = byName(breweries, 'Steersman');
  const ew = byName(breweries, 'East West Brewing');
  const belgo = byName(breweries, 'Belgo Saigon');
  return [
    {
      id: 'demo-ev-1', category: 'event', breweryId: bia.id, breweryName: 'BiaCraft',
      title: { en: 'Tap takeover: Hanoi guest brews', vn: 'Tap takeover: bia khách từ Hà Nội' },
      description: { en: 'Six guest taps from Hanoi breweries for one night only.', vn: 'Sáu vòi bia khách từ Hà Nội, chỉ một đêm.' },
      startsAt: saigonAt(0, 19), endsAt: saigonAt(0, 23),
    },
    {
      id: 'demo-ev-2', category: 'event', breweryId: roo.id, breweryName: 'Rooster Beers',
      title: { en: 'Live blues + BBQ', vn: 'Nhạc blues sống + BBQ' },
      description: { en: 'Local band from 20:30, smoked ribs all night.', vn: 'Ban nhạc từ 20:30, sườn nướng cả tối.' },
      startsAt: saigonAt(0, 20, 30), endsAt: saigonAt(0, 23, 30),
    },
    {
      id: 'demo-ev-3', category: 'new_release', breweryId: hod.id, breweryName: 'Heart of Darkness',
      title: { en: 'Kurtz IPA returns', vn: 'Kurtz IPA trở lại' },
      description: { en: 'Back on tap after a year away. First keg goes fast.', vn: 'Trở lại sau một năm. Keg đầu tiên hết nhanh lắm.' },
      startsAt: saigonAt(2, 17), endsAt: saigonAt(2, 23),
    },
    {
      id: 'demo-ev-4', category: 'event', breweryId: ste.id, breweryName: 'Steersman',
      title: { en: 'Quiz night: winners drink free', vn: 'Đố vui: đội thắng uống miễn phí' },
      description: { en: 'Teams of up to four. Starts 19:30.', vn: 'Đội tối đa bốn người. Bắt đầu 19:30.' },
      startsAt: saigonAt(3, 19, 30), endsAt: saigonAt(3, 22),
    },
    {
      id: 'demo-ev-5', category: 'new_release', breweryId: ew.id, breweryName: 'East West Brewing',
      title: { en: 'Dragonfruit Sour launch', vn: 'Ra mắt Dragonfruit Sour' },
      description: { en: 'Pink, tart and very Saigon.', vn: 'Hồng, chua và rất Sài Gòn.' },
      startsAt: saigonAt(5, 18), endsAt: saigonAt(5, 23),
    },
    {
      id: 'demo-ev-6', category: 'event', breweryId: belgo.id, breweryName: 'Belgo Saigon',
      title: { en: 'Belgian beer weekend', vn: 'Cuối tuần bia Bỉ' },
      description: { en: 'Tripels, dubbels and frites.', vn: 'Tripel, dubbel và khoai tây chiên.' },
      startsAt: saigonAt(12, 16), endsAt: saigonAt(13, 23),
    },
  ].filter((e) => e.breweryId);
}

const OPEN_LATE = {
  monday: { open: '16:00', close: '01:00' }, tuesday: { open: '16:00', close: '01:00' },
  wednesday: { open: '16:00', close: '01:00' }, thursday: { open: '16:00', close: '01:00' },
  friday: { open: '15:00', close: '02:00' }, saturday: { open: '12:00', close: '02:00' }, sunday: { open: '12:00', close: '00:00' },
};
const ALL_DAY = Object.fromEntries(Object.keys(OPEN_LATE).map((d) => [d, { open: '07:00', close: '23:59' }]));

export const DEMO_SIDE_QUESTS = [
  {
    id: 'demo-sq-1', kind: 'Wine bar', district: 'D3', title: { en: 'Vin Saigon', vn: 'Vin Saigon' },
    description: { en: 'Natural wines from small producers, in a 1960s shophouse. A break from the hops.', vn: 'Rượu vang tự nhiên trong một căn nhà phố thập niên 60.' },
    reward: 'Free glass of house red', address: '12 Tu Xuong, District 3',
    photo_url: 'linear-gradient', operating_hours: ALL_DAY, latitude: 10.7818, longitude: 106.6889,
    maps_url: 'https://maps.google.com/?q=10.7818,106.6889', instagram_url: 'https://instagram.com/',
  },
  {
    id: 'demo-sq-2', kind: 'Sake bar', district: 'D1', title: { en: 'Kura Sake Stand', vn: 'Kura Sake Stand' },
    description: { en: 'Eight sakes by the glass and a tiny standing counter.', vn: 'Tám loại sake theo ly và quầy đứng nhỏ.' },
    reward: 'Sake flight for 2 stamps', address: '5 Thai Van Lung, District 1',
    ends_at: (() => { const d = new Date(); d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7)); return d.toISOString(); })(),
    operating_hours: OPEN_LATE, latitude: 10.7783, longitude: 106.7045,
    maps_url: 'https://maps.google.com/?q=10.7783,106.7045',
  },
  {
    id: 'demo-sq-3', kind: 'Coffee', district: 'D1', title: { en: 'The Workshop', vn: 'The Workshop' },
    description: { en: 'Morning-after cold brew on a roastery rooftop.', vn: 'Cold brew trên sân thượng xưởng rang.' },
    reward: '20% off any coffee', address: '27 Ngo Duc Ke, District 1',
    operating_hours: { ...ALL_DAY, sunday: { closed: true } }, latitude: 10.7747, longitude: 106.7048,
    maps_url: 'https://maps.google.com/?q=10.7747,106.7048',
  },
].map((q) => ({ ...q, photo_url: q.photo_url === 'linear-gradient' ? null : q.photo_url || null }));
