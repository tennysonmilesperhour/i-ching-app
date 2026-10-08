import assert from 'node:assert/strict';
import test from 'node:test';
import { publicPaths, seoForPath, sitemapXml } from './seo.js';

test('public paths cover the homepage, library, and every hexagram', () => {
  const paths = publicPaths();
  assert.equal(paths.length, 66);
  assert.equal(paths[0], '/');
  assert.equal(paths[1], '/library');
  assert.equal(paths.at(-1), '/library/64');
  assert.ok(paths.includes('/library/1'));
});

test('hexagram pages get a unique title, description, and canonical', () => {
  const seo = seoForPath('/library/1');
  assert.match(seo.title, /The Creative/);
  assert.match(seo.description, /creative principle/i);
  assert.equal(seo.canonical, 'https://thefreeiching.com/library/1');
  assert.equal(seo.robots, 'index, follow');
});

test('unknown paths are not indexable', () => {
  const seo = seoForPath('/not-a-real-path');
  assert.equal(seo.robots, 'noindex');
  assert.equal(seo.canonical, null);
  assert.equal(seo.prerender, false);
});

test('sitemap lists every public hexagram url', () => {
  const xml = sitemapXml();
  assert.equal(xml.match(/<loc>/g).length, 66);
  assert.match(xml, /https:\/\/thefreeiching\.com\/library\/64/);
  assert.match(xml, /https:\/\/thefreeiching\.com\/</);
});
