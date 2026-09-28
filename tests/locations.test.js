import test from 'node:test';
import assert from 'node:assert/strict';
import { breweryPlaces, placesByDistance, nearestKm, brandOpenStatus } from '../src/v2/util.js';

const ALWAYS = Object.fromEntries(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((d) => [d, { open: '00:00', close: '23:59' }]));
const NEVER = Object.fromEntries(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((d) => [d, { closed: true }]));

const rooster = {
  id: 'r', name: 'Rooster Beers', status: 'active', address: 'D1', latitude: 10.7677, longitude: 106.6945, operating_hours: NEVER,
  locations: [{ id: 'pvc', name: 'Phạm Viết Chánh', status: 'active', latitude: 10.7901, longitude: 106.7103, operating_hours: ALWAYS }],
};

test('a brewery with no extra locations has one place', () => {
  assert.equal(breweryPlaces({ id: 'x', name: 'X' }).length, 1);
});

test('all places listed, nearest first when we know where you are', () => {
  const nearPvc = { lat: 10.7905, lng: 106.7110 };
  const list = placesByDistance(rooster, nearPvc);
  assert.deepEqual(list.map((p) => p.id), ['pvc', 'r']);
  assert.ok(list[0].km < list[1].km);
  assert.equal(nearestKm(rooster, nearPvc).toFixed(2), list[0].km.toFixed(2));
  assert.deepEqual(placesByDistance(rooster, null).map((p) => p.id), ['r', 'pvc'], 'main first without location');
});

test('the brand counts as open if any location is open', () => {
  assert.equal(brandOpenStatus(rooster).open, true);
  assert.ok(!brandOpenStatus({ ...rooster, locations: [] }).open);
});

import { coordsFromMapsLink } from '../src/admin/mapsLink.js';
test('coordinates are read from full Google Maps links, not guessed from short ones', () => {
  assert.deepEqual(coordsFromMapsLink('https://www.google.com/maps/place/Rooster/@10.7901456,106.7102644,17z/data=!3m1'), { latitude: '10.7901456', longitude: '106.7102644' });
  assert.deepEqual(coordsFromMapsLink('https://maps.google.com/?q=10.7818,106.6889'), { latitude: '10.7818', longitude: '106.6889' });
  assert.equal(coordsFromMapsLink('https://maps.app.goo.gl/kxQy9aCbHnchCScf8'), null);
});
