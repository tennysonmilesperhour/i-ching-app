import assert from 'node:assert/strict';
import test from 'node:test';
import classicalLines from '../data/classicalLines.json' with { type: 'json' };
import { classifyAgent } from './agentBots.js';
import { sanitizeText, sanitizeTraffic } from './exportSanitize.js';
import { seoForPath } from './seo.js';
import { buildCatalog, buildDataFiles, buildLlmsFiles } from './agentData.js';
import { handlePost } from './mcpServer.js';
import {
  ALL_HEXAGRAMS, allPages, castStatistics, describeCast, findHexagram, getPage, hexagramFromTrigrams, renderBodyHtml, renderMarkdown,
} from './siteContent.js';
import { getLinesForHexagram } from './hexagramData.js';
import { buildVercelConfig } from '../../scripts/gen-vercel-config.mjs';
import fs from 'node:fs';

const DASH = /[–—]/;

test('derived relationships match known classical pairs', () => {
  const h3 = ALL_HEXAGRAMS[2];
  assert.equal(h3.nuclear_hexagram, 23);
  assert.equal(h3.inverse_hexagram, 4);
  assert.equal(h3.opposite_hexagram, 50);
  assert.equal(ALL_HEXAGRAMS[62].nuclear_hexagram, 64);
  assert.equal(ALL_HEXAGRAMS[63].nuclear_hexagram, 63);
  assert.equal(ALL_HEXAGRAMS[0].opposite_hexagram, 2);
});

test('every line text opens with the right yin or yang line name (accuracy audit)', () => {
  const places = ['at the beginning', 'in the second place', 'in the third place', 'in the fourth place', 'in the fifth place', 'at the top'];
  for (let n = 1; n <= 64; n += 1) {
    const lines = getLinesForHexagram(n);
    assert.equal(classicalLines[String(n)].length, 6, `hexagram ${n} has six line texts`);
    classicalLines[String(n)].forEach((text, i) => {
      const word = lines[i] === 7 ? 'nine' : 'six';
      assert.ok(text.toLowerCase().startsWith(`a ${word} ${places[i]}`), `hexagram ${n} line ${i + 1}: ${text.split('\n')[0]}`);
    });
  }
});

test('trigram lookup round-trips to the same hexagram', () => {
  for (const h of ALL_HEXAGRAMS) {
    assert.equal(hexagramFromTrigrams(h.upper_trigram.name, h.lower_trigram.name).number, h.number);
  }
  assert.equal(findHexagram('the creative').match.number, 1);
  assert.equal(findHexagram('復').match.number, 24);
  assert.equal(findHexagram('65').match, null);
});

test('cast statistics are exact probability distributions', () => {
  const { yarrow, coin } = castStatistics().methods;
  for (const m of [yarrow, coin]) {
    assert.ok(Math.abs(m.probability_of_k_changing_lines.reduce((a, b) => a + b) - 1) < 1e-12);
    assert.ok(Math.abs(m.relating_hexagram_probability.reduce((a, b) => a + b) + m.probability_no_changing_lines - 1) < 1e-12);
    assert.ok(m.primary_hexagram_probability.every((p) => Math.abs(p - 1 / 64) < 1e-12));
    assert.equal(m.probability_line_is_changing, 0.25);
  }
});

test('describeCast finds changing lines and the relating hexagram', () => {
  const cast = describeCast([9, 7, 7, 7, 7, 7], 'coin');
  assert.equal(cast.primary_hexagram.number, 1);
  assert.deepEqual(cast.changing_lines, [1]);
  assert.equal(cast.relating_hexagram.number, 44);
  assert.equal(describeCast([7, 7, 7, 7, 7, 7], 'coin').relating_hexagram, null);
});

test('pages, markdown twins and data stay consistent and dash free', () => {
  const pages = allPages();
  assert.equal(pages.length, 79);
  for (const p of pages) {
    assert.ok(p.title && p.description && p.jsonld.length, p.path);
    assert.ok(!DASH.test(renderBodyHtml(p)), `dash in html ${p.path}`);
    assert.ok(!DASH.test(renderMarkdown(p)), `dash in markdown ${p.path}`);
    assert.ok(renderMarkdown(p).includes('not a prediction'), `notice in ${p.path}`);
  }
  assert.equal(getPage('/library/64/').h1, 'Hexagram 64: Before Completion');
  const data = buildDataFiles();
  for (const [file, content] of Object.entries(data)) {
    assert.ok(!DASH.test(typeof content === 'string' ? content : JSON.stringify(content)), `dash in ${file}`);
  }
  assert.equal(data['hexagrams.json'].hexagrams.length, 64);
  assert.equal(data['hexagram-lines.json'].rows.length, 384);
  assert.equal(data['line-changes.json'].rows.length, 384);
  assert.equal(buildCatalog().datasets.length, 5);
});

test('llms files are small enough to read whole', () => {
  const files = buildLlmsFiles();
  assert.ok(Buffer.byteLength(files['llms.txt']) < 10 * 1024);
  for (const [name, text] of Object.entries(files)) {
    assert.ok(Buffer.byteLength(text) < 60 * 1024, name);
    assert.ok(!DASH.test(text), `dash in ${name}`);
  }
});

test('MCP server speaks the stateless JSON-RPC subset', () => {
  const call = (obj) => handlePost(JSON.stringify(obj));
  assert.equal(call({ jsonrpc: '2.0', method: 'notifications/initialized' }).status, 202);
  assert.equal(call({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } }).body.result.serverInfo.name, 'thefreeiching');
  const tools = call({ jsonrpc: '2.0', id: 2, method: 'tools/list' }).body.result.tools;
  assert.ok(tools.length >= 3 && tools.length <= 6);
  const hex = call({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_hexagram', arguments: { query: '24' } } }).body.result;
  assert.equal(hex.structuredContent.cite.url, 'https://thefreeiching.com/library/24');
  const cast = call({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'cast_reading', arguments: {} } }).body.result.structuredContent;
  assert.match(cast.label, /not a prediction/i);
  assert.equal(call({ jsonrpc: '2.0', id: 5, method: 'nope' }).body.error.code, -32601);
  assert.equal(handlePost('{').status, 400);
});

test('bot classifier logs bots and unknown tools but never browsers', () => {
  assert.deepEqual(classifyAgent('Mozilla/5.0 AppleWebKit/537.36 (compatible; GPTBot/1.2; +https://openai.com/gptbot)', '/'), { agent: 'GPTBot', kind: 'training' });
  assert.deepEqual(classifyAgent('Mozilla/5.0 ... ChatGPT-User/1.0', '/library/1'), { agent: 'ChatGPT-User', kind: 'assistant' });
  assert.deepEqual(classifyAgent('Mozilla/5.0 ... OAI-SearchBot/1.0', '/'), { agent: 'OAI-SearchBot', kind: 'search' });
  assert.equal(classifyAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1', '/library/1'), null);
  assert.equal(classifyAgent('Mozilla/5.0 (Macintosh) Chrome/120', '/llms.txt'), null);
  assert.equal(classifyAgent('MyAgent/2.0', '/mcp').kind, 'tool');
  assert.equal(classifyAgent('MyAgent/2.0', '/library/1'), null);
});

test('vercel.json is in sync with scripts/gen-vercel-config.mjs', () => {
  const onDisk = JSON.parse(fs.readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));
  assert.deepEqual(onDisk, buildVercelConfig());
});

test('export sanitizer masks token-like and non-text values from callers', () => {
  assert.equal(sanitizeText('curl/8.4.0 (x86_64)'), 'curl/8.4.0 (x86_64)');
  assert.equal(sanitizeText('sk_live_abcdefghijklmnop1234'), '[long-token]');
  assert.ok(!/[<>"'\n]/.test(sanitizeText('<script>"x"\n</script>')));
  const out = sanitizeTraffic({ unknown_user_agents: [{ user_agent: 'ghp_aaaaaaaaaaaaaaaaaaaaaaaa', hits: 3 }] });
  assert.equal(out.unknown_user_agents[0].user_agent, '[long-token]');
  assert.equal(out.unknown_user_agents[0].hits, 3);
});

test('seoForPath only builds content pages for their own routes', () => {
  assert.equal(seoForPath('/journal').robots, 'noindex');
  assert.match(seoForPath('/trigrams/kun').title, /Kun/);
  assert.match(seoForPath('/methods/three-coin').title, /Three-coin/);
  assert.equal(seoForPath('/data').robots, 'index, follow');
});
