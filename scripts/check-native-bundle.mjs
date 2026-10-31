// Refuses to ship analytics inside the iOS app.
//
// The App Store listing declares "Data Not Collected", so the bundle copied
// into the native project must not contain PostHog. Runs from
// `npm run native:sync` and from Capacitor's `capacitor:copy:before` hook, so
// even a bare `npx cap sync` or `npx cap copy` after a web build fails here.
import fs from 'fs';
import path from 'path';
import { findAnalyticsMarkers } from '../src/lib/analyticsPolicy.js';

const webDir = path.resolve(process.env.CAPACITOR_WEB_DIR || process.argv[2] || 'dist');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(m?js|html)$/.test(entry.name) ? [full] : [];
  });
}

if (!fs.existsSync(webDir)) {
  console.error(`check-native-bundle: ${webDir} does not exist. Run npm run native:sync.`);
  process.exit(1);
}

const hits = walk(webDir)
  .map((file) => ({ file: path.relative(webDir, file), markers: findAnalyticsMarkers(fs.readFileSync(file, 'utf8')) }))
  .filter((hit) => hit.markers.length > 0);

if (hits.length > 0) {
  console.error('check-native-bundle: this bundle contains PostHog analytics and cannot go into the iOS app.');
  for (const hit of hits) console.error(`  ${hit.file}: ${hit.markers.join(', ')}`);
  console.error('Rebuild it for the app with: npm run native:sync');
  process.exit(1);
}

console.log(`check-native-bundle: no analytics in ${path.relative(process.cwd(), webDir) || webDir}.`);
