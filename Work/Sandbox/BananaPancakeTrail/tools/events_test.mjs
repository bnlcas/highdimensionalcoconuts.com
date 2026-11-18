// Fuzz every event's every choice from a few game states, and run random-policy games.
// node tools/events_test.mjs
import * as S from '../src/sim.js';
import * as D from '../src/data.js';
import { EVENTS } from '../src/events.js';
import { playRun } from './autoplay.js';

let errors = 0, tried = 0;
const cities = Object.keys(D.CITIES);
for (const [id, ev] of Object.entries(EVENTS)) {
  for (let k = 0; k < 12; k++) {
    const s = S.newRun({ seed: 77 + k * 13, arch: ['tradie', 'gapyear', 'fifo', 'crypto'][k % 4] });
    s.city = cities[(k * 7 + id.length) % cities.length];
    s.cash = [0, 50, 900, 5000][k % 4];
    s.mates = [[], ['davo'], ['jono', 'steve'], ['shazza', 'nong', 'bazza']][k % 4];
    if (k % 3 === 0) S.addItem(s, 'padlock');
    if (k % 2 === 0) S.addItem(s, 'antibiotics');
    if (k % 5 === 0) S.addItem(s, 'bike');
    s.tonight = { bar: 'bp', level: 1, stay: 'dorm' };
    if (id.startsWith('pr_') || (id === 'mum_call' && k % 2)) s.prison = { c: 'TH', name: 'x', sentence: 40, total: 40, served: 0, smokes: 20, respect: 3, hooch: 2, brew: 0, letters: 10, tunnel: 0, spoon: false, tv: false, bribes: 0 };
    if (id === 'mn_std') s.std = { id: 'clap', day0: 1, inc: 3, known: true };
    if (id === 'mn_pump') s.coins.ROO = { u: 10, cost: 10 };
    if (['lm_palace', 'lm_monkeys', 'lm_alms', 'lm_ijen', 'lm_dragon'].includes(id)) {
      const c = { lm_palace: 'bkk', lm_monkeys: 'phi', lm_alms: 'lpb', lm_ijen: 'ijn', lm_dragon: 'kmd' }[id];
      s.city = c;
    }
    const vars = { lm: D.CITIES[s.city].lm.find((l) => l.ev === id)?.id, name: 'Joy', pay: 20, from: 'TH', mode: 'flight', to: 'VN' };
    if (ev.when && !ev.when(s)) { if (id.startsWith('bp_mate') || id.startsWith('mn_mate')) s.mates = ['davo']; if (ev.when && !ev.when(s)) continue; }
    if (typeof ev.w === 'function' && ev.w(s) <= 0) s.mates = ['davo'];
    try {
      S.openCard(s, id, 'night', vars);
      const n = s.card.choices.length;
      if (!n) throw new Error('no choices');
      const i = k % n;
      const snap = JSON.stringify(s);
      for (let j = 0; j < s.card.choices.length; j++) {
        const s2 = JSON.parse(snap);
        S.choose(s2, j);
        if (s2.card.result) { tried++; if (typeof s2.card.result.text !== 'string') throw new Error('bad text'); S.proceed(s2); }
      }
      void i;
    } catch (e) { errors++; console.log('ERR', id, k, e.message, e.stack.split('\n')[1]); }
  }
}
console.log(`events: ${Object.keys(EVENTS).length}, choice resolutions ${tried}, errors ${errors}`);

let runErr = 0;
for (let k = 0; k < 300; k++) {
  try { playRun(5000 + k, { mode: 'random' }); } catch (e) { runErr++; if (runErr < 6) console.log('RUN ERR', 5000 + k, e.message, e.stack.split('\n').slice(1, 3).join(' ')); }
}
for (let k = 0; k < 200; k++) {
  try { playRun(9000 + k, { mode: 'smart' }); } catch (e) { runErr++; if (runErr < 10) console.log('RUN ERR smart', 9000 + k, e.message, e.stack.split('\n').slice(1, 3).join(' ')); }
}
console.log(`runs: 500, errors ${runErr}`);
// reachability: every city reachable from bkk
const seen = new Set(['bkk']); const q = ['bkk'];
while (q.length) { const c = q.shift(); for (const r of D.ROUTES) { const o = r.a === c ? r.b : r.b === c ? r.a : null; if (o && !seen.has(o)) { seen.add(o); q.push(o); } } }
const missing = cities.filter((c) => !seen.has(c));
console.log('unreachable cities:', missing.length ? missing : 'none');
for (const c of cities) for (const a of D.CITIES[c].acts) if (!EVENTS['act_' + a]) console.log('missing act', c, a);
for (const c of cities) for (const l of D.CITIES[c].lm) if (l.ev && !EVENTS[l.ev]) console.log('missing lm ev', l.ev);
