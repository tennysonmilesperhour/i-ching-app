// Runs after `vite build`: prerenders content pages, writes markdown twins,
// open data, llms.txt, sitemap and well-known files into dist/.
// Set SKIP_AGENT_FILES=1 (used for the native iOS bundle) to skip everything.
import fs from 'node:fs';
import path from 'node:path';
import { SITE_URL, SITE_NAME, renderMarkdown } from '../src/lib/siteContent.js';
import { buildCatalog, buildDataFiles, buildLlmsFiles, buildSitemap, buildWellKnown, mdPath } from '../src/lib/agentData.js';
import { PRERENDER_PAGES, pageHtml } from '../src/lib/prerender.js';
import { SERVER_INFO, TOOL_LIST } from '../src/lib/mcpServer.js';

if (process.env.SKIP_AGENT_FILES) {
  console.log('SKIP_AGENT_FILES set, leaving dist untouched.');
  process.exit(0);
}

const dist = path.resolve('dist');
const shellPath = path.join(dist, 'index.html');
if (!fs.existsSync(shellPath)) throw new Error('dist/index.html missing. Run vite build first.');
const shell = fs.readFileSync(shellPath, 'utf8');
const write = (rel, content) => {
  const file = path.join(dist, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`);
};

// The untouched SPA shell is the fallback for app routes (see vercel.json).
write('app.html', shell);

for (const page of PRERENDER_PAGES()) {
  write(page.path === '/' ? 'index.html' : `${page.path.slice(1)}/index.html`, pageHtml(shell, page));
  write(mdPath(page.path).slice(1), renderMarkdown(page));
}

for (const [file, content] of Object.entries(buildDataFiles())) write(`data/${file}`, content);
write('data/index.json', buildCatalog());
for (const [file, content] of Object.entries(buildLlmsFiles())) write(file, content);
write('sitemap.xml', buildSitemap());
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
console.log(`Agent files written: ${PRERENDER_PAGES().length} pages, markdown twins, data, llms, sitemap.`);
