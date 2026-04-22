/**
 * Google AdSense script loader.
 *
 * Reads the publisher client ID from VITE_GOOGLE_ADS_CLIENT_ID (e.g. "ca-pub-XXXXXXXXXXXXXXXX").
 * The script is injected at most once per page. When the env var is not set,
 * loadAdSense() is a no-op so the app still runs cleanly in dev/previews.
 *
 * Usage: AdSlot calls loadAdSense() on mount; you generally do not need to
 * call it directly.
 */
let injected = false;
let loadPromise = null;

export function getAdsenseClient() {
  return import.meta.env.VITE_GOOGLE_ADS_CLIENT_ID || null;
}

export function isAdsenseEnabled() {
  return Boolean(getAdsenseClient());
}

export function loadAdSense() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  const client = getAdsenseClient();
  if (!client) return Promise.resolve(false);
  if (loadPromise) return loadPromise;
  if (injected) return Promise.resolve(true);
  injected = true;

  loadPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    script.onload = () => resolve(true);
    script.onerror = () => {
      injected = false;
      loadPromise = null;
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
