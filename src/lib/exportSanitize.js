/**
 * Traffic fields come from unauthenticated callers (user agent, path). Before
 * they are written into a file the weekly Action commits, strip anything that
 * is not plain text and mask long token-like strings so a hostile value cannot
 * inject content or trip secret scanning.
 */
export function sanitizeText(value, max = 120) {
  return String(value ?? '')
    .replace(/[^A-Za-z0-9 ._:/;()+,=@-]/g, '?')
    .replace(/[A-Za-z0-9_+/=-]{16,}/g, '[long-token]')
    .slice(0, max);
}

const TEXT_KEYS = new Set(['user_agent', 'path', 'agent']);

export function sanitizeTraffic(node) {
  if (Array.isArray(node)) return node.map(sanitizeTraffic);
  if (node && typeof node === 'object') {
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, TEXT_KEYS.has(k) && typeof v === 'string' ? sanitizeText(v) : sanitizeTraffic(v)]));
  }
  return node;
}
