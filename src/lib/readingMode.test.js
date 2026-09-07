import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeReadingMode } from './readingMode.js';

test('normalizes current reading roles', () => {
  assert.equal(normalizeReadingMode('inquirer'), 'inquirer');
  assert.equal(normalizeReadingMode('adept'), 'adept');
});

test('preserves legacy reading choices', () => {
  assert.equal(normalizeReadingMode('seeker'), 'inquirer');
  assert.equal(normalizeReadingMode('guided'), 'inquirer');
  assert.equal(normalizeReadingMode('deep'), 'adept');
  assert.equal(normalizeReadingMode(undefined), 'inquirer');
});
