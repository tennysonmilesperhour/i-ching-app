import { isNativePlatform } from '@/lib/platform'
import { shouldEnableAnalytics } from '@/lib/analyticsPolicy'

// Vite replaces this with a constant, so in the native build the rest of
// initAnalytics is dead code and posthog-js is never bundled (vite.config.js
// also aliases it to an empty stub there).
const NATIVE_BUILD = import.meta.env.VITE_NATIVE_BUILD === '1'

export async function initAnalytics() {
  if (NATIVE_BUILD) return null

  const token = import.meta.env.VITE_POSTHOG_KEY?.trim()
  if (!shouldEnableAnalytics({ token, nativeBuild: NATIVE_BUILD, nativeRuntime: isNativePlatform() })) {
    return null
  }

  const { default: posthog } = await import('posthog-js')
  if (!posthog?.init) return null

  posthog.init(token, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    defaults: '2026-05-30',
    person_profiles: 'identified_only',
    disable_session_recording: true,
    // Autocapture would otherwise record the text of whatever is clicked, and
    // a Journal entry is a link that shows the question. Questions, readings
    // and journal text must never reach PostHog, so element text is masked.
    mask_all_text: true,
    capture_exceptions: true,
    before_send: (event) => {
      if (!event) return null
      event.properties = { ...event.properties, app: 'i-ching-app' }
      return event
    },
  })
  return posthog
}
