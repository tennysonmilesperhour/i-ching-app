// Weekly agent-access export: checks the live agent surface, pulls the traffic
// summary (if the log database is configured), prunes old rows, and writes
// docs/agent-review/YYYY-MM-DD.json. Run by .github/workflows/agent-review.yml.
import fs from 'node:fs';
import path from 'node:path';

const base = (process.env.BASE_URL || 'https://thefreeiching.com').replace(/\/$/, '');
const dbUrl = (process.env.AGENT_LOG_SUPABASE_URL || '').replace(/\/$/, '');
const dbKey = process.env.AGENT_LOG_SERVICE_KEY || '';
const days = Number(process.env.REVIEW_DAYS || 7);
const outDir = process.env.OUT_DIR || 'docs/agent-review';
const date = new Date().toISOString().slice(0, 10);

const checks = [];
const check = async (name, fn) => {
  try {
    const detail = await fn();
    checks.push({ name, ok: true, detail: detail ?? null });
  } catch (err) {
    checks.push({ name, ok: false, detail: String(err.message || err) });
  }
};
const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const get = async (p, init) => {
  const res = await fetch(`${base}${p}`, { ...init, headers: { 'user-agent': 'thefreeiching-weekly-review/1.0', ...(init?.headers || {}) } });
  return res;
};
const rpc = async (p, body) => {
  const res = await fetch(`${base}${p}`, { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'thefreeiching-weekly-review/1.0' }, body: JSON.stringify(body) });
  must(res.ok, `${p} returned ${res.status}`);
  return res.json();
};

await check('robots.txt has Content-Signal and sitemap', async () => {
  const t = await (await get('/robots.txt')).text();
  must(/Content-Signal:\s*search=yes/.test(t) && /Sitemap:/.test(t), 'missing Content-Signal or Sitemap');
});
await check('llms.txt under 10 KB with topic links', async () => {
  const res = await get('/llms.txt'); const t = await res.text();
  must(res.ok, `status ${res.status}`); must(Buffer.byteLength(t) < 10240, 'llms.txt is 10 KB or larger');
  must(/\/llms\/hexagrams\.txt/.test(t), 'missing topic links');
  return { bytes: Buffer.byteLength(t) };
});
await check('topic files each under 60 KB', async () => {
  const t = await (await get('/llms.txt')).text();
  const urls = [...t.matchAll(/\((https?:[^)]*\/llms\/[^)]+)\)/g)].map((m) => m[1]);
  must(urls.length >= 4, 'few topic links');
  const sizes = {};
  for (const u of urls) { const r = await get(new URL(u).pathname); must(r.ok, `${u} ${r.status}`); const b = (await r.text()).length; must(b < 60 * 1024, `${u} too big`); sizes[u] = b; }
  return sizes;
});
await check('data catalog and every data file load', async () => {
  const cat = await (await get('/data/index.json')).json();
  const out = {};
  for (const d of cat.datasets) for (const f of d.formats) {
    const p = new URL(f.url).pathname; const r = await get(p); must(r.ok, `${p} ${r.status}`);
    const text = await r.text(); if (f.format === 'json') JSON.parse(text);
    out[p] = text.length;
  }
  const hex = await (await get('/data/hexagrams.json')).json();
  must(hex.hexagrams.length === 64, 'hexagrams.json is not 64 rows');
  return out;
});
await check('prerendered hexagram page has real HTML and markdown twin', async () => {
  const html = await (await get('/library/1')).text();
  must(html.includes('Contemporary judgment') && html.includes('application/ld+json') && html.includes('rel="alternate" type="text/markdown"'), 'static HTML missing content, JSON-LD or alternate link');
  const md = await get('/library/1.md');
  must(md.ok && /text\/markdown/.test(md.headers.get('content-type') || ''), 'markdown twin missing or wrong content type');
  must(/rel="canonical"/.test(md.headers.get('link') || ''), 'markdown twin lacks canonical Link header');
});
await check('sitemap lists the content pages', async () => {
  const t = await (await get('/sitemap.xml')).text();
  const n = (t.match(/<loc>/g) || []).length; must(n >= 70, `only ${n} urls`); return { urls: n };
});
await check('well-known files', async () => {
  must((await get('/.well-known/api-catalog')).ok, 'api-catalog missing');
  const card = await (await get('/.well-known/mcp/server-card.json')).json();
  must(card.transport?.endpoint?.endsWith('/mcp'), 'server card endpoint');
});
await check('MCP server answers initialize, tools/list and a tool call', async () => {
  const post = async (b) => (await get('/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }));
  const init = await (await post({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } })).json();
  must(init.result?.serverInfo?.name, 'initialize failed');
  const list = await (await post({ jsonrpc: '2.0', id: 2, method: 'tools/list' })).json();
  must(list.result.tools.length >= 3, 'tools/list too small');
  const call = await (await post({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_hexagram', arguments: { query: '24' } } })).json();
  must(call.result.structuredContent.cite.url.endsWith('/library/24'), 'tool answer lacks citation url');
  must((await post({ jsonrpc: '2.0', method: 'notifications/initialized' })).status === 202, 'notification not 202');
  return { tools: list.result.tools.map((t) => t.name) };
});

let traffic = { status: 'not_configured', note: 'Set AGENT_LOG_SUPABASE_URL and AGENT_LOG_SERVICE_KEY to enable the traffic summary and pruning.' };
if (dbUrl && dbKey) {
  const call = async (fn, body) => {
    const res = await fetch(`${dbUrl}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { 'content-type': 'application/json', apikey: dbKey, authorization: `Bearer ${dbKey}` }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`${fn} ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return res.json();
  };
  try {
    const summary = await call('agent_hits_summary', { p_days: days });
    const pruned = await call('prune_agent_hits', { p_days: 180 });
    traffic = { status: 'ok', summary, pruned_rows_older_than_180_days: pruned };
  } catch (err) {
    traffic = { status: 'error', error: String(err.message || err) };
    checks.push({ name: 'traffic summary', ok: false, detail: traffic.error });
  }
}

const failed = checks.filter((c) => !c.ok);
fs.mkdirSync(outDir, { recursive: true });
const file = path.join(outDir, `${date}.json`);
fs.writeFileSync(file, `${JSON.stringify({ date, base_url: base, days, checks, failed_checks: failed.length, traffic }, null, 2)}\n`);
console.log(`Wrote ${file}: ${checks.length - failed.length}/${checks.length} checks ok, traffic ${traffic.status}.`);
for (const f of failed) console.log(`FAILED ${f.name}: ${f.detail}`);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `failed=${failed.length}\nfile=${file}\n`);
