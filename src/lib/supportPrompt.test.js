import test from 'node:test';
import assert from 'node:assert/strict';
import {
  futureTimestamp,
  shouldShowSupportPrompt,
  SUPPORT_SNOOZE_DAYS,
} from './supportPrompt.js';

test('shows a configured web prompt when no snooze is active', () => {
  assert.equal(shouldShowSupportPrompt({
    checkoutUrl: 'https://donate.stripe.com/test',
    hiddenUntil: null,
    nativePlatform: false,
    now: 100,
  }), true);
});

test('never shows the Stripe prompt in a native app', () => {
  assert.equal(shouldShowSupportPrompt({
    checkoutUrl: 'https://donate.stripe.com/test',
    hiddenUntil: null,
    nativePlatform: true,
    now: 100,
  }), false);
});

test('respects a future snooze and shows again after it expires', () => {
  const now = 1_000;
  const hiddenUntil = futureTimestamp(SUPPORT_SNOOZE_DAYS, now);

  assert.equal(shouldShowSupportPrompt({
    checkoutUrl: 'https://donate.stripe.com/test',
    hiddenUntil,
    nativePlatform: false,
    now,
  }), false);
  assert.equal(shouldShowSupportPrompt({
    checkoutUrl: 'https://donate.stripe.com/test',
    hiddenUntil,
    nativePlatform: false,
    now: hiddenUntil + 1,
  }), true);
});
