// SimPyramid simulation. Pure state + rules, no DOM, so it runs headless for balancing.
// One step() is one day. Every civilization (Egypt, the expansion pack) is data in levels/.

import { getLevel } from './levels/index.js';

export const JOBS = ['farm', 'brew', 'quarry', 'haul', 'mason', 'boat', 'priest'];
export const BUILDINGS = ['village', 'granary', 'bakery', 'quarry', 'harbor', 'temple'];
// What one level of each building gives.
export const BUILD_CAP = { village: 2000, granary: 100000, bakery: 400, quarry: 800, harbor: 250, temple: 120 };
const BUILD_JOB = { bakery: 'brew', quarry: 'quarry', harbor: 'boat', temple: 'priest' };
export const MAX_BUILDING = 9;
// Food economy. One unit of food is roughly ten person-days of bread.
export const RATION = 0.1; // food per person per day
export const THIRST = 0.08; // drink per person per day
const FARM_YIELD = 160; // food per farmer per year at a normal flood
const BREW_RATE = 1.2; // drink per brewer per day
const BREW_GRAIN = 0.25; // food per drink
export const FS = 4; // scale for food/drink costs written in the level data

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

export function rand(s) {
  let t = (s.rng = (s.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function gauss(s) {
  return Math.sqrt(-2 * Math.log(rand(s) + 1e-9)) * Math.cos(2 * Math.PI * rand(s));
}
const pick = (s, arr) => arr[Math.floor(rand(s) * arr.length)];

// ---------- structure geometry ----------
// A structure is a stack of regular n-gon frustum tiers {z0, z1, a0, a1} (a = apothem, meters).
const areaK = (n) => n * Math.tan(Math.PI / n);
function tierVol(n, t, z) {
  const h = Math.min(z, t.z1) - t.z0;
  if (h <= 0) return 0;
  const a = lerp(t.a0, t.a1, h / (t.z1 - t.z0));
  return (areaK(n) * h * (t.a0 * t.a0 + t.a0 * a + a * a)) / 3;
}
export function geometry(s) {
  const L = getLevel(s.levelId);
  const v = L.structure.variants[s.build.variant];
  const n = L.structure.sides;
  const vols = v.tiers.map((t) => tierVol(n, t, t.z1));
  const volume = vols.reduce((a, b) => a + b, 0);
  const top = v.tiers[v.tiers.length - 1].z1;
  return { n, tiers: v.tiers, vols, volume, top, total: Math.round(volume * L.structure.density), variant: v };
}
export function volumeBelow(g, z) {
  let vol = 0;
  for (const t of g.tiers) vol += tierVol(g.n, t, z);
  return vol;
}
export function heightAt(g, frac) {
  if (frac <= 0) return 0;
  if (frac >= 1) return g.top;
  const target = frac * g.volume;
  let lo = 0, hi = g.top;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (volumeBelow(g, mid) < target) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// ---------- calendar ----------
export function calendar(s) {
  const C = getLevel(s.levelId).civ;
  const yearDays = C.seasons.reduce((a, x) => a + x.days, 0);
  const year = Math.floor(s.day / yearDays) + 1;
  const doy = s.day % yearDays;
  let acc = 0, idx = 0;
  while (doy >= acc + C.seasons[idx].days) acc += C.seasons[idx++].days;
  const season = C.seasons[idx];
  return { year, doy, yearDays, season, seasonIdx: idx, dayInSeason: doy - acc, seasonLeft: season.days - (doy - acc) };
}

// ---------- favor helpers ----------
export function patronFor(C, slot) {
  return C.patrons.find((p) => p.slot === slot);
}
export function slotMult(s, slot, lo = 0.8, hi = 1.2) {
  const p = patronFor(getLevel(s.levelId).civ, slot);
  if (!p) return (lo + hi) / 2;
  return lerp(lo, hi, s.favor[p.id] / 100);
}
const hasTech = (s, id) => s.techs.includes(id);
function techEffect(s, key) {
  const C = getLevel(s.levelId).civ;
  let v = 0;
  for (const t of C.techs) if (s.techs.includes(t.id) && t.effect[key]) v += t.effect[key];
  return v;
}
const hasEffect = (s, kind) => s.effects.some((e) => e.kind === kind);

// ---------- new game ----------
export function newGame(levelId, seed = (Math.random() * 2 ** 31) | 0) {
  const L = getLevel(levelId);
  const C = L.civ;
  const st = L.start;
  const s = {
    v: 1,
    levelId,
    rng: seed,
    day: 0,
    seasonKey: null,
    pop: st.pop,
    jobs: { ...st.jobs },
    draft: 'haul',
    levy: { count: 0, until: 0 },
    res: { food: 0, drink: st.drink * FS, stone: st.stone || 0, site: 0, casing: st.casing || 0, tools: st.tools, treasure: st.treasure, wisdom: 0, granite: 0 },
    crop: 0,
    water: { w: 1, irrigation: 1, forecast: null, nextMod: 0 },
    morale: 62,
    maat: 60,
    fed: 1,
    drinkSat: 1,
    hunger: 0,
    lowMaatDays: 0,
    favor: Object.fromEntries(C.patrons.map((p) => [p.id, p.startFavor ?? 55])),
    wrathCD: {},
    buildings: { ...st.buildings },
    techs: [],
    research: null,
    build: { variant: L.structure.defaultVariant, core: 0, casing: 0, capstone: false, height: 0 },
    flags: {},
    effects: [],
    expeditions: [],
    decreeCD: {},
    tributeCut: 0,
    deaths: [],
    log: [],
    pending: [],
    outcome: null,
    stats: { died: 0, born: 0, offerings: 0, maatSum: 0, maatDays: 0, collapses: 0 },
    rates: {},
  };
  // seed the jobs so they never exceed pop
  fixJobs(s);
  // enough grain in the granary to reach the middle of the first harvest
  let toHarvest = 0;
  for (const x of C.seasons) {
    if (x.farm === 'harvest') { toHarvest += x.days / 2; break; }
    toHarvest += x.days;
  }
  s.res.food = Math.round(st.pop * (RATION + THIRST * BREW_GRAIN) * toHarvest * 1.15 + st.food);
  if (st.coreFrac) {
    const g = geometry(s);
    s.build.core = Math.round(g.total * st.coreFrac);
    s.build.casing = Math.round(g.total * L.structure.casingFrac * st.coreFrac);
    s.build.height = heightAt(g, st.coreFrac);
  }
  log(s, L.openingLine || `${L.ruler} takes the throne. The work begins.`, 'big');
  return s;
}

export function assigned(s) {
  return JOBS.reduce((a, j) => a + s.jobs[j], 0);
}
export function idle(s) {
  return Math.max(0, s.pop - assigned(s));
}
function fixJobs(s) {
  let over = assigned(s) - s.pop;
  if (over <= 0) return;
  const tot = assigned(s);
  for (const j of JOBS) {
    const cut = Math.min(s.jobs[j], Math.ceil((over * s.jobs[j]) / tot));
    s.jobs[j] -= cut;
  }
  over = assigned(s) - s.pop;
  for (const j of JOBS) {
    if (over <= 0) break;
    const c = Math.min(s.jobs[j], over);
    s.jobs[j] -= c;
    over -= c;
  }
}
export function setJob(s, job, n) {
  const max = s.jobs[job] + idle(s);
  s.jobs[job] = Math.round(clamp(n, 0, max));
}
export function distributeIdle(s) {
  const free = idle(s);
  const tot = assigned(s);
  if (!free) return;
  if (!tot) { s.jobs.haul += free; return; }
  for (const j of JOBS) s.jobs[j] += Math.floor((free * s.jobs[j]) / tot);
  s.jobs.haul += idle(s);
}

export function log(s, text, kind = '') {
  const cal = calendar(s);
  s.log.push({ day: s.day, year: cal.year, season: cal.season.name, text, kind });
  if (s.log.length > 250) s.log.splice(0, s.log.length - 250);
}

export function capacity(s, job) {
  const L = getLevel(s.levelId);
  if (job === 'farm') return Math.round(L.landCap * (1 + techEffect(s, 'land')));
  const b = Object.keys(BUILD_JOB).find((k) => BUILD_JOB[k] === job);
  if (b) return s.buildings[b] * BUILD_CAP[b];
  return Infinity;
}
export const housing = (s) => s.buildings.village * BUILD_CAP.village;
export const storage = (s) => s.buildings.granary * BUILD_CAP.granary;

// ---------- the day ----------
export function step(s) {
  if (s.outcome || s.pending.length) return;
  const L = getLevel(s.levelId);
  const C = L.civ;
  const cal = calendar(s);
  const key = `${cal.year}:${cal.seasonIdx}`;
  if (s.seasonKey !== key) {
    s.seasonKey = key;
    onSeasonStart(s, L, cal);
    if (s.pending.length) return;
  }
  const season = cal.season;
  const R = (s.rates = {});
  const workforce = s.pop + s.levy.count;

  // morale -> productivity
  const prod = (0.55 + 0.65 * (s.morale / 100)) * (1 + techEffect(s, 'prod'));
  const striking = hasEffect(s, 'strike');
  const builderProd = striking ? 0 : prod;
  const capped = (job) => Math.min(s.jobs[job], capacity(s, job));

  // ----- farming -----
  const farmers = capped('farm');
  const growDays = C.seasons.filter((x) => x.farm === 'grow').reduce((a, x) => a + x.days, 0);
  const harvestDays = C.seasons.filter((x) => x.farm === 'harvest').reduce((a, x) => a + x.days, 0);
  const farmProd = 0.8 + 0.3 * (s.morale / 100);
  const extra = { haul: 0, quarry: 0, mason: 0, boat: 0 };
  R.drafted = 0;
  if (season.farm === 'grow') {
    const g = farmers * (FARM_YIELD / growDays) * s.water.irrigation * slotMult(s, 'crop', 0.75, 1.2) * farmProd * (1 + techEffect(s, 'crop'));
    s.crop += g * (hasEffect(s, 'blight') ? 0.5 : 1);
    R.crop = g;
  } else if (season.farm === 'harvest') {
    const h = Math.min(s.crop, s.jobs.farm * ((2 * FARM_YIELD) / harvestDays) * farmProd);
    s.crop -= h;
    s.res.food += h;
    R.harvest = h;
  } else if (season.farm === 'continuous') {
    // greenhouses: grow and harvest at once
    const contDays = C.seasons.filter((x) => x.farm === 'continuous').reduce((a, x) => a + x.days, 0);
    const g = farmers * (FARM_YIELD / contDays) * s.water.irrigation * slotMult(s, 'crop', 0.75, 1.2) * farmProd * (1 + techEffect(s, 'crop'));
    s.res.food += g * (hasEffect(s, 'blight') ? 0.5 : 1);
    R.crop = g;
    R.harvest = g;
  } else if (season.farm === 'idle' && s.draft !== 'none') {
    // fields idle: the flooded-out farmers go build (Keynes would approve)
    extra[s.draft] += s.jobs.farm * 0.85;
    R.drafted = s.jobs.farm;
  }
  if (s.levy.count) extra[s.draft === 'none' ? 'haul' : s.draft] += s.levy.count * 0.85;

  // ----- brewing -----
  const brewers = capped('brew');
  const brewMade = Math.min(s.res.food / BREW_GRAIN, brewers * BREW_RATE * slotMult(s, 'joy', 0.9, 1.1) * prod);
  s.res.food -= brewMade * BREW_GRAIN;
  s.res.drink += brewMade;
  R.drink = brewMade;

  // ----- eating -----
  const rationMult = (hasEffect(s, 'rations') ? 1.4 : 1) * (1 - techEffect(s, 'ration'));
  const need = workforce * RATION * rationMult;
  if (s.res.food >= need) {
    s.res.food -= need;
    s.fed = 1;
    s.hunger = Math.max(0, s.hunger - 2);
  } else {
    s.fed = need ? s.res.food / need : 1;
    s.res.food = 0;
    s.hunger++;
  }
  R.eat = need;
  const drinkNeed = workforce * THIRST;
  const drunk = Math.min(s.res.drink, drinkNeed);
  s.res.drink -= drunk;
  s.drinkSat = drinkNeed ? drunk / drinkNeed : 1;
  R.drinkUse = drunk;

  // ----- quarry -----
  const rates = C.rates;
  const craft = slotMult(s, 'craft', 0.85, 1.15) * (hasEffect(s, 'slump') ? 0.65 : 1);
  const qWorkers = capped('quarry') + extra.quarry;
  const toolsOk = s.res.tools > 0;
  let quarried = qWorkers * 0.1 * rates.quarry * craft * builderProd * (1 + techEffect(s, 'quarry')) * (toolsOk ? 1 : 0.3);
  s.res.stone += quarried;
  s.res.tools = Math.max(0, s.res.tools - quarried * 0.002 * rates.tools);
  R.quarry = quarried;

  // ----- haul -----
  const g = geometry(s);
  const h = s.build.height;
  const storm = hasEffect(s, 'storm') ? 0.1 : 1;
  const hWorkers = s.jobs.haul + extra.haul;
  const haulCap = (hWorkers * 0.3 * rates.haul * builderProd * storm * (1 + techEffect(s, 'haul'))) / (1 + h / (35 * (L.structure.rampK || 1)));
  const hauled = Math.min(s.res.stone, haulCap);
  s.res.stone -= hauled;
  s.res.site += hauled;
  R.haul = hauled;
  R.haulCap = haulCap;

  // ----- masons -----
  const casingTotal = Math.round(g.total * L.structure.casingFrac);
  s.build.casingTotal = casingTotal;
  s.build.total = g.total;
  let coreCap = g.total;
  let blocked = null;
  for (const m of L.structure.milestones || []) {
    if (!s.res[m.need]) {
      const cap = Math.floor((volumeBelow(g, m.z) / g.volume) * g.total);
      if (cap < coreCap) { coreCap = cap; blocked = m; }
    }
  }
  s.build.blocked = s.build.core >= coreCap - 1 && blocked ? blocked.text : null;
  let M = (s.jobs.mason + extra.mason) * 0.16 * rates.mason * craft * builderProd * storm * (1 + techEffect(s, 'mason'));
  R.masonCap = M;
  const coreDone = s.build.core >= g.total;
  const coreFrac = s.build.core / g.total;
  const casingDemand = coreDone ? casingTotal - s.build.casing : Math.max(0, coreFrac * casingTotal - s.build.casing);
  const laid = Math.min(s.res.casing, casingDemand, (M * (coreDone || s.build.blocked ? 1 : 0.35)) / 3);
  s.res.casing -= laid;
  s.build.casing += laid;
  M -= laid * 3;
  const set = Math.max(0, Math.min(s.res.site, M, coreCap - s.build.core));
  s.res.site -= set;
  s.build.core += set;
  R.set = set;
  R.laid = laid;
  s.build.height = heightAt(g, s.build.core / g.total);

  // ----- boats / casing supply -----
  const harborAll = techEffect(s, 'boatAll') + (s.buildings.harbor >= 3 ? 0.35 : 0);
  const boatMult = Math.max(season.boat ?? 1, harborAll);
  const boats = (capped('boat') + extra.boat) * 0.1 * rates.boat * boatMult * builderProd * slotMult(s, 'river', 0.8, 1.2);
  const casingLeft = Math.max(0, casingTotal - s.build.casing - s.res.casing);
  s.res.casing += Math.min(boats, casingLeft);
  R.boat = boats;

  // ----- priests -----
  const priests = capped('priest');
  const coverage = Math.min(1, priests / Math.max(1, s.pop * 0.03));
  R.coverage = coverage;
  s.res.wisdom += priests * 0.004 * slotMult(s, 'wisdom', 0.6, 1.4) * (1 + s.buildings.temple * 0.08) * (hasEffect(s, 'muddle') ? 0.3 : 1);
  if (s.research) {
    const t = C.techs.find((x) => x.id === s.research);
    if (s.res.wisdom >= t.cost) {
      s.res.wisdom -= t.cost;
      s.techs.push(t.id);
      s.research = null;
      log(s, `${C.names.wisdomBy} masters <b>${t.name}</b>. ${t.done || ''}`, 'good');
    }
  }

  // ----- favor decay -----
  for (const p of C.patrons) {
    let d = (p.decay ?? 0.06) * (1 - 0.6 * coverage);
    if (p.slot === 'water' && hasTech(s, techIdWith(C, 'forecast'))) d *= 0.75;
    s.favor[p.id] = clamp(s.favor[p.id] - d, 0, 100);
  }

  // ----- storage -----
  const store = storage(s);
  if (s.res.food > store) {
    if (!s.flags.spoiledNote || s.day - s.flags.spoiledNote > 365) {
      log(s, `The ${C.names.granary.toLowerCase()} is full; surplus ${C.names.food.toLowerCase()} is lost to rats and rot. Build more storage.`, 'warn');
      s.flags.spoiledNote = s.day;
    }
    s.res.food = store;
  }
  s.res.drink = Math.min(s.res.drink, store * 0.5);

  // ----- events -----
  rollEvents(s, L, cal);
  if (L.hooks?.onDay) L.hooks.onDay(s, api);

  // ----- population & morale -----
  people(s, L, cal);

  // ----- effects / expeditions -----
  s.effects = s.effects.filter((e) => {
    if (e.kind === 'plague') kill(s, s.pop * 0.0009 * deathMult(s), 'plague');
    if (e.until <= s.day) {
      if (e.endText) log(s, e.endText);
      return false;
    }
    return true;
  });
  if (s.levy.count && s.day >= s.levy.until) {
    log(s, `The ${C.names.levy.toLowerCase()} goes home: ${fmt(s.levy.count)} ${C.names.workers.toLowerCase()} return to their villages.`);
    s.levy.count = 0;
  }
  s.expeditions = s.expeditions.filter((x) => {
    if (x.until > s.day) return true;
    finishExpedition(s, L, x);
    return false;
  });

  // ----- outcome -----
  const reignEnd = L.reignYears + (s.flags.extraYears || 0);
  if (s.build.capstone) {
    s.outcome = 'win';
    s.glory = glory(s, L);
    log(s, L.winLine || 'The pyramid is complete!', 'big');
  } else if (cal.year > reignEnd) {
    s.outcome = 'reign';
    s.glory = glory(s, L);
    log(s, L.reignLine || `${L.ruler} has died. The structure is unfinished.`, 'bad');
  } else if (s.pop < 60) {
    s.outcome = 'collapse';
    s.glory = glory(s, L);
  } else if (s.lowMaatDays > 120) {
    s.outcome = 'chaos';
    s.glory = glory(s, L);
    log(s, C.chaosLine || 'Order has collapsed.', 'bad');
  }
  s.stats.maatSum += s.maat;
  s.stats.maatDays++;
  s.day++;
}

function techIdWith(C, key) {
  const t = C.techs.find((x) => x.effect[key]);
  return t ? t.id : '__none';
}

function deathMult(s) {
  return slotMult(s, 'health', 1.5, 0.6) * (1 - techEffect(s, 'medicine'));
}

export function kill(s, n, why) {
  n = Math.min(s.pop, n);
  if (n <= 0) return 0;
  // fractional deaths accumulate so small daily rates still bite
  s._deathAcc = (s._deathAcc || 0) + n;
  const whole = Math.floor(s._deathAcc);
  s._deathAcc -= whole;
  if (!whole) return 0;
  s.pop -= whole;
  s.stats.died += whole;
  s.stats.why = s.stats.why || {};
  s.stats.why[why] = (s.stats.why[why] || 0) + whole;
  s.deaths.push({ day: s.day, n: whole });
  // remove from idle first, then evenly from jobs
  fixJobs(s);
  return whole;
}

function people(s, L, cal) {
  const C = L.civ;
  // starvation
  if (s.fed < 1 && s.hunger > 5) kill(s, s.pop * 0.004 * (1 - s.fed), 'hunger');
  // accidents on the ramp
  const hf = 1 + s.build.height / 50;
  kill(s, (s.jobs.haul + s.jobs.mason + s.jobs.quarry) * 0.000008 * hf * deathMult(s), 'accident');
  if (s.flags.steep) kill(s, (s.jobs.mason + s.jobs.haul) * 0.00001, 'accident');

  // morale target
  s.deaths = s.deaths.filter((d) => d.day > s.day - 45);
  const recentDeaths = s.deaths.reduce((a, d) => a + d.n, 0);
  const crowd = Math.max(0, s.pop + s.levy.count - housing(s)) / Math.max(1, housing(s));
  let target = 50;
  target += s.fed >= 1 ? 10 : -15 - Math.min(25, s.hunger * 2);
  target += (s.drinkSat - 0.7) * 30 * slotMult(s, 'joy', 0.7, 1.3);
  target -= Math.min(30, crowd * 60);
  target += (s.favor[patronFor(C, 'morale')?.id] ?? 50) / 5 - 10;
  target -= Math.min(25, (recentDeaths / Math.max(1, s.pop)) * 400);
  target += techEffect(s, 'morale');
  if (hasEffect(s, 'rations')) target += 10;
  if (s.draft === 'none' && cal.season.farm === 'idle') target += 5;
  if (cal.season.farm === 'festival') target += 8;
  for (const e of s.effects) if (e.morale) target += e.morale * Math.max(0, (e.until - s.day) / e.len);
  target = clamp(target, 0, 100);
  s.morale = clamp(s.morale + (target - s.morale) * 0.04, 0, 100);
  s.moraleTarget = target;

  // strike
  if (!hasEffect(s, 'strike') && (s.hunger > 8 || s.morale < 16) && !s.flags.strikeCD) {
    s.effects.push({ kind: 'strike', until: s.day + 12, len: 12 });
    s.flags.strikeCD = s.day + 60;
    log(s, C.strikeLine || 'The workers lay down their tools: "We are hungry!"', 'bad');
  }
  if (s.flags.strikeCD && s.day > s.flags.strikeCD) s.flags.strikeCD = 0;
  if (hasEffect(s, 'strike') && s.fed >= 1 && s.morale > 30) {
    s.effects = s.effects.filter((e) => e.kind !== 'strike');
    log(s, 'Rations are flowing again. The crews pick up their tools.', 'good');
  }

  // growth: people come for the bread and the beer
  if (s.fed >= 1 && s.morale > 45 && s.pop < housing(s)) {
    const g = s.pop * 0.0005 * ((s.morale - 45) / 55) * slotMult(s, 'morale', 0.7, 1.3);
    s._bornAcc = (s._bornAcc || 0) + g;
    const whole = Math.floor(s._bornAcc);
    if (whole) {
      s._bornAcc -= whole;
      s.pop += whole;
      s.stats.born += whole;
    }
  }

  // Ma'at: cosmic order = gods + people + bellies
  const avgFavor = C.patrons.reduce((a, p) => a + s.favor[p.id], 0) / C.patrons.length;
  s.maat = 0.4 * avgFavor + 0.4 * s.morale + 20 * Math.min(1, s.fed);
  s.lowMaatDays = s.maat < 18 ? s.lowMaatDays + 1 : Math.max(0, s.lowMaatDays - 2);
}

// ---------- seasons ----------
function onSeasonStart(s, L, cal) {
  const C = L.civ;
  const season = cal.season;
  if (season.farm === 'harvest' || season.farm === 'grow') {
    // nothing to do; crop carries
  }
  // previous season was harvest and crop left in the field?
  const prev = C.seasons[(cal.seasonIdx + C.seasons.length - 1) % C.seasons.length];
  if (prev.farm === 'harvest' && s.crop > 50 && s.day > 0) {
    log(s, `${fmt(s.crop)} ${C.names.food.toLowerCase()} rotted unharvested in the fields. Too few ${C.jobs.farm.name.toLowerCase()} at harvest.`, 'warn');
    s.crop = 0;
  }
  if (s.levy.count && s.levy.until <= s.day) s.levy.count = 0;

  if (season.water) rollWater(s, L);
  if (season.tribute && s.day > 0) tribute(s, L);
  if (season.festivalNote) log(s, season.festivalNote, 'good');
  log(s, `${season.name}${season.sub ? ` (${season.sub})` : ''} begins. ${season.note || ''}`, 'season');
  if (L.hooks?.onSeason) L.hooks.onSeason(s, api, cal);
}

export function waterVerdict(L, w) {
  return L.civ.water.verdict(w);
}
function irrigation(w) {
  if (w < 0.55) return 0.35;
  if (w < 1) return lerp(0.35, 1.05, (w - 0.55) / 0.45);
  if (w < 1.15) return lerp(1.05, 1.0, (w - 1) / 0.15);
  return Math.max(0.55, 1 - (w - 1.15) * 1.2);
}
function rollWater(s, L) {
  const C = L.civ;
  const f = s.favor[patronFor(C, 'water')?.id] ?? 50;
  let w;
  if (s.water.forecast != null) w = s.water.forecast;
  else w = rollW(s, f);
  w += s.water.nextMod;
  s.water.nextMod = 0;
  w = clamp(w, 0.3, 1.6);
  s.water.w = w;
  s.water.irrigation = clamp(irrigation(w) + techEffect(s, 'irrigation'), 0.3, 1.25);
  s.water.forecast = null;
  log(s, `${C.water.gauge}: <b>${C.water.fmt(w)}</b>. ${C.water.verdict(w)}`, w < 0.7 || w > 1.2 ? 'bad' : w > 0.9 ? 'good' : '');
  if (w > 1.2) {
    const sev = (w - 1.2) / 0.3;
    const guard = (s.buildings.granary >= 3 ? 0.4 : 1) * (1 - techEffect(s, 'floodGuard'));
    const lost = s.res.food * 0.22 * sev * guard;
    s.res.food -= lost;
    const dead = kill(s, s.pop * 0.006 * sev * guard, 'flood');
    log(s, `${C.water.damage} ${fmt(lost)} ${C.names.food.toLowerCase()} lost${dead ? `, ${dead} drowned` : ''}.`, 'bad');
  }
  // the forecast for next year, if the astronomers know how
  if (C.techs.some((t) => t.effect.forecast && s.techs.includes(t.id))) {
    s.water.forecast = rollW(s, f);
  }
}
function rollW(s, f) {
  const mean = 0.78 + 0.32 * (f / 100);
  const sd = 0.12 + (f < 30 ? 0.14 : 0);
  return mean + sd * gauss(s);
}

function tribute(s, L) {
  const C = L.civ;
  const T = L.tribute;
  const auth = slotMult(s, 'authority', 0.6, 1.3) * (0.5 + s.maat / 100) * (1 - s.tributeCut);
  const food = Math.round(T.food * FS * auth);
  const treasure = Math.round(T.treasure * auth);
  const tools = Math.round((T.tools || 0) * auth);
  s.res.food += food;
  s.res.treasure += treasure;
  s.res.tools += tools;
  s.tributeCut = 0;
  log(s, `${C.names.tribute}: +${fmt(food)} ${C.names.food.toLowerCase()}, +${treasure} ${C.names.treasure.toLowerCase()}${tools ? `, +${tools} ${C.names.tools.toLowerCase()}` : ''}.`, 'good');
}

// ---------- events ----------
function rollEvents(s, L, cal) {
  const C = L.civ;
  for (const p of C.patrons) {
    const f = s.favor[p.id];
    if (f >= 30 || (s.wrathCD[p.id] || 0) > s.day) continue;
    const pr = 0.004 * ((30 - f) / 30) * (s.maat < 30 ? 1.5 : 1);
    if (rand(s) < pr) {
      s.wrathCD[p.id] = s.day + 100;
      wrath(s, L, p);
    }
  }
  // chaos storms happen regardless, rarer when the chaos god is happy
  const chaos = patronFor(C, 'chaos');
  const cf = chaos ? s.favor[chaos.id] : 50;
  if (C.storm && !hasEffect(s, 'storm') && rand(s) < 0.0012 * (1.6 - cf / 100)) {
    const d = 4 + Math.floor(rand(s) * 6);
    s.effects.push({ kind: 'storm', until: s.day + d, len: d, endText: C.storm.end });
    log(s, C.storm.text, 'bad');
  }
  // boons
  if (rand(s) < 0.0018 && C.boons?.length) {
    const b = pick(s, C.boons);
    applyBoon(s, L, b);
  }
  // advisor ideas (level-specific choices live in hooks)
}

export function applyEventType(s, L, type, opts = {}) {
  const C = L.civ;
  switch (type) {
    case 'rampage': {
      const cost = Math.round((s.pop + s.levy.count) * THIRST * 6);
      s.pending.push({ id: 'rampage', title: opts.title, text: opts.text, cost, choices: [
        { id: 'pay', label: `${opts.payLabel || 'Pay'} (${fmt(cost)} ${C.names.drink.toLowerCase()})`, need: { drink: cost } },
        { id: 'refuse', label: opts.refuseLabel || 'Hope for the best' },
      ] });
      break;
    }
    case 'blight':
      s.effects.push({ kind: 'blight', until: s.day + 120, len: 120 });
      if (s.crop) s.crop *= 0.6; else s.res.food *= 0.88;
      break;
    case 'storm': {
      const d = 8 + Math.floor(rand(s) * 8);
      s.effects.push({ kind: 'storm', until: s.day + d, len: d, endText: C.storm?.end });
      s.res.site *= 0.95;
      break;
    }
    case 'plague':
      s.effects.push({ kind: 'plague', until: s.day + 30, len: 30, endText: 'The sickness passes.' });
      break;
    case 'revolt':
      s.tributeCut = 0.6;
      s.res.food *= 0.9;
      s.effects.push({ kind: 'unrest', until: s.day + 90, len: 90, morale: -12 });
      break;
    case 'drought':
      s.water.nextMod -= 0.3;
      if (s.water.forecast != null) s.water.forecast -= 0.3;
      break;
    case 'deluge':
      s.water.nextMod += 0.35;
      if (s.water.forecast != null) s.water.forecast += 0.35;
      break;
    case 'beasts': {
      const n = kill(s, (s.jobs.boat + s.jobs.farm) * 0.015, 'beasts');
      opts.extra = `${n} lost.`;
      break;
    }
    case 'theft':
      s.res.treasure = Math.floor(s.res.treasure * 0.65);
      break;
    case 'slump':
      s.effects.push({ kind: 'slump', until: s.day + 50, len: 50, endText: 'The craftsmen find their touch again.' });
      break;
    case 'gloom':
      s.effects.push({ kind: 'gloom', until: s.day + 60, len: 60, morale: -18 });
      break;
    case 'sour':
      s.res.drink *= 0.4;
      s.effects.push({ kind: 'gloom', until: s.day + 40, len: 40, morale: -8 });
      break;
    case 'muddle':
      s.res.wisdom *= 0.5;
      s.effects.push({ kind: 'muddle', until: s.day + 60, len: 60 });
      break;
  }
}

function wrath(s, L, p) {
  const w = p.wrath;
  const opts = { title: w.title, text: w.text, payLabel: w.payLabel, refuseLabel: w.refuseLabel };
  applyEventType(s, L, w.type, opts);
  if (w.type !== 'rampage') log(s, `<b>${w.title}</b> ${w.text}${opts.extra ? ' ' + opts.extra : ''}`, 'bad');
  s.lastEvent = { title: w.title, text: w.text, kind: 'bad', patron: p.id, day: s.day };
}

function applyBoon(s, L, b) {
  const C = L.civ;
  switch (b.type) {
    case 'windfall': s.res.treasure += b.amount || 5; break;
    case 'bumper': s.crop *= 1.25; s.res.food += s.pop * RATION * 30; break;
    case 'inspiration': s.res.wisdom += 30; break;
    case 'migrants': s.pop += Math.round(s.pop * 0.04); break;
    case 'calm': for (const p of C.patrons) s.favor[p.id] = Math.min(100, s.favor[p.id] + 4); break;
    case 'tools': s.res.tools += 120; break;
  }
  log(s, `<b>${b.title}</b> ${b.text}`, 'good');
  s.lastEvent = { title: b.title, text: b.text, kind: 'good', day: s.day };
}

export function resolveChoice(s, choiceId) {
  const L = getLevel(s.levelId);
  const ev = s.pending.shift();
  if (!ev) return;
  const ch = ev.choices.find((c) => c.id === choiceId);
  if (ch?.need) {
    for (const k in ch.need) if (s.res[k] < ch.need[k]) { s.pending.unshift(ev); return 'short'; }
    for (const k in ch.need) s.res[k] -= ch.need[k];
  }
  if (ev.id === 'rampage') {
    if (choiceId === 'pay') log(s, L.civ.rampagePaid || 'The rampage is calmed.', 'good');
    else {
      const n = kill(s, s.pop * 0.05, 'rampage');
      log(s, `${L.civ.rampageLost || 'The rampage tears through the camp.'} ${n} dead.`, 'bad');
    }
    return;
  }
  if (L.hooks?.onChoice) L.hooks.onChoice(s, api, ev, choiceId);
}

// ---------- player actions ----------
export function canAfford(s, cost) {
  for (const k in cost) if ((s.res[k] ?? 0) < cost[k]) return false;
  return true;
}
function pay(s, cost) {
  for (const k in cost) s.res[k] -= cost[k];
}
export function offeringCost(s, p) {
  // offerings scale gently with the size of the kingdom
  const k = Math.max(1, s.pop / 4000);
  const out = {};
  for (const r in p.cost) out[r] = r === 'treasure' ? p.cost[r] : Math.round(p.cost[r] * k * (r === 'food' || r === 'drink' ? FS : 1));
  return out;
}
export function offer(s, pid) {
  const L = getLevel(s.levelId);
  const C = L.civ;
  const p = C.patrons.find((x) => x.id === pid);
  const cost = offeringCost(s, p);
  if (!canAfford(s, cost)) return false;
  pay(s, cost);
  const cal = calendar(s);
  const bonus = cal.season.farm === 'festival' && p.festival ? 2 : 1;
  s.favor[pid] = clamp(s.favor[pid] + (p.gain ?? 22) * bonus, 0, 100);
  if (p.rival) s.favor[p.rival] = clamp(s.favor[p.rival] - 5, 0, 100);
  s.stats.offerings++;
  return true;
}
export function buildingCost(s, b) {
  const lvl = s.buildings[b];
  const base = { village: { food: 2500, stone: 600 }, granary: { food: 1500, stone: 900 }, bakery: { food: 1200, stone: 300 }, quarry: { food: 2000, tools: 60 }, harbor: { food: 2000, stone: 500 }, temple: { food: 2000, stone: 800, treasure: 3 } }[b];
  const out = {};
  for (const k in base) out[k] = Math.round(base[k] * Math.pow(1.35, lvl - 1) * (k === 'food' ? FS : 1));
  return out;
}
export function upgrade(s, b) {
  if (s.buildings[b] >= MAX_BUILDING) return false;
  const cost = buildingCost(s, b);
  if (!canAfford(s, cost)) return false;
  pay(s, cost);
  s.buildings[b]++;
  const C = getLevel(s.levelId).civ;
  log(s, `${C.buildings[b].name} upgraded to level ${s.buildings[b]}.`);
  return true;
}
export function startResearch(s, id) {
  if (s.techs.includes(id)) return;
  s.research = id;
}

export function decreeList(s) {
  const L = getLevel(s.levelId);
  const C = L.civ;
  const k = Math.max(1, s.pop / 4000);
  const D = C.decrees;
  const list = [
    { id: 'feast', ...D.feast, cost: { drink: Math.round(1500 * k * FS), food: Math.round(1000 * k * FS) }, cd: 120 },
    { id: 'levy', ...D.levy, cost: {}, cd: 0, note: `+${fmt(levySize(s))} for the rest of the season` },
    { id: 'rations', ...D.rations, cost: {}, cd: 180 },
    { id: 'tax', ...D.tax, cost: {}, cd: 365 },
    { id: 'allgods', ...D.allgods, cost: { food: Math.round(1800 * k * FS), drink: Math.round(900 * k * FS), treasure: 4 }, cd: 90 },
  ];
  for (const x of C.expeditions.concat(L.expeditions || [])) {
    if (x.when && !x.when(s)) continue;
    const cost = {};
    for (const r in x.cost) cost[r] = r === 'food' || r === 'drink' ? x.cost[r] * FS : x.cost[r];
    list.push({ ...x, cost, expedition: true, cd: 0 });
  }
  for (const d of list) {
    d.ready = (s.decreeCD[d.id] || 0) <= s.day && !(d.expedition && s.expeditions.some((e) => e.id === d.id));
    if (d.id === 'levy') d.ready = d.ready && !s.levy.count;
    if (d.expedition && d.once && s.flags['exp_' + d.id]) d.ready = false;
    d.afford = canAfford(s, d.cost || {}) && (!d.workers || idle(s) + s.jobs.haul >= d.workers);
  }
  return list;
}
function levySize(s) {
  return Math.round(s.pop * 0.35 * slotMult(s, 'authority', 0.7, 1.3));
}
export function decree(s, id) {
  const L = getLevel(s.levelId);
  const C = L.civ;
  const d = decreeList(s).find((x) => x.id === id);
  if (!d || !d.ready || !d.afford) return false;
  pay(s, d.cost || {});
  s.decreeCD[id] = s.day + d.cd;
  const cal = calendar(s);
  const joy = patronFor(C, 'joy');
  const mor = patronFor(C, 'morale');
  const auth = patronFor(C, 'authority');
  switch (id) {
    case 'feast':
      s.effects.push({ kind: 'feast', until: s.day + 60, len: 60, morale: 28 });
      if (joy) s.favor[joy.id] = Math.min(100, s.favor[joy.id] + 12);
      if (mor) s.favor[mor.id] = Math.min(100, s.favor[mor.id] + 5);
      if (hasEffect(s, 'strike')) s.effects = s.effects.filter((e) => e.kind !== 'strike');
      break;
    case 'levy': {
      const n = levySize(s);
      s.levy = { count: n, until: s.day + cal.seasonLeft };
      s.effects.push({ kind: 'levied', until: s.day + 60, len: 60, morale: -6 });
      if (auth) s.favor[auth.id] = Math.max(0, s.favor[auth.id] - 6);
      if (cal.season.farm !== 'idle') s.tributeCut = Math.min(0.8, s.tributeCut + 0.3);
      break;
    }
    case 'rations':
      s.effects.push({ kind: 'rations', until: s.day + 90, len: 90 });
      break;
    case 'tax': {
      const food = Math.round(L.tribute.food * FS * 0.6 * slotMult(s, 'authority', 0.6, 1.3));
      s.res.food += food;
      s.effects.push({ kind: 'taxed', until: s.day + 120, len: 120, morale: -16 });
      if (auth) s.favor[auth.id] = Math.max(0, s.favor[auth.id] - 4);
      log(s, `${d.name}: +${fmt(food)} ${C.names.food.toLowerCase()}. Grumbling in the provinces.`, 'warn');
      return true;
    }
    case 'allgods':
      for (const p of C.patrons) s.favor[p.id] = Math.min(100, s.favor[p.id] + 10);
      s.stats.offerings += C.patrons.length;
      break;
    default:
      if (d.expedition) {
        if (d.workers) takeWorkers(s, d.workers);
        s.expeditions.push({ id: d.id, until: s.day + d.days, workers: d.workers || 0 });
        if (d.once) s.flags['exp_' + d.id] = true;
      }
  }
  log(s, d.logText || `${d.name}.`, 'decree');
  return true;
}
function takeWorkers(s, n) {
  const fromIdle = Math.min(idle(s), n);
  n -= fromIdle;
  s.pop -= fromIdle;
  const fromHaul = Math.min(s.jobs.haul, n);
  s.jobs.haul -= fromHaul;
  s.pop -= fromHaul;
}
function finishExpedition(s, L, x) {
  const C = L.civ;
  const d = C.expeditions.concat(L.expeditions || []).find((e) => e.id === x.id);
  const risk = d.risk ? s.favor[patronFor(C, d.risk)?.id] ?? 50 : 60;
  const lost = risk < 30 && rand(s) < 0.5;
  s.pop += x.workers;
  if (lost) {
    const back = Math.round(x.workers * 0.6);
    s.pop -= x.workers - back;
    s.stats.died += x.workers - back;
    log(s, d.failText || `${d.name} returns empty-handed and short of men.`, 'bad');
    if (d.once) s.flags['exp_' + d.id] = false;
    return;
  }
  for (const k in d.reward) {
    if (k === 'glory') s.flags.glory = (s.flags.glory || 0) + d.reward[k];
    else s.res[k] = (s.res[k] || 0) + d.reward[k];
  }
  if (d.onDone) d.onDone(s, api);
  log(s, d.doneText || `${d.name} returns.`, 'good');
}

export function canCap(s) {
  const L = getLevel(s.levelId);
  const b = s.build;
  return !b.capstone && b.core >= b.total && b.casing >= b.casingTotal - 0.5 && s.res.treasure >= L.structure.capstoneCost;
}
export function raiseCapstone(s) {
  const L = getLevel(s.levelId);
  if (!canCap(s)) return false;
  s.res.treasure -= L.structure.capstoneCost;
  s.build.capstone = true;
  return true;
}

export function glory(s, L) {
  const b = s.build;
  const cal = calendar(s);
  const g = geometry(s);
  const frac = Math.min(1, b.core / g.total) * 0.8 + Math.min(1, b.casing / Math.max(1, b.casingTotal)) * 0.2;
  let score = Math.round(frac * 1000 * (L.glory || 1));
  if (b.capstone) score += 500;
  if (b.capstone) score += Math.max(0, L.reignYears - cal.year + 1) * 60;
  const avgMaat = s.stats.maatSum / Math.max(1, s.stats.maatDays);
  score += Math.round(avgMaat * 4);
  for (const t of L.civ.techs) if (t.effect.glory && s.techs.includes(t.id)) score += t.effect.glory;
  score += s.flags.glory || 0;
  return { score, frac, avgMaat, height: b.height, top: g.top };
}

export function fmt(n) {
  n = Math.round(n);
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 1 : 2) + 'M';
  if (Math.abs(n) >= 1e4) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + 'k';
  return n.toLocaleString('en-US');
}

// helpers handed to level hooks
export const api = { log, rand, kill, calendar, geometry, heightAt, volumeBelow, slotMult, fmt, applyEventType, getLevel };
