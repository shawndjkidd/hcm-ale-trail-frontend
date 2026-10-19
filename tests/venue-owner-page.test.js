import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { venueTokenFromPath } from '../src/venue/route.js';

test('venue owner page: only /venue/<uuid> opens it', () => {
  const t = '11111111-2222-4333-8444-555555555555';
  assert.equal(venueTokenFromPath(`/venue/${t}`), t);
  assert.equal(venueTokenFromPath(`/venue/${t.toUpperCase()}/`), t);
  for (const p of ['/venue', '/venue/', '/venue/abc', `/venue/${t}/x`, `/admin/venue/${t}`, '/', '', null]) {
    assert.equal(venueTokenFromPath(p), null, String(p));
  }
});

test('venue owner page: read-only, no login, bilingual, no customer details', () => {
  const src = readFileSync(new URL('../src/venue/VenueOwnerPage.jsx', import.meta.url), 'utf8');
  assert.match(src, /fetch\(`\$\{API_BASE\}\/venue\/\$\{encodeURIComponent\(token\)\}`/);
  assert.doesNotMatch(src, /supabase|hcm-admin-token|Authorization|method: 'POST'/i, 'no login, no writes');
  assert.match(src, /noindex, nofollow/);
  for (const vi of ['Hôm qua', 'Tuần này', 'Mũ đã trao tại quán', 'Mũ còn lại tại quán']) assert.ok(src.includes(vi), vi);
  assert.doesNotMatch(src, /email|display_name|participant/i);
  const main = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
  assert.match(main, /venueToken \? <Suspense fallback=\{null\}><VenueOwnerPage token=\{venueToken\} \/><\/Suspense>/);
});
