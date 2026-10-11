// High scores. With LEADERBOARD_URL set (see leaderboard/README.md) scores go to the shared
// Cloudflare Worker; until then each browser keeps its own local Hall of Infamy.
export const LEADERBOARD_URL = '';

const LOCAL_KEY = 'artblaster.scores';
const NAME_KEY = 'artblaster.name';

export const isOnline = () => !!LEADERBOARD_URL;

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; } catch (e) { return []; }
}
function writeLocal(list) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, 50))); } catch (e) { /* storage blocked */ }
}

export function savedName() {
  try { return localStorage.getItem(NAME_KEY) || ''; } catch (e) { return ''; }
}
function saveName(n) {
  try { localStorage.setItem(NAME_KEY, n); } catch (e) { /* storage blocked */ }
}

function localScores(period) {
  const since = period === 'week' ? Date.now() / 1000 - 7 * 86400 : 0;
  return readLocal().filter(s => s.createdAt >= since).slice(0, 20);
}

function saveLocal(entry) {
  const row = { ...entry, name: entry.name.trim().slice(0, 18) || 'Anonymous Billionaire', createdAt: Math.floor(Date.now() / 1000) };
  const list = readLocal();
  list.push(row);
  list.sort((a, b) => b.bill - a.bill);
  writeLocal(list);
  return { rank: list.indexOf(row) + 1, total: list.length, scores: list.slice(0, 20), local: true };
}

// Network trouble or a server error falls back to the local board, so the end screen always works.
async function tryFetch(url, opts) {
  try {
    const r = await fetch(url, { ...opts, signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined });
    if (r.status >= 500) return null;
    return r;
  } catch (e) {
    return null;
  }
}

export async function getScores(period = 'all') {
  if (!isOnline()) return { scores: localScores(period), local: true };
  const r = await tryFetch(`${LEADERBOARD_URL}/scores?period=${period}`);
  if (!r || !r.ok) return { scores: localScores(period), local: true, unreachable: true };
  return r.json();
}

export async function submitScore(entry) {
  saveName(entry.name);
  if (!isOnline()) return saveLocal(entry);
  const r = await tryFetch(`${LEADERBOARD_URL}/scores`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry),
  });
  if (!r) return { ...saveLocal(entry), unreachable: true };
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || 'Could not post your score');   // e.g. rate limit: tell the player
  return body;
}
