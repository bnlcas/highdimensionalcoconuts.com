// Banana Pancake Trail — the simulation. Pure, seeded, headless (runs in node for the bots).
// A day is: one day action → a night (bar + bed, or an overnight bus) → dawn. Cards (events) interrupt
// the flow; each card stores where to continue (`next`) once its result has been read.
import * as D from './data.js';
import { EVENTS } from './events.js';

// ---------- seeded randomness (lives in s.rng so a save replays) ----------
export function rnd(s) {
  let t = (s.rng = (s.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const int = (s, a, b) => a + Math.floor(rnd(s) * (b - a + 1));
export const pick = (s, arr) => arr[Math.floor(rnd(s) * arr.length)];
export const chance = (s, p) => rnd(s) < p;
const gauss = (s) => Math.sqrt(-2 * Math.log(rnd(s) + 1e-12)) * Math.cos(2 * Math.PI * rnd(s));
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const fmt = (n) => `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n)).toLocaleString('en-AU')}`;

// ---------- lookups ----------
export const city = (s) => D.CITIES[s.city];
export const country = (s) => D.COUNTRIES[city(s).c];
export const hasTag = (s, t) => city(s).tags.includes(t);
export const P = (s, base) => Math.max(0, Math.round(base * country(s).price * 100) / 100);
export const drinkPrice = (s, bar) => D.BAR_BASE[bar] * country(s).price * (country(s).beerMult || 1);
export const stayPrice = (s, id) => (s.job === s.city && id === 'dorm' ? 0 : P(s, D.STAYS[id].base));
export const has = (s, id) => s.inv.some((x) => x.id === id);
export const hasMate = (s, perk) => s.mates.some((m) => D.MATES[m].perk === perk);
export const slotsUsed = (s) => s.inv.length;
export const isFullMoon = (s) => (s.day + s.moon) % 29 === 0;
export const daysToFullMoon = (s) => (29 - ((s.day + s.moon) % 29)) % 29;
export const wifi = (s) => (s.prison ? has(s, 'phone') : hasTag(s, 'wifi'));
export const nightBlocked = (s) => s.prison != null;

export function charm(s, bar) {
  let c = s.charm0 + (s.charmMod || 0);
  if (s.charmTemp && s.charmTemp.until >= s.day) c += s.charmTemp.v;
  for (const m of s.mates) if (m === 'macca' || m === 'shazza') c += 1;
  if (has(s, 'pants') && bar === 'bp') c += 1;
  if (has(s, 'singlet')) c += bar === 'fancy' ? -2 : 1;
  if (has(s, 'raybans')) c += 1;
  if (has(s, 'guitar') && bar === 'bp') c += 1;
  if (has(s, 'suit') && bar === 'fancy') c += 2;
  if (s.itchy > 0) c -= 1;
  if (s.std && s.std.known) c -= 2;
  if (s.hp < 35) c -= 1;
  if (s.hungover) c -= 1;
  return clamp(c, 0, 10);
}

// ---------- new run ----------
export function newRun({ seed = (Math.random() * 2 ** 31) | 0, arch = 'tradie', name = 'Brayden from Penrith' } = {}) {
  const A = D.ARCHETYPES[arch];
  const s = {
    v: 1, seed, rng: seed, day: 1, phase: 'day', city: 'bkk', name, arch,
    cash: A.cash, hp: A.hp, hpBase: A.hp, hpMax: A.hp, charm0: A.charm, charmMod: 0, charmTemp: null, tol: A.tol, fightBase: A.fight, poker: A.poker,
    mum: A.mum, mumLast: {}, mumToday: false, askedMum: false, mumBlockedUntil: 0,
    drinks: 0, today: 0, dry: 0,
    hook: { free: 0, paid: 0, who: [] },
    photos: [], visited: { bkk: 1 }, countries: { TH: 1 }, trail: ['bkk'], ksr: true,
    inv: [], mates: A.mate ? [A.mate] : [],
    std: null, stdHad: [], itchy: 0, belly: 0, hungover: false,
    job: null, stay: 'dorm', moon: 0, heat: 0, blacklist: {},
    coins: {}, px: {}, pxh: {},
    card: null, tonight: null, transit: null, log: [], seen: {}, flags: {}, ach: {},
    prison: null, prisonDays: 0, over: null, nextPhoto: 1,
    stats: { nights: 0, fights: 0, buses: 0, km: 0, spentBeer: 0, mumCash: 0, crossings: 0, bikeFrom: null },
  };
  s.moon = 29 - int(s, 8, 14);
  for (const [id, n] of A.items) addItem(s, id, n);
  for (const [k, c] of Object.entries(D.COINS)) { s.px[k] = c.p; s.pxh[k] = [c.p]; }
  if (A.coins) for (const [k, amt] of Object.entries(A.coins)) s.coins[k] = { u: amt / s.px[k], cost: amt };
  log(s, `Day 1. You step off the airport bus onto Khao San Road with ${fmt(s.cash)}, a 65-litre backpack and no plan whatsoever.`, 'big');
  return s;
}

export function log(s, text, tone = '') {
  s.logN = (s.logN || 0) + 1;
  s.log.push({ d: s.day, text, tone, id: s.logN });
  if (s.log.length > 160) s.log.splice(0, s.log.length - 160);
}

// ---------- inventory ----------
export function addItem(s, id, n = 1, extra) {
  const it = D.ITEMS[id];
  const stack = s.inv.find((x) => x.id === id && !extra && id !== 'package');
  if (stack) { stack.n += it.uses ? n * it.uses : n; return true; }
  if (s.inv.length >= D.SLOTS) return false;
  s.inv.push({ id, n: it.uses ? n * it.uses : n, ...(extra || {}) });
  return true;
}
export function takeItem(s, id, n = 1) {
  const i = s.inv.findIndex((x) => x.id === id);
  if (i < 0) return false;
  s.inv[i].n -= n;
  if (s.inv[i].n <= 0) s.inv.splice(i, 1);
  return true;
}
export function dropItem(s, idx) {
  const x = s.inv[idx];
  if (!x || s.card || s.over) return;
  s.inv.splice(idx, 1);
  if (x.id === 'package') { s.flags.dumped = s.day; log(s, 'You chucked the mysterious package. Somebody, somewhere, is going to be filthy about that.', 'bad'); }
  else if (x.id === 'bike') log(s, 'You abandoned the Honda Win by the side of the road. A local kid was riding it within the minute.');
  else log(s, `Ditched the ${D.ITEMS[x.id].name.toLowerCase()}.`);
}
// Use a consumable (drink or heal). Free action, any phase.
export function useItem(s, idx) {
  const x = s.inv[idx];
  if (!x || s.card || s.over) return null;
  const it = D.ITEMS[x.id];
  if (it.drink) {
    drink(s, it.drink);
    if (it.hp) s.hp = clamp(s.hp + it.hp, 0, s.hpMax);
    x.n--; if (x.n <= 0) s.inv.splice(idx, 1);
    log(s, `Cracked the ${it.name.toLowerCase()}. +${it.drink} drinks.`, 'beer');
    return `+${it.drink} 🍺`;
  }
  if (it.heal) {
    s.hp = clamp(s.hp + it.heal, 0, s.hpMax);
    x.n--; if (x.n <= 0) s.inv.splice(idx, 1);
    log(s, `Had the ${it.name.toLowerCase()}. +${it.heal} health.`, 'good');
    return `+${it.heal} ❤️`;
  }
  if (x.id === 'antibiotics') {
    x.n--; if (x.n <= 0) s.inv.splice(idx, 1);
    if (s.std && chance(s, 0.6)) { log(s, `The dodgy antibiotics worked! ${s.std.known ? D.STDS.find((q) => q.id === s.std.id).name : 'Whatever you had'} is gone.`, 'good'); s.std = null; return 'Cured!'; }
    log(s, s.std ? 'The antibiotics did nothing except make you sun-sensitive.' : 'You took antibiotics "just in case". Your gut flora filed a complaint.', 'bad');
    return 'No luck';
  }
  return null;
}

export function drink(s, n) {
  s.drinks += n;
  s.today += n;
}

// ---------- shops ----------
export function shopList(s) {
  if (s.prison) return [];
  const c = city(s).c;
  const remote = hasTag(s, 'remote');
  const out = [];
  for (const [id, it] of Object.entries(D.ITEMS)) {
    if (!it.shop || !it.shop.length) continue;
    if (!(it.shop.includes('*') || it.shop.includes(c))) continue;
    if (remote && !['noodles', 'tinnies', 'laolao', 'happywater', 'arak', 'tanduay', 'bucket', 'angkorcan', 'condoms', 'tigerbalm'].includes(id)) continue;
    out.push({ id, price: Math.max(1, Math.round(P(s, it.price) * (remote ? 1.6 : 1))) });
  }
  if (s.city === 'ijn' && !has(s, 'gasmask')) out.push({ id: 'gasmask', price: 4 });
  return out;
}
export function buy(s, id) {
  if (s.card || s.over || s.prison) return 'Not now';
  const row = shopList(s).find((r) => r.id === id);
  if (!row) return 'Not sold here';
  if (s.cash < row.price) return 'Too poor';
  if (!addItem(s, id, 1)) return 'Backpack full';
  s.cash -= row.price;
  log(s, `Bought ${D.ITEMS[id].name.toLowerCase()} for ${fmt(row.price)}.`);
  return '';
}

// ---------- crypto ----------
export function coinValue(s) {
  return Object.entries(s.coins).reduce((a, [k, h]) => a + h.u * s.px[k], 0);
}
export function buyCoin(s, k, amt) {
  if (!wifi(s)) return 'No wifi';
  amt = Math.min(amt, s.cash);
  if (amt < 1) return 'No cash';
  s.cash -= amt;
  const h = s.coins[k] || (s.coins[k] = { u: 0, cost: 0 });
  h.u += amt / s.px[k];
  h.cost += amt;
  log(s, `Aped ${fmt(amt)} into $${k}.`, 'coin');
  return '';
}
export function sellCoin(s, k) {
  if (!wifi(s)) return 'No wifi';
  const h = s.coins[k];
  if (!h) return 'Nothing to sell';
  const v = h.u * s.px[k];
  s.cash += v;
  if (h.cost >= 50 && v >= h.cost * 10) grant(s, 'wagmi');
  log(s, `Sold your $${k} for ${fmt(v)} (${v >= h.cost ? '+' : ''}${Math.round((v / h.cost - 1) * 100)}%).`, v >= h.cost ? 'good' : 'bad');
  delete s.coins[k];
  return '';
}
function tickCoins(s) {
  for (const [k, c] of Object.entries(D.COINS)) {
    let p = s.px[k];
    if (chance(s, c.rug)) {
      p *= 0.015;
      if (s.coins[k]) { log(s, `🪦 $${k} got rug-pulled. The devs have deleted their Discord and moved to Dubai.`, 'bad'); grant(s, 'rugged'); }
      s.flags.rugNews = k;
    } else {
      p *= Math.exp(c.drift + c.vol * gauss(s));
    }
    s.px[k] = Math.max(1e-8, p);
    const h = s.pxh[k];
    h.push(s.px[k]);
    if (h.length > 21) h.shift();
  }
}

// ---------- mum ----------
export function mumAvailable(s) {
  if (s.over || s.card) return 'Busy';
  if (s.mumToday) return 'Already called today';
  if (s.prison && !has(s, 'phone') && s.prison.smokes < 3) return 'Need 3 smokes for the phone';
  if (s.mumBlockedUntil > s.day) return `Mum's not picking up (${s.mumBlockedUntil - s.day}d)`;
  return '';
}
export function callMum(s) {
  if (mumAvailable(s)) return;
  if (s.prison && !has(s, 'phone')) s.prison.smokes -= 3;
  s.mumToday = true;
  openCard(s, s.mum <= 0 ? 'mum_ticket' : 'mum_call', s.phase);
}

// ---------- scoring ----------
export function photoPts(s, r) {
  let m = 2 * s.nextPhoto;
  if (has(s, 'lonely')) m *= 1.25;
  if (has(s, 'selfie')) m *= 1.1;
  if (s.mates.includes('bazza')) m *= 1.2;
  return Math.round(r * m);
}
export function score(s) {
  const freeDays = s.day - s.prisonDays;
  const parts = {
    days: freeDays * 10 + s.prisonDays * 5,
    drinks: s.drinks * 2,
    free: s.hook.free * 150,
    paid: s.hook.paid * 30,
    photos: s.photos.reduce((a, p) => a + p.pts, 0),
    ach: Object.keys(s.ach).reduce((a, k) => a + D.ACHIEVEMENTS[k].pts, 0),
  };
  const base = Object.values(parts).reduce((a, b) => a + b, 0);
  const mult = s.over ? s.over.mult : 1;
  return { parts, base, mult, total: Math.round(base * mult) };
}
export function grant(s, id) {
  if (s.ach[id]) return false;
  s.ach[id] = s.day;
  log(s, `🏆 Achievement: ${D.ACHIEVEMENTS[id].name}!`, 'ach');
  s.flags.toast = id;
  return true;
}

// ---------- effect context handed to event code ----------
export function mkR(s) {
  const out = [];
  const R = {
    s, out,
    rnd: () => rnd(s), int: (a, b) => int(s, a, b), chance: (p) => chance(s, p), pick: (a) => pick(s, a),
    p: (base) => Math.round(P(s, base)),
    hp(n) {
      const before = s.hp;
      s.hp = clamp(s.hp + n, 0, s.hpMax);
      const d = Math.round(s.hp - before);
      if (d) out.push({ k: 'hp', v: d });
      return d;
    },
    cash(n) {
      n = Math.round(n);
      if (n < 0) n = -Math.min(s.cash, -n);
      s.cash += n;
      if (n) out.push({ k: 'cash', v: n });
      return n;
    },
    drink(n) { if (n > 0) { drink(s, n); out.push({ k: 'drink', v: n }); } return n; },
    item(id, n = 1) {
      const ok = addItem(s, id, n);
      out.push({ k: ok ? 'item' : 'info', v: ok ? D.ITEMS[id].icon + ' ' + D.ITEMS[id].name : `No room in the backpack for the ${D.ITEMS[id].name.toLowerCase()}` });
      return ok;
    },
    has: (id) => has(s, id),
    take(id) { if (takeItem(s, id)) { out.push({ k: 'loseitem', v: D.ITEMS[id].icon + ' ' + D.ITEMS[id].name }); return true; } return false; },
    loseRandom(filter = () => true) {
      const opts = s.inv.filter((x) => x.id !== 'package' && filter(x));
      if (!opts.length) return null;
      const x = pick(s, opts);
      s.inv.splice(s.inv.indexOf(x), 1);
      out.push({ k: 'loseitem', v: D.ITEMS[x.id].icon + ' ' + D.ITEMS[x.id].name });
      return D.ITEMS[x.id].name;
    },
    charm: (bar) => charm(s, bar),
    charmTemp(v, days) { s.charmTemp = { v, until: s.day + days }; out.push({ k: 'charm', v: `${v > 0 ? '+' : ''}${v} charm for ${days}d` }); },
    charmPerm(v) { s.charmMod += v; out.push({ k: 'charm', v: `${v > 0 ? '+' : ''}${v} charm (permanent)` }); },
    mum(n) { s.mum = clamp(s.mum + n, 0, 10); if (n) out.push({ k: 'mum', v: n }); },
    mate() { return s.mates.length ? pick(s, s.mates) : null; },
    mateName: (id) => (id ? D.MATES[id].name : 'nobody'),
    addMate(id) {
      if (s.mates.includes(id) || s.mates.length >= D.MAX_MATES) return false;
      s.mates.push(id);
      out.push({ k: 'mate', v: `${D.MATES[id].icon} ${D.MATES[id].name} joined the crew` });
      return true;
    },
    loseMate(id) {
      if (!s.mates.includes(id)) return;
      s.mates = s.mates.filter((m) => m !== id);
      out.push({ k: 'matelost', v: `${D.MATES[id].icon} ${D.MATES[id].name} left the crew` });
    },
    freeMate() {
      const opts = Object.keys(D.MATES).filter((m) => !s.mates.includes(m) && m !== 'steve' && m !== 'nong');
      return opts.length ? pick(s, opts) : null;
    },
    ach(id) { if (grant(s, id)) out.push({ k: 'ach', v: D.ACHIEVEMENTS[id].icon + ' ' + D.ACHIEVEMENTS[id].name }); },
    photo(lm) {
      if (s.photos.some((p) => p.id === lm.id)) return 0;
      const pts = photoPts(s, lm.r);
      s.photos.push({ id: lm.id, name: lm.name, r: lm.r, pts, city: s.city, day: s.day, remote: hasTag(s, 'remote') });
      s.nextPhoto = 1;
      if (!lm.ksr && s.city === 'bkk') s.ksr = false;
      out.push({ k: 'photo', v: pts });
      if (s.photos.filter((p) => p.remote).length >= 5) R.ach('remote');
      if (lm.id === 'pnk_sondoong') R.ach('sondoong');
      return pts;
    },
    leaveKsr() { s.ksr = false; },
    fight(kind, diff = 0) {
      s.stats.fights++;
      let pow = 0.5 + s.fightBase * 0.08 + s.hp / 500 - Math.min(s.today, 25) * 0.006;
      if (kind !== 'mate') {
        if (s.mates.includes('shazza')) pow += 0.15;
        if (kind === 'local') pow += s.mates.length * 0.04;
      }
      const won = rnd(s) < clamp(pow - diff, 0.08, 0.92);
      const dmg = won ? int(s, 2, 8) : int(s, 10, 20) + Math.round(diff * 20);
      R.hp(-dmg);
      return { won, dmg };
    },
    hook(base, opts = {}) {
      const bar = opts.bar || (s.tonight && s.tonight.bar);
      let p = base + charm(s, bar) * 0.045;
      if (s.today >= 4 && s.today <= 14) p += 0.05;
      if (s.today > 20) p -= 0.08;
      if (!chance(s, clamp(p, 0.02, 0.95))) return { ok: false, who: opts.who };
      return R.score(false, opts.who);
    },
    score(paid, who) {
      who = who || pick(s, D.PARTNERS).join(' from ');
      if (paid) s.hook.paid++; else s.hook.free++;
      s.hook.who.push({ who, paid, day: s.day, city: s.city });
      out.push({ k: paid ? 'paid' : 'hook', v: who });
      if (s.hook.free >= 10) R.ach('casanova');
      // STD roll
      let pStd = paid ? 0.16 : 0.07;
      if (has(s, 'condoms')) { pStd *= 0.1; takeItem(s, 'condoms'); }
      if (!s.std && chance(s, pStd)) {
        const opts2 = D.STDS.filter((q) => !s.stdHad.includes(q.id));
        const q = pick(s, opts2.length ? opts2 : D.STDS);
        s.std = { id: q.id, day0: s.day, inc: int(s, 3, 6), known: false };
        if (!s.stdHad.includes(q.id)) s.stdHad.push(q.id);
        if (new Set(s.stdHad).size >= 3) R.ach('collector');
      }
      return { ok: true, who, fade: pick(s, D.FADES) };
    },
    belly() {
      if (takeItem(s, 'imodium')) { out.push({ k: 'info', v: '💊 Imodium saved you' }); return 'Luckily you had Imodium. Crisis contained.'; }
      s.belly = int(s, 2, 3);
      R.hp(-6);
      return `Your guts have turned on you. ${s.belly} days of hell.`;
    },
    heat(n) { s.heat = clamp(s.heat + n, 0, 100); },
    courier() {
      const from = city(s).c;
      const opts = Object.entries(D.CITIES).filter(([id, c]) => c.c !== from && ['TH', 'KH', 'LA', 'VN', 'PH'].includes(c.c) && !c.tags.includes('remote') && !s.blacklist[c.c]);
      const [dest, dc] = pick(s, opts);
      const pay = Math.round((int(s, 12, 35) * 100) * (['PH', 'VN'].includes(dc.c) ? 1.3 : 1));
      return { dest, destName: dc.name, destCountry: D.COUNTRIES[dc.c].name, pay, from };
    },
    takePackage(job) { return R.item('package') && Object.assign(s.inv.find((x) => x.id === 'package' && !x.dest), { dest: job.dest, pay: job.pay, from: job.from }); },
    prison(c) { s.flags.toPrison = c; },
    end(kind) { s.flags.toEnd = kind; },
    chain(id, vars) { s.flags.chain = { id, vars }; },
    coin(k, amt) { if (amt > 0 && s.cash >= 1) { buyCoin(s, k, Math.min(amt, s.cash)); out.push({ k: 'info', v: `Bought $${k}` }); } },
    info(v) { out.push({ k: 'info', v }); },
  };
  return R;
}

// ---------- cards ----------
function eventList(ev, s, v) { return typeof ev.choices === 'function' ? ev.choices(s, v) : ev.choices; }
export function openCard(s, id, next, vars = {}) {
  const ev = EVENTS[id];
  if (!ev) throw new Error('No event ' + id);
  s.seen[id] = s.day;
  const R = mkR(s);
  const v = Object.assign(ev.vars ? ev.vars(s, R) || {} : {}, vars);
  s.card = { id, next, v, title: typeof ev.title === 'function' ? ev.title(s, v) : ev.title, icon: ev.icon || '❗', text: ev.text(s, v), result: null, pre: R.out };
  s.card.choices = cardChoices(s);
}
export function cardChoices(s) {
  const ev = EVENTS[s.card.id];
  const out = eventList(ev, s, s.card.v).map((c) => ({ t: c.t, sub: typeof c.sub === 'function' ? c.sub(s, s.card.v) : c.sub || '', why: c.req ? c.req(s, s.card.v) || '' : '' }));
  if (out.every((c) => c.why)) out.push({ t: 'Forget it', sub: '', why: '', esc: true });
  return out;
}
export function choose(s, i) {
  const c = s.card;
  if (!c || c.result) return;
  const ev = EVENTS[c.id];
  const list = eventList(ev, s, c.v);
  if (i === list.length && list.every((q) => q.req && q.req(s, c.v))) {
    c.result = { text: 'You shrug and move on. Not today.', chips: [], pick: i };
    return;
  }
  const ch = list[i];
  if (!ch) return;
  if (ch.req && ch.req(s, c.v)) return;
  const R = mkR(s);
  const text = ch.go(s, R, c.v) || '';
  c.result = { text, chips: R.out, pick: i };
  log(s, `${c.icon} ${c.title}: ${stripTags(text)}`, 'card');
}
const stripTags = (t) => t.replace(/<[^>]+>/g, '');

// Called when the player dismisses a resolved card.
export function proceed(s) {
  const c = s.card;
  if (!c || !c.result) return;
  s.card = null;
  if (s.flags.toEnd) { const k = s.flags.toEnd; delete s.flags.toEnd; return endRun(s, k); }
  if (s.flags.toPrison) { const k = s.flags.toPrison; delete s.flags.toPrison; s.transit = null; s.tonight = null; return enterPrison(s, k); }
  if (s.hp <= 0 && !s.over) return endRun(s, s.prison ? 'infirmary' : 'medevac');
  if (s.flags.chain) { const { id, vars } = s.flags.chain; delete s.flags.chain; return openCard(s, id, c.next, vars); }
  cont(s, c.next);
}
function cont(s, next) {
  switch (next) {
    case 'day': s.phase = 'day'; break;
    case 'night': s.phase = 'night'; break;
    case 'prison': s.phase = 'prison'; break;
    case 'sleep': afterBar(s); break;
    case 'dawn': dawn(s); break;
    case 'travel': advanceTravel(s); break;
    case 'prisonDawn': prisonDawn(s); break;
    case 'over': break;
    default: s.phase = next || 'day';
  }
}

export function drawEvent(s, kind, filt = () => true) {
  const c = city(s);
  const list = [];
  let tot = 0;
  for (const [id, ev] of Object.entries(EVENTS)) {
    if (ev.kind !== kind || !filt(ev)) continue;
    if (ev.c && !ev.c.includes(c.c)) continue;
    if (ev.city && !ev.city.includes(s.city)) continue;
    if (ev.tags && !ev.tags.some((t) => c.tags.includes(t))) continue;
    if (ev.once && s.seen[id]) continue;
    if (s.seen[id] != null && s.day - s.seen[id] < (ev.cd ?? 5)) continue;
    if (ev.when && !ev.when(s)) continue;
    const w = typeof ev.w === 'function' ? ev.w(s) : ev.w ?? 1;
    if (w <= 0) continue;
    list.push([id, w]);
    tot += w;
  }
  if (!list.length) return null;
  let r = rnd(s) * tot;
  for (const [id, w] of list) { r -= w; if (r <= 0) return id; }
  return list[list.length - 1][0];
}

// ---------- the day ----------
export function routesFrom(s, when) {
  const out = [];
  for (const r of D.ROUTES) {
    if (r.a !== s.city && r.b !== s.city) continue;
    const to = r.a === s.city ? r.b : r.a;
    if (when && r.when !== when) continue;
    const tc = D.CITIES[to].c;
    let cost = r.cost * (s.mates.includes('nong') ? 0.8 : 1);
    let hp = r.hp;
    const bike = has(s, 'bike') && tc === 'VN' && city(s).c === 'VN' && r.mode !== 'flight' && r.mode !== 'boat';
    if (bike) { cost = 3; hp = Math.round(hp / 2); }
    out.push({ ...r, to, cost: Math.round(cost), hp, bike, blocked: s.blacklist[tc] && tc !== city(s).c ? `Blacklisted from ${D.COUNTRIES[tc].name}` : '' });
  }
  return out;
}

export function dayOptions(s) {
  const c = city(s);
  const o = [];
  for (const l of c.lm) {
    if (s.photos.some((p) => p.id === l.id)) continue;
    const cost = Math.round(P(s, l.cost));
    o.push({ type: 'photo', id: l.id, label: l.name, cost, r: l.r, pts: photoPts(s, l.r), why: s.cash < cost ? 'Too poor' : '', ksr: !!l.ksr });
  }
  for (const a of c.acts) {
    const ev = EVENTS['act_' + a];
    if (!ev || (ev.when && !ev.when(s))) continue;
    o.push({ type: 'act', id: a, label: ev.title, icon: ev.icon, sub: ev.sub || '', ksr: !!ev.ksr });
  }
  if (c.tags.includes('hostel')) o.push({ type: 'work', label: s.job === s.city ? 'Another shift at the hostel bar' : 'Get a job at the hostel', sub: `+${fmt(P(s, 22))}, free dorm bed and free drinks tonight`, ksr: true });
  if (c.tags.includes('wifi')) o.push({ type: 'poker', label: 'Grind online poker at a café', sub: 'Pick a stake', ksr: true });
  if (!c.tags.includes('remote')) o.push({ type: 'clinic', label: 'Visit the clinic', sub: `${fmt(clinicCost(s))}: patch up, test for nasties`, why: s.cash < clinicCost(s) ? 'Too poor' : '', ksr: true });
  o.push({ type: 'wander', label: c.tags.includes('remote') ? 'Go for a wander' : 'Wander around and see what happens', ksr: true });
  o.push({ type: 'rest', label: 'Sleep it off', sub: '+10 health, clears hangover', ksr: true });
  if (c.tags.includes('airport')) o.push({ type: 'home', label: 'Fly home to Straya', sub: `${fmt(D.FLIGHT_HOME)} one way. Locks in your score ×1.25`, why: s.cash < D.FLIGHT_HOME ? 'Too poor (try Mum)' : '' });
  return o;
}
export const clinicCost = (s) => Math.round(P(s, s.std ? 90 : 35));

export function doDay(s, a) {
  if (s.phase !== 'day' || s.card || s.over) return 'Not now';
  const c = city(s);
  const R = mkR(s);
  switch (a.type) {
    case 'photo': {
      const l = c.lm.find((q) => q.id === a.id);
      if (!l || s.photos.some((p) => p.id === l.id)) return 'Already got that one';
      const cost = Math.round(P(s, l.cost));
      if (s.cash < cost) return 'Too poor';
      s.cash -= cost;
      if (!l.ksr && s.city === 'bkk') s.ksr = false;
      if (l.ev) { openCard(s, l.ev, 'night', { lm: l.id, cost }); return ''; }
      const pts = R.photo(l);
      let txt = `📸 Snapped yourself squinting in front of ${l.name}. +${pts} pts.`;
      if (l.risk && chance(s, l.risk.p)) { R.hp(l.risk.hp); txt += ` ${l.risk.text} (${l.risk.hp} ❤️)`; }
      log(s, txt, 'photo');
      break;
    }
    case 'act': {
      const ev = EVENTS['act_' + a.id];
      if (!ev.ksr && s.city === 'bkk') s.ksr = false;
      openCard(s, 'act_' + a.id, 'night');
      return '';
    }
    case 'work': {
      if (!c.tags.includes('hostel')) return 'No hostel jobs here';
      const pay = Math.round(P(s, 22));
      s.cash += pay;
      s.job = s.city;
      s.hp = clamp(s.hp - 3, 0, s.hpMax);
      s.flags.shift = s.day;
      if (chance(s, 0.4)) { const id = drawEvent(s, 'work'); if (id) { openCard(s, id, 'night', { pay }); return ''; } }
      log(s, `Pulled a shift at the hostel: mopped up, poured shots, told 40 people where the 7-Eleven is. +${fmt(pay)}.`, 'work');
      break;
    }
    case 'poker': {
      const stake = a.stake || 50;
      if (!c.tags.includes('wifi')) return 'No wifi';
      if (s.cash < stake) return 'Too poor';
      log(s, pokerSession(s, stake), 'coin');
      break;
    }
    case 'clinic': {
      const cost = clinicCost(s);
      if (s.cash < cost) return 'Too poor';
      s.cash -= cost;
      s.hp = clamp(s.hp + 15, 0, s.hpMax);
      s.belly = 0; s.itchy = 0;
      if (s.std) {
        const q = D.STDS.find((x) => x.id === s.std.id);
        log(s, `🩺 The doctor ran some tests, made a face, and gave you an injection in the bum. ${s.std.known ? '' : 'Turns out you had '}${q.name}${s.std.known ? ' is cured' : ' — cured'}. Wrap it up, mate. (${fmt(cost)})`, 'good');
        s.std = null;
      } else log(s, `🩺 The clinic patched you up and said your liver "has character". All clear downstairs. (${fmt(cost)})`, 'good');
      break;
    }
    case 'wander': {
      const id = drawEvent(s, 'wander');
      if (id) { openCard(s, id, 'night'); return ''; }
      log(s, 'You wandered about. Bought a mango sticky rice. Nothing else happened.');
      break;
    }
    case 'rest': {
      R.hp(10);
      s.hungover = false;
      log(s, 'You slept until 2pm under the ceiling fan. +10 health.', 'good');
      break;
    }
    case 'travel': {
      const r = routesFrom(s, 'day').find((q) => q.i === a.ri);
      if (!r) return 'No such route';
      if (r.blocked) return r.blocked;
      if (s.cash < r.cost) return 'Too poor';
      startTravel(s, r);
      return '';
    }
    case 'home': {
      if (!c.tags.includes('airport')) return 'No airport here';
      if (s.cash < D.FLIGHT_HOME) return 'Too poor';
      s.cash -= D.FLIGHT_HOME;
      endRun(s, 'home');
      return '';
    }
    default: return 'Unknown action';
  }
  s.phase = 'night';
  return '';
}

function pokerSession(s, stake) {
  let p = 0.45 + 0.012 * Math.min(s.poker, 10) - (s.hungover ? 0.07 : 0) - Math.min(s.today, 10) * 0.01;
  p = clamp(p, 0.3, 0.57);
  s.poker += 0.5;
  if (chance(s, p)) {
    const win = Math.round(stake * (0.6 + rnd(s) * 0.9));
    s.cash += win;
    return pick(s, [
      `♠️ Went all-in with 7-2 offsuit and hit a full house on the river. +${fmt(win)}.`,
      `♠️ A German called "Bluffmeister88" tilted off his whole stack to you. +${fmt(win)}.`,
      `♠️ Ground out a solid session between banana shakes. +${fmt(win)}.`,
    ]);
  }
  const loss = stake;
  s.cash -= loss;
  return pick(s, [
    `♠️ Lost a coin flip, then another, then your temper. −${fmt(loss)}.`,
    `♠️ The café wifi dropped mid-hand and auto-folded your aces. −${fmt(loss)}.`,
    `♠️ Called a 13-year-old from Lithuania's bluff. It wasn't a bluff. −${fmt(loss)}.`,
  ]);
}

// ---------- travel ----------
function startTravel(s, r) {
  s.cash -= r.cost;
  s.job = null;
  if (s.city === 'bkk') s.ksr = false;
  s.transit = { ri: r.i, to: r.to, from: s.city, stage: 0, hp: r.hp, mode: r.mode, when: r.when, extra: r.extra, drinks: r.drinks, bike: r.bike };
  s.stats.buses += r.mode === 'flight' ? 0 : 1;
  log(s, `${D.MODES[r.mode].icon} ${r.when === 'night' ? 'Overnight ' : ''}${D.MODES[r.mode].name.toLowerCase()} to ${D.CITIES[r.to].name} (${fmt(r.cost)}).${r.note ? ' ' + r.note : ''}`, 'travel');
  advanceTravel(s);
}
function advanceTravel(s) {
  const t = s.transit;
  if (!t) return;
  const from = D.CITIES[t.from], to = D.CITIES[t.to];
  if (t.stage === 0) {
    t.stage = 1;
    if (from.c !== to.c) {
      s.stats.crossings++;
      const pk = s.inv.find((x) => x.id === 'package');
      if (pk) {
        let p = { flight: 0.32, bus: 0.2, minivan: 0.2, combo: 0.16, boat: 0.13, train: 0.15 }[t.mode];
        if (has(s, 'amulet')) p *= 0.75;
        p *= 1 + s.heat / 100;
        if (chance(s, p)) { openCard(s, 'busted', 'travel', { mode: t.mode, from: pk.from, to: to.c }); return; }
      }
      if (t.mode !== 'flight' && chance(s, 0.35)) { openCard(s, 'tr_border', 'travel'); return; }
    }
  }
  if (t.stage === 1) {
    t.stage = 2;
    if (chance(s, t.mode === 'flight' ? 0.12 : 0.38)) {
      const id = drawEvent(s, 'travel', (ev) => !ev.mode || ev.mode.includes(t.mode) || (ev.mode.includes('night') && t.when === 'night') || (ev.mode.includes('bike') && t.bike));
      if (id) { openCard(s, id, 'travel'); return; }
    }
  }
  if (t.stage === 2) arrive(s);
}
function arrive(s) {
  const t = s.transit;
  s.transit = null;
  s.hp = clamp(s.hp + t.hp, 0, s.hpMax);
  if (t.bike && chance(s, 0.07)) {
    const d = int(s, 12, 25);
    s.hp = clamp(s.hp - d, 0, s.hpMax);
    log(s, `🏍️ Came off the Honda Win on a gravel corner. Your "Vietnam tattoo" is the size of a dinner plate. −${d} ❤️`, 'bad');
  }
  // in-transit days (slow boats, the Bus of Death)
  for (let k = 0; k < t.extra; k++) {
    if (t.drinks) drink(s, t.drinks);
    endDay(s, true);
    if (s.over) return;
  }
  if (t.drinks && (t.extra || t.when === 'night')) drink(s, t.drinks);
  s.city = t.to;
  s.trail.push(t.to);
  const c = city(s);
  if (!s.visited[t.to]) s.visited[t.to] = 0;
  s.visited[t.to]++;
  s.countries[c.c] = 1;
  if (Object.keys(s.countries).length >= 7) grant(s, 'allcountries');
  if (t.extra && (t.from === 'vv' || t.from === 'lpb' || t.to === 'vv' || t.to === 'lpb') && (t.to === 'han' || t.from === 'han') && t.mode === 'bus') grant(s, 'nightbus');
  if (has(s, 'bike') && s.stats.bikeFrom && ((s.stats.bikeFrom === 'han' && t.to === 'sgn') || (s.stats.bikeFrom === 'sgn' && t.to === 'han'))) grant(s, 'bike');
  log(s, `📍 Arrived in ${c.name}${c.sub ? ' (' + c.sub + ')' : ''}, ${D.COUNTRIES[c.c].name}.`, 'arrive');
  // package delivery
  const pk = s.inv.find((x) => x.id === 'package' && x.dest === t.to);
  if (pk) {
    s.inv.splice(s.inv.indexOf(pk), 1);
    s.cash += pk.pay;
    s.heat = clamp(s.heat + 15, 0, 100);
    log(s, `📦 A man in a Manchester United shirt met you at the bus station, took the package and handed you an envelope. ${fmt(pk.pay)}. Do not ask questions.`, 'good');
  }
  if (s.hp <= 0) return endRun(s, 'medevac');
  if (t.when === 'night') {
    s.tonight = null;
    dawn(s, true);
  } else {
    s.phase = 'night';
  }
}

// ---------- the night ----------
export function nightOptions(s) {
  const c = city(s);
  const bars = c.bars ? Object.entries(c.bars).map(([k, name]) => ({ k, name, price: drinkPrice(s, k), special: k === 'bp' && s.city === 'kpg' && isFullMoon(s) ? '🌕 FULL MOON PARTY TONIGHT' : '' })) : [];
  const stays = c.stays.map((id) => ({ id, ...D.STAYS[id], price: stayPrice(s, id) }));
  return { bars, stays, routes: routesFrom(s, 'night') };
}
export function doNight(s, n) {
  if (s.phase !== 'night' || s.card || s.over) return 'Not now';
  const c = city(s);
  if (n.travel != null) {
    const r = routesFrom(s, 'night').find((q) => q.i === n.travel);
    if (!r) return 'No such route';
    if (r.blocked) return r.blocked;
    if (s.cash < r.cost) return 'Too poor';
    s.tonight = null;
    startTravel(s, r);
    return '';
  }
  const stay = c.stays.includes(n.stay) ? n.stay : c.stays[0];
  s.stay = stay;
  s.tonight = { bar: n.bar || null, level: n.level ?? 1, stay, stupid: false };
  if (n.bar && c.bars) {
    if (n.bar === 'fancy' && s.city === 'bkk') s.ksr = false;
    const L = D.LEVELS[s.tonight.level];
    const price = drinkPrice(s, n.bar);
    let want = int(s, L.drinks[0], L.drinks[1]);
    let free = s.flags.shift === s.day && n.bar === 'bp' ? 4 : 0;
    let paidN = Math.max(0, want - free);
    let tab = paidN * price * (s.mates.includes('tarquin') ? 0.75 : 1);
    let broke = false;
    if (tab > s.cash) { paidN = Math.floor(s.cash / (price * (s.mates.includes('tarquin') ? 0.75 : 1))); tab = paidN * price * (s.mates.includes('tarquin') ? 0.75 : 1); broke = true; }
    const got = paidN + Math.min(free, want);
    s.cash -= tab;
    s.stats.spentBeer += tab;
    drink(s, got);
    const tolF = 1 - 0.12 * (s.tol + (hasMate(s, 'tol') ? 1 : 0));
    const dmg = Math.round(L.hp * tolF * (got / Math.max(1, want)));
    s.hp = clamp(s.hp - dmg, 0, s.hpMax);
    s.stats.nights++;
    s.hungoverNext = s.tonight.level === 2;
    log(s, `${D.BAR_KIND[n.bar].icon} ${L.label} at ${c.bars[n.bar]}: ${got} drinks, ${fmt(tab)}${dmg ? `, −${dmg} ❤️` : ''}.${broke ? ' You ran out of money and had to go home. Tragic.' : ''}`, 'beer');
    s.tonight.stupid = got >= 8 && chance(s, L.stupid);
    if (n.bar === 'bp' && s.city === 'kpg' && isFullMoon(s)) { openCard(s, 'fullmoon', 'sleep'); return ''; }
    if (got > 0 && chance(s, 0.85)) {
      const id = drawEvent(s, 'bar', (ev) => !ev.bar || ev.bar.includes(n.bar));
      if (id) { openCard(s, id, 'sleep'); return ''; }
    }
  } else {
    s.hungoverNext = false;
    if (!c.bars && chance(s, 0.35)) { const id = drawEvent(s, 'remote'); if (id) { openCard(s, id, 'sleep'); return ''; } }
    log(s, c.bars ? 'An early night. Your liver sent a thank-you card.' : 'No bar out here. You watched the stars and listened to things in the jungle.', 'quiet');
  }
  afterBar(s);
  return '';
}
function afterBar(s) {
  const t = s.tonight;
  if (t && t.stupid) {
    t.stupid = false;
    const id = drawEvent(s, 'stupid');
    if (id) { openCard(s, id, 'sleep'); return; }
  }
  sleep(s);
}
function sleep(s) {
  const c = city(s);
  let stay = (s.tonight && s.tonight.stay) || c.stays[0];
  let cost = stayPrice(s, stay);
  if (s.cash < cost) {
    const fallback = c.stays.find((id) => stayPrice(s, id) <= s.cash) || 'beach';
    log(s, `Couldn't afford the ${D.STAYS[stay].name.toLowerCase()}. ${fallback === 'beach' ? 'Slept rough.' : 'Downgraded to the ' + D.STAYS[fallback].name.toLowerCase() + '.'}`, 'bad');
    stay = fallback;
    cost = fallback === 'beach' ? 0 : stayPrice(s, stay);
  }
  s.cash -= cost;
  const S = D.STAYS[stay];
  let gain = S.hp + (stay === 'dorm' && has(s, 'earplugs') ? 5 : 0);
  if (s.belly > 0) gain = Math.min(gain, 0);
  s.hp = clamp(s.hp + gain, 0, s.hpMax);
  if (s.tonight) s.tonight.stayed = stay;
  const pEv = { beach: 0.45, hammock: 0.3, dorm: 0.32, guest: 0.3, homestay: 0.55, hotel: 0.08, resort: 0.2 }[stay];
  if (chance(s, pEv)) {
    const id = drawEvent(s, 'sleep', (ev) => !ev.stay || ev.stay.includes(stay));
    if (id) { openCard(s, id, 'dawn', { stay }); return; }
  }
  dawn(s);
}

// ---------- dawn: close out the day, start the next ----------
function dawn(s, fromTransit = false) {
  endDay(s, fromTransit);
  if (s.over) return;
  morning(s);
}
function morning(s) {
  s.phase = 'day';
  s.tonight = null;
  if (s.std && s.std.known && !s.std.told) { s.std.told = true; openCard(s, 'mn_std', 'day'); return; }
  if (chance(s, 0.16)) {
    const id = drawEvent(s, 'morning');
    if (id) { openCard(s, id, 'day'); return; }
  }
}

export function endDay(s, transit = false) {
  if (s.today > 0) s.dry = 0; else s.dry++;
  s.hpMax = clamp(s.hpBase - Math.floor(s.drinks / 14), 40, 100);
  if (s.std) {
    if (!s.std.known && s.day - s.std.day0 >= s.std.inc) s.std.known = true;
    if (s.std.known) s.hp -= D.STDS.find((q) => q.id === s.std.id).drain;
  }
  if (s.itchy > 0) s.itchy--;
  if (s.belly > 0) { s.hp -= 4; s.belly--; }
  if (s.prison) s.hp -= 1;
  s.hp = clamp(s.hp, 0, s.hpMax);
  s.hungover = !!s.hungoverNext;
  s.hungoverNext = false;
  if (!transit && !s.prison && s.cash < 1 && coinValue(s) < 1) grant(s, 'skint');
  tickCoins(s);
  s.day++;
  s.today = 0;
  s.mumToday = false;
  if (s.job && s.job !== s.city) s.job = null;
  if (s.dry === 2) log(s, '🥤 Two days dry. Your hands are shaking. You can feel... thoughts.', 'warn');
  if (s.dry === 3) log(s, '⚠️ THREE DAYS DRY. One more and you will achieve clarity. Drink something. Anything.', 'warn');
  if (s.hp <= 0) return endRun(s, s.prison ? 'infirmary' : 'medevac');
  if (s.dry > 3) return endRun(s, 'sober');
}

// ---------- prison: the secret game within the game ----------
export const PRISONS = {
  TH: { name: 'Bang Kwak Central Prison', short: 'Bang Kwak', guard: 'Lieutenant Prasert', cell: 'Big Somchai', exit: 'rep' },
  KH: { name: 'Prey Sorry Correctional Centre', short: 'Prey Sorry', guard: 'Captain Vuthy', cell: 'Uncle Sokha', exit: 'bkk' },
};
function enterPrison(s, c) {
  const pc = PRISONS[c] ? c : 'TH';
  const P0 = PRISONS[pc];
  const lost = Math.round(s.cash * 0.6);
  s.cash -= lost;
  s.inv = s.inv.filter((x) => x.id !== 'package');
  const sentence = int(s, 45, 110);
  s.prison = { c: pc, name: P0.name, sentence, total: sentence, served: 0, smokes: 6, respect: 0, hooch: 4, brew: 0, letters: 0, tunnel: 0, spoon: false, tv: false, bribes: 0 };
  s.job = null;
  s.phase = 'prison';
  s.flags.prisonCount = (s.flags.prisonCount || 0) + 1;
  log(s, `⛓️ Welcome to ${P0.name}. Sentence: ${sentence} days. ${fmt(lost)} of your cash "went missing" during processing. Your cellmate, ${P0.cell}, offers you a smoke and a welcome bag of hooch.`, 'big');
}
export function prisonOptions(s) {
  const p = s.prison;
  if (!p) return [];
  const P0 = PRISONS[p.c];
  const bribe = bribeCost(s);
  return [
    { id: 'kitchen', label: 'Kitchen duty', sub: '+3–5 smokes' },
    { id: 'yard', label: 'Lift weights in the yard', sub: '+4 health, +respect' },
    { id: 'fight', label: 'Prison Muay Thai bout', sub: 'Win: smokes, respect, days off. Lose: teeth.' },
    { id: 'brew', label: 'Brew hooch in a plastic bag', sub: p.brew ? `Brewing… ready day ${p.brew}` : '4 smokes. 6 drinks in 2 days.', why: p.brew ? 'Already brewing' : p.smokes < 4 ? 'Need 4 smokes' : '' },
    { id: 'letter', label: 'Write to the Australian Embassy', sub: `Prisoner transfer: ${Math.min(100, p.letters)}%` },
    { id: 'bribe', label: `Make a "donation" to ${P0.guard}'s orchestra fund`, sub: `${fmt(bribe)}. Might get you out. Might not.`, why: p.served < 10 ? `He doesn't take donations from new arrivals (${10 - p.served}d)` : s.cash < bribe ? 'Too poor (call Mum?)' : '' },
    { id: 'tv', label: 'Sell your story to Aussie telly', sub: 'Big money. Mum will see it.', why: p.tv ? 'Already done' : '' },
    { id: 'spoon', label: 'Buy a spoon', sub: '12 smokes. For "soup".', why: p.spoon ? 'Got one' : p.smokes < 12 ? 'Need 12 smokes' : '' },
    { id: 'dig', label: 'Dig', sub: `Tunnel: ${Math.min(100, p.tunnel)}%`, why: !p.spoon ? 'Need a spoon' : '' },
    { id: 'escape', label: 'ESCAPE', sub: 'Through the tunnel. Pray.', why: p.tunnel < 100 ? 'Tunnel not finished' : '' },
    { id: 'phone', label: 'Buy a contraband phone', sub: '30 smokes. Crypto, poker and Mum from your bunk.', why: has(s, 'phone') ? 'Got one' : p.smokes < 30 ? 'Need 30 smokes' : '' },
    { id: 'cards', label: 'Play cards for smokes', sub: 'Bet 5 smokes', why: p.smokes < 5 ? 'Need 5 smokes' : '' },
  ];
}
export const bribeCost = (s) => Math.round((s.prison.sentence * 30 + 900) * (s.prison.c === 'KH' ? 0.7 : 1) * (1 + s.prison.bribes * 0.6));
export function drinkHooch(s) {
  const p = s.prison;
  if (!p || p.hooch <= 0 || s.card) return;
  const n = Math.min(2, p.hooch);
  p.hooch -= n;
  drink(s, n);
  s.hp = clamp(s.hp - 1, 0, s.hpMax);
  log(s, `🧴 Drank ${n} "drinks" of bag hooch. Tastes like fermented Fanta and despair.`, 'beer');
}
export function doPrison(s, id) {
  const p = s.prison;
  if (!p || s.phase !== 'prison' || s.card || s.over) return 'Not now';
  const opt = prisonOptions(s).find((o) => o.id === id);
  if (!opt || opt.why) return opt ? opt.why : 'No';
  const P0 = PRISONS[p.c];
  const R = mkR(s);
  let txt = '';
  switch (id) {
    case 'kitchen': {
      const n = int(s, 3, 5); p.smokes += n;
      txt = `Peeled 400 potatoes and stole a cucumber. +${n} smokes.`;
      if (chance(s, 0.12)) { R.hp(-4); txt += ' Burnt your arm on the rice pot.'; }
      break;
    }
    case 'yard': R.hp(4); p.respect += 2; txt = `Benched a slab of concrete. A Russian called Dmitri nodded at you. Respect +2.`; break;
    case 'fight': {
      const f = R.fight('prison', 0.05 - p.respect * 0.004);
      if (f.won) { const off = int(s, 3, 8); p.smokes += 10; p.respect += 6; p.sentence = Math.max(1, p.sentence - off); txt = `You won by elbow in the third round! The guards cheered. +10 smokes, −${off} days off your sentence.`; }
      else { p.respect += 1; txt = `You were knocked out by a 52 kg man called "The Mosquito". −${f.dmg} ❤️.`; }
      break;
    }
    case 'brew': p.smokes -= 4; p.brew = s.day + 2; txt = 'Fruit, sugar, bread and a plastic bag hidden behind the toilet. Nature will do the rest.'; break;
    case 'letter': {
      const n = int(s, 5, 12); p.letters += n;
      txt = `Wrote your ${ordinal(Math.ceil(p.letters / 9))} letter to the embassy. A consular officer named Deb replied "noted". Transfer +${n}%.`;
      if (p.letters >= 100) { log(s, txt, 'card'); endRun(s, 'transfer'); return ''; }
      break;
    }
    case 'bribe': {
      const cost = bribeCost(s);
      s.cash -= cost; p.bribes++;
      if (chance(s, 0.45 + p.respect * 0.005)) {
        log(s, `💰 ${P0.guard} accepted your ${fmt(cost)} "donation". You were released at 4am and quietly driven to the border.`, 'good');
        releaseTo(s, P0.exit, true);
        return '';
      }
      p.sentence += 10;
      txt = `${P0.guard} took your ${fmt(cost)}, thanked you warmly, and added 10 days for "attempted corruption".`;
      break;
    }
    case 'tv': {
      p.tv = true;
      const pay = 2500;
      s.cash += pay; R.mum(2); R.ach('telly');
      txt = `A tanned man from "Sixty Minutes, Give or Take" filmed you crying in an orange shirt. ${fmt(pay)} wired to your account. Mum cried too, on national TV.`;
      break;
    }
    case 'spoon': p.smokes -= 12; p.spoon = true; txt = 'You bought a stainless steel spoon. The vendor winked.'; break;
    case 'dig': {
      if (chance(s, 0.08)) { p.spoon = false; p.tunnel = Math.max(0, p.tunnel - 30); p.sentence += 15; txt = 'A guard found your tunnel behind the Bob Marley poster. Spoon confiscated, +15 days.'; break; }
      const n = int(s, 7, 15); p.tunnel += n;
      txt = `Dug ${n * 10} cm with your spoon. Hid the dirt in your pockets and walked it out into the yard like in the movies. Tunnel ${Math.min(100, p.tunnel)}%.`;
      break;
    }
    case 'escape': {
      if (chance(s, 0.6)) {
        R.ach('escape');
        log(s, `🥄 You crawled through 40 metres of tunnel, came up in a banana plantation and ran for 3 days through the jungle. You're free! (and blacklisted from ${D.COUNTRIES[p.c].name} forever)`, 'good');
        releaseTo(s, P0.exit, true);
        return '';
      }
      R.hp(-20); p.tunnel = 0; p.spoon = false; p.sentence += 30;
      txt = 'You got stuck halfway because of all the Pad Thai. Dragged out by the ankles. +30 days, tunnel filled in.';
      break;
    }
    case 'phone': p.smokes -= 30; addItem(s, 'phone') || (s.inv.pop(), addItem(s, 'phone')); txt = 'A Nokia arrived inside a roast chicken. Contraband phone acquired.'; break;
    case 'cards': {
      if (chance(s, 0.48 + Math.min(s.poker, 10) * 0.01)) { p.smokes += 5; txt = 'Won 5 smokes at Big Two. Your cellmate suspects witchcraft.'; }
      else { p.smokes -= 5; txt = 'Lost 5 smokes to an old man who never looks at his cards.'; }
      break;
    }
  }
  log(s, `⛓️ ${txt}`, 'prison');
  prisonEndDay(s);
  return '';
}
const ordinal = (n) => n + (['th', 'st', 'nd', 'rd'][(n % 100 >> 3) ^ 1 && n % 10] || 'th');
function releaseTo(s, cityId, blacklist) {
  const c = s.prison.c;
  if (blacklist) s.blacklist[c] = true;
  s.prison = null;
  s.inv = s.inv.filter((x) => x.id !== 'phone');
  grant(s, 'hilton');
  s.city = cityId;
  s.trail.push(cityId);
  s.visited[cityId] = (s.visited[cityId] || 0) + 1;
  s.countries[D.CITIES[cityId].c] = 1;
  s.mum = Math.max(s.mum, 2);
  endDay(s, true);
  if (s.over) return;
  s.phase = 'day';
}
function prisonEndDay(s) {
  const p = s.prison;
  p.sentence--;
  p.served++;
  s.prisonDays++;
  if (p.brew && s.day + 1 >= p.brew) { p.hooch += 6; p.brew = 0; log(s, '🧴 Your hooch is ready. 6 drinks of jail juice.', 'beer'); }
  if (chance(s, 0.22)) {
    const id = drawEvent(s, 'prison');
    if (id) { openCard(s, id, 'prisonDawn'); return; }
  }
  prisonDawn(s);
}
function prisonDawn(s) {
  endDay(s);
  if (s.over || !s.prison) return;
  if (s.prison.sentence <= 0) { endRun(s, 'deported'); return; }
  s.phase = 'prison';
}

// ---------- endings ----------
export const ENDINGS = {
  home: { title: 'Home Sweet Home', icon: '🏠', mult: 1.25, text: (s) => `You flew home to a hero's welcome (Mum, at arrivals, holding a sign that says "${s.name.split(' ')[0].toUpperCase()} YOU STINK"). ${s.day} days abroad.` },
  mum: { title: 'Repatriated by Mum', icon: '👩‍👦', mult: 1.1, text: () => 'Mum bought you a one-way ticket home. She met you at the gate with a Woolies bag of clean undies and a look you will never forget.' },
  medevac: { title: 'Medevac to Darwin', icon: '🚁', mult: 0.8, text: () => 'Your body finally filed a formal complaint. You woke up in Royal Darwin Hospital with a drip in your arm and a bill your travel insurance is disputing. Should\'ve read the fine print.' },
  infirmary: { title: 'The Prison Infirmary', icon: '🩼', mult: 0.7, text: () => 'You collapsed in the yard. The embassy got you medically evacuated, then billed your parents for it. Mum has started a GoFundMe.' },
  sober: { title: 'Clarity', icon: '🧘', mult: 0.9, text: () => 'Four days without a drink. The fog lifted. You looked at yourself, really looked, and booked a flight home to enrol in a TAFE accounting course. Tragic. Your mates will never forgive you.' },
  deported: { title: 'Deported', icon: '🛂', mult: 1.0, text: (s) => `You served your time at ${s.flags.lastPrison || 'the prison'} and got escorted onto a Jetstar flight by two immigration officers who ate all your peanuts. Banned for life. Worth it?` },
  transfer: { title: 'Prisoner Transfer', icon: '✈️', mult: 0.9, text: () => 'The embassy came through. You were transferred to a prison in Australia to serve out your sentence. The food is worse. Mum visits on Sundays.' },
  quit: { title: 'Called It', icon: '🏳️', mult: 1.0, text: () => 'You sat on a plastic chair, looked at the sunset and decided you were done. Some stories end with a whimper and a Chang.' },
};
export function endRun(s, kind) {
  if (s.over) return;
  if (s.prison) { s.flags.lastPrison = s.prison.name; }
  const E = ENDINGS[kind];
  // end-of-run achievements
  const days = s.day;
  if (days >= 10 && s.ksr && s.trail.length === 1) grant(s, 'khaosan');
  if (days >= 30 && !s.askedMum) grant(s, 'mumsfav');
  if (s.hook.free + s.hook.paid >= 5 && !s.stdHad.length) grant(s, 'clean');
  if (s.drinks >= 500) grant(s, 'liver');
  if (kind === 'home' && days >= 30) grant(s, 'home');
  if (kind === 'sober') grant(s, 'sober');
  if (kind === 'deported' || kind === 'transfer') grant(s, 'hilton');
  s.over = { kind, title: E.title, icon: E.icon, mult: E.mult, text: E.text(s) };
  s.phase = 'over';
  s.card = null;
  s.prison = null;
  log(s, `${E.icon} ${E.title}. Final score: ${score(s).total.toLocaleString()}.`, 'big');
}
export function quit(s) { if (!s.over && !s.card) endRun(s, 'quit'); }

export function remoteCount(s) { return s.photos.filter((p) => p.remote).length; }
