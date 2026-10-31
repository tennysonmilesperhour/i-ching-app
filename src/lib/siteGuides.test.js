import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { HEXAGRAM_CHINESE, HEXAGRAM_PINYIN } from './hexagramData.js';
import { buildDataFiles, buildLlmsFiles } from './agentData.js';
import { handlePost } from './mcpServer.js';
import { renderHead, seoForPath, publicPaths } from './seo.js';
import {
  ALL_HEXAGRAMS, ALL_TRIGRAMS, CHANGELOG, CONTENT_UPDATED, faqItems, findHexagram, getPage, relationshipStats, renderBodyHtml,
} from './siteContent.js';

const DASH = /[–—]/;

test('every hexagram has pinyin with one syllable per character', () => {
  for (let n = 1; n <= 64; n += 1) {
    const syllables = HEXAGRAM_PINYIN[n].split(' ');
    assert.equal(syllables.length, [...HEXAGRAM_CHINESE[n]].length, `hexagram ${n}`);
    assert.match(HEXAGRAM_PINYIN[n], /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü ]+$/, `hexagram ${n}`);
  }
});

test('a character is romanised the same way wherever it appears (accuracy audit)', () => {
  const seen = new Map();
  const record = (chars, pinyin, where) => {
    [...chars].forEach((ch, i) => {
      const py = pinyin.split(' ')[i];
      if (seen.has(ch)) assert.equal(py, seen.get(ch).py, `${ch} is ${py} in ${where} but ${seen.get(ch).py} in ${seen.get(ch).where}`);
      else seen.set(ch, { py, where });
    });
  };
  for (let n = 1; n <= 64; n += 1) record(HEXAGRAM_CHINESE[n], HEXAGRAM_PINYIN[n], `hexagram ${n}`);
  for (const t of ALL_TRIGRAMS) record(t.chinese, t.pinyin, `trigram ${t.name}`);
  // Spot checks of the readings that differ from everyday Mandarin.
  assert.equal(HEXAGRAM_PINYIN[3], 'zhūn');
  assert.equal(HEXAGRAM_PINYIN[12], 'pǐ');
  assert.equal(HEXAGRAM_PINYIN[22], 'bì');
  assert.equal(HEXAGRAM_PINYIN[40], 'xiè');
  assert.equal(HEXAGRAM_PINYIN[26], 'dà chù');
});

test('trigram names are their pinyin without tone marks', () => {
  for (const t of ALL_TRIGRAMS) {
    assert.equal(t.pinyin.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), t.name.toLowerCase());
  }
});

test('pinyin reaches the data files, llms files and MCP', () => {
  const data = buildDataFiles();
  assert.equal(data['hexagrams.json'].hexagrams[23].pinyin, 'fù');
  assert.match(data['hexagrams.csv'].split('\n')[0], /^number,name,chinese,pinyin,/);
  assert.equal(data['trigrams.json'].trigrams.find((t) => t.name === 'Qian').pinyin, 'qián');
  assert.match(buildLlmsFiles()['llms/hexagrams.txt'], /24\. Return 復 \(fù\)/);
  const res = handlePost(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_hexagram', arguments: { query: 'xiao chu' } } }));
  assert.match(res.body.result.content[0].text, /Small Taming/);
});

test('findHexagram matches pinyin and lists every hexagram sharing it', () => {
  assert.equal(findHexagram('fu').match.number, 24);
  assert.equal(findHexagram('Dà Guò').match.number, 28);
  assert.equal(findHexagram('jiji').match.number, 63);
  assert.deepEqual(findHexagram('lu').candidates.map((h) => h.number), [10, 56]);
  assert.deepEqual(findHexagram('kun').candidates.map((h) => h.number), [2, 47]);
  assert.equal(findHexagram('Return').match.number, 24);
});

test('related hexagram facts on the explainer match the King Wen structure', () => {
  const s = relationshipStats();
  assert.deepEqual(s.selfInverse, [1, 2, 27, 28, 29, 30, 61, 62]);
  assert.deepEqual(s.nuclearSet, [1, 2, 23, 24, 27, 28, 37, 38, 39, 40, 43, 44, 53, 54, 63, 64]);
  assert.deepEqual(s.ends, { 1: 16, 2: 16, cycle_63_64: 32 });
  assert.equal(s.inversePairs.length, 28);
  assert.deepEqual(s.oppositeOnlyPairs, [[1, 2], [27, 28], [29, 30], [61, 62]]);
  assert.deepEqual(s.bothPairs, [[11, 12], [17, 18], [53, 54], [63, 64]]);
  const html = renderBodyHtml(getPage('/related-hexagrams'));
  assert.match(html, /Only 16 of the 64/);
  assert.match(html, /In 28 pairs/);
  assert.ok(getPage('/library/3').blocks.some((b) => b.t === 'p' && b.text.includes('/related-hexagrams')));
});

test('FAQ page and its FAQPage markup carry the same questions as llms/faq.txt', () => {
  const page = getPage('/faq');
  const ld = page.jsonld.find((j) => j['@type'] === 'FAQPage');
  const items = faqItems();
  assert.equal(ld.mainEntity.length, items.length);
  const faqTxt = buildLlmsFiles()['llms/faq.txt'];
  for (const [i, { q, a }] of items.entries()) {
    assert.equal(ld.mainEntity[i].name, q);
    assert.equal(ld.mainEntity[i]['@type'], 'Question');
    assert.ok(!/\]\(/.test(ld.mainEntity[i].acceptedAnswer.text), 'answers in markup are plain text');
    assert.ok(faqTxt.includes(`## ${q}`), q);
    assert.ok(!DASH.test(q + a), q);
  }
  assert.match(faqTxt, /privacy page \(https:\/\/thefreeiching\.com\/privacy\)/);
  assert.match(items.find((i) => i.q.startsWith('Does the I Ching predict')).a, /^No\./);
});

test('changelog is newest first, dated, and current with CONTENT_UPDATED', () => {
  const dates = CHANGELOG.map((e) => e.date);
  assert.deepEqual([...dates].sort().reverse(), dates);
  assert.equal(dates[0], CONTENT_UPDATED);
  for (const e of CHANGELOG) assert.match(e.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(renderBodyHtml(getPage('/changelog')), /October 31, 2026/);
});

test('new guide pages are public, prerendered and in the sitemap', () => {
  for (const path of ['/faq', '/changelog', '/related-hexagrams']) {
    assert.ok(publicPaths().includes(path), path);
    assert.equal(seoForPath(path).robots, 'index, follow', path);
    assert.equal(seoForPath(path).canonical, `https://thefreeiching.com${path}`);
  }
  assert.match(buildLlmsFiles()['llms.txt'], /related-hexagrams/);
});

test('each hexagram page has its own share image, and the file exists', () => {
  for (let n = 1; n <= 64; n += 1) {
    const seo = seoForPath(`/library/${n}`);
    assert.equal(seo.image, `https://thefreeiching.com/share/hexagram-${n}.png`);
    const file = new URL(`../../public/share/hexagram-${n}.png`, import.meta.url);
    const head = fs.readFileSync(file).subarray(0, 24);
    assert.equal(head.subarray(1, 4).toString(), 'PNG', `hexagram ${n}`);
    assert.equal(head.readUInt32BE(16), 1200);
    assert.equal(head.readUInt32BE(20), 630);
    assert.equal(getPage(`/library/${n}`).jsonld[0].image, seo.image);
  }
  assert.match(renderHead(seoForPath('/library/24')), /og:image" content="https:\/\/thefreeiching\.com\/share\/hexagram-24\.png"/);
  assert.match(renderHead(seoForPath('/')), /og:image" content="https:\/\/thefreeiching\.com\/og-image\.png"/);
});

test('every hexagram record has the derived fields the pages use', () => {
  assert.equal(ALL_HEXAGRAMS.length, 64);
  for (const h of ALL_HEXAGRAMS) assert.ok(h.pinyin && h.chinese && h.url, h.number);
});
