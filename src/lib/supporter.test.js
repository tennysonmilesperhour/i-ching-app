import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSupporterBackground } from './supporter.js';

test('normalizes supporter background choices', () => {
  assert.equal(normalizeSupporterBackground('water'), 'water');
  assert.equal(normalizeSupporterBackground('parchment'), 'parchment');
  assert.equal(normalizeSupporterBackground('unknown'), 'parchment');
  assert.equal(normalizeSupporterBackground(null), 'parchment');
});
