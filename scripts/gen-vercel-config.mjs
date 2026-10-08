// Generates vercel.json. The security headers, build settings and SPA rewrites
// come from the repo baseline; this script adds /mcp and the agent file
// headers (headers need one entry per markdown twin so each can
// carry its own canonical Link header). Run `npm run gen:vercel` after changes.
import fs from 'node:fs';
import { SITE_URL, allPages } from '../src/lib/siteContent.js';
import { mdPath } from '../src/lib/agentData.js';

export function buildVercelConfig() {
  const cors = { key: 'Access-Control-Allow-Origin', value: '*' };
  return {
    $schema: 'https://openapi.vercel.sh/vercel.json',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    trailingSlash: false,
    rewrites: [
      { source: '/mcp', destination: '/api/mcp' },
      ...['/reading/:id', '/journal', '/timeline', '/privacy', '/support', '/support/thanks', '/supporter', '/login', '/signup', '/profile']
        .map((source) => ({ source, destination: '/spa.html' })),
    ],
    headers: [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
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
