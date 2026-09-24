import test from 'node:test';
import assert from 'node:assert/strict';
import { isDemoHost } from '../src/v2/demo.js';
import { safeHref, safeImageUrl, photoFor } from '../src/v2/util.js';

test('demo data and stand-in photos: preview and local hosts only', () => {
  for (const h of ['hcm.thealetrail.app', 'thealetrail.app', 'www.thealetrail.app', 'hcm-ale-trail-frontend.vercel.app', 'evil.vercel.app', 'app.madesmpl.com', '']) {
    assert.equal(isDemoHost(h), false, h);
  }
  for (const h of ['localhost', '127.0.0.1', 'hcm-ale-trail-frontend-git-redesign-laidbacklabs.vercel.app', 'hcm-ale-trail-frontend-git-connect-v1-laidbacklabs.vercel.app']) {
    assert.equal(isDemoHost(h), true, h);
  }
});

test('photoFor outside demo mode: venue photo_url or nothing (no stand-ins)', () => {
  // Node has no window, so DEMO_MODE is false here, as on the live domain
  assert.equal(photoFor({ name: 'BiaCraft' }), null);
  assert.equal(photoFor({ name: 'BiaCraft', photo_url: 'https://cdn.example.com/b.jpg' }), 'https://cdn.example.com/b.jpg');
  assert.equal(photoFor({ name: 'BiaCraft', photo_url: 'javascript:alert(1)' }), null);
});

test('M5: admin-typed links/images must be https (images may be our own /paths)', () => {
  for (const bad of ['javascript:alert(1)', ' JAVASCRIPT:alert(1)', 'data:text/html,x', 'http://x.com', 'vbscript:x', 'not a url', '', null, 42]) {
    assert.equal(safeHref(bad), null, String(bad));
  }
  assert.equal(safeHref('https://instagram.com/x'), 'https://instagram.com/x');
  assert.equal(safeImageUrl('/logos/x.png'), '/logos/x.png');
  assert.equal(safeImageUrl('//evil.com/x.png'), null);
  assert.equal(safeImageUrl('data:image/png;base64,xx'), null);
});
