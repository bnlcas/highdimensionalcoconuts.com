// Local test of the Worker against node:sqlite standing in for D1.  usage: node leaderboard/test.mjs
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker, { validate } from './worker.js';

const db = new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
// minimal D1-shaped wrapper
const D1 = {
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
const env = { DB: D1, SALT: 'test', BLOCKLIST: 'meanword' };
const ORIGIN = 'http://localhost:8766';
const call = (method, body, ip = '1.1.1.1', origin = ORIGIN, path = '/scores') =>
  worker.fetch(new Request('https://lb.example' + path, {
    method, headers: { Origin: origin, 'CF-Connecting-IP': ip, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }), env).then(async r => [r.status, await r.json().catch(() => null), r.headers.get('Access-Control-Allow-Origin')]);

const ok = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) process.exitCode = 1; };
const run = { mode: 'timed', bill: 1_114_000_000, destroyed: 2, topPiece: 'The Starry Night', rankTitle: 'Cultural Wrecking Ball', name: 'Bea' };

let [s, b, o] = await call('POST', run);
ok(s === 200 && b.rank === 1 && b.scores.length === 1 && o === ORIGIN, 'first score accepted, rank 1, CORS echoes origin');
[s, b] = await call('POST', run);
ok(s === 429, 'same IP inside 20 s is rate-limited');
[s, b] = await call('POST', { ...run, bill: 3e9, name: '  <b>Zed</b>\u0007  the   Destroyer of Worlds and More ' }, '2.2.2.2');
ok(s === 200 && b.rank === 1 && b.scores[0].name === 'bZed/b the Destroy', 'second score ranks first; name cleaned + trimmed to 18');
[s, b] = await call('POST', { ...run, bill: 9e9 }, '3.3.3.3');
ok(s === 400, 'bill bigger than the museum rejected');
[s, b] = await call('POST', { ...run, mode: 'free' }, '4.4.4.4');
ok(s === 400, 'free-roam runs rejected');
[s, b] = await call('POST', { ...run, bill: 12.5 }, '5.5.5.5');
ok(s === 400, 'fractional bill rejected');
[s, b] = await call('POST', { ...run, name: 'MeanWord99' }, '6.6.6.6');
ok(s === 200 && b.scores.some(x => x.name === 'Anonymous Billionaire'), 'blocklisted name replaced');
[s, b] = await call('POST', run, '7.7.7.7', 'https://evil.example');
ok(s === 403, 'POST from another site refused');
[s, b] = await call('GET');
ok(s === 200 && b.scores.length === 3 && b.scores[0].bill === 3e9 && !('ip_hash' in b.scores[0]), 'GET returns sorted scores without IP hashes');
[s, b] = await call('GET', null, '1.1.1.1', ORIGIN, '/elsewhere');
ok(s === 404, 'unknown path 404');
ok(validate({ mode: 'timed', bill: 5, destroyed: 0, name: '' }).name === 'Anonymous Billionaire', 'empty name gets a default');
