import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { passkeysEnabled } from '../src/v2/features.js';

test('G3: passkeys are OFF unless VITE_PASSKEYS_ENABLED is exactly "true"', () => {
  assert.equal(passkeysEnabled({}), false, 'absent');
  assert.equal(passkeysEnabled(undefined), false);
  for (const v of ['', 'false', '0', '1', 'yes', 'on', 'TRUEISH']) assert.equal(passkeysEnabled({ VITE_PASSKEYS_ENABLED: v }), false, v);
  assert.equal(passkeysEnabled({ VITE_PASSKEYS_ENABLED: 'true' }), true);
  assert.equal(passkeysEnabled({ VITE_PASSKEYS_ENABLED: ' TRUE ' }), true);
  assert.equal(passkeysEnabled(), false, 'this test run has no flag set');
});

test('G3: every passkey control is gated by the flag before any WebAuthn check', () => {
  const pk = readFileSync(new URL('../src/v2/passkey.js', import.meta.url), 'utf8');
  assert.match(pk, /passkeySupported = \(\) =>\s*passkeysEnabled\(\) &&/, 'flag checked first');
  const signIn = readFileSync(new URL('../src/v2/SignIn.jsx', import.meta.url), 'utf8');
  assert.match(signIn, /mode === 'login' && passkeySupported\(\) &&/);
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.match(app, /passkey=\{passkeySupported\(\) \?/, 'Profile only receives passkey props when enabled');
  const profile = readFileSync(new URL('../src/v2/Profile.jsx', import.meta.url), 'utf8');
  assert.match(profile, /passkey\?\.supported &&/);
});
