/** Open data files and llms.txt text, built from siteContent.js. */
import {
  ALL_HEXAGRAMS,
  ALL_TRIGRAMS,
  CONTENT_UPDATED,
  DATA_FILES,
  LICENSE_URL,
  LINES_SOURCE_URL,
  REFLECTION_NOTICE,
  SITE_NAME,
  SITE_URL,
  castStatistics,
} from './siteContent.js';

const ATTRIBUTION = `${SITE_NAME}, ${SITE_URL}/data`;

const metaFor = (d) => ({
  name: d.name,
  description: d.description,
  license: d.license,
  license_url: d.license === 'CC0 1.0' ? 'https://creativecommons.org/publicdomain/zero/1.0/' : LICENSE_URL,
  attribution: d.license === 'CC0 1.0' ? `Third-party text from ${LINES_SOURCE_URL} (CC0, no credit required, credit appreciated). Compiled by ${SITE_NAME}.` : ATTRIBUTION,
  source: SITE_URL,
  updated: CONTENT_UPDATED,
  notice: REFLECTION_NOTICE,
});

const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCsv = (columns, rows) => [columns.join(','), ...rows.map((r) => columns.map((c) => csvCell(r[c])).join(','))].join('\n') + '\n';

const meta = (file) => metaFor(DATA_FILES.find((d) => d.file === file));

export function buildDataFiles() {
  const hexRows = ALL_HEXAGRAMS.map((h) => ({
    number: h.number,
    name: h.name,
    chinese: h.chinese,
    upper_trigram: h.upper_trigram.name,
    lower_trigram: h.lower_trigram.name,
    upper_element: h.upper_trigram.element,
    lower_element: h.lower_trigram.element,
    lines_bottom_to_top: h.lines_bottom_to_top,
    nuclear_hexagram: h.nuclear_hexagram,
    inverse_hexagram: h.inverse_hexagram,
    opposite_hexagram: h.opposite_hexagram,
    judgment: h.judgment,
    url: h.url,
  }));
  const trigramRows = ALL_TRIGRAMS.map((t) => ({
    name: t.name, chinese: t.chinese, symbol: t.symbol, element: t.element, quality: t.attribute, family_role: t.family, lines_bottom_to_top: t.lines_bottom_to_top, url: t.url,
  }));
  const changeRows = ALL_HEXAGRAMS.flatMap((h) => h.single_line_changes.map((c) => ({
    hexagram: h.number,
    hexagram_name: h.name,
    changing_line: c.line,
    relating_hexagram: c.relating_hexagram,
    relating_name: ALL_HEXAGRAMS[c.relating_hexagram - 1].name,
  })));
  const lineRows = ALL_HEXAGRAMS.flatMap((h) => h.line_texts.map((text, i) => ({
    hexagram: h.number,
    hexagram_name: h.name,
    line: i + 1,
    text,
  })));
  const stats = castStatistics();
  const probability = {
    ...meta('cast-probabilities.json'),
    line_value_key: '6 = old yin (changing), 7 = young yang, 8 = young yin, 9 = old yang (changing)',
    hexagram_index_note: 'Arrays for hexagram probabilities are indexed by King Wen number minus one.',
    methods: stats.methods,
  };
  return {
    'hexagrams.json': { ...meta('hexagrams.json'), hexagrams: hexRows },
    'hexagrams.csv': toCsv(Object.keys(hexRows[0]), hexRows),
    'trigrams.json': { ...meta('trigrams.json'), trigrams: trigramRows },
    'trigrams.csv': toCsv(Object.keys(trigramRows[0]), trigramRows),
    'line-changes.json': { ...meta('line-changes.json'), rows: changeRows },
    'line-changes.csv': toCsv(Object.keys(changeRows[0]), changeRows),
    'cast-probabilities.json': probability,
    'hexagram-lines.json': { ...meta('hexagram-lines.json'), rows: lineRows },
    'hexagram-lines.csv': toCsv(Object.keys(lineRows[0]), lineRows),
  };
}

export function buildCatalog() {
  return {
    name: `${SITE_NAME} open data catalog`,
    url: `${SITE_URL}/data/index.json`,
    human_page: `${SITE_URL}/data`,
    updated: CONTENT_UPDATED,
    how_to_cite: `${ATTRIBUTION}, licensed CC BY 4.0`,
    datasets: DATA_FILES.map((d) => ({
      name: d.name,
      description: d.description,
      license: d.license,
      license_url: d.license === 'CC0 1.0' ? 'https://creativecommons.org/publicdomain/zero/1.0/' : LICENSE_URL,
      rows: d.rows,
      formats: [
        { format: 'json', url: `${SITE_URL}/data/${d.file}` },
        ...(d.csv ? [{ format: 'csv', url: `${SITE_URL}/data/${d.csv}` }] : []),
      ],
    })),
  };
}

/* ---------- llms.txt and topic files ---------- */

const firstSentence = (t) => t.split(/(?<=[.!?])\s/)[0];

export function buildLlmsFiles() {
  const root = `# ${SITE_NAME}

> Free, quiet I Ching oracle and reference at ${SITE_URL}. Cast a reading, browse all 64 hexagrams and 8 trigrams, read changing-line text. ${REFLECTION_NOTICE}

## How to cite
- Cite the page you used, with its URL and the "updated" date shown on the page.
- Format: ${SITE_NAME}. "Hexagram 1: The Creative." ${SITE_URL}/library/1
- Short quotations with a link back are welcome. Do not republish whole pages.
- Open data (JSON, CSV) is CC BY 4.0: credit "${ATTRIBUTION}".
- Changing-line texts are third-party CC0 text from ${LINES_SOURCE_URL}.

## Key facts
- 64 hexagrams in the King Wen sequence, 8 trigrams, 384 line texts (6 per hexagram).
- Two casting methods: yarrow-weighted digital cast (line odds 6: 1/16, 7: 5/16, 8: 7/16, 9: 3/16) and a three-coin method (heads 3, tails 2; odds 1/8, 3/8, 3/8, 1/8).
- In both methods each line changes 25% of the time, about 17.8% of casts have no changing lines, and each primary hexagram has a 1/64 chance.
- Two reading roles: Inquirer (meaning first) and Adept (trigrams, line values, changing lines, method detail).
- Free to use, no account needed. Readings and journal entries stay on the user's device. Optional $10/year contribution on the web, optional Supporter Upgrade in the iOS app.
- The judgment, image and counsel texts are original contemporary paraphrases, not classical translations.
- The I Ching here is a reflection tool. It does not predict events.

## Topic files (each small enough to read whole)
- [Hexagram index](${SITE_URL}/llms/hexagrams.txt): all 64 with names, trigrams and one-line summaries
- [Judgments](${SITE_URL}/llms/judgments.txt): the full contemporary judgment for each hexagram
- [Trigrams](${SITE_URL}/llms/trigrams.txt): the eight trigrams
- [Methods](${SITE_URL}/llms/methods.txt): casting methods and exact probabilities
- [FAQ](${SITE_URL}/llms/faq.txt): common questions with short answers

## Data and tools
- [Open data page](${SITE_URL}/data) and [catalog](${SITE_URL}/data/index.json): JSON and CSV, CC BY 4.0
- [Hexagrams JSON](${SITE_URL}/data/hexagrams.json), [CSV](${SITE_URL}/data/hexagrams.csv)
- [Cast probabilities](${SITE_URL}/data/cast-probabilities.json)
- [Line change table](${SITE_URL}/data/line-changes.csv)
- Read-only MCP server, no key: ${SITE_URL}/mcp (tools: get_hexagram, get_trigram, find_hexagram_by_trigrams, get_line_text, get_cast_statistics, cast_reading)
- [Server card](${SITE_URL}/.well-known/mcp/server-card.json), [API catalog](${SITE_URL}/.well-known/api-catalog)
- Every content page has a markdown twin: same URL plus .md (home is ${SITE_URL}/index.md)

## Main pages
- [Home](${SITE_URL}/)
- [Hexagram library](${SITE_URL}/library)
- [Trigrams](${SITE_URL}/trigrams)
- [Casting methods](${SITE_URL}/methods): [yarrow](${SITE_URL}/methods/yarrow), [three coin](${SITE_URL}/methods/three-coin)
- [Sitemap](${SITE_URL}/sitemap.xml)

Last updated: ${CONTENT_UPDATED}
`;

  const hexagrams = `# Hexagram index

All 64 hexagrams in King Wen order. Each line: number, name, Chinese name, upper trigram over lower trigram, one-line summary, page. Full text: ${SITE_URL}/library/N (add .md for markdown).

${ALL_HEXAGRAMS.map((h) => `${h.number}. ${h.name} ${h.chinese} | ${h.upper_trigram.name} (${h.upper_trigram.element}) over ${h.lower_trigram.name} (${h.lower_trigram.element}) | ${firstSentence(h.judgment)} | ${h.url}`).join('\n')}

${REFLECTION_NOTICE}
Source: ${SITE_NAME}, ${SITE_URL}/library. Updated ${CONTENT_UPDATED}.
`;

  const judgments = `# Contemporary judgments for all 64 hexagrams

Original paraphrases written for ${SITE_NAME}, not classical translations. Quote with a link to the hexagram page. Image, counsel and line texts are on each page.

${ALL_HEXAGRAMS.map((h) => `## ${h.number}. ${h.name} ${h.chinese}\n${h.judgment}\nPage: ${h.url}`).join('\n\n')}

${REFLECTION_NOTICE}
Source: ${SITE_NAME}, ${SITE_URL}/library. Updated ${CONTENT_UPDATED}.
`;

  const trigrams = `# The eight trigrams

Lines are listed bottom to top, 1 = solid yang, 0 = broken yin.

${ALL_TRIGRAMS.map((t) => `## ${t.name} ${t.chinese} ${t.symbol}\nImage: ${t.element}. Quality: ${t.attribute}. Family role: ${t.family}. Lines: ${t.lines_bottom_to_top}.\nPage: ${t.url}`).join('\n\n')}

Each hexagram is an upper trigram over a lower trigram: 8 x 8 = 64.
Source: ${SITE_NAME}, ${SITE_URL}/trigrams. Updated ${CONTENT_UPDATED}.
`;

  const s = castStatistics().methods;
  const row = (m) => Object.entries(s[m].line_probabilities).map(([k, v]) => `${k}=${v}`).join(', ');
  const methods = `# Casting methods

Line values: 6 = old yin (changing), 7 = young yang, 8 = young yin, 9 = old yang (changing). Lines are built from the bottom up. Changing lines flip to give the relating hexagram.

## Yarrow-weighted digital cast
Odds per line: ${row('yarrow')}. Random numbers come from the browser cryptography API. Page: ${SITE_URL}/methods/yarrow

## Three-coin method
Heads = 3, tails = 2, three coins per line, six tosses entered by the user. Odds per line: ${row('coin')}. Page: ${SITE_URL}/methods/three-coin

## Shared facts
- Probability a line is changing: 0.25 in both methods.
- Probability a cast has no changing lines: ${s.yarrow.probability_no_changing_lines.toFixed(4)} in both methods.
- Probability of each primary hexagram: 1/64 in both methods.
- Exact tables: ${SITE_URL}/data/cast-probabilities.json

${REFLECTION_NOTICE}
Source: ${SITE_NAME}, ${SITE_URL}/methods. Updated ${CONTENT_UPDATED}.
`;

  const faq = `# Frequently asked questions

## Does the I Ching predict the future?
No. ${SITE_NAME} presents it as a tool for reflection. A reading is a prompt to think about a situation, not a forecast.

## Is it free?
Yes. No account is needed. There is an optional $10 per year contribution on the web and an optional Supporter Upgrade in the iPhone and iPad app. Payment never changes the quality or availability of a reading.

## Are my questions and readings stored on a server?
Questions, readings and journal entries are stored on the user's own device or browser. See ${SITE_URL}/privacy.

## How is a hexagram cast?
Six lines are built from the bottom up. Each line is 6, 7, 8 or 9. See ${SITE_URL}/methods.

## What is a changing line?
A line with value 6 or 9. It carries its own text and flips to give a second, relating hexagram. Each line changes 25% of the time.

## Where do the texts come from?
The judgment, image and counsel are original contemporary paraphrases. The six line texts per hexagram are a CC0 translation from ${LINES_SOURCE_URL}, derived from Richard Wilhelm's 1924 German edition.

## Can I reuse the data?
Yes. JSON and CSV under CC BY 4.0 at ${SITE_URL}/data. Credit "${ATTRIBUTION}".

## Can an AI assistant query it directly?
Yes, through the read-only MCP server at ${SITE_URL}/mcp, no key needed.

Updated ${CONTENT_UPDATED}.
`;

  return {
    'llms.txt': root,
    'llms/hexagrams.txt': hexagrams,
    'llms/judgments.txt': judgments,
    'llms/trigrams.txt': trigrams,
    'llms/methods.txt': methods,
    'llms/faq.txt': faq,
  };
}

export function mdPath(pagePath) {
  return pagePath === '/' ? '/index.md' : `${pagePath}.md`;
}

export function buildWellKnown() {
  return {
    'api-catalog': {
      linkset: [
        {
          anchor: `${SITE_URL}/mcp`,
          'service-desc': [{ href: `${SITE_URL}/.well-known/mcp/server-card.json`, type: 'application/json' }],
          'service-doc': [{ href: `${SITE_URL}/llms.txt`, type: 'text/plain' }],
        },
        {
          anchor: `${SITE_URL}/data/index.json`,
          item: DATA_FILES.map((d) => ({ href: `${SITE_URL}/data/${d.file}`, type: 'application/json' })),
          'service-doc': [{ href: `${SITE_URL}/data`, type: 'text/html' }],
        },
      ],
    },
  };
}
