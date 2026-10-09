// Every phrase the venue dashboard sends through t() has a Vietnamese translation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dict = readFileSync(new URL('../src/admin/i18n.js', import.meta.url), 'utf8');
const keys = new Set();
for (const m of dict.matchAll(/'((?:[^'\\]|\\.)+)'\s*:/g)) keys.add(m[1].replace(/\\'/g, "'"));
for (const m of dict.matchAll(/"([^"]+)"\s*:/g)) keys.add(m[1]);

for (const file of ['BreweryDashboard.jsx', 'VenueChecklist.jsx', 'VenueDemoCard.jsx', 'checklist.js', 'PromoteTab.jsx', 'AdminUpdateBar.jsx']) {
  test(`admin i18n: every t() phrase in ${file} has Vietnamese`, () => {
    const src = readFileSync(new URL(`../src/admin/${file}`, import.meta.url), 'utf8');
    const used = new Set();
    for (const m of src.matchAll(/\bt\('((?:[^'\\]|\\.)+)'/g)) used.add(m[1].replace(/\\'/g, "'"));
    for (const m of src.matchAll(/\bt\("([^"]+)"/g)) used.add(m[1]);
    for (const m of src.matchAll(/\bt\(\w+ === 1 \? '((?:[^'\\]|\\.)+)' : '((?:[^'\\]|\\.)+)'/g)) { used.add(m[1]); used.add(m[2]); }
    const missing = [...used].filter((k) => !keys.has(k));
    assert.deepEqual(missing, [], `untranslated: ${missing.join(' | ')}`);
  });
}
