import { next, waitUntil } from '@vercel/functions';
import { classifyAgent } from './src/lib/agentBots.js';

// Skip static assets. Everything else is checked, but only known bots and
// non-browser clients on agent files are ever written down.
export const config = {
  matcher: ['/((?!assets/|icons/|apple-touch-icon|manifest.json|favicon).*)'],
};

export default function middleware(request) {
  const url = new URL(request.url);
  const hit = classifyAgent(request.headers.get('user-agent'), url.pathname);
  const base = process.env.AGENT_LOG_SUPABASE_URL;
  const key = process.env.AGENT_LOG_SERVICE_KEY;
  if (hit && base && key) {
    waitUntil(
      fetch(`${base.replace(/\/$/, '')}/rest/v1/rpc/log_agent_hit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', apikey: key, authorization: `Bearer ${key}` },
        body: JSON.stringify({
          p_agent: hit.agent,
          p_kind: hit.kind,
          p_path: url.pathname,
          p_user_agent: request.headers.get('user-agent') || '',
        }),
      }).catch(() => {}),
    );
  }
  return next();
}
