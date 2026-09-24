import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/admin/BreweryDashboard.jsx', import.meta.url), 'utf8');

test('venue dashboard: Photo URL field saves photo_url (https only; blank clears)', () => {
  assert.match(src, /<label[^>]*htmlFor="venue-photo-url"[^>]*>Photo URL<\/label>/);
  assert.match(src, /updateBrewery\(breweryId, \{ photo_url: value \|\| null \}\)/);
  assert.match(src, /!\/\^https:\\\/\\\/\/i\.test\(value\)/);
  assert.match(src, /setPhotoUrl\(dashResult\.brewery\?\.photoUrl/);
});

test('venue dashboard: management tabs and settings are hidden from plain staff (API enforces it too)', () => {
  assert.match(src, /const canManage = staffRole !== 'staff';/);
  for (const tab of ["'events'", "'beers'", "'stock'"]) {
    assert.match(src, new RegExp(`\\{canManage && <button className=\\{\`admin-tab \\$\\{activeTab === ${tab}`), tab);
  }
  assert.match(src, /\{canManage \? \(<div>/, 'left settings column (status, links, hours)');
  assert.match(src, /\{staffRole !== 'staff' && \(\s*<div className="admin-card">\s*<h3 className="admin-card-title">Check-in PIN Code/, 'PIN card');
});
