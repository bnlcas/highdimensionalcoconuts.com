// Run the leaderboard Worker locally on Node 22+ (node:sqlite stands in for D1).
// usage: node dev-server.mjs [port]   then set LEADERBOARD_URL = 'http://localhost:8787' in ../src/leaderboard.js
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from './worker.js';

const port = +process.argv[2] || 8787;
const db = new DatabaseSync(new URL('./dev.sqlite', import.meta.url).pathname);
db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
const DB = {
  prepare(sql) {
    const st = db.prepare(sql);
    let args = [];
    const api = {
      bind(...a) { args = a; return api; },
      first: async () => st.get(...args) ?? null,
      all: async () => ({ results: st.all(...args) }),
      run: async () => st.run(...args),
    };
    return api;
  },
};

http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const headers = { ...req.headers, 'cf-connecting-ip': req.socket.remoteAddress };
  const r = await worker.fetch(new Request(`http://localhost:${port}${req.url}`, {
    method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body,
  }), { DB, SALT: 'dev' });
  res.writeHead(r.status, Object.fromEntries(r.headers));
  res.end(Buffer.from(await r.arrayBuffer()));
}).listen(port, () => console.log(`leaderboard dev server on http://localhost:${port}/scores`));
