import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The iOS app is built with VITE_NATIVE_BUILD=1 (npm run native:sync). It is
// declared to Apple as collecting no data, so that build swaps the analytics
// library for an empty stub and never reads a PostHog key.
const nativeBuild = process.env.VITE_NATIVE_BUILD === '1'

const nativeAliases = nativeBuild
  ? { 'posthog-js': path.resolve(import.meta.dirname, './src/lib/posthogNativeStub.js') }
  : {}

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      ...nativeAliases,
    },
  },
  define: nativeBuild
    ? {
        'import.meta.env.VITE_POSTHOG_KEY': JSON.stringify(''),
        'import.meta.env.VITE_POSTHOG_HOST': JSON.stringify(''),
      }
    : {},
  plugins: [
    react(),
  ]
});
