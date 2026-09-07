export const SUPPORT_PROMPT_KEY = 'iching_support_prompt_hidden_until';
export const SUPPORT_SNOOZE_DAYS = 90;
export const SUPPORT_THANK_YOU_DAYS = 365;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function futureTimestamp(days, now = Date.now()) {
  return now + (days * DAY_IN_MS);
}

export function shouldShowSupportPrompt({ checkoutUrl, hiddenUntil, nativePlatform, now = Date.now() }) {
  if (!checkoutUrl || nativePlatform) return false;

  const parsedHiddenUntil = Number(hiddenUntil);
  return !Number.isFinite(parsedHiddenUntil) || parsedHiddenUntil <= now;
}
