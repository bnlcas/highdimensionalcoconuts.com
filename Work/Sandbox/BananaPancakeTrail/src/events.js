// Banana Pancake Trail — the event deck.
// Event: { kind, title, icon, text(s,v), vars(s,R) → v, choices: [..] | (s,v) → [..], w, when(s), c:[countries], city:[ids], tags:[any of],
//          bar:[dive|bp|fancy], stay:[..], mode:[..], cd (days before it can repeat), once, ksr (activity keeps you on Khao San) }
// Choice: { t, sub, req(s,v) → '' | reason, go(s,R,v) → outcome text (HTML) }
import * as D from './data.js';

const first = (s) => s.name.split(' ')[0];
const C = (s) => D.COUNTRIES[D.CITIES[s.city].c];
const cityName = (s) => D.CITIES[s.city].name;
const fmt = (n) => `$${Math.round(n).toLocaleString('en-AU')}`;
const p = (s, base) => Math.round(base * C(s).price);
const afford = (n) => (s) => (s.cash >= n(s) ? '' : 'Too poor');
const has = (s, id) => s.inv.some((x) => x.id === id);
const mateIs = (s, id) => s.mates.includes(id);
const anyBooze = (s) => s.inv.find((x) => D.ITEMS[x.id].drink);
const full = (s) => s.inv.length >= D.SLOTS;
const hook = (res, yes, no) => (res.ok ? `${yes} <i>${res.fade}</i>` : no);
const lmOf = (s, id) => D.CITIES[s.city].lm.find((l) => l.id === id);
const nextCity = (s, R) => {
  const opts = D.ROUTES.filter((r) => r.a === s.city || r.b === s.city).map((r) => (r.a === s.city ? r.b : r.a));
  return D.CITIES[(opts.length && R.pick(opts)) || 'pai'].name;
};
const localDrink = (s) => ({ TH: 'lao khao', LA: 'lao-lao', KH: 'sombai rice wine', VN: 'happy water', MY: 'tuak', ID: 'arak', PH: 'lambanog' })[D.CITIES[s.city].c];

export const EVENTS = {
  // =============================================================================================
  // PHONE HOME
  // =============================================================================================
  mum_call: {
    kind: 'phone', title: 'Calling Mum', icon: '📞',
    text: (s) => s.prison
      ? `<p>The prison phone smells like 10,000 sweaty ears. Mum picks up on the first ring. "${first(s)}? Is that you? Why is the number from ${C(s).name}? Why is a man shouting in the background?"</p>`
      : `<p>${s.mum >= 7 ? 'Mum picks up on the first ring. Dad is yelling at the cricket in the background.' : s.mum >= 4 ? 'Mum picks up on the fourth ring. "Oh. It\'s you."' : 'It rings out twice. The third time, Mum answers with a long, slow exhale.'}</p><p>Mum's patience: <b>${'❤️'.repeat(s.mum)}${'🖤'.repeat(10 - s.mum)}</b></p>`,
    choices: (s) => {
      const amt = (base, per) => Math.round(base + per * s.mum);
      const ask = (s2) => { s2.askedMum = true; };
      if (s.prison) return [
        { t: s.flags.toldPrison ? '"Mum, I need money for a lawyer"' : '"Mum... I\'m in prison."', sub: s.mum > 0 ? 'Money for bribes' : 'She is out of patience', go(s, R) {
          ask(s);
          if (s.mum <= 0) return 'Dad takes the phone. "Son, your mother can\'t talk right now. Neither can I." Click.';
          const first0 = !s.flags.toldPrison;
          s.flags.toldPrison = true;
          const n = first0 ? 1000 : amt(150, 50);
          R.cash(n); R.mum(first0 ? -2 : -2); s.stats.mumCash += n;
          return first0 ? `Thirty seconds of silence. Then the sound of your mother remortgaging the house. "We'll fix this. And then I will kill you."` : '"This is the LAST time." It is not the last time.';
        } },
        { t: 'Just tell her you love her', sub: 'Patience +1', go(s, R) { R.mum(1); return 'She cries. You cry. Big Somchai, listening in, also cries.'; } },
      ];
      return [
        { t: 'Just called to say hi', sub: 'Patience +1 (once every 4 days)', go(s, R) {
          if ((s.mumLast.chat || -99) > s.day - 4) return 'She\'s at Pilates. Dad answers, says "she\'s at Pilates", and hangs up.';
          s.mumLast.chat = s.day; R.mum(1);
          return 'She tells you about the neighbours\' renovation for 40 minutes. You don\'t ask for anything. She\'s thrilled. You\'re her favourite again (for now).';
        } },
        { t: '"Mum, I\'m skint"', sub: `~${fmt(amt(100, 35))}, patience −2`, go(s, R) {
          ask(s); const n = amt(100, 35); R.cash(n); R.mum(-2); s.stats.mumCash += n;
          return `She sighs the sigh of a woman who raised you. "Don't spend it on beer." You will spend it on beer.`;
        } },
        { t: '"Me wallet got nicked!"', sub: 'Bigger, but she might twig', go(s, R) {
          ask(s);
          if ((s.mumLast.stolen || -99) > s.day - 12) { R.mum(-3); return 'Dad grabs the phone. "AGAIN? That\'s the third wallet this month. Do you keep it in your hand?" Nothing.'; }
          s.mumLast.stolen = s.day; const n = amt(220, 45); R.cash(n); R.mum(-1); s.stats.mumCash += n;
          return '"Oh you poor thing! Those people are animals!" The money arrives within the hour. You feel a small amount of guilt. It passes.';
        } },
        { t: '"I\'m in hospital"', sub: s.hp < 45 ? 'True, actually' : 'Risky: she follows you on Insta', go(s, R) {
          ask(s);
          if (s.hp < 45) {
            const n = amt(400, 40); R.cash(n); R.mum(-1); s.stats.mumCash += n;
            let t = 'She hears it in your voice. She sends money and asks if you\'re eating vegetables.';
            if (R.chance(0.4) && R.item('vegemite')) t += ' A jar of Vegemite arrives by courier two days later. The courier charged nothing. Mums have ways.';
            return t;
          }
          const sus = s.photos.some((q) => q.day >= s.day - 1) || s.today > 0;
          if (sus && R.chance(0.7)) { R.mum(-3); return '"Hospital? Then who posted a photo of you doing a keg stand an hour ago?" She has screenshots. She has always had screenshots.'; }
          const n = amt(400, 30); R.cash(n); R.mum(-2); s.stats.mumCash += n;
          return 'You do a convincing cough. She sends money "for the doctors". You buy buckets.';
        } },
        { t: '"I\'m volunteering at an orphanage"', sub: s.flags.volunteer ? 'Used it already' : 'Big payout, once', req: (s) => (s.flags.volunteer ? 'She already thinks you\'re a saint' : ''), go(s, R) {
          ask(s); s.flags.volunteer = s.day; R.cash(650); R.mum(-1); s.stats.mumCash += 650;
          return '"Oh, my boy. My beautiful boy." She sends $650 "for the children". She also posts about it on Facebook. This will come back to haunt you.';
        } },
      ];
    },
  },
  mum_ticket: {
    kind: 'phone', title: 'Mum Has Had Enough', icon: '🎫',
    text: (s) => `<p>"${first(s)}. Listen to me. I have bought you a ticket home. It's Qantas, it leaves tomorrow morning, and your father is picking you up from the airport."</p><p>"I am not sending one more cent. Not one."</p>`,
    choices: [
      { t: 'Get on the plane', sub: 'Run ends. Score ×1.1', go(s, R) { R.end('mum'); return 'You pack your bag. You find six bottle caps, a stranger\'s passport photo and a single sock that is not yours.'; } },
      { t: 'Hang up on your own mother', sub: 'No more money for 10 days', go(s) { s.mumBlockedUntil = s.day + 10; s.mum = 3; return 'You hang up. You\'ll call her back next week. She\'ll have calmed down. Probably.'; } },
    ],
  },

  // =============================================================================================
  // BORDERS & PACKAGES
  // =============================================================================================
  busted: {
    kind: 'forced', title: 'Busted', icon: '🚨',
    text: (s, v) => (v.mode === 'flight'
      ? '<p>At the airport, a beagle in a tiny vest walks past, stops, and sits down next to your bag. It looks up at you with profound disappointment.</p><p>Four officers arrive. One of them is already filling out a form.</p>'
      : '<p>At the border, the guard unzips your backpack, pulls out the mysterious package and holds it up like a game show prize.</p><p>"Protein powder?" he asks. You didn\'t say anything yet.</p>'),
    choices: (s, v) => [
      { t: 'Offer an on-the-spot "fine"', sub: fmt(p(s, 900)), req: afford((s) => p(s, 900)), go(s, R) {
        R.cash(-p(s, 900));
        if (R.chance(0.5)) { R.take('package'); return 'He counts it slowly, twice, then pockets the cash AND the package. "Welcome." You are shaking.'; }
        R.prison(v.from);
        return `He takes the money and then arrests you anyway, for attempted bribery. You are going to ${v.from === 'KH' ? 'Prey Sorry Correctional Centre' : 'Bang Kwak Central Prison'}.`;
      } },
      { t: '"It\'s protein powder, mate!"', sub: '10% chance', go(s, R) {
        if (R.chance(0.1)) return 'He licks a finger, dabs it in, and nods knowingly. He has no idea what protein powder tastes like either. You walk on, sweating through your singlet.';
        R.prison(v.from);
        return 'He does not believe you. Nobody has ever believed this. You are going to prison.';
      } },
      { t: 'Cry', sub: '6% chance', go(s, R) {
        if (R.chance(0.06)) { R.take('package'); return 'You cry so hard and so ugly that the guard pats your shoulder, confiscates the package and waves you through out of pure embarrassment.'; }
        R.prison(v.from);
        return 'You cry. They film it. It does well on TikTok. You are going to prison.';
      } },
    ],
  },
  tr_border: {
    kind: 'border', title: 'The Border Shuffle', icon: '🛂',
    text: (s) => `<p>The official says the visa is $35. The sign behind him says $30. There is also a $2 "stamp fee", a $1 "health check" (he looks at you), and a $5 "weekend surcharge". It is a Tuesday.</p>`,
    choices: (s) => [
      ...(mateIs(s, 'nong') || mateIs(s, 'bazza') ? [{ t: `Let ${mateIs(s, 'nong') ? 'Nong' : 'Bazza'} handle it`, sub: 'Free', go: () => (mateIs(s, 'nong') ? 'Nong says something quietly in the official\'s ear. The official laughs, stamps your passport and gives you a mint.' : 'Bazza has been crossing this border since 1989. He says one word. The official sighs and stamps it.') }] : []),
      { t: 'Pay up and smile', sub: fmt(p(s, 8)), go(s, R) { R.cash(-p(s, 8)); return 'You pay. He smiles. Everyone wins except your wallet.'; } },
      { t: 'Argue on principle', sub: 'Could take a while', go(s, R) {
        if (R.chance(0.5)) return 'You argue for 20 minutes. He sighs, waves you through, and charges the next bloke double.';
        R.hp(-6); return 'He puts you "in the queue". The queue is a plastic chair in direct sunlight. Four hours later, you pay anyway.';
      } },
    ],
  },

  // =============================================================================================
  // TRAVEL
  // =============================================================================================
  tr_driver: {
    kind: 'travel', mode: ['bus', 'minivan', 'combo'], title: 'Formula One', icon: '🏎️',
    text: () => '<p>Your driver is chewing something, drinking his fourth M-150, and overtaking a petrol tanker on a blind corner. He is also on the phone.</p>',
    choices: (s) => [
      { t: 'Pray', go(s, R) { if (R.chance(0.3)) { R.hp(-8); return 'He clipped a mirror and a goat. Everyone is fine except the mirror. The goat is furious.'; } return 'You made it. You found religion. You lost it again at the next rest stop.'; } },
      { t: 'Ask him to slow down', go(s, R) { R.hp(-4); return 'He nods, smiles, and speeds up. Your head hit the window on every curve.'; } },
      { t: 'Calm your nerves', sub: 'Crack something from your backpack', req: (s) => (anyBooze(s) ? '' : 'No booze in the bag'), go(s, R) {
        const x = anyBooze(s); const it = D.ITEMS[x.id]; x.n--; if (x.n <= 0) s.inv.splice(s.inv.indexOf(x), 1); R.drink(it.drink);
        return `You cracked the ${it.name.toLowerCase()} and passed it around. By the border the whole bus was singing.`;
      } },
    ],
  },
  tr_vomit: {
    kind: 'travel', mode: ['minivan', 'combo', 'boat'], title: 'The Spew Express', icon: '🤢',
    text: () => '<p>The girl next to you has turned the colour of a Granny Smith apple. She looks at you. She looks at the window. She looks at you again.</p>',
    choices: [
      { t: 'Offer her your plastic bag', go(s, R) { R.charmTemp(1, 3); return 'A true gentleman. She spewed elegantly, thanked you, and told everyone at the next hostel about the nice Aussie with the bag.'; } },
      { t: 'Open the window', go(s, R) { R.hp(-3); return 'Physics. It came straight back in. On you.'; } },
      { t: 'Join her in solidarity', go(s, R) { R.hp(-5); return 'Sympathetic spewing. The whole back row went. A chain reaction they will talk about for years.'; } },
    ],
  },
  tr_chicken: {
    kind: 'travel', mode: ['bus', 'minivan'], title: 'Your Seatmate', icon: '🐔',
    text: () => '<p>Your seatmate is a chicken. Not a nickname. A real chicken, in a basket, owned by the woman behind you, who is asleep.</p>',
    choices: [
      { t: 'Name it Kevin', go(s, R) { R.hp(3); return 'You and Kevin bonded over 9 hours. He laid an egg on your thigh. You\'re basically family now.'; } },
      { t: 'Share your chips', go(s, R) { R.hp(-2); return 'Kevin ate the chips and then pecked your hand for more. Kevin has no boundaries.'; } },
      { t: 'Swap seats', go(s, R) { R.hp(-4); return 'You swapped next to a man eating durian. You miss Kevin.'; } },
    ],
  },
  tr_thief: {
    kind: 'travel', mode: ['night'], title: '3am on the Night Bus', icon: '🫳',
    text: (s) => (has(s, 'padlock') ? '<p>You wake at 3am to a hand in your daypack. It fumbles at your padlock, gives up, and slithers away.</p>' : '<p>You wake at 3am to a hand in your daypack. It belongs to the bloke in the seat behind you, who is pretending to be asleep with his eyes open.</p>'),
    choices: (s) => (has(s, 'padlock')
      ? [{ t: 'Smug nod', go: () => 'Best $4 you ever spent.' }]
      : [
        { t: 'Grab the hand', go(s, R) { const f = R.fight('local', 0.05); return f.won ? 'You grabbed it, twisted it, and he squealed like a possum. The whole bus applauded.' : `You grabbed it. He had a mate. ${R.loseRandom() || 'Nothing'} is gone and so is some of your face.`; } },
        { t: 'Pretend to sleep', go(s, R) { const n = R.cash(-Math.round(s.cash * 0.15)); return `You lay there and let it happen. ${fmt(-n)} gone. You'll buy a padlock. You won't buy a padlock.`; } },
      ]),
  },
  tr_karaoke: {
    kind: 'travel', mode: ['bus'], c: ['VN', 'LA', 'KH'], title: 'Sleeper Bus Karaoke', icon: '🎤',
    text: () => '<p>It\'s 1am. The sleeper bus TV is playing karaoke at volume 100. The driver is singing along into a real microphone.</p>',
    choices: [
      { t: 'Sing along', go(s, R) { R.charmTemp(1, 2); return 'You do not know the words. You make them up. The grandmas on board love you.'; } },
      { t: 'Earplugs in', req: (s) => (has(s, 'earplugs') ? '' : 'No earplugs'), go: () => 'Blissful silence. You slept like a baby (who is being driven at 110 km/h).' },
      { t: 'Suffer', go(s, R) { R.hp(-5); return 'Four hours of power ballads. You know all the words now. You will never forget them.'; } },
    ],
  },
  tr_boat: {
    kind: 'travel', mode: ['boat', 'combo'], title: 'The Ferry Has a Bar', icon: '🚢',
    text: () => '<p>The ferry has a bar. Of course it does. It\'s 9am.</p>',
    choices: [
      { t: 'Get on the beers', sub: fmt(15), go(s, R) { R.cash(-15); R.drink(5); return 'Five tins before lunch. You\'re on holidays, mate.'; } },
      { t: 'Make friends on the top deck', go(s, R) { const m = R.freeMate(); if (m && s.mates.length < D.MAX_MATES && R.chance(0.6)) { R.addMate(m); return `You got chatting to ${D.MATES[m].name} from ${D.MATES[m].from}. You're inseparable now.`; } R.drink(2); return 'You made friends with a family from Ohio. They gave you two beers and a pamphlet about Jesus.'; } },
      { t: 'Sleep in the sun', go(s, R) { R.hp(-5); return 'You woke up the colour of a cooked prawn, with a perfect singlet tan.'; } },
    ],
  },
  tr_jetstar: {
    kind: 'travel', mode: ['flight'], title: 'Budget Airlines', icon: '🧳',
    text: () => '<p>The budget airline charges you for your bag, your seat, your other bag, choosing a seat, not choosing a seat, and breathing on the aircraft.</p>',
    choices: (s) => [
      { t: 'Pay the fees', sub: fmt(p(s, 30)), go(s, R) { R.cash(-p(s, 30)); return 'You paid. You were seated next to the toilet anyway.'; } },
      { t: 'Wear all your clothes onto the plane', go(s, R) { R.hp(-4); return 'Three shirts, two pairs of elephant pants, a hoodie and four singlets. You lost two kilos in sweat. Worth it.'; } },
    ],
  },
  tr_toilet: {
    kind: 'travel', mode: ['bus', 'minivan', 'night'], title: 'The Rest Stop', icon: '🚻',
    text: () => '<p>The rest stop has a "toilet": a hole, a bucket of water and a frog who lives there. Next to it, a woman is selling something delicious-looking from a wok.</p>',
    choices: [
      { t: 'Eat from the wok', go(s, R) { if (R.chance(0.45)) return 'It was amazing. Then it was not. ' + R.belly(); R.hp(5); return 'Best thing you\'ve eaten in weeks. You don\'t know what it was. You never will.'; } },
      { t: 'Hold it for six hours', go(s, R) { R.hp(-5); return 'You held it. You\'re a hero. Your kidneys disagree.'; } },
      { t: 'Buy weird snacks', go(s, R) { R.hp(2); return 'Squid-flavoured chips, seaweed and a Mama noodle cup. Living like a king.'; } },
    ],
  },
  tr_bike: {
    kind: 'travel', mode: ['bike'], title: 'The Honda Win Dies', icon: '🏍️',
    text: () => '<p>Halfway up a mountain pass your Honda Win coughs, splutters and dies. It sounds a lot like you after a bucket.</p>',
    choices: (s) => [
      { t: 'Fix it with a zip-tie', go(s, R) { if (R.chance(0.6)) return 'Zip-tie engineering. She roars back to life. You are basically a mechanic now.'; R.hp(-6); return 'The zip-tie snapped. You pushed it 8 km uphill.'; } },
      { t: 'Pay a passing mechanic', sub: fmt(p(s, 10)), go(s, R) { R.cash(-p(s, 10)); return 'An 11-year-old fixed it in 4 minutes with a hammer. He charged you double for watching.'; } },
    ],
  },
  tr_monk: {
    kind: 'travel', mode: ['bus', 'minivan', 'train', 'boat', 'combo'], c: ['TH', 'LA', 'KH'], title: 'Seated Next to a Monk', icon: '🧘',
    text: () => '<p>A monk sits next to you. You are wearing a singlet that says "I ❤ BUCKETS".</p>',
    choices: [
      { t: 'Cover up and keep a respectful distance', go(s, R) { R.hp(4); s.flags.karma = (s.flags.karma || 0) + 1; return 'He gave you a small nod. You felt calmer than you have in weeks. Good karma.'; } },
      { t: 'Ask him about enlightenment', go(s, R) { R.hp(5); return 'He told you that suffering comes from desire. You thought about buckets. He could tell.'; } },
      { t: 'Offer him a beer', go(s, R) { R.charmTemp(-1, 2); return 'He politely declined. The entire bus judged you. A small child shook her head.'; } },
    ],
  },
  tr_slowboat: {
    kind: 'travel', mode: ['boat'], city: ['lpb', 'cnx', 'kmd', 'gil'], title: 'Slow Boat Party', icon: '🛶',
    text: () => '<p>The slow boat has become a floating party. Someone has a speaker. Someone has a guitar. Someone has a crate of Beerlao and no plan to share.</p>',
    choices: [
      { t: 'Buy the crate off him', sub: fmt(20), go(s, R) { R.cash(-20); R.drink(8); return 'You became the most popular person on the Mekong.'; } },
      { t: 'Play cards with the Germans', go(s, R) { if (R.chance(0.5)) { R.cash(25); return 'You won $25 at a game whose rules nobody explained.'; } R.cash(-25); return 'You lost $25 at a game whose rules kept changing.'; } },
    ],
  },

  // =============================================================================================
  // BARS: LOCAL DIVES
  // =============================================================================================
  dv_connect4: {
    kind: 'bar', bar: ['dive'], c: ['TH', 'KH', 'LA', 'PH'], title: 'Connect Four Champion', icon: '🔴',
    text: () => '<p>A bar hostess called Joy challenges you to Connect Four. A small crowd gathers. Joy has never lost a game. Ever. People have proposed marriage to Joy just to stop the losing.</p>',
    choices: (s) => [
      { t: 'Play for lady drinks', sub: 'You buy if you lose', go(s, R) {
        if (R.chance(0.12)) { R.charmTemp(2, 4); R.drink(3); return 'YOU WON. The bar erupts. Joy shakes your hand. She is furious. Free drinks all round. You are a legend on this street.'; }
        R.cash(-p(s, 18)); return `You lost six games in a row. Some of them in four moves. You bought Joy six lady drinks (${fmt(p(s, 18))}). She is very sweet about it.`;
      } },
      { t: 'Decline graciously', go: () => 'Wise. Joy respects that. Joy respects nothing else.' },
    ],
  },
  dv_uncle: {
    kind: 'bar', bar: ['dive'], title: 'Adopted by an Uncle', icon: '👴',
    text: (s) => `<p>A local uncle drags you over to his table. He has a bottle of something clear, a plate of something fried and an unshakeable belief that you are now his son. "${C(s).cheers}"</p>`,
    choices: [
      { t: 'Match him shot for shot', go(s, R) {
        R.drink(6); R.hp(-6);
        if (R.chance(0.5) && !R.has('amulet')) { R.item('amulet'); return 'You kept up. He was so impressed he gave you his lucky Buddha amulet off his own neck. You think he cried a bit.'; }
        R.hp(8); return 'You woke up on his couch. His grandma made you rice soup. You\'re in the family WhatsApp now.';
      } },
      { t: 'Teach him "Aussie Aussie Aussie"', go(s, R) { R.drink(2); R.charmTemp(1, 3); return '"OI OI OI!" The whole bar is chanting it. A tradition has been born. You are a cultural ambassador.'; } },
      { t: 'Slip out the back', go: () => 'You slipped out. He\'s still looking for you. He will always be looking for you.' },
    ],
  },
  dv_pool: {
    kind: 'bar', bar: ['dive'], title: 'The Pool Shark', icon: '🎱',
    text: () => '<p>A skinny kid at the pool table offers a game for twenty bucks. He holds the cue like a violin. This is either very good or very bad.</p>',
    choices: (s) => [
      { t: `Play for ${fmt(p(s, 20))}`, req: afford((s) => p(s, 20)), go(s, R) { const n = p(s, 20); if (R.chance(0.35)) { R.cash(n); return 'You sank the black off three cushions. Pure luck. You will tell this story for 40 years.'; } R.cash(-n); return 'He cleared the table in one go, then did it again blindfolded for fun.'; } },
      { t: `Double or nothing, ${fmt(p(s, 50))}`, req: afford((s) => p(s, 50)), go(s, R) { const n = p(s, 50); if (R.chance(0.25)) { R.cash(n); return 'He scratched on the black. He has never scratched on the black. His uncle is shouting at him in the corner.'; } R.cash(-n); return 'He was hustling you the whole time. Of course he was. He\'s 14 and owns a Porsche.'; } },
      { t: 'Watch and drink', go(s, R) { R.drink(1); return 'He cleared out three Brits and an Israeli. You kept your money. Smart.'; } },
    ],
  },
  dv_karaoke: {
    kind: 'bar', bar: ['dive'], title: 'Karaoke Hour', icon: '🎤',
    text: () => '<p>The karaoke machine has exactly three English songs: "Khe Sanh", "Down Under" and "My Heart Will Go On". The locals are looking at you expectantly.</p>',
    choices: [
      { t: 'Belt out "Khe Sanh"', go(s, R) { const r = R.hook(0.02, { bar: 'dive' }); R.drink(2); return hook(r, `The whole bar knew the chorus somehow. ${r.who} came over to say it was "very passionate". You walked her home.`, 'You nailed it. Nobody knew the song. Free beers from the owner, who loved it.'); } },
      { t: '"Down Under"', go(s, R) { R.drink(4); return 'Everybody on Earth knows Down Under. The whole bar sang. Four free beers. A bloke from Belgium cried.'; } },
      { t: '"My Heart Will Go On"', go(s, R) { if (R.chance(0.35)) { R.charmTemp(2, 4); return 'Transcendent. You hit the key change. People filmed it. Grown men wept into their Changs.'; } R.charmTemp(-1, 2); return 'You missed the key change by a full octave. A dog outside started howling.'; } },
    ],
  },
  dv_fight: {
    kind: 'bar', bar: ['dive'], title: 'The Elbow', icon: '👊', w: (s) => (mateIs(s, 'jono') ? 0.5 : 1.2) * (mateIs(s, 'davo') || mateIs(s, 'shazza') ? 1.5 : 1),
    text: () => '<p>You bump a bloke\'s elbow. His drink goes all over his mate. His mate stands up. Then his other mate. They are all much bigger sitting down than you expected.</p>',
    choices: (s) => [
      ...(mateIs(s, 'jono') ? [{ t: 'Let Jono smooth it over', go: () => 'Jono did a haka. Nobody knew what was happening. Everybody shook hands. Kiwis are a gift.' }] : []),
      { t: 'Apologise and shout their table', sub: fmt(p(s, 15)), go(s, R) { R.cash(-p(s, 15)); R.drink(2); return 'Big hugs. They taught you a drinking game. You lost it, repeatedly.'; } },
      { t: 'Square up', go(s, R) {
        const f = R.fight('local', 0.1);
        if (f.won) { R.cash(-p(s, 30)); return `You won a fight in a foreign country! Then ${C(s).cop} turned up and accepted a ${fmt(p(s, 30))} "on-the-spot fine". Still worth it. Probably.`; }
        return `Their cousin arrived. Then his cousin. You lost ${f.dmg} health and a tooth that may have been loose anyway.`;
      } },
      { t: 'Leg it', go(s, R) { if (R.chance(0.6)) return 'You ran. You\'ve never run so fast. A Thai kid on a bicycle overtook you, but still.'; R.hp(-6); return 'You ran straight into a plastic table. Everyone laughed, including the people chasing you.'; } },
    ],
  },
  dv_cop: {
    kind: 'bar', bar: ['dive'], title: 'The Long Arm of the Law', icon: '👮',
    text: (s) => `<p>${C(s).cop[0].toUpperCase() + C(s).cop.slice(1)} walks in, looks around slowly, and points at you. Apparently you have committed a crime. Nobody will tell you what the crime is.</p>`,
    choices: (s) => [
      { t: 'Pay the "fine"', sub: fmt(p(s, 25)), go(s, R) { R.cash(-p(s, 25)); return 'He wrote you a receipt on a napkin. It says "fine". It is not a real receipt.'; } },
      { t: 'Argue', go(s, R) { if (R.chance(0.4)) return 'He laughed at your accent and walked off. You think you won? Unclear.'; R.cash(-p(s, 70)); R.hp(-5); return 'A night in a cell with a Russian and a man who sold fake Rolexes. Fine doubled in the morning.'; } },
      { t: 'Offer him a beer', go(s, R) { if (R.chance(0.5)) { R.drink(3); return 'He sat down. He took off his hat. Turns out he loves the Socceroos. You\'re having dinner with his family on Sunday.'; } R.cash(-p(s, 50)); return '"Bribing a police officer," he says, very slowly, writing a much bigger number on the napkin.'; } },
    ],
  },
  dv_courier: {
    kind: 'bar', bar: ['dive', 'fancy'], c: ['TH', 'KH'], tags: ['seedy'], title: 'A Business Opportunity', icon: '🕴️', cd: 6,
    when: (s) => !has(s, 'package'),
    vars: (s, R) => ({ job: R.courier() }),
    text: (s, v) => `<p>A man in a shirt that is far too nice for this bar slides into your booth. "You look like a smart man. I need a smart man to take a small package to <b>${v.job.destName}</b>, ${v.job.destCountry}. <b>${fmt(v.job.pay)}</b> when you deliver it."</p><p>He puts a brick-sized parcel wrapped in brown tape on the table. It says "PROTEIN" on it in Sharpie.</p><p class="warn">Crossing a border with it risks prison. Flights are the riskiest.</p>`,
    choices: (s, v) => [
      { t: 'Take the package', sub: `${fmt(v.job.pay)} on delivery`, req: (s) => (full(s) ? 'Backpack full' : ''), go(s, R) { R.takePackage(v.job); return `You now have a "gift for my cousin" in your backpack. It weighs exactly one kilo. Get it to ${v.job.destName}.`; } },
      { t: 'Ask what\'s in it', go: () => '"Protein powder," he says, and winks so hard his whole face moves. You decide you don\'t want to know. He leaves his number on a napkin and a smell of cologne.' },
      { t: 'Tell him to rack off', go(s) { s.flags.karma = (s.flags.karma || 0) + 1; return 'He shrugs and walks over to a Canadian kid at the bar. You hope that kid is OK.'; } },
    ],
  },
  dv_bali: {
    kind: 'bar', bar: ['dive', 'bp'], c: ['ID'], title: 'The Boogie Board', icon: '🏄', once: true,
    text: () => '<p>A sunburnt bloke from Perth leans over. "Mate. Five grand to carry a boogie board home to Australia for me. Just a boogie board. Heavy boogie board."</p>',
    choices: [
      { t: 'ABSOLUTELY NOT. THIS IS BALI.', go(s, R) { R.hp(3); return 'Every Australian is born knowing one thing: you do not muck around with that in Indonesia. You moved tables. You moved hostels. You may move countries.'; } },
      { t: 'Ask how heavy the boogie board is', go: () => '"About a kilo." You stand up, finish your Bintang and walk directly into the ocean to think about your choices.' },
    ],
  },
  dv_ladydrinks: {
    kind: 'bar', bar: ['dive'], c: ['TH', 'KH', 'PH'], tags: ['party', 'seedy'], title: 'Lady Drinks', icon: '🍹',
    vars: (s, R) => ({ name: R.pick(['Joy', 'Nok', 'Pim', 'Bee', 'Lin', 'May', 'Gift', 'Mint']) }),
    text: (s, v) => `<p>A bar hostess called ${v.name} tells you that you are a "very handsome man" and asks if you will buy her a lady drink. A lady drink is ${fmt(p(s, 6))}, comes in a tiny glass, and contains no detectable alcohol.</p>`,
    choices: (s, v) => [
      { t: 'Buy lady drinks all night', sub: fmt(p(s, 40)), req: afford((s) => p(s, 40)), go(s, R) { R.cash(-p(s, 40)); R.chain('dv_barfine', { name: v.name }); return `${v.name} laughs at all your jokes. You are not that funny. At 1am she mentions something called a "bar fine".`; } },
      { t: 'Buy her one and have a chat', sub: fmt(p(s, 6)), go(s, R) { R.cash(-p(s, 6)); R.hp(2); return `${v.name} tells you about her daughter back home and her plan to open a noodle shop. She shows you photos. Genuinely lovely chat. You tip well.`; } },
      { t: 'Politely decline', go: () => `${v.name} moves on to a sunburnt Englishman in a Chelsea shirt. No hard feelings.` },
    ],
  },
  dv_barfine: {
    kind: 'chain', title: 'The Bar Fine', icon: '💸',
    text: (s, v) => `<p>The bar fine is ${fmt(p(s, 45))}. It means ${v.name} can leave work early. With you. The mamasan is already holding out her hand.</p><p class="dim">Paid hookups score ×1. Ones you didn't pay for score ×5.</p>`,
    choices: (s, v) => [
      { t: 'Pay the bar fine', sub: fmt(p(s, 45)), req: afford((s) => p(s, 45)), go(s, R) { R.cash(-p(s, 45)); R.score(true, `${v.name} (bar fine)`); s.flags.barfine = s.day; return `The rest is between you, ${v.name} and the ceiling fan. In the morning your wallet is lighter than you remember.`; } },
      { t: 'Walk her to a taxi and go home', go(s, R) { R.hp(3); s.flags.karma = (s.flags.karma || 0) + 1; return 'You paid for her taxi, said goodnight and went home alone. Mum would be proud. Your mates must never find out.'; } },
      { t: 'Ask if the fine is tax deductible', go: () => 'The mamasan stares at you for a long time. Then she laughs so hard she has to sit down. You leave while she\'s distracted.' },
    ],
  },
  dv_snake: {
    kind: 'bar', bar: ['dive'], c: ['VN', 'LA', 'KH'], title: 'Snake Whisky', icon: '🐍',
    text: () => '<p>Behind the bar is a big jar of rice whisky with a whole cobra coiled inside it, mouth open, eating a scorpion. The owner says it "makes you strong like tiger".</p>',
    choices: [
      { t: 'Do a shot', go(s, R) { R.drink(2); if (R.chance(0.5)) { R.hp(10); return 'You feel POWERFUL. You feel like you could fight a tiger. Please do not fight a tiger.'; } R.hp(-8); return 'It tasted like a reptile house smells. Your throat closed for a minute.'; } },
      { t: 'Ask about the one with the gecko', go(s, R) { R.drink(2); R.charmTemp(1, 2); return 'The gecko one is "for women". The whole bar laughs at you. You laugh too. You drink it anyway.'; } },
      { t: 'Nope', go: () => 'The cobra watches you leave. It is not finished with you.' },
    ],
  },
  dv_tvbet: {
    kind: 'bar', bar: ['dive'], c: ['TH', 'KH', 'LA'], title: 'Muay Thai on the Telly', icon: '📺',
    text: (s) => `<p>Muay Thai is on TV and the whole bar is betting. A man in a singlet asks if you want red or blue for ${fmt(p(s, 20))}.</p>`,
    choices: (s) => ['Red', 'Blue'].map((c) => ({ t: `${c} corner`, sub: fmt(p(s, 20)), req: afford((s) => p(s, 20)), go(s, R) { if (R.chance(0.5)) { R.cash(Math.round(p(s, 20) * 0.9)); return `${c} wins by elbow! The bar goes nuts. You hug a stranger.`; } R.cash(-p(s, 20)); return `${c} got kicked in the head and lay down for a nice rest. You owe the man in the singlet.`; } })).concat([{ t: 'Just watch', go: () => 'You watched. It was brutal and beautiful. You now want to learn Muay Thai. You will not learn Muay Thai.' }]),
  },
  dv_expat: {
    kind: 'bar', bar: ['dive', 'fancy'], title: 'Kev from Perth', icon: '🧓',
    text: () => '<p>Kev from Perth has lived here for 22 years, been married 3 times and has a ponytail like a dead possum. He has "advice". He is going to give it to you whether you like it or not.</p>',
    choices: (s) => [
      { t: 'Listen to all of it', go(s, R) { R.hp(-3); s.nextPhoto = 1.5; R.info('Next landmark pic +50%'); return 'Three hours. Divorce one, divorce two, the bar he lost in 2009. But at the end, he tells you about a spot nobody knows about. Next landmark pic is worth 50% more.'; } },
      { t: 'Buy him a beer and ask about the obscure stuff', sub: fmt(p(s, 3)), go(s, R) { R.cash(-p(s, 3)); R.drink(1); s.nextPhoto = 1.5; R.info('Next landmark pic +50%'); return '"Off the beaten track? Mate." His eyes light up. He draws you a map on a coaster. Next landmark pic is worth 50% more.'; } },
      { t: 'Hide in the dunny', go: () => 'You hid in the toilet for 40 minutes. When you came out he was telling the same story to a Dutch couple.' },
    ],
  },
  dv_student: {
    kind: 'bar', bar: ['dive'], title: 'Wrong Assumption', icon: '🙈',
    vars: (s, R) => ({ who: R.pick(['Mai', 'Linh', 'Dara', 'Fern', 'Ploy', 'Ana', 'Dewi', 'Nida']) }),
    text: (s, v) => `<p>You start chatting to a local woman called ${v.who} and assume she works here. She does not. She is a dentistry student watching the football with her brothers. She is mortified. Her brothers are large.</p>`,
    choices: (s, v) => [
      { t: 'Apologise profusely, ask about the football', go(s, R) { const r = R.hook(-0.08, { who: `${v.who} (dentistry student)` }); return hook(r, `She laughs. She decides you are an idiot, but a funny one. Her brothers go home early.`, `Her brothers adopt you instead. You talk football all night and they won't let you pay for a single beer.`) + (r.ok ? '' : (R.drink(3), '')); } },
      { t: 'Show her photos of your ute', go: () => 'Eleven photos of the ute. Two of the ute\'s bullbar. She left. Her brothers stayed to look at the ute.' },
      { t: 'Retreat with dignity', go: () => 'There was no dignity left. You retreated anyway.' },
    ],
  },
  dv_gecko: {
    kind: 'bar', bar: ['dive'], title: 'The Heckler', icon: '🦎',
    text: () => '<p>A tokay gecko on the wall shouts "UH-OH!" every single time you speak. The locals are crying with laughter.</p>',
    choices: [
      { t: 'Argue with the gecko', go(s, R) { const f = R.fight('wildlife', 0.35); return f.won ? 'You out-shouted the gecko. It retreated behind the fridge. A small victory for mankind.' : `You tried to grab it. It bit you and would not let go for 10 minutes. You lost a fight to a lizard. It is on video. −${f.dmg} ❤️`; } },
      { t: 'Toast the gecko', go(s, R) { R.drink(1); R.charmTemp(1, 2); return '"To the gecko!" "UH-OH!" The bar adopts you as its official comedian.'; } },
      { t: 'Buy the gecko a drink', go(s, R) { R.drink(3); return 'The owner was so delighted he poured the gecko a shot and you three more.'; } },
    ],
  },
  dv_powercut: {
    kind: 'bar', bar: ['dive', 'bp'], title: 'Blackout', icon: '🕯️',
    text: () => '<p>The power cuts out. Candles come out. The owner starts telling a ghost story about a spirit who eats the livers of foreigners.</p>',
    choices: (s) => [
      { t: 'Stay for the story', go(s, R) { R.hp(2); return 'Spooky. Your liver is nervous. With good reason.'; } },
      { t: 'Use the darkness to skip the tab', go(s, R) { if (R.chance(0.6)) { R.cash(p(s, 12)); return 'You slipped out. Free night. You are a terrible person. You feel great.'; } const f = R.fight('local', 0.1); return f.won ? 'The owner caught you. You wrestled. You both fell into a fish tank. You paid.' : 'The owner caught you. He was a former Muay Thai champion. You paid. Painfully.'; } },
    ],
  },

  // =============================================================================================
  // BARS: BACKPACKER
  // =============================================================================================
  bp_flipcup: {
    kind: 'bar', bar: ['bp'], title: 'Flip Cup: Aussies vs Poms', icon: '🥤',
    text: () => '<p>An international incident is brewing: Aussies versus Poms at flip cup. The Poms are being cocky. One of them is wearing a Union Jack as a cape.</p>',
    choices: [
      { t: 'Captain the Aussies', go(s, R) {
        R.drink(5);
        if (R.chance(0.55)) { const r = R.hook(0.04, { bar: 'bp' }); return hook(r, `GLORY. You flipped the winning cup. ${r.who} was very impressed with your wrist action.`, 'GLORY. You flipped the winning cup. The Poms demand a rematch. They will never get it.'); }
        R.drink(3); R.charmTemp(-1, 2); return 'You lost to a man called Hugo. A national shame. You drank three penalty cups and sang "God Save the King".';
      } },
      { t: 'Join the Poms', go(s, R) { R.drink(4); R.charmTemp(-1, 3); return 'A traitor. You won, but your countrymen will never forgive you. Davo is crying.'; } },
    ],
  },
  bp_wonderwall: {
    kind: 'bar', bar: ['bp'], title: 'Anyway, Here\'s Wonderwall', icon: '🎸',
    text: () => '<p>A bloke with a man-bun and an acoustic guitar is three chords into Wonderwall. A circle of girls is forming around him. This is a crisis.</p>',
    choices: (s) => [
      { t: 'Take the guitar and smash it', go(s, R) { R.ach('wonderwall'); const f = R.fight('local', 0); return f.won ? 'Pete Townshend would be proud. The crowd was split 50/50. The bloke with the man-bun cried. Security escorted you out with a high five.' : `The man-bun was a black belt. −${f.dmg} ❤️. Wonderwall continued.`; } },
      { t: 'Grab it and play "Khe Sanh" instead', sub: has(s, 'guitar') ? 'You can play!' : 'You can\'t play', go(s, R) {
        R.ach('wonderwall');
        const r = R.hook(has(s, 'guitar') ? 0.12 : -0.05, { bar: 'bp' });
        return hook(r, `Somehow it worked. ${r.who} said she\'d "never heard anything like it". That\'s technically true.`, 'You only know two chords. You played both, loudly, for six minutes. The circle dispersed.');
      } },
      { t: 'Sing along like a legend', go(s, R) { R.ach('wonderwall'); R.drink(3); const r = R.hook(0.06, { bar: 'bp' }); return hook(r, `You harmonised. ${r.who} harmonised back. Man-bun was furious.`, 'You sang along. Everyone did. For four minutes, the whole bar was one person. Then someone started Hey Jude.'); } },
    ],
  },
  bp_swedes: {
    kind: 'bar', bar: ['bp'], title: 'The Scandinavians', icon: '🇸🇪',
    vars: (s, R) => ({ dest: nextCity(s, R) }),
    text: (s, v) => `<p>A group of very tall, very blonde Swedish girls are planning tomorrow's trip to ${v.dest}. They are using a laminated spreadsheet. You are holding a bucket with a straw in it.</p>`,
    choices: (s, v) => [
      { t: 'Chat them up', go(s, R) { const r = R.hook(0.02, { who: `${R.pick(['Freja', 'Ella', 'Linnea', 'Maja', 'Saga'])} from Gothenburg` }); return hook(r, `${r.who} thought your accent was "like a crocodile movie". That was a compliment, apparently.`, 'They politely explained the Swedish tax system to you for an hour. You understood none of it. They left at 11pm. Responsible.'); } },
      { t: `Pretend you're going to ${v.dest} too`, go(s, R) { const r = R.hook(0.1, { who: `${R.pick(['Freja', 'Ella', 'Linnea', 'Maja', 'Saga'])} from Malmö` }); return hook(r, `${r.who} said "oh great, come with us!" You were never going to ${v.dest}. You might go now.`, 'They asked which bus. You said "the big one". They saw through you immediately.'); } },
      { t: 'Talk about your ute', go: () => 'They asked what a ute was. You explained for 25 minutes. Sweden now thinks Australia is a car with a bed in it. It is.' },
    ],
  },
  bp_beerpong: {
    kind: 'bar', bar: ['bp'], title: 'Beer Pong Tournament', icon: '🏓',
    text: () => '<p>Beer pong tournament! First prize is a bucket. Second prize is also a bucket. Last prize is a bucket, but you have to drink it.</p>',
    choices: [
      { t: 'Enter', go(s, R) { R.drink(5); if (R.chance(0.4)) { R.item('bucket'); return 'You won! Mostly because the other team was too drunk to stand. Bucket kit acquired.'; } return 'Knocked out in round one by two Canadian girls who were clearly professionals.'; } },
      { t: 'Heckle from the side', go(s, R) { R.drink(2); R.charmTemp(1, 2); return 'Your commentary was so good someone offered you a job as an MC. You\'re a natural.'; } },
    ],
  },
  bp_newmate: {
    kind: 'bar', bar: ['bp', 'dive'], title: 'New Mate', icon: '🤝', w: 1.3,
    when: (s) => s.mates.length < D.MAX_MATES,
    vars: (s, R) => ({ m: R.freeMate() }),
    text: (s, v) => (v.m ? `<p>At the bar you get talking to <b>${D.MATES[v.m].name}</b> from ${D.MATES[v.m].from}. ${D.MATES[v.m].desc}</p><p>By your fourth drink, you're best mates. By your sixth, you're planning to open a bar together on Koh Rong.</p>` : '<p>You chat to a bloke at the bar. He leaves.</p>'),
    choices: (s, v) => [
      { t: 'Travel together', req: (s) => (v.m && s.mates.length < D.MAX_MATES ? '' : 'Crew is full'), go(s, R) { R.addMate(v.m); R.drink(2); return `${D.MATES[v.m].name} is in. The crew grows.`; } },
      { t: 'Nah, you\'re right', go: () => 'You swapped Instagrams. You will never message each other. That\'s the backpacker way.' },
    ],
  },
  bp_matefight: {
    kind: 'bar', bar: ['bp', 'dive'], title: 'Blue with a Mate', icon: '🥊', w: (s) => (s.mates.filter((m) => m !== 'steve').length ? 1.2 : 0),
    vars: (s, R) => ({ m: R.pick(s.mates.filter((m) => m !== 'steve')), why: R.pick(['reckons you owe him $40 from Chiang Mai', 'reckons you snaked the girl he was talking to', 'won\'t stop doing a terrible Steve Irwin impression', 'says Vegemite is "just salt paste"', 'ate your last Tim Tam']) }),
    text: (s, v) => `<p>${D.MATES[v.m].name} ${v.why}. Words are exchanged. Then louder words. Then a plastic chair is involved.</p>`,
    choices: (s, v) => [
      { t: 'Throw hands', go(s, R) {
        const f = R.fight('mate', v.m === 'shazza' ? 0.2 : 0);
        if (R.chance(0.3)) { R.loseMate(v.m); return f.won ? `You won. ${D.MATES[v.m].name} packed their bag and caught the morning bus. You'll make up in 10 years at a wedding.` : `${D.MATES[v.m].name} won, convincingly, then left you anyway. −${f.dmg} ❤️`; }
        return f.won ? 'You won. You both cried. You hugged. You\'re closer than ever. Classic.' : `You lost. ${D.MATES[v.m].name} bought you a beer and a bag of ice for your face. −${f.dmg} ❤️`;
      } },
      { t: 'Pay up and move on', sub: fmt(p(s, 40)), go(s, R) { R.cash(-p(s, 40)); return 'Peace in our time. It cost forty bucks.'; } },
      { t: 'Storm off', go(s, R) { if (R.chance(0.4)) { R.loseMate(v.m); return `${D.MATES[v.m].name} was gone in the morning. A note on your bunk said "rack off". Fair.`; } return 'You stormed off to the 7-Eleven, ate two toasties and came back. All forgotten.'; } },
    ],
  },
  bp_bucket: {
    kind: 'bar', bar: ['bp'], title: 'Three Buckets for Two', icon: '🪣',
    text: () => '<p>Tonight\'s special: three buckets for the price of two. Each bucket contains a mickey of local rum, a can of Red Bull and some sort of cola. Your heart is already racing just reading the sign.</p>',
    choices: [
      { t: 'Do all three', go(s, R) { R.drink(12); R.hp(-8); if (s.tonight) s.tonight.stupid = true; return 'Three buckets. You can hear colours. Something stupid is definitely going to happen tonight.'; } },
      { t: 'Share one with the table', go(s, R) { R.drink(4); R.charmTemp(1, 2); return 'Generous AND responsible. Who are you?'; } },
      { t: 'Order a water', go(s, R) { R.charmTemp(-1, 2); return 'The bartender laughed so hard he had to sit down. Someone took a photo. It\'s on the hostel wall now.'; } },
    ],
  },
  bp_uv: {
    kind: 'bar', bar: ['bp'], title: 'UV Paint Party', icon: '🎨',
    text: () => '<p>UV paint party. Someone has painted "SEND IT" on your chest in glowing letters. Everyone looks like a Hi-Vis vest at a rave.</p>',
    choices: [
      { t: 'Send it', go(s, R) { R.drink(4); const r = R.hook(0.07, { bar: 'bp' }); return hook(r, `You sent it. ${r.who} painted her number on your back. Mirror-writing, but you figured it out.`, 'You sent it. You danced for 4 hours. You woke up still glowing. Your sheets are glowing.'); } },
      { t: 'Paint "MUM" on your forehead', go(s, R) { R.charmTemp(1, 2); R.mum(1); return 'Iconic. Someone sent Mum a photo. She loved it. She made it her profile picture.'; } },
    ],
  },
  bp_dorm: {
    kind: 'bar', bar: ['bp'], title: 'Dorm Romance', icon: '🛏️', w: 1.4,
    when: (s) => s.tonight && s.tonight.stay === 'dorm',
    vars: (s, R) => ({ who: R.pick(D.PARTNERS).join(' from ') }),
    text: (s, v) => `<p>${v.who.split(' from ')[0]}, from your dorm, keeps "accidentally" sitting next to you. She's been in the bunk across from yours for three nights. She knows how you snore. She's still here.</p>`,
    choices: (s, v) => [
      { t: 'Shoot your shot', go(s, R) { const r = R.hook(0.14, { who: v.who }); return hook(r, `You walked back to the dorm together.`, 'She said "you\'re sweet" and patted your head. Your head will never recover.'); } },
      { t: 'Play it cool', go(s, R) { if (R.chance(0.5)) { const r = R.hook(0.06, { who: v.who }); return hook(r, 'You played it so cool she made the move.', 'You played it so cool she thought you weren\'t interested. She\'s with a Dutch guy now.'); } return 'Too cool. Frozen solid. She went to bed at 11.'; } },
    ],
  },
  bp_school: {
    kind: 'bar', bar: ['bp'], title: 'Small World', icon: '🌏',
    vars: (s, R) => ({ who: R.pick(['Sophie', 'Tayla', 'Jess', 'Brittany', 'Chloe', 'Courtney', 'Emily']) }),
    text: (s, v) => `<p>Someone screams your name across the bar. It's ${v.who} from Year 10 Maths! What are the odds? (The odds are high. Everyone from your school is in South East Asia right now.)</p>`,
    choices: (s, v) => [
      { t: 'Catch up properly', go(s, R) { const r = R.hook(0.1, { who: `${v.who} from your old school` }); return hook(r, `Turns out she always thought you were "kinda funny". Your Year 10 self would explode.`, `She's here with her boyfriend, Jayden, who is 6\'5" and does CrossFit. You talk about how everyone from school is going.`); } },
      { t: 'Hide behind a pillar', go: () => 'She saw you. She waved. You pretended to be a different, taller person.' },
    ],
  },
  bp_tinder: {
    kind: 'bar', bar: ['bp', 'fancy'], title: 'It\'s a Match', icon: '📱',
    vars: (s, R) => ({ who: R.pick(D.PARTNERS).join(' from ') }),
    text: (s, v) => `<p>You matched with ${v.who} on Tinder. Her location says 40 metres away. You look up. She's in this bar. She looks exactly like her photos, for once.</p>`,
    choices: (s, v) => [
      { t: 'Go and say hi', go(s, R) { const r = R.hook(0.12, { who: v.who }); return hook(r, 'She said "you look exactly like your photos too". You don\'t, but she was kind about it.', 'You said "hey". She said "hey". You said "so, um, hey". She unmatched you while you were standing in front of her.'); } },
      { t: 'Send another "hey" from across the room', go: () => 'She read it. She looked up. She looked back down. Seen at 11:42pm.' },
    ],
  },
  bp_firerope: {
    kind: 'bar', bar: ['bp'], tags: ['beach'], title: 'The Flaming Skipping Rope', icon: '🔥',
    text: () => '<p>The fire show has moved on to skipping rope. With a rope that is on fire. A crowd of drunks is lining up to have a go. This is a regular Tuesday here.</p>',
    choices: [
      { t: 'Jump in', go(s, R) { if (R.chance(0.45)) { R.hp(-15); return 'The rope caught your ankle. You now have a fluoro-pink burn in the shape of a sausage. Everyone on Koh Phangan has one.'; } R.charmTemp(2, 4); return 'Fourteen skips! You\'re a legend! A small crowd chants your name. Someone gives you a free bucket.'; } },
      { t: 'Film it for the group chat', go(s, R) { R.drink(2); return 'You got footage of a Dutch man catching fire. 400k views on TikTok. He\'s fine.'; } },
    ],
  },
  bp_cryptobro: {
    kind: 'bar', bar: ['bp', 'fancy'], title: 'WAGMI', icon: '🚀',
    text: () => '<p>A man in a "WAGMI" cap and a Patagonia vest corners you. "Bro. ThongSwap. $THONG. It\'s going to a thousand x, bro. I\'m not even joking, bro."</p>',
    choices: (s) => [
      { t: 'Ape in $200', req: afford(() => 200), go(s, R) { R.coin('THONG', 200); return 'You bought $200 of $THONG on your phone, under a table, while he chanted "WAGMI". Check the wallet.'; } },
      { t: 'Ape in $50', req: afford(() => 50), go(s, R) { R.coin('THONG', 50); return 'A small, responsible gamble on a coin named after footwear.'; } },
      { t: 'Tell him to rack off', go: () => '"NGMI, bro," he says sadly, and walks away to bother a Swiss girl.' },
    ],
  },
  bp_gapyah: {
    kind: 'bar', bar: ['bp'], title: 'The Gap Yah', icon: '🎩',
    text: () => '<p>A table of posh Poms are discussing how Laos "totally changed" them. One of them has a dreadlock. One. Singular.</p>',
    choices: [
      { t: 'Join in and lie about your spiritual journey', go(s, R) {
        R.drink(3);
        if (!mateIs(s, 'tarquin') && s.mates.length < D.MAX_MATES && R.chance(0.5)) { R.addMate('tarquin'); return 'You said you found yourself in a cave. Tarquin loved it. Tarquin is coming with you. Tarquin is paying.'; }
        return 'You talked about "energy" for an hour. They bought all your drinks.';
      } },
      { t: 'Heckle them', go(s, R) { R.charmTemp(1, 2); return 'Every Aussie and Kiwi in the bar raised a glass to you. The Poms took it well. They always do. It\'s infuriating.'; } },
    ],
  },
  bp_quiz: {
    kind: 'bar', bar: ['bp'], title: 'Pub Trivia', icon: '❓',
    text: () => '<p>Pub trivia, question 7: "What is the capital of Australia?" Your table, which is four Germans and a Canadian, confidently writes down "Sydney".</p>',
    choices: (s) => [
      { t: 'Fight for Canberra', go(s, R) { if (R.chance(0.7)) { R.cash(p(s, 25)); R.drink(3); return 'They let you change it. You won the quiz by one point. $25 bar tab and the respect of a nation.'; } return 'They outvoted you. You lost by one point. You will think about this on your deathbed.'; } },
      { t: 'Let it go', go: () => 'Canberra would understand. Canberra is used to it.' },
    ],
  },
  bp_shoey: {
    kind: 'bar', bar: ['bp', 'dive'], title: 'SHOEY! SHOEY! SHOEY!', icon: '👟',
    text: () => '<p>Someone has noticed you\'re Australian. The chant starts. "SHOEY! SHOEY! SHOEY!" There\'s a beer being poured into a sneaker that has walked across three countries.</p>',
    choices: [
      { t: 'Do the shoey', go(s, R) { R.drink(1); R.charmTemp(2, 3); if (R.chance(0.3)) return 'The crowd went wild. Then your stomach did. ' + R.belly(); return 'The crowd went wild. It tasted like feet and pride.'; } },
      { t: 'Do it out of a thong', go(s, R) { R.drink(1); R.charmTemp(1, 2); return 'Technically impossible. You did it anyway. Most of it went down your shirt. Respect.'; } },
      { t: 'Refuse', go(s, R) { R.charmTemp(-1, 3); return 'They booed you out of the bar. You let down your country.'; } },
    ],
  },

  // =============================================================================================
  // BARS: FANCY HOTEL
  // =============================================================================================
  fc_dress: {
    kind: 'bar', bar: ['fancy'], title: 'Dress Code', icon: '👔', w: (s) => (has(s, 'suit') ? 0.2 : has(s, 'singlet') ? 2 : 0.8),
    text: (s) => `<p>The bouncer looks at your thongs. Then at your ${has(s, 'singlet') ? 'Bintang singlet' : 'shirt with a sweat map of Tasmania on it'}. Then directly into your soul.</p>`,
    choices: (s) => [
      ...(has(s, 'suit') ? [{ t: 'Change into the Hoi An suit', go(s, R) { R.charmTemp(1, 1); return 'You stepped into the toilet a bogan and came out James Bond. Well. James Bond\'s cousin from Logan.'; } }] : []),
      { t: 'Slip him a tip', sub: fmt(p(s, 20)), go(s, R) { R.cash(-p(s, 20)); return 'Money talks. Thongs walk in.'; } },
      { t: 'Buy a shirt at the gift shop', sub: fmt(p(s, 45)), go(s, R) { R.cash(-p(s, 45)); R.charmTemp(1, 1); return 'A $45 polo shirt with the hotel logo on it. You look like you work here. A woman asks you for more towels.'; } },
      { t: 'Go back to the dive bar', go(s, R) { R.drink(2); return 'Their loss. You had more fun with the uncles anyway.'; } },
    ],
  },
  fc_glenda: {
    kind: 'bar', bar: ['fancy'], title: 'Glenda from Mosman', icon: '🍸',
    text: () => '<p>Glenda from Mosman, 52, is three espresso martinis into celebrating her divorce. She has her ex-husband\'s credit card and nothing to lose. She says you look "like a young Shane Warne".</p>',
    choices: [
      { t: 'Shoot your shot', go(s, R) { const r = R.hook(0.25, { bar: 'fancy', who: 'Glenda from Mosman' }); R.drink(3); return hook(r, 'She paid for everything, including the suite. Technically, YOU still didn\'t pay. Doesn\'t count as paid. You checked the rules.', 'She laughed, pinched your cheek and called you "sweet". She did buy you three martinis, though.'); } },
      { t: 'Be her wingman with the barman', go(s, R) { R.drink(4); return 'You got her and Raúl the barman together. She put your whole night on the ex\'s card. Teamwork.'; } },
      { t: 'Call her "Mum" by accident', go(s, R) { R.charmTemp(-1, 2); return 'It just came out. She stared at you for a long time. Then she called her own son.'; } },
    ],
  },
  fc_banker: {
    kind: 'bar', bar: ['fancy'], title: 'The Fund Manager', icon: '💼',
    vars: (s, R) => ({ coin: R.pick(Object.keys(D.COINS)) }),
    text: () => '<p>A fund manager from Singapore is drinking a $60 whisky alone and looking at three phones at once.</p>',
    choices: (s, v) => [
      { t: 'Ask for a crypto tip', go(s, R) { s.flags.tip = v.coin; return `He leans in. "<b>$${v.coin}</b>. Don't tell anyone." Is he right? He has three phones. He must be right.`; } },
      { t: 'Challenge him to a drinking game', go(s, R) { R.drink(5); if (R.chance(0.5)) { R.cash(p(s, 40)); return 'He lost. He paid your whole tab without looking at it and went to bed at 10:30 on the dot.'; } R.hp(-4); return 'He drank you under the table. Singaporean bankers have livers of titanium.'; } },
      { t: 'Talk about your ute', go: () => 'He was genuinely interested. He asked about financing. You don\'t know what that is.' },
    ],
  },
  fc_escort: {
    kind: 'bar', bar: ['fancy'], title: 'The Business Card', icon: '💳',
    text: (s) => `<p>A very elegant woman at the end of the bar slides a business card along to you. There is no name on it. Just a number: <b>${fmt(p(s, 320))}</b>. That's more than your flight here.</p><p class="dim">Paid hookups score ×1. Ones you didn't pay for score ×5.</p>`,
    choices: (s) => [
      { t: 'Pay it', sub: fmt(p(s, 320)), req: afford((s) => p(s, 320)), go(s, R) { R.cash(-p(s, 320)); R.score(true, 'The Business Card'); return 'You never learned her name. She left before you woke up and took the hotel robe. Professional.'; } },
      { t: 'Ask if there\'s a backpacker discount', go: () => 'She laughs, genuinely, for the first time tonight. Then she leaves. You have made her night, in a way.' },
      { t: 'Order a Long Island iced tea and stare at your phone', go(s, R) { R.drink(2); return 'A good, safe choice. The Long Island was $28.'; } },
    ],
  },
  fc_bill: {
    kind: 'bar', bar: ['fancy'], title: 'The Bill', icon: '🧾',
    text: (s) => `<p>The bill arrives in a little leather folder. It seems you ordered a "bottle service" at some point. It is <b>${fmt(p(s, 160))}</b>. You don't remember a bottle. There was a sparkler.</p>`,
    choices: (s) => [
      { t: 'Pay it', go(s, R) { R.cash(-p(s, 160)); return 'You paid. The sparkler was nice, in fairness.'; } },
      { t: 'Dine and dash', go(s, R) {
        if (R.chance(0.55)) return 'You sprinted through the marble lobby in thongs, slapping the floor like a seal. Free bottle. Legend.';
        const f = R.fight('local', 0.25); R.cash(-p(s, 160));
        return f.won ? 'Security caught you at the revolving door. You wriggled free but they had your passport photo. You paid in the end.' : `Security tackled you into a fountain. You paid. With interest. −${f.dmg} ❤️`;
      } },
      { t: 'Offer to wash dishes', go(s, R) { R.hp(-6); R.cash(-p(s, 40)); return 'You washed dishes until 4am. The chef taught you to swear in Tagalog. They still charged you $40.'; } },
    ],
  },
  fc_yacht: {
    kind: 'bar', bar: ['fancy'], tags: ['beach'], title: 'Yacht Party', icon: '🛥️',
    text: () => '<p>The nephew of someone very rich and very foreign invites everyone at the bar onto his yacht. His name is "Vlad but call me Vee".</p>',
    choices: [
      { t: 'Get on the yacht', go(s, R) {
        R.drink(8);
        if (R.chance(0.15)) { R.hp(-10); return 'You fell overboard at 2am. Vee threw you a $4,000 bottle of champagne as a float. You kept the bottle.'; }
        const r = R.hook(0.08, { bar: 'fancy' }); return hook(r, `${r.who} was a deckhand. She showed you the engine room. It was not the engine room.`, 'Free champagne until sunrise. Vee cried about his dad. You were a good listener.');
      } },
      { t: 'Decline', go: () => 'You stayed ashore. That yacht is on the news next week. You will never know why.' },
    ],
  },
  fc_lookalike: {
    kind: 'bar', bar: ['fancy'], title: 'Is That...?', icon: '🏉',
    text: () => '<p>Is that... a famous AFL player? You squint. It is a lookalike, but he\'s fully committed to the bit and signing napkins.</p>',
    choices: [
      { t: 'Get a selfie', go(s, R) { const pts = R.photo({ id: 'fc_lookalike', name: 'Selfie with a footy legend (lookalike)', r: 14 }); return pts ? 'Mum will never know the difference. Neither will Dad. It\'s on your Insta now.' : 'You already have one. He\'s the same lookalike. He remembers you.'; } },
      { t: 'Buy him a beer and talk footy', go(s, R) { R.drink(2); R.charmTemp(1, 2); return 'He doesn\'t know anything about footy. He\'s from Belgium. Great bloke though.'; } },
    ],
  },
  fc_wine: {
    kind: 'bar', bar: ['fancy'], title: 'The Sommelier', icon: '🍷',
    text: () => '<p>A sommelier in a waistcoat glides over and asks about your "preferences in a red".</p>',
    choices: (s) => [
      { t: 'Ask if they have any goon', go(s, R) { R.cash(-p(s, 30)); R.drink(3); R.charmTemp(1, 2); return 'He considers this, gravely, then brings out a $90 Barossa Shiraz "for the homesick Australian". He only charges you $30. A good man.'; } },
      { t: 'Swirl, sniff, say "oaky"', go(s, R) { R.drink(2); return '"Very good, sir." He knows. You know he knows. You both keep going.'; } },
    ],
  },
  fc_pianist: {
    kind: 'bar', bar: ['fancy'], title: 'Piano Bar', icon: '🎹',
    text: () => '<p>A tuxedoed pianist is playing jazz standards for a room of very quiet rich people.</p>',
    choices: [
      { t: 'Request "Down Under"', go(s, R) { R.drink(3); R.charmTemp(1, 2); return 'He played it as a slow ballad. By the second chorus, the entire bar was singing "Do you come from a land down under". A CEO bought you three drinks.'; } },
      { t: 'Sit down at the piano', go(s, R) { R.charmTemp(-1, 2); return 'You know Chopsticks. You played Chopsticks. You were escorted to a table near the toilets.'; } },
    ],
  },
  fc_honeymoon: {
    kind: 'bar', bar: ['fancy'], title: 'The Honeymooners', icon: '💍',
    text: () => '<p>A honeymooning couple from Melbourne hear your accent and adopt you for the evening. They\'re very in love and a little bit bored of each other already.</p>',
    choices: [
      { t: 'Third wheel all night', go(s, R) { R.drink(6); return 'They paid for everything. They named their first child after you, probably.'; } },
      { t: 'Give them marriage advice', go(s, R) { R.drink(2); return 'You have never had a relationship last longer than a bucket. You gave advice anyway. They\'ve got a counsellor now.'; } },
    ],
  },

  // =============================================================================================
  // DRUNK STUPIDITY (after big nights)
  // =============================================================================================
  st_tattoo: {
    kind: 'stupid', title: '2am Tattoo', icon: '🖋️', when: (s) => !s.flags.tattoo && !s.prison,
    text: (s) => `<p>It is 2am and you are sitting in a tattoo parlour, asking for the word "warrior" in ${C(s).name === 'Thailand' ? 'Thai' : 'the local script'}. The artist is 19 and smiling a bit too much.</p>`,
    choices: (s) => [
      { t: 'Do it', sub: fmt(p(s, 30)), go(s, R) { R.cash(-p(s, 30)); s.flags.tattoo = true; R.ach('tattoo'); if (R.chance(0.5)) { R.charmPerm(1); return 'It says "chicken fried rice". Women find this hilarious. It is your best conversation starter now.'; } R.charmPerm(-1); return 'It says "chicken fried rice". You found out from a waiter. He laughed until he cried.'; } },
      { t: 'Get a koala instead', sub: fmt(p(s, 30)), go(s, R) { R.cash(-p(s, 30)); s.flags.tattoo = true; R.ach('tattoo'); return 'It looks like a potato with ears. You love it. Your mum does not.'; } },
      { t: 'Run away', go: () => 'You ran. A rare win for future you.' },
    ],
  },
  st_scooter: {
    kind: 'stupid', title: 'Kebab Run', icon: '🛵', when: (s) => !D.CITIES[s.city].tags.includes('remote'),
    text: () => '<p>You decide to "borrow" a scooter with the key left in it to go and get a kebab. It\'s only 200 metres. You are seeing two of everything.</p>',
    choices: [
      { t: 'Ride it', go(s, R) { if (R.chance(0.4)) { R.hp(-18); return 'You made it 40 metres before introducing yourself to a power pole. Your knee is now gravel. The kebab shop was closed anyway.'; } R.hp(5); return 'You got there, got two kebabs, and got the scooter back before anyone noticed. A perfect crime.'; } },
      { t: 'Walk', go(s, R) { R.hp(3); return 'You walked. Well done. Have a kebab. You earned it.'; } },
    ],
  },
  st_swim: {
    kind: 'stupid', title: 'Midnight Swim', icon: '🌊', tags: ['beach'],
    text: () => '<p>Midnight swim! The sea is warm, black and glowing faintly. Everyone is stripping off. Somewhere out there, things with tentacles are waking up.</p>',
    choices: [
      { t: 'Strip off and dive in', go(s, R) { if (R.chance(0.3)) { R.hp(-15); return 'Box jellyfish. Your mate weed on it. It did not help. It never helps.'; } const r = R.hook(0.06); return hook(r, `Floating in glowing plankton under the stars with ${r.who}. A moment you will remember forever.`, 'Floating in glowing plankton under the stars. A moment you will remember forever. Someone stole your shorts.'); } },
      { t: 'Paddle up to your knees', go: () => 'A crab got you on the toe. A small crab. You screamed like it was a big crab.' },
    ],
  },
  st_roof: {
    kind: 'stupid', title: 'Up on the Roof', icon: '🏚️', stay: ['dorm', 'guest'],
    text: () => '<p>You decide to climb onto the hostel roof to "see the stars". The route involves a drainpipe, a window, a water tank and a lot of faith.</p>',
    choices: [
      { t: 'Climb', go(s, R) { if (R.chance(0.35)) { R.hp(-20); return 'The drainpipe was decorative. You fell into the pool, which was empty, for cleaning.'; } const pts = R.photo({ id: 'roof_' + s.city, name: `The roof of a hostel in ${cityName(s)}, 3am`, r: 12 }); return `You made it. The stars were incredible. You took a blurry photo.${pts ? '' : ' You have a blurry photo from here already.'}`; } },
      { t: 'See the stars from the pool deck', go: () => 'Stars are stars. You saw them. Your legs still work.' },
    ],
  },
  st_propose: {
    kind: 'stupid', title: 'Will You Marry Me?', icon: '💍', when: (s) => !s.flags.engaged,
    vars: (s, R) => ({ who: R.pick(D.PARTNERS).join(' from ') }),
    text: (s, v) => `<p>You have known ${v.who} for two hours and you have just proposed with a ring pull from a can of ${C(s).beer}.</p>`,
    choices: (s, v) => [
      { t: 'Stand by it', go(s, R) { const r = R.hook(0.3, { who: `${v.who} (fiancée)` }); if (r.ok) { s.flags.engaged = s.day; return `She said yes! <i>${r.fade}</i> You're engaged. You don't know her surname.`; } return 'She said "aww" and kissed you on the cheek. Then she left with a Spaniard.'; } },
      { t: 'Laugh it off', go: () => '"Joking! Unless...?" She was not interested in the unless.' },
    ],
  },
  st_wallet: {
    kind: 'stupid', title: 'Where\'s Me Wallet?', icon: '👛',
    text: () => '<p>You pat your pockets. You pat them again. You pat someone else\'s pockets. Your wallet is gone.</p>',
    choices: (s) => [
      { t: 'Retrace your steps', go(s, R) { if (R.chance(0.5)) return 'Found it in the fridge at the 7-Eleven, next to the chocolate milk. Everything still in it. Miracle.'; const n = R.cash(-Math.min(s.cash, Math.round(80 + s.cash * 0.1))); return `Gone. ${fmt(-n)} and your Medicare card. Someone in Laos is now you.`; } },
      ...(s.mates.length ? [{ t: 'Blame a mate', go(s, R) { const m = R.pick(s.mates); if (m !== 'steve' && R.chance(0.4)) { R.loseMate(m); return `${D.MATES[m].name} was so offended they left. Your wallet was in your other pocket.`; } return 'It was in your other pocket the whole time. Your mates will never let you forget this.'; } }] : []),
    ],
  },
  st_dog: {
    kind: 'stupid', title: 'Doggo', icon: '🐕', when: (s) => !mateIs(s, 'steve'),
    text: () => '<p>A scruffy soi dog looks at you. You look at the soi dog. You decide, with the confidence of nine drinks, to pat the soi dog.</p>',
    choices: (s) => [
      { t: 'Pat it', go(s, R) {
        if (R.chance(0.35)) { R.hp(-8); R.cash(-p(s, 80)); return `Bitten. On the bum, somehow. Five rabies shots at the clinic, ${fmt(p(s, 80))}. Worth it? The dog thought so.`; }
        if (s.mates.length < D.MAX_MATES && R.chance(0.5)) { R.addMate('steve'); return 'It licked your hand and followed you home. His name is Steve now. Steve is a good boy.'; }
        return 'Good dog. Very good dog. It let you pat it and then walked off to a better offer.';
      } },
      { t: 'Give it your kebab', go(s, R) { if (s.mates.length < D.MAX_MATES && R.chance(0.6)) { R.addMate('steve'); return 'That was all it took. He\'s yours now. You name him Steve. He guards your stuff.'; } return 'It ate the kebab and left. Typical.'; } },
      { t: 'Back away slowly', go: () => 'The dog respected that. Dogs here are smarter than you.' },
    ],
  },
  st_toastie: {
    kind: 'stupid', c: ['TH'], title: '3am 7-Eleven', icon: '🥪',
    text: () => '<p>3am. 7-Eleven. The glowing fridge. The ham and cheese toastie, heated in that machine by a sleepy teenager. A meal of the gods.</p>',
    choices: [
      { t: 'Eat two', go(s, R) { R.hp(8); return 'Bliss. You are restored. Your mother would weep at how happy you are right now.'; } },
      { t: 'Eat five', go(s, R) { R.hp(3); return 'Five toasties and a chocolate milk. You stood outside the 7-Eleven at 3:30am, a king.'; } },
    ],
  },
  st_lantern: {
    kind: 'stupid', title: 'Sky Lantern', icon: '🏮',
    text: () => '<p>You have a sky lantern. You also have a lighter. You are indoors.</p>',
    choices: (s) => [
      { t: 'Light it anyway', go(s, R) { R.cash(-p(s, 50)); return `It floated majestically up to the ceiling and set fire to a poster of Bob Marley. ${fmt(p(s, 50))} for a new poster. Bob would have understood.`; } },
      { t: 'Take it outside', go(s, R) { R.hp(3); return 'It drifted up over the town. You made a wish. The wish was for a kebab. It came true.'; } },
    ],
  },
  st_anthem: {
    kind: 'stupid', title: 'Advance Australia Fair', icon: '🦘',
    text: () => '<p>You climb on a table and start singing the national anthem. You don\'t know the second verse. Nobody does.</p>',
    choices: [
      { t: 'Commit', go(s, R) { if (R.chance(0.5)) { R.drink(3); return 'Twelve other Aussies stood up and joined in. A tear rolled down a Queenslander\'s cheek. Free drinks.'; } R.hp(-5); return 'The table broke. You fell into a Danish girl\'s pad thai.'; } },
      { t: 'Switch to "Khe Sanh" halfway', go(s, R) { R.charmTemp(1, 2); return 'A seamless transition. Every Aussie in the room screamed the chorus. Unity.'; } },
    ],
  },

  // =============================================================================================
  // SLEEP
  // =============================================================================================
  sl_bedbugs: {
    kind: 'sleep', stay: ['dorm', 'guest', 'beach'], title: 'Bedbugs', icon: '🐛', w: 1.5,
    text: () => '<p>You wake up covered in itchy red bites, in neat little rows of three. Breakfast, lunch and dinner. Bedbugs had a buffet, and you were it.</p>',
    choices: (s) => [
      { t: 'Scratch', go(s, R) { s.itchy = 5; R.hp(-4); return 'You scratched until you bled. You will be itchy for days. Women can tell.'; } },
      { t: 'Tiger Balm everything', req: (s) => (has(s, 'tigerbalm') ? '' : 'No Tiger Balm'), go(s, R) { R.take('tigerbalm'); s.itchy = 2; return 'You smell like a menthol factory, but the itching stopped. Mostly.'; } },
      { t: 'Burn your sheets in the courtyard', go(s, R) { s.itchy = 3; R.cash(-p(s, 20)); return 'Satisfying. The hostel fined you. Other guests applauded.'; } },
    ],
  },
  sl_mouse: {
    kind: 'sleep', stay: ['guest', 'hammock', 'homestay', 'beach'], title: 'Midnight Visitor', icon: '🐭', w: 1.3,
    text: () => '<p>3am. Something small and warm runs up your arm and sits on your chest. You open your eyes. It\'s a mouse. It\'s looking at you. You\'re looking at it.</p>',
    choices: [
      { t: 'Name him Gerald', go(s, R) { R.hp(3); return 'Gerald stayed till dawn. You told him everything. He was a great listener.'; } },
      { t: 'Scream', go(s, R) { R.hp(-3); return 'You screamed. Gerald screamed. A family of rats under the floor screamed. Nobody slept.'; } },
      { t: 'Fight the mouse', go(s, R) { const f = R.fight('wildlife', -0.2); return f.won ? 'You won. You feel bad about it. You feel bad about a lot of things.' : `The mouse won. It bit your finger and escaped with your last Mentos. −${f.dmg} ❤️`; } },
    ],
  },
  sl_snorer: {
    kind: 'sleep', stay: ['dorm'], title: 'The Snorer', icon: '😴', w: (s) => (has(s, 'earplugs') ? 0.2 : 1.3),
    text: () => '<p>A 6\'7" Dutchman in the bunk below you is snoring like a leaf blower in a bin. The whole dorm is awake. Somebody is crying.</p>',
    choices: (s) => [
      { t: 'Throw a thong at him', go(s, R) { if (R.chance(0.5)) return 'Bullseye. He rolled over. The dorm gave you a standing ovation in their undies.'; R.hp(-3); return 'Missed. Hit a German girl instead. She threw it back harder.'; } },
      { t: 'Earplugs', req: (s) => (has(s, 'earplugs') ? '' : 'No earplugs'), go: () => 'Deep, silent, beautiful sleep. $2 well spent.' },
      { t: 'Suffer', go(s, R) { R.hp(-6); return 'Four hours of it. You know every note now. You could perform it.'; } },
    ],
  },
  sl_couple: {
    kind: 'sleep', stay: ['dorm'], title: '"We\'re Being Quiet"', icon: '🙉',
    text: () => '<p>The couple in the bunk beneath you are "being quiet". They are not being quiet. The bunk is moving. You are moving.</p>',
    choices: [
      { t: 'Cough loudly', go: () => 'They paused. For 30 seconds. Then the bunk resumed.' },
      { t: 'Slow clap at the end', go(s, R) { R.charmTemp(1, 2); return 'The whole dorm joined in. You\'re a hero to everyone except them.'; } },
      { t: 'Go sleep on the beach', go(s, R) { R.hp(-4); return 'Crabs. Sand. A drunk Swede singing ABBA. Better than the alternative.'; } },
    ],
  },
  sl_theft: {
    kind: 'sleep', stay: ['dorm', 'beach', 'hammock'], title: 'Light Fingers', icon: '🦹', w: (s) => (has(s, 'padlock') || mateIs(s, 'steve') ? 0.3 : 1.2),
    text: (s) => (mateIs(s, 'steve') ? '<p>3am. Growling. Soi Dog Steve has someone pinned against the lockers. A man in a Liverpool shirt is apologising profusely.</p>' : has(s, 'padlock') ? '<p>In the night, someone tried to open your locker. Your padlock held. There are scratch marks.</p>' : '<p>You wake up. Your bag is open. Your bag was not open when you went to sleep.</p>'),
    choices: (s) => (mateIs(s, 'steve') || has(s, 'padlock')
      ? [{ t: mateIs(s, 'steve') ? 'Good boy, Steve' : 'Thank the padlock', go: (s, R) => (mateIs(s, 'steve') ? (R.hp(2), 'Steve got the last of your toastie as a reward. He deserved it.') : 'Best $4 you ever spent.') }]
      : [{ t: 'Check the damage', go(s, R) { if (R.chance(0.5)) { const n = R.cash(-Math.round(Math.min(s.cash * 0.25, 200))); return `They took ${fmt(-n)} from your sock. Your sock! The sacred sock!`; } const it = R.loseRandom(); return it ? `They took your ${it.toLowerCase()}. Why?? Who would want that?` : 'They found nothing worth stealing. That\'s the saddest part.'; } }]),
  },
  sl_beach: {
    kind: 'sleep', stay: ['beach'], title: 'Beach Bum', icon: '🦀',
    text: () => '<p>You wake up with sand in places sand should never be, a crab in your thong, and a scruffy stray dog asleep against your back, keeping you warm.</p>',
    choices: (s) => [
      { t: 'Adopt the dog', req: (s) => (mateIs(s, 'steve') ? 'You already have Steve' : s.mates.length >= D.MAX_MATES ? 'Crew is full' : ''), go(s, R) { R.addMate('steve'); return 'You name him Steve. Steve is a very good boy. Steve guards your stuff now.'; } },
      { t: 'Shoo and stretch', go(s, R) { R.hp(-2); return 'Your back makes a noise like a Pringles tube being opened.'; } },
    ],
  },
  sl_cops: {
    kind: 'sleep', stay: ['beach'], title: 'Torch in the Face', icon: '🔦',
    text: (s) => `<p>A torch in your face at 4am. It's ${C(s).cop}. "No sleeping on beach." Then, after a pause: "Fine."</p>`,
    choices: (s) => [
      { t: 'Pay the fine', sub: fmt(p(s, 15)), go(s, R) { R.cash(-p(s, 15)); return 'He took the cash and then sat down next to you to watch the sunrise. Weird. Nice, though.'; } },
      { t: 'Run into the sea', go(s, R) { R.hp(-4); return 'He did not follow you into the sea. You waited out there for 40 minutes. He waited too. Then you paid.'; } },
    ],
  },
  sl_resort: {
    kind: 'sleep', stay: ['resort', 'hotel'], title: 'The Minibar', icon: '🧊',
    text: () => '<p>The minibar is humming at you. Softly. Seductively. There are tiny bottles in there. They are calling your name.</p>',
    choices: (s) => [
      { t: 'Raid it', sub: fmt(p(s, 70)), go(s, R) { R.cash(-p(s, 70)); R.drink(6); return 'Six tiny bottles and a $14 Toblerone. You lined the empties up on the windowsill like trophies.'; } },
      { t: 'Room service', sub: fmt(p(s, 25)), go(s, R) { R.cash(-p(s, 25)); R.hp(6); return 'A club sandwich on a silver tray at 1am. You ate it in the fluffy robe. You have never been happier.'; } },
      { t: 'Resist', go(s, R) { R.hp(3); return 'You resisted. You slept 11 hours. Your liver sent a fruit basket.'; } },
    ],
  },
  sl_happywater: {
    kind: 'sleep', stay: ['homestay'], title: 'The Host Family', icon: '🏡', w: 2.5,
    text: (s) => `<p>After dinner, the grandfather of your host family produces a plastic water bottle full of homemade ${localDrink(s)}. He pours you a shot. He pours himself a shot. He will not be taking no for an answer. Nobody ever has.</p>`,
    choices: (s) => [
      { t: 'Drink with the family', go(s, R) { R.drink(7); R.hp(-2); return `${C(s).cheers} By midnight you've learned two words of the language, three family secrets and a dance. You're invited to a wedding next month.`; } },
      { t: 'Politely decline', go(s, R) { R.drink(3); return 'You tried to decline. He poured anyway. You drank. This is the way.'; } },
    ],
  },
  sl_cockroach: {
    kind: 'sleep', stay: ['guest', 'dorm'], title: 'The Cockroach', icon: '🪳',
    text: () => '<p>A cockroach the size of a Tim Tam is sitting on your pillow. It has wings. It knows how to use them.</p>',
    choices: [
      { t: 'Thong it', go(s, R) { if (R.chance(0.6)) return 'Direct hit. You are the apex predator of this guesthouse.'; R.hp(-3); return 'It flew directly at your face. You fell out of bed. It\'s still in there somewhere.'; } },
      { t: 'Sleep next to it', go(s, R) { R.hp(-2); return 'You made peace. You woke up and it was gone. That\'s worse. Where did it go?'; } },
    ],
  },
  sl_hotelac: {
    kind: 'sleep', stay: ['hotel', 'guest'], title: 'The Aircon', icon: '❄️',
    text: () => '<p>The aircon has two settings: "off" and "Antarctic research station". The remote is in Thai and has 40 buttons.</p>',
    choices: [
      { t: 'Antarctic', go(s, R) { R.hp(-2); return 'You woke up with a cold. In the tropics. Classic.'; } },
      { t: 'Off', go(s, R) { R.hp(-2); return 'You woke up in a puddle of your own sweat, shaped like you.'; } },
      { t: 'Press every button', go(s, R) { R.hp(4); return 'You found the perfect setting. You will never find it again.'; } },
    ],
  },

  // =============================================================================================
  // REMOTE NIGHTS (no bar)
  // =============================================================================================
  rm_campfire: {
    kind: 'remote', title: 'Campfire', icon: '🔥', w: 2,
    text: () => '<p>Some other travellers have a campfire going. Someone has a bottle. Someone has a guitar. Someone has a theory about the pyramids.</p>',
    choices: [
      { t: 'Join them', go(s, R) { R.drink(4); const m = R.freeMate(); if (m && s.mates.length < D.MAX_MATES && R.chance(0.35)) { R.addMate(m); return `You shared the bottle until 2am. ${D.MATES[m].name} from ${D.MATES[m].from} is joining you on the road.`; } return 'You shared the bottle until 2am. The pyramid guy was very persuasive.'; } },
      { t: 'Stay in your hammock', go: () => 'You listened to the guitar from your hammock. Wonderwall, distant, like a wounded animal.' },
    ],
  },
  rm_guide: {
    kind: 'remote', title: 'The Guide', icon: '🧭',
    text: (s) => `<p>Your local guide, a cheerful man who walked up here in sandals, offers you a swig of ${localDrink(s)} from a hip flask.</p>`,
    choices: [
      { t: 'Take a swig. Then another.', go(s, R) { R.drink(3); return 'It burns all the way down and keeps burning. You\'re best friends now.'; } },
      { t: 'Ask him about the mountain', go(s, R) { s.nextPhoto = 1.3; R.info('Next landmark pic +30%'); return 'He tells you about a hidden viewpoint. Next landmark pic is worth 30% more.'; } },
    ],
  },
  rm_stars: {
    kind: 'remote', title: 'The Milky Way', icon: '🌌',
    text: () => '<p>No bar. No wifi. No 7-Eleven. Just the Milky Way, the sound of insects, and the terrifying realisation that you are alone with your own thoughts.</p>',
    choices: [
      { t: 'Think about your life', go(s, R) { R.hp(6); return 'You thought about your life. Mostly about a girl in Year 9. Then you fell asleep. A good night.'; } },
      { t: 'Sing "Khe Sanh" to the jungle', go(s, R) { R.hp(3); return 'The jungle went quiet, then a gibbon joined in. It knew the words better than you.'; } },
    ],
  },

  // =============================================================================================
  // WANDERING (day)
  // =============================================================================================
  wd_tuktuk: {
    kind: 'wander', c: ['TH', 'KH'], title: 'The 20-Baht Tour', icon: '🛺',
    text: () => '<p>A tuk-tuk driver offers you a city tour for twenty baht. Seventy cents. "Only one quick stop at my friend\'s shop. He give me petrol coupon."</p>',
    choices: (s) => [
      ...(mateIs(s, 'bazza') || mateIs(s, 'nong') ? [{ t: `Look at ${mateIs(s, 'nong') ? 'Nong' : 'Bazza'}`, go: () => `${mateIs(s, 'nong') ? 'Nong' : 'Bazza'} just shakes their head slowly. You walk on.` }] : []),
      { t: 'Hop in and buy nothing', go(s, R) { R.hp(-3); const pts = R.photo({ id: 'tuk_' + s.city, name: `Some random temple in ${cityName(s)}`, r: 12 }); return `You saw a temple${pts ? ' (photo!)' : ''} and four gem shops. At every gem shop you said no. It took six hours. The driver hates you.`; } },
      { t: 'Buy the "investment-grade sapphire"', sub: fmt(p(s, 150)), req: afford((s) => p(s, 150)), go(s, R) { R.cash(-p(s, 150)); return 'You can sell it in Australia for 10 times the price! (You cannot. It is glass. You will find out at a Prouds in Penrith.)'; } },
    ],
  },
  wd_closed: {
    kind: 'wander', city: ['bkk'], title: '"Palace Closed Today"', icon: '🚫',
    text: () => '<p>A friendly man in a polo shirt and lanyard tells you the Grand Palace is closed today for a "special Buddhist holiday". Luckily he knows a better temple. And a tuk-tuk. And a tailor.</p>',
    choices: (s) => [
      { t: 'Trust him', go(s, R) { R.cash(-p(s, 45)); R.leaveKsr(); return `It was not closed. You learned this at 6pm after a suit fitting and a lucky Buddha "donation". ${fmt(p(s, 45))} poorer and wiser.`; } },
      { t: 'Ignore him', go: () => 'The oldest scam in the book. You are a seasoned traveller now.' },
    ],
  },
  wd_monkchat: {
    kind: 'wander', c: ['TH', 'LA'], title: 'Monk Chat', icon: '🧡',
    text: () => '<p>A sign outside a temple: "MONK CHAT. Monks want to practise English with you." A young monk waves you over.</p>',
    choices: [
      { t: 'Have a chat', go(s, R) { R.hp(6); R.charmTemp(1, 3); return 'He asked what a "bogan" is. You explained for 40 minutes with diagrams. He said "ah, like a farang who lives here". Fair.'; } },
      { t: 'Ask him for footy tips', go(s, R) { R.hp(3); return 'He picked Collingwood. You don\'t know how he knows about Collingwood. Nobody should have to know about Collingwood.'; } },
    ],
  },
  wd_food: {
    kind: 'wander', title: 'Street Food', icon: '🍢', w: 1.5,
    text: () => '<p>A street stall is selling something grilled on a stick. It smells incredible. The woman at the grill has been doing this for 40 years. You think it\'s pork.</p>',
    choices: [
      { t: 'Eat five sticks', go(s, R) { if (R.chance(0.3)) return 'Incredible. Then, four hours later, catastrophic. ' + R.belly(); R.hp(8); return 'Best $3 you\'ve ever spent. You came back the next day. She remembered you.'; } },
      { t: 'Eat one', go(s, R) { R.hp(3); return 'Delicious, cautious, responsible. Your ancestors would be proud.'; } },
      { t: 'Go for the deep-fried bugs', go(s, R) { R.hp(2); R.charmTemp(1, 2); return 'Crickets, silkworms, a scorpion. Crunchy. You posted it. Mum commented "WHY".'; } },
    ],
  },
  wd_massage: {
    kind: 'wander', title: 'Massaaaage?', icon: '💆', w: (s) => (D.CITIES[s.city].tags.includes('remote') ? 0 : 1.2),
    text: () => '<p>A row of women in matching polo shirts calls out from a shopfront. "Massaaaage? Massaaaage, sir?" The sign says "Traditional Massage, 1 Hour".</p>',
    choices: (s) => [
      { t: 'Traditional massage', sub: fmt(p(s, 10)), go(s, R) { R.cash(-p(s, 10)); R.hp(12); return 'A tiny grandmother walked on your back, folded you like a deck chair and cracked bones you didn\'t know you had. You\'re reborn.'; } },
      { t: 'Ask about "extras"', go(s, R) { R.hp(4); R.charmTemp(-1, 2); return 'She slapped your hand. Hard. "This is a RESPECTABLE establishment." Then she massaged you extra roughly. Deserved.'; } },
      { t: 'Foot massage', sub: fmt(p(s, 6)), go(s, R) { R.cash(-p(s, 6)); R.hp(6); return 'You fell asleep in the chair and snored. They let you stay for an extra hour. Lovely people.'; } },
    ],
  },
  wd_market: {
    kind: 'wander', title: 'Market Bargain', icon: '🛍️', when: (s) => !D.CITIES[s.city].tags.includes('remote'),
    vars: (s, R) => { const opts = Object.entries(D.ITEMS).filter(([, it]) => it.shop && it.shop.length && it.price > 2); const [id, it] = R.pick(opts); return { id, price: Math.max(1, Math.round(it.price * C(s).price * 0.5)) }; },
    text: (s, v) => `<p>At the market, a lady is selling a <b>${D.ITEMS[v.id].name}</b> ${D.ITEMS[v.id].icon} for ${fmt(v.price)}. Half price. She looks like she wants to haggle.</p>`,
    choices: (s, v) => [
      { t: 'Buy it', sub: fmt(v.price), req: (s) => (s.cash < v.price ? 'Too poor' : full(s) ? 'Backpack full' : ''), go(s, R) { R.cash(-v.price); R.item(v.id); return 'Bargain. She looks pleased. Too pleased.'; } },
      { t: 'Haggle', req: (s) => (full(s) ? 'Backpack full' : ''), go(s, R) { if (R.chance(0.5)) { R.cash(-Math.ceil(v.price / 2)); R.item(v.id); return 'You haggled her down to a quarter price. She called you "a very hard man". You have never been prouder.'; } return 'You offered so little she took it as an insult to her family. She shooed you out of the market with a broom.'; } },
    ],
  },
  wd_scooter: {
    kind: 'wander', title: 'Gloriously Lost', icon: '🗺️',
    text: () => '<p>You take a wrong turn, then another. You have no data, no map, and no idea where you are. A dirt road leads up a hill.</p>',
    choices: [
      { t: 'Follow the dirt road', go(s, R) { if (R.chance(0.55)) { const pts = R.photo({ id: 'lost_' + s.city, name: `A hidden temple somewhere outside ${cityName(s)}`, r: 32 }); return pts ? 'At the top: a tiny, ancient, moss-covered temple that no blog has ever written about. Your photo is the only one on the internet.' : 'You found the hidden temple again. Still beautiful.'; } R.hp(-5); return 'At the top: a dog, a goat, and a man who sold you a warm Fanta. Long walk back.'; } },
      { t: 'Ask a local for directions', go(s, R) { R.hp(2); return 'She walked you all the way back to town and wouldn\'t take a cent. People are lovely.'; } },
    ],
  },
  wd_dogs: {
    kind: 'wander', c: ['TH', 'KH', 'LA', 'ID'], title: 'The Soi Dog Gang', icon: '🐕‍🦺', when: (s) => !mateIs(s, 'steve'),
    text: () => '<p>Five soi dogs block the lane. The biggest one, missing an ear, has decided you are the enemy of the people.</p>',
    choices: [
      { t: 'Run', go(s, R) { R.hp(-4); return 'They chased you for two blocks. You tripped into a noodle stall. The noodle lady also chased you.'; } },
      { t: 'Stand your ground', go(s, R) { const f = R.fight('wildlife', 0.2); return f.won ? 'You puffed up, roared like a drop bear, and they scattered. Legend.' : `One-Ear was not impressed. −${f.dmg} ❤️ and your left thong.`; } },
      { t: 'Throw them your chicken', go: () => 'Diplomacy. They ate the chicken. One-Ear lets you pass. For now.' },
    ],
  },
  wd_rain: {
    kind: 'wander', title: 'Monsoon', icon: '🌧️',
    text: () => '<p>The sky goes black. The monsoon arrives in 30 seconds flat. The street is ankle-deep. Then knee-deep. A man paddles past on a door.</p>',
    choices: (s) => [
      { t: 'Dance in it', go(s, R) { R.hp(3); R.charmTemp(1, 2); return 'You danced in the warm rain with a bunch of local kids. The best ten minutes of your trip.'; } },
      { t: 'Shelter in a bar', go(s, R) { R.cash(-p(s, 8)); R.drink(3); return 'It rained for four hours. You had to keep buying beers to justify being there. Tragic.'; } },
    ],
  },
  wd_footy: {
    kind: 'wander', title: 'Street Football', icon: '⚽',
    text: () => '<p>Kids are playing barefoot football in a temple car park. They need a goalie. They\'re pointing at you.</p>',
    choices: [
      { t: 'Play in goal', go(s, R) { if (R.chance(0.2)) { R.hp(-8); return 'A 9-year-old smashed one into your face. You saved it, technically. Rolled ankle on the way down.'; } R.hp(4); R.charmTemp(1, 2); return 'You let in 14 goals. The kids loved you. You are their favourite foreigner.'; } },
      { t: 'Teach them AFL', go(s, R) { R.hp(2); return 'Twenty minutes in, they were all doing hanger marks off a scooter. You\'ve started something.'; } },
    ],
  },
  wd_fortune: {
    kind: 'wander', title: 'Fortune Teller', icon: '🔮',
    text: () => '<p>A fortune teller in a plastic chair beckons you over. "I see... something for you." It\'s 20 bucks to find out what.</p>',
    choices: (s) => [
      { t: 'Cross her palm', sub: fmt(p(s, 20)), req: afford((s) => p(s, 20)), go(s, R) { R.cash(-p(s, 20)); if (R.chance(0.5)) { s.nextPhoto = 1.5; R.info('Next landmark pic +50%'); return '"You will find great treasure in a faraway place." Next landmark pic is worth 50% more.'; } R.charmTemp(1, 4); return '"Many women will love you. Not all at once. Calm down." Charm up.'; } },
      { t: 'Ask about your crypto', go: () => '"I see... a rug." You don\'t know what she means. You will.' },
    ],
  },
  wd_influencer: {
    kind: 'wander', title: 'Insta Husband', icon: '📸',
    text: () => '<p>An influencer couple asks you to take "just a couple of photos". You are now 140 photos in. She wants one more of her looking away from the camera, "naturally".</p>',
    choices: [
      { t: 'Keep going', go(s, R) { R.charmTemp(1, 3); return 'They tagged you in the post. 48k followers saw your thumb. Your thumb is famous.'; } },
      { t: 'Photobomb the last one', go(s, R) { R.charmTemp(1, 2); return 'You did a thumbs-up behind her. It became the most-liked photo on her page. She is furious. He is delighted.'; } },
    ],
  },
  wd_pharmacy: {
    kind: 'wander', title: 'The Rule-Free Pharmacy', icon: '💊', when: (s) => !D.CITIES[s.city].tags.includes('remote') && D.CITIES[s.city].c !== 'MY',
    text: () => '<p>A pharmacy with no apparent rules. The man behind the counter is eating a mango. He will sell you anything. He asks what you need.</p>',
    choices: (s) => [
      { t: 'Antibiotics, just in case', sub: fmt(p(s, 12)), req: (s) => (full(s) ? 'Backpack full' : s.cash < p(s, 12) ? 'Too poor' : ''), go(s, R) { R.cash(-p(s, 12)); R.item('antibiotics'); return 'He handed you a blister pack with no writing on it. "For everything," he says. Comforting.'; } },
      { t: 'Imodium', sub: fmt(p(s, 5)), req: (s) => (full(s) ? 'Backpack full' : ''), go(s, R) { R.cash(-p(s, 5)); R.item('imodium'); return 'A wise purchase. Future you is grateful.'; } },
      { t: 'Ask if he has Vegemite', go: () => 'He doesn\'t know what that is. You describe it. He looks at you with pity.' },
    ],
  },
  wd_courier: {
    kind: 'wander', c: ['TH', 'KH'], tags: ['seedy'], title: '"My Cousin Needs a Favour"', icon: '📦', cd: 6,
    when: (s) => !has(s, 'package'),
    vars: (s, R) => ({ job: R.courier() }),
    text: (s, v) => `<p>A tuk-tuk driver pulls up beside you. "My friend! My cousin need small favour. Take a present to his brother in <b>${v.job.destName}</b>. He pay you <b>${fmt(v.job.pay)}</b>." There's a taped-up parcel on the seat. It is the size and weight of a brick.</p><p class="warn">Crossing a border with it risks prison. Flights are the riskiest.</p>`,
    choices: (s, v) => [
      { t: 'Take the package', sub: `${fmt(v.job.pay)} on delivery`, req: (s) => (full(s) ? 'Backpack full' : ''), go(s, R) { R.takePackage(v.job); return `"You good man!" He zooms off before you can change your mind. Get it to ${v.job.destName}.`; } },
      { t: 'Walk away', go: () => 'You walked away. You walked fast.' },
    ],
  },
  wd_cricket: {
    kind: 'wander', when: (s) => !D.CITIES[s.city].tags.includes('remote'), title: 'The Cricket\'s On', icon: '🏏',
    text: () => '<p>You find an Irish pub with the cricket on. Australia are batting. There are three other Aussies and a confused Indian family who also support Australia, for some reason.</p>',
    choices: (s) => [
      { t: 'Settle in for the day', sub: fmt(p(s, 15)), go(s, R) { R.cash(-p(s, 15)); R.drink(5); R.hp(3); return 'Australia won. You cried. The Indian family cried. Everyone hugged.'; } },
      { t: 'Just one', go(s, R) { R.drink(1); return 'Just one. Australia lost a wicket the second you left. Your fault.'; } },
    ],
  },

  // =============================================================================================
  // WORK (hostel shifts)
  // =============================================================================================
  wk_vomit: {
    kind: 'work', title: 'Shift Report', icon: '🪣',
    text: () => '<p>Your shift involved cleaning vomit off a pool table. It was not the first time that pool table had vomit on it. It was not even the first time today.</p>',
    choices: [
      { t: 'Get on with it', go(s, R) { R.cash(10); R.hp(-2); return 'The manager gave you a $10 tip for "not complaining". You complained a lot, internally.'; } },
      { t: 'Bribe the night guy to do it', go(s, R) { R.cash(-8); return 'Eight bucks. Best money you\'ve spent. He has seen worse.'; } },
    ],
  },
  wk_towels: {
    kind: 'work', title: 'More Towels?', icon: '🛁',
    vars: (s, R) => ({ who: R.pick(D.PARTNERS).join(' from ') }),
    text: (s, v) => `<p>${v.who} keeps coming to the front desk to ask for "more towels". She's asked six times. She has 11 towels.</p>`,
    choices: (s, v) => [
      { t: 'Deliver the towels personally', go(s, R) { const r = R.hook(0.25, { who: v.who }); return hook(r, 'You delivered the towels. You stayed a while.', 'She actually just really needed towels. She\'s doing a very elaborate towel art project.'); } },
      { t: 'Stay professional', go: () => 'You are a consummate professional. The manager is impressed. She checked out the next day, still with 11 towels.' },
    ],
  },
  wk_tokens: {
    kind: 'work', title: 'Payday', icon: '🪙',
    text: (s, v) => `<p>The hostel owner, Mr Lek, apologises. Cash flow problem. Today he\'ll pay you in drink tokens instead. "Better, yes?"</p>`,
    choices: (s, v) => [
      { t: 'Take the tokens', go(s, R) { R.cash(-(v.pay || 0)); R.drink(8); return 'Eight free drinks. Honestly, it is better.'; } },
      { t: 'Demand cash', go(s, R) { if (R.chance(0.5)) return 'He sighed, dug through a biscuit tin and paid you in coins.'; R.cash(-(v.pay || 0)); return 'He "found" a typo in your hours. You were paid nothing. Classic Mr Lek.'; } },
    ],
  },
  wk_crawl: {
    kind: 'work', title: 'Pub Crawl Leader', icon: '📣',
    text: () => '<p>The usual pub crawl leader is "sick" (hungover). You get the megaphone, the fluoro singlet and 60 drunk backpackers.</p>',
    choices: [
      { t: 'Lead them to glory', go(s, R) { R.drink(8); R.cash(25); const r = R.hook(0.08, { bar: 'bp' }); return hook(r, `You were a natural. ${r.who} said you were "very commanding with the megaphone".`, 'You lost 14 people somewhere between bars two and three. Nobody noticed. $25 tips.'); } },
      { t: 'Hand the megaphone to an Irish girl', go(s, R) { R.drink(4); return 'She was born for it. Best crawl in hostel history. You just followed along drinking.'; } },
    ],
  },

  // =============================================================================================
  // MORNINGS
  // =============================================================================================
  mn_std: {
    kind: 'forced', title: 'Something\'s Not Right', icon: '🦠',
    text: (s) => { const q = D.STDS.find((x) => x.id === s.std.id); return `<p>Something is... wrong. Downstairs. It itches, it burns, and it seems to have its own personality.</p><p>A quick Google tells you it's probably <b>${q.name}</b>. It will drain ${q.drain} health a day until you deal with it. <span class="dim">Condoms cut the risk by 90%, legend.</span></p>`; },
    choices: (s) => [
      { t: 'Go to the clinic', sub: D.CITIES[s.city].tags.includes('remote') ? 'No clinic out here' : fmt(p(s, 90)), req: (s) => (D.CITIES[s.city].tags.includes('remote') ? 'No clinic here' : s.cash < p(s, 90) ? 'Too poor' : ''), go(s, R) { R.cash(-p(s, 90)); s.std = null; return 'An injection in the bum and a lecture from a doctor who has seen a thousand of you. Cured. Wrap it up next time.'; } },
      { t: 'Take the dodgy antibiotics', req: (s) => (has(s, 'antibiotics') ? '' : 'You have none'), go(s, R) { R.take('antibiotics'); if (R.chance(0.6)) { s.std = null; return 'It worked! Probably. You\'re not looking down there for a week.'; } return 'They did nothing. Except give you a rash somewhere else, too.'; } },
      { t: 'She\'ll be right', go: () => 'She will not be right.' },
    ],
  },
  mn_hangover: {
    kind: 'morning', title: 'The Morning After', icon: '🥴', when: (s) => s.hungover,
    text: () => '<p>You wake up in a hammock that isn\'t yours, with a Sharpie moustache, one thong and a wristband from a bar you don\'t remember.</p>',
    choices: (s) => [
      { t: 'Hair of the dog', go(s, R) { R.drink(2); return 'Two beers for breakfast. You feel incredible. This will catch up with you.'; } },
      { t: 'Find a bowl of noodle soup', sub: fmt(p(s, 3)), go(s, R) { R.cash(-p(s, 3)); R.hp(6); s.hungover = false; return 'The broth of life. You are human again.'; } },
    ],
  },
  mn_facebook: {
    kind: 'morning', title: 'Mum Posted', icon: '📘', once: true, when: (s) => s.flags.volunteer && s.day - s.flags.volunteer >= 3,
    text: () => '<p>Mum posted about your "volunteering at an orphanage" on Facebook. 84 likes. Your cousin Brayden commented: "lol he\'s literally at the full moon party". There is a photo.</p>',
    choices: [
      { t: 'Call her and grovel', go(s, R) { R.mum(-2); return 'She knows. She has always known. She\'s just disappointed.'; } },
      { t: 'Block Brayden', go(s, R) { R.mum(-3); return 'Brayden screenshots it to the family chat before you can. Mum leaves the chat.'; } },
    ],
  },
  mn_enforcer: {
    kind: 'morning', title: 'About That Package', icon: '🕶️', when: (s) => s.flags.dumped && s.day - s.flags.dumped >= 2,
    text: () => '<p>Two large men in matching Manchester United shirts are waiting outside your accommodation. They would like to "discuss" the package you chucked.</p>',
    choices: (s) => [
      { t: 'Pay them off', sub: fmt(p(s, 700)), req: afford((s) => p(s, 700)), go(s, R) { R.cash(-p(s, 700)); s.flags.dumped = 0; return 'They counted it, nodded, and recommended a good pad thai place. Professional.'; } },
      { t: 'Fight', go(s, R) { s.flags.dumped = 0; const f = R.fight('local', 0.3); return f.won ? 'You fought them both and somehow won. You don\'t know how. Neither do they. They give you a respectful nod.' : `They broke two of your fingers, politely. −${f.dmg} ❤️. "Consider it settled."`; } },
      { t: 'Run', go(s, R) { s.flags.dumped = 0; R.hp(-10); return 'You ran for nine blocks, through a wet market and over a chicken. They let you go. You\'re still shaking.'; } },
    ],
  },
  mn_matebye: {
    kind: 'morning', title: 'Changing Plans', icon: '👋', when: (s) => s.mates.filter((m) => m !== 'steve').length > 0,
    vars: (s, R) => ({ m: R.pick(s.mates.filter((m) => m !== 'steve')), why: R.pick(['met a German girl and is moving to Pai permanently', 'has decided to open a smoothie bar on Koh Rong', 'got a job as a dive instructor', 'is going home: his nan is sick (his nan is not sick)', 'has found God. A specific one. In Bali.']) }),
    text: (s, v) => `<p>${D.MATES[v.m].name} ${v.why}. They\'re leaving today.</p>`,
    choices: (s, v) => [
      { t: 'Big hug, safe travels', go(s, R) { R.loseMate(v.m); R.hp(2); return 'A big emotional hug at the bus station. You\'ll see each other at someone\'s wedding.'; } },
      { t: 'Convince them to stay', go(s, R) { if (R.chance(0.5)) return 'One more bucket did it. They\'re staying. Of course they are.'; R.loseMate(v.m); return 'They left anyway. You found their thongs on your bunk. A parting gift.'; } },
    ],
  },
  mn_pump: {
    kind: 'morning', title: 'Number Go Up', icon: '📈', when: (s) => Object.keys(s.coins).length > 0,
    vars: (s, R) => ({ k: R.pick(Object.keys(s.coins)) }),
    text: (s, v) => `<p>Your phone is buzzing. $${v.k} is pumping. A Kardashian tweeted a ${D.COINS[v.k].icon} emoji and the whole internet lost its mind.</p>`,
    choices: (s, v) => [
      { t: 'HODL', go(s) { s.px[v.k] *= 1.9; return `$${v.k} nearly doubled overnight. Diamond hands. 💎🙌`; } },
    ],
  },
  mn_buffalo: {
    kind: 'morning', title: 'The Sick Buffalo', icon: '🐃', when: (s) => s.flags.barfine && s.day - s.flags.barfine <= 4, once: true,
    text: (s) => `<p>A message from the girl from the bar fine. Her family\'s buffalo back home is very sick. The vet is ${fmt(p(s, 200))}. She sends three crying emojis and a photo of a buffalo.</p>`,
    choices: (s) => [
      { t: 'Send the money', sub: fmt(p(s, 200)), go(s, R) { R.cash(-p(s, 200)); return 'She says thank you. The buffalo makes a miraculous recovery. So do four other buffaloes, sent to four other men, that week.'; } },
      { t: 'Ask for a video of the buffalo', go: () => 'She sends a video of a different buffalo. It looks very healthy. You leave her on read.' },
    ],
  },
  mn_engaged: {
    kind: 'morning', title: 'You\'re Engaged', icon: '💍', when: (s) => s.flags.engaged && s.day - s.flags.engaged >= 1, once: true,
    text: () => '<p>You wake up and remember: you are engaged. There\'s a text. "Morning fiancé!! 💍 My parents want to FaceTime!!"</p>',
    choices: [
      { t: 'FaceTime the in-laws', go(s, R) { R.mum(-1); return 'Her dad asked about your career prospects. You said "hostel bar". The engagement was called off by lunch.'; } },
      { t: 'Change your number', go: () => 'You bought a new SIM card at 7-Eleven. Your old life is gone. You\'re a ghost.' },
    ],
  },
  mn_viral: {
    kind: 'morning', title: 'Going Viral', icon: '🔥', when: (s) => s.photos.length > 2,
    text: () => '<p>One of your landmark pics is going viral in Brazil. Nobody knows why. 200,000 likes. The comments are all in Portuguese and all appear to be about your calves.</p>',
    choices: [{ t: 'Flex the calves', go(s, R) { R.charmTemp(2, 4); return 'You are a minor celebrity in São Paulo. Women at the hostel recognise you. It\'s a strange time.'; } }],
  },
  mn_rooster: {
    kind: 'morning', title: 'The Rooster', icon: '🐓',
    text: () => '<p>A rooster starts crowing at 4am directly outside your window. Then it crows at 4:05. And 4:10. And every five minutes, forever.</p>',
    choices: [
      { t: 'Accept your fate', go(s, R) { R.hp(-3); return 'You did not get back to sleep. Neither did anyone else in this town, ever.'; } },
      { t: 'Have a word with it', go(s, R) { const f = R.fight('wildlife', 0.1); return f.won ? 'You chased it off. It came back. It always comes back.' : `The rooster won. It went for your eyes. −${f.dmg} ❤️`; } },
    ],
  },
  mn_dengue: {
    kind: 'morning', title: 'Mozzie Bites', icon: '🦟', when: (s) => !s.inv.some((x) => x.id === 'mozzie'),
    text: () => '<p>You count 47 mozzie bites. Most of them are on your face. One is on your eyelid. You feel feverish.</p>',
    choices: (s) => [
      { t: 'Hydrate and hope', go(s, R) { if (R.chance(0.25)) { R.hp(-18); return 'Dengue fever. Three days of feeling like you were run over by a tuk-tuk full of bricks. You lived.'; } R.hp(-3); return 'Just a mild fever. Sweated it out. Buy some repellent, mate.'; } },
    ],
  },

  // =============================================================================================
  // CITY ACTIVITIES (act_<id>)
  // =============================================================================================
  act_muaythai: {
    kind: 'act', title: 'Muay Thai Fight Night', icon: '🥊', sub: 'Fight for a purse, or just bet',
    text: (s) => `<p>The local stadium is running a tourist fight night. They need a foreigner for the third bout. The purse is ${fmt(p(s, 100))}. Your opponent weighs 54 kg, is 17, and has had 180 fights.</p>`,
    choices: (s) => [
      { t: 'Fight', sub: `Win ${fmt(p(s, 100))}`, go(s, R) { s.ksr = s.city === 'bkk' ? false : s.ksr; const f = R.fight('local', 0.15); if (f.won) { R.cash(p(s, 100)); R.charmTemp(2, 5); return 'You won! By standing up longer. The crowd chanted your name, mispronounced. You will tell this story at every barbecue for the rest of your life.'; } return `He kicked you in the liver. Your liver, which has been through enough. You went down like a sack of rice. −${f.dmg} ❤️`; } },
      { t: 'Bet on the local kid', sub: fmt(p(s, 20)), req: afford((s) => p(s, 20)), go(s, R) { if (R.chance(0.7)) { R.cash(Math.round(p(s, 20) * 0.4)); return 'He won in 40 seconds. You won a tiny amount of money, the odds were terrible.'; } R.cash(-p(s, 20)); return 'An upset! A Swede won! The whole stadium is silent. You owe a man money.'; } },
      { t: 'Just watch and drink', go(s, R) { R.drink(3); return 'You watched eight fights and drank eight beers. You now think you can fight. You cannot fight.'; } },
    ],
  },
  act_kstattoo: {
    kind: 'act', ksr: true, title: 'Khao San Tattoo', icon: '🖋️', sub: 'Permanent decisions, temporary sobriety', when: (s) => !s.flags.tattoo,
    text: (s) => `<p>A Khao San tattoo parlour. The artist has a face tattoo that says "PAIN". The flash on the wall includes a gecko, Bob Marley, and the word "Wanderlust" misspelled three different ways.</p>`,
    choices: (s) => [
      { t: 'Get "warrior" in Thai', sub: fmt(p(s, 30)), go(s, R) { R.cash(-p(s, 30)); s.flags.tattoo = true; R.ach('tattoo'); R.charmPerm(1); return 'It says "chicken fried rice". A Thai waitress laughed so hard she gave you a free beer. Women love it.'; } },
      { t: 'A Sak Yant (from a "monk" in Nikes)', sub: fmt(p(s, 60)), go(s, R) { R.cash(-p(s, 60)); s.flags.tattoo = true; R.ach('tattoo'); s.fightBase += 1; return 'Five rows of ancient script, hand-poked with a bamboo stick, by a 22-year-old called Bank who learned on YouTube. You feel invincible (+fight).'; } },
      { t: 'Chicken out', go: () => 'You bought a scorpion on a stick instead. Brave in a different way.' },
    ],
  },
  act_pingpong: {
    kind: 'act', title: 'A "Show" on Patpong', icon: '🏓', sub: 'Off Khao San. The flyer has a ping pong ball on it.',
    text: () => '<p>A tout on Patpong waves a laminated menu at you. It\'s a "show". It lists a series of "acts" involving ping pong balls, darts, and a live goldfish. The goldfish is the most worrying part.</p>',
    choices: (s) => [
      { t: 'Go in', sub: fmt(p(s, 45)), go(s, R) { R.cash(-p(s, 45)); R.drink(2); return 'You will never look at table tennis the same way. The bill included eight "drinks" you never ordered and a "show fee". The goldfish is fine. You are not.'; } },
      { t: 'Absolutely not', go: () => 'A wise decision. You go back to Khao San and buy a scorpion.' },
    ],
  },
  act_tuktuk: {
    kind: 'act', title: 'Hire a Tuk-Tuk for the Day', icon: '🛺', sub: 'Off Khao San. Sights, scams, a gem shop.',
    text: (s) => `<p>A tuk-tuk driver called "Lucky" offers you the whole day for ${fmt(p(s, 15))}. He promises temples. He also promises "very good suit".</p>`,
    choices: (s) => [
      { t: 'Deal', sub: fmt(p(s, 15)), go(s, R) {
        R.cash(-p(s, 15)); R.leaveKsr();
        const todo = D.CITIES.bkk.lm.filter((l) => !l.ksr && !s.photos.some((q) => q.id === l.id) && !l.ev);
        const got = todo.slice(0, 2).map((l) => (R.photo(l), l.name));
        let t = got.length ? `You saw ${got.join(' and ')}. Photos!` : 'You\'ve seen everything. Lucky took you to his cousin\'s house instead.';
        if (R.chance(0.5)) { R.cash(-p(s, 60)); t += ` Then Lucky took you to "very good suit". You left with a ${fmt(p(s, 60))} deposit on a suit you will never collect.`; }
        return t;
      } },
      { t: 'Walk instead', go(s, R) { R.hp(-3); return 'It was 38 degrees. You lasted 20 minutes and caught a tuk-tuk anyway.'; } },
    ],
  },
  act_cooking: {
    kind: 'act', title: 'Cooking Class', icon: '🍳', sub: 'Learn to make something other than toast',
    text: (s) => `<p>A half-day cooking class at a farm: market tour, curry paste with a mortar and pestle, and a certificate. ${fmt(p(s, 25))}.</p>`,
    choices: (s) => [
      { t: 'Sign up', sub: fmt(p(s, 25)), req: afford((s) => p(s, 25)), go(s, R) { R.cash(-p(s, 25)); R.hp(12); R.charmTemp(1, 5); return 'You can now make a green curry. You will make it for one girl, once, and it will be a triumph.'; } },
      { t: 'Just eat the class leftovers', go(s, R) { R.hp(4); return 'You hung around the back door and the cook fed you. Cheaper and the same result.'; } },
    ],
  },
  act_scooter: {
    kind: 'act', title: 'Rent a Scooter', icon: '🛵', sub: 'Freedom. Also road rash.',
    text: (s) => `<p>A scooter for the day: ${fmt(p(s, 8))}. No licence needed. No helmet included. The shop has a wall of photos of customers with bandaged legs. They call it the "Hall of Fame".</p>`,
    choices: (s) => [
      { t: 'Ride off into the hills', sub: fmt(p(s, 8)), go(s, R) {
        R.cash(-p(s, 8));
        const r = R.rnd();
        if (r < 0.3) { R.hp(-12); return 'You came off on gravel at the first bend. Your new "tattoo" is a bandage from knee to ankle. You\'re in the Hall of Fame now.'; }
        if (r < 0.8) { const pts = R.photo({ id: 'scoot_' + s.city, name: `A secret waterfall outside ${cityName(s)}`, r: 32 }); return pts ? 'You found a waterfall that isn\'t on Google Maps. You had it all to yourself. Glorious photo.' : 'You went back to your secret waterfall. Still yours.'; }
        return 'You rode around for six hours and found nothing but a 7-Eleven. It was a nice 7-Eleven.';
      } },
      { t: 'Hire a driver instead', sub: fmt(p(s, 20)), go(s, R) { R.cash(-p(s, 20)); const pts = R.photo({ id: 'scoot_' + s.city, name: `A secret waterfall outside ${cityName(s)}`, r: 32 }); return pts ? 'He took you to a secret waterfall. Safely. Like an adult.' : 'He took you to the waterfall you already found.'; } },
    ],
  },
  act_yoga: {
    kind: 'act', title: 'Yoga & Sound Bath Retreat', icon: '🧘', sub: 'Find yourself. Bring cash.',
    text: (s) => `<p>A day retreat: sunrise yoga, a sound bath, a cacao ceremony and a man called Sky who doesn't wear shoes. ${fmt(p(s, 45))}.</p>`,
    choices: (s) => [
      { t: 'Find yourself', sub: fmt(p(s, 45)), req: afford((s) => p(s, 45)), go(s, R) { R.cash(-p(s, 45)); R.hp(22); if (R.chance(0.3)) { const r = R.hook(0.1); return hook(r, `You found yourself. You also found ${r.who}, on the next mat. She loved your "energy".`, 'You found yourself. He was hungover. But your back has never been better.'); } return 'You found yourself. He was hungover. But your back has never been better.'; } },
      { t: 'Laugh at the sound bath', go(s, R) { R.charmTemp(-1, 2); return 'You laughed at the gong. Sky asked you to leave. Namaste.'; } },
    ],
  },
  act_mushroom: {
    kind: 'act', title: '"Magic" Shake', icon: '🍄', sub: 'The sign says "very happy". Whimsy guaranteed.',
    text: (s) => `<p>A beach shack sign: "MUSHROOM SHAKE — VERY HAPPY — ${fmt(p(s, 10))}". The man behind the counter has the calmest face you have ever seen.</p>`,
    choices: (s) => [
      { t: 'One very happy shake', sub: fmt(p(s, 10)), go(s, R) {
        R.cash(-p(s, 10));
        const r = R.rnd();
        if (r < 0.4) { R.hp(10); R.charmTemp(1, 3); return 'You watched the sunset for seven hours. It was the best day of your life. You hugged a palm tree. The palm tree hugged back.'; }
        if (r < 0.7) { R.hp(-6); return 'You spent four hours convinced you were a crab. You walked sideways into the sea. Two Germans had to bring you back.'; }
        s.nextPhoto = 1.5; R.info('Next landmark pic +50%'); return 'You had a long conversation with a coconut. It had excellent points about obscure landmarks. Next landmark pic +50%.';
      } },
      { t: 'Just a banana shake', go(s, R) { R.hp(2); return 'A very normal, very delicious banana shake. The calm man looked disappointed in you.'; } },
    ],
  },
  act_scuba: {
    kind: 'act', title: 'Go Diving', icon: '🤿', sub: 'Become insufferable about diving',
    text: () => '<p>The dive shop has two offers: a fun dive, or a four-day Open Water course that will turn you into one of those people who talks about diving.</p>',
    choices: (s) => [
      { t: 'Fun dive', sub: fmt(p(s, 60)), req: afford((s) => p(s, 60)), go(s, R) { R.cash(-p(s, 60)); if (R.chance(0.15)) { R.hp(-6); return 'You equalised wrong. Your ear is now full of the ocean. It may stay there.'; } R.hp(8); R.charmTemp(1, 3); return 'Turtles, a reef shark, a nudibranch the size of your thumb. Magic. You can\'t stop talking about it.'; } },
      { t: 'Open Water course', sub: fmt(p(s, 280)), req: afford((s) => p(s, 280)), go(s, R) { R.cash(-p(s, 280)); R.charmPerm(1); R.hp(5); return 'You\'re certified! You will now mention it within four minutes of meeting anyone, forever. Somehow, it works on people.'; } },
    ],
  },
  act_boozecruise: {
    kind: 'act', title: 'Booze Cruise', icon: '🛥️', sub: 'An open bar on a boat. What could go wrong?',
    text: (s) => `<p>A day-long party boat: open bar, island stops, a DJ called "DJ Hangover", and 80 backpackers. ${fmt(p(s, 35))}.</p>`,
    choices: (s) => [
      { t: 'Get on board', sub: fmt(p(s, 35)), req: afford((s) => p(s, 35)), go(s, R) {
        R.cash(-p(s, 35)); R.drink(10);
        if (R.chance(0.15)) { R.hp(-10); return 'You jumped off the top deck. You landed on a jellyfish. The DJ played "Under the Sea".'; }
        const pts = R.photo({ id: 'cruise_' + s.city, name: `Doing a backflip off a party boat near ${cityName(s)}`, r: 16 });
        const r = R.hook(0.06, { bar: 'bp' });
        return hook(r, `${r.who} and you were voted "Cutest Couple" by the DJ. You'd known each other for 20 minutes.`, `Ten drinks, four islands, one sunburn.${pts ? ' Got a great pic doing a backflip off the top deck.' : ''}`);
      } },
      { t: 'Wave it off from the pier', go: () => 'You watched them leave. You watched them come back, much louder.' },
    ],
  },
  act_tubing: {
    kind: 'act', title: 'Tubing the Nam Song', icon: '🛟', sub: 'Float down the river. The river has bars.',
    text: (s) => `<p>You rent an inner tube for ${fmt(p(s, 8))}. The river is slow and brown. Every 200 metres, a bar on the bank throws a rope to drag you in. There are swings. There are slides. There are buckets.</p>`,
    choices: (s) => [
      { t: 'Stop at every single bar', go(s, R) { R.cash(-p(s, 8) - p(s, 12)); R.drink(12); R.ach('tubing'); if (R.chance(0.3)) { R.hp(-15); return 'Seven bars, twelve drinks, one rock that came out of nowhere. You finished the river face down, still holding a bucket.'; } return 'Seven bars, twelve drinks, one bucket hat. You floated into town at sunset like a Viking funeral.'; } },
      { t: 'Just float', go(s, R) { R.cash(-p(s, 8)); R.drink(4); R.hp(4); R.ach('tubing'); return 'You floated, beer in hand, past the karsts. Peaceful. Glorious. You\'re a changed man (for one afternoon).'; } },
      { t: 'Do the giant rope swing', go(s, R) { R.cash(-p(s, 8)); R.drink(4); R.ach('tubing'); if (R.chance(0.4)) { R.hp(-20); return 'You let go too late. You hit the water flat, like a pancake, from 8 metres. Everyone heard it.'; } R.charmTemp(2, 4); return 'You let go at the perfect moment and did a backflip. The whole river cheered. A girl on a tube blew you a kiss.'; } },
    ],
  },
  act_buybike: {
    kind: 'act', title: 'The Honda Win', icon: '🏍️', sub: (s) => (has(s, 'bike') ? 'Sell your bike' : 'Buy a bike from a departing Dutchman'),
    text: (s) => (has(s, 'bike') ? '<p>A new arrival from Germany wants to buy your Honda Win. He\'s offering $150. It has no brakes and a horn that works on its own.</p>' : '<p>A tall Dutch guy is selling his Honda Win: "She has never let me down." It has done 300,000 km. It has a laminated map of Vietnam cable-tied to the handlebars. $220.</p>'),
    choices: (s) => (has(s, 'bike')
      ? [{ t: 'Sell for $150', go(s, R) { R.take('bike'); R.cash(150); return 'He hands over the cash. You don\'t tell him about the brakes. It\'s the circle of life.'; } }, { t: 'Keep her', go: () => 'You love her. She smells like petrol and adventure.' }]
      : [{ t: 'Buy it for $220', req: (s) => (s.cash < 220 ? 'Too poor' : full(s) ? 'Backpack full' : ''), go(s, R) { R.cash(-220); R.item('bike'); s.stats.bikeFrom = s.city; return 'She\'s yours. Land travel in Vietnam costs $3 and half the health, but watch the corners.'; } }, { t: 'Nah', go: () => 'He sells it to a Canadian. She will never let him down either.' }]),
  },
  act_eggcoffee: {
    kind: 'act', ksr: true, title: 'Egg Coffee', icon: '☕', sub: 'A custard that went to university',
    text: () => '<p>A tiny café up a dark staircase sells egg coffee: strong Vietnamese coffee topped with whipped egg yolk and condensed milk.</p>',
    choices: (s) => [{ t: 'Have three', sub: fmt(p(s, 4)), go(s, R) { R.cash(-p(s, 4)); R.hp(6); return 'Three egg coffees. You can hear colours. You can see time. You are very, very awake.'; } }],
  },
  act_tailor: {
    kind: 'act', title: 'Hoi An Tailor', icon: '🤵', sub: 'A three-piece suit by tomorrow', when: (s) => !has(s, 'suit'),
    text: (s) => `<p>Madame Linh measures you with a tape and a look of deep sadness. "I make you a suit. By tomorrow. ${fmt(p(s, 90))}. You look like James Bond. Maybe James Bond's cousin."</p>`,
    choices: (s) => [
      { t: 'Get the suit', sub: fmt(p(s, 90)), req: (s) => (s.cash < p(s, 90) ? 'Too poor' : full(s) ? 'Backpack full' : ''), go(s, R) { R.cash(-p(s, 90)); R.item('suit'); return 'It fits like a glove. A glove for a slightly different person. Fancy bars, here you come.'; } },
      { t: 'Just get some boardies made', sub: fmt(p(s, 10)), go(s, R) { R.cash(-p(s, 10)); R.charmTemp(1, 5); return 'Custom boardshorts with a kangaroo print. You\'re a genius.'; } },
    ],
  },
  act_shooting: {
    kind: 'act', title: 'The Shooting Range', icon: '🔫', sub: '+0 points, −$, +heaps of vibes',
    text: (s) => `<p>A shooting range on the outskirts. A man in camo hands you a laminated menu of guns. Some of them are on it twice. The rocket launcher is "price on application".</p>`,
    choices: (s) => [
      { t: 'Fire a few magazines', sub: fmt(p(s, 60)), req: afford((s) => p(s, 60)), go(s, R) { R.cash(-p(s, 60)); if (R.chance(0.15)) { R.hp(-4); return 'BANG. Your left ear will ring until 2041.'; } return 'You hit the target twice out of 30. The man in camo said "very good". He says that to everyone.'; } },
      { t: 'Ask about the rocket launcher', go: () => 'He named a price. You laughed. He didn\'t. You left.' },
    ],
  },
  act_happypizza: {
    kind: 'act', title: 'Happy Pizza', icon: '🍕', sub: '"Extra happy" is an option',
    text: (s) => `<p>The menu offers pizza in three strengths: "happy", "very happy" and "extra happy". ${fmt(p(s, 9))}.</p>`,
    choices: (s) => [
      { t: 'Extra happy', sub: fmt(p(s, 9)), go(s, R) { R.cash(-p(s, 9)); if (R.chance(0.6)) { R.hp(6); return 'You giggled for five hours, ordered three more pizzas, and had a deep connection with a gecko.'; } R.hp(-3); return 'You lost the whole afternoon to a staring contest with a fan. The fan won.'; } },
      { t: 'Regular pizza', sub: fmt(p(s, 6)), go(s, R) { R.cash(-p(s, 6)); R.hp(4); return 'A regular pizza. The waiter was confused. Honestly, so are you.'; } },
    ],
  },
  act_casino: {
    kind: 'act', title: 'The Casino', icon: '🎰', sub: 'Roulette, under chandeliers',
    text: () => '<p>A casino the size of a cathedral. Carpets designed to keep you awake, and a roulette table run by a croupier with no visible emotions.</p>',
    choices: (s) => [
      { t: `${fmt(p(s, 50))} on red`, req: afford((s) => p(s, 50)), go(s, R) { const n = p(s, 50); if (R.chance(18 / 37)) { R.cash(n); return 'RED! Double your money. You feel like a high roller.'; } R.cash(-n); return 'Black. Of course it was black.'; } },
      { t: `${fmt(p(s, 20))} on 17`, req: afford((s) => p(s, 20)), go(s, R) { const n = p(s, 20); if (R.chance(1 / 37)) { R.cash(n * 35); return `SEVENTEEN! ${fmt(n * 35)}! You screamed so loud security came over. They congratulated you, then watched you very closely.`; } R.cash(-n); return '22. Not even close. Not even a neighbour.'; } },
      { t: 'Free drinks at the pokies', go(s, R) { R.cash(-p(s, 20)); R.drink(4); return 'You put in $20 and got four "free" drinks. That\'s $5 a drink. Basically a bargain.'; } },
    ],
  },
  act_fishspa: {
    kind: 'act', title: 'Dr Fish', icon: '🐟', sub: 'Tiny fish eat your feet',
    text: (s) => `<p>A tank of tiny fish that eat the dead skin off your feet. ${fmt(p(s, 3))} and a free beer. Your feet have been in thongs for three weeks.</p>`,
    choices: (s) => [{ t: 'Dip', go(s, R) { R.cash(-p(s, 3)); R.drink(1); R.hp(3); return 'The fish went into a frenzy. It was a feast. Several fish had to lie down afterwards.'; } }],
  },
  act_quadbike: {
    kind: 'act', title: 'Quad Bikes Through the Rice Fields', icon: '🏁', sub: 'Mud, buffalo, sunset',
    text: (s) => `<p>Two hours on a quad bike through rice paddies and villages. ${fmt(p(s, 30))}. There's a sunset temple stop.</p>`,
    choices: (s) => [{ t: 'Full throttle', req: afford((s) => p(s, 30)), go(s, R) { R.cash(-p(s, 30)); if (R.chance(0.2)) { R.hp(-10); return 'You drove into a rice paddy. A water buffalo watched you, unbothered.'; } const pts = R.photo({ id: 'quad_rep', name: 'Mud-covered at a village temple at sunset', r: 28 }); return pts ? 'Mud from head to toe, grinning at a temple sunset. Great photo.' : 'Muddy again. Still fun.'; } }],
  },
  act_hawker: {
    kind: 'act', ksr: true, title: 'Hawker Centre Feast', icon: '🍜', sub: 'Char kway teow, laksa, roti, more laksa',
    text: (s) => `<p>A hawker centre with 60 stalls, plastic stools, and a sense of possibility. ${fmt(p(s, 8))} gets you a feast.</p>`,
    choices: (s) => [{ t: 'Eat everything', go(s, R) { R.cash(-p(s, 8)); R.hp(14); return 'Char kway teow. Assam laksa. Roti canai. Another laksa. Cendol. You can barely walk. You have never been healthier, spiritually.'; } }],
  },
  act_tea: {
    kind: 'act', title: 'High Tea in the Highlands', icon: '🫖', sub: 'Scones. In Malaysia. Don\'t question it.',
    text: (s) => `<p>Scones, jam, cream and a pot of tea, overlooking rolling green tea plantations. ${fmt(p(s, 6))}.</p>`,
    choices: (s) => [{ t: 'Pinkies out', go(s, R) { R.cash(-p(s, 6)); R.hp(10); return 'Jam first or cream first? You did both. Chaos. Delicious chaos.'; } }],
  },
  act_surf: {
    kind: 'act', title: 'Surf Lesson', icon: '🏄', sub: 'Every Aussie can surf (no they can\'t)',
    text: (s) => `<p>A surf school on the beach. Your instructor is a 60 kg local called "Bobby Barrel" who has never been unhappy. ${fmt(p(s, 30))}.</p>`,
    choices: (s) => [
      { t: 'Paddle out', sub: fmt(p(s, 30)), req: afford((s) => p(s, 30)), go(s, R) { R.cash(-p(s, 30)); const r = R.rnd(); if (r < 0.3) { R.hp(-10); return 'Reef rash from your nipples to your knees. Bobby Barrel laughed until he fell off his board.'; } if (r < 0.7) { R.charmTemp(2, 6); R.hp(4); return 'You stood up! For three seconds! You got a tan, some muscles and a story. +charm for a week.'; } return 'You spent two hours being tumbled like a sock in a washing machine. Bobby Barrel said "very good". Bobby says that to everyone.'; } },
      { t: 'Watch from the beach with a beer', go(s, R) { R.drink(2); return 'You told everyone at the bar you surfed. Nobody checked.'; } },
    ],
  },
  act_islandhop: {
    kind: 'act', title: 'Island Hopping Tour', icon: '🏝️', sub: 'Lagoons, beaches, a lunch of grilled fish',
    text: (s) => `<p>A full-day bangka boat tour: hidden lagoons, snorkelling, beach lunch, and a Filipino boat captain who sings karaoke into a broken microphone. ${fmt(p(s, 30))}.</p>`,
    choices: (s) => [{ t: 'All aboard', req: afford((s) => p(s, 30)), go(s, R) { R.cash(-p(s, 30)); R.drink(3); const pts = R.photo({ id: 'hop_' + s.city, name: `A secret lagoon near ${cityName(s)}`, r: 35 }); return pts ? 'You swam through a crack in a cliff into a secret lagoon. You took the best photo of your life.' : 'Another perfect day on the water. The captain sang Bon Jovi.'; } }],
  },

  // =============================================================================================
  // LANDMARK SPECIALS
  // =============================================================================================
  lm_palace: {
    kind: 'lm', title: 'The Dress Code', icon: '🏯',
    text: (s) => `<p>At the gate of the Grand Palace, a guard looks at your shorts, then your ${has(s, 'singlet') ? 'Bintang singlet' : 'singlet'}, then sadly points at a sign: "LONG PANTS. SHOULDERS COVERED."</p>`,
    choices: (s, v) => [
      { t: 'Pull on your elephant pants', req: (s) => (has(s, 'pants') ? '' : 'No elephant pants'), go(s, R) { const pts = R.photo(lmOf(s, v.lm)); return `Elephant pants: the passport of South East Asia. In you go. +${pts} pts.`; } },
      { t: 'Rent a sarong at the gate', sub: fmt(p(s, 5)), go(s, R) { R.cash(-p(s, 5)); const pts = R.photo(lmOf(s, v.lm)); return `You look like you're in a 1970s Bond film. Majestic. +${pts} pts.`; } },
      { t: 'Argue', go: () => 'You argued with a palace guard. He did not move a single muscle. Neither did you get in. Ticket money gone.' },
    ],
  },
  lm_monkeys: {
    kind: 'lm', title: 'Monkey Business', icon: '🐒',
    text: () => '<p>A large macaque with the eyes of a career criminal is sizing you up. It has already taken a woman\'s sunnies and a man\'s dignity.</p>',
    choices: (s, v) => [
      { t: 'Take the photo quickly', go(s, R) { const pts = R.photo(lmOf(s, v.lm)); if (R.chance(0.5)) { const it = R.loseRandom(); return `+${pts} pts. The monkey stole your ${it ? it.toLowerCase() : 'lunch'} mid-photo. It's in the photo, holding it.`; } return `+${pts} pts. Clean getaway.`; } },
      { t: 'Fight the monkey', go(s, R) { const f = R.fight('wildlife', 0.25); const pts = R.photo(lmOf(s, v.lm)); return f.won ? `You won a fight with a monkey. +${pts} pts. Tourists applauded. A monkey elder is planning revenge.` : `The monkey won. The monkey always wins. −${f.dmg} ❤️, but you still got the pic (+${pts}).`; } },
      { t: 'Feed it a banana', go(s, R) { R.hp(-5); const pts = R.photo(lmOf(s, v.lm)); return `It brought 30 friends. You were mobbed. +${pts} pts for the photo of you being mobbed.`; } },
    ],
  },
  lm_alms: {
    kind: 'lm', title: 'Morning Alms', icon: '🙏',
    text: () => '<p>At dawn, a long line of saffron-robed monks walks silently through the streets collecting alms. A busload of tourists is sticking cameras directly in their faces.</p>',
    choices: (s, v) => [
      { t: 'Kneel, offer sticky rice, take a respectful pic from across the street', go(s, R) { R.hp(5); s.flags.karma = (s.flags.karma || 0) + 1; const pts = R.photo(lmOf(s, v.lm)); return `A beautiful, quiet moment. An old monk smiled at you. +${pts} pts and good karma.`; } },
      { t: 'Get right up close with the selfie stick', go(s, R) { R.charmTemp(-2, 3); const pts = R.photo({ ...lmOf(s, v.lm), name: lmOf(s, v.lm).name + ' (badly)', r: 5 }); return `A local grandmother hit you with her umbrella. You deserved it. +${pts} pts only.`; } },
    ],
  },
  lm_ijen: {
    kind: 'lm', title: 'The Blue Fire', icon: '🌋',
    text: (s) => `<p>1am. You climb the volcano with a head torch. At the crater rim, electric-blue flames dance on the sulphur. The air is thick and yellow. Miners walk past carrying 80 kg baskets of sulphur on their shoulders. ${has(s, 'gasmask') ? 'Thank god you rented a gas mask.' : 'You do not have a gas mask.'}</p>`,
    choices: (s, v) => [
      { t: has(s, 'gasmask') ? 'Go down to the flames' : 'Go down without a mask', go(s, R) { if (!has(s, 'gasmask')) R.hp(-15); else R.hp(-3); const pts = R.photo(lmOf(s, v.lm)); return `The blue fire, up close. Otherworldly. +${pts} pts. ${has(s, 'gasmask') ? '' : 'You coughed for three days.'}`; } },
      { t: 'Shoot from the rim', go(s, R) { R.hp(-2); const l = lmOf(s, v.lm); const pts = R.photo({ ...l, name: l.name + ' (from the rim)', r: 45 }); return `A blurry blue smudge in the dark. Still counts. Half points: +${pts}.`; } },
    ],
  },
  lm_dragon: {
    kind: 'lm', title: 'Here Be Dragons', icon: '🦎',
    text: () => '<p>The ranger has a forked stick. That\'s the entire safety system. Ten metres away, a three-metre Komodo dragon is lying in the sun, flicking its tongue. It can smell your Bintang breath.</p>',
    choices: (s, v) => [
      { t: 'Get closer for the shot', go(s, R) { if (R.chance(0.25)) { R.hp(-30); R.ach('dragon'); const pts = R.photo(lmOf(s, v.lm)); return `It moved faster than anything that big should. It bit your calf. You survived. The ranger gave it a firm talking-to. +${pts} pts and a legendary scar.`; } s.nextPhoto = 1.5; const pts = R.photo(lmOf(s, v.lm)); return `Close enough to see its eyelashes. National Geographic stuff. +${pts} pts.`; } },
      { t: 'Stay behind the ranger', go(s, R) { const pts = R.photo(lmOf(s, v.lm)); return `A respectful distance. A good photo. All your limbs. +${pts} pts.`; } },
      { t: 'Pose like you\'re riding it', go(s, R) { if (R.chance(0.5)) { R.hp(-30); R.ach('dragon'); s.nextPhoto = 2; const pts = R.photo(lmOf(s, v.lm)); return `It bit you. Obviously. But the photo of it biting you is incredible. +${pts} pts.`; } s.nextPhoto = 2; const pts = R.photo(lmOf(s, v.lm)); return `The ranger yanked you back at the last second, but the photo looks like you're riding it. +${pts} pts.`; } },
    ],
  },

  // =============================================================================================
  // FULL MOON
  // =============================================================================================
  fullmoon: {
    kind: 'forced', title: 'THE FULL MOON PARTY', icon: '🌕',
    text: () => '<p>30,000 people in neon on Haad Rin beach. Buckets, fire twirlers, fluoro body paint, twelve sound systems all playing different songs, and a moon so big and bright it feels like a dare.</p>',
    choices: [
      { t: 'Absolutely send it', go(s, R) { R.ach('fullmoon'); R.drink(14); R.hp(-10); if (s.tonight) s.tonight.stupid = true; const pts = R.photo({ id: 'fmp', name: 'Full Moon Party, covered in paint, holding two buckets', r: 18 }); const r = R.hook(0.12, { bar: 'bp' }); return hook(r, `You met ${r.who} on the dance floor at 3am. You watched the sunrise together.${pts ? ` +${pts} pts for the photo.` : ''}`, `The night became a neon blur. You woke up on a sun lounger with "SEND IT" painted on your back.${pts ? ` +${pts} pts.` : ''}`); } },
      { t: 'Pace yourself (lol)', go(s, R) { R.ach('fullmoon'); R.drink(8); R.photo({ id: 'fmp', name: 'Full Moon Party, covered in paint, holding two buckets', r: 18 }); const r = R.hook(0.06, { bar: 'bp' }); return hook(r, `A measured approach. ${r.who} appreciated someone who could still talk.`, 'A sensible night at a famously insensible party. You were home by 4. Respectable.'); } },
      { t: 'Find a quiet spot and watch the sunrise', go(s, R) { R.ach('fullmoon'); R.drink(4); R.hp(5); R.photo({ id: 'fmp_sunrise', name: 'Sunrise over Haad Rin after the Full Moon', r: 24 }); return 'You sat on the rocks at the end of the beach and watched the sun come up over 30,000 people. Beautiful. Slightly sticky.'; } },
    ],
  },

  // =============================================================================================
  // PRISON
  // =============================================================================================
  pr_khesanh: {
    kind: 'prison', title: 'Cellmate Request', icon: '🎶',
    text: (s) => `<p>Your cellmate wants to learn the words to "Khe Sanh". All of them. He has been told it's the Australian national anthem. You don't correct him.</p>`,
    choices: [
      { t: 'Teach him', go(s) { s.prison.respect += 3; return 'By the end of the week, the whole block was singing it at lights out. Respect +3.'; } },
      { t: 'Teach him "Down Under" instead', go(s) { s.prison.respect += 1; s.prison.smokes += 2; return 'He loves it. He gives you two smokes. Respect +1.'; } },
    ],
  },
  pr_inspection: {
    kind: 'prison', title: 'Cell Inspection!', icon: '🔦', when: (s) => s.prison && (s.prison.hooch > 0 || s.prison.brew),
    text: () => '<p>Guards are sweeping the block. Your hooch is behind the toilet. You can hear them three cells away.</p>',
    choices: [
      { t: 'Drink it all now', go(s, R) { const n = s.prison.hooch; s.prison.hooch = 0; s.prison.brew = 0; R.drink(n); R.hp(-3); return n ? `You chugged ${n} drinks of hooch in 40 seconds. You passed inspection, then passed out.` : 'The brew wasn\'t ready. You drank it anyway. It was bread water.'; } },
      { t: 'Hide it in the mattress', go(s, R) { if (R.chance(0.5)) return 'They didn\'t check the mattress. Genius.'; s.prison.hooch = 0; s.prison.brew = 0; s.prison.sentence += 3; return 'They checked the mattress. Hooch confiscated, 3 days added.'; } },
    ],
  },
  pr_visit: {
    kind: 'prison', title: 'Visitor!', icon: '🫙',
    text: () => '<p>A visitor! It\'s a girl from your old hostel. She heard about you through the backpacker grapevine. She has brought Vegemite, a two-week-old newspaper and her pity.</p>',
    choices: [
      { t: 'Take the Vegemite', go(s, R) { R.item('vegemite'); return 'Vegemite in prison is worth more than gold. You might trade it. You won\'t trade it.'; } },
      { t: 'Ask her to post a letter to the embassy', go(s) { s.prison.letters += 15; return 'She hand-delivered it. Embassy progress +15%.'; } },
    ],
  },
  pr_mail: {
    kind: 'prison', title: 'A Letter from Mum', icon: '✉️',
    text: () => '<p>A letter from Mum. Four pages. Two of them are about the neighbour\'s renovation. One is about how disappointed she is. The last page just says "We love you. Eat your vegetables."</p>',
    choices: [{ t: 'Read it again', go(s, R) { R.mum(1); R.hp(4); return 'You read it 30 times. You cried a bit. Your cellmate pretended not to notice.'; } }],
  },
  pr_cabbage: {
    kind: 'prison', title: 'The Cabbage Gang', icon: '🥬',
    text: () => '<p>The Cabbage Gang, who run the prison vegetable garden, want five smokes a week in "protection". Nobody knows what they protect you from. Possibly the Cabbage Gang.</p>',
    choices: (s) => [
      { t: 'Pay 5 smokes', req: (s) => (s.prison.smokes >= 5 ? '' : 'Not enough smokes'), go(s) { s.prison.smokes -= 5; return 'Protected. From what? From cabbage-related incidents.'; } },
      { t: 'Refuse', go(s, R) { const f = R.fight('prison', 0.1 - s.prison.respect * 0.005); if (f.won) { s.prison.respect += 5; return 'You fought the Cabbage Gang\'s enforcer and won. Respect +5. They send you a cabbage as a peace offering.'; } return `You lost. The Cabbage Gang has made its point. −${f.dmg} ❤️`; } },
    ],
  },
  pr_talent: {
    kind: 'prison', title: 'Prison Talent Show', icon: '🎭',
    text: () => '<p>It\'s the annual prison talent show. The warden is in the front row. The prize is a week off kitchen duty and a cooked chicken.</p>',
    choices: [
      { t: 'Sing "Khe Sanh"', go(s, R) { if (R.chance(0.5)) { s.prison.respect += 5; s.prison.smokes += 10; s.prison.sentence = Math.max(1, s.prison.sentence - 3); return 'A standing ovation. The warden wiped away a tear. You won the chicken and 3 days off.'; } s.prison.respect += 1; return 'You came third, behind a ladyboy cabaret act and a man who can whistle through his nose. Respectable.'; } },
      { t: 'Stand-up comedy about Australian wildlife', go(s, R) { s.prison.respect += 2; R.hp(3); return 'The drop bear bit killed. Nobody believed they were fake. Respect +2.'; } },
    ],
  },
  pr_lawyer: {
    kind: 'prison', title: 'The Lawyer', icon: '⚖️',
    text: (s) => `<p>A lawyer in a shiny suit offers to appeal your sentence. ${fmt(p(s, 800))}, up front. He has a business card that says "LAWYER" and nothing else.</p>`,
    choices: (s) => [
      { t: 'Hire him', sub: fmt(p(s, 800)), req: afford((s) => p(s, 800)), go(s, R) { R.cash(-p(s, 800)); if (R.chance(0.55)) { const n = R.int(15, 30); s.prison.sentence = Math.max(1, s.prison.sentence - n); return `He actually came through. Sentence reduced by ${n} days.`; } return 'You never saw him again. His business card now says "REAL ESTATE".'; } },
      { t: 'Decline', go: () => 'He shrugged and moved on to the next foreigner. He has a lot of clients.' },
    ],
  },
};
