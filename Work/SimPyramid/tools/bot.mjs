// Headless balance check: a reasonable-but-not-brilliant player plays every level.
// node tools/bot.mjs [levelId] [seeds]
import * as S from '../src/sim.js';
import { LEVELS, getLevel } from '../src/levels/index.js';
import { think } from './autoplay.js';

function play(levelId, seed) {
  const s = S.newGame(levelId, seed);
  let guard = 0;
  while (!s.outcome && guard++ < 60000) {
    if (s.day % 5 === 0 || s.pending.length) think(s);
    S.step(s);
  }
  const cal = S.calendar(s);
  return { s, cal };
}

const only = process.argv[2] && process.argv[2] !== 'all' ? [process.argv[2]] : LEVELS.map((l) => l.id);
const seeds = +(process.argv[3] || 4);
for (const id of only) {
  const L = getLevel(id);
  const res = [];
  for (let k = 0; k < seeds; k++) res.push(play(id, 1000 + k));
  const wins = res.filter((r) => r.s.outcome === 'win');
  const yrs = res.map((r) => r.cal.year).join(',');
  const fr = res.map((r) => Math.round((100 * r.s.build.core) / r.s.build.total)).join(',');
  const g = S.geometry(res[0].s);
  console.log(`${id.padEnd(12)} reign ${L.reignYears}y total ${S.fmt(g.total)} | wins ${wins.length}/${seeds} | years ${yrs} | core% ${fr} | outcomes ${res.map((r) => r.s.outcome).join(',')} | pop ${res.map((r) => r.s.pop).join(',')} died ${res.map((r) => r.s.stats.died).join(',')} ${JSON.stringify(res[0].s.stats.why)} techs ${res[0].s.techs.length} bld ${JSON.stringify(res[0].s.buildings)}`);
  if (process.argv[4] === 'log') for (const l of res[0].s.log.slice(-40)) console.log('   ', l.year, l.season, l.text.replace(/<[^>]+>/g, ''));
}
