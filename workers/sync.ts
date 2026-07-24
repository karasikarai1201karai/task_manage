// Cloudflare Worker — Any Planner 同期エンドポイント
// GET  /sync/{keyHash}  → KV からデータを返す
// PUT  /sync/{keyHash}  → HMAC 検証後、KV にデータを書き込む

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

interface Env {
  KV: KVNamespace;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Ts, X-Sync-Sig',
  'Access-Control-Max-Age': '86400',
};

// HMAC-SHA-256: keyHex（64文字の16進数）で message に署名して16進数で返す
async function hmacSHA256(keyHex: string, message: string): Promise<string> {
  const keyBytes = new Uint8Array(
    (keyHex.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16)),
  );
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    new TextEncoder().encode(message),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function response(body: string | null, status: number, extra?: Record<string, string>): Response {
  return new Response(body, {
    status,
    headers: { ...CORS_HEADERS, ...(extra ?? {}) },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS プリフライト
    if (request.method === 'OPTIONS') {
      return response(null, 204);
    }

    const url = new URL(request.url);
    const match = url.pathname.match(/^\/sync\/([a-f0-9]{64})$/);
    if (!match) {
      return response('Not Found', 404);
    }
    const keyHash = match[1];

    // GET: KV からデータを返す
    if (request.method === 'GET') {
      const value = await env.KV.get(keyHash);
      if (value === null) return response(null, 404);
      return response(value, 200, { 'Content-Type': 'application/json' });
    }

    // PUT: 検証してから KV に書き込む
    if (request.method === 'PUT') {
      // ① タイムスタンプチェック（±5分以内）
      const ts = request.headers.get('X-Sync-Ts') ?? '';
      const sig = request.headers.get('X-Sync-Sig') ?? '';
      if (!ts || !sig) return response('Unauthorized', 401);

      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - parseInt(ts, 10)) > 300) {
        return response('Unauthorized', 401);
      }

      // ② HMAC 検証（keyHash を鍵として署名を確認）
      const expected = await hmacSHA256(keyHash, `${ts}:PUT:${keyHash}`);
      if (sig !== expected) {
        return response('Unauthorized', 401);
      }

      // ③ ペイロードサイズ制限（500KB）
      const body = await request.text();
      if (body.length > 500_000) {
        return response('Payload Too Large', 413);
      }

      // ④ 最低限の JSON 形式チェック
      try {
        const parsed = JSON.parse(body) as Record<string, unknown>;
        if (!Array.isArray(parsed.tasks) || typeof parsed.dayPlans !== 'object') {
          return response('Bad Request', 400);
        }
      } catch {
        return response('Bad Request', 400);
      }

      await env.KV.put(keyHash, body);
      return response(null, 204);
    }

    return response('Method Not Allowed', 405);
  },
};
