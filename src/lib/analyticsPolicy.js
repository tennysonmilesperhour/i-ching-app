// Decides whether product analytics (PostHog) may run. Kept free of browser
// and Vite globals so it can be unit tested with node --test.
//
// Analytics are web only. The iPhone and iPad app is declared to Apple as
// "Data Not Collected" (APP_STORE_SUBMISSION.md), so analytics must never run
// there. Two independent guards enforce that:
//   1. nativeBuild: the bundle was built with VITE_NATIVE_BUILD=1 (npm run
//      native:sync). vite.config.js also swaps posthog-js for an empty stub in
//      that build, and scripts/check-native-bundle.mjs refuses to copy a
//      bundle that still contains PostHog into the iOS project.
//   2. nativeRuntime: Capacitor reports a native platform at runtime, which
//      catches a web bundle that was copied into the app by mistake.

export function shouldEnableAnalytics({ token, nativeBuild, nativeRuntime }) {
  if (nativeBuild) return false;
  if (nativeRuntime) return false;
  return typeof token === 'string' && token.trim().length > 0;
}

// Text that only appears in a bundle when PostHog is compiled in.
export const POSTHOG_BUNDLE_MARKERS = ['i.posthog.com', '__posthog', 'posthog-js', 'phc_'];

export function findAnalyticsMarkers(source) {
  return POSTHOG_BUNDLE_MARKERS.filter((marker) => source.includes(marker));
}
