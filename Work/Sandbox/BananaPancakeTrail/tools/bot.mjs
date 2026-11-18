// Headless balance run.  node tools/bot.mjs [runs=40] [smart|random] [verbose]
import * as S from '../src/sim.js';
import { playRun } from './autoplay.js';

const N = +(process.argv[2] || 40);
const mode = process.argv[3] || 'smart';
const verbose = process.argv[4] === 'v';
const rows = [];
const ends = {};
const ach = {};
for (let k = 0; k < N; k++) {
  const s = playRun(1000 + k, { mode });
  const sc = S.score(s);
  rows.push({ arch: s.arch, days: s.day, sc: sc.total, drinks: s.drinks, free: s.hook.free, paid: s.hook.paid, photos: s.photos.length, ppts: sc.parts.photos, prison: s.prisonDays, end: s.over.kind, cities: Object.keys(s.visited).length, countries: Object.keys(s.countries).length, mumCash: s.stats.mumCash, std: s.stdHad.length });
  ends[s.over.kind] = (ends[s.over.kind] || 0) + 1;
  for (const a of Object.keys(s.ach)) ach[a] = (ach[a] || 0) + 1;
  if (verbose) {
    console.log(`#${1000 + k} ${s.arch.padEnd(8)} ${s.over.kind.padEnd(9)} day ${String(s.day).padStart(3)} score ${String(sc.total).padStart(6)} | 🍺${s.drinks} 💋${s.hook.free}/${s.hook.paid} 📸${s.photos.length}(${sc.parts.photos}) ⛓️${s.prisonDays} cities ${Object.keys(s.visited).length} ${Object.keys(s.countries).join('')} mum$${s.stats.mumCash} std${s.stdHad.length} ach:${Object.keys(s.ach).join(',')}`);
  }
}
const avg = (f) => (rows.reduce((a, r) => a + f(r), 0) / rows.length).toFixed(1);
const med = (f) => { const v = rows.map(f).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
console.log(`\n${N} runs (${mode}): days avg ${avg((r) => r.days)} med ${med((r) => r.days)} | score avg ${avg((r) => r.sc)} med ${med((r) => r.sc)} max ${Math.max(...rows.map((r) => r.sc))}`);
console.log(`drinks ${avg((r) => r.drinks)} | free ${avg((r) => r.free)} paid ${avg((r) => r.paid)} | photos ${avg((r) => r.photos)} (${avg((r) => r.ppts)} pts) | prison days ${avg((r) => r.prison)} | cities ${avg((r) => r.cities)} countries ${avg((r) => r.countries)} | mum$ ${avg((r) => r.mumCash)} | std ${avg((r) => r.std)}`);
console.log('endings', ends);
console.log('achievements', ach);
for (const a of ['tradie', 'gapyear', 'fifo', 'crypto']) {
  const rs = rows.filter((r) => r.arch === a);
  if (rs.length) console.log(`  ${a.padEnd(8)} days ${(rs.reduce((x, r) => x + r.days, 0) / rs.length).toFixed(1)} score ${(rs.reduce((x, r) => x + r.sc, 0) / rs.length).toFixed(0)}`);
}
