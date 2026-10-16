import { EGYPT_LEVELS } from './egypt.js';
import { EXPANSION_LEVELS } from './expansion.js';

export const LEVELS = [...EGYPT_LEVELS, ...EXPANSION_LEVELS];
const byId = Object.fromEntries(LEVELS.map((l) => [l.id, l]));
export const getLevel = (id) => byId[id];
export const nextLevel = (id) => {
  const i = LEVELS.findIndex((l) => l.id === id);
  // the time loop: Mars sends you back to the beginning
  return LEVELS[(i + 1) % LEVELS.length];
};
