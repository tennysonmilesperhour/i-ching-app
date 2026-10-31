import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findAnalyticsMarkers, shouldEnableAnalytics } from './analyticsPolicy.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('analytics run on the web only when a key is set', () => {
  assert.equal(shouldEnableAnalytics({ token: 'phc_abc', nativeBuild: false, nativeRuntime: false }), true);
  assert.equal(shouldEnableAnalytics({ token: '', nativeBuild: false, nativeRuntime: false }), false);
  assert.equal(shouldEnableAnalytics({ token: '   ', nativeBuild: false, nativeRuntime: false }), false);
  assert.equal(shouldEnableAnalytics({ token: undefined, nativeBuild: false, nativeRuntime: false }), false);
});

test('analytics never run in the native app, even with a key', () => {
  assert.equal(shouldEnableAnalytics({ token: 'phc_abc', nativeBuild: true, nativeRuntime: false }), false);
  assert.equal(shouldEnableAnalytics({ token: 'phc_abc', nativeBuild: false, nativeRuntime: true }), false);
  assert.equal(shouldEnableAnalytics({ token: 'phc_abc', nativeBuild: true, nativeRuntime: true }), false);
});

test('the native scripts build without analytics and check the bundle before Capacitor copies it', () => {
  const { scripts } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.match(scripts['native:build'], /VITE_NATIVE_BUILD=1/);
  assert.match(scripts['native:build'], /check-native-bundle\.mjs/);
  assert.match(scripts['native:sync'], /native:build/);
  assert.match(scripts['capacitor:copy:before'], /check-native-bundle\.mjs/);
});

test('the PostHog loader is gated on the native build flag and the runtime check', () => {
  const source = fs.readFileSync(path.join(root, 'src/lib/posthog.js'), 'utf8');
  assert.match(source, /VITE_NATIVE_BUILD/);
  assert.match(source, /isNativePlatform\(\)/);
  assert.match(source, /shouldEnableAnalytics/);
  assert.doesNotMatch(source, /^import posthog/m, 'posthog-js must load lazily, never as a static import');
});

test('web analytics never record the text people click, such as a question in the Journal list', () => {
  // A Journal entry is a link showing the question. Without masking, PostHog
  // autocapture sends that text as $el_text (checked in a browser on 2026-10-31).
  const source = fs.readFileSync(path.join(root, 'src/lib/posthog.js'), 'utf8');
  assert.match(source, /mask_all_text:\s*true/);
  assert.match(source, /disable_session_recording:\s*true/);
});

test('a native build contains no PostHog code even when a key is in the environment', { timeout: 120000 }, () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'native-bundle-'));
  try {
    execFileSync(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', outDir, '--emptyOutDir'], {
      cwd: root,
      env: { ...process.env, VITE_NATIVE_BUILD: '1', VITE_POSTHOG_KEY: 'phc_should_not_ship' },
      stdio: 'pipe',
    });
    const assetsDir = path.join(outDir, 'assets');
    const js = fs.readdirSync(assetsDir).filter((name) => name.endsWith('.js'));
    assert.ok(js.length > 0, 'the build produced JavaScript');
    for (const name of js) {
      const source = fs.readFileSync(path.join(assetsDir, name), 'utf8');
      assert.deepEqual(findAnalyticsMarkers(source), [], `${name} contains PostHog`);
      assert.ok(!source.includes('phc_should_not_ship'), `${name} contains the PostHog key`);
    }
    execFileSync(process.execPath, [path.join(root, 'scripts/check-native-bundle.mjs'), outDir], { cwd: root, stdio: 'pipe' });
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});

test('the bundle check recognises PostHog code', () => {
  assert.deepEqual(findAnalyticsMarkers('fetch("https://us.i.posthog.com/e")'), ['i.posthog.com']);
  assert.deepEqual(findAnalyticsMarkers('<a href="https://posthog.com/privacy">PostHog privacy policy</a>'), []);
});
