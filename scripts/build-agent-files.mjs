// Runs after `vite build` and scripts/prerender.mjs: adds markdown alternate
// links and JSON-LD to the prerendered pages, and writes markdown twins, open
// data, llms.txt and well-known files into dist/.
// Set SKIP_AGENT_FILES=1 (used for the native iOS bundle) to skip everything.
import fs from 'node:fs';
import path from 'node:path';
import { SITE_URL, SITE_NAME, allPages, renderMarkdown } from '../src/lib/siteContent.js';
import { buildCatalog, buildDataFiles, buildLlmsFiles, buildWellKnown, mdPath } from '../src/lib/agentData.js';
import { SERVER_INFO, TOOL_LIST } from '../src/lib/mcpServer.js';

if (process.env.SKIP_AGENT_FILES) {
  console.log('SKIP_AGENT_FILES set, leaving dist untouched.');
  process.exit(0);
}

const dist = path.resolve('dist');
if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('dist/index.html missing. Run vite build first.');
const write = (rel, content) => {
  const file = path.join(dist, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`);
};
const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

// scripts/prerender.mjs already wrote the HTML pages. Add the markdown
// alternate link and JSON-LD to each head, and write the markdown twins.
for (const page of allPages()) {
  const htmlFile = path.join(dist, page.path === '/' ? 'index.html' : `${page.path.slice(1)}/index.html`);
  if (!fs.existsSync(htmlFile)) throw new Error(`Missing prerendered page ${htmlFile}. Run scripts/prerender.mjs first.`);
  const extra = [
    `<link rel="alternate" type="text/markdown" href="${SITE_URL}${mdPath(page.path)}" />`,
    ...(page.jsonld || []).map(jsonLd),
  ].join('\n    ');
  const html = fs.readFileSync(htmlFile, 'utf8');
  if (!html.includes('</head>')) throw new Error(`No </head> in ${htmlFile}`);
  fs.writeFileSync(htmlFile, html.replace('</head>', () => `    ${extra}\n  </head>`));
  write(mdPath(page.path).slice(1), renderMarkdown(page));
}

for (const [file, content] of Object.entries(buildDataFiles())) write(`data/${file}`, content);
write('data/index.json', buildCatalog());
for (const [file, content] of Object.entries(buildLlmsFiles())) write(file, content);
for (const [file, content] of Object.entries(buildWellKnown())) write(`.well-known/${file}`, content);
write('.well-known/mcp/server-card.json', {
  version: '1.0',
  protocolVersion: '2025-06-18',
  serverInfo: SERVER_INFO,
  description: `${SITE_NAME} read-only MCP server for I Ching lookups. No key. Reflection tool, not a prediction.`,
  documentationUrl: `${SITE_URL}/llms.txt`,
  transport: { type: 'streamable-http', endpoint: `${SITE_URL}/mcp` },
  capabilities: { tools: { listChanged: false } },
  authentication: { required: false },
  tools: TOOL_LIST.map((t) => ({ name: t.name, description: t.description })),
});
console.log(`Agent files written: ${allPages().length} pages (head extras), markdown twins, data, llms, well-known.`);
