import { registerPlugin } from '@capacitor/core';

export const SUPPORTER_PRODUCT_ID = 'com.thefreeiching.app.supporter';
export const SUPPORTER_BACKGROUND_KEY = 'iching_supporter_background';
export const SUPPORTER_BACKGROUNDS = ['parchment', 'water'];

export function isSupporterPreview() {
  return Boolean(
    import.meta.env?.DEV
    && typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('supporter-preview') === '1'
  );
}

const SupporterNative = registerPlugin('Supporter');

export function normalizeSupporterBackground(value) {
  return SUPPORTER_BACKGROUNDS.includes(value) ? value : 'parchment';
}

export function readSupporterBackground() {
  try {
    return normalizeSupporterBackground(localStorage.getItem(SUPPORTER_BACKGROUND_KEY));
  } catch {
    return 'parchment';
  }
}

export function saveSupporterBackground(value) {
  const normalized = normalizeSupporterBackground(value);
  try {
    localStorage.setItem(SUPPORTER_BACKGROUND_KEY, normalized);
  } catch {
    // Theme selection is optional; blocked storage should not affect the app.
  }
  return normalized;
}

export const supporterStore = {
  getStatus: () => SupporterNative.getStatus(),
  purchase: () => SupporterNative.purchase(),
  restorePurchases: () => SupporterNative.restorePurchases(),
  setGildedIcon: (gilded) => SupporterNative.setIcon({ gilded }),
};
