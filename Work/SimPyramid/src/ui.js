// DOM side: panels, tabs, advisor, toasts, modals, title screen.
import * as S from './sim.js';
import { LEVELS, getLevel, nextLevel } from './levels/index.js';
import { THOUGHTS } from './flavor.js';
import { ESSAY } from './essay.js';
import { sfx } from './audio.js';

const $ = (sel) => document.querySelector(sel);
const fmt = S.fmt;
const cap = (t) => t[0].toUpperCase() + t.slice(1);
const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

export function createUI(game) {
  let L = null, C = null;
  let tab = 'build';
  let jobRefs = {};
  let godRefs = {};
  let lastLogLen = 0;
  let lastTabRender = 0;
  let tipIdx = 0, tipT = 0, tipText = '';
  let modalKind = null;

  const narrow = () => window.matchMedia('(max-width: 900px)').matches;
  const icon = (k) => C.icons[k] || '';
  const costStr = (cost) => Object.entries(cost).filter(([, v]) => v).map(([k, v]) => `${fmt(v)} ${icon(k)}`).join(' + ') || 'free';
  const godGlyph = (p) => `<span class="${C.id === 'egypt' ? 'hiero' : ''}">${p.glyph}</span>`;

  // ---------------- per-level setup ----------------
  function setupLevel() {
    const s = game.s;
    L = getLevel(s.levelId);
    C = L.civ;
    lastLogLen = s.log.length;
    tipText = '';
    tipT = 0;
    for (const id of ['top', 'res', 'left', 'right', 'prog', 'bottom', 'advisor']) $('#' + id).classList.remove('hidden');
    $('#title').classList.add('hidden');
    buildLabor();
    buildGods();
    buildTabs();
    placePanels();
    const adv = $('#advisor .face');
    adv.innerHTML = L.advisor.glyph;
    adv.className = 'face' + (C.id === 'egypt' && /[\u{13000}-\u{1342F}]/u.test(L.advisor.glyph) ? ' hiero' : '');
    update(true);
  }

  // Labor and gods live in the side panels on wide screens, in the bottom sheet on narrow ones.
  const laborEl = document.createElement('div');
  const godsEl = document.createElement('div');
  function placePanels() {
    if (narrow()) {
      if (tab === 'labor') $('#tabbody').replaceChildren(laborEl);
      else if (tab === 'gods') $('#tabbody').replaceChildren(godsEl);
    } else {
      if (laborEl.parentNode !== $('#left')) $('#left').replaceChildren(laborEl);
      if (godsEl.parentNode !== $('#right')) $('#right').replaceChildren(godsEl);
      if (tab === 'labor' || tab === 'gods') setTab('build');
    }
  }
  window.matchMedia('(max-width: 900px)').addEventListener('change', () => { if (L) { placePanels(); renderTab(true); } });

  function buildLabor() {
    jobRefs = {};
    laborEl.innerHTML = `<h3>${esc(C.names.workers)} <small id="popline"></small></h3>
      <div class="idleRow"><span>Idle: <b id="idleN">0</b></span><button class="btn" id="distIdle" title="Spread idle workers across jobs in the current proportions">Put to work</button></div>
      <div id="jobs"></div>
      <div class="draft" id="draftBox"></div>
      <div class="flow" id="flow"></div>`;
    const wrap = laborEl.querySelector('#jobs');
    for (const j of S.JOBS) {
      const d = document.createElement('div');
      d.className = 'job';
      d.innerHTML = `<div class="row"><div class="name">${esc(C.jobs[j].name)}<small class="sub"></small></div>
        <button data-d="-1" title="Remove (shift: 10%)">−</button><span class="n">0</span><button data-d="1" title="Add (shift: 10%)">+</button></div>
        <input type="range" min="0" step="10"><div class="warn"></div>`;
      d.title = C.jobs[j].desc;
      const range = d.querySelector('input');
      range.addEventListener('input', () => { S.setJob(game.s, j, +range.value); update(true); });
      d.querySelectorAll('button').forEach((b) => b.addEventListener('click', (e) => {
        const step = e.shiftKey ? Math.max(10, Math.round(game.s.pop * 0.1)) : Math.max(10, Math.round(game.s.pop / 100) * 5);
        S.setJob(game.s, j, game.s.jobs[j] + step * +b.dataset.d);
        sfx('tick');
        update(true);
      }));
      wrap.appendChild(d);
      jobRefs[j] = { el: d, n: d.querySelector('.n'), range, sub: d.querySelector('.sub'), warn: d.querySelector('.warn') };
    }
    laborEl.querySelector('#distIdle').addEventListener('click', () => { S.distributeIdle(game.s); sfx('tick'); update(true); });
    const idleSeason = C.seasons.find((x) => x.farm === 'idle');
    laborEl.querySelector('#draftBox').innerHTML = idleSeason
      ? `<b>When the fields are idle</b> (${esc(idleSeason.name)}), farmers:<select id="draftSel">
          <option value="haul">haul (${esc(C.jobs.haul.name.toLowerCase())})</option><option value="quarry">quarry</option><option value="mason">build</option><option value="boat">${esc(C.jobs.boat.name.toLowerCase())}</option><option value="none">rest at home (+morale)</option></select>
          <div style="margin-top:4px;color:var(--dim)">They eat either way. Keynes would say: put them to work.</div>`
      : '';
    const sel = laborEl.querySelector('#draftSel');
    if (sel) { sel.value = game.s.draft; sel.addEventListener('change', () => { game.s.draft = sel.value; }); }
  }

  function buildGods() {
    godRefs = {};
    godsEl.innerHTML = `<h3>${esc(C.names.gods)} <small id="maatLine"></small></h3><div id="godList"></div>
      <button class="btn" id="allGods" style="margin-top:8px;width:100%"></button>`;
    const list = godsEl.querySelector('#godList');
    for (const p of C.patrons) {
      const d = document.createElement('div');
      d.className = 'god';
      d.title = p.desc + (p.rival ? '' : '');
      d.innerHTML = `<div class="gl">${godGlyph(p)}</div><div class="mid"><div class="nm"><span>${esc(p.name)}</span><small>${esc(p.title)}</small></div><div class="fav"><i></i></div></div><button></button>`;
      const btn = d.querySelector('button');
      btn.addEventListener('click', () => {
        if (S.offer(game.s, p.id)) { sfx('offer'); update(true); } else sfx('no');
      });
      list.appendChild(d);
      godRefs[p.id] = { el: d, bar: d.querySelector('.fav i'), btn };
    }
    godsEl.querySelector('#allGods').addEventListener('click', () => { if (S.decree(game.s, 'allgods')) { sfx('offer'); update(true); } else sfx('no'); });
  }

  // ---------------- tabs ----------------
  const TABS = [['labor', 'Labor', true], ['gods', 'Gods', true], ['build', 'Build'], ['decrees', 'Decrees'], ['research', 'Research'], ['journal', 'Journal'], ['history', 'History']];
  function buildTabs() {
    const el = $('#tabs');
    el.innerHTML = TABS.map(([id, name, mob]) => `<button data-tab="${id}" class="${mob ? 'mobileOnly' : ''}">${id === 'gods' ? esc(C.names.gods.split(' (')[0]) : id === 'research' ? esc(cap(C.names.wisdomBy.replace(/^The /, ''))) : name}</button>`).join('') +
      '<span class="sp"></span><button data-tab="_toggle" title="Collapse">▾</button>';
    el.onclick = (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.tab === '_toggle') { $('#bottom').classList.toggle('collapsed'); b.textContent = $('#bottom').classList.contains('collapsed') ? '▴' : '▾'; return; }
      $('#bottom').classList.remove('collapsed');
      setTab(b.dataset.tab);
    };
    $('#tabbody').onclick = onTabClick;
    if (narrow() && !['labor', 'gods'].includes(tab)) tab = 'labor';
    setTab(tab);
  }
  function setTab(id) {
    tab = id;
    document.querySelectorAll('#tabs button[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === id));
    renderTab(true);
  }
  function onTabClick(e) {
    const b = e.target.closest('button[data-act]');
    if (!b) return;
    const s = game.s;
    const [act, id] = b.dataset.act.split(':');
    let ok = false;
    if (act === 'up') ok = S.upgrade(s, id);
    if (act === 'dec') ok = S.decree(s, id);
    if (act === 'res') { S.startResearch(s, id); ok = true; }
    sfx(ok ? (act === 'dec' ? 'drum' : 'tick') : 'no');
    renderTab(true);
    update(true);
  }
  function renderTab(force) {
    const s = game.s;
    if (!s || !L) return;
    const now = performance.now();
    if (!force && now - lastTabRender < 700) return;
    lastTabRender = now;
    const body = $('#tabbody');
    if (tab === 'labor') { if (laborEl.parentNode !== body) body.replaceChildren(laborEl); return; }
    if (tab === 'gods') { if (godsEl.parentNode !== body) body.replaceChildren(godsEl); return; }
    let html = '';
    if (tab === 'build') {
      html = '<div class="grid">' + S.BUILDINGS.map((b) => {
        const lvl = s.buildings[b];
        const cost = S.buildingCost(s, b);
        const cap = b === 'village' ? `houses ${fmt(S.housing(s))}` : b === 'granary' ? `stores ${fmt(S.storage(s))} ${icon('food')}` : `room for ${fmt(lvl * S.BUILD_CAP[b])}`;
        const max = lvl >= S.MAX_BUILDING;
        return `<div class="card"><div class="t">${esc(C.buildings[b].name)} <small>lvl ${lvl} · ${cap}</small></div><p>${esc(C.buildings[b].desc)}</p>
          <div class="cost">${max ? 'Max level' : 'Upgrade: ' + costStr(cost)}</div><button data-act="up:${b}" ${max || !S.canAfford(s, cost) ? 'disabled' : ''}>Upgrade</button></div>`;
      }).join('') + '</div>';
    } else if (tab === 'decrees') {
      html = '<div class="grid">' + S.decreeList(s).map((d) => {
        const cd = (s.decreeCD[d.id] || 0) - s.day;
        const away = s.expeditions.find((x) => x.id === d.id);
        let state = '';
        if (away) state = `Away: back in ${away.until - s.day} days`;
        else if (cd > 0) state = `Ready in ${cd} days`;
        else if (d.id === 'levy' && s.levy.count) state = `${fmt(s.levy.count)} levied until season end`;
        return `<div class="card ${away ? 'active' : ''}"><div class="t">${esc(d.name)}${d.days ? ` <small>${d.days} days</small>` : ''}</div><p>${d.desc}</p>
          <div class="cost">${costStr(d.cost || {})}${d.workers ? ` + ${d.workers} workers` : ''}${d.note ? ' · ' + d.note : ''}${state ? ' · <b>' + state + '</b>' : ''}</div>
          <button data-act="dec:${d.id}" ${!d.ready || !d.afford ? 'disabled' : ''}>${d.expedition ? 'Send' : 'Decree'}</button></div>`;
      }).join('') + '</div>';
    } else if (tab === 'research') {
      const cur = s.research ? C.techs.find((t) => t.id === s.research) : null;
      html = `<p style="margin:0 0 6px">${esc(C.names.wisdomBy)} gains ${icon('wisdom')} from ${esc(C.jobs.priest.name.toLowerCase())}. ${cur ? `Studying <b>${esc(cur.name)}</b>: ${fmt(s.res.wisdom)} / ${cur.cost}` : '<b>Pick something to study.</b>'}</p><div class="grid">` +
        C.techs.map((t) => {
          const done = s.techs.includes(t.id);
          const active = s.research === t.id;
          return `<div class="card ${done ? 'done' : ''} ${active ? 'active' : ''}"><div class="t">${esc(t.name)} <small>${done ? '✓' : t.cost + ' ' + icon('wisdom')}</small></div><p>${t.desc}</p>
            ${done ? `<div class="cost">${esc(t.done || '')}</div>` : `<button data-act="res:${t.id}" ${active ? 'disabled' : ''}>${active ? 'Studying…' : 'Study'}</button>`}</div>`;
        }).join('') + '</div>';
    } else if (tab === 'journal') {
      html = '<div class="log">' + s.log.slice().reverse().map((l) => `<div class="${l.kind}"><span class="when">Y${l.year} ${esc(l.season)}</span>${l.text}</div>`).join('') + '</div>';
    } else if (tab === 'history') {
      html = `<div class="hist"><p><b>${esc(L.title)}</b>, ${esc(L.place)}, ${esc(L.date)}</p><ul class="facts" style="padding-left:18px">${L.history.map((h) => `<li>${h}</li>`).join('')}</ul>
        <p><button class="btn" id="essayBtn">Who really built the pyramids? (Slaves? Keynes? Aliens?)</button></p></div>`;
    }
    body.innerHTML = html;
    const eb = body.querySelector('#essayBtn');
    if (eb) eb.onclick = () => showEssay();
  }

  // ---------------- per-frame update ----------------
  let lastUpdate = 0;
  function update(force) {
    const s = game.s;
    if (!s || !L) return;
    const now = performance.now();
    if (!force && now - lastUpdate < 180) return;
    lastUpdate = now;
    const cal = S.calendar(s);
    // date
    $('#date').innerHTML = `${esc(C.calendarFmt(s, cal, L))}<small>${esc(L.title)} · ${esc(cal.season.name)}${cal.season.sub ? ' (' + esc(cal.season.sub) + ')' : ''}</small>`;
    document.querySelectorAll('#speed button').forEach((b) => b.classList.toggle('on', +b.dataset.speed === game.speed));
    // resources
    const perDay = (s.pop + s.levy.count) * (S.RATION + S.THIRST * 0.25);
    const foodDays = perDay ? s.res.food / perDay : 999;
    const chips = [
      ['food', s.res.food, foodDays < 60 ? `${Math.round(foodDays)}d left` : '', foodDays < 45],
      ['drink', s.res.drink, '', s.drinkSat < 0.8],
      ['stone', s.res.stone, ''],
      ['site', s.res.site, ''],
      ['casing', s.res.casing, ''],
      ['tools', s.res.tools, '', s.res.tools < 50],
      ['treasure', s.res.treasure, ''],
      ['wisdom', s.res.wisdom, ''],
    ];
    if (L.structure.milestones) for (const m of L.structure.milestones) chips.push([m.need, s.res[m.need] ? 1 : 0, s.res[m.need] ? '✓' : 'needed', !s.res[m.need] && s.build.blocked]);
    $('#res').innerHTML = chips.map(([k, v, d, low]) => `<span class="chip ${low ? 'low' : ''}" title="${esc(C.names[k] || k)}">${icon(k)} <b>${k === 'granite' || k === 'chrono' ? '' : fmt(v)}</b> <span class="lbl">${esc(C.names[k] || k)}</span>${d ? ` <span class="d">${d}</span>` : ''}</span>`).join('') +
      `<span class="chip" title="Morale: rises with food, drink, housing and festivals">😊 <b>${Math.round(s.morale)}</b> <span class="lbl">morale</span></span>` +
      `<span class="chip ${s.maat < 25 ? 'low' : ''}" title="${esc(C.names.maat)}: the gods' favor, morale and full bellies together">⚖ <b>${Math.round(s.maat)}</b> <span class="lbl">${esc(C.names.maat)}</span></span>`;
    // labor
    const idle = S.idle(s);
    laborEl.querySelector('#idleN').textContent = fmt(idle);
    laborEl.querySelector('#popline').textContent = `${fmt(s.pop)} / ${fmt(S.housing(s))} housed${s.levy.count ? ` · +${fmt(s.levy.count)} levy` : ''}`;
    for (const j of S.JOBS) {
      const r = jobRefs[j];
      const n = s.jobs[j];
      r.n.textContent = fmt(n);
      if (document.activeElement !== r.range) { r.range.max = n + idle; r.range.value = n; }
      const cap = S.capacity(s, j);
      let sub = '', warn = '';
      if (j === 'farm') {
        if (cal.season.farm === 'idle') sub = s.draft === 'none' ? 'resting while fields are idle' : `fields idle → working as ${s.draft === 'haul' ? 'haulers' : s.draft}`;
        else if (cal.season.farm === 'grow') sub = `growing: ${fmt(s.crop)} in the fields`;
        else if (cal.season.farm === 'harvest') sub = `harvesting: ${fmt(s.crop)} left`;
        else if (cal.season.farm === 'continuous') sub = `+${fmt((s.rates.harvest || 0) * 30)} per month`;
      }
      if (j === 'brew') sub = `+${fmt((s.rates.drink || 0) * 30)} ${C.names.drink.toLowerCase()}/month`;
      if (j === 'quarry') sub = `${fmt((s.rates.quarry || 0) * 30)} /month`;
      if (j === 'haul') sub = `can move ${fmt((s.rates.haulCap || 0) * 30)} /month`;
      if (j === 'mason') sub = `can set ${fmt((s.rates.masonCap || 0) * 30)} /month`;
      if (j === 'boat') sub = `${fmt((s.rates.boat || 0) * 30)} ${C.names.casing.toLowerCase()}/month`;
      if (j === 'priest') sub = `${Math.round((s.rates.coverage || 0) * 100)}% shrine coverage`;
      if (n > cap) warn = `Only ${fmt(cap)} can work here: upgrade the ${C.buildings[{ brew: 'bakery', quarry: 'quarry', boat: 'harbor', priest: 'temple' }[j]]?.name || 'fields'}${j === 'farm' ? ' (farmland is full)' : ''}.`;
      r.sub.textContent = sub;
      r.warn.textContent = warn;
    }
    // supply chain bars
    const R = s.rates;
    const chain = [['Quarried', R.quarry || 0], ['Hauled', R.haul || 0], ['Set', R.set || 0]];
    const mx = Math.max(1, ...chain.map((c) => c[1]), (R.haulCap || 0), (R.masonCap || 0));
    const btl = chain.reduce((a, c, i) => (c[1] < chain[a][1] ? i : a), 0);
    laborEl.querySelector('#flow').innerHTML = `<b>${esc(C.names.block[0].toUpperCase() + C.names.block.slice(1))}s per month</b>` +
      chain.map(([n, v], i) => `<div>${n}: ${fmt(v * 30)}</div><div class="bar ${i === btl && v < mx * 0.8 ? 'btl' : ''}"><i style="width:${(100 * v) / mx}%"></i></div>`).join('');
    // gods
    for (const p of C.patrons) {
      const g = godRefs[p.id];
      const f = s.favor[p.id];
      g.el.classList.toggle('angry', f < 30);
      g.el.classList.toggle('pleased', f > 75);
      g.bar.style.width = f + '%';
      g.bar.style.background = f < 30 ? 'var(--bad)' : f > 75 ? 'var(--gold)' : 'var(--malachite)';
      const cost = S.offeringCost(s, p);
      g.btn.innerHTML = `Offer ${costStr(cost)}`;
      g.btn.disabled = !S.canAfford(s, cost);
    }
    const ag = S.decreeList(s).find((d) => d.id === 'allgods');
    const agb = godsEl.querySelector('#allGods');
    agb.innerHTML = `${esc(ag.name)}: ${costStr(ag.cost)}`;
    agb.disabled = !ag.ready || !ag.afford;
    godsEl.querySelector('#maatLine').textContent = `${C.names.maat} ${Math.round(s.maat)}`;
    // progress
    progress(s, cal);
    renderTab(false);
    advisor(s, cal);
    toasts(s);
    worker();
  }

  function progress(s, cal) {
    const g = S.geometry(s);
    const b = s.build;
    const corePct = Math.min(100, (100 * b.core) / g.total);
    const casPct = b.casingTotal ? Math.min(100, (100 * b.casing) / b.casingTotal) : 0;
    const reign = L.reignYears + (s.flags.extraYears || 0);
    const timePct = Math.min(100, (100 * (s.day / cal.yearDays)) / reign);
    const yearsLeft = reign - (cal.year - 1) - cal.doy / cal.yearDays;
    const alerts = [];
    if (b.blocked) alerts.push('⚠ ' + b.blocked);
    if (s.effects.some((e) => e.kind === 'strike')) alerts.push('⚠ Strike! Feed them, give them drink, or throw a feast.');
    if (s.effects.some((e) => e.kind === 'storm')) alerts.push('⚠ ' + (C.storm.text.replace(/<[^>]+>/g, '').split('!')[0]) + '!');
    for (const x of s.expeditions) {
      const d = C.expeditions.concat(L.expeditions || []).find((e) => e.id === x.id);
      alerts.push(`⛵ ${d.name}: back in ${x.until - s.day} days`);
    }
    const water = C.water;
    const fc = s.water.forecast != null ? ` · next: ${water.fmt(s.water.forecast)}` : '';
    $('#prog').innerHTML = `<div class="ttl"><span>${esc(L.title)}</span><small>${b.height.toFixed(1)} m of ${g.top.toFixed(0)} m${s.build.variant !== L.structure.defaultVariant || Object.keys(L.structure.variants).length > 1 ? ' · ' + esc(g.variant.label) : ''}</small></div>
      <div class="bars"><span>Core</span><div class="bar"><i style="width:${corePct}%"></i></div><span>${corePct.toFixed(1)}%</span>
      <span>${esc(C.names.casing)}</span><div class="bar cas"><i style="width:${casPct}%"></i></div><span>${casPct.toFixed(0)}%</span>
      <span>Reign</span><div class="bar time"><i style="width:${timePct}%"></i></div><span>${yearsLeft.toFixed(1)} y left</span></div>
      <div id="nilo">💧 ${esc(water.gauge)}: <b>${water.fmt(s.water.w)}</b>${fc}</div>
      ${alerts.map((a) => `<div class="alert">${esc(a)}</div>`).join('')}
      ${corePct >= 100 && casPct >= 99.9 && !b.capstone ? `<button class="cap" id="capBtn" ${S.canCap(s) ? '' : 'disabled'}>${esc(L.structure.capstoneName || C.names.capstone)} (${L.structure.capstoneCost} ${icon('treasure')})</button>` : ''}`;
    const cb = $('#capBtn');
    if (cb) cb.onclick = () => { if (S.raiseCapstone(game.s)) { sfx('fanfare'); game.onCapstone(); } };
  }

  // ---------------- advisor ----------------
  function tips(s, cal) {
    const out = [];
    const perDay = (s.pop + s.levy.count) * (S.RATION + S.THIRST * 0.25);
    const foodDays = perDay ? s.res.food / perDay : 999;
    const yearNeed = (s.pop * (S.RATION + S.THIRST * 0.25) * cal.yearDays * 1.1) / 160;
    const farmSeason = ['grow', 'harvest', 'continuous'].includes(cal.season.farm);
    if (s.fed < 1) out.push(`We are out of ${C.names.food.toLowerCase()}! People are starving. ${farmSeason ? 'Get more farmers into the fields.' : 'Send fewer people on expeditions, and pray for the harvest.'}`);
    if (s.effects.some((e) => e.kind === 'strike')) out.push(`The crews are on strike. Fix the food and drink, or decree a <b>${esc(C.decrees.feast.name)}</b>.`);
    if (farmSeason && s.jobs.farm < Math.min(S.capacity(s, 'farm'), yearNeed) * 0.85) out.push(`It's <b>${esc(cal.season.name)}</b>: we need about <b>${fmt(Math.min(S.capacity(s, 'farm'), yearNeed))}</b> farmers or there won't be enough ${C.names.food.toLowerCase()} for the year.`);
    if (cal.season.farm === 'idle' && s.draft === 'none') out.push(`The fields are idle. Send the farmers to build: they eat either way.`);
    if (foodDays < 50 && cal.season.farm !== 'harvest') out.push(`${C.names.food} will last only ${Math.round(foodDays)} days.`);
    if (['grow', 'harvest'].includes(cal.season.farm) && s.crop + s.res.food > S.storage(s) * 1.02) out.push(`The coming harvest won't fit in the ${C.buildings.granary.name.toLowerCase()} (${fmt(S.storage(s))} max). Upgrade them in Build, or the surplus rots.`);
    for (const p of C.patrons) if (s.favor[p.id] < 30) out.push(`<b>${esc(p.name)}</b> is angry. Make an offering before something terrible happens.`);
    if (s.build.blocked) out.push(esc(s.build.blocked) + ' Look in Decrees.');
    const R = s.rates;
    if (s.res.stone > (R.haulCap || 1) * 25 && s.res.stone > 200) out.push(`${C.names.stone} is piling up at the quarry. More ${C.jobs.haul.name.toLowerCase()}!`);
    if (s.res.site > (R.masonCap || 1) * 25 && s.res.site > 200) out.push(`${C.names.stone} is piling up at the ramp. More ${C.jobs.mason.name.toLowerCase()}!`);
    if (s.res.stone < 20 && s.res.site < 20 && s.build.core < s.build.total && !s.build.blocked) out.push(`The ${C.jobs.mason.name.toLowerCase()} are waiting for stone. More ${C.jobs.quarry.name.toLowerCase()}!`);
    for (const j of S.JOBS) if (s.jobs[j] > S.capacity(s, j) * 1.02) out.push(`Too many ${C.jobs[j].name.toLowerCase()} for the space we have. Build!`);
    if (s.pop > S.housing(s)) out.push(`People are crowded. Upgrade the ${C.buildings.village.name}.`);
    if (S.idle(s) > s.pop * 0.05) out.push(`${fmt(S.idle(s))} ${C.names.workers.toLowerCase()} are idle. Put them to work!`);
    if (s.res.tools < 40) out.push(`We are out of ${C.names.tools.toLowerCase()}, so the quarry is crawling. Send an expedition.`);
    if (s.drinkSat < 0.9) out.push(`Not enough ${C.names.drink.toLowerCase()}. Morale will suffer. More ${C.jobs.brew.name.toLowerCase()}!`);
    if (!s.research && C.techs.some((t) => !s.techs.includes(t.id))) out.push(`Nobody is studying anything. Pick a topic in the ${esc(cap(C.names.wisdomBy.replace(/^The /, '')))} tab.`);
    const casingNeed = s.build.casingTotal * (s.build.core / s.build.total) - s.build.casing - s.res.casing;
    if (casingNeed > s.build.casingTotal * 0.05) out.push(`The ${C.names.casing.toLowerCase()} is falling behind. More ${C.jobs.boat.name.toLowerCase()}${C.id === 'egypt' ? ', especially during the flood' : ''}.`);
    if (s.build.core >= s.build.total && s.res.treasure < L.structure.capstoneCost) out.push(`We need ${L.structure.capstoneCost} ${C.names.treasure.toLowerCase()} for the finish. Send for more.`);
    return out;
  }
  function advisor(s, cal) {
    const now = performance.now();
    const list = tips(s, cal);
    if (now - tipT > 6000 || !tipText) {
      tipT = now;
      if (list.length) { tipText = list[tipIdx++ % list.length]; }
      else {
        const facts = L.history;
        tipText = '<i>Did you know?</i> ' + facts[tipIdx++ % facts.length];
      }
    }
    $('#advisor .bubble').innerHTML = `<b>${esc(L.advisor.name)}:</b> ${tipText}`;
  }

  // ---------------- toasts ----------------
  function toasts(s) {
    if (s.log.length < lastLogLen) lastLogLen = 0;
    const fresh = s.log.slice(lastLogLen);
    lastLogLen = s.log.length;
    for (const l of fresh) {
      if (!['bad', 'good', 'big', 'warn'].includes(l.kind)) continue;
      toast(l.text, l.kind === 'warn' ? 'bad' : l.kind === 'big' ? 'good' : l.kind);
      if (l.kind === 'bad') sfx('bad');
      else if (l.kind === 'good') sfx('good');
    }
  }
  function toast(html, kind) {
    const box = $('#toast');
    const d = document.createElement('div');
    d.className = kind;
    d.innerHTML = html;
    box.prepend(d);
    while (box.children.length > 3) box.lastChild.remove();
    setTimeout(() => d.remove(), 6500);
  }

  // ---------------- worker tooltip ----------------
  let picked = null, pickedUntil = 0;
  function showWorker(a, x, y) {
    picked = a;
    pickedUntil = performance.now() + 4500;
    const s = game.s;
    const cal = S.calendar(s);
    let pool;
    if (s.effects.some((e) => e.kind === 'strike')) pool = THOUGHTS.strike;
    else if (s.effects.some((e) => e.kind === 'storm')) pool = THOUGHTS.storm;
    else if (s.fed < 1) pool = THOUGHTS.hungry;
    else if (s.drinkSat < 0.7) pool = THOUGHTS.thirsty;
    else if (a.job === 'haul' && cal.season.farm === 'idle' && a.id % 3 === 0) pool = THOUGHTS.farmIdle;
    else if (a.id % 3 === 0) pool = s.morale > 60 ? THOUGHTS.happy : THOUGHTS.sad;
    else pool = THOUGHTS[a.job] || THOUGHTS.happy;
    const th = pool[(a.id + Math.floor(s.day / 30)) % pool.length].replace('{drink}', C.names.drink.toLowerCase()).replace('{food}', C.names.food.toLowerCase()).replace('{structure}', C.names.structure);
    const el = $('#worker');
    el.innerHTML = `<b>${esc(a.name)}</b>${esc(C.jobs[a.job].name.replace(/s( &|$)/, '$1'))}<br><i>“${esc(th)}”</i>`;
    el.style.left = Math.min(window.innerWidth - 260, x + 12) + 'px';
    el.style.top = Math.max(50, y - 70) + 'px';
    el.classList.remove('hidden');
  }
  function worker() {
    if (picked && performance.now() > pickedUntil) { picked = null; $('#worker').classList.add('hidden'); }
  }

  // ---------------- modals ----------------
  function modal(html, kind) {
    modalKind = kind;
    const m = $('#modal');
    m.querySelector('.box').innerHTML = html;
    m.classList.remove('hidden');
    return m.querySelector('.box');
  }
  function closeModal() { $('#modal').classList.add('hidden'); modalKind = null; }
  const modalOpen = () => !$('#modal').classList.contains('hidden');

  function showIntro() {
    const box = modal(`<h2><span class="g ${C.id === 'egypt' ? 'hiero' : ''}">${L.advisor.glyph}</span>${esc(L.title)}</h2>
      <p style="color:var(--dim);margin-top:-4px">${esc(L.place)} · ${esc(L.date)} · ${esc(L.ruler)} · reign of ${L.reignYears} ${C.id === 'mars' ? 'Mars years' : 'years'}</p>
      ${L.intro}
      <p style="font-size:12.5px;color:var(--dim)"><b>How to play:</b> assign workers on the left, keep the gods happy on the right, and use Build, Decrees and ${esc(C.names.wisdomBy.replace(/^The /, ''))} below. Space pauses; 1–3 set the speed. Click a worker to hear what they think. Drag to pan, scroll to zoom.</p>
      <div class="choices"><button id="go">Begin</button></div>`, 'intro');
    box.querySelector('#go').onclick = () => { closeModal(); game.setSpeed(2); sfx('drum'); };
  }

  function showPending(ev) {
    if (modalKind === 'pending:' + ev.id + ev.title) return;
    sfx(ev.id === 'rampage' ? 'bad' : 'gong');
    const box = modal(`<h2>${ev.glyph ? `<span class="g ${C.id === 'egypt' ? 'hiero' : ''}">${ev.glyph}</span>` : ''}${esc(ev.title)}</h2><p>${ev.text}</p>
      <div class="choices">${ev.choices.map((c, i) => `<button data-c="${c.id}" class="${i ? 'alt' : ''}" ${c.need && !S.canAfford(game.s, c.need) ? 'disabled' : ''}>${esc(c.label)}</button>`).join('')}</div>`, 'pending:' + ev.id + ev.title);
    box.querySelectorAll('button[data-c]').forEach((b) => (b.onclick = () => {
      S.resolveChoice(game.s, b.dataset.c);
      closeModal();
      update(true);
    }));
  }

  function showEnd(s) {
    const gl = s.glory;
    const win = s.outcome === 'win';
    const best = game.saveBest(s.levelId, win ? gl.score : 0);
    const title = win ? 'Complete!' : s.outcome === 'reign' ? 'The reign is over' : s.outcome === 'collapse' ? 'Everyone is gone' : 'Chaos';
    const line = win ? L.winLine : s.outcome === 'reign' ? L.reignLine : s.outcome === 'collapse' ? 'Hunger and misfortune emptied the camp. The half-built structure stands alone.' : C.chaosLine;
    const nxt = nextLevel(s.levelId);
    const box = modal(`<h2>${esc(title)}</h2><p>${line}</p>
      <p><span class="score">${fmt(gl.score)}</span> glory${best ? ' · <b>new best!</b>' : ''}</p>
      <ul class="facts"><li>Height: ${gl.height.toFixed(1)} m of ${gl.top.toFixed(0)} m</li><li>Average ${esc(C.names.maat)}: ${Math.round(gl.avgMaat)}</li><li>${esc(C.names.workers)} lost: ${fmt(s.stats.died)}${s.stats.why ? ' (' + Object.entries(s.stats.why).map(([k, v]) => `${k} ${fmt(v)}`).join(', ') + ')' : ''}</li><li>Offerings made: ${s.stats.offerings}</li></ul>
      <div class="choices">${win && !L.timeloop ? `<button id="next">${L.martians ? 'Expansion pack' : 'Next'}: ${esc(nxt.title)} (${esc(nxt.date)})</button>` : ''}<button id="retry" class="${win ? 'alt' : ''}">${win ? 'Play again' : 'Try again'}</button><button id="home" class="alt">Title screen</button></div>`, 'end');
    const n = box.querySelector('#next');
    if (n) n.onclick = () => game.startLevel(nxt.id);
    box.querySelector('#retry').onclick = () => game.startLevel(s.levelId);
    box.querySelector('#home').onclick = () => game.toTitle();
    sfx(win ? 'fanfare' : 'bad');
  }

  function showMartians(s) {
    const box = modal(`<h2>Visitors from Horus the Red</h2>
      <p>A craft of silver and light settles beside the pyramid. Figures in pressure suits step out, each with a little golden <b>beehive</b> on the shoulder.</p>
      <p>"Greetings, people of Kemet. We come from the red star you call <i>Horus the Red</i>. We have watched you for a long time: 2.3 million blocks, copper chisels, sledges, wet sand, bread and beer. No machines. No help."</p>
      <p>"We have concluded, logically, that <b>you are a very cool civilization</b>."</p>
      <p>They hand Hemiunu a bowl of something green and wobbly. "It's called Jell-O. You'll get it in about four thousand years." Then they glance at each other, as if they have done this before.</p>
      <p>"See you at the other end of the loop," says one. The ship lifts off toward Mars.</p>
      <p style="color:var(--dim);font-size:12.5px">Who were they? Play the expansion pack, <b>Pyramids of the World (and Beyond)</b>, to find out.</p>
      <div class="choices"><button id="go">See the score</button></div>`, 'martians');
    box.querySelector('#go').onclick = () => showEnd(s);
    sfx('fanfare');
  }

  function showTimeLoop(s) {
    const box = modal(`<h2>Return to the Source</h2>
      <p>The Chrono-core spins up. A beam leaves the apex of the Pyramid of Cydonia and the colony ship rises into it.</p>
      <p>BEEHIVE-12: "Destination locked. Giza, Earth. Year 27 of Khufu, the morning the pyramidion goes on."</p>
      <p>Romney XXI straightens his tie. "Gentlemen, let's go and tell them how cool they are."</p>
      <p>A flash of white. The ship hangs over a desert plateau at dawn, above a gleaming white pyramid and a crowd of astonished workers holding beer jugs, and it dawns on the Romnians: <b>they were the Martians all along.</b></p>
      <p>The pyramids inspired the dynasty. The dynasty went to Mars. Mars built a time machine. The time machine went back to admire the pyramids. Nobody can say where it started. Imhotep would have loved it.</p>
      <div class="choices"><button id="loop">Restart the cycle: Djoser, 2670 BC</button><button id="sc" class="alt">See the score</button></div>`, 'loop');
    box.querySelector('#loop').onclick = () => game.startLevel(LEVELS[0].id);
    box.querySelector('#sc').onclick = () => showEnd(s);
    sfx('fanfare');
  }

  function showEssay() {
    const box = modal(ESSAY + '<div class="choices"><button id="ok">Back</button></div>', 'essay');
    box.querySelector('#ok').onclick = () => { closeModal(); if (!game.s) showTitle(); };
  }

  // ---------------- title ----------------
  function showTitle() {
    for (const id of ['top', 'res', 'left', 'right', 'prog', 'bottom', 'advisor']) $('#' + id).classList.add('hidden');
    closeModal();
    const best = game.loadBest();
    const save = game.hasSave();
    const card = (l, i) => `<button class="lv" data-level="${l.id}"><div class="n"><span>${l.campaign === 'egypt' ? 'Level ' + (i + 1) : esc(l.civ.label)}</span><span>${esc(l.date)}</span></div>
      <div class="h">${esc(l.title)}</div><div class="w">${esc(l.place)} · ${esc(l.ruler)}</div><p>${esc(l.blurb)}</p>${best[l.id] ? `<div class="best">★ Best: ${fmt(best[l.id])} glory</div>` : ''}</button>`;
    const eg = LEVELS.filter((l) => l.campaign === 'egypt');
    const ex = LEVELS.filter((l) => l.campaign === 'expansion');
    const t = $('#title');
    t.innerHTML = `<div class="wrap">
      <div class="glyphs">𓇳 𓊽 𓋹 𓅃 𓆣 𓂀</div>
      <h1>SimPyramid</h1>
      <div class="tag">The game of pyramid adventure. Feed the workers. Appease the gods. Survive the flood.<br>Build something so impressive that Mars takes notice.</div>
      ${save ? `<div class="row"><button class="big" id="cont">Continue: ${esc(getLevel(save.levelId).title)}, year ${S.calendar(save).year}</button></div>` : ''}
      <h2>Campaign: Kemet, the Two Lands <small>Ancient Egypt, from Imhotep to the Great Pyramid</small></h2>
      <div class="levels">${eg.map(card).join('')}</div>
      <div class="expbox" style="margin-top:22px"><span class="stamp">EXPANSION PACK</span>
        <h2 style="margin-top:8px">Pyramids of the World (and Beyond) <small>Olmec · Maya · Mexica · Cahokia · the Empire of Deseret · Mars, and back again</small></h2>
        <div class="levels">${ex.map(card).join('')}</div></div>
      <div class="row"><button class="ghost" id="essay">Who really built the pyramids? (Slaves? Keynes? Aliens?)</button></div>
      <div class="foot">Made by Claude Opus 5.5 for <a href="../../portfolio.html">High Dimensional Coconuts</a>. Historical notes are as accurate as we could make them; the Romney Dynasty is not (yet).</div>
    </div>`;
    t.classList.remove('hidden');
    t.querySelectorAll('[data-level]').forEach((b) => (b.onclick = () => { sfx('drum'); game.startLevel(b.dataset.level); }));
    const c = t.querySelector('#cont');
    if (c) c.onclick = () => game.continueSave();
    t.querySelector('#essay').onclick = () => showEssay();
  }

  return {
    setupLevel, update, showIntro, showPending, showEnd, showMartians, showTimeLoop, showTitle, showWorker, modalOpen, closeModal,
    get modalKind() { return modalKind; },
  };
}
