import { SERVER_DESCRIPTION, handlePost } from '../src/lib/mcpServer.js';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type, mcp-protocol-version, mcp-session-id, accept',
  'cache-control': 'no-store',
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export function GET() {
  return Response.json(SERVER_DESCRIPTION, { headers: CORS });
}

export async function POST(request) {
  const text = await request.text();
  if (text.length > 20000) {
    return Response.json({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Request too large' } }, { status: 413, headers: CORS });
  }
  const { status, body } = handlePost(text);
  if (body === null) return new Response(null, { status, headers: CORS });
  return Response.json(body, { status, headers: CORS });
}
