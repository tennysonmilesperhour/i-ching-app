import assert from 'node:assert/strict';
import test from 'node:test';
import { getLinesForHexagram, hexagramFromLines, yarrowLineFromIndex } from './hexagramData.js';

const TRIGRAM_LINES = [
  [8, 8, 8],
  [7, 8, 8],
  [8, 7, 8],
  [7, 7, 8],
  [8, 8, 7],
  [7, 8, 7],
  [8, 7, 7],
  [7, 7, 7],
];

test('maps known upper and lower trigram structures to the King Wen sequence', () => {
  assert.equal(hexagramFromLines([7, 7, 7, 7, 7, 7]), 1);
  assert.equal(hexagramFromLines([8, 8, 8, 8, 8, 8]), 2);
  assert.equal(hexagramFromLines([7, 8, 8, 8, 7, 8]), 3);
  assert.equal(hexagramFromLines([8, 7, 8, 7, 8, 8]), 40);
});

test('maps all 64 trigram combinations to 64 unique hexagrams', () => {
  const numbers = [];
  for (const lower of TRIGRAM_LINES) {
    for (const upper of TRIGRAM_LINES) {
      numbers.push(hexagramFromLines([...lower, ...upper]));
    }
  }
  assert.deepEqual([...new Set(numbers)].sort((a, b) => a - b), Array.from({ length: 64 }, (_, i) => i + 1));
});

test('reconstructs all 64 hexagrams from their King Wen numbers', () => {
  for (let number = 1; number <= 64; number += 1) {
    const lines = getLinesForHexagram(number);
    assert.equal(lines.length, 6);
    assert.equal(hexagramFromLines(lines), number);
  }
});

test('uses traditional yarrow line weighting across sixteen equal outcomes', () => {
  const outcomes = Array.from({ length: 16 }, (_, index) => yarrowLineFromIndex(index));
  assert.equal(outcomes.filter((value) => value === 6).length, 1);
  assert.equal(outcomes.filter((value) => value === 7).length, 5);
  assert.equal(outcomes.filter((value) => value === 8).length, 7);
  assert.equal(outcomes.filter((value) => value === 9).length, 3);
});
