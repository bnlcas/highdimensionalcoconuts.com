// Names and idle thoughts for the little people you can click on.

const pickFrom = (arr, r) => arr[Math.floor(r * arr.length) % arr.length];

const EG = ['Merer', 'Idu', 'Nefer', 'Ankhhaf', 'Khnumhotep', 'Ptahshepses', 'Sabu', 'Ipi', 'Meryre', 'Kaemked', 'Niankhkhnum', 'Tjetji', 'Henutsen', 'Meresankh', 'Nebet', 'Iput', 'Khenut', 'Nefertiabet', 'Hetepheres', 'Rahotep', 'Nofret', 'Seneb', 'Kai', 'Djedi', 'Inti', 'Wenis', 'Mereruka', 'Ti', 'Akhethotep', 'Nikaure'];
const EG_GANGS = ['Friends of Khufu', 'Drunkards of the Plateau', 'Followers of the Falcon', 'Green Phyle', 'Great Phyle', 'Little Phyle', 'Last Phyle', 'Asiatic Phyle'];
const MAYA = ["K'inich", 'Balam', 'Chak', 'Itzel', 'Ixchel', 'Yaxun', "K'an", 'Ek', 'Muwan', 'Sak', 'Nikte', "Tz'ikin", 'Kukul', 'Hunab', 'Ixbalam', 'Yaxkin', "Ch'ok"];
const AZ = ['Cuauhtli', 'Itzcoatl', 'Citlali', 'Xochitl', 'Tlacotl', 'Miztli', 'Yaotl', 'Tochtli', 'Coatl', 'Ollin', 'Atl', 'Tecpatl', 'Quiahuitl', 'Mazatl', 'Ehecatl', 'Nenetl', 'Tlanextli', 'Yaretzi'];
const UT = ['Brynlee', 'Jaxon', 'Kade', 'Saylor', 'Oaklee', 'Tanner', 'Bridger', 'McKay', 'Afton', 'Lynnette', 'Kaysen', 'Rylee', 'Stockton', 'Hallie', 'Porter', 'Breckyn', 'Tayten', 'Elyse'];
const OL_TRAITS = ['the tall one', 'from the east bank', 'who sings', 'with the jade earspool', 'the fast carrier', 'who hates mosquitoes', 'from upriver', 'the grumpy one'];

export const NAMES = {
  egypt: (r1, r2) => `${pickFrom(EG, r1)} of the ${pickFrom(EG_GANGS, r2)}`,
  olmec: (r1, r2, id) => `Laborer #${100 + (id % 900)} ${pickFrom(OL_TRAITS, r2)} (Olmec names are lost)`,
  maya: (r1, r2) => `${pickFrom(MAYA, r1)} ${pickFrom(MAYA, r2)}`,
  aztec: (r1, r2) => `${pickFrom(AZ, r1)} of calpolli ${pickFrom(['Moyotlan', 'Teopan', 'Atzacualco', 'Cuepopan'], r2)}`,
  cahokia: (r1, r2, id) => `A Cahokian ${pickFrom(OL_TRAITS, r2)} (names unrecorded)`,
  deseret: (r1, r2) => `${pickFrom(UT, r1)} ${pickFrom(['Larsen', 'Jensen', 'Christensen', 'Hansen', 'Olsen', 'Peterson', 'Nielsen', 'Young', 'Smith'], r2)}`,
  mars: (r1, r2, id) => `${pickFrom(UT, r1)}-${(id % 97) + 2} ${pickFrom(['Larsen', 'Jensen', 'Hansen', 'Olsen', 'Nielsen'], r2)}`,
};

export const THOUGHTS = {
  hungry: ['When do we eat?', 'My stomach is louder than the overseer.', 'No bread, no blocks.', 'I could eat a whole sledge.'],
  thirsty: ['Not even a sip of {drink}?', 'A day without {drink} is a day wasted.', 'Who drank all the {drink}?'],
  happy: ['Best job in the kingdom.', 'Free {food} AND free {drink}? I am never leaving.', 'My grandchildren will see this {structure}.', 'Our crew is the fastest. Ask anyone.'],
  sad: ['My back hurts.', 'Is it lunch yet?', 'I miss my village.', 'Who designed this thing?'],
  strike: ['We sit until we are paid!', 'Rations first, rocks later.', 'Solidarity!'],
  storm: ['I have sand in places I did not know I had.', 'Cannot see my own feet.'],
  farm: ['The soil is good this year.', 'Plant, wait, harvest, repeat.', 'Do they know who feeds them?'],
  farmIdle: ['Fields underwater, so I haul rocks. Fair enough.', 'Back to farming soon, thank the gods.'],
  brew: ['Secret ingredient: more grain.', 'This batch is my best.', 'Taste-testing is part of the job.'],
  quarry: ['Chip, chip, chip.', 'My chisel is blunt again.', 'This one has a nice grain to it.'],
  haul: ['One, two, PULL!', 'Pour the water! No, in FRONT of the sledge!', 'The ramp gets longer every week.'],
  mason: ['A little to the left. Perfect.', 'Not a knife blade between these joints.', 'Nice view from up here.'],
  boat: ['Downstream is easy. Upstream, we sail.', 'Watch out for crocodiles.', 'Full load today.'],
  priest: ['The gods are watching. Mostly.', 'I have copied this text 300 times.', 'Did someone remember the offerings?'],
};
