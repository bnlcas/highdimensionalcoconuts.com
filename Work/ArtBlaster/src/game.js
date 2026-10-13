// Rules, the bill, and everything the HUD says: fact cards, quips, unlocks, the final invoice.
import { WEAPONS } from './weapons.js';
import { CAPS } from './artworks.js';
import { shareText, shareLinks, makeCard, gameUrl } from './share.js';
import { getScores, submitScore, savedName, isOnline } from './leaderboard.js';

const $ = (id) => document.getElementById(id);

export function fmtMoney(v) {
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(v >= 1e8 ? 0 : 1) + 'M';
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(v >= 1e5 ? 0 : 1) + 'K';
  return '$' + Math.round(v);
}
const fmtFull = (v) => '$' + Math.round(v).toLocaleString('en-US');
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const ROUND_SECONDS = 240;

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

function thumbHTML(art, cls, caption = '') {
  const t = thumbs(art);
  const stamp = art.destroyed ? (art.fate || 'DESTROYED') : art.toppled ? 'TOPPLED' : '';
  const fig = (src, label, st) => src ? `<figure class="${cls}"><div class="tw"><img src="${src}" alt="">${st ? `<span class="stamp">${st}</span>` : ''}</div>${label ? `<figcaption>${label}</figcaption>` : ''}</figure>` : '';
  if (t.after) return fig(t.before, 'Before', '') + fig(t.after, 'After', stamp);
  return fig(t.before, caption, stamp);
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
  'kandinsky:lipstick': 'Kandinsky believed colors had sounds. This red is a trumpet blast.',
  'kandinsky:paintball': 'Kandinsky painted music. You are adding drums.',
  'kusama:paintball': 'Polka dots on a polka-dot pumpkin. Kusama calls her dots a path to infinity.',
  'basquiat:paintball': 'Basquiat started out spray-painting walls in Manhattan. This feels oddly on-brand.',
  'basquiat:lipstick': 'Basquiat crossed out words "so you will see them more." Same idea.',
  'kahlo:soup': 'Kahlo painted on small Masonite boards. Soup soaks into the edges.',
  'af-klint:soup': 'This is tempera on paper, and paper and soup do not mix. She kept these hidden for decades to protect them.',
  'horse-fair:paintball': 'Bonheur spent a year and a half sketching real horses for this. They now have spots.',
  'cleopatra:sledge': 'This statue survived a saloon, a racetrack and a salvage yard. It had a good run.',
  'fan-kuan:soup': 'Thousand-year-old silk, protected by glass. The museum barely lets light touch it.',
  'gentileschi:crowbar': 'Artemisia painted heroines who fought back. She would not approve.',
  'banjo-lesson:soup': 'Tanner wanted this scene to be seen with respect. Maybe put the soup down.',
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
  'fiberglass:flame': 'Fiberglass is glass threads set in plastic resin. The resin burns, and the smoke is nasty.',
  'fiberglass:sledge': 'Fiberglass is light and strong, but a hard hit cracks it. The storm in 2021 broke the real one into three pieces.',
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
  'Our founder bought the whole collection with one afternoon of NVDA gains. He calls it "a rounding error."',
  'Sir, "move fast and break things" was a metaphor.',
  'The founder calls this "creative destruction." The insurers have other words for it.',
  'This is not disruption. This is vandalism.',
  'Michelangelo carved David with no compute at all. Imagine.',
  'Please stop calling the Rembrandt "legacy content."',
  'Our founder says art will be "solved" by 2030. The docents disagree.',
  'Accelerate? Sir, this is a museum.',
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
    this.owned = new Set([0]);   // you arrive with only a tube of lipstick
    this.stallT = 0;
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
    if (mode === 'free') WEAPONS.forEach((w, i) => this.owned.add(i));
    this.refreshWeaponBar();
    $('timer').style.display = mode === 'free' ? 'none' : '';
    this.weaponCard(this.weapons.current);
    if (mode === 'timed') {
      this.toast('<b>All you have is a tube of lipstick.</b> Better tools are hidden around the museum: look for the beams of light. Start with the <b>can of soup</b> in the Modern wing, straight ahead past David.', 'note', 14000);
    }
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
    if (cost >= 1e6) this.stallT = 0;
    const nc = this.nextCase();
    if (nc && this.bill >= nc.w.opensAt * 0.5 && !this.notes.has('half' + nc.i)) {
      this.notes.add('half' + nc.i);
      this.toast(`Halfway to the <b>${esc(nc.w.name.toLowerCase())}</b> case (${fmtMoney(nc.w.opensAt)}). ${this.tipText()}`, 'note', 9000);
    }
    if (cost > 1e6) this.sfx.play('cash');
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

  docentSay(text, ms = 9000) {
    const el = $('docent');
    el.innerHTML = `<b>DOCENT:</b> ${esc(text)}`;
    el.classList.add('show');
    clearTimeout(this.docentTO);
    this.docentTO = setTimeout(() => el.classList.remove('show'), ms);
    this.docentT = Math.max(this.docentT, 12);
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

  // ---------------------------------------------------------------- weapons found in the galleries
  onPickup(i) {
    const w = WEAPONS[i];
    this.owned.add(i);
    this.sfx.play('unlock');
    this.banner('FOUND: ' + w.name.toUpperCase(), this.isTouch ? 'It\'s in your hands' : `It's in your hands. Press ${i + 1} to switch back to it later`, 'unlock');
    this.weapons.select(i);
    this.weaponCard(i);
    this.refreshWeaponBar();
    const next = WEAPONS.find((x, j) => !this.owned.has(j) && !x.opensAt);
    if (next) this.toast(`Next: the <b>${esc(next.name)}</b> is somewhere in the ${esc(next.where.split(',')[0])}.`, 'note', 9000);
  }

  onCaseOpened(i) {
    const w = WEAPONS[i];
    this.sfx.play('unlock');
    this.banner(w.name.toUpperCase() + ' CASE OPENED', w.where.replace('in a locked case', 'go get it'), 'unlock');
    this.refreshWeaponBar();
  }

  onCaseNear(i) {
    const w = WEAPONS[i];
    const need = w.opensAt - this.bill;
    this.sfx.play('buzzer');
    this.banner('NOT ENOUGH DAMAGE', `The ${w.name.toLowerCase()} case opens at ${fmtMoney(w.opensAt)}. You need ${fmtMoney(need)} more.`, 'locked');
    this.toast(`<b>Locked.</b> The insurers insisted: this case only opens once your bill reaches <b>${fmtMoney(w.opensAt)}</b>. ${this.tipText()}`, 'note', 9000);
  }

  // What could the weapons you own still do to each work? Used to point players at the big money.
  potential(art) {
    if (art.destroyed) return 0;
    const owned = [...this.owned].map(i => WEAPONS[i].id);
    const heavy = owned.includes('sledge') || owned.includes('flame');
    if (art.def.kind === 'sculpture') {
      const max = art.def.material === 'bronze' ? 0.5 : 1;
      const canBreak = heavy || owned.includes('crowbar') || ['porcelain', 'fiberglass'].includes(art.def.material) && owned.includes('soup');
      return canBreak ? Math.max(0, max - art.damage) * art.def.value : 0;
    }
    if (heavy) return (1 - art.damage) * art.def.value;
    const glazed = art.glass && !art.glass.broken;
    let frac = 0;
    for (const id of owned) {
      if (glazed && id !== 'crowbar') continue;   // liquids only clean the glass
      const cap = CAPS[id] ?? 0;
      frac += Math.max(0, cap - (art.byWeapon[id] || 0));
    }
    return Math.min(1 - art.damage, frac) * art.def.value;
  }

  tipText() {
    const top = this.museum.arts.map(a => [a, this.potential(a)]).filter(([, v]) => v > 1e6)
      .sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (!top.length) return 'Time to find a heavier tool.';
    return 'Biggest money still on the walls for your tools: ' +
      top.map(([a, v]) => `<b>${esc(a.def.title)}</b> (${esc(a.def.artist)}, up to ${fmtMoney(v)})`).join(', ') + '.';
  }

  nextCase() {
    return WEAPONS.map((w, i) => ({ w, i })).filter(({ w, i }) => w.opensAt && !this.owned.has(i))
      .sort((a, b) => a.w.opensAt - b.w.opensAt)[0];
  }

  buildWeaponBar() {
    const bar = $('weapons');
    bar.innerHTML = '';
    WEAPONS.forEach((w, i) => {
      const el = document.createElement('button');
      el.className = 'slot';
      el.innerHTML = `<span class="k">${i + 1}</span><span class="n">${esc(w.name.replace('Tube of ', '').replace('Can of ', '').replace(' Marker', ''))}</span><span class="lock"></span>`;
      el.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); this.trySelect(i); });
      bar.appendChild(el);
    });
  }

  refreshWeaponBar() {
    [...$('weapons').children].forEach((el, i) => {
      const w = WEAPONS[i], have = this.owned.has(i);
      el.classList.toggle('locked', !have);
      el.classList.toggle('missing', !have && !(w.opensAt && this.bill < w.opensAt));
      el.classList.toggle('on', !!this.weapons && this.weapons.current === i);
      el.querySelector('.lock').textContent = have ? '' : w.opensAt && this.bill < w.opensAt ? fmtMoney(w.opensAt) : 'find it';
    });
  }

  trySelect(i) {
    if (this.state !== 'play' || i < 0 || i >= WEAPONS.length) return;
    if (!this.owned.has(i)) {
      const w = WEAPONS[i];
      const lock = w.opensAt && this.bill < w.opensAt ? ` Its case opens when your bill reaches ${fmtMoney(w.opensAt)}.` : '';
      this.toast(`You haven't found the <b>${esc(w.name)}</b> yet. Look in the ${esc(w.where.replace(/^./, c => c.toLowerCase()))}.${lock}`, 'note', 5000);
      return;
    }
    if (this.weapons.current !== i) { this.weapons.select(i); this.weaponCard(i); }
    this.refreshWeaponBar();
  }

  cycle(dir) {
    if (this.state !== 'play') return;
    const have = [...this.owned].sort((a, b) => a - b);
    const k = have.indexOf(this.weapons.current);
    this.trySelect(have[(k + dir + have.length) % have.length]);
  }

  // ---------------------------------------------------------------- per frame
  update(dt, look) {
    if (this.state === 'play') {
      this.docentT -= dt;
      // stuck? have the docent point at the expensive stuff
      this.stallT = (this.stallT || 0) + dt;
      if (this.stallT > 25 && this.mode === 'timed' && this.nextCase()) {
        this.stallT = 0;
        this.docentSay('Psst. If you insist on doing this, the expensive ones are over there. ' + this.tipText().replace(/<[^>]+>/g, ''));
      }
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
    this.updateGoal();
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

  // progress toward the next time-locked case, under the bill
  updateGoal() {
    const el = $('goal');
    const nc = this.nextCase();
    if (!nc || this.mode === 'free') { el.style.display = 'none'; return; }
    el.style.display = '';
    const { w } = nc;
    if (this.bill >= w.opensAt) {
      el.className = 'open';
      el.innerHTML = `<span>${esc(w.name)} case is OPEN</span><small>${esc(w.where.replace('in a locked case', 'go get it'))}</small>`;
      return;
    }
    const f = Math.min(1, this.shownBill / w.opensAt);
    el.className = '';
    el.innerHTML = `<span>Next: ${esc(w.name)} case</span><i><b style="width:${(f * 100).toFixed(1)}%"></b></i><small>${fmtMoney(this.shownBill)} of ${fmtMoney(w.opensAt)}</small>`;
  }

  // ---------------------------------------------------------------- inspect card
  openInspect(art) {
    const d = art.def;
    const dims = d.kind === 'painting' ? `${Math.round(d.h * 100)} × ${Math.round(d.w * 100)} cm` : `about ${Math.round(d.h * 100)} cm tall`;
    $('inspect-body').innerHTML = `
      <div class="ins-thumbs">${d.photo
        ? `<figure class="ins-fig"><img src="${d.photo.img}" alt="Photo of ${esc(d.title)}"><figcaption>The real thing</figcaption></figure>${thumbHTML(art, 'ins-fig', 'In the game')}`
        : thumbHTML(art, 'ins-fig')}</div>
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
      ${d.photo ? `<p class="ins-note">Photo: <a href="${d.photo.page}" target="_blank" rel="noopener">${esc(d.photo.credit)}</a>, via Wikimedia Commons.</p>` : ''}
      ${d.model && d.model.credit ? `<p class="ins-note">3D model: ${esc(d.model.credit)}</p>` : ''}
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
      <div class="inv-kicker">INSURANCE ADJUSTER'S REPORT · THE NVDA MUSEUM OF ART</div>
      <div class="inv-total">${fmtFull(total)}</div>
      <div class="inv-rank">${esc(rank[1])}</div>
      <div class="inv-sub">${esc(rank[2])}${newBest ? ' <b class="best">New personal best!</b>' : this.best && this.mode === 'timed' ? ` <span class="muted">Best: ${fmtMoney(this.best)}</span>` : ''}</div>
      <div id="share-box" class="share-box"></div>
      <div id="lb-box" class="lb-box"></div>
      ${total > 0 ? `<p class="inv-compare">That would pay about <b>${teacher.toLocaleString('en-US')}</b> public-school art teachers for a year: roughly $110,000 each once pension and health benefits are counted, not just salary. Or about <b>${gpus.toLocaleString('en-US')}</b> data-center GPUs at around $30,000 apiece, which the founder insists would "accelerate humanity" more.</p>` : ''}
      ${rows ? `<table class="inv-table"><thead><tr><th></th><th>Work</th><th>Artist from · movement</th><th>Damage</th><th>Main tool</th><th>Bill</th></tr></thead><tbody>${rows}</tbody></table>`
        : '<p>You didn\'t damage anything. The docents would like to adopt you.</p>'}
      ${this.glassFees ? `<p class="muted">Includes ${fmtFull(this.glassFees)} for glass cleaning and replacement.</p>` : ''}
      ${lessons ? `<h3>Things you can tell people at dinner</h3><ul>${lessons}</ul>` : ''}
      ${untouched.length ? `<p class="muted">Untouched: ${untouched.map(a => esc(a.def.title)).join(', ')}.</p>` : ''}`;
    $('summary').classList.add('open');
    this.result = {
      total, mode: this.mode, rankTitle: rank[1], destroyed: this.destroyedCount,
      items: hit.map(a => {
        const t = thumbs(a);
        return {
          title: a.def.title, cost: a.cost + a.extraCost, destroyed: a.destroyed,
          thumb: t.after || t.before, stamp: a.destroyed ? (a.fate || 'DESTROYED') : a.toppled ? 'TOPPLED' : '',
        };
      }),
    };
    this.buildShare(this.result);
    this.buildLeaderboard(this.result);
  }

  // ---------------------------------------------------------------- sharing
  async buildShare(r) {
    const box = $('share-box');
    const url = gameUrl(), text = shareText(r), links = shareLinks(text, url);
    box.innerHTML = `
      <div class="share-card"><div class="share-wait">Printing your insurance claim…</div></div>
      <div class="share-side">
        <h3>Brag about it</h3>
        <p class="share-text">${esc(text)}</p>
        <div class="share-btns">
          ${navigator.share ? '<button class="sbtn main" id="sh-native">Share…</button>' : ''}
          <a class="sbtn" target="_blank" rel="noopener" href="${links.x}">X</a>
          <a class="sbtn" target="_blank" rel="noopener" href="${links.bsky}">Bluesky</a>
          <a class="sbtn" target="_blank" rel="noopener" href="${links.reddit}">Reddit</a>
          <a class="sbtn" target="_blank" rel="noopener" href="${links.hn}">Hacker News</a>
          <a class="sbtn" target="_blank" rel="noopener" href="${links.facebook}">Facebook</a>
          <button class="sbtn" id="sh-copy">Copy text</button>
          <a class="sbtn" id="sh-dl" download="art-blaster-bill.png">Download image</a>
        </div>
      </div>`;
    $('sh-copy').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(text + ' ' + url); $('sh-copy').textContent = 'Copied!'; }
      catch (e) { $('sh-copy').textContent = 'Copy failed'; }
    });
    const canvas = await makeCard(r);
    const png = canvas.toDataURL('image/png');
    box.querySelector('.share-card').innerHTML = `<img src="${png}" alt="Your Art Blaster insurance claim">`;
    $('sh-dl').href = png;
    const native = $('sh-native');
    if (native) native.addEventListener('click', async () => {
      try {
        const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
        const file = new File([blob], 'art-blaster-bill.png', { type: 'image/png' });
        const data = { title: 'Art Blaster!', text, url };
        if (navigator.canShare && navigator.canShare({ files: [file] })) data.files = [file];
        await navigator.share(data);
      } catch (e) { /* the player cancelled the share sheet */ }
    });
  }

  // ---------------------------------------------------------------- Hall of Infamy
  async buildLeaderboard(r) {
    const box = $('lb-box');
    const canPost = r.mode === 'timed' && r.total > 0;
    box.innerHTML = `
      <h3>Hall of Infamy ${isOnline() ? '' : '<small>(this browser only)</small>'}</h3>
      ${canPost ? `<form id="lb-form" class="lb-form">
          <input id="lb-name" maxlength="18" placeholder="A nickname (no real names!)" value="${esc(savedName())}" autocomplete="off">
          <button class="btn go" type="submit">Post my bill</button>
        </form>` : `<p class="muted">${r.mode === 'timed' ? 'Wreck something first.' : 'Free-roam runs don\'t count. Play the 4-minute spree to get on the board.'}</p>`}
      <div id="lb-status" class="muted"></div>
      <div class="lb-tabs"><button class="on" data-p="all">All time</button><button data-p="week">This week</button></div>
      <table class="lb-table" id="lb-table"><tbody><tr><td class="muted">Loading…</td></tr></tbody></table>`;
    let mine = null;
    const render = (scores) => {
      $('lb-table').innerHTML = scores.length ? `<tbody>${scores.map((s, k) => `
        <tr class="${mine && s.name === mine.name && s.bill === mine.bill ? 'me' : ''}">
          <td class="num">${k + 1}</td><td><b>${esc(s.name)}</b><br><small>${esc(s.rankTitle || '')}</small></td>
          <td><small>${s.topPiece ? 'Worst damage: ' + esc(s.topPiece) : ''}</small></td>
          <td class="num">${fmtFull(s.bill)}</td></tr>`).join('')}</tbody>`
        : '<tbody><tr><td class="muted">No bills yet. Be the first menace.</td></tr></tbody>';
    };
    const load = async (period) => {
      try {
        const res = await getScores(period);
        if (res.unreachable) $('lb-status').textContent = 'The online leaderboard is unreachable right now; showing this browser\'s scores.';
        render(res.scores);
      }
      catch (e) { $('lb-table').innerHTML = `<tbody><tr><td class="muted">${esc(e.message)}</td></tr></tbody>`; }
    };
    box.querySelectorAll('.lb-tabs button').forEach(b => b.addEventListener('click', () => {
      box.querySelectorAll('.lb-tabs button').forEach(x => x.classList.toggle('on', x === b));
      load(b.dataset.p);
    }));
    load('all');
    const form = $('lb-form');
    if (form) form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button');
      btn.disabled = true;
      $('lb-status').textContent = 'Filing your claim…';
      try {
        const name = $('lb-name').value.trim() || 'Anonymous Billionaire';
        const res = await submitScore({
          name, bill: Math.round(r.total), destroyed: r.destroyed, mode: r.mode,
          topPiece: r.items[0] ? r.items[0].title : '', rankTitle: r.rankTitle,
        });
        mine = { name: res.scores.find(s => s.bill === Math.round(r.total))?.name ?? name, bill: Math.round(r.total) };
        $('lb-status').innerHTML = (res.unreachable ? 'Couldn\'t reach the online leaderboard, so your bill was saved in this browser. ' : '') +
          `You're <b>#${res.rank}</b> of ${res.total} ${res.local ? 'in this browser' : 'all-time'}.`;
        form.remove();
        render(res.scores);
      } catch (err) {
        $('lb-status').textContent = err.message;
        btn.disabled = false;
      }
    });
  }
}
