import test from 'node:test';
import assert from 'node:assert/strict';
import { countStripeSupporters, goalProgress, parseSupporterCount, SUPPORTER_GOAL } from './supporterGoal.js';

test('goal is 20 yearly supporters', () => {
  assert.equal(SUPPORTER_GOAL, 20);
});

test('progress is a clamped percentage', () => {
  assert.equal(goalProgress(null), 0);
  assert.equal(goalProgress(5), 25);
  assert.equal(goalProgress(40), 100);
});

test('parses only non-negative whole counts', () => {
  assert.equal(parseSupporterCount('7'), 7);
  assert.equal(parseSupporterCount(''), 0);
  assert.equal(parseSupporterCount('-1'), null);
  assert.equal(parseSupporterCount('abc'), null);
  assert.equal(parseSupporterCount(undefined), null);
});

test('counts active subscriptions across pages', async () => {
  const urls = [];
  const pages = [
    { data: [{ id: 'sub_1' }, { id: 'sub_2' }], has_more: true },
    { data: [{ id: 'sub_3' }], has_more: false },
  ];
  const fetchImpl = async (url) => {
    urls.push(url);
    return { ok: true, json: async () => pages.shift() };
  };
  const count = await countStripeSupporters({ secretKey: 'rk_test', priceId: 'price_1', fetchImpl });
  assert.equal(count, 3);
  assert.match(urls[0], /status=active/);
  assert.match(urls[0], /price=price_1/);
  assert.match(urls[1], /starting_after=sub_2/);
});

test('throws when Stripe errors', async () => {
  const fetchImpl = async () => ({ ok: false, status: 401 });
  await assert.rejects(countStripeSupporters({ secretKey: 'bad', fetchImpl }));
});
