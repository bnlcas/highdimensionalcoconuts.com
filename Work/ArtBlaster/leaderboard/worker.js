// Art Blaster! leaderboard: a tiny Cloudflare Worker backed by a D1 (SQLite) database.
//   GET  /scores?period=all|week   -> { scores: [...] }
//   POST /scores  {name, bill, destroyed, topPiece, rankTitle, mode}  -> { rank, total, scores }
// The game is a static page, so scores can't be truly verified; the Worker just keeps them
// plausible (no bill bigger than the whole museum), tidy (short names) and slow to spam.

const DEFAULT_ORIGINS = [
  'https://www.highdimensionalcoconuts.com',
  'https://highdimensionalcoconuts.com',
  'http://localhost:8766',
];
const MAX_BILL_DEFAULT = 8_600_000_000;   // everything in the museum, destroyed, plus glass fees
const MIN_SECONDS_BETWEEN_POSTS = 20;
const TOP_N = 20;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',') : DEFAULT_ORIGINS).map(s => s.trim());
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    const json = (body, status = 200) => new Response(JSON.stringify(body), {
      status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });

    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (url.pathname !== '/scores') return json({ error: 'not found' }, 404);

    try {
      if (request.method === 'GET') {
        const period = url.searchParams.get('period') === 'week' ? 'week' : 'all';
        return json({ scores: await top(env, period) });
      }
      if (request.method === 'POST') {
        if (!allowed.includes(origin)) return json({ error: 'origin not allowed' }, 403);
        let body;
        try { body = await request.json(); } catch { return json({ error: 'bad json' }, 400); }
        const entry = validate(body, env);
        if (entry.error) return json(entry, 400);

        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const ipHash = await sha256(ip + (env.SALT || 'art-blaster'));
        const now = Math.floor(Date.now() / 1000);
        const recent = await env.DB.prepare('SELECT created_at FROM scores WHERE ip_hash = ? ORDER BY created_at DESC LIMIT 1')
          .bind(ipHash).first();
        if (recent && now - recent.created_at < MIN_SECONDS_BETWEEN_POSTS) {
          return json({ error: 'Slow down! One bill every few seconds.' }, 429);
        }
        await env.DB.prepare(
          'INSERT INTO scores (name, bill, destroyed, top_piece, rank_title, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(entry.name, entry.bill, entry.destroyed, entry.topPiece, entry.rankTitle, ipHash, now).run();
        const better = await env.DB.prepare('SELECT COUNT(*) AS n FROM scores WHERE bill > ?').bind(entry.bill).first();
        const total = await env.DB.prepare('SELECT COUNT(*) AS n FROM scores').first();
        return json({ rank: better.n + 1, total: total.n, scores: await top(env, 'all') });
      }
      return json({ error: 'method not allowed' }, 405);
    } catch (err) {
      return json({ error: 'server error' }, 500);
    }
  },
};

async function top(env, period) {
  const since = period === 'week' ? Math.floor(Date.now() / 1000) - 7 * 86400 : 0;
  const { results } = await env.DB.prepare(
    'SELECT name, bill, destroyed, top_piece AS topPiece, rank_title AS rankTitle, created_at AS createdAt ' +
    'FROM scores WHERE created_at >= ? ORDER BY bill DESC, created_at ASC LIMIT ?')
    .bind(since, TOP_N).all();
  return results;
}

export function cleanText(s, max) {
  return String(s ?? '')
    .normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f-\u009f<>]/g, '')  // control characters and angle brackets
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function validate(body, env = {}) {
  if (!body || typeof body !== 'object') return { error: 'bad request' };
  if (body.mode !== 'timed') return { error: 'only timed runs go on the leaderboard' };
  const bill = Number(body.bill);
  const max = Number(env.MAX_BILL) || MAX_BILL_DEFAULT;
  if (!Number.isSafeInteger(bill) || bill <= 0 || bill > max) return { error: 'that bill is not possible' };
  const destroyed = Number(body.destroyed);
  if (!Number.isInteger(destroyed) || destroyed < 0 || destroyed > 100) return { error: 'bad destroyed count' };
  let name = cleanText(body.name, 18) || 'Anonymous Billionaire';
  const blocked = (env.BLOCKLIST || '').split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
  if (blocked.some(w => name.toLowerCase().includes(w))) name = 'Anonymous Billionaire';
  return {
    name, bill, destroyed,
    topPiece: cleanText(body.topPiece, 80),
    rankTitle: cleanText(body.rankTitle, 40),
  };
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
