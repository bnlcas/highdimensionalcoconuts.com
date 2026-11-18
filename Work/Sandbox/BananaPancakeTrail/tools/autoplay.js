// Autoplay policy shared by the headless bots (and handy in the browser console).
// step(s, {mode}) makes exactly one decision. mode 'smart' plays sensibly, 'random' fuzzes.
import * as S from '../src/sim.js';
import * as D from '../src/data.js';

const rr = (s, a) => a[Math.floor(S.rnd(s) * a.length)];

export function step(s, opt = {}) {
  const mode = opt.mode || 'smart';
  if (s.over) return 'over';
  if (s.card) {
    if (s.card.result) { S.proceed(s); return 'proceed'; }
    const ok = s.card.choices.map((c, i) => [c, i]).filter(([c]) => !c.why);
    if (!ok.length) { s.card.choices.forEach((c) => (c.why = '')); S.choose(s, 0); return 'forced'; }
    let i;
    if (mode === 'random') i = rr(s, ok)[1];
    else i = pickSmartChoice(s, ok);
    S.choose(s, i);
    if (!s.card.result) S.choose(s, ok[0][1]);
    return 'choose';
  }
  // free actions first
  const boozeIdx = s.inv.findIndex((x) => D.ITEMS[x.id].drink);
  const healIdx = s.inv.findIndex((x) => D.ITEMS[x.id].heal);
  if (s.hp < s.hpMax - 25 && healIdx >= 0 && (mode === 'smart' || S.chance(s, 0.3))) { S.useItem(s, healIdx); return 'heal'; }
  if (s.std && s.std.known && s.inv.some((x) => x.id === 'antibiotics')) { S.useItem(s, s.inv.findIndex((x) => x.id === 'antibiotics')); return 'abx'; }
  if (s.phase === 'prison') return prison(s, mode);
  if (s.cash < 150 && !S.mumAvailable(s) && (mode === 'random' ? S.chance(s, 0.3) : s.mum > 1 || s.cash < 20)) { S.callMum(s); return 'mum'; }
  if (mode === 'smart' && s.dry >= 2 && boozeIdx >= 0 && s.today === 0 && (s.phase === 'night' && !S.city(s).bars)) { S.useItem(s, boozeIdx); return 'booze'; }
  if (mode === 'smart' && s.dry >= 3 && boozeIdx >= 0 && s.today === 0) { S.useItem(s, boozeIdx); return 'booze!'; }
  if (mode === 'random' && S.chance(s, 0.05)) { const sh = S.shopList(s); if (sh.length) S.buy(s, rr(s, sh).id); }
  if (mode === 'random' && S.chance(s, 0.03) && S.wifi(s)) { const k = rr(s, Object.keys(D.COINS)); if (S.chance(s, 0.5)) S.buyCoin(s, k, 50); else S.sellCoin(s, k); }
  if (mode === 'smart' && S.wifi(s) && s.coins.ROO && S.chance(s, 0.05)) S.sellCoin(s, 'ROO');
  if (mode === 'smart') smartShop(s);
  if (s.phase === 'day') return day(s, mode);
  if (s.phase === 'night') return night(s, mode);
  return 'idle';
}

function pickSmartChoice(s, ok) {
  // prefer choices whose text suggests shooting your shot / photos; avoid "prison" style risks with packages
  const score = ([c]) => {
    const t = (c.t + ' ' + c.sub).toLowerCase();
    let v = S.rnd(s);
    if (/shot|chat them|say hi|catch up|deliver the towels|lead them|send it|captain|get on the yacht|stand by/.test(t)) v += 1.2;
    if (/photo|pic|selfie|climb|get closer|stay behind/.test(t)) v += 0.8;
    if (/package|fight|square up|throw hands|bar fine|pay it\b|ride it|jump in|rope swing/.test(t)) v -= 0.6;
    if (/clinic|antibiotic|tiger balm|earplugs|padlock|vegemite/.test(t)) v += 1;
    if (/skint|wallet|hospital|orphanage/.test(t)) v += s.cash < 200 ? 1 : -2;
    if (/drink with|hair of the dog|take a swig|join them/.test(t)) v += s.dry >= 1 ? 1.5 : 0.2;
    if (/get on the plane/.test(t)) v -= 3;
    return v;
  };
  return ok.slice().sort((a, b) => score(b) - score(a))[0][1];
}

function smartShop(s) {
  if (s.prison || S.hasTag(s, 'remote')) return;
  const want = ['condoms', 'padlock', 'earplugs', 'imodium', 'pants', 'tinnies', 'lonely', 'selfie'];
  const sh = S.shopList(s);
  for (const id of want) {
    if (s.cash < 250) break;
    if (s.inv.length >= D.SLOTS - 1) break;
    if (id === 'tinnies' ? s.inv.filter((x) => D.ITEMS[x.id].drink).length >= 2 : S.has(s, id)) continue;
    if (sh.find((r) => r.id === id)) S.buy(s, id);
  }
  if (!s.inv.some((x) => D.ITEMS[x.id].drink) && s.inv.length < D.SLOTS) {
    const b = sh.find((r) => D.ITEMS[r.id].drink);
    if (b && s.cash > b.price + 20) S.buy(s, b.id);
  }
}

function day(s, mode) {
  const opts = S.dayOptions(s).filter((o) => !o.why);
  const routes = S.routesFrom(s, 'day').filter((r) => !r.blocked && r.cost <= s.cash);
  if (mode === 'random') {
    const all = [...opts, ...routes.map((r) => ({ type: 'travel', ri: r.i }))];
    const a = rr(s, all);
    if (a.type === 'poker') a.stake = rr(s, [20, 50, 100]);
    const e = S.doDay(s, a);
    if (e) S.doDay(s, { type: 'rest' });
    return a.type;
  }
  const c = S.city(s);
  const days = s.day;
  // go home when the run is getting dicey
  const home = opts.find((o) => o.type === 'home');
  if (home && (s.hpMax < 55 || (s.hp < 30 && s.cash > 500) || days > 120)) { S.doDay(s, home); return 'home'; }
  if (s.std && s.std.known) { const cl = opts.find((o) => o.type === 'clinic'); if (cl) { S.doDay(s, cl); return 'clinic'; } }
  if (s.hp < 35) { const cl = opts.find((o) => o.type === 'clinic'); S.doDay(s, cl && s.cash > 200 ? cl : { type: 'rest' }); return 'rest'; }
  const photos = opts.filter((o) => o.type === 'photo' && o.cost <= Math.max(60, s.cash * 0.25)).sort((a, b) => b.pts / (b.cost + 20) - a.pts / (a.cost + 20));
  if (photos.length) { S.doDay(s, photos[0]); return 'photo'; }
  if (s.cash < 300 && opts.find((o) => o.type === 'work') && S.chance(s, 0.7)) { S.doDay(s, { type: 'work' }); return 'work'; }
  const acts = opts.filter((o) => o.type === 'act');
  if (acts.length && S.chance(s, 0.25) && s.cash > 300) { S.doDay(s, rr(s, acts)); return 'act'; }
  // leave: prefer unvisited, cheap, not dangerous
  const stayLong = (s.visited[s.city] || 1) && (s.flags.stayed = (s.flags.stayed || 0) + 1);
  const nightRoutes = S.routesFrom(s, 'night').filter((r) => !r.blocked && r.cost <= s.cash);
  const cand = [...routes, ...nightRoutes].filter((r) => !(D.CITIES[r.to].tags.includes('remote') && s.dry >= 1 && !s.inv.some((x) => D.ITEMS[x.id].drink)));
  const unvisited = cand.filter((r) => !s.visited[r.to]);
  if (cand.length && (photos.length === 0) && S.chance(s, 0.75)) {
    const pool = unvisited.length ? unvisited : cand;
    const r = pool.sort((a, b) => a.cost - b.cost + (S.rnd(s) - 0.5) * 80)[0];
    if (r.when === 'day') { s.flags.stayed = 0; S.doDay(s, { type: 'travel', ri: r.i }); return 'travel'; }
    s.flags.planNight = r.i;
  }
  if (opts.find((o) => o.type === 'poker') && s.poker > 3 && s.cash > 200 && S.chance(s, 0.3)) { S.doDay(s, { type: 'poker', stake: 50 }); return 'poker'; }
  if (opts.find((o) => o.type === 'work') && s.cash < 800) { S.doDay(s, { type: 'work' }); return 'work'; }
  S.doDay(s, S.chance(s, 0.6) ? { type: 'wander' } : { type: 'rest' });
  return 'wander';
}

function night(s, mode) {
  const n = S.nightOptions(s);
  if (mode === 'random') {
    const r = S.chance(s, 0.15) && n.routes.length ? rr(s, n.routes) : null;
    if (r && !r.blocked && r.cost <= s.cash) { S.doNight(s, { travel: r.i }); return 'nightbus'; }
    const bar = n.bars.length && S.chance(s, 0.85) ? rr(s, n.bars).k : null;
    S.doNight(s, { bar, level: S.int(s, 0, 2), stay: rr(s, n.stays).id });
    return 'bar';
  }
  if (s.flags.planNight != null) {
    const r = n.routes.find((q) => q.i === s.flags.planNight);
    s.flags.planNight = null;
    if (r && !r.blocked && r.cost <= s.cash) { S.doNight(s, { travel: r.i }); return 'nightbus'; }
  }
  const stays = n.stays.filter((q) => q.price <= s.cash - 30);
  const stay = (stays.find((q) => q.id === (s.hp < 50 ? 'hotel' : 'dorm')) || stays.find((q) => q.id === 'guest') || stays.find((q) => q.id === 'homestay') || stays[0] || n.stays[0]).id;
  if (!n.bars.length) { S.doNight(s, { bar: null, stay }); return 'remote'; }
  const level = s.hp > 70 ? (S.chance(s, 0.35) ? 2 : 1) : s.hp > 40 ? 1 : 0;
  const bar = s.cash > 2000 && S.chance(s, 0.2) ? 'fancy' : S.chance(s, 0.65) ? 'bp' : 'dive';
  S.doNight(s, { bar, level, stay });
  return 'bar';
}

function prison(s, mode) {
  const p = s.prison;
  if (p.hooch > 0 && s.today === 0 && (s.dry >= 1 || mode === 'random')) { S.drinkHooch(s); return 'hooch'; }
  const opts = S.prisonOptions(s).filter((o) => !o.why);
  if (mode === 'random') { S.doPrison(s, rr(s, opts).id); return 'prison'; }
  const pref = [
    !p.brew && p.hooch < 5 && p.smokes >= 4 && 'brew',
    !p.brew && p.hooch < 5 && p.smokes < 4 && 'kitchen',
    !S.mumAvailable(s) && s.cash < S.bribeCost(s) && s.mum > 1 && p.smokes >= 7 && 'MUM',
    s.cash >= S.bribeCost(s) && 'bribe',
    !p.tv && 'tv',
    p.tunnel >= 100 && 'escape',
    p.spoon && 'dig',
    !p.spoon && p.smokes >= 12 && 'spoon',
    s.hp > 70 && S.chance(s, 0.3) && 'fight',
    s.hp < 50 && 'yard',
    S.chance(s, 0.4) && 'letter',
    'kitchen',
  ].filter(Boolean);
  for (const id of pref) {
    if (id === 'MUM') { S.callMum(s); return 'mum'; }
    if (opts.find((o) => o.id === id)) { S.doPrison(s, id); return id; }
  }
  S.doPrison(s, 'kitchen');
  return 'kitchen';
}

export function playRun(seed, opt = {}) {
  const arch = opt.arch || ['tradie', 'gapyear', 'fifo', 'crypto'][seed % 4];
  const s = S.newRun({ seed, arch, name: 'Bot from Penrith' });
  let guard = 0;
  while (!s.over && guard++ < 20000) step(s, opt);
  if (!s.over) throw new Error(`run ${seed} stuck in ${s.phase} card=${s.card && s.card.id} day ${s.day}`);
  return s;
}
