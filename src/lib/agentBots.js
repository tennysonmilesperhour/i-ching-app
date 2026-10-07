/**
 * Known AI crawlers, assistants and automation. Used by the Vercel middleware
 * to log only these, never people's browsers. Order matters: first match wins.
 * Kinds: training, search, assistant, seo, tool.
 */
export const BOTS = [
  ['OAI-SearchBot', 'OAI-SearchBot', 'search'],
  ['ChatGPT-User', 'ChatGPT-User', 'assistant'],
  ['GPTBot', 'GPTBot', 'training'],
  ['Claude-SearchBot', 'Claude-SearchBot', 'search'],
  ['Claude-User', 'Claude-User', 'assistant'],
  ['ClaudeBot', 'ClaudeBot', 'training'],
  ['anthropic-ai', 'anthropic-ai', 'training'],
  ['Perplexity-User', 'Perplexity-User', 'assistant'],
  ['PerplexityBot', 'PerplexityBot', 'search'],
  ['Google-Extended', 'Google-Extended', 'training'],
  ['GoogleOther', 'GoogleOther', 'training'],
  ['Google-Agent', 'Google-Agent', 'assistant'],
  ['Gemini', 'Gemini', 'assistant'],
  ['Googlebot', 'Googlebot', 'search'],
  ['Bingbot', 'Bingbot', 'search'],
  ['DuckAssistBot', 'DuckAssistBot', 'assistant'],
  ['DuckDuckBot', 'DuckDuckBot', 'search'],
  ['MistralAI-User', 'MistralAI-User', 'assistant'],
  ['Meta-ExternalAgent', 'Meta-ExternalAgent', 'training'],
  ['Meta-ExternalFetcher', 'Meta-ExternalFetcher', 'assistant'],
  ['Applebot-Extended', 'Applebot-Extended', 'training'],
  ['Applebot', 'Applebot', 'search'],
  ['Amazonbot', 'Amazonbot', 'search'],
  ['CCBot', 'CCBot', 'training'],
  ['Bytespider', 'Bytespider', 'training'],
  ['cohere-ai', 'cohere-ai', 'training'],
  ['Diffbot', 'Diffbot', 'training'],
  ['YouBot', 'YouBot', 'search'],
  ['PetalBot', 'PetalBot', 'search'],
  ['YandexBot', 'YandexBot', 'search'],
  ['Baiduspider', 'Baiduspider', 'search'],
  ['AhrefsBot', 'AhrefsBot', 'seo'],
  ['SemrushBot', 'SemrushBot', 'seo'],
  ['MJ12bot', 'MJ12bot', 'seo'],
  ['DotBot', 'DotBot', 'seo'],
  ['BLEXBot', 'BLEXBot', 'seo'],
  ['DataForSeoBot', 'DataForSeoBot', 'seo'],
  ['Screaming Frog', 'Screaming Frog', 'seo'],
  ['claude-code', 'claude-code', 'tool'],
  ['python-requests', 'python-requests', 'tool'],
  ['python-httpx', 'python-httpx', 'tool'],
  ['aiohttp', 'aiohttp', 'tool'],
  ['node-fetch', 'node-fetch', 'tool'],
  ['undici', 'undici', 'tool'],
  ['axios', 'axios', 'tool'],
  ['Go-http-client', 'Go-http-client', 'tool'],
  ['okhttp', 'okhttp', 'tool'],
  ['PostmanRuntime', 'PostmanRuntime', 'tool'],
  ['libwww-perl', 'libwww-perl', 'tool'],
  ['HeadlessChrome', 'HeadlessChrome', 'tool'],
  ['curl/', 'curl', 'tool'],
  ['Wget', 'Wget', 'tool'],
];

/** Paths that exist for agents. Unknown non-browser clients are logged here too. */
export const AGENT_PATH = /^\/(llms\.txt|llms\/|data\/|mcp$|\.well-known\/|sitemap\.xml|robots\.txt)|\.md$/;

export function classifyAgent(userAgent, pathname) {
  const ua = String(userAgent || '');
  const lower = ua.toLowerCase();
  for (const [needle, agent, kind] of BOTS) {
    if (lower.includes(needle.toLowerCase())) return { agent, kind };
  }
  // Unknown client on an agent file or the MCP endpoint, and not a browser.
  if (AGENT_PATH.test(pathname) && !/^mozilla\//i.test(ua)) {
    const token = ua.split(/[\s/;]/)[0] || 'empty';
    return { agent: `unknown:${token}`.slice(0, 80), kind: 'tool' };
  }
  return null;
}
