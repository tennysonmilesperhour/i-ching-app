/**
 * Single source of truth for everything an agent or crawler reads:
 * server-rendered HTML pages, markdown twins, open data files, llms.txt and
 * the MCP tools. Pure functions only (no browser APIs), so it runs in the
 * browser bundle, the build script and the serverless MCP function.
 */
import classicalLines from '../data/classicalLines.json' with { type: 'json' };
import {
  HEXAGRAM_CHINESE,
  HEXAGRAM_NAMES,
  HEXAGRAM_PINYIN,
  TRIGRAMS,
  getLinesForHexagram,
  getTrigrams,
  hexagramFromLines,
  castYarrowLine,
} from './hexagramData.js';
import { HEXAGRAM_INTERPRETATIONS } from './hexagramInterpretations.js';

export const SITE_URL = 'https://thefreeiching.com';
export const SITE_NAME = 'The Free I Ching';
export const CONTENT_UPDATED = '2026-10-31';
export const LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';
export const REFLECTION_NOTICE = 'The I Ching is a tool for reflection, not a prediction. Nothing here forecasts events or replaces professional advice.';
export const LINES_SOURCE_URL = 'https://github.com/jesshewitt/i-ching';

const TRIGRAM_META = [
  { slug: 'kun', pinyin: 'kūn', family: 'Mother', lines: '000', image: 'Earth' },
  { slug: 'zhen', pinyin: 'zhèn', family: 'Eldest son', lines: '100', image: 'Thunder' },
  { slug: 'kan', pinyin: 'kǎn', family: 'Middle son', lines: '010', image: 'Water' },
  { slug: 'dui', pinyin: 'duì', family: 'Youngest daughter', lines: '110', image: 'Lake' },
  { slug: 'gen', pinyin: 'gèn', family: 'Youngest son', lines: '001', image: 'Mountain' },
  { slug: 'li', pinyin: 'lí', family: 'Middle daughter', lines: '101', image: 'Fire' },
  { slug: 'xun', pinyin: 'xùn', family: 'Eldest daughter', lines: '011', image: 'Wind' },
  { slug: 'qian', pinyin: 'qián', family: 'Father', lines: '111', image: 'Heaven' },
];

export const HEXAGRAM_NUMBERS = Array.from({ length: 64 }, (_, i) => i + 1);

const flip = (v) => (v === 7 ? 8 : 7);
const firstSentence = (text) => text.split(/(?<=[.!?])\s/)[0];
const pct = (x) => `${Number((x * 100).toFixed(2))}%`;

export function hexagramPath(n) { return `/library/${n}`; }
export function trigramPath(slug) { return `/trigrams/${slug}`; }
export function hexagramUrl(n) { return `${SITE_URL}${hexagramPath(n)}`; }
export function hexagramShareImageUrl(n) { return `${SITE_URL}/share/hexagram-${n}.png`; }

export function trigramIndexOf(slug) {
  return TRIGRAM_META.findIndex((t) => t.slug === slug);
}

export function trigramRecord(index) {
  const base = TRIGRAMS[index];
  const meta = TRIGRAM_META[index];
  return {
    name: base.name,
    slug: meta.slug,
    chinese: base.chinese,
    pinyin: meta.pinyin,
    symbol: base.symbol,
    element: base.element,
    attribute: base.attribute,
    family: meta.family,
    lines_bottom_to_top: meta.lines,
    url: `${SITE_URL}${trigramPath(meta.slug)}`,
  };
}

export const ALL_TRIGRAMS = TRIGRAMS.map((_, i) => trigramRecord(i));

function trigramBySlugOrName(q) {
  const s = String(q).trim().toLowerCase();
  return ALL_TRIGRAMS.find((t) => t.slug === s || t.element.toLowerCase() === s || t.chinese === q.trim() || t.symbol === q.trim()) || null;
}

/** Everything known about one hexagram, from the app's own data. */
export function hexagramRecord(n) {
  const lines = getLinesForHexagram(n);
  if (!lines) return null;
  const t = getTrigrams(lines);
  const interp = HEXAGRAM_INTERPRETATIONS[n];
  const lineTexts = classicalLines[String(n)] || [];
  const upperIndex = TRIGRAMS.indexOf(t.upper);
  const lowerIndex = TRIGRAMS.indexOf(t.lower);
  return {
    number: n,
    name: HEXAGRAM_NAMES[n],
    chinese: HEXAGRAM_CHINESE[n],
    pinyin: HEXAGRAM_PINYIN[n],
    upper_trigram: trigramRecord(upperIndex),
    lower_trigram: trigramRecord(lowerIndex),
    lines_bottom_to_top: lines.map((v) => (v === 7 ? '1' : '0')).join(''),
    judgment: interp.judgment,
    image: interp.image,
    counsel: interp.counsel,
    line_texts: lineTexts,
    nuclear_hexagram: hexagramFromLines([lines[1], lines[2], lines[3], lines[2], lines[3], lines[4]]),
    inverse_hexagram: hexagramFromLines([...lines].reverse()),
    opposite_hexagram: hexagramFromLines(lines.map(flip)),
    single_line_changes: lines.map((v, i) => {
      const changed = [...lines];
      changed[i] = flip(v);
      return { line: i + 1, relating_hexagram: hexagramFromLines(changed) };
    }),
    url: hexagramUrl(n),
  };
}

export const ALL_HEXAGRAMS = HEXAGRAM_NUMBERS.map(hexagramRecord);

/** Pinyin without tone marks or spaces, so "Xiao Chu", "xiaochu" and "xiǎo chù" compare equal. */
export function foldPinyin(text) {
  return String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/gi, '').toLowerCase();
}

export function findHexagram(query) {
  const raw = String(query ?? '').trim();
  if (!raw) return { match: null, candidates: [] };
  const num = raw.match(/^(?:hexagram\s*)?#?(\d{1,2})$/i);
  if (num) {
    const n = Number(num[1]);
    return { match: n >= 1 && n <= 64 ? ALL_HEXAGRAMS[n - 1] : null, candidates: [] };
  }
  const q = raw.toLowerCase().replace(/^the\s+/, '');
  const norm = (s) => s.toLowerCase().replace(/^the\s+/, '');
  const exact = ALL_HEXAGRAMS.find((h) => norm(h.name) === q || h.chinese === raw);
  if (exact) return { match: exact, candidates: [] };
  const byPinyin = ALL_HEXAGRAMS.filter((h) => foldPinyin(h.pinyin) === foldPinyin(raw));
  if (byPinyin.length === 1) return { match: byPinyin[0], candidates: [] };
  if (byPinyin.length > 1) return { match: null, candidates: byPinyin };
  const partial = ALL_HEXAGRAMS.filter((h) => norm(h.name).includes(q));
  if (partial.length === 1) return { match: partial[0], candidates: [] };
  return { match: null, candidates: partial };
}

export function findTrigram(query) {
  return trigramBySlugOrName(String(query ?? ''));
}

export function hexagramFromTrigrams(upperQuery, lowerQuery) {
  const upper = findTrigram(upperQuery);
  const lower = findTrigram(lowerQuery);
  if (!upper || !lower) return null;
  const lines = [
    ...[...lower.lines_bottom_to_top].map((c) => (c === '1' ? 7 : 8)),
    ...[...upper.lines_bottom_to_top].map((c) => (c === '1' ? 7 : 8)),
  ];
  return ALL_HEXAGRAMS[hexagramFromLines(lines) - 1];
}

/* ---------- casting (random, for reflection) ---------- */

function randomBits(count) {
  const bytes = new Uint8Array(count);
  globalThis.crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b & 1);
}

export function castCoinLine() {
  // Heads = 3, tails = 2, three coins: sums 6 to 9.
  return randomBits(3).reduce((sum, bit) => sum + (bit ? 3 : 2), 0);
}

export function castLines(method = 'yarrow') {
  const draw = method === 'coin' ? castCoinLine : castYarrowLine;
  return Array.from({ length: 6 }, draw);
}

export function describeCast(lines, method) {
  const changing = lines.map((v, i) => (v === 6 || v === 9 ? i + 1 : null)).filter(Boolean);
  const primary = ALL_HEXAGRAMS[hexagramFromLines(lines) - 1];
  const relatingLines = lines.map((v) => (v === 6 ? 7 : v === 9 ? 8 : v));
  const relating = changing.length ? ALL_HEXAGRAMS[hexagramFromLines(relatingLines) - 1] : null;
  return {
    method,
    line_values_bottom_to_top: lines,
    line_value_key: '6 = old yin (changing), 7 = young yang, 8 = young yin, 9 = old yang (changing)',
    changing_lines: changing,
    primary_hexagram: primary,
    relating_hexagram: relating,
    changing_line_texts: changing.map((i) => ({ line: i, text: primary.line_texts[i - 1] })),
    how_to_read: changing.length
      ? 'Read the primary hexagram first, then the text of each changing line, then the relating hexagram as the direction the situation is moving.'
      : 'No lines are changing, so the primary hexagram alone is the reading.',
    notice: REFLECTION_NOTICE,
  };
}

/* ---------- cast statistics (exact, by enumeration) ---------- */

const METHOD_WEIGHTS = {
  yarrow: { 6: 1 / 16, 7: 5 / 16, 8: 7 / 16, 9: 3 / 16 },
  coin: { 6: 1 / 8, 7: 3 / 8, 8: 3 / 8, 9: 1 / 8 },
};

function binomial(n, k) {
  let r = 1;
  for (let i = 1; i <= k; i += 1) r = (r * (n - k + i)) / i;
  return r;
}

let statsCache = null;
export function castStatistics() {
  if (statsCache) return statsCache;
  const out = { methods: {} };
  for (const [method, w] of Object.entries(METHOD_WEIGHTS)) {
    const relating = Array(65).fill(0);
    const primary = Array(65).fill(0);
    let noChange = 0;
    const values = [6, 7, 8, 9];
    for (let code = 0; code < 4096; code += 1) {
      const lines = Array.from({ length: 6 }, (_, i) => values[(code >> (2 * i)) & 3]);
      const p = lines.reduce((acc, v) => acc * w[v], 1);
      primary[hexagramFromLines(lines)] += p;
      if (lines.some((v) => v === 6 || v === 9)) {
        relating[hexagramFromLines(lines.map((v) => (v === 6 ? 7 : v === 9 ? 8 : v)))] += p;
      } else noChange += p;
    }
    const pChange = w[6] + w[9];
    out.methods[method] = {
      line_probabilities: { old_yin_6: w[6], young_yang_7: w[7], young_yin_8: w[8], old_yang_9: w[9] },
      probability_line_is_changing: pChange,
      probability_no_changing_lines: noChange,
      probability_of_k_changing_lines: Array.from({ length: 7 }, (_, k) => binomial(6, k) * pChange ** k * (1 - pChange) ** (6 - k)),
      expected_changing_lines: 6 * pChange,
      primary_hexagram_probability: HEXAGRAM_NUMBERS.map((n) => primary[n]),
      relating_hexagram_probability: HEXAGRAM_NUMBERS.map((n) => relating[n]),
    };
  }
  statsCache = out;
  return out;
}

/* ---------- block renderers (one source for HTML and markdown) ---------- */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const LINK = 'underline underline-offset-4 hover:text-ink';
const inline = (s) => esc(s).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, h) => `<a href="${h}" class="${LINK}">${t}</a>`);
const absolute = (s) => s.replace(/\]\(\//g, `](${SITE_URL}/`);

function figureHtml(lines, label) {
  const bars = [...lines].reverse().map((v) => {
    const yang = v === 7 || v === 9;
    return yang
      ? '<span class="block h-2 w-24 rounded-sm bg-ink/75"></span>'
      : '<span class="flex h-2 w-24 justify-between"><span class="block h-2 w-10 rounded-sm bg-ink/75"></span><span class="block h-2 w-10 rounded-sm bg-ink/75"></span></span>';
  });
  return `<div role="img" aria-label="${esc(label)}" class="my-6 flex flex-col items-center gap-2">${bars.join('')}</div>`;
}

function figureText(lines) {
  return [...lines].reverse().map((v) => ((v === 7 || v === 9) ? '━━━━━━━' : '━━━  ━━━')).join('\n');
}

function blockHtml(b) {
  switch (b.t) {
    case 'h2': return `<h2 class="mt-10 text-xs tracking-widest uppercase text-ink/55">${inline(b.text)}</h2>`;
    case 'h3': return `<h3 class="mt-6 font-serif text-lg text-ink/90">${inline(b.text)}</h3>`;
    case 'p': return `<p class="mt-3 font-serif text-lg leading-[1.8] text-ink/85">${inline(b.text)}</p>`;
    case 'note': return `<p class="mt-6 text-xs leading-relaxed text-ink/60">${inline(b.text)}</p>`;
    case 'ul': return `<ul class="mt-3 list-disc space-y-1 pl-5 text-base leading-7 text-ink/80">${b.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`;
    case 'ol': return `<ol class="mt-3 list-decimal space-y-1 pl-5 text-base leading-7 text-ink/80">${b.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ol>`;
    case 'facts': return `<dl class="mt-3 grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm text-ink/80">${b.items.map(([k, v]) => `<dt class="text-ink/55">${esc(k)}</dt><dd>${inline(v)}</dd>`).join('')}</dl>`;
    case 'quote': return `<blockquote class="mt-3 border-l border-stone/40 pl-4 font-serif text-base italic leading-[1.75] text-ink/75">${esc(b.text).replace(/\n/g, '<br>')}</blockquote>`;
    case 'figure': return figureHtml(b.lines, b.label);
    case 'table': return `<div class="mt-3 overflow-x-auto"><table class="w-full text-left text-sm text-ink/80"><thead><tr>${b.head.map((h) => `<th class="border-b border-stone/30 py-2 pr-4 font-medium text-ink/60">${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td class="border-b border-stone/15 py-2 pr-4">${inline(String(c))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    default: return '';
  }
}

function blockMd(b) {
  switch (b.t) {
    case 'h2': return `## ${b.text}`;
    case 'h3': return `### ${b.text}`;
    case 'p': return absolute(b.text);
    case 'note': return `*${absolute(b.text)}*`;
    case 'ul': return b.items.map((i) => `- ${absolute(i)}`).join('\n');
    case 'ol': return b.items.map((i, k) => `${k + 1}. ${absolute(i)}`).join('\n');
    case 'facts': return b.items.map(([k, v]) => `- **${k}:** ${absolute(v)}`).join('\n');
    case 'quote': return b.text.split('\n').map((l) => `> ${l}`).join('\n');
    case 'figure': return `\`\`\`\n${figureText(b.lines)}\n\`\`\``;
    case 'table': return [`| ${b.head.join(' | ')} |`, `| ${b.head.map(() => '---').join(' | ')} |`, ...b.rows.map((r) => `| ${r.map((c) => absolute(String(c)).replace(/\|/g, '/')).join(' | ')} |`)].join('\n');
    default: return '';
  }
}

export function renderBodyHtml(page) {
  return [
    page.eyebrow ? `<p class="text-xs tracking-[0.2em] uppercase text-ink/55">${esc(page.eyebrow)}</p>` : '',
    `<h1 class="mt-2 font-serif text-3xl text-ink/90">${esc(page.h1)}</h1>`,
    ...page.blocks.map(blockHtml),
    `<p class="mt-10 text-xs text-ink/55">Updated ${esc(formatDate(CONTENT_UPDATED))}. <a class="${LINK}" href="${page.path === '/' ? '/index.md' : `${page.path}.md`}">Markdown version</a></p>`,
  ].join('\n');
}

export function renderMarkdown(page) {
  const url = `${SITE_URL}${page.path === '/' ? '/' : page.path}`;
  return [
    `# ${page.h1}`,
    `Canonical page: ${url}\nLast updated: ${CONTENT_UPDATED}`,
    ...page.blocks.map(blockMd),
    `---\nSource: ${SITE_NAME} (${url}). ${REFLECTION_NOTICE}`,
  ].filter(Boolean).join('\n\n') + '\n';
}

export function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[m - 1]} ${d}, ${y}`;
}

export function citation(page) {
  return `${SITE_NAME}. "${page.h1}." ${SITE_URL}${page.path === '/' ? '' : page.path} (updated ${CONTENT_UPDATED}).`;
}

/* ---------- pages ---------- */

const crumb = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE_URL}${path}` })),
});

const publisher = { '@type': 'Organization', name: SITE_NAME, url: SITE_URL };

function articleLd(page, description) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.h1,
    description,
    url: `${SITE_URL}${page.path}`,
    mainEntityOfPage: `${SITE_URL}${page.path}`,
    dateModified: CONTENT_UPDATED,
    inLanguage: 'en',
    isAccessibleForFree: true,
    author: publisher,
    publisher,
  };
}

function withCitation(page) {
  page.blocks.push({ t: 'h2', text: 'Cite this page' });
  page.blocks.push({ t: 'p', text: citation(page) });
  page.blocks.push({ t: 'note', text: `${REFLECTION_NOTICE} Short quotations with a link back are welcome. Please do not republish a page in full. The open data files at [/data](/data) are licensed CC BY 4.0.` });
  return page;
}

function hexagramPage(n) {
  const h = ALL_HEXAGRAMS[n - 1];
  const lines = getLinesForHexagram(n);
  const name = `${h.name} ${h.chinese}`;
  const description = `Hexagram ${n}, ${h.name} (${h.chinese}): ${h.upper_trigram.element} over ${h.lower_trigram.element}. ${firstSentence(h.judgment)}`;
  const link = (m) => `[${m} ${HEXAGRAM_NAMES[m]}](${hexagramPath(m)})`;
  const page = {
    path: hexagramPath(n),
    kind: 'hexagram',
    title: `Hexagram ${n}: ${name} | ${SITE_NAME}`,
    description,
    h1: `Hexagram ${n}: ${h.name}`,
    eyebrow: `${h.chinese} ${h.pinyin} · King Wen sequence ${n} of 64`,
    blocks: [
      { t: 'figure', lines, label: `Hexagram ${n}, ${h.name}` },
      { t: 'facts', items: [
        ['Chinese name', `${h.chinese} (${h.pinyin})`],
        ['Upper trigram', `[${h.upper_trigram.name} ${h.upper_trigram.chinese}](${trigramPath(h.upper_trigram.slug)}), ${h.upper_trigram.element}, ${h.upper_trigram.attribute}`],
        ['Lower trigram', `[${h.lower_trigram.name} ${h.lower_trigram.chinese}](${trigramPath(h.lower_trigram.slug)}), ${h.lower_trigram.element}, ${h.lower_trigram.attribute}`],
        ['Lines, bottom to top', `${h.lines_bottom_to_top} (1 = solid yang, 0 = broken yin)`],
      ] },
      { t: 'h2', text: 'Contemporary judgment' },
      { t: 'p', text: h.judgment },
      { t: 'h2', text: 'Image' },
      { t: 'p', text: h.image },
      { t: 'h2', text: 'Counsel' },
      { t: 'p', text: h.counsel },
      { t: 'h2', text: 'The six lines' },
      { t: 'note', text: 'Numbered from the bottom upward. These line texts are read when that line is changing in a cast.' },
      ...h.line_texts.flatMap((text, i) => [{ t: 'h3', text: `Line ${i + 1}` }, { t: 'quote', text }]),
      { t: 'h2', text: 'Related hexagrams' },
      { t: 'facts', items: [
        ['Nuclear (lines 2 to 5)', link(h.nuclear_hexagram)],
        ['Inverse (turned upside down)', h.inverse_hexagram === n ? 'itself' : link(h.inverse_hexagram)],
        ['Opposite (every line flipped)', link(h.opposite_hexagram)],
      ] },
      { t: 'p', text: 'What these relationships mean: [nuclear, inverse and opposite hexagrams](/related-hexagrams).' },
      { t: 'h2', text: 'If one line changes' },
      { t: 'table', head: ['Changing line', 'Relating hexagram'], rows: h.single_line_changes.map((c) => [`Line ${c.line}`, link(c.relating_hexagram)]) },
      { t: 'p', text: `Previous: ${n > 1 ? link(n - 1) : 'none'}. Next: ${n < 64 ? link(n + 1) : 'none'}. [All sixty-four hexagrams](/library).` },
      { t: 'note', text: `The judgment, image and counsel are original contemporary paraphrases written for ${SITE_NAME}. The line text is the CC0 translation from [jesshewitt/i-ching](${LINES_SOURCE_URL}), derived from Richard Wilhelm's 1924 German edition.` },
    ],
  };
  page.jsonld = [{ ...articleLd(page, description), image: hexagramShareImageUrl(n) }, crumb([['Home', '/'], ['Library', '/library'], [`Hexagram ${n}`, page.path]])];
  return withCitation(page);
}

function libraryPage() {
  const description = 'All sixty-four hexagrams of the I Ching in King Wen order, with names, trigrams and a short summary of each.';
  const page = {
    path: '/library',
    kind: 'index',
    title: `Hexagram Library: all 64 hexagrams | ${SITE_NAME}`,
    description,
    h1: 'Hexagram Library',
    eyebrow: 'The sixty-four changes',
    blocks: [
      { t: 'p', text: 'Browse the sixty-four figures outside the ritual of a cast. Each page gives the structure, a contemporary interpretation, and the six line texts.' },
      { t: 'table', head: ['No.', 'Hexagram', 'Trigrams (upper over lower)', 'Summary'], rows: ALL_HEXAGRAMS.map((h) => [h.number, `[${h.name} ${h.chinese}](${hexagramPath(h.number)}) ${h.pinyin}`, `${h.upper_trigram.element} over ${h.lower_trigram.element}`, firstSentence(h.judgment)]) },
    ],
  };
  page.jsonld = [articleLd(page, description), crumb([['Home', '/'], ['Library', '/library']])];
  return withCitation(page);
}

function trigramPage(index) {
  const t = ALL_TRIGRAMS[index];
  const upper = ALL_HEXAGRAMS.filter((h) => h.upper_trigram.slug === t.slug);
  const lower = ALL_HEXAGRAMS.filter((h) => h.lower_trigram.slug === t.slug);
  const description = `${t.name} ${t.chinese} (${t.symbol}), the I Ching trigram of ${t.element}: ${t.attribute}. Family role: ${t.family}. Lines ${t.lines_bottom_to_top} from the bottom.`;
  const list = (hs) => hs.map((h) => `[${h.number} ${h.name}](${hexagramPath(h.number)})`);
  const page = {
    path: trigramPath(t.slug),
    kind: 'trigram',
    title: `${t.name} ${t.chinese} ${t.symbol}: the trigram of ${t.element} | ${SITE_NAME}`,
    description,
    h1: `${t.name} ${t.chinese}: ${t.element}`,
    eyebrow: `Trigram ${t.symbol}`,
    blocks: [
      { t: 'facts', items: [
        ['Symbol', `${t.symbol} ${t.chinese} (${t.pinyin})`],
        ['Natural image', t.element],
        ['Quality', t.attribute],
        ['Family role', t.family],
        ['Lines, bottom to top', `${t.lines_bottom_to_top} (1 = solid yang, 0 = broken yin)`],
      ] },
      { t: 'p', text: `A trigram is a stack of three lines. Each hexagram is two trigrams: one below (the lower, inner or earlier situation) and one above (the upper, outer or later situation). ${t.name} appears in sixteen of the sixty-four hexagrams, eight times as the upper trigram and eight as the lower.` },
      { t: 'h2', text: `${t.name} as the upper trigram` },
      { t: 'ul', items: list(upper) },
      { t: 'h2', text: `${t.name} as the lower trigram` },
      { t: 'ul', items: list(lower) },
      { t: 'p', text: 'See also the [eight trigrams](/trigrams).' },
    ],
  };
  page.jsonld = [articleLd(page, description), crumb([['Home', '/'], ['Trigrams', '/trigrams'], [t.name, page.path]])];
  return withCitation(page);
}

function trigramsPage() {
  const description = 'The eight I Ching trigrams: Heaven, Earth, Thunder, Wind, Water, Fire, Mountain and Lake, with symbols, qualities, family roles and line patterns.';
  const page = {
    path: '/trigrams',
    kind: 'index',
    title: `The eight trigrams of the I Ching | ${SITE_NAME}`,
    description,
    h1: 'The Eight Trigrams',
    eyebrow: 'Building blocks of the hexagrams',
    blocks: [
      { t: 'p', text: 'Every hexagram is built from two of eight trigrams. Lines are listed from the bottom up, 1 for a solid (yang) line and 0 for a broken (yin) line.' },
      { t: 'table', head: ['Trigram', 'Image', 'Quality', 'Family role', 'Lines'], rows: ALL_TRIGRAMS.map((t) => [`[${t.name} ${t.chinese} ${t.symbol}](${trigramPath(t.slug)}) ${t.pinyin}`, t.element, t.attribute, t.family, t.lines_bottom_to_top]) },
      { t: 'p', text: 'Sixty-four hexagrams come from eight lower trigrams times eight upper trigrams. [Browse them in the library](/library).' },
    ],
  };
  page.jsonld = [articleLd(page, description), crumb([['Home', '/'], ['Trigrams', '/trigrams']])];
  return withCitation(page);
}

const fraction = (x) => ({ 0.0625: '1/16', 0.3125: '5/16', 0.4375: '7/16', 0.1875: '3/16', 0.125: '1/8', 0.375: '3/8' }[x] || String(x));

function methodRows(method) {
  const m = castStatistics().methods[method].line_probabilities;
  return [
    ['6', 'Old yin (changing)', fraction(m.old_yin_6), pct(m.old_yin_6)],
    ['7', 'Young yang (stable)', fraction(m.young_yang_7), pct(m.young_yang_7)],
    ['8', 'Young yin (stable)', fraction(m.young_yin_8), pct(m.young_yin_8)],
    ['9', 'Old yang (changing)', fraction(m.old_yang_9), pct(m.old_yang_9)],
  ];
}

function changingTable(method) {
  const s = castStatistics().methods[method];
  return { t: 'table', head: ['Changing lines in a cast', 'Chance'], rows: s.probability_of_k_changing_lines.map((p, k) => [String(k), pct(p)]) };
}

function methodPage(slug) {
  const yarrow = slug === 'yarrow';
  const stats = castStatistics().methods[yarrow ? 'yarrow' : 'coin'];
  const description = yarrow
    ? 'How the yarrow-weighted digital cast works: traditional yarrow-stalk line probabilities (1/16, 5/16, 7/16, 3/16) drawn with secure random numbers.'
    : 'How the three-coin method works: heads = 3, tails = 2, three tosses per line, six lines from the bottom up, with exact line probabilities.';
  const page = {
    path: `/methods/${slug}`,
    kind: 'method',
    title: `${yarrow ? 'Yarrow-weighted digital cast' : 'Three-coin method'}: how it works | ${SITE_NAME}`,
    description,
    h1: yarrow ? 'Yarrow-Weighted Digital Cast' : 'The Three-Coin Method',
    eyebrow: 'Casting method',
    blocks: yarrow ? [
      { t: 'p', text: 'The traditional yarrow-stalk ritual sorts fifty stalks into groups three times to produce each line. It does not give every line value the same chance. The digital cast reproduces those odds without the ritual: each line is drawn from sixteen equally likely outcomes, mapped to the four line values.' },
      { t: 'table', head: ['Value', 'Line', 'Fraction', 'Chance'], rows: methodRows('yarrow') },
      { t: 'p', text: 'Random numbers come from the browser cryptography API, with rejection sampling so no outcome is favored. Six lines are drawn from the bottom upward, then the primary hexagram, any changing lines and the relating hexagram are worked out.' },
      { t: 'h2', text: 'What the odds mean' },
      { t: 'ul', items: [
        'A line is changing 25% of the time (old yin 1/16 plus old yang 3/16).',
        'Old yang is three times as likely as old yin, which is the known asymmetry of the yarrow method.',
        `The chance that a six-line cast has no changing lines at all is ${pct(stats.probability_no_changing_lines)}.`,
        'Every one of the 64 primary hexagrams is equally likely (1/64), because yang and yin lines are each 50% likely.',
      ] },
      changingTable('yarrow'),
    ] : [
      { t: 'p', text: 'Hold three coins of the same kind and think of your question. Toss them together. Heads counts 3 and tails counts 2. The sum of the three coins is the line value. Make six tosses and build the figure from the bottom upward, so the first toss is the bottom line.' },
      { t: 'table', head: ['Value', 'Line', 'Fraction', 'Chance'], rows: methodRows('coin') },
      { t: 'p', text: 'In The Free I Ching you toss physical coins yourself and enter heads or tails for each line. The app does not toss for you in this mode.' },
      { t: 'h2', text: 'What the odds mean' },
      { t: 'ul', items: [
        'A line is changing 25% of the time (old yin 1/8 plus old yang 1/8).',
        'Old yin and old yang are equally likely, unlike the yarrow method.',
        `The chance that a six-line cast has no changing lines at all is ${pct(stats.probability_no_changing_lines)}.`,
        'Every one of the 64 primary hexagrams is equally likely (1/64).',
      ] },
      changingTable('coin'),
    ],
  };
  page.blocks.push(
    { t: 'h2', text: 'Reading the result' },
    { t: 'ol', items: [
      'Find the primary hexagram from the six lines.',
      'If no line is changing, read that hexagram on its own.',
      'If lines are changing, read the line text for each changing line.',
      'Change those lines to their opposite to find the relating hexagram, the direction the situation is moving.',
    ] },
    { t: 'p', text: 'Compare with the [other method](/methods) or look up any figure in the [library](/library).' },
  );
  page.jsonld = [articleLd(page, description), crumb([['Home', '/'], ['Methods', '/methods'], [page.h1, page.path]])];
  return withCitation(page);
}

function methodsPage() {
  const description = 'Two ways to cast an I Ching reading: the yarrow-weighted digital cast and the three-coin method, compared with exact line probabilities.';
  const y = castStatistics().methods.yarrow;
  const c = castStatistics().methods.coin;
  const page = {
    path: '/methods',
    kind: 'index',
    title: `I Ching casting methods compared | ${SITE_NAME}`,
    description,
    h1: 'Casting Methods',
    eyebrow: 'How a hexagram is made',
    blocks: [
      { t: 'p', text: `${SITE_NAME} offers two ways to build a hexagram. Both produce six lines from the bottom up, each with a value of 6, 7, 8 or 9.` },
      { t: 'ul', items: [
        '[Yarrow-weighted digital cast](/methods/yarrow): instant, using the traditional yarrow-stalk odds.',
        '[Three-coin method](/methods/three-coin): you toss three coins six times and enter the result.',
      ] },
      { t: 'table', head: ['Line value', 'Meaning', 'Yarrow', 'Three coins'], rows: [
        ['6', 'Old yin (changing)', fraction(y.line_probabilities.old_yin_6), fraction(c.line_probabilities.old_yin_6)],
        ['7', 'Young yang', fraction(y.line_probabilities.young_yang_7), fraction(c.line_probabilities.young_yang_7)],
        ['8', 'Young yin', fraction(y.line_probabilities.young_yin_8), fraction(c.line_probabilities.young_yin_8)],
        ['9', 'Old yang (changing)', fraction(y.line_probabilities.old_yang_9), fraction(c.line_probabilities.old_yang_9)],
      ] },
      { t: 'p', text: `In both methods a line changes 25% of the time, about ${pct(y.probability_no_changing_lines)} of casts have no changing lines, and each of the 64 primary hexagrams has the same 1/64 chance. The methods differ in how often old yin and old yang appear, which changes which relating hexagrams are more common. Exact numbers are in the [cast probabilities dataset](/data).` },
      { t: 'note', text: 'A cast is a prompt for reflection. The odds describe the casting procedure, not events in your life.' },
    ],
  };
  page.jsonld = [articleLd(page, description), crumb([['Home', '/'], ['Methods', '/methods']])];
  return withCitation(page);
}

export const DATA_FILES = [
  { file: 'hexagrams.json', csv: 'hexagrams.csv', name: 'The 64 hexagrams', description: 'King Wen number, English name, Chinese name in traditional characters with Hanyu Pinyin, upper and lower trigram, line pattern, nuclear, inverse and opposite hexagram, and a short contemporary judgment for each of the 64 hexagrams.', license: 'CC BY 4.0', rows: 64 },
  { file: 'trigrams.json', csv: 'trigrams.csv', name: 'The 8 trigrams', description: 'Name, Chinese character with Hanyu Pinyin, symbol, natural image, quality, family role and line pattern for each of the eight trigrams.', license: 'CC BY 4.0', rows: 8 },
  { file: 'line-changes.json', csv: 'line-changes.csv', name: 'Single line change table', description: 'For each hexagram and each of its six lines, the relating hexagram you reach when only that line changes (384 rows).', license: 'CC BY 4.0', rows: 384 },
  { file: 'cast-probabilities.json', csv: null, name: 'Cast probabilities by method', description: 'Exact line, changing-line and relating-hexagram probabilities for the yarrow-weighted and three-coin methods, worked out by enumerating all 4,096 line combinations.', license: 'CC BY 4.0', rows: 2 },
  { file: 'hexagram-lines.json', csv: 'hexagram-lines.csv', name: 'Changing-line texts (third party, CC0)', description: 'The six line texts for each hexagram from the CC0 translation by Jess Hewitt and Claude, derived from Richard Wilhelm. Third-party text, public domain dedication.', license: 'CC0 1.0', rows: 384 },
];

function dataPage() {
  const description = 'Open data from The Free I Ching: the 64 hexagrams, 8 trigrams, line-change table and exact cast probabilities as JSON and CSV, licensed CC BY 4.0.';
  const page = {
    path: '/data',
    kind: 'data',
    title: `Open I Ching data: JSON and CSV | ${SITE_NAME}`,
    description,
    h1: 'Open Data',
    eyebrow: 'Free to use with credit',
    blocks: [
      { t: 'p', text: `${SITE_NAME} publishes its structured hexagram data openly. Original datasets are licensed [CC BY 4.0](${LICENSE_URL}): use them freely, including commercially, and credit "${SITE_NAME}, ${SITE_URL}/data". The machine-readable catalog is [/data/index.json](/data/index.json).` },
      { t: 'table', head: ['Dataset', 'Files', 'Rows', 'License'], rows: DATA_FILES.map((d) => [d.name, `[JSON](/data/${d.file})${d.csv ? `, [CSV](/data/${d.csv})` : ''}`, d.rows, d.license]) },
      { t: 'ul', items: DATA_FILES.map((d) => `${d.name}: ${d.description}`) },
      { t: 'h2', text: 'How to cite' },
      { t: 'p', text: `${SITE_NAME} (${CONTENT_UPDATED.slice(0, 4)}). Open I Ching data. ${SITE_URL}/data. Licensed CC BY 4.0.` },
      { t: 'h2', text: 'Notes' },
      { t: 'ul', items: [
        'Hexagrams are numbered in the King Wen sequence. Lines are listed bottom to top, 1 for yang and 0 for yin.',
        'The judgment text is original to this project. Image and counsel text is on each hexagram page: quote with a link, please do not republish in full.',
        'The line texts file is third-party CC0 text, credited to [jesshewitt/i-ching](' + LINES_SOURCE_URL + ').',
        'No personal data is involved. Readings and journals never leave the user\'s device.',
      ] },
      { t: 'h2', text: 'For AI assistants' },
      { t: 'p', text: 'Start at [/llms.txt](/llms.txt). A read-only [MCP server](/mcp) at ' + SITE_URL + '/mcp answers lookups with no key. Every page has a markdown twin at the same address plus .md.' },
    ],
  };
  page.jsonld = [dataCatalogLd(), crumb([['Home', '/'], ['Data', '/data']])];
  return withCitation(page);
}

export function dataCatalogLd() {
  const datasetFor = (d) => ({
    '@type': 'Dataset',
    name: d.name,
    description: d.description,
    url: `${SITE_URL}/data`,
    license: d.license === 'CC0 1.0' ? 'https://creativecommons.org/publicdomain/zero/1.0/' : LICENSE_URL,
    isAccessibleForFree: true,
    creator: publisher,
    dateModified: CONTENT_UPDATED,
    keywords: ['I Ching', 'Yijing', 'hexagrams', 'trigrams', 'divination', 'Book of Changes'],
    distribution: [
      { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: `${SITE_URL}/data/${d.file}` },
      ...(d.csv ? [{ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: `${SITE_URL}/data/${d.csv}` }] : []),
    ],
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'DataCatalog',
    name: `${SITE_NAME} open data`,
    url: `${SITE_URL}/data`,
    publisher,
    license: LICENSE_URL,
    dataset: DATA_FILES.map(datasetFor),
  };
}

function homePage() {
  const description = 'A free, quiet I Ching oracle with guided Inquirer and deeper Adept readings, a library of all 64 hexagrams, changing-line text and a private journal that stays on your device.';
  const page = {
    path: '/',
    kind: 'home',
    title: `${SITE_NAME}: A Quiet Oracle`,
    description,
    h1: SITE_NAME,
    eyebrow: '易經 · The Book of Changes',
    blocks: [
      { t: 'p', text: 'A calm, private way to consult the I Ching. Pose a question, cast a hexagram, and sit with the guidance. Free to use, with no account needed. Readings and journal entries stay on your device.' },
      { t: 'h2', text: 'What you can do' },
      { t: 'ul', items: [
        'Cast a reading with the [yarrow-weighted digital cast or three physical coins](/methods).',
        'Read as an Inquirer (meaning first) or an Adept (trigrams, line values, changing-line text and method detail).',
        'Browse all sixty-four hexagrams in the [library](/library) and the [eight trigrams](/trigrams), and see how hexagrams relate through [nuclear, inverse and opposite figures](/related-hexagrams).',
        'Keep a private journal and return to readings over time.',
      ] },
      { t: 'h2', text: 'Key facts' },
      { t: 'facts', items: [
        ['Hexagrams', '64, in the King Wen sequence'],
        ['Trigrams', '8'],
        ['Line texts', '384 (six per hexagram), CC0 translation'],
        ['Methods', 'Yarrow-weighted digital cast, three-coin method'],
        ['Cost', 'Free. An optional $10 per year contribution is offered on the web, and an optional Supporter Upgrade in the iPhone and iPad app.'],
        ['Privacy', 'Questions, readings and journal entries are stored on your device.'],
      ] },
      { t: 'h2', text: 'For researchers, developers and AI assistants' },
      { t: 'ul', items: [
        'Open data (JSON and CSV, CC BY 4.0): [/data](/data)',
        'Machine-readable guide: [/llms.txt](/llms.txt)',
        'Read-only MCP server: ' + SITE_URL + '/mcp',
        'Short answers: [FAQ](/faq). What changed and when: [changelog](/changelog)',
      ] },
    ],
  };
  page.jsonld = [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: SITE_URL, description, inLanguage: 'en', publisher },
    {
      '@context': 'https://schema.org', '@type': 'WebApplication', name: SITE_NAME, url: SITE_URL, applicationCategory: 'LifestyleApplication', operatingSystem: 'Web, iOS',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, description,
    },
  ];
  return withCitation(page);
}

/* ---------- related hexagrams explainer ---------- */

/** Facts about the nuclear, inverse and opposite relationships, worked out from the 64 figures. */
export function relationshipStats() {
  const selfInverse = ALL_HEXAGRAMS.filter((h) => h.inverse_hexagram === h.number).map((h) => h.number);
  const nuclearSet = [...new Set(ALL_HEXAGRAMS.map((h) => h.nuclear_hexagram))].sort((a, b) => a - b);
  const nuclearEnd = (n) => {
    let current = n;
    for (let i = 0; i < 6; i += 1) current = ALL_HEXAGRAMS[current - 1].nuclear_hexagram;
    return current;
  };
  const ends = { 1: 0, 2: 0, cycle_63_64: 0 };
  for (const h of ALL_HEXAGRAMS) {
    const end = nuclearEnd(h.number);
    if (end === 1) ends[1] += 1;
    else if (end === 2) ends[2] += 1;
    else ends.cycle_63_64 += 1;
  }
  const pairs = Array.from({ length: 32 }, (_, k) => [2 * k + 1, 2 * k + 2]);
  const inversePairs = pairs.filter(([a, b]) => ALL_HEXAGRAMS[a - 1].inverse_hexagram === b);
  const oppositeOnlyPairs = pairs.filter(([a, b]) => ALL_HEXAGRAMS[a - 1].inverse_hexagram !== b && ALL_HEXAGRAMS[a - 1].opposite_hexagram === b);
  const bothPairs = inversePairs.filter(([a, b]) => ALL_HEXAGRAMS[a - 1].opposite_hexagram === b);
  return { selfInverse, nuclearSet, ends, inversePairs, oppositeOnlyPairs, bothPairs };
}

function relatedHexagramsPage() {
  const description = 'What the nuclear, inverse and opposite hexagrams of the I Ching are, how each is built from the six lines, and how the King Wen sequence pairs the 64 hexagrams.';
  const s = relationshipStats();
  const link = (m) => `[${m} ${HEXAGRAM_NAMES[m]}](${hexagramPath(m)})`;
  const pairText = (list) => list.map(([a, b]) => `${a} and ${b}`).join(', ');
  const h3 = ALL_HEXAGRAMS[2];
  const h24 = ALL_HEXAGRAMS[23];
  const page = {
    path: '/related-hexagrams',
    kind: 'guide',
    title: `Nuclear, inverse and opposite hexagrams explained | ${SITE_NAME}`,
    description,
    h1: 'Nuclear, Inverse and Opposite Hexagrams',
    eyebrow: 'How the hexagrams relate',
    blocks: [
      { t: 'p', text: 'Every hexagram page in the [library](/library) lists three related hexagrams. Each one is made from the same six lines by a fixed rule, so the relationships are a matter of structure, not interpretation. Commentators have long used them as extra angles on a reading.' },
      { t: 'p', text: 'Lines are always counted from the bottom (line 1) to the top (line 6).' },
      { t: 'h2', text: 'Nuclear hexagram (hù guà 互卦)' },
      { t: 'p', text: 'Take the four middle lines. Lines 2, 3 and 4 make the lower nuclear trigram, and lines 3, 4 and 5 make the upper nuclear trigram. The bottom and top lines drop out. The nuclear hexagram is often read as the inner dynamic of a situation, what is at work beneath its surface.' },
      { t: 'p', text: `Example: ${link(3)} has lines ${h3.lines_bottom_to_top}. Lines 2 to 4 give ${h3.lines_bottom_to_top.slice(1, 4)} and lines 3 to 5 give ${h3.lines_bottom_to_top.slice(2, 5)}, so its nuclear hexagram is ${link(h3.nuclear_hexagram)}.` },
      { t: 'ul', items: [
        `Only ${s.nuclearSet.length} of the 64 hexagrams ever appear as a nuclear hexagram: ${s.nuclearSet.join(', ')}.`,
        `Taking the nuclear of the nuclear again and again always ends in one of three places: ${link(1)} (for ${s.ends[1]} hexagrams), ${link(2)} (for ${s.ends[2]}), or a back and forth between ${link(63)} and ${link(64)} (for ${s.ends.cycle_63_64}).`,
      ] },
      { t: 'h2', text: 'Inverse hexagram (zōng guà 綜卦)' },
      { t: 'p', text: 'Turn the figure upside down, so line 6 becomes line 1. The inverse is often read as the same situation seen from the other side, or from the position of the other party.' },
      { t: 'p', text: `Example: ${link(24)} (${h24.lines_bottom_to_top}) turned over gives ${link(h24.inverse_hexagram)} (${ALL_HEXAGRAMS[h24.inverse_hexagram - 1].lines_bottom_to_top}). Return, one yang line coming back at the bottom, mirrors Splitting Apart, one yang line left at the top.` },
      { t: 'p', text: `${s.selfInverse.length} hexagrams are symmetrical and look the same upside down: ${s.selfInverse.map(link).join(', ')}. Their inverse is themselves.` },
      { t: 'h2', text: 'Opposite hexagram (cuò guà 錯卦)' },
      { t: 'p', text: 'Change every line: each solid line becomes broken and each broken line becomes solid. The opposite is often read as the complement of the situation, the qualities it lacks or holds in reserve.' },
      { t: 'p', text: `Example: the opposite of ${link(1)} (all solid) is ${link(2)} (all broken). The opposite of ${link(24)} is ${link(h24.opposite_hexagram)}.` },
      { t: 'h2', text: 'How the King Wen sequence uses them' },
      { t: 'p', text: `The traditional order groups the 64 hexagrams into 32 pairs (1 and 2, 3 and 4, and so on). In ${s.inversePairs.length} pairs the second hexagram is the first turned upside down. The other ${s.oppositeOnlyPairs.length} pairs (${pairText(s.oppositeOnlyPairs)}) are made of symmetrical hexagrams, which cannot be turned over, so they are paired with their opposite instead. In ${s.bothPairs.length} pairs (${pairText(s.bothPairs)}) the second hexagram is both the inverse and the opposite of the first.` },
      { t: 'h2', text: 'Where to find them' },
      { t: 'ul', items: [
        'Each hexagram page lists its nuclear, inverse and opposite hexagram under "Related hexagrams".',
        'The [hexagrams dataset](/data) has nuclear_hexagram, inverse_hexagram and opposite_hexagram columns for all 64.',
        'The relating hexagram of a reading is a different idea: it comes from changing only the moving lines of a cast. See [casting methods](/methods).',
      ] },
    ],
  };
  page.jsonld = [articleLd(page, description), crumb([['Home', '/'], ['Library', '/library'], ['Related hexagrams', page.path]])];
  return withCitation(page);
}

/* ---------- FAQ ---------- */

/** Questions and answers shown on /faq, in its FAQPage markup and in llms/faq.txt. Answers may use [text](/path) links. */
export function faqItems() {
  const y = castStatistics().methods.yarrow;
  return [
    { q: 'Does the I Ching predict the future?', a: `No. ${SITE_NAME} presents it as a tool for reflection. A reading is a prompt to think about a situation, not a forecast of events.` },
    { q: 'Is The Free I Ching free? Do I need an account?', a: 'Yes, it is free, and no account is needed. There is an optional $10 per year contribution on the web and an optional Supporter Upgrade in the iPhone and iPad app. Paying never changes the quality or availability of a reading.' },
    { q: 'Are my questions and readings stored on a server?', a: 'No. Questions, readings and journal entries are stored in your browser or on your device. Optional website analytics never receive the text of questions, readings or journal entries, and the iPhone and iPad app includes no analytics. See the [privacy page](/privacy).' },
    { q: 'How is a hexagram cast?', a: 'Six lines are built from the bottom up, and each line has a value of 6, 7, 8 or 9. You can use the yarrow-weighted digital cast or toss three coins yourself. See [casting methods](/methods).' },
    { q: 'What is a changing line?', a: 'A line with the value 6 (old yin) or 9 (old yang). It has its own line text, and it flips to its opposite to give a second figure, the relating hexagram. In both methods each line is changing 25% of the time.' },
    { q: 'How likely is a cast with no changing lines?', a: `About ${pct(y.probability_no_changing_lines)} of casts have no changing lines, in both methods. Each line is stable three times out of four, and 0.75 to the sixth power is about 0.178.` },
    { q: 'What is the difference between the yarrow and coin odds?', a: 'Both methods change a line 25% of the time and make all 64 hexagrams equally likely. The yarrow odds for 6, 7, 8 and 9 are 1/16, 5/16, 7/16 and 3/16, so old yang is three times as likely as old yin. The coin odds are 1/8, 3/8, 3/8 and 1/8. See the [yarrow](/methods/yarrow) and [three-coin](/methods/three-coin) pages.' },
    { q: 'What are the eight trigrams?', a: 'Three-line figures named Qian (Heaven), Kun (Earth), Zhen (Thunder), Xun (Wind), Kan (Water), Li (Fire), Gen (Mountain) and Dui (Lake). Every hexagram is one trigram above another, which is why there are 8 times 8 = 64 hexagrams. See [the trigrams](/trigrams).' },
    { q: 'What are nuclear, inverse and opposite hexagrams?', a: 'Three figures made from the same six lines by fixed rules: the nuclear hexagram uses the four middle lines, the inverse turns the figure upside down, and the opposite changes every line. See [the explainer](/related-hexagrams).' },
    { q: 'Where do the texts come from?', a: `The judgment, image and counsel are original contemporary paraphrases written for ${SITE_NAME}. The six line texts for each hexagram are a CC0 translation from [jesshewitt/i-ching](${LINES_SOURCE_URL}), derived from Richard Wilhelm's 1924 German edition.` },
    { q: 'Can I reuse the data?', a: `Yes. The hexagram, trigram, line change and probability data is open as JSON and CSV under CC BY 4.0 at [/data](/data). Credit "${SITE_NAME}, ${SITE_URL}/data".` },
    { q: 'Can an AI assistant query it directly?', a: `Yes. A read-only MCP server at ${SITE_URL}/mcp answers hexagram, trigram, line text and probability lookups with no key. Start at [/llms.txt](/llms.txt).` },
  ];
}

const plainText = (s) => s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1');

function faqPage() {
  const description = 'Short answers about the I Ching and The Free I Ching: prediction, cost, privacy, casting methods, changing lines, trigrams, related hexagrams, sources and open data.';
  const items = faqItems();
  const page = {
    path: '/faq',
    kind: 'faq',
    title: `I Ching questions and answers | ${SITE_NAME}`,
    description,
    h1: 'Frequently Asked Questions',
    eyebrow: 'Short answers',
    blocks: items.flatMap(({ q, a }) => [{ t: 'h3', text: q }, { t: 'p', text: a }]),
  };
  page.jsonld = [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      url: `${SITE_URL}/faq`,
      dateModified: CONTENT_UPDATED,
      inLanguage: 'en',
      mainEntity: items.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: plainText(a) },
      })),
    },
    crumb([['Home', '/'], ['FAQ', '/faq']]),
  ];
  return withCitation(page);
}

/* ---------- changelog ---------- */

/** Visible changes to the site and its open data, newest first. Add an entry whenever CONTENT_UPDATED is bumped. */
export const CHANGELOG = [
  { date: '2026-10-31', items: [
    'Added this changelog, a [FAQ page](/faq) with FAQPage markup, and an explainer on [nuclear, inverse and opposite hexagrams](/related-hexagrams).',
    'Added Hanyu Pinyin for all 64 hexagram names and 8 trigrams to the pages, the [open data](/data) (new pinyin column), llms.txt topic files and the MCP get_hexagram tool, which now also finds hexagrams by pinyin.',
    'Each hexagram page now has its own share image (shown when the page is linked in chat apps and social posts).',
    'Privacy page: product analytics are website only, the iPhone and iPad app includes none, and clicked text is masked so questions never reach analytics.',
  ] },
  { date: '2026-10-13', items: ['The web support banner shows how many yearly supporters cover hosting and upkeep.'] },
  { date: '2026-10-08', items: [
    'Public pages are now prerendered HTML: the library and all 64 hexagram pages, the trigram pages, the casting method pages and the open data page.',
    'Added markdown twins of every content page, [open data](/data) under CC BY 4.0, [/llms.txt](/llms.txt) with topic files, and a read-only MCP server at /mcp.',
    'Added optional, consent-based Google Analytics for public website pages, and a usage analytics section on the privacy page.',
  ] },
  { date: '2026-09-07', items: ['Added the two reading roles, Inquirer (meaning first) and Adept (trigrams, line values and changing-line detail), and prepared the iPhone and iPad app.'] },
];

function changelogPage() {
  const description = `What changed on ${SITE_NAME} and in its open data, with dates, newest first.`;
  const page = {
    path: '/changelog',
    kind: 'changelog',
    title: `Changelog | ${SITE_NAME}`,
    description,
    h1: 'Changelog',
    eyebrow: 'What changed and when',
    blocks: [
      { t: 'p', text: 'Changes to the public pages, the open data and the tools for AI assistants, newest first. Small fixes and behind-the-scenes work are left out.' },
      ...CHANGELOG.flatMap(({ date, items }) => [{ t: 'h3', text: formatDate(date) }, { t: 'ul', items }]),
    ],
  };
  page.jsonld = [articleLd(page, description), crumb([['Home', '/'], ['Changelog', '/changelog']])];
  return withCitation(page);
}

let pageCache = null;
export function allPages() {
  if (pageCache) return pageCache;
  pageCache = [
    homePage(),
    libraryPage(),
    ...HEXAGRAM_NUMBERS.map(hexagramPage),
    trigramsPage(),
    ...TRIGRAM_META.map((_, i) => trigramPage(i)),
    methodsPage(),
    methodPage('yarrow'),
    methodPage('three-coin'),
    dataPage(),
    relatedHexagramsPage(),
    faqPage(),
    changelogPage(),
  ];
  return pageCache;
}

export function getPage(path) {
  const clean = path.length > 1 ? path.replace(/\/$/, '') : path;
  return allPages().find((p) => p.path === clean) || null;
}

export function pageSummary(h) {
  return {
    number: h.number,
    name: h.name,
    chinese: h.chinese,
    pinyin: h.pinyin,
    upper_trigram: h.upper_trigram.name,
    lower_trigram: h.lower_trigram.name,
    url: h.url,
  };
}
