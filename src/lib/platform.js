export function isNativePlatform() {
  if (typeof window === 'undefined') return false;

  if (import.meta.env?.DEV && new URLSearchParams(window.location.search).get('supporter-preview') === '1') {
    return true;
  }

  const capacitor = window.Capacitor;
  if (!capacitor) return false;

  if (typeof capacitor.isNativePlatform === 'function') {
    return capacitor.isNativePlatform();
  }

  return typeof capacitor.getPlatform === 'function' && capacitor.getPlatform() !== 'web';
}
