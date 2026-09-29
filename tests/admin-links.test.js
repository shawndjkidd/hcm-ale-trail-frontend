// Pasted links are fixed before saving, so a missing https:// never blocks a venue's save.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/admin/adminApi.js', import.meta.url), 'utf8');
const body = src.slice(src.indexOf('export function fixLink'), src.indexOf('export function fixLinks'));
const fixLink = new Function(`${body.replace('export function fixLink', 'return function fixLink')}`)();

test('admin links: https added, http upgraded, blanks and https kept', () => {
  assert.equal(fixLink('instagram.com/7bridges'), 'https://instagram.com/7bridges');
  assert.equal(fixLink('www.facebook.com/bar'), 'https://www.facebook.com/bar');
  assert.equal(fixLink('http://maps.app.goo.gl/x'), 'https://maps.app.goo.gl/x');
  assert.equal(fixLink('https://ok.com/a'), 'https://ok.com/a');
  assert.equal(fixLink('  '), '');
  assert.equal(fixLink('mailto:a@b.c'), 'mailto:a@b.c', 'other schemes left for the server to judge');
});

test('admin links: every venue/HQ save with links goes through fixLinks', () => {
  for (const fn of ['createTrailEvent', 'createBreweryEvent', 'updateEvent', 'createBrewery', 'updateBrewery', 'createSideQuest', 'updateSideQuest', 'addBreweryLocation', 'updateBreweryLocation']) {
    const start = src.indexOf(`export async function ${fn}(`);
    const chunk = src.slice(start, src.indexOf('\n}', start));
    assert.match(chunk, /fixLinks\(/, fn);
  }
});
