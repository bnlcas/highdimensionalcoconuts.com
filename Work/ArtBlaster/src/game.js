// Rules, the bill, and everything the HUD says: fact cards, quips, unlocks, the final invoice.
import { WEAPONS } from './weapons.js';

const $ = (id) => document.getElementById(id);

export function fmtMoney(v) {
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(v >= 1e8 ? 0 : 1) + 'M';
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(v >= 1e5 ? 0 : 1) + 'K';
  return '$' + Math.round(v);
}
const fmtFull = (v) => '$' + Math.round(v).toLocaleString('en-US');
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const ROUND_SECONDS = 180;

// small JPEG of a canvas (a painting's pristine base, or its live, damaged state)
function canvasThumb(src, max = 360) {
  const k = Math.min(1, max / Math.max(src.width, src.height));
  const c = document.createElement('canvas');
  c.width = Math.round(src.width * k); c.height = Math.round(src.height * k);
  const g = c.getContext('2d');
  g.fillStyle = '#2a2622'; g.fillRect(0, 0, c.width, c.height);  // burnt-through holes read as darkness
  g.drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.85);
}

function thumbs(art) {
  const changed = art.damage > 0 || art.cost + art.extraCost > 0;
  if (art.def.kind === 'painting') {
    return { before: canvasThumb(art.surface.base), after: changed ? canvasThumb(art.surface.live) : null };
  }
  return { before: art.thumb, after: null };
}

function thumbHTML(art, cls) {
  const t = thumbs(art);
  const stamp = art.destroyed ? (art.fate || 'DESTROYED') : art.toppled ? 'TOPPLED' : '';
  const fig = (src, label, st) => src ? `<figure class="${cls}"><div class="tw"><img src="${src}" alt="">${st ? `<span class="stamp">${st}</span>` : ''}</div>${label ? `<figcaption>${label}</figcaption>` : ''}</figure>` : '';
  if (t.after) return fig(t.before, 'Before', '') + fig(t.after, 'After', stamp);
  return fig(t.before, '', stamp);
}

const COMBOS = {
  'sunflowers:soup': 'Historical reenactment! Just Stop Oil threw tomato soup at this exact painting on 14 October 2022.',
  'grainstacks:soup': 'Close, but in Potsdam in 2022 it was mashed potatoes.',
  'mona-lisa:soup': 'Activists threw pumpkin soup at this glass in January 2024. It didn\'t work then either.',
  'mona-lisa:lipstick': 'Drawing a mustache on the Mona Lisa? Marcel Duchamp beat you to it in 1919, on a postcard he titled "L.H.O.O.Q."',
  'warhol:soup': 'Soup on soup. Andy would have signed it and sold it.',
  'pollock:paintball': 'Experts cannot tell your paintballs from Pollock\'s drips. Insurance claim reduced by 98%.',
  'pollock:soup': 'Pollock flung paint at canvases on the floor. You are flinging soup at one on the wall. Progress?',
  'rothko:soup': 'Rothko wanted you to stand 18 inches away and feel something. You felt something.',
  'rothko:lipstick': 'In 2012 a man wrote on a Rothko at Tate Modern with ink. Restoring it took 18 months.',
  'black-square:paintball': 'It is no longer a Black Square. Malevich would call that a step backwards.',
  'black-square:lipstick': 'Congratulations, you have invented Suprematism 2.0.',
  'night-watch:crowbar': 'The 1975 attacker used a bread knife. Conservators have patched this canvas before.',
  'night-watch:soup': 'In 1990 a man sprayed acid on The Night Watch. Soup is gentler.',
  'fountain:sledge': 'Pierre Pinoncelli chipped a Fountain with a hammer in 2006. He also called it art.',
  'fountain:soup': 'Technically, it was designed to get wet.',
  'thinker:sledge': 'In 1970 a bomb knocked Cleveland\'s Thinker off its base. You are doing it by hand.',
  'scream:soup': 'The Scream is painted on cardboard. Cardboard and soup do not mix.',
  'great-wave:soup': 'Wet paper plus soup equals papier-mâché. Prints are the most fragile things in any museum.',
  'kiss:flame': 'Klimt\'s gold leaf is real gold, hammered far thinner than a human hair.',
  'meninas:paintball': 'Velázquez painted himself into this picture. Now you have too.',
  'starry-night:paintball': 'Adding stars? Van Gogh painted eleven.',
  'jar:soup': 'A 650-year-old jar versus a can of soup.',
  'balloon-dog:crowbar': 'In 2023 one of these broke by accident. You are doing it on purpose.',
  'washington:paintball': 'The Continental Army now has camouflage.',
  'salvator-mundi:crowbar': 'Bought for about $1,175 in 2005. Today\'s repair bill is a little higher.',
  'grande-jatte:paintball': 'Seurat used tiny dots. You are using big ones.',
  'boy-lizard:soup': 'This boy is having a very bad day.',
  'pearl:lipstick': 'In 2022 a protester glued his head to this glass. Lipstick is a smaller commitment.',
  'card-players:flame': 'Five versions exist. Now there are four and a half.',
  'mondrian:paintball': 'Mondrian allowed only red, blue and yellow. Your green is a scandal.',
  'david:sledge': 'In 1991 a man broke David\'s left toe with a hammer. You are aiming higher.',
  'david:crowbar': 'David stands 5.17 m tall. You are going to need a longer crowbar.',
  'david:soup': 'In 1527 a bench thrown from a window broke David\'s arm. Soup is a downgrade.',
  'selene:crowbar': 'In 1937 workmen scraped these marbles with copper tools to make them whiter. You are continuing a proud tradition.',
  'selene:sledge': 'Greece has been asking for this back since 1983. It may now arrive in more pieces.',
  'moore:flame': 'Thieves melted down a 2-tonne Moore in 2005. It took them a furnace, not a flamethrower.',
  'moore:sledge': 'Moore wanted the holes to matter as much as the bronze. You are making more holes.',
  'hepworth:soup': 'Wood soaks up liquid and swells. Water is one of the biggest threats to wooden sculpture.',
  'calder:paintball': 'Calder loved bright primary colors. He might honestly have approved.',
  'calder:soup': 'Duchamp named Calder\'s moving sculptures "mobiles." This one is now a "soupile."',
};

const MATERIAL_NOTES = {
  'porcelain:flame': 'Porcelain was fired in a kiln at about 1,300 °C. To it, your flamethrower is a warm breeze.',
  'bronze:flame': 'Bronze melts around 950 °C, and statues are thick. You are just adding patina.',
  'bronze:lipstick': 'Lipstick wipes right off polished bronze.',
  'bronze:crowbar': 'Bronze dents but won\'t shatter. Knock it off its plinth instead!',
  'bronze:sledge': 'Bronze dents but won\'t shatter. Knock it off its plinth instead!',
  'bronze:soup': 'Soup versus bronze: bronze wins.',
  'marble:lipstick': 'Marble is porous, so lipstick can really stain it. Conservators draw stains out with poultices.',
  'marble:flame': 'Marble doesn\'t burn, but soot stains it.',
  'marble:crowbar': 'Marble chips. In 1972 a hammer knocked the nose off the Virgin in Michelangelo\'s Pietà.',
  'porcelain:lipstick': 'The glaze on porcelain is basically glass, so lipstick wipes right off.',
  'porcelain:crowbar': 'Hairline crack! Porcelain is hard but brittle.',
  'porcelain:soup': 'It wobbled! Porcelain is hard but brittle. What happens if it falls off the plinth?',
  'marble:sledge': 'Marble is strong under its own weight but brittle when struck. Big statues can be pushed over, too.',
  'steel:sledge': 'Stabiles are bolted together from steel plates. Enough whacks and the bolts give.',
  'steel:crowbar': 'A crowbar against steel plate. Calder trained as an engineer; he would admire the leverage.',
  'steel:flame': 'Steel softens around 600 °C. Mostly you are blistering the paint.',
  'wood:flame': 'Wood burns! Carved wooden sculpture is one reason museums ban open flames.',
  'wood:sledge': 'Wood splits along the grain. Hepworth chose her timber for how the grain flowed around the hollows.',
};

const CAPPED = {
  soup: 'That\'s all soup can do: conservators can clean a surface. To do real damage you need something heavier.',
  lipstick: 'Lipstick mostly sits on the varnish, so conservators can remove it. You have maxed out the lipstick damage.',
  paintball: 'Paint on top of varnish can be cleaned off. That\'s as much as paintballs can do here.',
};

const DOCENT = [
  'Please don\'t touch the art!',
  'Sir! SIR! That is a national treasure!',
  'In my thirty years as a docent, I have never seen anything like this.',
  'Remember, children: look with your eyes, not with your sledgehammer.',
  '"Can I touch it?" ...Well, I suppose you did buy it.',
  'Fun fact: museum insurance is called "nail to nail" coverage, from the wall it leaves to the wall it hangs on.',
  'Conservators are going to need a bigger budget.',
  'Please use your indoor flamethrower voice.',
  'The gift shop is that way. Please. Go to the gift shop.',
  'Museums keep the humidity near 50% to protect paintings. This is... not that.',
  'Most of a museum\'s collection is in storage. Please don\'t find it.',
  'That piece survived wars, floods and thieves. Until today.',
  'Mr. Hang bought this entire collection with one afternoon of stock gains.',
  'Van Gogh had no ray tracing. Look how well he did anyway.',
  'Michelangelo carved David without a single tensor core.',
  'Please do not overclock the sculptures.',
  'That was hand-rendered, sir. At about one frame per decade.',
  'The founder\'s leather jacket is NOT part of the collection. Please leave it alone.',
];

const RANKS = [
  [0, 'Polite Visitor', 'You looked with your eyes. The docents are thrilled.'],
  [1e6, 'Clumsy Field-Trip Kid', 'Some cleaning required.'],
  [50e6, 'Overzealous Art Critic', 'The conservation department is working weekends.'],
  [250e6, 'Rogue Restorer', 'Several masterpieces are now "attributed to the workshop of you."'],
  [1e9, 'Cultural Wrecking Ball', 'Insurers worldwide have added a clause with your name on it.'],
  [3e9, 'Hermitage-Grade Menace', 'Your portrait now hangs in every museum security office.'],
  [6e9, 'Supreme Patron of Chaos', 'The museum has been renamed in your honor. It is now a parking lot.'],
];

export class Game {
  constructor(opts) {
    this.museum = opts.museum;
    this.sfx = opts.sfx;
    this.effects = opts.effects;
    this.isTouch = opts.isTouch;
    this.state = 'menu';
    this.mode = 'timed';
    this.reset();
    this.buildWeaponBar();
    this.best = 0;
    try { this.best = +localStorage.getItem('artblaster.best') || 0; } catch (e) { /* storage blocked */ }
  }

  reset() {
    this.bill = 0; this.shownBill = 0;
    this.timeLeft = ROUND_SECONDS;
    this.unlocked = 2;
    this.pending = 0; this.popupT = 0;
    this.docentT = 6;
    this.seenWeapons = new Set();
    this.notes = new Set();
    this.glassFees = 0;
    this.destroyedCount = 0;
    $('feed').innerHTML = '';
  }

  setWeapons(ws) { this.weapons = ws; }

  start(mode) {
    this.mode = mode;
    this.state = 'play';
    if (mode === 'free') this.unlocked = WEAPONS.length;
    this.refreshWeaponBar();
    $('timer').style.display = mode === 'free' ? 'none' : '';
    this.weaponCard(this.weapons.current);
  }

  // ---------------------------------------------------------------- events from Destruction
  onDamage(art, weapon, cost, point) {
    if (cost <= 0) return;
    this.bill += cost;
    this.pending += cost;
    if (!art.firstHit) {
      art.firstHit = { weapon, t: ROUND_SECONDS - this.timeLeft };
      this.factCard(art);
    }
    const combo = COMBOS[art.def.id + ':' + weapon];
    if (combo && !this.notes.has('c' + art.def.id + weapon)) {
      this.notes.add('c' + art.def.id + weapon);
      this.toast(combo, 'combo');
    }
    if (cost > 2e6 && point) this.effects.money(point);
    if (cost > 1e6) this.sfx.play('cash');
    this.checkUnlocks();
    this.maybeDocent();
  }

  onGlass(art, weapon, fee, point, kind) {
    if (fee > 0) {
      this.bill += fee; this.pending += fee; art.extraCost += kind === 'broken' ? 0 : fee; this.glassFees += fee;
      art.glassBy = art.glassBy || {}; art.glassBy[weapon] = (art.glassBy[weapon] || 0) + fee;
    }
    if (kind === 'broken') {
      this.banner(art.glass.bulletproof ? 'BULLETPROOF GLASS BROKEN' : 'GLASS SHATTERED', fmtMoney(fee) + ' for new glass', 'glass');
      return;
    }
    if (kind === 'cracked') {
      if (!this.notes.has('crack' + art.def.id)) {
        this.notes.add('crack' + art.def.id);
        this.toast(art.glass.bulletproof
          ? 'Bulletproof glass: the Mona Lisa has had it since the 1950s. Keep swinging, or try heat.'
          : 'Cracked! One more good hit and the glass goes.', 'note');
      }
      return;
    }
    if (!this.notes.has('glass' + art.def.id)) {
      this.notes.add('glass' + art.def.id);
      this.toast(`<b>Protected by glass.</b> ${esc(art.def.title)} is glazed, so you only pay for cleaning. Real protesters pick glazed paintings for exactly this reason. Break the glass first.`, 'note');
      const combo = COMBOS[art.def.id + ':' + weapon];
      if (combo && !this.notes.has('c' + art.def.id + weapon)) { this.notes.add('c' + art.def.id + weapon); this.toast(combo, 'combo'); }
    }
  }

  onCapped(art, weapon) {
    const k = 'cap' + weapon + art.def.id;
    if (CAPPED[weapon] && !this.notes.has(k)) { this.notes.add(k); this.toast(CAPPED[weapon], 'note'); }
  }

  onMaterialNote(art, weapon) {
    const k = art.def.material + ':' + weapon;
    if (MATERIAL_NOTES[k] && !this.notes.has('m' + k)) { this.notes.add('m' + k); this.toast(MATERIAL_NOTES[k], 'note'); }
    const combo = COMBOS[art.def.id + ':' + weapon];
    if (combo && !this.notes.has('c' + art.def.id + weapon)) { this.notes.add('c' + art.def.id + weapon); this.toast(combo, 'combo'); }
  }

  onDestroyed(art, weapon) {
    this.destroyedCount++;
    this.sfx.play('destroyed');
    const verb = weapon === 'flame' ? 'BURNED' : art.def.material === 'steel' ? 'DISMANTLED' : art.def.kind === 'sculpture' ? 'SHATTERED' : 'DESTROYED';
    art.fate = verb;
    this.banner(verb + '!', `${art.def.title} · ${fmtMoney(art.cost)}`, 'destroyed');
  }

  onToppled(art) {
    this.banner('TOPPLED!', `${art.def.title} hit the floor. ${art.def.material === 'steel' ? 'Steel bends' : 'Bronze survives'}, but the dents add up.`, 'glass');
  }

  // ---------------------------------------------------------------- HUD pieces
  factCard(art) {
    const d = art.def;
    const html = `
      <div class="fc-head"><b>${esc(d.title)}</b> <span>${esc(d.date)}</span></div>
      <div class="fc-artist">${esc(d.artist)}</div>
      <div class="fc-row">Born ${esc(d.born)}</div>
      <div class="fc-row"><i>${esc(d.movement)}</i> · ${esc(d.medium)}</div>
      <div class="fc-row fc-val">${esc(fmtMoney(d.value))}${d.valueIsEstimate ? ' (est.)' : ''}: ${esc(d.valueNote)}</div>
      <div class="fc-hist">${esc(d.history[0])}</div>`;
    this.toast(html, 'fact', 11000);
  }

  weaponCard(i) {
    const w = WEAPONS[i];
    if (this.seenWeapons.has(w.id)) return;
    this.seenWeapons.add(w.id);
    this.toast(`<b>${esc(w.name)}</b><br>${esc(w.blurb)}`, 'weapon', 8000);
  }

  toast(html, cls, ms = 7000) {
    const feed = $('feed');
    const el = document.createElement('div');
    el.className = 'toast ' + cls;
    el.innerHTML = html;
    feed.prepend(el);
    while (feed.children.length > 3) feed.lastChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 600); }, ms);
  }

  banner(big, small, cls) {
    const b = $('banner');
    b.className = cls;
    b.innerHTML = `<div>${esc(big)}</div><small>${esc(small)}</small>`;
    b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    b.classList.add('show');
    clearTimeout(this.bannerTO);
    this.bannerTO = setTimeout(() => b.classList.remove('show'), 2600);
  }

  popup(amount) {
    const el = document.createElement('div');
    el.className = 'popup' + (amount >= 1e8 ? ' huge' : amount >= 1e7 ? ' big' : '');
    el.textContent = '+' + fmtMoney(amount);
    el.style.left = (50 + (Math.random() - 0.5) * 8) + '%';
    $('popups').appendChild(el);
    setTimeout(() => el.remove(), 1300);
  }

  maybeDocent() {
    if (this.docentT > 0 || Math.random() > 0.4) return;
    this.docentT = 14 + Math.random() * 10;
    const el = $('docent');
    el.innerHTML = `<b>DOCENT:</b> ${esc(DOCENT[(Math.random() * DOCENT.length) | 0])}`;
    el.classList.add('show');
    clearTimeout(this.docentTO);
    this.docentTO = setTimeout(() => el.classList.remove('show'), 4500);
  }

  checkUnlocks() {
    while (this.unlocked < WEAPONS.length && this.bill >= WEAPONS[this.unlocked].unlock) {
      const w = WEAPONS[this.unlocked];
      this.unlocked++;
      this.sfx.play('unlock');
      this.banner('UNLOCKED: ' + w.name.toUpperCase(), this.isTouch ? 'Tap its slot below' : `Press ${this.unlocked} to equip`, 'unlock');
      this.refreshWeaponBar();
    }
  }

  buildWeaponBar() {
    const bar = $('weapons');
    bar.innerHTML = '';
    WEAPONS.forEach((w, i) => {
      const el = document.createElement('button');
      el.className = 'slot';
      el.innerHTML = `<span class="k">${i + 1}</span><span class="n">${esc(w.name.replace('Tube of ', '').replace('Can of ', '').replace(' Marker', ''))}</span><span class="lock">${fmtMoney(w.unlock)}</span>`;
      el.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); this.trySelect(i); });
      bar.appendChild(el);
    });
  }

  refreshWeaponBar() {
    [...$('weapons').children].forEach((el, i) => {
      el.classList.toggle('locked', i >= this.unlocked);
      el.classList.toggle('on', this.weapons && this.weapons.current === i);
    });
  }

  trySelect(i) {
    if (this.state !== 'play' || i < 0 || i >= WEAPONS.length) return;
    if (i >= this.unlocked) {
      this.toast(`${esc(WEAPONS[i].name)} unlocks when your bill reaches ${fmtMoney(WEAPONS[i].unlock)}.`, 'note', 3000);
      return;
    }
    if (this.weapons.current !== i) { this.weapons.select(i); this.weaponCard(i); }
    this.refreshWeaponBar();
  }

  cycle(dir) {
    if (this.state !== 'play') return;
    const n = this.unlocked;
    this.trySelect((this.weapons.current + dir + n) % n);
  }

  // ---------------------------------------------------------------- per frame
  update(dt, look) {
    if (this.state === 'play') {
      this.docentT -= dt;
      if (this.mode === 'timed') {
        this.timeLeft -= dt;
        if (this.timeLeft <= 0) { this.timeLeft = 0; this.finish(); }
      }
    }
    this.popupT -= dt;
    if (this.pending > 0 && this.popupT <= 0) { this.popup(this.pending); this.pending = 0; this.popupT = 0.4; }
    // ticking bill
    this.shownBill += (this.bill - this.shownBill) * Math.min(1, dt * 6);
    if (Math.abs(this.bill - this.shownBill) < 1) this.shownBill = this.bill;
    $('bill-amt').textContent = fmtFull(this.shownBill);
    const t = Math.ceil(this.timeLeft);
    $('timer').textContent = `${(t / 60) | 0}:${String(t % 60).padStart(2, '0')}`;
    $('timer').classList.toggle('low', this.mode === 'timed' && this.timeLeft < 30);
    const touched = this.museum.arts.filter(a => a.damage > 0).length;
    $('count').textContent = `${touched} / ${this.museum.arts.length} works damaged`;
    // what's under the crosshair
    const tgt = $('target');
    const art = look && look.object.userData.hit && look.object.userData.hit.art;
    if (art && !art.destroyed) {
      this.lookArt = art;
      const cond = Math.round((1 - art.damage) * 100);
      tgt.innerHTML = `<b>${esc(art.def.title)}</b> · ${esc(art.def.artist)}<br>
        <span class="tv">${fmtMoney(art.def.value)}${art.def.valueIsEstimate ? ' est.' : ''}</span>
        <span class="cond"><i style="width:${cond}%"></i></span><span class="tv">${cond}%</span>
        <span class="hint">${this.isTouch ? 'ⓘ placard' : 'E: read placard'}</span>`;
      tgt.style.opacity = 1;
    } else {
      this.lookArt = null;
      tgt.style.opacity = 0;
    }
  }

  // ---------------------------------------------------------------- inspect card
  openInspect(art) {
    const d = art.def;
    const dims = d.kind === 'painting' ? `${Math.round(d.h * 100)} × ${Math.round(d.w * 100)} cm` : `about ${Math.round(d.h * 100)} cm tall`;
    $('inspect-body').innerHTML = `
      <div class="ins-thumbs">${thumbHTML(art, 'ins-fig')}</div>
      <div class="ins-kicker">${esc(d.movement)}</div>
      <h2>${esc(d.title)}</h2>
      <div class="ins-artist">${esc(d.artist)} <span>(${esc(d.lifeShort)})</span></div>
      <table class="ins-facts">
        <tr><th>Born</th><td>${esc(d.born)}</td></tr>
        <tr><th>Date</th><td>${esc(d.date)}</td></tr>
        <tr><th>Medium</th><td>${esc(d.medium)}</td></tr>
        <tr><th>Size</th><td>${dims}</td></tr>
        <tr><th>Real home</th><td>${esc(d.home)}</td></tr>
        <tr><th>Value</th><td><b>${fmtFull(d.value)}</b>${d.valueIsEstimate ? ' (estimate)' : ''}<br><small>${esc(d.valueNote)}</small></td></tr>
      </table>
      <p>${esc(d.blurb)}</p>
      <h3>Damage history</h3>
      <ul>${d.history.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
      <p class="ins-fun"><b>Fun fact:</b> ${esc(d.fun)}</p>
      ${d.homage ? '<p class="ins-note">This is a gallery stand-in: the original is still under copyright.</p>' : ''}
      ${d.commons ? `<p class="ins-note">Image: <a href="${d.commons.page}" target="_blank" rel="noopener">Wikimedia Commons</a> (public domain).</p>` : ''}
      <div class="ins-bill">Your bill for this piece so far: <b>${fmtFull(art.cost + art.extraCost)}</b> · condition ${Math.round((1 - art.damage) * 100)}%</div>`;
    $('inspect').classList.add('open');
  }

  // ---------------------------------------------------------------- end of round
  finish() {
    if (this.state === 'over') return;
    this.state = 'over';
    this.sfx.play('buzzer');
    this.weapons && this.weapons.ctx.sfx.flame(false);
    const total = this.bill;
    let newBest = false;
    if (this.mode === 'timed' && total > this.best) {
      this.best = total; newBest = true;
      try { localStorage.setItem('artblaster.best', String(total)); } catch (e) { /* storage blocked */ }
    }
    let rank = RANKS[0];
    for (const r of RANKS) if (total >= r[0]) rank = r;
    const hit = this.museum.arts.filter(a => a.cost + a.extraCost > 0).sort((a, b) => (b.cost + b.extraCost) - (a.cost + a.extraCost));
    const untouched = this.museum.arts.filter(a => a.cost + a.extraCost === 0);
    const wName = (id) => ({ topple: 'Gravity', fall: 'Gravity' }[id] || (WEAPONS.find(w => w.id === id) || {}).name || id);
    const rows = hit.map(a => {
      const top = Object.entries(a.byWeapon).sort((x, y) => y[1] - x[1])[0]
        || Object.entries(a.glassBy || {}).sort((x, y) => y[1] - x[1])[0];
      return `<tr>
        <td class="inv-th">${thumbHTML(a, 'inv-fig')}</td>
        <td><b>${esc(a.def.title)}</b><br><small>${esc(a.def.artist)}, ${esc(a.def.date)}</small></td>
        <td><small>${esc(a.def.born.split('·')[1] || a.def.born)}<br><i>${esc(a.def.movement)}</i></small></td>
        <td class="num">${a.destroyed ? '<span class="dead">destroyed</span>' : Math.round(a.damage * 100) + '%'}</td>
        <td><small>${top ? esc(wName(top[0])) : '–'}${a.damage === 0 ? ' (on the glass)' : ''}</small></td>
        <td class="num">${fmtFull(a.cost + a.extraCost)}</td></tr>`;
    }).join('');
    const teacher = Math.round(total / 110000);
    const gpus = Math.round(total / 30000);
    const lessons = hit.slice(0, 4).map(a => `<li><b>${esc(a.def.artist)}</b>: ${esc(a.def.fun)}</li>`).join('');
    $('summary-body').innerHTML = `
      <div class="inv-kicker">INSURANCE ADJUSTER'S REPORT · THE NVIDO MUSEUM OF ART</div>
      <div class="inv-total">${fmtFull(total)}</div>
      <div class="inv-rank">${esc(rank[1])}</div>
      <div class="inv-sub">${esc(rank[2])}${newBest ? ' <b class="best">New personal best!</b>' : this.best && this.mode === 'timed' ? ` <span class="muted">Best: ${fmtMoney(this.best)}</span>` : ''}</div>
      ${total > 0 ? `<p class="inv-compare">That would pay about <b>${teacher.toLocaleString('en-US')}</b> public-school art teachers for a year: roughly $110,000 each once pension and health benefits are counted, not just salary. Or about <b>${gpus.toLocaleString('en-US')}</b> data-center GPUs at around $30,000 apiece. Jetson would prefer the GPUs.</p>` : ''}
      ${rows ? `<table class="inv-table"><thead><tr><th></th><th>Work</th><th>Artist from · movement</th><th>Damage</th><th>Main tool</th><th>Bill</th></tr></thead><tbody>${rows}</tbody></table>`
        : '<p>You didn\'t damage anything. The docents would like to adopt you.</p>'}
      ${this.glassFees ? `<p class="muted">Includes ${fmtFull(this.glassFees)} for glass cleaning and replacement.</p>` : ''}
      ${lessons ? `<h3>Things you can tell people at dinner</h3><ul>${lessons}</ul>` : ''}
      ${untouched.length ? `<p class="muted">Untouched: ${untouched.map(a => esc(a.def.title)).join(', ')}.</p>` : ''}`;
    $('summary').classList.add('open');
  }
}
