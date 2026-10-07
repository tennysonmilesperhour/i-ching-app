/**
 * Read-only MCP server logic: stateless Streamable HTTP, one JSON-RPC message
 * per POST, JSON response. Used by api/mcp.js. No keys, no stored data.
 */
import {
  ALL_HEXAGRAMS,
  ALL_TRIGRAMS,
  REFLECTION_NOTICE,
  SITE_NAME,
  SITE_URL,
  castLines,
  castStatistics,
  describeCast,
  findHexagram,
  findTrigram,
  hexagramFromTrigrams,
  pageSummary,
} from './siteContent.js';

export const SERVER_INFO = { name: 'thefreeiching', title: SITE_NAME, version: '1.0.0' };
const SUPPORTED_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

const cite = (url, title) => ({ url, text: `${SITE_NAME}, ${title}. ${url}` });

const hexagramView = (h) => ({
  number: h.number,
  name: h.name,
  chinese: h.chinese,
  upper_trigram: h.upper_trigram.name,
  lower_trigram: h.lower_trigram.name,
  lines_bottom_to_top: h.lines_bottom_to_top,
  judgment: h.judgment,
  image: h.image,
  counsel: h.counsel,
  nuclear_hexagram: h.nuclear_hexagram,
  inverse_hexagram: h.inverse_hexagram,
  opposite_hexagram: h.opposite_hexagram,
  line_texts: h.line_texts,
  line_texts_source: 'CC0 translation from https://github.com/jesshewitt/i-ching',
  notice: REFLECTION_NOTICE,
  cite: cite(h.url, `Hexagram ${h.number}: ${h.name}`),
});

class ToolError extends Error {}

const TOOLS = [
  {
    name: 'get_hexagram',
    description: 'Look up one I Ching hexagram by King Wen number (1 to 64), English name or Chinese name. Returns trigrams, line pattern, contemporary judgment, image, counsel, the six line texts and related hexagrams.',
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Number such as "24", name such as "Return" or "The Creative", or a Chinese name such as "復".' } }, required: ['query'], additionalProperties: false },
    run({ query }) {
      const { match, candidates } = findHexagram(query);
      if (match) return hexagramView(match);
      if (candidates.length) return { message: 'More than one hexagram matches. Ask again with a number or full name.', candidates: candidates.map(pageSummary) };
      throw new ToolError(`No hexagram matches "${query}". Use a number from 1 to 64 or an English or Chinese name.`);
    },
  },
  {
    name: 'get_trigram',
    description: 'Look up one of the eight trigrams by name (Qian, Kun, Zhen, Xun, Kan, Li, Gen, Dui), natural image (Heaven, Earth, Thunder, Wind, Water, Fire, Mountain, Lake) or Chinese character. Lists the hexagrams that use it.',
    inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false },
    run({ query }) {
      const t = findTrigram(query);
      if (!t) throw new ToolError(`No trigram matches "${query}".`);
      return {
        ...t,
        hexagrams_with_trigram_above: ALL_HEXAGRAMS.filter((h) => h.upper_trigram.slug === t.slug).map(pageSummary),
        hexagrams_with_trigram_below: ALL_HEXAGRAMS.filter((h) => h.lower_trigram.slug === t.slug).map(pageSummary),
        cite: cite(t.url, `Trigram ${t.name}`),
      };
    },
  },
  {
    name: 'find_hexagram_by_trigrams',
    description: 'Find the hexagram made by an upper trigram over a lower trigram.',
    inputSchema: { type: 'object', properties: { upper: { type: 'string' }, lower: { type: 'string' } }, required: ['upper', 'lower'], additionalProperties: false },
    run({ upper, lower }) {
      const h = hexagramFromTrigrams(upper, lower);
      if (!h) throw new ToolError('Both upper and lower must be trigram names, images or characters.');
      return hexagramView(h);
    },
  },
  {
    name: 'get_line_text',
    description: 'Get the classical text of one line of a hexagram. Lines are numbered 1 (bottom) to 6 (top). This is the text read when that line is changing in a cast.',
    inputSchema: { type: 'object', properties: { hexagram: { type: 'string', description: 'Number or name.' }, line: { type: 'integer', minimum: 1, maximum: 6 } }, required: ['hexagram', 'line'], additionalProperties: false },
    run({ hexagram, line }) {
      const { match } = findHexagram(hexagram);
      if (!match) throw new ToolError(`No single hexagram matches "${hexagram}".`);
      if (!Number.isInteger(line) || line < 1 || line > 6) throw new ToolError('line must be an integer from 1 to 6.');
      const change = match.single_line_changes[line - 1];
      return {
        hexagram: match.number,
        name: match.name,
        line,
        text: match.line_texts[line - 1],
        relating_hexagram_if_only_this_line_changes: pageSummary(ALL_HEXAGRAMS[change.relating_hexagram - 1]),
        text_source: 'CC0 translation from https://github.com/jesshewitt/i-ching',
        cite: cite(match.url, `Hexagram ${match.number}, line ${line}`),
      };
    },
  },
  {
    name: 'get_cast_statistics',
    description: 'Exact probabilities for the yarrow-weighted and three-coin casting methods: line value odds, chance of changing lines, and how likely each hexagram is as a relating hexagram.',
    inputSchema: { type: 'object', properties: { method: { type: 'string', enum: ['yarrow', 'coin'] } }, additionalProperties: false },
    run({ method } = {}) {
      const all = castStatistics().methods;
      if (method && !all[method]) throw new ToolError('method must be "yarrow" or "coin".');
      return {
        methods: method ? { [method]: all[method] } : all,
        hexagram_index_note: 'Hexagram probability arrays are indexed by King Wen number minus one.',
        cite: cite(`${SITE_URL}/methods`, 'Casting methods'),
        data: `${SITE_URL}/data/cast-probabilities.json`,
      };
    },
  },
  {
    name: 'cast_reading',
    description: `Draw a random six-line cast with changing lines and a relating hexagram. This is a REFLECTION tool, not a prediction: it does not forecast events. Do not present the result as telling the future. Nothing is stored.`,
    inputSchema: { type: 'object', properties: { method: { type: 'string', enum: ['yarrow', 'coin'], description: 'Odds to use. Defaults to yarrow.' } }, additionalProperties: false },
    run({ method = 'yarrow' } = {}) {
      if (method !== 'yarrow' && method !== 'coin') throw new ToolError('method must be "yarrow" or "coin".');
      const cast = describeCast(castLines(method), method);
      return {
        label: 'Reflection tool, not a prediction',
        ...cast,
        primary_hexagram: hexagramView(cast.primary_hexagram),
        relating_hexagram: cast.relating_hexagram ? hexagramView(cast.relating_hexagram) : null,
        cite: cite(`${SITE_URL}/methods/${method === 'coin' ? 'three-coin' : 'yarrow'}`, 'Casting method'),
      };
    },
  },
];

export const TOOL_LIST = TOOLS.map(({ name, description, inputSchema }) => ({
  name, description, inputSchema, annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
}));

function callTool(params) {
  const tool = TOOLS.find((t) => t.name === params?.name);
  if (!tool) return { error: { code: -32602, message: `Unknown tool: ${params?.name}` } };
  const args = params.arguments && typeof params.arguments === 'object' ? params.arguments : {};
  try {
    const result = tool.run(args);
    return { result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], structuredContent: result, isError: false } };
  } catch (err) {
    if (!(err instanceof ToolError)) throw err;
    return { result: { content: [{ type: 'text', text: err.message }], isError: true } };
  }
}

/** Handle one JSON-RPC message. Returns { status, body } (body null for 202). */
export function handleMessage(msg) {
  if (!msg || typeof msg !== 'object' || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    return { status: 400, body: { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } } };
  }
  const isNotification = msg.id === undefined || msg.id === null;
  if (isNotification) return { status: 202, body: null };
  const reply = (payload) => ({ status: 200, body: { jsonrpc: '2.0', id: msg.id, ...payload } });
  switch (msg.method) {
    case 'initialize': {
      const asked = msg.params?.protocolVersion;
      return reply({ result: {
        protocolVersion: SUPPORTED_VERSIONS.includes(asked) ? asked : SUPPORTED_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: `Read-only lookups for the I Ching (64 hexagrams, 8 trigrams). Cite the url in each answer. ${REFLECTION_NOTICE}`,
      } });
    }
    case 'ping': return reply({ result: {} });
    case 'tools/list': return reply({ result: { tools: TOOL_LIST } });
    case 'tools/call': return reply(callTool(msg.params));
    default: return reply({ error: { code: -32601, message: `Method not found: ${msg.method}` } });
  }
}

export function handlePost(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch {
    return { status: 400, body: { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } } };
  }
  if (Array.isArray(parsed)) {
    const results = parsed.map(handleMessage).filter((r) => r.body);
    return results.length ? { status: 200, body: results.map((r) => r.body) } : { status: 202, body: null };
  }
  return handleMessage(parsed);
}

export const SERVER_DESCRIPTION = {
  name: SERVER_INFO.name,
  description: `${SITE_NAME} read-only MCP server. POST one JSON-RPC 2.0 message per request (initialize, ping, tools/list, tools/call). No key, no stored data. ${REFLECTION_NOTICE}`,
  endpoint: `${SITE_URL}/mcp`,
  transport: 'streamable-http (stateless, JSON responses)',
  tools: TOOL_LIST.map((t) => t.name),
  docs: `${SITE_URL}/llms.txt`,
  trigrams: ALL_TRIGRAMS.length,
  hexagrams: ALL_HEXAGRAMS.length,
};
