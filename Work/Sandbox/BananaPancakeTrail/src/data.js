// Banana Pancake Trail — static content: countries, places, routes, items, mates, characters.
// Everything is in AUD. Prices marked "base" get multiplied by the country's price level.

export const COUNTRIES = {
  TH: { name: 'Thailand', flag: '🇹🇭', price: 1.0, beer: 'Chang', cheers: 'Chon kaew!', cop: 'a Royal Thai Police sergeant' },
  LA: { name: 'Laos', flag: '🇱🇦', price: 0.8, beer: 'Beerlao', cheers: 'Nyok jok!', cop: 'a Lao tourist policeman' },
  KH: { name: 'Cambodia', flag: '🇰🇭', price: 0.8, beer: 'Angkor', cheers: 'Chol muoy!', cop: 'a Cambodian cop in very shiny shoes' },
  VN: { name: 'Vietnam', flag: '🇻🇳', price: 0.7, beer: 'bia hơi', cheers: 'Một, hai, ba, dzô!', cop: 'a Vietnamese traffic cop' },
  MY: { name: 'Malaysia', flag: '🇲🇾', price: 1.15, beerMult: 1.8, beer: 'Tiger', cheers: 'Yam seng!', cop: 'a Malaysian police inspector' },
  ID: { name: 'Indonesia', flag: '🇮🇩', price: 0.95, beer: 'Bintang', cheers: 'Bersulang!', cop: 'a Balinese traffic cop with a laminated fine sheet' },
  PH: { name: 'Philippines', flag: '🇵🇭', price: 0.9, beer: 'San Miguel', cheers: 'Tagay!', cop: 'a Filipino barangay tanod' },
};

export const BAR_BASE = { dive: 1.5, bp: 2.5, fancy: 11 }; // per drink
export const BAR_KIND = {
  dive: { label: 'Local Dive', icon: '🪑', blurb: 'Plastic chairs, cheap beer, locals, karaoke, fights, a dodgy bloke in the corner.' },
  bp: { label: 'Backpacker Bar', icon: '🪣', blurb: 'Buckets, beer pong, Wonderwall, Swedes, other Aussies, your own worst instincts.' },
  fancy: { label: 'Fancy Hotel Bar', icon: '🍸', blurb: 'Dress code, $20 cocktails, divorcees, bankers and gentlemen with "opportunities".' },
};
export const LEVELS = [
  { id: 0, label: 'A few quiet ones', icon: '🍺', drinks: [3, 5], hp: 2, stupid: 0 },
  { id: 1, label: 'Big night', icon: '🍺🍺', drinks: [8, 12], hp: 6, stupid: 0.12 },
  { id: 2, label: 'Absolutely send it', icon: '🍺🍺🍺', drinks: [16, 24], hp: 13, stupid: 0.45 },
];

export const STAYS = {
  beach: { name: 'Sleep on the beach / bus shelter', icon: '🏖️', base: 0, hp: -7, note: 'Free. Theft, crabs, cops.' },
  hammock: { name: 'Hammock under a tarp', icon: '🛖', base: 3, hp: 4, note: 'Mozzies included.' },
  dorm: { name: '24-bed party hostel dorm', icon: '🛏️', base: 7, hp: 8, note: 'Bedbugs, snorers, romance.' },
  guest: { name: 'Cockroach guesthouse', icon: '🪳', base: 12, hp: 12, note: 'Private room. Not private from the mice.' },
  homestay: { name: 'Family homestay', icon: '🏡', base: 9, hp: 14, note: 'The host may produce an unlabelled bottle.' },
  hotel: { name: 'Mid-range hotel with aircon', icon: '🏨', base: 35, hp: 20, note: 'Clean sheets. Heaven.' },
  resort: { name: 'Fancy resort', icon: '🌴', base: 140, hp: 32, note: 'Fluffy robe. Minibar. Mum would be proud.' },
};

// ---------------------------------------------------------------------------------------------
// Places. lat/lon are real; dx/dy nudge the dot on the coaster map so island clusters don't overlap.
// tags: airport, hostel (can work), wifi, seedy (courier jobs), beach, party, remote (no bars)
// lm = landmarks: r = rarity (score = r × 2), cost base, risk {p, hp, text}, ksr = on Khao San Road
// ---------------------------------------------------------------------------------------------
export const CITIES = {
  bkk: {
    name: 'Bangkok', sub: 'Khao San Road', c: 'TH', lat: 13.75, lon: 100.5, lp: 'l',
    tags: ['airport', 'hostel', 'wifi', 'seedy', 'party'],
    blurb: 'The centre of the backpacker universe. Everyone on this street is trying to sell you a suit, a scorpion, a fake degree or a tuk-tuk ride to a gem shop.',
    bars: { dive: "Uncle Somchai's Plastic Chair Emporium", bp: 'The Bucket List (Khao San)', fancy: 'The Vertigo Rooftop, Sukhumvit' },
    stays: ['beach', 'dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'ksr_ronald', name: 'Ronald McDonald doing a wai', r: 8, cost: 0, ksr: true },
      { id: 'ksr_scorpion', name: 'The scorpion-on-a-stick cart', r: 6, cost: 2, ksr: true },
      { id: 'ksr_fakeid', name: 'The "We Do Not Check" fake ID stall', r: 14, cost: 0, ksr: true },
      { id: 'bkk_palace', name: 'The Grand Palace', r: 10, cost: 16, ev: 'lm_palace' },
      { id: 'bkk_arun', name: 'Wat Arun at sunset', r: 12, cost: 3 },
      { id: 'bkk_maeklong', name: 'Maeklong Railway Market (the train goes through it)', r: 30, cost: 8 },
    ],
    acts: ['muaythai', 'kstattoo', 'pingpong', 'tuktuk'],
  },
  cnx: {
    name: 'Chiang Mai', c: 'TH', lat: 18.79, lon: 98.98, lp: 'l',
    tags: ['airport', 'hostel', 'wifi'],
    blurb: 'Temples, digital nomads, and 400 cafés with Edison bulbs. Everyone here is "working on a startup".',
    bars: { dive: 'The Plastic Elephant', bp: 'Spicy Gecko Hostel Bar', fancy: 'The Colonial Teak Lounge' },
    stays: ['dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'cnx_suthep', name: 'Doi Suthep (306 steps)', r: 15, cost: 2 },
      { id: 'cnx_elephant', name: 'Elephant sanctuary mud bath', r: 20, cost: 60 },
      { id: 'cnx_canyon', name: 'Grand Canyon cliff jump', r: 30, cost: 5, risk: { p: 0.25, hp: -15, text: 'You belly-flopped from 12 metres. The sound echoed.' } },
      { id: 'cnx_white', name: 'The White Temple (day trip to Chiang Rai)', r: 35, cost: 25 },
    ],
    acts: ['muaythai', 'cooking'],
  },
  pai: {
    name: 'Pai', c: 'TH', lat: 19.36, lon: 98.44, lp: 'l',
    tags: ['hostel', 'wifi', 'party'],
    blurb: 'A hippie valley 762 curves from anywhere. Half the town wears elephant pants and has a road-rash bandage they call a "Pai tattoo".',
    bars: { dive: 'The Bamboo Bar That Leans', bp: 'Chill Bro Reggae Hut', fancy: 'The Yoga-Adjacent Wine Loft' },
    stays: ['hammock', 'dorm', 'guest', 'hotel'],
    lm: [
      { id: 'pai_canyon', name: 'Pai Canyon at sunset', r: 20, cost: 0, risk: { p: 0.1, hp: -10, text: 'The path was 30 cm wide. You were not 30 cm wide.' } },
      { id: 'pai_love', name: 'The "Coffee In Love" sign', r: 15, cost: 1 },
      { id: 'pai_split', name: 'Pai Land Split', r: 38, cost: 1 },
      { id: 'pai_bridge', name: 'WWII Memorial Bridge', r: 18, cost: 0 },
    ],
    acts: ['scooter', 'yoga', 'mushroom'],
  },
  kso: {
    name: 'Khao Sok', sub: 'jungle raft house', c: 'TH', lat: 8.92, lon: 98.53, dx: -0.3, lp: 'l',
    tags: ['remote'],
    blurb: 'Floating raft huts on a jade lake surrounded by limestone cliffs. No bar. No wifi. Gibbons. One very judgmental hornbill.',
    bars: null,
    stays: ['hammock', 'homestay'],
    lm: [
      { id: 'kso_lake', name: 'Cheow Lan Lake karsts', r: 55, cost: 40 },
      { id: 'kso_rafflesia', name: 'A blooming Rafflesia (smells like a dead dingo)', r: 80, cost: 20 },
    ],
    acts: [],
  },
  kpg: {
    name: 'Koh Phangan', sub: 'Haad Rin', c: 'TH', lat: 9.73, lon: 100.02, dx: 0.35, dy: -0.2, lp: 'r',
    tags: ['hostel', 'wifi', 'beach', 'party', 'seedy'],
    blurb: 'Home of the Full Moon Party. On every other night there is a Half Moon, a Black Moon, a Jungle Party, and a Shiva Moon. The moon is busy.',
    bars: { dive: "Mr Bucket's Shack", bp: 'Haad Rin Sunrise Beach Club', fancy: 'The Infinity Pool Sundowner Lounge' },
    stays: ['beach', 'dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'kpg_sign', name: 'The Haad Rin Full Moon sign', r: 10, cost: 0 },
      { id: 'kpg_thansadet', name: 'Than Sadet Waterfall (royal graffiti)', r: 40, cost: 3 },
      { id: 'kpg_bottle', name: 'Bottle Beach by longtail', r: 45, cost: 15 },
    ],
    acts: ['mushroom', 'scooter'],
  },
  kto: {
    name: 'Koh Tao', c: 'TH', lat: 10.09, lon: 99.84, dx: -0.3, dy: 0.35, lp: 'l',
    tags: ['hostel', 'wifi', 'beach', 'party'],
    blurb: 'Dive island. Everyone is either a Divemaster or about to become one and will tell you about it.',
    bars: { dive: "Diver Dave's Dive Bar", bp: 'Fishbowl Beach Bar', fancy: "The Divemaster's Retirement Lounge" },
    stays: ['beach', 'dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'kto_nangyuan', name: 'Koh Nang Yuan viewpoint', r: 25, cost: 6 },
      { id: 'kto_sailrock', name: 'Sail Rock dive (whale shark if lucky)', r: 50, cost: 80 },
    ],
    acts: ['scuba'],
  },
  phk: {
    name: 'Phuket', sub: 'Patong', c: 'TH', lat: 7.89, lon: 98.3, dx: -0.35, dy: 0.1, lp: 'l',
    tags: ['airport', 'hostel', 'wifi', 'beach', 'party', 'seedy'],
    blurb: 'Bangla Road: a neon canyon of sound systems, touts with laminated menus, and Aussies who came here in 2007 and never left.',
    bars: { dive: 'Bangla Road Beer Bar #46', bp: 'Slippery Gibbon Hostel', fancy: 'The Marina Club (Yachts Only*)' },
    stays: ['beach', 'dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'phk_buddha', name: 'Big Buddha', r: 12, cost: 0 },
      { id: 'phk_bangla', name: 'The Bangla Road neon arch', r: 6, cost: 0 },
      { id: 'phk_bond', name: 'James Bond Island', r: 30, cost: 45 },
    ],
    acts: ['muaythai', 'boozecruise'],
  },
  phi: {
    name: 'Koh Phi Phi', c: 'TH', lat: 7.74, lon: 98.77, dx: 0.3, dy: -0.25, lp: 'r',
    tags: ['hostel', 'wifi', 'beach', 'party'],
    blurb: 'A postcard island with a fire-twirling, bucket-swilling, beer-pong-shouting party bolted onto it.',
    bars: { dive: 'Reggae Bar Fight Ring', bp: 'Slinky Beach Fire Show Bar', fancy: 'The Cliffside Champagne Terrace' },
    stays: ['beach', 'dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'phi_maya', name: "Maya Bay (from 'The Beach')", r: 25, cost: 20 },
      { id: 'phi_view', name: 'Phi Phi viewpoint', r: 18, cost: 3 },
      { id: 'phi_monkey', name: 'Monkey Beach', r: 22, cost: 8, ev: 'lm_monkeys' },
    ],
    acts: ['boozecruise'],
  },
  vv: {
    name: 'Vang Vieng', c: 'LA', lat: 18.92, lon: 102.45, lp: 'l',
    tags: ['hostel', 'wifi', 'party', 'seedy'],
    blurb: 'Karst mountains, a lazy river, and a town whose economy runs on inner tubes, pancakes and reruns of Friends.',
    bars: { dive: 'The Last Tube Bar', bp: 'Kamikaze Bar (free singlet)', fancy: 'The Karst View Boutique Lounge' },
    stays: ['hammock', 'dorm', 'guest', 'hotel'],
    lm: [
      { id: 'vv_lagoon', name: 'Blue Lagoon 3', r: 18, cost: 2 },
      { id: 'vv_pangern', name: 'Pha Ngern viewpoint (sweaty climb)', r: 35, cost: 2, risk: { p: 0.3, hp: -6, text: 'Your thongs were not designed for this.' } },
      { id: 'vv_sign', name: 'The "Welcome to Tubing" sign', r: 8, cost: 0 },
    ],
    acts: ['tubing'],
  },
  lpb: {
    name: 'Luang Prabang', c: 'LA', lat: 19.89, lon: 102.13, dy: -0.15, lp: 'l',
    tags: ['airport', 'hostel', 'wifi'],
    blurb: 'Saffron-robed monks, French bakeries and an 11:30pm curfew. After curfew, everyone goes to the bowling alley. Nobody knows why.',
    bars: { dive: 'The Bowling Alley (after curfew)', bp: 'Lazy Mekong Hostel Bar', fancy: 'The French Colonial Gin Club' },
    stays: ['dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'lpb_kuangsi', name: 'Kuang Si Falls', r: 22, cost: 3 },
      { id: 'lpb_phousi', name: 'Mount Phousi at sunset', r: 15, cost: 2 },
      { id: 'lpb_alms', name: 'Morning alms giving (respectfully)', r: 35, cost: 0, ev: 'lm_alms' },
    ],
    acts: ['cooking'],
  },
  poj: {
    name: 'Plain of Jars', sub: 'Phonsavan', c: 'LA', lat: 19.45, lon: 103.2, dx: 0.3, lp: 'r',
    tags: ['remote'],
    blurb: 'Fields of giant 2,000-year-old stone jars. Nobody knows what they were for. You reckon beer. The marked paths are marked for a very good reason.',
    bars: null,
    stays: ['hammock', 'homestay'],
    lm: [{ id: 'poj_jars', name: 'Plain of Jars, Site 1 (stay on the path)', r: 75, cost: 5 }],
    acts: [],
  },
  kl: {
    name: 'Kong Lor', sub: 'river cave', c: 'LA', lat: 17.97, lon: 104.7, lp: 'r',
    tags: ['remote'],
    blurb: 'A 7.5 km cave with a river running straight through a mountain. You go through it in a longtail boat in total darkness. Your headlamp is from a servo.',
    bars: null,
    stays: ['hammock', 'homestay'],
    lm: [{ id: 'kl_cave', name: 'Kong Lor Cave by longtail', r: 85, cost: 15 }],
    acts: [],
  },
  sipd: {
    name: '4000 Islands', sub: 'Don Det', c: 'LA', lat: 14.0, lon: 105.85, lp: 'r',
    tags: ['hostel', 'party'],
    blurb: "A scatter of Mekong islands where the main activities are hammocks, more hammocks, and 'happy' shakes.",
    bars: { dive: 'Hammock Bar', bp: 'The Happy Bar', fancy: 'The Only Hotel With a Generator' },
    stays: ['hammock', 'dorm', 'guest'],
    lm: [
      { id: 'sipd_falls', name: 'Khone Phapheng Falls', r: 40, cost: 8 },
      { id: 'sipd_dolphin', name: 'Irrawaddy dolphins (one, maybe, far away)', r: 60, cost: 15 },
    ],
    acts: ['mushroom'],
  },
  rep: {
    name: 'Siem Reap', c: 'KH', lat: 13.36, lon: 103.86, lp: 'l',
    tags: ['airport', 'hostel', 'wifi', 'party', 'seedy'],
    blurb: 'Gateway to Angkor. By day, ancient temples. By night, Pub Street, $1 cocktails and a tuk-tuk driver called "James Bond" who follows you everywhere.',
    bars: { dive: 'Angkor Whatever Bar', bp: 'Pub Street Temple Club', fancy: 'The Raffles-ish Elephant Bar' },
    stays: ['dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'rep_angkor', name: 'Angkor Wat at sunrise (with 4,000 others)', r: 15, cost: 45 },
      { id: 'rep_taprohm', name: "Ta Prohm, the 'Tomb Raider' tree", r: 20, cost: 0 },
      { id: 'rep_pubst', name: 'The Pub Street neon sign', r: 6, cost: 0 },
      { id: 'rep_beng', name: 'Beng Mealea (jungle-swallowed temple)', r: 50, cost: 25 },
    ],
    acts: ['fishspa', 'quadbike'],
  },
  pnh: {
    name: 'Phnom Penh', c: 'KH', lat: 11.56, lon: 104.92, lp: 'r',
    tags: ['airport', 'hostel', 'wifi', 'seedy', 'party'],
    blurb: "A capital of tuk-tuks, rooftop bars, riverside sunsets and a guy who will offer to let you fire a rocket launcher. Say no to the rocket launcher.",
    bars: { dive: 'Riverside Sticky-Floor Bar', bp: 'The Mad Gibbon Hostel', fancy: "The Retired Journalists' Club" },
    stays: ['beach', 'dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'pnh_palace', name: 'The Royal Palace', r: 12, cost: 10 },
      { id: 'pnh_monument', name: 'Independence Monument', r: 14, cost: 0 },
      { id: 'pnh_quay', name: 'Sisowath Quay at sunset', r: 10, cost: 0 },
    ],
    acts: ['shooting', 'happypizza', 'casino'],
  },
  kmp: {
    name: 'Kampot', c: 'KH', lat: 10.61, lon: 104.18, lp: 'b',
    tags: ['hostel', 'wifi'],
    blurb: 'A sleepy river town famous for pepper, a giant durian statue at the roundabout, and a hostel with a water park.',
    bars: { dive: 'Pepper & Pints', bp: 'The Water Park Hostel', fancy: 'The Bokor Hill Casino Lounge' },
    stays: ['hammock', 'dorm', 'guest', 'hotel'],
    lm: [
      { id: 'kmp_bokor', name: 'Bokor Hill abandoned casino', r: 45, cost: 15 },
      { id: 'kmp_pepper', name: 'A Kampot pepper farm', r: 30, cost: 5 },
      { id: 'kmp_durian', name: 'The giant durian roundabout', r: 35, cost: 0 },
    ],
    acts: ['happypizza', 'casino'],
  },
  kkr: {
    name: 'Koh Rong', c: 'KH', lat: 10.72, lon: 103.24, lp: 'l',
    tags: ['hostel', 'beach', 'party'],
    blurb: 'White sand, no roads, generator power until 11pm, and a beach party every night run by a 19-year-old from Leeds.',
    bars: { dive: 'The Coconut Shack', bp: 'Police Beach Party (no police)', fancy: 'Boutique Bungalow Bar' },
    stays: ['beach', 'hammock', 'dorm', 'guest', 'resort'],
    lm: [
      { id: 'kkr_plankton', name: 'Bioluminescent plankton swim', r: 40, cost: 10 },
      { id: 'kkr_longset', name: 'Long Set Beach', r: 25, cost: 0 },
    ],
    acts: ['happypizza'],
  },
  rtk: {
    name: 'Ratanakiri', c: 'KH', lat: 13.73, lon: 107.0, lp: 'r',
    tags: ['remote'],
    blurb: 'Red dirt, jungle, waterfalls and a perfect volcanic crater lake. The nearest bucket is 600 km away.',
    bars: null,
    stays: ['hammock', 'homestay'],
    lm: [{ id: 'rtk_lake', name: 'Yeak Laom crater lake', r: 70, cost: 3 }],
    acts: [],
  },
  han: {
    name: 'Hanoi', c: 'VN', lat: 21.03, lon: 105.85, lp: 't',
    tags: ['airport', 'hostel', 'wifi', 'party'],
    blurb: 'Eight million motorbikes, tiny plastic stools, 30-cent beer brewed this morning, and egg coffee. Crossing the road is an extreme sport.',
    bars: { dive: 'Bia Hơi Corner (tiny stools)', bp: 'The Backpackers Bunker', fancy: 'The Metropole-ish Bamboo Bar' },
    stays: ['dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'han_train', name: 'Train Street (train inches from your face)', r: 22, cost: 0 },
      { id: 'han_hoankiem', name: 'Hoan Kiem Lake', r: 10, cost: 0 },
      { id: 'han_beercorner', name: 'Ta Hien Beer Corner', r: 8, cost: 0 },
      { id: 'han_mausoleum', name: 'Ho Chi Minh Mausoleum (no hats, no shorts, no jokes)', r: 18, cost: 0 },
    ],
    acts: ['buybike', 'eggcoffee'],
  },
  hlb: {
    name: 'Ha Long Bay', c: 'VN', lat: 20.95, lon: 107.07, lp: 'r',
    tags: ['hostel', 'party', 'beach'],
    blurb: 'Two thousand limestone islands rising out of an emerald sea, and 600 junk boats full of hungover backpackers.',
    bars: { dive: 'Karaoke Boat No. 7', bp: 'The Booze Cruise Junk', fancy: "The Cruise Ship Captain's Lounge" },
    stays: ['dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'hlb_bay', name: 'The karsts of Ha Long Bay from a kayak', r: 15, cost: 30 },
      { id: 'hlb_sungsot', name: 'Sung Sot Cave', r: 25, cost: 10 },
    ],
    acts: ['boozecruise'],
  },
  hag: {
    name: 'Ha Giang Loop', c: 'VN', lat: 22.82, lon: 104.98, lp: 'l',
    tags: ['remote'],
    blurb: 'The most beautiful road in Asia, on the back of a motorbike driven by a 17-year-old called Tuan. The homestay hosts serve "happy water". Lots of it.',
    bars: null,
    stays: ['homestay'],
    lm: [
      { id: 'hag_mapileng', name: 'Ma Pi Leng Pass', r: 80, cost: 0, risk: { p: 0.15, hp: -12, text: 'Tuan took the hairpin at full noise. You left a fingernail in his jacket.' } },
      { id: 'hag_lungcu', name: 'Lung Cu flag tower (northernmost point)', r: 85, cost: 2 },
    ],
    acts: [],
  },
  sapa: {
    name: 'Sapa', c: 'VN', lat: 22.34, lon: 103.84, lp: 'l',
    tags: ['hostel', 'wifi'],
    blurb: 'Misty mountains and rice terraces. Hmong grandmothers in sequinned hats outwalk you uphill while selling you a cushion cover.',
    bars: { dive: 'Corn Wine Corner', bp: 'Mountain Hostel Fire Pit', fancy: 'The Fog View Lounge' },
    stays: ['dorm', 'guest', 'homestay', 'hotel'],
    lm: [
      { id: 'sapa_fansipan', name: 'Fansipan summit, "the Roof of Indochina"', r: 50, cost: 35 },
      { id: 'sapa_terraces', name: 'Muong Hoa rice terraces', r: 30, cost: 3 },
    ],
    acts: [],
  },
  pnk: {
    name: 'Phong Nha', c: 'VN', lat: 17.6, lon: 106.28, lp: 'r',
    tags: ['hostel'],
    blurb: 'Cave country. Some of the biggest caves on Earth are here, including one with its own jungle, its own weather and its own $3,000 permit.',
    bars: { dive: 'Cave-side Beer Shack', bp: 'Jungle Hostel Bar', fancy: 'The Only Resort' },
    stays: ['hammock', 'dorm', 'guest', 'hotel'],
    lm: [
      { id: 'pnk_paradise', name: 'Paradise Cave', r: 30, cost: 12 },
      { id: 'pnk_sondoong', name: 'Son Doong, the biggest cave on Earth', r: 95, cost: 3000 },
    ],
    acts: [],
  },
  hoi: {
    name: 'Hoi An', c: 'VN', lat: 15.88, lon: 108.33, lp: 'r',
    tags: ['airport', 'hostel', 'wifi', 'party'],
    blurb: 'Lantern-lit old town with 600 tailors who will make you a three-piece suit by tomorrow morning, sizing optional.',
    bars: { dive: 'The Lantern Bar With No Lanterns', bp: 'Tiger Tiger Free Shots', fancy: 'The Riverside Áo Dài Lounge' },
    stays: ['dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'hoi_bridge', name: 'The Japanese Covered Bridge', r: 12, cost: 4 },
      { id: 'hoi_lantern', name: 'Lantern boat on the Thu Bồn', r: 15, cost: 5 },
      { id: 'hoi_myson', name: 'My Son ruins', r: 35, cost: 8 },
    ],
    acts: ['tailor', 'cooking'],
  },
  dlt: {
    name: 'Da Lat', c: 'VN', lat: 11.94, lon: 108.44, lp: 'r',
    tags: ['hostel', 'wifi'],
    blurb: 'A cool mountain town of pine forests, strawberries, French villas and a bar shaped like a maze that nobody has ever fully mapped.',
    bars: { dive: 'The Maze Bar (good luck)', bp: 'Wolfpack Hostel Family Dinner', fancy: 'The Pine Forest Colonial Lounge' },
    stays: ['dorm', 'guest', 'hotel'],
    lm: [
      { id: 'dlt_crazy', name: 'The Crazy House', r: 30, cost: 3 },
      { id: 'dlt_canyon', name: 'Datanla canyoning abseil', r: 40, cost: 40, risk: { p: 0.2, hp: -14, text: 'You abseiled face-first into a waterfall.' } },
    ],
    acts: [],
  },
  sgn: {
    name: 'Saigon', sub: 'Ho Chi Minh City', c: 'VN', lat: 10.78, lon: 106.7, lp: 'r',
    tags: ['airport', 'hostel', 'wifi', 'seedy', 'party'],
    blurb: 'Bui Vien walking street: every bar plays a different song at maximum volume, and a bloke on a plastic stool will sell you nitrous balloons.',
    bars: { dive: 'Bui Vien Plastic Stool', bp: 'The Bui Vien Bass Cannon', fancy: 'Rooftop 52 Cocktail Den' },
    stays: ['dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'sgn_buivien', name: 'Bui Vien walking street', r: 6, cost: 0 },
      { id: 'sgn_cuchi', name: 'Cu Chi Tunnels (you got stuck)', r: 25, cost: 15 },
      { id: 'sgn_post', name: 'Saigon Central Post Office', r: 12, cost: 0 },
    ],
    acts: ['buybike'],
  },
  kul: {
    name: 'Kuala Lumpur', c: 'MY', lat: 3.14, lon: 101.69, lp: 'r',
    tags: ['airport', 'hostel', 'wifi'],
    blurb: 'Gleaming towers, 24-hour mamak stalls and roti canai at 3am. The beer costs about the same as at home, which is offensive.',
    bars: { dive: 'Changkat Happy Hour Joint', bp: 'Chinatown Rooftop Hostel', fancy: 'The Helipad Bar' },
    stays: ['dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'kul_petronas', name: 'Petronas Towers', r: 10, cost: 0 },
      { id: 'kul_batu', name: 'Batu Caves (272 rainbow steps)', r: 20, cost: 0, ev: 'lm_monkeys' },
    ],
    acts: ['hawker'],
  },
  pen: {
    name: 'Penang', sub: 'George Town', c: 'MY', lat: 5.41, lon: 100.33, lp: 'r',
    tags: ['hostel', 'wifi'],
    blurb: 'Street art, shophouses and some of the best street food on Earth. You will put on 3 kilos and not regret one of them.',
    bars: { dive: 'Love Lane Tiny Bar', bp: 'Chulia Street Hostel Bar', fancy: 'The Colonial Verandah' },
    stays: ['dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'pen_mural', name: "The 'Kids on a Bicycle' mural", r: 20, cost: 0 },
      { id: 'pen_hill', name: 'Penang Hill funicular', r: 18, cost: 8 },
      { id: 'pen_keklok', name: 'Kek Lok Si Temple', r: 25, cost: 2 },
    ],
    acts: ['hawker'],
  },
  cam: {
    name: 'Cameron Highlands', c: 'MY', lat: 4.47, lon: 101.38, lp: 'l',
    tags: ['hostel'],
    blurb: 'Cool hills, tea plantations, strawberry farms and a strangely large number of faux-Tudor buildings.',
    bars: { dive: 'Tanah Rata Roti & Beer', bp: 'Fireplace Hostel', fancy: 'The Faux-Tudor Pub' },
    stays: ['dorm', 'guest', 'hotel'],
    lm: [
      { id: 'cam_tea', name: 'BOH tea plantation', r: 30, cost: 0 },
      { id: 'cam_mossy', name: 'The Mossy Forest', r: 45, cost: 10 },
    ],
    acts: ['tea'],
  },
  kin: {
    name: 'Mt Kinabalu', sub: 'Sabah, Borneo', c: 'MY', lat: 6.07, lon: 116.56, lp: 'r',
    tags: ['remote'],
    blurb: 'The highest mountain in Borneo. You start climbing at 2am. Your Bunnings head torch is not up to it.',
    bars: null,
    stays: ['hammock', 'homestay'],
    lm: [{ id: 'kin_summit', name: "Low's Peak, Mt Kinabalu (4,095 m)", r: 85, cost: 250, risk: { p: 1, hp: -18, text: 'Altitude, cold and the memory of every beer you ever drank.' } }],
    acts: [],
  },
  dps: {
    name: 'Bali', sub: 'Kuta', c: 'ID', lat: -8.72, lon: 115.17, dy: 0.05, lp: 'b',
    tags: ['airport', 'hostel', 'wifi', 'beach', 'party'],
    blurb: 'The Aussie motherland abroad. Bintang singlets, hair braids, Bali belly, and blokes from Perth who think the Sky Garden is a cultural site.',
    bars: { dive: 'Bintang Singlet Warung', bp: 'Skyline Garden (Nine Floors)', fancy: 'The Seminyak Beach Club' },
    stays: ['dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'dps_kuta', name: 'Kuta Beach, Bintang in hand', r: 5, cost: 0 },
      { id: 'dps_tanahlot', name: 'Tanah Lot sea temple', r: 18, cost: 4 },
      { id: 'dps_monkey', name: 'Ubud Monkey Forest', r: 22, cost: 6, ev: 'lm_monkeys' },
      { id: 'dps_gates', name: "Lempuyang 'Gates of Heaven' (it's a mirror)", r: 35, cost: 10 },
      { id: 'dps_swing', name: 'Tegallalang rice terrace swing', r: 20, cost: 25 },
    ],
    acts: ['surf', 'yoga', 'scooter'],
  },
  gil: {
    name: 'Gili Trawangan', c: 'ID', lat: -8.35, lon: 116.04, dy: -0.25, lp: 'r',
    tags: ['hostel', 'beach', 'party', 'wifi'],
    blurb: 'A tiny island with no cars, no police and no dogs. Just horse carts, bicycles, turtles and signs advertising mushroom shakes.',
    bars: { dive: 'Sunset Reggae Swing Bar', bp: 'The Gili Party Pub', fancy: 'The Infinity Pool Resort Bar' },
    stays: ['beach', 'dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'gil_swing', name: 'The swing in the sea', r: 15, cost: 0 },
      { id: 'gil_turtle', name: 'Snorkelling with turtles', r: 25, cost: 8 },
    ],
    acts: ['mushroom'],
  },
  ijn: {
    name: 'Ijen Crater', c: 'ID', lat: -8.06, lon: 114.24, dy: -0.25, lp: 't',
    tags: ['remote'],
    blurb: 'An active volcano with an acid lake and electric-blue sulphur flames. You climb it at 1am, in the dark, in your thongs.',
    bars: null,
    stays: ['hammock', 'homestay'],
    lm: [{ id: 'ijn_blue', name: 'The Ijen blue fire', r: 90, cost: 15, ev: 'lm_ijen' }],
    acts: [],
  },
  brm: {
    name: 'Mt Bromo', c: 'ID', lat: -7.94, lon: 112.95, lp: 't',
    tags: ['remote'],
    blurb: "A smoking volcano in a sea of sand. Sunrise here makes grown bogans weep. Then you get charged $3 to use a toilet.",
    bars: null,
    stays: ['hammock', 'homestay'],
    lm: [{ id: 'brm_sunrise', name: 'Mount Bromo at sunrise', r: 65, cost: 25 }],
    acts: [],
  },
  kmd: {
    name: 'Komodo', sub: 'Labuan Bajo', c: 'ID', lat: -8.5, lon: 119.88, lp: 'b',
    tags: ['airport', 'hostel', 'beach'],
    blurb: 'Gateway to real live dragons. They are three metres long, venomous and have the energy of a bouncer at closing time.',
    bars: { dive: 'Labuan Bajo Harbour Bar', bp: 'Dragon Dive Hostel Rooftop', fancy: 'The Yacht Week Lounge' },
    stays: ['dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'kmd_dragon', name: 'A Komodo dragon (from a "safe" distance)', r: 60, cost: 60, ev: 'lm_dragon' },
      { id: 'kmd_pink', name: 'Pink Beach', r: 45, cost: 30 },
      { id: 'kmd_padar', name: 'Padar Island viewpoint', r: 50, cost: 30 },
    ],
    acts: [],
  },
  mnl: {
    name: 'Manila', c: 'PH', lat: 14.6, lon: 120.98, lp: 'l',
    tags: ['airport', 'hostel', 'wifi', 'party'],
    blurb: 'Jeepneys, karaoke, malls the size of suburbs and traffic so bad people have been born and grown up in it.',
    bars: { dive: 'Poblacion Videoke Hole', bp: 'Poblacion Rooftop Hostel', fancy: 'The Makati Whiskey Library' },
    stays: ['dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'mnl_intramuros', name: 'Intramuros walls', r: 12, cost: 2 },
      { id: 'mnl_jeepney', name: 'Selfie with a chrome jeepney', r: 8, cost: 0 },
    ],
    acts: [],
  },
  eln: {
    name: 'El Nido', c: 'PH', lat: 11.18, lon: 119.39, lp: 'l',
    tags: ['hostel', 'beach', 'party'],
    blurb: 'Limestone cliffs, lagoons and island-hopping tours named A, B, C and D. Tour A is the one everyone does. You will do Tour A.',
    bars: { dive: 'Bamboo Beach Bar', bp: 'The Pangolin Hostel Party', fancy: 'The Lagoon Resort Lounge' },
    stays: ['beach', 'dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'eln_lagoon', name: 'Big Lagoon (Tour A)', r: 30, cost: 25 },
      { id: 'eln_nacpan', name: 'Nacpan Beach', r: 28, cost: 5 },
    ],
    acts: ['islandhop'],
  },
  sia: {
    name: 'Siargao', c: 'PH', lat: 9.85, lon: 126.05, dx: 0.2, lp: 'b',
    tags: ['hostel', 'beach', 'party'],
    blurb: 'Surf island. Everyone is tanned, toned, barefoot and named something like "Kai". You are none of these.',
    bars: { dive: 'Cloud 9 Boardwalk Bar', bp: 'Surf Hostel Tuesday Party', fancy: 'The Surf Retreat Kombucha Bar' },
    stays: ['beach', 'dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'sia_cloud9', name: 'Cloud 9 boardwalk', r: 25, cost: 1 },
      { id: 'sia_sugba', name: 'Sugba Lagoon', r: 40, cost: 20 },
    ],
    acts: ['surf'],
  },
  bor: {
    name: 'Boracay', c: 'PH', lat: 11.97, lon: 121.92, lp: 'r',
    tags: ['hostel', 'beach', 'party', 'wifi'],
    blurb: 'Talcum-powder White Beach, sunset sailboats and a nightly pub crawl that ends, without fail, in a body-shot.',
    bars: { dive: 'Station 3 Videoke', bp: 'Station 2 Pub Crawl HQ', fancy: 'The Shangri-ish La' },
    stays: ['dorm', 'guest', 'hotel', 'resort'],
    lm: [
      { id: 'bor_white', name: 'White Beach at sunset', r: 12, cost: 0 },
      { id: 'bor_puka', name: 'Puka Shell Beach', r: 20, cost: 2 },
    ],
    acts: ['islandhop'],
  },
  btd: {
    name: 'Batad', sub: 'rice terraces', c: 'PH', lat: 16.95, lon: 121.1, lp: 'r',
    tags: ['remote'],
    blurb: 'A 2,000-year-old amphitheatre of rice terraces carved into a mountain. No road. You walked in. You will have to walk out.',
    bars: null,
    stays: ['hammock', 'homestay'],
    lm: [
      { id: 'btd_terraces', name: 'The Batad amphitheatre terraces', r: 85, cost: 2 },
      { id: 'btd_falls', name: 'Tappiya Falls', r: 70, cost: 0, risk: { p: 0.2, hp: -8, text: 'There are 1,000 slippery steps. You counted them with your bum.' } },
    ],
    acts: [],
  },
};

export const KSR_LANDMARKS = new Set(CITIES.bkk.lm.filter((l) => l.ksr).map((l) => l.id));

// ---------------------------------------------------------------------------------------------
// Routes are two-way. [a, b, mode, extraDays, base cost (AUD, not price-scaled), hp, 'day'|'night', note, drinksPerDay]
// A 'day' route leaves in the morning and you arrive in time for the night. A 'night' route eats the night:
// no bar, no bed, you arrive the next morning. extraDays adds whole days in transit.
// ---------------------------------------------------------------------------------------------
const R = [
  ['bkk', 'cnx', 'train', 0, 30, -4, 'night', 'Sleeper train. The top-bunk lights never go off.', 3],
  ['bkk', 'cnx', 'bus', 0, 20, -12, 'night', 'VIP bus. VIP means the aircon is set to "morgue".'],
  ['bkk', 'cnx', 'flight', 0, 55, 0, 'day'],
  ['cnx', 'pai', 'minivan', 0, 8, -10, 'day', '762 curves. Bring a bag.'],
  ['cnx', 'lpb', 'boat', 1, 45, -4, 'day', 'Two-day slow boat down the Mekong via Huay Xai. Beerlao on board.', 6],
  ['bkk', 'kpg', 'combo', 0, 35, -12, 'night', 'Joint ticket: bus to Surat Thani, then a night ferry. Someone always spews.'],
  ['bkk', 'kto', 'combo', 0, 35, -12, 'night', 'Night bus and a 6am ferry.'],
  ['bkk', 'phk', 'bus', 0, 28, -12, 'night', 'Twelve hours with a Thai soap opera on full volume.'],
  ['bkk', 'phk', 'flight', 0, 60, 0, 'day'],
  ['bkk', 'kso', 'bus', 0, 25, -12, 'night'],
  ['bkk', 'rep', 'bus', 0, 25, -10, 'day', 'Via the Poipet border. The visa "fee" is negotiable and so is your dignity.'],
  ['bkk', 'vv', 'bus', 0, 40, -15, 'night', 'Sleeper bus via Nong Khai and the Friendship Bridge.'],
  ['bkk', 'pnh', 'flight', 0, 70, 0, 'day'],
  ['bkk', 'han', 'flight', 0, 110, 0, 'day'],
  ['bkk', 'sgn', 'flight', 0, 90, 0, 'day'],
  ['bkk', 'kul', 'flight', 0, 75, 0, 'day'],
  ['bkk', 'dps', 'flight', 0, 190, 0, 'day'],
  ['bkk', 'mnl', 'flight', 0, 160, 0, 'day'],
  ['bkk', 'lpb', 'flight', 0, 120, 0, 'day'],
  ['kpg', 'kto', 'boat', 0, 15, -3, 'day'],
  ['kpg', 'phi', 'combo', 0, 30, -8, 'day', 'Ferry, bus, boat. Three vehicles, zero legroom.'],
  ['phi', 'phk', 'boat', 0, 20, -3, 'day'],
  ['phk', 'kso', 'minivan', 0, 15, -6, 'day'],
  ['kso', 'kpg', 'combo', 0, 22, -8, 'day'],
  ['kso', 'phi', 'combo', 0, 25, -6, 'day'],
  ['phk', 'pen', 'minivan', 0, 35, -10, 'day', 'South over the Sadao border.'],
  ['phk', 'kul', 'flight', 0, 60, 0, 'day'],
  ['phk', 'dps', 'flight', 0, 150, 0, 'day'],
  ['vv', 'lpb', 'train', 0, 14, -1, 'day', 'The shiny new train. Disappointingly smooth.'],
  ['vv', 'lpb', 'minivan', 0, 9, -8, 'day'],
  ['lpb', 'poj', 'minivan', 0, 15, -12, 'day'],
  ['poj', 'vv', 'minivan', 0, 15, -12, 'day'],
  ['vv', 'kl', 'bus', 0, 20, -12, 'day'],
  ['kl', 'sipd', 'bus', 0, 25, -15, 'night'],
  ['sipd', 'pnh', 'bus', 0, 25, -15, 'night', 'Every border guard wants a $2 "stamp fee". Every single one.'],
  ['sipd', 'rep', 'bus', 0, 25, -15, 'night'],
  ['sipd', 'rtk', 'bus', 0, 20, -14, 'day'],
  ['vv', 'han', 'bus', 1, 45, -25, 'night', '30 hours on the legendary Bus of Death. Chickens included.'],
  ['lpb', 'han', 'flight', 0, 100, 0, 'day'],
  ['lpb', 'han', 'bus', 1, 45, -25, 'night', '26 hours over the mountains. The driver chews something.'],
  ['rep', 'pnh', 'bus', 0, 12, -6, 'day'],
  ['pnh', 'kmp', 'bus', 0, 10, -6, 'day'],
  ['kmp', 'kkr', 'combo', 0, 18, -5, 'day'],
  ['pnh', 'kkr', 'combo', 0, 20, -6, 'day'],
  ['pnh', 'sgn', 'bus', 0, 15, -8, 'day', 'Through the Moc Bai border. Mekong Express, allegedly.'],
  ['pnh', 'rtk', 'bus', 0, 15, -12, 'day'],
  ['kkr', 'bkk', 'combo', 0, 40, -15, 'night', 'Via Koh Kong and the Trat border.'],
  ['pnh', 'kul', 'flight', 0, 80, 0, 'day'],
  ['rep', 'han', 'flight', 0, 120, 0, 'day'],
  ['sgn', 'dlt', 'bus', 0, 12, -12, 'night'],
  ['dlt', 'hoi', 'bus', 0, 20, -14, 'night', 'Sleeper "pod" bus. Built for people 160 cm tall.'],
  ['sgn', 'hoi', 'flight', 0, 50, 0, 'day'],
  ['hoi', 'pnk', 'bus', 0, 15, -10, 'day'],
  ['pnk', 'han', 'bus', 0, 20, -14, 'night'],
  ['hoi', 'han', 'train', 0, 40, -5, 'night', 'The Reunification Express. Reunifies you with your hangover.', 2],
  ['han', 'hag', 'bus', 0, 15, -10, 'day'],
  ['hag', 'sapa', 'bus', 0, 15, -12, 'day'],
  ['sapa', 'han', 'bus', 0, 18, -10, 'night'],
  ['han', 'hlb', 'bus', 0, 15, -4, 'day'],
  ['sgn', 'kul', 'flight', 0, 60, 0, 'day'],
  ['sgn', 'dps', 'flight', 0, 160, 0, 'day'],
  ['sgn', 'mnl', 'flight', 0, 140, 0, 'day'],
  ['kul', 'pen', 'bus', 0, 15, -5, 'day'],
  ['kul', 'cam', 'bus', 0, 10, -6, 'day'],
  ['cam', 'pen', 'minivan', 0, 12, -7, 'day'],
  ['kul', 'kin', 'flight', 0, 70, 0, 'day'],
  ['kul', 'dps', 'flight', 0, 80, 0, 'day'],
  ['kul', 'mnl', 'flight', 0, 120, 0, 'day'],
  ['kin', 'mnl', 'flight', 0, 110, 0, 'day'],
  ['dps', 'gil', 'boat', 0, 40, -6, 'day', 'Fast boat. "Fast" refers to how fast you spew.'],
  ['dps', 'ijn', 'combo', 0, 25, -10, 'day'],
  ['ijn', 'brm', 'minivan', 0, 25, -10, 'day'],
  ['brm', 'dps', 'bus', 0, 30, -14, 'night'],
  ['dps', 'kmd', 'flight', 0, 75, 0, 'day'],
  ['gil', 'kmd', 'boat', 2, 160, -8, 'day', 'Three-day budget liveaboard. The crew drinks more than you.', 8],
  ['mnl', 'eln', 'flight', 0, 80, 0, 'day'],
  ['mnl', 'bor', 'flight', 0, 60, 0, 'day'],
  ['mnl', 'sia', 'flight', 0, 85, 0, 'day'],
  ['mnl', 'btd', 'bus', 0, 20, -15, 'night', 'Night bus to Banaue, then a trike, then your legs.'],
  ['eln', 'bor', 'flight', 0, 75, 0, 'day'],
  ['bor', 'sia', 'flight', 0, 90, 0, 'day'],
];
export const ROUTES = R.map(([a, b, mode, extra, cost, hp, when, note, drinks], i) => ({ i, a, b, mode, extra, cost, hp, when, note: note || '', drinks: drinks || 0 }));
export const MODES = {
  bus: { icon: '🚌', name: 'Bus' }, minivan: { icon: '🚐', name: 'Minivan' }, train: { icon: '🚆', name: 'Train' },
  boat: { icon: '⛴️', name: 'Boat' }, flight: { icon: '✈️', name: 'Flight' }, combo: { icon: '🚌⛴️', name: 'Bus + boat' },
};

// Flight home to Oz from any airport (base, not scaled)
export const FLIGHT_HOME = 420;

// ---------------------------------------------------------------------------------------------
// Items. Backpack holds 8 slots (a stack is one slot). drink = standard drinks when consumed.
// shop = country codes (or '*') where it's sold. price is base.
// ---------------------------------------------------------------------------------------------
export const SLOTS = 8;
export const ITEMS = {
  goon: { name: 'Cask of goon (smuggled from Oz)', icon: '📦', drink: 10, hp: -2, desc: '4 litres of "fruity lexia". Ten drinks. Tastes like a headache.', shop: [] },
  tinnies: { name: 'Six-pack of tinnies', icon: '🍺', drink: 6, price: 9, shop: ['*'], desc: 'Six warm cans. Emergency rations.' },
  bucket: { name: 'Bucket kit (Sangsom + Red Bull)', icon: '🪣', drink: 7, hp: -2, price: 8, shop: ['TH'], desc: 'Thai rum, Thai Red Bull, a sandcastle bucket. Heart palpitations included.' },
  laolao: { name: 'Lao-Lao rice whisky', icon: '🍶', drink: 8, hp: -3, price: 3, shop: ['LA'], desc: 'Comes in a water bottle. Strips paint.' },
  happywater: { name: 'Happy water (unlabelled bottle)', icon: '🧪', drink: 7, hp: -2, price: 3, shop: ['VN'], desc: 'Homemade rice wine. Mostly happy.' },
  angkorcan: { name: 'Slab of Angkor tins', icon: '🍻', drink: 12, price: 12, shop: ['KH'], desc: '24 cans. A slab is a slab, anywhere in the world.' },
  arak: { name: 'Bottle of arak', icon: '🍾', drink: 8, hp: -3, price: 7, shop: ['ID'], desc: 'Balinese palm spirit. Buy it sealed. Seriously.' },
  tanduay: { name: 'Tanduay rum', icon: '🥃', drink: 8, price: 6, shop: ['PH'], desc: 'Filipino rum. Cheaper than water, which is in short supply.' },
  vegemite: { name: 'Vegemite (Mum sent it)', icon: '🫙', heal: 22, price: 14, shop: ['MY', 'ID'], desc: 'Spread thick. +22 health. Tastes like home and salt.' },
  tigerbalm: { name: 'Tiger Balm', icon: '🐯', heal: 8, price: 3, shop: ['TH', 'MY', 'KH', 'LA', 'VN'], desc: 'Rub it on anything. +8 health. Keep it away from your eyes. And elsewhere.' },
  noodles: { name: 'Mama instant noodles', icon: '🍜', heal: 6, price: 1, shop: ['*'], desc: 'Dinner of champions. +6 health.' },
  condoms: { name: 'Condoms (3-pack)', icon: '🎈', uses: 3, price: 4, shop: ['*'], desc: 'Used up automatically. Cuts your STD risk by about 90%. Be a legend.' },
  padlock: { name: 'Padlock', icon: '🔒', passive: true, price: 4, shop: ['*'], desc: 'Stops dorm and night-bus thieves.' },
  earplugs: { name: 'Earplugs', icon: '🦻', passive: true, price: 2, shop: ['*'], desc: 'Dorms restore +5 more health. Snorers defeated.' },
  imodium: { name: 'Imodium', icon: '💊', uses: 2, price: 5, shop: ['*'], desc: 'Used automatically when your guts go. Two doses.' },
  antibiotics: { name: 'Dodgy pharmacy antibiotics', icon: '💉', price: 12, shop: ['TH', 'KH', 'LA', 'VN', 'ID', 'PH'], desc: 'No prescription required. 60% chance of curing whatever you picked up.' },
  pants: { name: 'Elephant pants', icon: '👖', passive: true, price: 5, shop: ['TH', 'LA', 'KH'], desc: '+1 charm at backpacker bars. Counts as long pants at temples.' },
  singlet: { name: 'Bintang singlet', icon: '🎽', passive: true, price: 6, shop: ['ID'], desc: '+1 charm everywhere except fancy bars, where it gets you thrown out.' },
  raybans: { name: 'Fake Ray-Bans', icon: '🕶️', passive: true, price: 6, shop: ['TH', 'KH', 'VN'], desc: '+1 charm. May fall apart at any moment.' },
  guitar: { name: 'Hostel guitar', icon: '🎸', passive: true, price: 30, shop: ['TH', 'VN', 'ID'], desc: '+1 charm at backpacker bars. May provoke violence.' },
  lonely: { name: 'Lonely Planet (photocopied, 2009)', icon: '📕', passive: true, price: 4, shop: ['KH', 'VN'], desc: '+25% landmark points. Half the restaurants in it have closed.' },
  selfie: { name: 'Selfie stick', icon: '🤳', passive: true, price: 5, shop: ['*'], desc: '+10% landmark points.' },
  amulet: { name: 'Lucky Buddha amulet', icon: '📿', passive: true, price: 15, shop: ['TH', 'LA', 'KH'], desc: '-25% chance of getting caught at a border with... anything. And a little luck.' },
  suit: { name: 'Hoi An tailored suit', icon: '🤵', passive: true, price: 0, shop: [], desc: '+2 charm at fancy bars. Fits like a glove (for a slightly different person).' },
  bike: { name: 'Honda Win motorbike', icon: '🏍️', passive: true, price: 0, shop: [], desc: 'In Vietnam, land travel costs $3 and half the health. Small crash risk. Sell it in Saigon or Hanoi.' },
  gasmask: { name: 'Rented gas mask', icon: '😷', passive: true, price: 0, shop: [], desc: 'Ijen sulphur protection.' },
  package: { name: 'Mysterious package', icon: '📦', passive: true, price: 0, shop: [], desc: 'Definitely protein powder. Deliver it. Do not open it.' },
  phone: { name: 'Contraband phone', icon: '📱', passive: true, price: 0, shop: [], desc: 'Prison wifi. Crypto and Mum, from inside.' },
};

// ---------------------------------------------------------------------------------------------
// Mates. Perks are read by sim.js.
// ---------------------------------------------------------------------------------------------
export const MATES = {
  davo: { name: 'Davo', from: 'Penrith', icon: '🧔', perk: 'tol', desc: 'Drinks like a drain. Nights cost you less health. Starts fights.' },
  macca: { name: 'Macca', from: 'the Gold Coast', icon: '😎', perk: 'wing', desc: 'Wingman. +1 charm.' },
  jono: { name: 'Jono', from: 'Hamilton, NZ', icon: '🥝', perk: 'peace', desc: 'Kiwi peacemaker. Half as many fights with locals.' },
  tarquin: { name: 'Tarquin', from: 'Surrey (gap yah)', icon: '🎩', perk: 'rich', desc: 'Posh Pom. Shouts a quarter of your bar tabs. Says "rah" a lot.' },
  shazza: { name: 'Shazza', from: 'Wollongong', icon: '💪', perk: 'brawl', desc: 'Wingwoman (+1 charm). Wins fights. Starts them too.' },
  bazza: { name: 'Bazza', from: 'Townsville (62, been coming since \'89)', icon: '👴', perk: 'guide', desc: '+20% landmark points. Sees scams coming.' },
  hamish: { name: 'Hamish', from: 'Glasgow', icon: '🏴', perk: 'tol', desc: 'Drinks like a drain. Unintelligible after 9pm.' },
  nong: { name: 'Nong', from: 'Bangkok (ex-tuk-tuk driver)', icon: '🛺', perk: 'local', desc: 'Local fixer. Travel 20% cheaper, scams avoided.' },
  steve: { name: 'Soi Dog Steve', from: 'a beach', icon: '🐕', perk: 'dog', desc: 'A stray dog who adopted you. Guards your stuff from thieves. A good boy.' },
};
export const MAX_MATES = 3;

// ---------------------------------------------------------------------------------------------
// Starting characters.
// ---------------------------------------------------------------------------------------------
export const ARCHETYPES = {
  tradie: {
    name: 'Tradie on Long Service Leave', icon: '🦺', cash: 3200, hp: 100, charm: 2, mum: 5, tol: 1, poker: 0, fight: 1,
    items: [['tinnies', 1], ['vegemite', 1]], mate: 'davo',
    blurb: 'Twelve years of 6am starts. Your body is 30% Bundy. Your ute is in your mum\'s driveway.',
  },
  gapyear: {
    name: 'Private School Gap Year', icon: '🎓', cash: 1800, hp: 100, charm: 3, mum: 9, tol: 0, poker: 2, fight: 0,
    items: [['lonely', 1], ['vegemite', 1], ['condoms', 1]], mate: 'macca',
    blurb: 'Dad is a dentist in Mosman. Mum thinks you\'re "finding yourself". You found a bucket.',
  },
  fifo: {
    name: 'FIFO Miner from the Pilbara', icon: '⛏️', cash: 6000, hp: 90, charm: 1, mum: 3, tol: 2, poker: 0, fight: 2,
    items: [['goon', 1], ['vegemite', 2]], mate: null,
    blurb: 'Two weeks on, one week off, and you\'ve saved up three years of "off". Bad back. Good wallet.',
  },
  crypto: {
    name: 'Uni Dropout Crypto Bro', icon: '📈', cash: 700, hp: 100, charm: 2, mum: 7, tol: 0, poker: 4, fight: 0,
    items: [['selfie', 1], ['vegemite', 1]], mate: null, coins: { ROO: 1500 },
    blurb: 'You dropped out of a commerce degree to "go full time on crypto". Your entire net worth is in Roocoin.',
  },
};

export const FIRST = ['Brayden', 'Jaxon', 'Kyle', 'Dazza', 'Shane', 'Bodhi', 'Kayden', 'Brodie', 'Tyson', 'Lachie', 'Jarrod', 'Mitch', 'Hayden', 'Corey', 'Blake', 'Taylor', 'Jayden', 'Ricky', 'Wayne', 'Nathan'];
export const SUBURB = ['Penrith', 'Frankston', 'Logan', 'Mandurah', 'Wagga', 'Cranbourne', 'Ipswich', 'Elizabeth', 'Campbelltown', 'Toowoomba', 'Rockhampton', 'Dubbo', 'Geelong', 'Bunbury', 'Mount Druitt', 'Shepparton'];

// ---------------------------------------------------------------------------------------------
// Crypto. vol = daily volatility, drift = daily drift, rug = daily rug-pull chance.
// ---------------------------------------------------------------------------------------------
export const COINS = {
  ROO: { name: 'Roocoin', icon: '🦘', p: 1.0, vol: 0.1, drift: 0.004, rug: 0.002 },
  VEGE: { name: 'VegeChain', icon: '🫙', p: 4.2, vol: 0.06, drift: 0.002, rug: 0 },
  SNAG: { name: 'Sausage Sizzle DAO', icon: '🌭', p: 0.37, vol: 0.16, drift: 0.003, rug: 0.006 },
  GOON: { name: 'GoonBag Finance', icon: '🍷', p: 0.002, vol: 0.24, drift: 0.006, rug: 0.012 },
  THONG: { name: 'ThongSwap', icon: '🩴', p: 0.0001, vol: 0.34, drift: 0.01, rug: 0.02 },
};

// ---------------------------------------------------------------------------------------------
// STDs. Comic names; real consequences: health drain until cured.
// ---------------------------------------------------------------------------------------------
export const STDS = [
  { id: 'tickle', name: 'The Patong Tickle', drain: 2 },
  { id: 'drip', name: 'The Mekong Drip', drain: 2 },
  { id: 'clap', name: 'Classic Chlamydia', drain: 2 },
  { id: 'fever', name: 'Full Moon Fever (not the party)', drain: 3 },
  { id: 'super', name: 'Super Gonorrhoea (Khao San strain)', drain: 4 },
  { id: 'crabs', name: 'Crabs (the Koh Rong kind)', drain: 1 },
  { id: 'itch', name: 'The Bui Vien Itch', drain: 2 },
];

export const PARTNERS = [
  ['Freja', 'Copenhagen'], ['Chloe', 'Bristol'], ['Ingrid', 'Bergen'], ['Lucía', 'Madrid'], ['Hannah', 'Munich'], ['Jess', 'Auckland'],
  ['Aiko', 'Osaka'], ['Priya', 'London'], ['Gabi', 'São Paulo'], ['Noa', 'Tel Aviv'], ['Anouk', 'Utrecht'], ['Siobhan', 'Cork'],
  ['Mai', 'Hanoi'], ['Camille', 'Lyon'], ['Kayla', 'Toronto'], ['Ella', 'Stockholm'], ['Tash', 'Brisbane'], ['Bea', 'Cebu'],
  ['Maja', 'Kraków'], ['Rosa', 'Rotterdam'], ['Zoe', 'Wellington'], ['Hye-jin', 'Seoul'], ['Fern', 'Chiang Mai'], ['Dewi', 'Yogyakarta'],
];
export const FADES = [
  'The gecko on the ceiling saw everything and will tell no one.',
  'You put on Jack Johnson. She stayed anyway.',
  'The bunk above you creaked in protest. Sorry, Henrik.',
  'The ceiling fan wobbled ominously the whole time.',
  'Somewhere a rooster started crowing at 3am, as is tradition.',
  'Afterwards she asked if you had any Vegemite. A keeper.',
  'The aircon dripped on you both. Nobody cared.',
  'A tuk-tuk honked outside. Twice. Possibly in applause.',
  'The mosquito net was mostly decorative.',
];

// ---------------------------------------------------------------------------------------------
// Achievements. Checked in sim.js. pts = bonus score.
// ---------------------------------------------------------------------------------------------
export const ACHIEVEMENTS = {
  khaosan: { name: 'Never Left Khao San', icon: '🛣️', pts: 400, desc: 'End a run of 10+ days without ever leaving Khao San Road.' },
  fullmoon: { name: 'Full Moon Fever', icon: '🌕', pts: 100, desc: 'Survive a Full Moon Party.' },
  tubing: { name: 'In the Tubing', icon: '🛟', pts: 100, desc: 'Go tubing in Vang Vieng and live.' },
  hilton: { name: 'Bangkok Hilton Alumnus', icon: '⛓️', pts: 250, desc: 'Get out of prison by any means.' },
  escape: { name: 'The Great Escape', icon: '🥄', pts: 300, desc: 'Tunnel out of prison with a spoon.' },
  clean: { name: 'Rubber Ducky', icon: '🦆', pts: 200, desc: '5+ hookups in a run with no STD.' },
  mumsfav: { name: "Mum's Favourite", icon: '💐', pts: 200, desc: 'Travel 30+ days without asking Mum for money.' },
  collector: { name: 'Gotta Catch Em All', icon: '🦠', pts: 150, desc: 'Catch 3 different STDs in one run.' },
  sondoong: { name: 'Biggest Hole on Earth', icon: '🕳️', pts: 300, desc: 'Get a pic inside Son Doong.' },
  allcountries: { name: 'Banana Pancake Bingo', icon: '🥞', pts: 300, desc: 'Visit all seven countries in one run.' },
  liver: { name: 'Liver of Steel', icon: '🫀', pts: 150, desc: 'Drink 500 standard drinks in one run.' },
  casanova: { name: 'Root Rat', icon: '🐀', pts: 250, desc: '10 hookups you did not pay for in one run.' },
  remote: { name: 'Off the Pancake Trail', icon: '🧭', pts: 250, desc: 'Get pics at 5 remote landmarks in one run.' },
  wagmi: { name: 'WAGMI', icon: '🚀', pts: 150, desc: 'Cash out a coin at 10x what you paid.' },
  rugged: { name: 'NGMI', icon: '🪦', pts: 50, desc: 'Get rug-pulled.' },
  skint: { name: 'Absolutely Skint', icon: '🪙', pts: 50, desc: 'Hit $0 with nothing left in crypto.' },
  tattoo: { name: '"Chicken Fried Rice"', icon: '🖋️', pts: 75, desc: 'Get a drunk tattoo in a language you can\'t read.' },
  telly: { name: 'Sixty Minutes, Give or Take', icon: '📺', pts: 100, desc: 'Sell your prison story to Aussie telly.' },
  home: { name: 'Home for Christmas', icon: '🏠', pts: 150, desc: 'Fly home alive after 30+ days.' },
  sober: { name: 'Clarity', icon: '🧘', pts: 25, desc: 'Go four days without a drink. Find yourself. Ruin everything.' },
  bike: { name: 'Top Gear Special', icon: '🏍️', pts: 100, desc: 'Ride a Honda Win from one end of Vietnam to the other.' },
  wonderwall: { name: 'Anyway, Here\'s Wonderwall', icon: '🎸', pts: 50, desc: 'Deal with a Wonderwall guy.' },
  dragon: { name: 'Here Be Dragons', icon: '🦎', pts: 100, desc: 'Get bitten by a Komodo dragon and survive.' },
  nightbus: { name: 'Bus of Death Survivor', icon: '💀', pts: 100, desc: 'Ride the 30-hour bus between Laos and Vietnam.' },
};
