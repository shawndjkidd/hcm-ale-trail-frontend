import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/admin/BreweryDashboard.jsx', import.meta.url), 'utf8');

test('venue dashboard: Photo URL field saves photo_url (https only; blank clears)', () => {
  assert.match(src, /<label[^>]*htmlFor="venue-photo-url"[^>]*>(?:Photo URL|\{t\('Photo URL'\)\})<\/label>/);
  assert.match(src, /updateBrewery\(breweryId, \{ photo_url: value \|\| null \}\)/);
  assert.match(src, /const value = fixLink\(photoUrl\.trim\(\)\)/, 'pasted links get https:// added instead of being refused');
  assert.match(src, /setPhotoUrl\(dashResult\.brewery\?\.photoUrl/);
});

test('venue dashboard: management tabs and settings are hidden from plain staff (API enforces it too)', () => {
  assert.match(src, /const canManage = staffRole !== 'staff';/);
  for (const tab of ["'events'", "'beers'"]) {
    assert.match(src, new RegExp(`\\{canManage && <button className=\\{\`admin-tab \\$\\{activeTab === ${tab}`), tab);
  }
  // Staff can see hat stock (they hand the hats out) but only owners/managers get Restock.
  assert.match(src, /<button className=\{`admin-tab \$\{activeTab === 'stock'/, 'stock tab visible to everyone');
  assert.match(src, /\{canManage && \(<button[\s\S]{0,200}?setShowBrewRestockModal\(true\)/, 'restock button is owner/manager only');
  assert.match(src, /\{canManage \? \(<div>/, 'left settings column (status, links, hours)');
  assert.match(src, /\{staffRole !== 'staff' && \(\s*<div className="admin-card">\s*<h3 className="admin-card-title">(?:Check-in PIN Code|\{t\('Check-in PIN Code'\)\})/, 'PIN card');
});

test('venue dashboard: the Merge Ratings card (beer data) is owner/manager/admin only', () => {
  assert.match(src, /if \(!canManage \|\| activeMenuNames\.size === 0 \|\| unmatched\.length === 0\) return null;/);
});
