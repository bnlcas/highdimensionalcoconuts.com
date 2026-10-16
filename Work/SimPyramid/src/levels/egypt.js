// Campaign 1: Kemet, the Two Lands.

const ROMAN = ['I', 'II', 'III', 'IV'];

export const EGYPT = {
  id: 'egypt',
  label: 'Kemet',
  theme: 'egypt',
  names: {
    food: 'Grain', drink: 'Beer', stone: 'Stone', site: 'At the ramp', casing: 'Tura limestone', tools: 'Copper',
    treasure: 'Gold', wisdom: 'Wisdom', wisdomBy: 'The House of Life', workers: 'Workers', levy: 'Corvée levy',
    tribute: 'Harvest tax from the nomes', granary: 'Granary', structure: 'pyramid', maat: "Ma'at", block: 'block',
    granite: 'Granite', gods: 'The Gods', capstone: 'Raise the gilded pyramidion',
  },
  icons: { food: '🌾', drink: '🍺', stone: '🪨', site: '🧱', casing: '◽', tools: '⛏', treasure: '🪙', wisdom: '📜', granite: '⬛' },
  jobs: {
    farm: { name: 'Farmers', desc: 'Grow emmer and barley in Peret, harvest in Shemu. While the Nile floods the fields (Akhet) they are free to haul stone.' },
    brew: { name: 'Bakers & Brewers', desc: 'Turn grain into beer. Pyramid crews were paid in bread and beer: roughly ten loaves and a jug or two a day.' },
    quarry: { name: 'Quarrymen', desc: 'Cut limestone blocks with copper chisels. They blunt the copper fast.' },
    haul: { name: 'Haulers', desc: 'Drag blocks on wooden sledges up the ramp. The higher the pyramid, the longer the ramp.' },
    mason: { name: 'Masons', desc: 'Set core blocks, then fit the fine Tura limestone casing.' },
    boat: { name: 'Boatmen', desc: 'Ship fine casing stone from the Tura quarries across the Nile. Boats reach the plateau easily only during the flood.' },
    priest: { name: 'Priests & Scribes', desc: 'Keep the gods fed (favor decays slower) and study in the House of Life (wisdom for new techniques).' },
  },
  buildings: {
    village: { name: "Workers' Village", desc: 'Housing. Crowded workers are unhappy, and nobody moves in without a bed.' },
    granary: { name: 'Granaries', desc: 'Grain storage. From level 3 they are raised above the reach of a wild flood.' },
    bakery: { name: 'Bakeries & Breweries', desc: 'Room for more bakers and brewers.' },
    quarry: { name: 'Quarry', desc: 'Room for more quarrymen.' },
    harbor: { name: 'Harbor', desc: 'Room for more boatmen. From level 3, boats keep running after the flood recedes.' },
    temple: { name: 'Temple & House of Life', desc: 'Room for more priests and scribes, who also study faster.' },
  },
  seasons: [
    { id: 'akhet', name: 'Akhet', sub: 'Inundation', days: 120, farm: 'idle', water: true, tribute: true, boat: 1, note: 'The fields are underwater. Idle farmers can haul stone, and boats can reach the plateau.' },
    { id: 'peret', name: 'Peret', sub: 'Growing', days: 120, farm: 'grow', boat: 0.25, note: 'The waters recede. Get the farmers back into the fields!' },
    { id: 'shemu', name: 'Shemu', sub: 'Harvest', days: 120, farm: 'harvest', boat: 0.25, note: 'Bring the harvest in before it spoils.' },
    { id: 'epag', name: 'The Days upon the Year', sub: 'festival', days: 5, farm: 'festival', boat: 0.25, festivalNote: 'The five epagomenal days: the birthdays of Osiris, Horus, Set and Isis (and Nephthys, who never asks for anything). Offerings to them count double.' },
  ],
  water: {
    gauge: 'Nilometer',
    fmt: (w) => `${(8 + 8 * w).toFixed(1)} cubits`,
    verdict: (w) => {
      const c = 8 + 8 * w;
      if (c < 12.5) return 'Twelve cubits: famine.';
      if (c < 13.5) return 'Thirteen cubits: hunger.';
      if (c < 14.5) return 'Fourteen cubits: cheerfulness.';
      if (c < 15.5) return 'Fifteen cubits: security.';
      if (c < 17.6) return 'Sixteen cubits: delight! (The scale is Pliny the Elder\'s, <i>Natural History</i> 5.58.)';
      return 'Too much! The flood is wild.';
    },
    damage: 'The flood breaks the dikes and swamps the granaries:',
    ideal: 1,
  },
  storm: { text: "<b>Sandstorm!</b> Set's khamsin wind blows in from the desert. Hauling and building grind to a halt.", end: 'The khamsin dies down.' },
  strikeLine: '<b>Strike!</b> The crews sit down by the ramp: "We are hungry!" (The first recorded strike in history, at Deir el-Medina around 1157 BC, began exactly like this, when rations were weeks late.)',
  chaosLine: "Ma'at has collapsed. The nomarchs go their own way. Historians will call this an Intermediate Period.",
  rampagePaid: 'Sekhmet laps up the red beer, takes it for blood, gets gloriously drunk and falls asleep. She wakes up as gentle Hathor. (That is the myth, more or less.)',
  rampageLost: 'Sekhmet tears through the camp.',
  rates: { quarry: 1, haul: 1, mason: 1, boat: 1, tools: 1 },
  patrons: [
    { id: 'ra', name: 'Ra', glyph: '𓇳', slot: 'crop', title: 'The sun', desc: 'Sun god. Happy Ra means a better harvest.', cost: { treasure: 2 }, decay: 0.06,
      wrath: { type: 'rampage', title: 'The Eye of Ra', text: 'Ra, slighted, sends his Eye as Sekhmet the lioness. She is loose in the workers\' camp! In the myth, Ra stopped her by flooding the fields with beer dyed red with ochre.', payLabel: 'Pour red beer', refuseLabel: 'Run' } },
    { id: 'hapi', name: 'Hapi', glyph: '𓈗', slot: 'water', title: 'The flood', desc: 'God of the inundation. Happy Hapi, gentle and generous floods. Angry Hapi, famine or deluge.', cost: { food: 700 }, decay: 0.07,
      wrath: { type: 'drought', title: 'Hapi sulks', text: 'Priests at the First Cataract report the river is low. Next year\'s flood will be poor.' } },
    { id: 'osiris', name: 'Osiris', glyph: '𓊽', slot: 'morale', title: 'Afterlife & grain', desc: 'Lord of the dead and of sprouting grain. Keeps spirits high and families growing.', cost: { food: 500 }, decay: 0.06, festival: true,
      wrath: { type: 'gloom', title: 'Osiris turns away', text: 'Workers whisper that the king will not rise to the stars, and that their own afterlives are in doubt. Morale sags.' } },
    { id: 'isis', name: 'Isis', glyph: '𓊨', slot: 'health', title: 'Magic & healing', desc: 'Great of magic, protector of the sick. Fewer deaths from accidents and disease.', cost: { drink: 400 }, decay: 0.06, festival: true,
      wrath: { type: 'plague', title: 'Sickness in the camp', text: 'A fever spreads through the crowded barracks.' } },
    { id: 'horus', name: 'Horus', glyph: '𓅃', slot: 'authority', title: 'Kingship', desc: 'The falcon. Pharaoh is the living Horus: his favor brings in taxes and conscripts. He and Set do not get along.', cost: { treasure: 2 }, decay: 0.05, festival: true, rival: 'set',
      wrath: { type: 'revolt', title: 'The nomarchs grow bold', text: 'Provincial governors keep the harvest tax for themselves. Next tribute will be thin.' } },
    { id: 'set', name: 'Set', glyph: '𓃩', slot: 'chaos', title: 'Desert & storms', desc: 'Lord of the red desert, storms and chaos. Keep him sweet and the sandstorms stay away. He likes beer, and (in one myth) lettuce. He and Horus do not get along.', cost: { drink: 450 }, decay: 0.1, festival: true, rival: 'horus', startFavor: 45,
      wrath: { type: 'storm', title: "Set's fury", text: 'A wall of red sand rolls in from the western desert.' } },
    { id: 'thoth', name: 'Thoth', glyph: '𓅞', slot: 'wisdom', title: 'Writing & wisdom', desc: 'Ibis-headed scribe of the gods. Faster research.', cost: { food: 350 }, decay: 0.06,
      wrath: { type: 'muddle', title: "Thoth's ink runs dry", text: 'The scribes misplace half their notes.' } },
    { id: 'ptah', name: 'Ptah', glyph: '𓌀', slot: 'craft', title: 'Craftsmen', desc: 'Creator god of Memphis and patron of craftsmen. Faster quarrying and masonry.', cost: { tools: 40 }, decay: 0.06,
      wrath: { type: 'slump', title: "Ptah's displeasure", text: 'Chisels slip and blocks crack. Craftsmanship slumps.' } },
    { id: 'hathor', name: 'Hathor', glyph: '𓄀', slot: 'joy', title: 'Joy, music & beer', desc: 'Lady of drunkenness, music and love. Beer cheers people more and brews better.', cost: { drink: 450 }, decay: 0.06,
      wrath: { type: 'sour', title: 'The beer goes sour', text: 'Hathor is unamused. Most of the beer in the jars has turned.' } },
    { id: 'sobek', name: 'Sobek', glyph: '𓆋', slot: 'river', title: 'The crocodile', desc: 'Crocodile god of the Nile. Safer, faster boats.', cost: { food: 450 }, decay: 0.06,
      wrath: { type: 'beasts', title: 'Crocodiles!', text: "Sobek's children take boatmen and farmers along the riverbank." } },
    { id: 'anubis', name: 'Anubis', glyph: '𓃣', slot: 'tomb', title: 'Tombs & embalming', desc: 'Jackal guardian of the necropolis. Keeps the gold safe.', cost: { food: 400 }, decay: 0.05,
      wrath: { type: 'theft', title: 'Tomb robbers!', text: 'Thieves break into the treasury. Somehow people were robbing tombs before they were even finished.' } },
  ],
  techs: [
    { id: 'wetsand', name: 'Wet the Sand', cost: 45, effect: { haul: 0.5 }, desc: 'Pour water in front of the sledge. A tomb painting of Djehutihotep shows exactly this, and a 2014 University of Amsterdam study found the right amount of water halves the pulling force.', done: 'Haulers +50%.' },
    { id: 'bedja', name: 'Bedja Bread Molds', cost: 40, effect: { ration: 0.12 }, desc: 'Conical clay molds for baking bread in bulk. Thousands of fragments were found at the Giza workers\' bakeries.', done: 'Rations stretch 12% further.' },
    { id: 'sothis', name: 'The Rising of Sothis', cost: 55, effect: { forecast: 1 }, desc: 'When Sirius (Sopdet) first rises before dawn, the flood is near. Your astronomers can now forecast next year\'s flood.', done: 'Next year\'s flood is forecast.' },
    { id: 'saws', name: 'Copper Saws & Sand', cost: 70, effect: { quarry: 0.3 }, desc: 'Copper saws do the cutting with quartz sand as the abrasive. Saw marks survive on Old Kingdom granite.', done: 'Quarrying +30%.' },
    { id: 'basins', name: 'Basin Irrigation', cost: 60, effect: { irrigation: 0.1, land: 0.25, floodGuard: 0.4 }, desc: 'Earthen dikes divide the floodplain into basins that hold the water and soak the fields.', done: 'More farmland, better yields, safer floods.' },
    { id: 'physicians', name: 'Physicians of the Pyramid', cost: 70, effect: { medicine: 0.5 }, desc: 'Skeletons from the workers\' cemetery show set fractures, healed injuries, even surgery. Someone was looking after the crews.', done: 'Deaths halved.' },
    { id: 'phyles', name: 'Phyles & Gangs', cost: 90, effect: { prod: 0.1, morale: 5 }, desc: 'Crews organized into gangs, phyles and divisions with names like "Friends of Khufu". Graffiti shows they competed with each other.', done: 'All work +10%, morale up.' },
    { id: 'canal', name: 'Canal to the Plateau', cost: 85, effect: { boatAll: 0.6 }, desc: 'A harbor basin and canal at the foot of the plateau. The Diary of Merer records boats bringing Tura limestone to Giza.', done: 'Boats run all year.' },
    { id: 'machines', name: 'Machines of Short Timbers', cost: 110, effect: { mason: 0.25 }, desc: 'Herodotus says the blocks were raised with "machines made of short timbers". Nobody agrees on what he meant. Levers, probably.', done: 'Masons +25%.' },
    { id: 'north', name: 'Align to True North', cost: 120, effect: { glory: 300 }, desc: 'The Great Pyramid\'s sides line up with the cardinal directions to within about a fifteenth of a degree. Nobody is sure how they did it.', done: '+300 glory.' },
  ],
  decrees: {
    feast: { name: 'Beautiful Feast', desc: 'Bread, beer, music. Big morale boost and pleases Hathor. Ends a strike.', logText: 'A Beautiful Feast! Harps, sistrums and a great deal of beer.' },
    levy: { name: 'Corvée Levy', desc: 'Summon laborers from the nomes for the rest of the season. Annoys Horus, and during farming seasons it cuts next year\'s tax.', logText: 'Pharaoh summons the corvée from the nomes.' },
    rations: { name: 'Extra Rations', desc: 'More bread, onions and beef for 90 days. Morale up, grain down.', logText: 'Extra rations! The crews will remember this.' },
    tax: { name: 'Squeeze the Nomes', desc: 'An emergency grain tax. Morale drops for months.' },
    allgods: { name: 'Offerings to All the Gods', desc: '+10 favor with every god.', logText: 'Offerings are laid before every shrine in the land.' },
  },
  expeditions: [
    { id: 'sinai', name: 'Copper from Sinai', desc: '200 workers go to the turquoise and copper mines of Wadi Maghara for 70 days.', cost: { food: 1500 }, workers: 200, days: 70, reward: { tools: 500 }, risk: 'chaos', logText: 'An expedition sets out for the copper mines of Sinai.', doneText: 'The Sinai expedition returns with copper. Their rock inscription at Wadi Maghara will brag about it for 4,500 years.', failText: 'Raiders ambush the Sinai expedition (Set is not pleased). They come home empty-handed.' },
    { id: 'nubia', name: 'Gold from Nubia', desc: 'Trade grain and beer for gold up the Nile, past the cataracts. 100 days.', cost: { food: 2500, drink: 1200 }, workers: 150, days: 100, reward: { treasure: 18 }, risk: 'authority', logText: 'A trading flotilla heads south toward Nubia.', doneText: 'The Nubian flotilla returns with gold, ebony and a giraffe nobody asked for.', failText: 'The Nubian chiefs are unimpressed by a pharaoh with so little authority. The flotilla returns empty.' },
  ],
  boons: [
    { type: 'windfall', title: 'Gold in the Eastern Desert', text: 'Prospectors return from the wadis with gold.', amount: 6 },
    { type: 'bumper', title: 'A fat year', text: 'The emmer stands tall. Pharaoh\'s dreams about seven fat cows are, for once, correct.' },
    { type: 'inspiration', title: 'A dream from Thoth', text: 'A scribe wakes with a brilliant idea and a strong urge to write it down.' },
    { type: 'migrants', title: 'Families arrive', text: 'Word spreads that the pyramid crews eat beef. Families come up from the Delta.' },
    { type: 'calm', title: 'A good omen', text: 'A falcon lands on the scaffold. Everyone agrees this is excellent.' },
    { type: 'tools', title: 'A copper caravan', text: 'Traders arrive with copper ingots.' },
  ],
  calendarFmt: (s, cal, L) => {
    if (cal.season.farm === 'festival') return `Year ${cal.year} of ${L.rulerShort} · Day ${cal.dayInSeason + 1} upon the year`;
    return `Year ${cal.year} of ${L.rulerShort} · ${cal.season.name} ${ROMAN[Math.floor(cal.dayInSeason / 30)]}, day ${(cal.dayInSeason % 30) + 1}`;
  },
};

const steps = (bases, h, batter) => bases.map((a, i) => ({ z0: i * h, z1: (i + 1) * h, a0: a, a1: a - batter }));

export const EGYPT_LEVELS = [
  {
    id: 'djoser',
    civ: EGYPT,
    campaign: 'egypt',
    title: 'The Step Pyramid',
    place: 'Saqqara',
    date: 'c. 2670 BC',
    ruler: 'Pharaoh Djoser',
    rulerShort: 'Djoser',
    advisor: { name: 'Imhotep', role: 'Chancellor and architect (the ideas guy)', glyph: '𓏞' },
    blurb: 'Imhotep has an idea: what if a tomb, but stacked?',
    intro: `<p>Third Dynasty. Pharaoh Djoser needs a tomb. Kings so far have been buried under <i>mastabas</i>, flat mud-brick benches. His chancellor <b>Imhotep</b>, the first architect in history whose name we know, has an idea: build it in stone, and stack it.</p>
<p>Start with four steps. Feed your workers, keep the gods happy and learn the river's rhythm: in <b>Akhet</b> the Nile floods the fields and farmers are free to build. In <b>Peret</b> and <b>Shemu</b> they have to farm, or everyone starves.</p>`,
    history: [
      'The Step Pyramid of Djoser at Saqqara (about 62 m) is usually called the oldest large cut-stone building in the world.',
      'It grew in stages: a square mastaba, enlarged twice, then a four-step pyramid, then a six-step one over a wider base.',
      "Imhotep's name and titles are carved on the base of a statue of Djoser. Two thousand years later Egyptians worshipped him as a god of medicine, and the Greeks identified him with Asclepius.",
    ],
    structure: {
      kind: 'step', sides: 4, density: 0.85, casingFrac: 0.05, capstoneCost: 8, rampK: 1.4,
      capstoneName: 'Consecrate the tomb', defaultVariant: 'four',
      variants: {
        four: { label: '4 steps', tiers: steps([44, 37, 30, 23], 10.5, 2.5) },
        six: { label: '6 steps', tiers: steps([57, 50, 43, 36, 29, 22], 10.4, 2.5) },
      },
    },
    reignYears: 19,
    start: { pop: 2500, food: 14000, drink: 3000, tools: 300, treasure: 6, jobs: { farm: 950, brew: 200, quarry: 420, haul: 380, mason: 300, boat: 90, priest: 60 }, buildings: { village: 2, granary: 2, bakery: 1, quarry: 1, harbor: 1, temple: 1 } },
    landCap: 1800,
    tribute: { food: 9000, treasure: 4, tools: 60 },
    glory: 1,
    openingLine: 'Djoser takes the throne of the Two Lands. Imhotep unrolls a papyrus covered in squares.',
    winLine: 'The Step Pyramid stands over Saqqara: the first monumental stone building in history. Imhotep is already sketching something smoother.',
    reignLine: 'Djoser has gone to the West. The pyramid is unfinished, and his successors quietly reuse the stone.',
    hooks: {
      onDay(s, api) {
        if (s.build.variant === 'four' && !s.flags.imhotepAsked && s.build.core / s.build.total > 0.55) {
          s.flags.imhotepAsked = true;
          s.pending.push({ id: 'imhotep', title: 'Imhotep has an idea', glyph: '𓏞',
            text: 'Imhotep bursts in with a fresh papyrus. "Majesty. Four steps is good. But what if... <b>six</b>? We widen the base, stack two more, and the tomb will be seen from Memphis." (This really happened: the Step Pyramid was enlarged mid-construction.)',
            choices: [{ id: 'six', label: 'Six steps! (more blocks, +400 glory)' }, { id: 'four', label: 'Four is plenty, Imhotep' }] });
        }
      },
      onChoice(s, api, ev, choice) {
        if (ev.id !== 'imhotep') return;
        if (choice === 'six') {
          s.build.variant = 'six';
          s.flags.glory = (s.flags.glory || 0) + 400;
          s.flags.extraYears = 2;
          api.log(s, 'Six steps it is. The base widens. Djoser is delighted, and the gods grant him two more years.', 'big');
        } else api.log(s, 'Imhotep rolls up the papyrus, visibly sulking.');
      },
    },
  },
  {
    id: 'bent',
    civ: EGYPT,
    campaign: 'egypt',
    title: 'The Bent Pyramid',
    place: 'Dahshur',
    date: 'c. 2600 BC',
    ruler: 'Pharaoh Sneferu',
    rulerShort: 'Sneferu',
    advisor: { name: 'Nefermaat', role: 'Vizier', glyph: '𓀀' },
    blurb: 'A smooth-sided pyramid at a daring 54°. What could go wrong?',
    intro: `<p>Fourth Dynasty. <b>Sneferu</b> wants what nobody has built yet: a true pyramid with smooth sides, rising at a bold <b>54°</b>. Steps are so last dynasty.</p>
<p>Fine casing stone comes by boat from the Tura quarries, and boats only reach the plateau easily during the flood. Plan for it. And watch the angle: steep is glorious, but stone has opinions about steep.</p>`,
    history: [
      'Sneferu built at least three pyramids (Meidum, the Bent Pyramid, the Red Pyramid) and moved more stone than any other pharaoh.',
      'The Bent Pyramid starts at about 54° and changes to about 43° partway up, probably because the structure showed signs of instability during construction.',
      'More of its original polished casing survives than on any other Egyptian pyramid.',
      'Sneferu then built the Red Pyramid at about 43° from the ground up: the first successful smooth-sided pyramid.',
      'Kurt Mendelssohn argued in 1974 that the pyramid at Meidum collapsed during construction, which would explain the nervousness at Dahshur. Not everyone agrees.',
    ],
    structure: {
      kind: 'smooth', sides: 4, density: 0.9, casingFrac: 0.06, capstoneCost: 20, rampK: 1.2, defaultVariant: 'steep',
      variants: {
        steep: { label: '54° all the way', tiers: [{ z0: 0, z1: 129.4, a0: 94, a1: 0 }] },
        bent: { label: 'Bent: 54° then 43°', tiers: [{ z0: 0, z1: 47, a0: 94, a1: 59.8 }, { z0: 47, z1: 102.8, a0: 59.8, a1: 0 }] },
      },
    },
    reignYears: 24,
    start: { pop: 5000, food: 26000, drink: 5000, tools: 500, treasure: 12, jobs: { farm: 1700, brew: 400, quarry: 900, haul: 800, mason: 700, boat: 250, priest: 120 }, buildings: { village: 3, granary: 2, bakery: 2, quarry: 2, harbor: 2, temple: 1 } },
    landCap: 3500,
    tribute: { food: 18000, treasure: 6, tools: 120 },
    glory: 1.3,
    openingLine: 'Sneferu, founder of the Fourth Dynasty, looks at the Step Pyramid and says: "Smoother."',
    winLine: 'The pyramid gleams over Dahshur. Sneferu, never one to stop, starts planning a red one.',
    reignLine: 'Sneferu has gone to the West. His son Khufu inherits an unfinished pyramid and a lot of opinions.',
    hooks: {
      onDay(s, api) {
        if (s.build.variant === 'steep' && !s.flags.bentAsked && s.build.height > 40) {
          s.flags.bentAsked = true;
          s.pending.push({ id: 'bend', title: 'Cracks in the chambers', glyph: '𓀀',
            text: 'Nefermaat reports that the inner chambers are cracking and the cedar beams are groaning. At 54° the weight is enormous. Meidum, they whisper, came down this way.<br><br>Lower the angle to 43° for the rest of the climb, or hold your nerve?',
            choices: [{ id: 'bend', label: 'Bend it to 43° (safe, fewer blocks)' }, { id: 'hold', label: 'Hold 54° (+900 glory, risk of collapse)' }] });
        }
        if (s.flags.steep && !s.build.capstone && s.build.height > 45) {
          const risk = 0.0016 * (1.45 - api.slotMult(s, 'craft', 0.85, 1.15));
          if (api.rand(s) < risk) {
            const loss = s.build.total * 0.04;
            s.build.core = Math.max(api.volumeBelow(api.geometry(s), 30) / api.geometry(s).volume * s.build.total, s.build.core - loss);
            s.stats.collapses++;
            const n = api.kill(s, (s.jobs.mason + s.jobs.haul) * 0.02, 'collapse');
            api.log(s, `<b>Collapse!</b> A slab of the steep face slides away. ${n} workers lost along with ${api.fmt(loss)} blocks of work.`, 'bad');
            s.lastEvent = { title: 'Collapse!', text: 'Part of the steep face has slid away.', kind: 'bad', day: s.day };
          }
        }
      },
      onChoice(s, api, ev, choice) {
        if (ev.id !== 'bend') return;
        if (choice === 'bend') {
          s.build.variant = 'bent';
          api.log(s, 'The angle changes to 43°. The pyramid will be bent forever, and tourists 4,600 years later will love it.', 'big');
        } else {
          s.flags.steep = true;
          s.flags.glory = (s.flags.glory || 0) + 900;
          api.log(s, 'Sneferu holds his nerve. 54° it is. Pray to Ptah.', 'warn');
        }
      },
    },
  },
  {
    id: 'khufu',
    civ: EGYPT,
    campaign: 'egypt',
    title: 'The Great Pyramid',
    place: 'Giza',
    date: 'c. 2560 BC',
    ruler: 'Pharaoh Khufu',
    rulerShort: 'Khufu',
    advisor: { name: 'Hemiunu', role: 'Vizier and Overseer of All the King\'s Works', glyph: '𓀀' },
    blurb: '2.3 million blocks. 146 meters. Something in the sky is watching.',
    intro: `<p><b>Khufu</b>, son of Sneferu, wants the biggest pyramid ever built. His vizier <b>Hemiunu</b> has drawn it: 146.6 m tall, about 2.3 million blocks, sides aligned to true north.</p>
<p>About 43 m up, the King's Chamber needs <b>granite from Aswan</b>, 800 km upriver. Send for it early. And keep an eye on the red star in the east. It seems to be getting... closer?</p>`,
    history: [
      'At 146.6 m, the Great Pyramid was the tallest human-made structure in the world for about 3,800 years.',
      'In 2013 Pierre Tallet found the oldest inscribed papyri ever discovered at Wadi al-Jarf on the Red Sea: the Diary of Merer, a logbook by an inspector whose boat crew hauled Tura limestone to Giza for Khufu.',
      'The King\'s Chamber is lined with Aswan granite. Its roof beams are estimated at 25 to 80 tonnes each.',
      "Mark Lehner's excavations found the workers' town south of the plateau, with bakeries, breweries and huge numbers of cattle bones. Zahi Hawass excavated the workers' cemetery: honored burials, not slaves.",
      'Herodotus, writing about 2,000 years later, said 100,000 men worked in three-month shifts for 20 years. Modern estimates are more like 20,000 to 30,000 at a time.',
      'The ancient Egyptians called Mars "Horus the Red" (Ḥr Dšr).',
    ],
    structure: {
      kind: 'smooth', sides: 4, density: 0.89, casingFrac: 0.062, capstoneCost: 40, rampK: 1, defaultVariant: 'great',
      variants: { great: { label: '51.8°', tiers: [{ z0: 0, z1: 146.6, a0: 115.2, a1: 0 }] } },
      milestones: [{ z: 43, need: 'granite', text: 'Halted at the King\'s Chamber: it needs granite from Aswan.' }],
    },
    expeditions: [
      { id: 'granite', name: 'Granite from Aswan', once: true, desc: '300 workers sail 800 km upriver to the First Cataract for the King\'s Chamber granite. 120 days.', cost: { food: 4000, drink: 1500 }, workers: 300, days: 120, reward: { granite: 1 }, risk: 'river', when: (s) => !s.res.granite, logText: 'Barges set out for the granite quarries at Aswan.', doneText: 'The barges are back from Aswan with the King\'s Chamber granite, beams the size of buses. Hemiunu weeps a little.', failText: 'A granite barge sinks at the cataract (Sobek is displeased). The expedition must try again.' },
    ],
    reignYears: 27,
    start: { pop: 9000, food: 45000, drink: 9000, tools: 900, treasure: 22, jobs: { farm: 3000, brew: 750, quarry: 1700, haul: 1400, mason: 1300, boat: 450, priest: 220 }, buildings: { village: 5, granary: 3, bakery: 3, quarry: 3, harbor: 3, temple: 2 } },
    landCap: 6500,
    tribute: { food: 30000, treasure: 9, tools: 200 },
    glory: 2,
    martians: true,
    openingLine: 'Khufu is crowned. Hemiunu unveils the plan. The scribes count the blocks and quietly ask for more scribes.',
    winLine: 'The pyramidion catches the first light of dawn. The Great Pyramid is complete... and a red light is coming down from the sky.',
    reignLine: 'Khufu has gone to the West. His son finishes the job, badly, and takes the credit.',
    hooks: {
      onSeason(s, api, cal) {
        if (cal.season.id === 'akhet' && cal.year > 1) {
          const lines = [
            'Inspector Merer spends the day loading Tura limestone into the boats. His crew of forty sails it to Akhet-Khufu.',
            'Merer\'s crew moors at the harbor of Akhet-Khufu. They spend the night there. The stone goes up the ramp in the morning.',
            'Ankhhaf, the king\'s half-brother, inspects the harbor. Merer makes sure his crew looks busy.',
          ];
          api.log(s, `<i>From the diary of Merer:</i> ${lines[(cal.year - 2) % lines.length]}`, 'diary');
        }
      },
      onDay(s, api) {
        if (!s.flags.graniteHint && s.build.height > 28 && !s.res.granite) {
          s.flags.graniteHint = true;
          api.log(s, 'Hemiunu: "Majesty, the King\'s Chamber is coming up at 43 m. Have we sent to Aswan for the granite?"', 'warn');
        }
      },
    },
  },
];
