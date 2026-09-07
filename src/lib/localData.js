export const APP_LOCAL_STORAGE_KEYS = Object.freeze([
  'iching_readings',
  'iching_session',
  'iching_users',
  'iching_support_prompt_hidden_until',
  'iching_supporter_background',
]);

export function eraseLocalAppData(storage = window.localStorage) {
  APP_LOCAL_STORAGE_KEYS.forEach((key) => storage.removeItem(key));
}
