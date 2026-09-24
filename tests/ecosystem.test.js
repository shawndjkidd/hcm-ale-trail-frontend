import test from 'node:test';
import assert from 'node:assert/strict';
import * as eco from '../src/v2/ecosystem.js';

// A tiny browser stand-in: location, history, localStorage, sessionStorage
function fakeWindow(href, stored = {}) {
  const u = new URL(href);
  const mk = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m }; };
  const win = {
    location: { pathname: u.pathname, search: u.search, hash: u.hash, href: u.href },
    history: { state: null, replaceState(_s, _t, url) { const n = new URL(url, u.origin); win.location.pathname = n.pathname; win.location.search = n.search; win.location.hash = n.hash; } },
    localStorage: mk(), sessionStorage: mk(stored),
  };
  return win;
}
const AT = 'https://hcm.thealetrail.app';

test('BrewAsia entry: captured, labelled, stripped from the URL', () => {
  const w = fakeWindow(`${AT}/?from=brew-asia-2026&return=${encodeURIComponent('https://brewasia.madesmpl.com/program')}`);
  const ctx = eco.captureEcosystem(w);
  assert.deepEqual(ctx, { source: 'brew-asia-2026', label: 'Brew Asia', returnUrl: 'https://brewasia.madesmpl.com/program', hidden: false });
  assert.equal(w.location.search, '');
  assert.equal(w.location.pathname, '/');
});

test('Made SMPL canonical entry with a deep link and language', () => {
  const ret = 'https://app.madesmpl.com/experience/hcmc-ale-trail';
  const w = fakeWindow(`${AT}/brewery/3f80?from=made-smpl&return=${encodeURIComponent(ret)}&lang=vi&icon=pint`);
  const ctx = eco.captureEcosystem(w);
  assert.equal(ctx.label, 'Made SMPL');
  assert.equal(ctx.returnUrl, ret);
  assert.equal(w.localStorage.getItem('hcm-language'), 'vn');
  assert.equal(w.location.pathname, '/brewery/3f80', 'deep link path kept');
  assert.equal(w.location.search, '?icon=pint', 'unrelated params kept');
});

test('malicious or untrusted return URLs never produce a back link', () => {
  const bad = [
    'javascript:alert(1)', 'data:text/html,<script>x</script>', 'http://app.madesmpl.com/', 'https://evil.example/',
    'https://thealetrail.app/', 'https://www.thealetrail.app/', 'https://saas.thealetrail.app/', 'https://madesmpl.com/',
    'https://app.madesmpl.com.evil.com/', 'https://evil.com/?x=app.madesmpl.com', 'https://app.madesmpl.com@evil.com/',
    'https://user:pw@app.madesmpl.com/', 'https://app.madesmpl.com:8443/', '//app.madesmpl.com/', 'app.madesmpl.com',
    'https://evilapp.madesmpl.com/', 'https://APP.MADESMPL.COM.evil.com/', ' ', 'https://' + 'a'.repeat(3000) + '.com',
  ];
  for (const r of bad) {
    const w = fakeWindow(`${AT}/?from=made-smpl&return=${encodeURIComponent(r)}`);
    assert.equal(eco.captureEcosystem(w), null, r);
    assert.equal(w.location.search, '', 'params still stripped for ' + r);
  }
});

test('host matching is exact but case-insensitive per URL parsing', () => {
  assert.ok(eco.trustedReturnUrl('https://App.MadeSMPL.com/x'));
  assert.equal(eco.trustedReturnUrl('https://app.madesmpl.co/x'), null);
});

test('unknown source ids are not rendered; the label comes from the host', () => {
  const w = fakeWindow(`${AT}/?from=${encodeURIComponent('<img src=x onerror=alert(1)>')}&return=${encodeURIComponent('https://app.madesmpl.com/')}`);
  const ctx = eco.captureEcosystem(w);
  assert.equal(ctx.source, null);
  assert.equal(ctx.label, 'Made SMPL');
});

test('a return to Ale Trail itself is valid but shows no back link', () => {
  const w = fakeWindow(`${AT}/?from=made-smpl&return=${encodeURIComponent(AT + '/map')}`);
  assert.equal(eco.captureEcosystem(w), null);
});

test('context survives the session (Welcome, email sign-in, Google redirect) and later clean loads', () => {
  const w = fakeWindow(`${AT}/?from=brew-asia-2026&return=${encodeURIComponent('https://brewasia.madesmpl.com/')}`);
  eco.captureEcosystem(w);
  // Google OAuth returns to origin+pathname with tokens in the hash, same tab
  const back = fakeWindow(`${AT}/#access_token=abc&refresh_token=def`, Object.fromEntries(w.sessionStorage._m));
  const ctx = eco.captureEcosystem(back);
  assert.equal(ctx?.label, 'Brew Asia');
  assert.equal(back.location.hash, '#access_token=abc&refresh_token=def', 'OAuth hash untouched');
});

test('an invalid new link does not wipe a valid stored context; a valid one replaces it', () => {
  const w = fakeWindow(`${AT}/?from=brew-asia-2026&return=${encodeURIComponent('https://brewasia.madesmpl.com/')}`);
  eco.captureEcosystem(w);
  const w2 = fakeWindow(`${AT}/?return=${encodeURIComponent('https://evil.example')}`, Object.fromEntries(w.sessionStorage._m));
  assert.equal(eco.captureEcosystem(w2).label, 'Brew Asia');
  const w3 = fakeWindow(`${AT}/?from=made-smpl&return=${encodeURIComponent('https://app.madesmpl.com/')}`, Object.fromEntries(w2.sessionStorage._m));
  assert.equal(eco.captureEcosystem(w3).label, 'Made SMPL');
});

test('tampered storage is re-validated', () => {
  const w = fakeWindow(`${AT}/`, { [eco.STORAGE_KEY]: JSON.stringify({ label: 'Evil', returnUrl: 'javascript:alert(1)' }) });
  assert.equal(eco.getEcosystem(w), null);
  const w2 = fakeWindow(`${AT}/`, { [eco.STORAGE_KEY]: JSON.stringify({ label: 'Totally Legit', returnUrl: 'https://app.madesmpl.com/' }) });
  assert.equal(eco.getEcosystem(w2).label, 'Made SMPL', 'label always recomputed from host');
});

test('hide persists for the session', () => {
  const w = fakeWindow(`${AT}/?from=made-smpl&return=${encodeURIComponent('https://app.madesmpl.com/')}`);
  eco.captureEcosystem(w);
  eco.hideEcosystem(w);
  assert.equal(eco.getEcosystem(w).hidden, true);
});

test('language handoff: supported values only', () => {
  for (const [raw, want] of [['en', 'en'], ['vn', 'vn'], ['vi-VN', 'vn'], ['ko', 'kr'], ['kr', 'kr'], ['ja', 'jp'], ['JP', 'jp'], ['fr', null], ['', null], ['<x>', null]]) {
    assert.equal(eco.normaliseLang(raw), want, raw);
  }
  const w = fakeWindow(`${AT}/?lang=fr`);
  w.localStorage.setItem('hcm-language', 'kr');
  eco.captureEcosystem(w);
  assert.equal(w.localStorage.getItem('hcm-language'), 'kr', 'unsupported value leaves the saved choice alone');
  assert.equal(w.location.search, '');
});

test('outbound: from=hcmc-ale-trail plus a return to this page, approved hosts only', () => {
  const out = eco.outboundUrl('https://brewasia.madesmpl.com/program?day=2', `${AT}/brewery/abc?from=made-smpl&return=x#top`);
  const u = new URL(out);
  assert.equal(u.hostname, 'brewasia.madesmpl.com');
  assert.equal(u.searchParams.get('day'), '2');
  assert.equal(u.searchParams.get('from'), 'hcmc-ale-trail');
  assert.equal(u.searchParams.get('return'), `${AT}/brewery/abc`);
  assert.equal(eco.outboundUrl('https://evil.example/', AT), null);
  assert.equal(eco.outboundUrl('https://thealetrail.app/', AT), null);
  assert.equal(eco.outboundUrl(`${AT}/`, AT), null, 'no outbound link to ourselves');
  // From a preview host there is no trusted page to return to, so no return param
  assert.equal(new URL(eco.outboundUrl('https://app.madesmpl.com/', 'https://x.vercel.app/')).searchParams.get('return'), null);
});
