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
  TRIGRAMS,
  getLinesForHexagram,
  getTrigrams,
  hexagramFromLines,
  castYarrowLine,
} from './hexagramData.js';
import { HEXAGRAM_INTERPRETATIONS } from './hexagramInterpretations.js';

export const SITE_URL = 'https://thefreeiching.com';
export const SITE_NAME = 'The Free I Ching';
export const CONTENT_UPDATED = '2026-10-07';
export const LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';
export const REFLECTION_NOTICE = 'The I Ching is a tool for reflection, not a prediction. Nothing here forecasts events or replaces professional advice.';
export const LINES_SOURCE_URL = 'https://github.com/jesshewitt/i-ching';

const TRIGRAM_META = [
  { slug: 'kun', family: 'Mother', lines: '000', image: 'Earth' },
  { slug: 'zhen', family: 'Eldest son', lines: '100', image: 'Thunder' },
  { slug: 'kan', family: 'Middle son', lines: '010', image: 'Water' },
  { slug: 'dui', family: 'Youngest daughter', lines: '110', image: 'Lake' },
  { slug: 'gen', family: 'Youngest son', lines: '001', image: 'Mountain' },
  { slug: 'li', family: 'Middle daughter', lines: '101', image: 'Fire' },
  { slug: 'xun', family: 'Eldest daughter', lines: '011', image: 'Wind' },
  { slug: 'qian', family: 'Father', lines: '111', image: 'Heaven' },
];

export const HEXAGRAM_NUMBERS = Array.from({ length: 64 }, (_, i) => i + 1);

const flip = (v) => (v === 7 ? 8 : 7);
const firstSentence = (text) => text.split(/(?<=[.!?])\s/)[0];
const pct = (x) => `${Number((x * 100).toFixed(2))}%`;

export function hexagramPath(n) { return `/library/${n}`; }
export function trigramPath(slug) { return `/trigrams/${slug}`; }
export function hexagramUrl(n) { return `${SITE_URL}${hexagramPath(n)}`; }

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
    eyebrow: `${h.chinese} · King Wen sequence ${n} of 64`,
    blocks: [
      { t: 'figure', lines, label: `Hexagram ${n}, ${h.name}` },
      { t: 'facts', items: [
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
      { t: 'h2', text: 'If one line changes' },
      { t: 'table', head: ['Changing line', 'Relating hexagram'], rows: h.single_line_changes.map((c) => [`Line ${c.line}`, link(c.relating_hexagram)]) },
      { t: 'p', text: `Previous: ${n > 1 ? link(n - 1) : 'none'}. Next: ${n < 64 ? link(n + 1) : 'none'}. [All sixty-four hexagrams](/library).` },
      { t: 'note', text: `The judgment, image and counsel are original contemporary paraphrases written for ${SITE_NAME}. The line text is the CC0 translation from [jesshewitt/i-ching](${LINES_SOURCE_URL}), derived from Richard Wilhelm's 1924 German edition.` },
    ],
  };
  page.jsonld = [articleLd(page, description), crumb([['Home', '/'], ['Library', '/library'], [`Hexagram ${n}`, page.path]])];
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
      { t: 'table', head: ['No.', 'Hexagram', 'Trigrams (upper over lower)', 'Summary'], rows: ALL_HEXAGRAMS.map((h) => [h.number, `[${h.name} ${h.chinese}](${hexagramPath(h.number)})`, `${h.upper_trigram.element} over ${h.lower_trigram.element}`, firstSentence(h.judgment)]) },
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
        ['Symbol', `${t.symbol} ${t.chinese}`],
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
      { t: 'table', head: ['Trigram', 'Image', 'Quality', 'Family role', 'Lines'], rows: ALL_TRIGRAMS.map((t) => [`[${t.name} ${t.chinese} ${t.symbol}](${trigramPath(t.slug)})`, t.element, t.attribute, t.family, t.lines_bottom_to_top]) },
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
  { file: 'hexagrams.json', csv: 'hexagrams.csv', name: 'The 64 hexagrams', description: 'King Wen number, English name, Chinese name, upper and lower trigram, line pattern, nuclear, inverse and opposite hexagram, and a short contemporary judgment for each of the 64 hexagrams.', license: 'CC BY 4.0', rows: 64 },
  { file: 'trigrams.json', csv: 'trigrams.csv', name: 'The 8 trigrams', description: 'Name, Chinese character, symbol, natural image, quality, family role and line pattern for each of the eight trigrams.', license: 'CC BY 4.0', rows: 8 },
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
        'Browse all sixty-four hexagrams in the [library](/library) and the [eight trigrams](/trigrams).',
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
    upper_trigram: h.upper_trigram.name,
    lower_trigram: h.lower_trigram.name,
    url: h.url,
  };
}
