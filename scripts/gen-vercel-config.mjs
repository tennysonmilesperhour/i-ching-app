// Generates vercel.json (headers need one entry per markdown twin so each can
// carry its own canonical Link header). Run `npm run gen:vercel` after changes.
import fs from 'node:fs';
import { SITE_URL, allPages } from '../src/lib/siteContent.js';
import { mdPath } from '../src/lib/agentData.js';

export function buildVercelConfig() {
  const cors = { key: 'Access-Control-Allow-Origin', value: '*' };
  return {
    $schema: 'https://openapi.vercel.sh/vercel.json',
    rewrites: [
      { source: '/mcp', destination: '/api/mcp' },
      { source: '/((?!api/|llms/|data/|\\.well-known/).*)', destination: '/app.html' },
    ],
    headers: [
      ...allPages().map((p) => ({
        source: mdPath(p.path),
        headers: [
          { key: 'Content-Type', value: 'text/markdown; charset=utf-8' },
          { key: 'Link', value: `<${SITE_URL}${p.path === '/' ? '/' : p.path}>; rel="canonical"` },
        ],
      })),
      { source: '/llms.txt', headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }, cors] },
      { source: '/llms/:file', headers: [{ key: 'Content-Type', value: 'text/plain; charset=utf-8' }, cors] },
      { source: '/data/:file.json', headers: [{ key: 'Content-Type', value: 'application/json; charset=utf-8' }, cors] },
      { source: '/data/:file.csv', headers: [{ key: 'Content-Type', value: 'text/csv; charset=utf-8' }, cors] },
      { source: '/.well-known/api-catalog', headers: [{ key: 'Content-Type', value: 'application/linkset+json' }, cors] },
      { source: '/.well-known/mcp/server-card.json', headers: [{ key: 'Content-Type', value: 'application/json; charset=utf-8' }, cors] },
    ],
  };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  fs.writeFileSync('vercel.json', `${JSON.stringify(buildVercelConfig(), null, 2)}\n`);
  console.log('vercel.json written');
}
