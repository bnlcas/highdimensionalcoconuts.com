// A competent autopilot, used by the balance bot and handy for testing in the browser.
import * as S from '../src/sim.js';
import { getLevel } from '../src/levels/index.js';

export function think(s) {
  const L = getLevel(s.levelId);
  const C = L.civ;
  const cal = S.calendar(s);
  // pending choices: take the first option we can afford
  while (s.pending.length) {
    const ev = s.pending[0];
    const ch = ev.choices.find((c) => !c.need || S.canAfford(s, c.need)) || ev.choices[ev.choices.length - 1];
    if (S.resolveChoice(s, ch.id) === 'short') S.resolveChoice(s, ev.choices[ev.choices.length - 1].id);
  }
  if (S.canCap(s)) S.raiseCapstone(s);

  // labor plan
  const pop = s.pop;
  const growDays = C.seasons.filter((x) => x.farm === 'grow').reduce((a, x) => a + x.days, 0);
  const yearDays = cal.yearDays;
  const foodNeed = (pop * 1.12 * yearDays * (S.RATION + S.THIRST * 0.25)) / 160;
  const contDays = C.seasons.filter((x) => x.farm === 'continuous').reduce((a, x) => a + x.days, 0);
  const nextFarm = ['grow', 'harvest'].includes(cal.season.farm) || cal.seasonLeft < 5;
  const farm = Math.min(S.capacity(s, 'farm') * 1.05, foodNeed * (s.res.food < pop * 120 ? 1.15 : 1));
  const priest = Math.min(S.capacity(s, 'priest'), pop * 0.03);
  const brew = Math.min(S.capacity(s, 'brew'), pop * 0.8 / 12 / 0.9);
  const casingLeft = s.build.casingTotal - s.build.casing - s.res.casing;
  const boat = casingLeft > 0 ? Math.min(S.capacity(s, 'boat'), pop * 0.05) : 0;
  for (const j of S.JOBS) s.jobs[j] = 0;
  s.jobs.farm = Math.round(farm);
  s.jobs.priest = Math.round(priest);
  s.jobs.brew = Math.round(brew);
  s.jobs.boat = Math.round(boat);
  let rest = Math.max(0, pop - S.assigned(s));
  // split builders so that quarry ~ haul ~ mason throughput
  const h = s.build.height;
  const haulRate = (0.3 * C.rates.haul) / (1 + h / (35 * (L.structure.rampK || 1)));
  const qRate = 0.1 * C.rates.quarry;
  const mRate = 0.16 * C.rates.mason;
  const inv = [1 / qRate, 1 / haulRate, 1 / mRate];
  const tot = inv.reduce((a, b) => a + b, 0);
  let q = Math.min(S.capacity(s, 'quarry'), (rest * inv[0]) / tot);
  s.jobs.quarry = Math.round(q);
  rest = pop - S.assigned(s);
  s.jobs.haul = Math.round((rest * inv[1]) / (inv[1] + inv[2]));
  s.jobs.mason = pop - S.assigned(s);

  // gods
  for (const p of C.patrons) if (s.favor[p.id] < 42) S.offer(s, p.id);
  // buildings
  if (s.pop > S.housing(s) * 0.9) S.upgrade(s, 'village');
  if (S.capacity(s, 'quarry') < (rest * inv[0]) / tot) S.upgrade(s, 'quarry');
  if (S.storage(s) < pop * (S.RATION + S.THIRST * 0.25) * cal.yearDays * 1.05 || s.res.food > S.storage(s) * 0.95) S.upgrade(s, 'granary');
  if (S.capacity(s, 'brew') < pop * 0.07) S.upgrade(s, 'bakery');
  if (S.capacity(s, 'boat') < pop * 0.05 && casingLeft > 0) S.upgrade(s, 'harbor');
  if (S.capacity(s, 'priest') < pop * 0.03) S.upgrade(s, 'temple');
  // research
  if (!s.research) {
    const t = C.techs.filter((t) => !s.techs.includes(t.id)).sort((a, b) => a.cost - b.cost)[0];
    if (t) S.startResearch(s, t.id);
  }
  // decrees
  const D = S.decreeList(s);
  const go = (id) => D.find((d) => d.id === id && d.ready && d.afford) && S.decree(s, id);
  if (s.morale < 45) go('feast');
  if (cal.season.farm === 'idle' && cal.dayInSeason < 10) go('levy');
  for (const d of D) {
    if (!d.expedition) continue;
    if (d.reward.tools && s.res.tools < 300) go(d.id);
    if (d.reward.treasure && s.res.treasure < L.structure.capstoneCost + 6) go(d.id);
    if (d.reward.granite || d.reward.chrono || d.reward.glory) go(d.id);
  }
}

