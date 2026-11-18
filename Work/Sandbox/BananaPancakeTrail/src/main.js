// Banana Pancake Trail — UI: title screen, HUD, scene panel, side tabs, event cards, end screen, saves.
import * as S from './sim.js';
import * as D from './data.js';
import { createMap, cityXY } from './map.js';

const $ = (id) => document.getElementById(id);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const fmt = S.fmt;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
};
const SAVE = 'bpt.save', BEST = 'bpt.best', ACH = 'bpt.ach';
const loadJSON = (k, d) => { try { return JSON.parse(store.get(k)) ?? d; } catch (e) { return d; } };

const rname = () => `${D.FIRST[Math.floor(Math.random() * D.FIRST.length)]} from ${D.SUBURB[Math.floor(Math.random() * D.SUBURB.length)]}`;
const ui = { s: null, sel: { bar: 'bp', level: 1, stay: null }, tab: 'bag', arch: 'tradie', name: rname(), toastT: 0, mapCollapsed: false };

const map = createMap($('mapwrap'), { onCity: cityPop });

// =====================================================================================
// title screen
// =====================================================================================
function stars(r) { const n = r < 15 ? 1 : r < 30 ? 2 : r < 50 ? 3 : r < 75 ? 4 : 5; return '★'.repeat(n) + '☆'.repeat(5 - n); }
function showTitle() {
  document.body.className = '';
  ['top', 'statusline', 'app', 'end', 'modal'].forEach((id) => $(id).classList.add('hidden'));
  const best = loadJSON(BEST, []);
  const got = loadJSON(ACH, {});
  const save = loadSave();
  $('title').classList.remove('hidden');
  $('title').innerHTML = `<div class="tw">
    <div class="logo-big">BANANA PANCAKE TRAIL<small>An Aussie backpacker roguelike through South East Asia</small></div>
    <span class="r18">18+ · Booze, bad decisions & cartoon debauchery · All characters are made up</span>
    <div class="tpanel">
      <h3>Who are ya?</h3>
      <div class="namebox"><input id="pname" maxlength="40" value="${esc(ui.name)}" aria-label="Your name"><button class="tb" id="reroll" title="Random bogan name">🎲</button></div>
      <div class="archs">${Object.entries(D.ARCHETYPES).map(([id, a]) => `<button class="arch${ui.arch === id ? ' sel' : ''}" data-arch="${id}"><span class="ic">${a.icon}</span><b>${a.name}</b><p>${a.blurb}</p><span class="kv"><span>💵 ${fmt(a.cash)}${a.coins ? ' + $1.5k in ROO' : ''}</span><span>😎 ${a.charm}</span><span>👩 ${a.mum}/10</span>${a.tol ? `<span>🍺 tolerance +${a.tol}</span>` : ''}${a.mate ? `<span>👬 ${D.MATES[a.mate].name}</span>` : ''}${a.hp < 100 ? `<span>❤️ ${a.hp}</span>` : ''}</span></button>`).join('')}</div>
      <button class="start" id="go">Land on Khao San Road →</button>
      ${save ? `<button class="start alt" id="cont">Continue: ${esc(save.name)}, day ${save.day} in ${D.CITIES[save.city].name}</button>` : ''}
    </div>
    <div class="cols2">
      <div class="tpanel rules"><h3>How it works</h3><ul>
        <li>Each day: <b>one thing to do</b>, then a <b>night out</b> (local dive, backpacker bar or fancy hotel bar) and a <b>bed</b>. Cheap beds have bedbugs. Overnight buses hurt.</li>
        <li><b>Score</b>: 10 pts per day abroad, 2 per drink, <b>150 per hookup you didn't pay for</b> (only 30 if you did), and landmark pics worth 2× their rarity. Obscure, hard-to-reach spots score big.</li>
        <li>You can't go more than <b>3 days without a drink</b>. Remote places have no bars, so carry booze in your backpack.</li>
        <li>Every drink chips at your <b>liver</b>, which caps your max health. Fights, bad buses, wildlife and stupidity hurt too.</li>
        <li>Money: <b>Mum</b> (her patience runs out), <b>hostel shifts</b>, <b>online poker</b>, <b>crypto</b>, or "delivering packages"... which might lead somewhere you don't want to go.</li>
        <li>Fly home from any airport to lock in <b>×1.25</b>. Medevacs, getting sober and Mum dragging you home score less.</li>
      </ul></div>
      <div class="tpanel"><h3>Hall of Fame</h3>${best.length ? `<table class="hof"><tr><th>#</th><th>Who</th><th>Days</th><th>Ending</th><th>Score</th></tr>${best.slice(0, 10).map((b, i) => `<tr><td>${i + 1}</td><td>${esc(b.name)} <span class="dim">${D.ARCHETYPES[b.arch]?.icon || ''}</span></td><td>${b.days}</td><td>${S.ENDINGS[b.end]?.icon || ''} ${S.ENDINGS[b.end]?.title || b.end}</td><td><b>${b.score.toLocaleString()}</b></td></tr>`).join('')}</table>` : '<p class="dim">No runs yet. Go on, have a crack.</p>'}</div>
    </div>
    <div class="tpanel"><h3>Achievements <small class="dim">${Object.keys(got).length}/${Object.keys(D.ACHIEVEMENTS).length}</small></h3><div class="achs">${Object.entries(D.ACHIEVEMENTS).map(([id, a]) => `<div class="achv${got[id] ? '' : ' locked'}" title="${esc(a.desc)}"><span class="ic">${a.icon}</span><span><b>${a.name}</b><span class="dim">${a.desc}</span></span></div>`).join('')}</div></div>
  </div>`;
  $('reroll').onclick = () => { ui.name = rname(); $('pname').value = ui.name; };
  $('pname').oninput = (e) => { ui.name = e.target.value; };
  $('title').querySelectorAll('[data-arch]').forEach((b) => (b.onclick = () => { ui.arch = b.dataset.arch; $('title').querySelectorAll('.arch').forEach((x) => x.classList.toggle('sel', x === b)); }));
  $('go').onclick = () => startRun();
  if (save) $('cont').onclick = () => { ui.s = save; enterGame(); };
}
function loadSave() {
  const s = loadJSON(SAVE, null);
  if (!s || s.v !== 1 || s.over) return null;
  return s;
}
function startRun() {
  ui.s = S.newRun({ arch: ui.arch, name: (ui.name || rname()).trim().slice(0, 40) });
  ui.sel = { bar: 'bp', level: 1, stay: null };
  enterGame();
}
function enterGame() {
  ui.mark = null;
  $('title').classList.add('hidden');
  ['top', 'statusline', 'app'].forEach((id) => $(id).classList.remove('hidden'));
  map.focus(ui.s.city, 804 / (ui.s.city === 'bkk' ? 1.9 : 2.2));
  render();
}

// =====================================================================================
// main render
// =====================================================================================
function render() {
  const s = ui.s;
  if (!s) return;
  document.body.className = s.prison ? 'prison' : s.phase === 'night' && !s.over ? 'night' : '';
  renderTop(); renderStatus(); map.render(s); renderLoc(); renderScene(); renderSide(); renderModal(); renderEnd(); showToast();
  if (s.over) store.del(SAVE); else store.set(SAVE, JSON.stringify(s));
}

function renderTop() {
  const s = ui.s;
  const sc = S.score(s);
  const why = S.mumAvailable(s);
  const bar = s.tonight && s.tonight.bar;
  $('top').innerHTML = `<div id="logo" title="Main menu">Banana <span>Pancake</span> Trail</div>
    <div class="stats">
      <span class="st" title="Days abroad">📅 Day ${s.day}</span>
      <span class="st" title="Cash${S.coinValue(s) >= 1 ? ` (+${fmt(S.coinValue(s))} in crypto)` : ''}">💵 ${fmt(s.cash)}</span>
      <span class="st${s.hp < 30 ? ' alert' : ''}" title="Health ${Math.round(s.hp)} / ${s.hpMax}. The striped bit is liver damage: every 14 drinks costs 1 max health, forever.">❤️ <span class="hpbar"><i style="width:${s.hp}%"></i><u style="width:${100 - s.hpMax}%"></u></span>${Math.round(s.hp)}<small>/${s.hpMax}</small></span>
      <span class="st${s.dry >= 2 ? ' alert' : ''}" title="Days without a drink. 4 in a row and you'll find clarity (game over).">🍺 <span class="pips">${[1, 2, 3].map((i) => `<i class="${s.dry >= i ? 'on' : ''}"></i>`).join('')}</span><small>${s.drinks} total</small></span>
      <span class="st" title="Charm (affects hookups)">😎 ${S.charm(s, bar)}</span>
      <span class="st${s.mum <= 2 ? ' alert' : ''}" title="Mum's patience">👩 ${s.mum}/10</span>
      <span class="st" title="Score so far (before ending multiplier)">⭐ ${sc.base.toLocaleString()}</span>
    </div>
    <button class="tb" data-a="mum" ${why ? `disabled title="${esc(why)}"` : 'title="Call Mum (free, once a day)"'}>📞 Mum</button>
    <button class="tb" data-a="quit" title="End this run now">🏳️</button>`;
}

function renderStatus() {
  const s = ui.s;
  const t = [];
  if (s.hungover) t.push(['bad', '🥴 Hungover (−1 charm, worse at poker)']);
  if (s.itchy > 0) t.push(['bad', `🐛 Bedbug bites (${s.itchy}d)`]);
  if (s.belly > 0) t.push(['bad', `🤢 Bali belly (${s.belly}d)`]);
  if (s.std && s.std.known) t.push(['bad', `🦠 ${D.STDS.find((q) => q.id === s.std.id).name} (−${D.STDS.find((q) => q.id === s.std.id).drain} ❤️/day) — see a clinic`]);
  if (s.dry >= 2) t.push(['bad', `🥤 ${s.dry} days dry! Drink something!`]);
  const pk = s.inv.find((x) => x.id === 'package');
  if (pk) t.push(['warn', `📦 Package → ${D.CITIES[pk.dest].name} (${fmt(pk.pay)})`]);
  if (s.job && s.job === s.city) t.push(['good', '🧹 Hostel job: free dorm bed']);
  if (s.nextPhoto > 1) t.push(['good', `📸 Next landmark pic ×${s.nextPhoto}`]);
  if (s.charmTemp && s.charmTemp.until >= s.day) t.push([s.charmTemp.v > 0 ? 'good' : 'bad', `😎 ${s.charmTemp.v > 0 ? '+' : ''}${s.charmTemp.v} charm (${s.charmTemp.until - s.day + 1}d)`]);
  if (D.CITIES[s.city].c === 'TH' && !s.prison) { const n = S.daysToFullMoon(s); t.push(['', n === 0 ? '🌕 FULL MOON TONIGHT (Koh Phangan)' : `🌔 Full Moon Party in ${n} day${n > 1 ? 's' : ''}`]); }
  if (s.city === 'bkk' && s.ksr && s.trail.length === 1 && !s.prison) t.push(['good', `🛣️ Still on Khao San (${s.day}/10 days for the achievement)`]);
  for (const c of Object.keys(s.blacklist)) t.push(['bad', `🚫 Banned from ${D.COUNTRIES[c].name}`]);
  if (s.mumBlockedUntil > s.day) t.push(['bad', `📵 Mum's not answering (${s.mumBlockedUntil - s.day}d)`]);
  $('statusline').innerHTML = t.map(([c, x]) => `<span class="tag ${c}">${x}</span>`).join('');
  $('statusline').classList.toggle('hidden', !t.length);
}

function renderLoc() {
  const s = ui.s;
  const c = D.CITIES[s.city], C = D.COUNTRIES[c.c];
  const tags = [];
  if (c.tags.includes('remote')) tags.push('🏕️ Remote: no bars, no clinic');
  if (c.tags.includes('airport')) tags.push('✈️ Airport');
  if (c.tags.includes('wifi')) tags.push('📶 Wifi');
  if (c.tags.includes('hostel')) tags.push('🧹 Hostel jobs');
  if (c.tags.includes('seedy')) tags.push('🕴️ Dodgy blokes');
  if (c.tags.includes('beach')) tags.push('🏖️ Beach');
  $('maptitle').textContent = s.prison ? `${S.PRISONS[s.prison.c].short} 🔒` : `${C.flag} ${c.name}`;
  $('loc').innerHTML = s.prison
    ? `<b>${s.prison.name}</b><br><span class="dim">You can see the map on the guard's wall. Your trip is on hold. Days inside still count (at half points).</span>`
    : `<b>${c.name}</b>${c.sub ? ` <span class="dim">· ${c.sub}</span>` : ''} <span class="dim">· ${C.name} · ${C.beer} · ${D.STAYS.dorm.icon} from ${fmt(S.stayPrice(s, c.stays.includes('dorm') ? 'dorm' : c.stays[0]))}</span><br><span class="dim">${tags.join(' · ')}</span><br><span class="dim">Tap a highlighted city on the map to see how to get there.</span>`;
  $('mapcard').classList.toggle('collapsed', ui.mapCollapsed);
}

// =====================================================================================
// scene
// =====================================================================================
function opt({ a, data = {}, t, s, r = [], dis = '', sel = false, badge = '', cls = '' }) {
  const attrs = Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');
  return `<button class="opt${sel ? ' sel' : ''}${cls ? ' ' + cls : ''}" data-a="${a}" ${attrs} ${dis ? `disabled title="${esc(dis)}"` : ''}>${badge ? `<span class="badge">${badge}</span>` : ''}<span class="t">${t}</span>${s ? `<span class="s">${s}</span>` : ''}${r.length ? `<span class="r">${r.map((x) => `<span>${x}</span>`).join('')}</span>` : ''}${dis ? `<span class="s bad">${esc(dis)}</span>` : ''}</button>`;
}
function routeOpt(s, r) {
  const to = D.CITIES[r.to], tc = D.COUNTRIES[to.c];
  const remote = to.tags.includes('remote');
  const dis = r.blocked || (s.cash < r.cost ? 'Too poor' : '');
  const arrive = r.when === 'night' ? (r.extra ? `arrive in ${r.extra + 1} mornings` : 'arrive tomorrow morning') : r.extra ? `${r.extra + 1} days, arrive at night` : 'arrive tonight';
  const border = to.c !== D.CITIES[s.city].c;
  const pk = border && s.inv.some((x) => x.id === 'package');
  return opt({ a: 'route', data: { ri: r.i, when: r.when }, t: `${D.MODES[r.mode].icon} ${tc.flag} ${to.name}${s.visited[r.to] ? '' : ' <span class="dim">· new</span>'}`, s: r.note + (r.bike ? ' 🏍️ On your Honda Win.' : ''), r: [fmt(r.cost), r.hp ? `${r.hp} ❤️` : 'comfy', arrive, ...(remote ? ['🏕️ no bars'] : []), ...(border ? ['🛂 border'] : []), ...(pk ? ['⚠️ package!'] : []), ...(r.drinks ? [`🍺 ${r.drinks}/day on board`] : [])], dis, cls: `route-${r.to}` });
}

function renderScene() {
  const s = ui.s;
  const el = $('scene');
  if (s.over) { el.innerHTML = `<header><h2>${s.over.icon} ${s.over.title}</h2></header><div class="pad"><p>${s.over.text}</p></div>`; return; }
  if (s.prison) return renderPrison(el);
  const c = D.CITIES[s.city];
  if (s.phase === 'day') {
    const o = S.dayOptions(s);
    const lms = o.filter((x) => x.type === 'photo');
    const acts = o.filter((x) => x.type === 'act');
    const hustle = o.filter((x) => ['work', 'poker', 'clinic', 'wander', 'rest'].includes(x.type));
    const home = o.find((x) => x.type === 'home');
    const routes = S.routesFrom(s, 'day');
    const nightN = S.routesFrom(s, 'night').length;
    const leaveKsr = s.city === 'bkk' && s.ksr && s.trail.length === 1;
    el.innerHTML = `<header><h2>☀️ ${c.name}</h2><span class="phase">DAY ${s.day} · DAYTIME</span></header><div class="pad">
      ${recap()}<p class="blurb">${c.blurb}</p>
      <p class="dim" style="margin:0">Pick <b>one</b> thing to do today. Shopping, crypto, using items and calling Mum are free.</p>
      ${lms.length ? `<div class="sec"><h3>📸 Get your pic in front of… <small>rarer = more points</small></h3><div class="opts">${lms.map((l) => opt({ a: 'day', data: { type: 'photo', id: l.id }, t: l.label, r: [`<span class="stars">${stars(l.r)}</span>`, `+${l.pts} pts`, l.cost ? fmt(l.cost) : 'free', ...(leaveKsr && !l.ksr ? ['🚶 leaves Khao San'] : []), ...(leaveKsr && l.ksr ? ['🛣️ on Khao San'] : [])], dis: l.why })).join('')}</div></div>` : `<div class="sec note">📸 You've got a pic of everything in ${c.name}.</div>`}
      ${acts.length ? `<div class="sec"><h3>🎟️ Things to do</h3><div class="opts">${acts.map((x) => opt({ a: 'day', data: { type: 'act', id: x.id }, t: `${x.icon} ${x.label}`, s: typeof x.sub === 'function' ? x.sub(s) : x.sub, r: leaveKsr && !x.ksr ? ['🚶 leaves Khao San'] : [] })).join('')}</div></div>` : ''}
      <div class="sec"><h3>💼 Hustle & recover</h3><div class="opts">${hustle.map((x) => {
        if (x.type === 'poker') return `<div class="opt"><span class="t">♠️ ${x.label}</span><span class="s">Skill ${Math.min(10, Math.floor(s.poker))}/10${s.hungover ? ' · hungover (worse)' : ''}</span><span class="stakes">${[20, 50, 100, 250].map((k) => `<button data-a="poker" data-stake="${k}" ${s.cash < k ? 'disabled' : ''}>${fmt(k)}</button>`).join('')}</span></div>`;
        const ic = { work: '🧹', clinic: '🩺', wander: '🚶', rest: '😴' }[x.type];
        return opt({ a: 'day', data: { type: x.type }, t: `${ic} ${x.label}`, s: x.sub || '', dis: x.why });
      }).join('')}</div></div>
      <div class="sec"><h3>🧳 Leave ${c.name} today <small>${nightN ? `${nightN} overnight option${nightN > 1 ? 's' : ''} tonight` : ''}</small></h3>${routes.length ? `<div class="opts">${routes.map((r) => routeOpt(s, r)).join('')}</div>` : '<p class="dim">No daytime transport from here. Check the overnight options tonight.</p>'}</div>
      ${home ? `<div class="sec"><h3>🏠 Call it</h3><div class="opts">${opt({ a: 'day', data: { type: 'home' }, t: '✈️ Fly home to Straya', s: home.sub, dis: home.why })}</div></div>` : ''}
    </div>`;
    return;
  }
  if (s.phase === 'night') {
    const n = S.nightOptions(s);
    if (!n.stays.some((q) => q.id === ui.sel.stay)) ui.sel.stay = (n.stays.find((q) => q.id === s.stay) || n.stays.find((q) => q.id === 'dorm') || n.stays.find((q) => q.id === 'homestay') || n.stays[0]).id;
    if (ui.sel.bar && !n.bars.find((b) => b.k === ui.sel.bar)) ui.sel.bar = n.bars.length ? 'bp' : null;
    if (!n.bars.length) ui.sel.bar = null;
    const bar = n.bars.find((b) => b.k === ui.sel.bar);
    const free = s.flags.shift === s.day && ui.sel.bar === 'bp';
    const leaveKsr = s.city === 'bkk' && s.ksr && s.trail.length === 1;
    el.innerHTML = `<header><h2>🌙 Night in ${c.name}</h2><span class="phase">DAY ${s.day} · NIGHT</span></header><div class="pad">${recap()}
      ${n.bars.length ? `<div class="sec"><h3>🍻 Where are you drinking?</h3><div class="opts">${n.bars.map((b) => opt({ a: 'bar', data: { k: b.k }, t: `${D.BAR_KIND[b.k].icon} ${esc(b.name)}`, s: `<b>${D.BAR_KIND[b.k].label}.</b> ${D.BAR_KIND[b.k].blurb}`, r: [`${fmt(b.price)}/drink`, ...(leaveKsr && b.k === 'fancy' ? ['🚶 leaves Khao San'] : []), ...(free && b.k === 'bp' ? ['4 free (staff)'] : [])], sel: ui.sel.bar === b.k, badge: b.special })).join('')}${opt({ a: 'bar', data: { k: '' }, t: '😇 Stay in', s: 'No drinks tonight. Your liver will thank you; the 3-day rule will not.', sel: !ui.sel.bar })}</div></div>
        ${bar ? `<div class="sec"><h3>🔥 How hard?</h3><div class="opts">${D.LEVELS.map((L) => { const avg = (L.drinks[0] + L.drinks[1]) / 2; return opt({ a: 'lvl', data: { n: L.id }, t: `${L.icon} ${L.label}`, r: [`${L.drinks[0]}–${L.drinks[1]} drinks`, `~${fmt(avg * bar.price * (s.mates.includes('tarquin') ? 0.75 : 1))}`, `−${L.hp} ❤️`, ...(L.stupid ? [`${Math.round(L.stupid * 100)}% stupid`] : [])], sel: ui.sel.level === L.id }); }).join('')}</div></div>` : ''}`
      : `<div class="note">🏕️ <b>No bars out here.</b> ${s.dry ? `You've been dry for <b>${s.dry}</b> day${s.dry > 1 ? 's' : ''} (max 3).` : ''} Crack something from your backpack (free), or hope the locals share.</div>`}
      <div class="sec"><h3>🛏️ Where are you sleeping?</h3><div class="opts">${n.stays.map((q) => opt({ a: 'stay', data: { id: q.id }, t: `${q.icon} ${q.name}`, s: q.note, r: [q.price ? fmt(q.price) : 'free', `${q.hp > 0 ? '+' : ''}${q.hp}${q.id === 'dorm' && S.has(s, 'earplugs') ? '+5' : ''} ❤️`], sel: ui.sel.stay === q.id, dis: q.price > s.cash ? 'Too poor' : '' })).join('')}</div></div>
      <button class="go" data-a="nightgo">${ui.sel.bar ? `Head out to ${esc(bar.name)} →` : 'Hit the hay →'}</button>
      ${n.routes.length ? `<div class="sec"><h3>🌃 Or skip the night: overnight transport <small>no bar, no bed</small></h3><div class="opts">${n.routes.map((r) => routeOpt(s, r)).join('')}</div></div>` : ''}
    </div>`;
  }
}

function recap() {
  const s = ui.s;
  if (ui.mark == null) return '';
  const rows = s.log.filter((l) => l.id > ui.mark && l.tone !== 'card');
  if (!rows.length) return '';
  return `<div class="recap"><b>📝 What just happened</b>${rows.slice(-8).map((l) => `<p class="${l.tone}">${l.text}</p>`).join('')}</div>`;
}
function renderPrison(el) {
  const s = ui.s, p = s.prison;
  const o = S.prisonOptions(s);
  el.innerHTML = `<header><h2>⛓️ ${p.name}</h2><span class="phase">DAY ${s.day} · INSIDE</span></header><div class="pad">
    <div class="seg" style="margin:4px 0 8px">${[['⏳ Sentence left', `${p.sentence}d`], ['📆 Served', `${p.served}d`], ['🚬 Smokes', p.smokes], ['💪 Respect', p.respect], ['🧴 Hooch', p.hooch + (p.brew ? ` (+6 day ${p.brew})` : '')], ['✉️ Embassy', `${Math.min(100, p.letters)}%`], ['🥄 Tunnel', p.spoon || p.tunnel ? `${Math.min(100, p.tunnel)}%` : '—']].map(([a, b]) => `<span class="tag">${a}: <b>${b}</b></span>`).join('')}</div>
    ${recap()}<p class="blurb">Welcome to the secret game within the game. Smokes are money in here. You still can't go more than 3 days without a drink, so you'd better learn to brew. Get out by serving your time, bribing, the embassy, or a spoon.</p>
    ${p.hooch > 0 ? `<button class="go" data-a="hooch" style="margin:4px 0 10px">🧴 Drink some hooch (free)</button>` : ''}
    <div class="opts">${o.map((x) => opt({ a: 'prison', data: { id: x.id }, t: x.label, s: x.sub, dis: x.why })).join('')}</div>
  </div>`;
}

// =====================================================================================
// side tabs
// =====================================================================================
const TABS = [['bag', '🎒', 'Bag'], ['shop', '🛒', 'Shop'], ['crew', '👬', 'Crew'], ['coins', '📈', 'Crypto'], ['album', '📸', 'Pics'], ['diary', '📜', 'Diary'], ['score', '⭐', 'Score']];
function renderSide() {
  const s = ui.s;
  $('tabs').innerHTML = TABS.map(([id, ic, nm]) => `<button data-a="tab" data-t="${id}" class="${ui.tab === id ? 'on' : ''}" title="${nm}">${ic} ${nm}</button>`).join('');
  const el = $('tabbody');
  const busy = !!(s.card || s.over);
  if (ui.tab === 'bag') {
    const slots = [];
    for (let i = 0; i < D.SLOTS; i++) {
      const x = s.inv[i];
      if (!x) { slots.push('<div class="slot"><span class="dim">empty</span></div>'); continue; }
      const it = D.ITEMS[x.id];
      const usable = it.drink || it.heal || x.id === 'antibiotics';
      const extra = x.id === 'package' ? `<span class="warn">→ ${D.CITIES[x.dest].name}, ${fmt(x.pay)}</span>` : '';
      slots.push(`<div class="slot full" title="${esc(it.desc)}"><span class="ic">${it.icon}</span><span class="nm">${it.name}${x.n > 1 ? ` ×${x.n}` : ''}</span><span class="dim">${it.drink ? `${it.drink} drinks` : it.heal ? `+${it.heal} ❤️` : it.passive ? 'passive' : it.uses ? 'auto-used' : ''}</span>${extra}<span class="bt">${usable ? `<button data-a="use" data-i="${i}" ${busy ? 'disabled' : ''}>${it.drink ? 'Drink' : 'Use'}</button>` : ''}<button data-a="drop" data-i="${i}" ${busy ? 'disabled' : ''}>${x.id === 'package' ? 'Chuck it' : 'Drop'}</button></span></div>`);
    }
    el.innerHTML = `<div class="slots">${slots.join('')}</div><p class="dim" style="font-size:12px">${s.inv.length}/${D.SLOTS} slots. Hover an item for details. Booze keeps you alive in remote places.</p>`;
  } else if (ui.tab === 'shop') {
    const list = S.shopList(s);
    el.innerHTML = s.prison ? '<p class="dim">The prison commissary only takes smokes. See the options on the left.</p>' : list.length ? `<p class="dim" style="margin:0 0 6px;font-size:12px">${D.CITIES[s.city].tags.includes('remote') ? 'A tiny village shop. Remote prices.' : `7-Eleven, the market and a pharmacy with no rules.`}</p>${list.map((r) => { const it = D.ITEMS[r.id]; const dis = busy ? 'Busy' : s.cash < r.price ? 'Too poor' : s.inv.length >= D.SLOTS && !S.has(s, r.id) ? 'Bag full' : ''; return `<div class="row" title="${esc(it.desc)}"><span class="ic">${it.icon}</span><span class="g"><b>${it.name}</b><br><span class="dim" style="font-size:12px">${it.desc}</span></span><button class="mini" data-a="buy" data-id="${r.id}" ${dis ? `disabled title="${dis}"` : ''}>${fmt(r.price)}</button></div>`; }).join('')}` : '<p class="dim">Nothing for sale here.</p>';
  } else if (ui.tab === 'crew') {
    el.innerHTML = (s.mates.length ? s.mates.map((m) => { const M = D.MATES[m]; return `<div class="row"><span class="ic">${M.icon}</span><span class="g"><b>${M.name}</b> <span class="dim">from ${M.from}</span><br><span style="font-size:12px">${M.desc}</span></span></div>`; }).join('') : '<p class="dim">Flying solo. You\'ll meet people at backpacker bars, campfires and on boats.</p>') + `<p class="dim" style="font-size:12px">${s.mates.length}/${D.MAX_MATES} mates. Mates help in fights and with the ladies, and can start fights with you too.</p>`;
  } else if (ui.tab === 'coins') {
    const wifi = S.wifi(s);
    const val = S.coinValue(s);
    el.innerHTML = `<p style="margin:0 0 6px">${wifi ? '📶 Connected' : '<span class="bad">📵 No wifi here</span>'} · Portfolio: <b>${fmt(val)}</b>${s.flags.tip ? ` · <span class="dim">The banker said <b>$${s.flags.tip}</b></span>` : ''}</p>${Object.entries(D.COINS).map(([k, c]) => {
      const h = s.coins[k]; const px = s.px[k]; const hist = s.pxh[k]; const ch = hist.length > 1 ? px / hist[Math.max(0, hist.length - 8)] - 1 : 0;
      const dis = busy || !wifi;
      return `<div class="row"><span class="ic">${c.icon}</span><span class="g"><b>$${k}</b> <span class="dim" style="font-size:12px">${c.name}</span><br><span style="font-size:12px">${fmtPx(px)} <span class="${ch >= 0 ? 'good' : 'bad'}">${ch >= 0 ? '▲' : '▼'}${Math.abs(ch * 100).toFixed(0)}% 7d</span>${h ? ` · you: <b>${fmt(h.u * px)}</b> <span class="${h.u * px >= h.cost ? 'good' : 'bad'}">(${h.u * px >= h.cost ? '+' : ''}${Math.round((h.u * px / h.cost - 1) * 100)}%)</span>` : ''}</span></span>${spark(hist)}<span style="display:flex;flex-direction:column;gap:2px"><button class="mini" data-a="cbuy" data-k="${k}" data-amt="50" ${dis || s.cash < 50 ? 'disabled' : ''}>+$50</button><button class="mini" data-a="cbuy" data-k="${k}" data-amt="250" ${dis || s.cash < 250 ? 'disabled' : ''}>+$250</button>${h ? `<button class="mini" data-a="csell" data-k="${k}" ${dis ? 'disabled' : ''}>Sell</button>` : ''}</span></div>`;
    }).join('')}<p class="dim" style="font-size:12px">Prices move every day. Small coins get rug-pulled. Not financial advice, obviously.</p>`;
  } else if (ui.tab === 'album') {
    const tot = s.photos.reduce((a, p) => a + p.pts, 0);
    el.innerHTML = `<p style="margin:0 0 6px"><b>${s.photos.length}</b> pics · <b>${tot}</b> pts · remote: ${S.remoteCount(s)}/5</p>` + (s.photos.length ? s.photos.slice().reverse().map((p) => `<div class="row"><span class="ic">📸</span><span class="g">${esc(p.name)}<br><span class="dim" style="font-size:12px">Day ${p.day} · ${D.CITIES[p.city].name}${p.remote ? ' · 🏕️ remote' : ''} · <span class="stars">${stars(p.r)}</span></span></span><b>+${p.pts}</b></div>`).join('') : '<p class="dim">No pics yet. Squint in front of something famous.</p>');
  } else if (ui.tab === 'diary') {
    el.innerHTML = `<div class="log">${s.log.slice().reverse().slice(0, 80).map((l) => `<p class="${l.tone}"><span class="d">D${l.d}</span>${l.text}</p>`).join('')}</div>`;
  } else if (ui.tab === 'score') {
    const sc = S.score(s);
    el.innerHTML = breakdown(s, sc) + `<h3 style="margin-top:12px;font-size:15px">🏆 This run</h3>${Object.keys(s.ach).length ? Object.keys(s.ach).map((k) => `<div class="row"><span class="ic">${D.ACHIEVEMENTS[k].icon}</span><span class="g"><b>${D.ACHIEVEMENTS[k].name}</b><br><span class="dim" style="font-size:12px">${D.ACHIEVEMENTS[k].desc}</span></span><b>+${D.ACHIEVEMENTS[k].pts}</b></div>`).join('') : '<p class="dim">None yet.</p>'}`;
  }
}
const fmtPx = (p) => (p >= 1 ? `$${p.toFixed(2)}` : p >= 0.01 ? `$${p.toFixed(4)}` : `$${p.toPrecision(3)}`);
function spark(h) {
  if (h.length < 2) return '<svg class="spark"></svg>';
  const lg = h.map((v) => Math.log(v));
  const lo = Math.min(...lg), hi = Math.max(...lg), rg = hi - lo || 1;
  const pts = lg.map((v, i) => `${(i / (lg.length - 1)) * 70},${20 - ((v - lo) / rg) * 18}`).join(' ');
  return `<svg class="spark" viewBox="0 0 70 22"><polyline points="${pts}" fill="none" stroke="${h[h.length - 1] >= h[0] ? '#1f8a4c' : '#c8362c'}" stroke-width="1.8"/></svg>`;
}
function breakdown(s, sc) {
  const P = sc.parts;
  const free = s.day - s.prisonDays;
  return `<table class="brk">
    <tr><td>📅 ${free} days on the road${s.prisonDays ? ` + ${s.prisonDays} inside (½)` : ''}</td><td>${P.days}</td></tr>
    <tr><td>🍺 ${s.drinks} drinks × 2</td><td>${P.drinks}</td></tr>
    <tr><td>💋 ${s.hook.free} hookups you didn't pay for × 150</td><td>${P.free}</td></tr>
    <tr><td>💸 ${s.hook.paid} you paid for × 30</td><td>${P.paid}</td></tr>
    <tr><td>📸 ${s.photos.length} landmark pics</td><td>${P.photos}</td></tr>
    <tr><td>🏆 ${Object.keys(s.ach).length} achievements</td><td>${P.ach}</td></tr>
    ${s.over ? `<tr class="mult"><td>${s.over.icon} Ending: ${s.over.title}</td><td>×${s.over.mult}</td></tr>` : `<tr class="mult"><td>Ending multiplier (fly home: ×1.25)</td><td>?</td></tr>`}
  </table>`;
}

// =====================================================================================
// event card modal
// =====================================================================================
function chipHTML(c) {
  switch (c.k) {
    case 'hp': return `<span class="chip ${c.v < 0 ? 'neg' : 'pos'}">${c.v > 0 ? '+' : ''}${c.v} ❤️</span>`;
    case 'cash': return `<span class="chip ${c.v < 0 ? 'neg' : 'pos'}">${c.v > 0 ? '+' : '−'}${fmt(Math.abs(c.v))}</span>`;
    case 'drink': return `<span class="chip gold">+${c.v} 🍺</span>`;
    case 'hook': return `<span class="chip pink">💋 ${esc(c.v)} (+150)</span>`;
    case 'paid': return `<span class="chip pink">💸 ${esc(c.v)} (+30)</span>`;
    case 'item': return `<span class="chip pos">+ ${esc(c.v)}</span>`;
    case 'loseitem': return `<span class="chip neg">− ${esc(c.v)}</span>`;
    case 'photo': return `<span class="chip pos">📸 +${c.v} pts</span>`;
    case 'mate': return `<span class="chip pos">${esc(c.v)}</span>`;
    case 'matelost': return `<span class="chip neg">${esc(c.v)}</span>`;
    case 'ach': return `<span class="chip gold">🏆 ${esc(c.v)}</span>`;
    case 'charm': return `<span class="chip">😎 ${esc(c.v)}</span>`;
    case 'mum': return `<span class="chip ${c.v < 0 ? 'neg' : 'pos'}">👩 ${c.v > 0 ? '+' : ''}${c.v} patience</span>`;
    default: return `<span class="chip">${esc(c.v)}</span>`;
  }
}
function renderModal() {
  const s = ui.s, c = s.card;
  const m = $('modal');
  if (!c || s.over) { m.classList.add('hidden'); m.innerHTML = ''; return; }
  m.classList.remove('hidden');
  c.choices = S.cardChoices(s);
  const res = c.result;
  m.innerHTML = `<div class="ev" role="dialog" aria-modal="true"><span class="icon">${c.icon}</span><h2>${esc(c.title)}</h2>${c.text}
    ${res ? `<div class="result"><b>${esc(c.choices[res.pick]?.t || '')}</b><br>${res.text}${res.chips.length ? `<div class="chips">${res.chips.map(chipHTML).join('')}</div>` : ''}</div><button class="go" data-a="proceed">Continue →</button>`
      : `<div class="choices">${c.choices.map((ch, i) => opt({ a: 'choose', data: { i }, t: `<span class="dim">${i + 1}.</span> ${ch.t}`, s: ch.sub, dis: ch.why })).join('')}</div>`}
  </div>`;
}

// =====================================================================================
// end screen
// =====================================================================================
function renderEnd() {
  const s = ui.s;
  const el = $('end');
  if (!s.over) { el.classList.add('hidden'); return; }
  const sc = S.score(s);
  if (!s.flags.recorded) {
    s.flags.recorded = true;
    const best = loadJSON(BEST, []);
    best.push({ name: s.name, arch: s.arch, days: s.day, end: s.over.kind, score: sc.total, at: Date.now() });
    best.sort((a, b) => b.score - a.score);
    s.flags.rank = best.findIndex((b) => b.score === sc.total && b.name === s.name) + 1;
    store.set(BEST, JSON.stringify(best.slice(0, 25)));
    const got = loadJSON(ACH, {});
    s.flags.newAch = Object.keys(s.ach).filter((k) => !got[k]);
    for (const k of Object.keys(s.ach)) got[k] = got[k] || Date.now();
    store.set(ACH, JSON.stringify(got));
  }
  el.classList.remove('hidden');
  el.innerHTML = `<div class="endcard"><div class="big">${s.over.icon}</div><h2>${s.over.title}</h2><p>${s.over.text}</p>
    <div class="tot">${sc.total.toLocaleString()}</div>
    <p style="text-align:center;margin:0" class="dim">${s.flags.rank === 1 ? '🥇 <b>NEW HIGH SCORE!</b>' : s.flags.rank <= 10 ? `#${s.flags.rank} in your Hall of Fame` : ''}</p>
    ${breakdown(s, sc)}
    <p style="margin-top:10px">${s.day} days · ${Object.keys(s.visited).length} places · ${Object.keys(s.countries).map((c) => D.COUNTRIES[c].flag).join(' ')} · ${s.stats.fights} fights · ${fmt(s.stats.mumCash)} from Mum${s.stdHad.length ? ` · ${s.stdHad.length} STD${s.stdHad.length > 1 ? 's' : ''}` : ''}</p>
    ${Object.keys(s.ach).length ? `<div class="chips">${Object.keys(s.ach).map((k) => `<span class="chip gold" title="${esc(D.ACHIEVEMENTS[k].desc)}">${D.ACHIEVEMENTS[k].icon} ${D.ACHIEVEMENTS[k].name}${(s.flags.newAch || []).includes(k) ? ' ✨NEW' : ''}</span>`).join('')}</div>` : ''}
    <button class="go" data-a="again">Have another crack →</button>
    <button class="tb" data-a="menu" style="display:block;margin:10px auto 0">Main menu</button>
  </div>`;
}

function showToast() {
  const s = ui.s;
  if (!s.flags.toast) return;
  const a = D.ACHIEVEMENTS[s.flags.toast];
  delete s.flags.toast;
  const t = $('toast');
  t.textContent = `🏆 ${a.icon} ${a.name}`;
  t.classList.remove('hidden');
  clearTimeout(ui.toastT);
  ui.toastT = setTimeout(() => t.classList.add('hidden'), 2600);
}

// =====================================================================================
// map popover
// =====================================================================================
function cityPop(id, e) {
  const s = ui.s;
  const pop = $('pop');
  const c = D.CITIES[id];
  if (!s || s.over) return;
  const wrap = $('mapwrap').getBoundingClientRect();
  const rs = s.prison ? [] : S.routesFrom(s).filter((r) => r.to === id);
  const lms = c.lm.map((l) => `${s.photos.some((p) => p.id === l.id) ? '✅' : '📸'} ${l.name} <span class="stars">${stars(l.r)}</span>`).join('<br>');
  pop.innerHTML = `<h4>${D.COUNTRIES[c.c].flag} ${c.name}${c.sub ? ` <span class="dim" style="font:12px Nunito">${c.sub}</span>` : ''}</h4>
    <div class="dim" style="font-size:12px;margin-bottom:6px">${c.tags.includes('remote') ? '🏕️ Remote: no bars · ' : ''}${s.visited[id] ? `Visited ${s.visited[id]}×` : 'Not visited yet'}</div>
    <div style="font-size:12px;margin-bottom:6px">${lms}</div>
    ${id === s.city ? '<b>📍 You are here.</b>' : rs.length ? rs.map((r) => { const ok = !r.blocked && s.cash >= r.cost && !s.card && ((r.when === 'day' && s.phase === 'day') || (r.when === 'night' && s.phase === 'night')); const when = r.when === 'night' ? 'overnight (leave at night)' : 'daytime'; return `<div class="row" style="padding:4px 0"><span class="g">${D.MODES[r.mode].icon} ${when}<br><span class="dim" style="font-size:11px">${fmt(r.cost)} · ${r.hp || 0} ❤️${r.extra ? ` · ${r.extra + 1} days` : ''}</span></span><button class="mini" data-a="route" data-ri="${r.i}" data-when="${r.when}" ${ok ? '' : `disabled title="${esc(r.blocked || (s.cash < r.cost ? 'Too poor' : r.when === 'night' ? 'Leaves tonight' : 'Leaves in the daytime'))}"`}>Go</button></div>`; }).join('') : '<span class="dim">No direct route from here.</span>'}
    <button class="mini" data-a="closepop" style="margin-top:6px">Close</button>`;
  pop.classList.remove('hidden');
  const x = Math.min(wrap.width - 300, Math.max(4, e.clientX - wrap.left + 10));
  const y = Math.min(wrap.height - 40, Math.max(4, e.clientY - wrap.top + 10));
  pop.style.left = `${x}px`; pop.style.top = `${y}px`;
}

// =====================================================================================
// input
// =====================================================================================
function act(a, d) {
  const s = ui.s;
  let err = '';
  if (['day', 'poker', 'route', 'nightgo', 'prison'].includes(a)) ui.mark = s.logN || 0;
  switch (a) {
    case 'day': err = S.doDay(s, { type: d.type, id: d.id }); break;
    case 'poker': err = S.doDay(s, { type: 'poker', stake: +d.stake }); break;
    case 'route': {
      $('pop').classList.add('hidden');
      const ri = +d.ri;
      err = d.when === 'night' ? S.doNight(s, { travel: ri }) : S.doDay(s, { type: 'travel', ri });
      if (!err) setTimeout(() => map.focus(s.city, 804 / 2.2), 30);
      break;
    }
    case 'bar': ui.sel.bar = d.k || null; break;
    case 'lvl': ui.sel.level = +d.n; break;
    case 'stay': ui.sel.stay = d.id; break;
    case 'nightgo': err = S.doNight(s, { bar: ui.sel.bar, level: ui.sel.level, stay: ui.sel.stay }); break;
    case 'choose': S.choose(s, +d.i); break;
    case 'proceed': S.proceed(s); break;
    case 'use': { const r = S.useItem(s, +d.i); if (r) flashToast(r); break; }
    case 'drop': { const x = s.inv[+d.i]; if (x && (x.id !== 'package' || confirm('Chuck the package? Somebody will be very unhappy about it.'))) S.dropItem(s, +d.i); break; }
    case 'buy': err = S.buy(s, d.id); break;
    case 'cbuy': err = S.buyCoin(s, d.k, +d.amt); break;
    case 'csell': err = S.sellCoin(s, d.k); break;
    case 'mum': S.callMum(s); break;
    case 'prison': err = S.doPrison(s, d.id); break;
    case 'hooch': S.drinkHooch(s); break;
    case 'tab': ui.tab = d.t; break;
    case 'quit': if (!s.over && !s.card && confirm('Call it here? Your run ends with no bonus multiplier.')) S.quit(s); break;
    case 'again': ui.arch = s.arch; startRun(); return;
    case 'menu': ui.s = null; showTitle(); return;
    case 'closepop': $('pop').classList.add('hidden'); return;
    default: return;
  }
  if (err) flashToast(err);
  render();
  if (['day', 'nightgo', 'route', 'proceed', 'prison', 'poker'].includes(a)) window.scrollTo({ top: Math.min(window.scrollY, $('scene').offsetTop - 70), behavior: 'smooth' });
}
function flashToast(text) {
  const t = $('toast');
  t.textContent = text;
  t.classList.remove('hidden');
  clearTimeout(ui.toastT);
  ui.toastT = setTimeout(() => t.classList.add('hidden'), 1800);
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-a]');
  if (b && !b.disabled && ui.s) { act(b.dataset.a, b.dataset); return; }
  const z = e.target.closest('[data-z]');
  if (z && ui.s) { const k = z.dataset.z; if (k === 'in') map.zoomIn(); else if (k === 'out') map.zoomOut(); else if (k === 'fit') map.fit(); else map.focus(ui.s.city); }
  if (e.target.id === 'logo') { if (confirm('Back to the main menu? Your run is saved.')) { ui.s = null; showTitle(); } }
  if (e.target.id === 'maptoggle') { ui.mapCollapsed = !ui.mapCollapsed; render(); }
});
document.addEventListener('keydown', (e) => {
  const s = ui.s;
  if (!s || !s.card || e.target.tagName === 'INPUT') return;
  if (s.card.result && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); act('proceed', {}); }
  else if (!s.card.result && /^[1-9]$/.test(e.key)) act('choose', { i: +e.key - 1 });
});

// debug / testing hook
window.bpt = { get s() { return ui.s; }, set s(v) { ui.s = v; render(); }, S, D, render, map, ui, cityXY };
showTitle();
