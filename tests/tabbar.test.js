import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleBottomShift } from '../src/v2/util.js';

const win = (innerHeight, vv) => ({ innerHeight, visualViewport: vv });

test('no shift when the browser places the bar correctly', () => {
  assert.equal(visibleBottomShift(win(800, { offsetTop: 0, height: 800, scale: 1 })), 0);
  assert.equal(visibleBottomShift(win(800, { offsetTop: 0, height: 800.6, scale: 1 })), 0, 'sub-pixel noise ignored');
});

test('bar pushed down to the visible bottom when the layout viewport is short (Brave toolbar collapse)', () => {
  assert.equal(visibleBottomShift(win(560, { offsetTop: 0, height: 830, scale: 1 })), 270);
});

test('pinch zoom and missing visualViewport are left alone', () => {
  assert.equal(visibleBottomShift(win(560, { offsetTop: 40, height: 400, scale: 2 })), 0);
  assert.equal(visibleBottomShift({ innerHeight: 800 }), 0);
  assert.equal(visibleBottomShift(undefined), 0);
});
