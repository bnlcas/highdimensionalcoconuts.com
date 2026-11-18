// Banana Pancake Trail — the "drawn on a beer coaster at 2am" map. Hand-simplified coastlines, SVG, pan/zoom.
import * as D from './data.js';
import * as S from './sim.js';

const K = 24, LON0 = 94, LAT0 = 25, W = 33.5 * K, H = 36 * K;
const X = (lon) => (lon - LON0) * K;
const Y = (lat) => (LAT0 - lat) * K;
export const cityXY = (id) => { const c = D.CITIES[id]; return [X(c.lon + (c.dx || 0)), Y(c.lat + (c.dy || 0))]; };

const LAND = [
  // mainland SE Asia + southern China
  [[92.5, 26], [118.5, 26], [118.0, 24.5], [116.5, 23.0], [114.2, 22.3], [113.5, 22.2], [112, 21.7], [110.5, 21.2], [110.3, 20.3], [109.9, 20.6], [109.6, 21.5], [108.5, 21.6], [107.5, 21.3], [106.8, 20.7], [106.1, 19.9], [105.7, 19.0], [106.2, 18.2], [106.6, 17.5], [107.2, 16.7], [108.2, 16.05], [108.8, 15.2], [109.2, 13.8], [109.3, 12.6], [109.2, 11.6], [108.6, 11.1], [107.7, 10.6], [106.8, 10.3], [106.4, 9.6], [105.4, 8.6], [104.8, 8.7], [104.9, 9.6], [104.5, 10.4], [103.8, 10.5], [103.5, 10.7], [103.1, 11.3], [102.9, 11.9], [102.4, 12.2], [101.7, 12.6], [100.95, 12.7], [100.9, 13.4], [100.5, 13.5], [100.0, 13.4], [99.95, 12.8], [99.8, 12.0], [99.5, 11.0], [99.2, 10.3], [99.3, 9.3], [99.9, 9.3], [100.3, 8.4], [100.6, 7.2], [101.3, 6.9], [102.2, 6.2], [103.1, 5.4], [103.45, 4.3], [103.4, 3.4], [103.9, 2.3], [104.3, 1.4], [103.6, 1.3], [103.3, 1.6], [102.5, 2.0], [101.3, 2.8], [100.8, 3.9], [100.4, 5.0], [100.35, 5.9], [100.1, 6.5], [99.7, 6.9], [99.4, 7.4], [98.9, 8.0], [98.5, 8.1], [98.3, 8.4], [98.3, 9.1], [98.6, 10.0], [98.6, 11.3], [98.7, 12.3], [98.2, 13.4], [97.9, 14.8], [97.7, 16.2], [97.2, 16.9], [96.4, 16.7], [95.4, 15.8], [94.8, 16.0], [94.3, 16.5], [94.4, 18.0], [94.0, 18.5], [93.5, 20.0], [92.5, 21.0]],
  // Hainan
  [[108.7, 19.2], [109.6, 20.0], [110.6, 20.1], [111.0, 19.6], [110.4, 18.6], [109.6, 18.2], [108.7, 18.5]],
  // Taiwan
  [[120.1, 23.0], [120.7, 22.0], [121.0, 22.3], [121.5, 23.2], [121.9, 24.6], [121.5, 25.3], [121.0, 25.0], [120.3, 24.0]],
  // Sumatra
  [[95.3, 5.6], [96.5, 5.2], [97.5, 5.2], [98.7, 3.8], [99.8, 2.9], [100.6, 2.1], [101.5, 1.7], [102.5, 1.0], [103.4, 0.5], [103.8, -0.6], [104.5, -1.0], [104.9, -2.3], [105.8, -3.2], [105.9, -4.5], [105.8, -5.8], [104.6, -5.9], [103.6, -4.9], [102.3, -3.9], [101.3, -2.6], [100.4, -1.1], [99.8, 0.0], [99.1, 1.1], [98.3, 2.2], [97.6, 2.9], [96.6, 3.9], [95.8, 4.6], [95.2, 5.4]],
  // Java
  [[105.2, -6.8], [105.9, -6.0], [106.8, -6.0], [107.6, -6.2], [108.4, -6.3], [109.5, -6.8], [110.4, -6.9], [111.2, -6.6], [112.0, -6.9], [112.7, -7.0], [113.6, -7.7], [114.4, -7.75], [114.5, -8.6], [113.5, -8.4], [112.5, -8.3], [111.0, -8.2], [110.0, -8.0], [109.0, -7.7], [108.0, -7.7], [107.0, -7.4], [106.4, -7.3], [105.5, -6.9]],
  // Bali, Lombok, Sumbawa, Flores, Sumba, Timor
  [[114.45, -8.1], [115.1, -8.07], [115.7, -8.35], [115.5, -8.6], [115.2, -8.85], [114.95, -8.6], [114.5, -8.35]],
  [[115.85, -8.25], [116.5, -8.25], [116.7, -8.6], [116.3, -8.9], [115.85, -8.8]],
  [[116.8, -8.6], [117.4, -8.4], [118.2, -8.3], [119.0, -8.3], [119.2, -8.6], [118.5, -8.9], [117.5, -9.0], [116.9, -8.9]],
  [[119.8, -8.4], [120.6, -8.3], [121.8, -8.5], [122.9, -8.2], [122.9, -8.6], [121.5, -8.9], [120.4, -8.8], [119.8, -8.7]],
  [[119.0, -9.5], [120.2, -9.6], [120.8, -10.1], [119.8, -10.0], [119.0, -9.8]],
  [[123.5, -10.2], [124.5, -9.4], [125.5, -8.6], [127.3, -8.4], [127.0, -8.8], [125.0, -9.6], [124.0, -10.3]],
  // Borneo
  [[109.6, 1.9], [110.5, 1.7], [111.2, 1.4], [111.8, 2.6], [113.0, 3.2], [114.0, 4.6], [115.0, 5.0], [115.6, 5.6], [116.1, 6.1], [116.8, 7.0], [117.3, 6.6], [117.8, 6.0], [118.4, 5.8], [119.2, 5.3], [118.5, 4.6], [118.0, 4.3], [117.7, 3.5], [117.9, 2.0], [118.9, 1.0], [117.9, 0.8], [117.5, 0.0], [117.3, -1.0], [116.6, -1.6], [116.3, -2.6], [116.0, -3.6], [114.6, -4.0], [114.5, -3.5], [113.3, -3.2], [112.2, -3.4], [111.6, -3.0], [110.3, -2.9], [110.1, -1.8], [109.2, -0.8], [108.9, 0.3], [109.0, 1.2]],
  // Sulawesi (very roughly)
  [[119.4, -5.5], [119.6, -4.0], [119.5, -3.2], [118.8, -2.7], [119.3, -1.5], [119.8, -0.2], [120.2, 0.6], [121.0, 1.3], [122.4, 1.0], [123.4, 0.9], [124.4, 1.2], [125.2, 1.6], [124.9, 1.0], [124.0, 0.4], [122.9, 0.5], [121.5, 0.5], [120.6, 0.3], [120.3, -0.6], [120.9, -1.4], [121.6, -1.0], [122.8, -0.8], [123.4, -0.9], [122.4, -1.5], [121.8, -2.0], [122.2, -3.0], [122.9, -4.5], [122.6, -5.4], [121.8, -4.8], [121.3, -4.3], [120.9, -3.4], [120.4, -3.9], [120.4, -5.5]],
  // Philippines
  [[120.6, 18.5], [121.3, 18.6], [122.2, 18.5], [122.3, 17.3], [122.2, 16.3], [121.6, 15.8], [121.6, 15.0], [121.7, 14.2], [122.2, 14.0], [122.7, 14.3], [123.3, 13.9], [124.1, 13.1], [124.1, 12.6], [123.3, 12.9], [122.6, 13.5], [121.9, 13.9], [121.3, 13.6], [120.7, 13.8], [120.6, 14.5], [120.3, 14.8], [119.9, 15.4], [119.8, 16.3], [120.3, 16.6], [120.4, 17.5]],
  [[120.4, 13.5], [121.2, 13.4], [121.5, 12.6], [121.2, 12.2], [120.6, 12.5], [120.4, 13.0]],
  [[117.2, 8.3], [117.7, 8.5], [118.4, 9.3], [119.1, 10.1], [119.6, 11.0], [119.7, 11.5], [119.3, 11.4], [118.8, 10.6], [118.0, 9.6], [117.4, 8.9], [117.1, 8.5]],
  [[121.9, 11.9], [122.6, 11.8], [123.1, 11.5], [122.6, 10.6], [122.0, 10.5], [121.9, 11.2]],
  [[122.5, 10.9], [123.2, 10.9], [123.5, 10.0], [123.2, 9.1], [122.8, 9.3], [122.4, 10.0]],
  [[123.3, 11.2], [124.0, 10.7], [123.9, 10.2], [123.4, 9.5], [123.3, 10.3]],
  [[123.8, 10.1], [124.5, 10.0], [124.5, 9.6], [123.9, 9.6]],
  [[124.2, 12.6], [125.3, 12.6], [125.7, 11.2], [125.0, 10.1], [124.5, 10.3], [124.3, 11.4], [124.6, 12.0]],
  [[122.0, 7.0], [122.8, 7.5], [123.6, 8.0], [124.2, 8.3], [124.8, 8.9], [125.5, 9.6], [126.0, 9.0], [126.3, 8.5], [126.5, 7.3], [126.2, 6.4], [125.6, 5.7], [125.4, 6.6], [124.4, 6.2], [124.0, 6.9], [123.6, 7.6], [122.8, 7.0], [122.2, 6.9]],
];
const LAKE = [[103.6, 13.35], [104.0, 13.15], [104.4, 12.85], [104.55, 12.6], [104.25, 12.75], [103.8, 13.05], [103.5, 13.25]];
const MEKONG = [[100.6, 21.8], [100.1, 20.35], [101.0, 20.2], [102.13, 19.9], [101.7, 18.8], [101.6, 18.2], [102.6, 17.97], [103.6, 18.3], [104.8, 17.4], [104.75, 16.55], [105.8, 15.12], [105.85, 14.0], [105.95, 13.5], [106.0, 12.5], [105.45, 12.0], [104.92, 11.56], [105.4, 11.0], [105.9, 10.3], [106.6, 9.7]];
const LABELS = [
  ['THAILAND', 101.2, 16.2, 'land'], ['LAOS', 103.3, 17.0, 'land'], ['CAMBODIA', 104.9, 12.75, 'land'], ['VIETNAM', 107.0, 13.9, 'land'],
  ['MALAYSIA', 102.9, 4.4, 'land'], ['MALAYSIA', 114.0, 2.3, 'land'], ['INDONESIA', 112.5, -1.2, 'land'], ['INDONESIA', 108.5, -7.15, 'land'],
  ['PHILIPPINES', 122.9, 15.2, 'land'], ['Myanmar', 96.0, 21.3, 'grey'], ['China', 106.5, 23.8, 'grey'], ['Sumatra', 101.6, -0.9, 'grey'],
  ['Gulf of Thailand', 101.6, 9.4, 'sea'], ['Andaman Sea', 96.2, 11.5, 'sea'], ['South China Sea', 113.2, 13.0, 'sea'], ['Java Sea', 111.0, -5.0, 'sea'],
  ['Celebes Sea', 122.2, 4.2, 'sea'], ['Indian Ocean', 99.5, -7.5, 'sea'], ['Sulu Sea', 120.6, 8.6, 'sea'],
];
const ISLANDS = ['kpg', 'kto', 'phi', 'kkr', 'gil', 'bor', 'sia', 'phk'];
const COUNTRY_COL = { TH: '#e8475f', LA: '#2f6fd1', KH: '#2b9a5c', VN: '#e8a01e', MY: '#7a4fd0', ID: '#e2622f', PH: '#18a2b8' };
const pts = (arr) => arr.map(([lo, la]) => `${X(lo).toFixed(1)},${Y(la).toFixed(1)}`).join(' ');

function baseSVG() {
  const rings = [[640, 250, 70], [205, 640, 54], [520, 790, 62]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" class="ring"/><circle cx="${x + 4}" cy="${y + 3}" r="${r - 5}" class="ring2"/>`).join('');
  return `
  <defs>
    <filter id="wob" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter>
    <pattern id="waves" width="46" height="26" patternUnits="userSpaceOnUse"><path d="M3 14 q5 -5 10 0 t10 0" class="wave"/></pattern>
  </defs>
  <rect x="0" y="0" width="${W}" height="${H}" class="sea"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#waves)"/>
  <g class="rings">${rings}</g>
  <g filter="url(#wob)">
    ${LAND.map((p) => `<polygon points="${pts(p)}" class="land"/>`).join('')}
    ${ISLANDS.map((id) => { const [x, y] = cityXY(id); return `<ellipse cx="${x}" cy="${y}" rx="7" ry="5" class="land"/>`; }).join('')}
    <polygon points="${pts(LAKE)}" class="lake"/>
    <polyline points="${pts(MEKONG)}" class="river"/>
  </g>
  ${LABELS.map(([t, lo, la, k]) => `<text x="${X(lo)}" y="${Y(la)}" class="lbl-${k}">${t}</text>`).join('')}
  <text x="${X(117)}" y="${Y(-10.2)}" class="lbl-joke">↓ Straya (about 6 hrs, mate)</text>
  <text x="${X(94.6)}" y="${Y(-10.4)}" class="lbl-note">Not to scale. Drawn on a coaster at 2am.</text>
  <g class="compass" transform="translate(${X(125.2)},${Y(21.8)})"><circle r="22"/><path d="M0 -18 L5 0 L0 18 L-5 0 Z"/><text y="-25">N</text><text y="36" class="sm">(ish)</text></g>`;
}

export function createMap(el, { onCity }) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'map-svg');
  svg.innerHTML = `<g class="base">${baseSVG()}</g><g class="net"></g><g class="trail"></g><g class="reach"></g><g class="nodes"></g><g class="me"></g>`;
  el.appendChild(svg);
  const g = (c) => svg.querySelector('.' + c);
  let vb = { x: 0, y: 0, w: W, h: H };
  const apply = () => svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  apply();

  // static network of all routes (faint)
  g('net').innerHTML = D.ROUTES.filter((r) => r.mode !== 'flight').map((r) => { const [x1, y1] = cityXY(r.a), [x2, y2] = cityXY(r.b); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`; }).join('');

  // ---- pan / zoom ----
  const toSvg = (cx, cy) => { const r = svg.getBoundingClientRect(); const sc = Math.max(vb.w / r.width, vb.h / r.height); const ox = (r.width * sc - vb.w) / 2, oy = (r.height * sc - vb.h) / 2; return [vb.x - ox + (cx - r.left) * sc, vb.y - oy + (cy - r.top) * sc]; };
  const zoom = (f, cx, cy) => {
    const nw = Math.min(W * 1.1, Math.max(W / 7, vb.w * f));
    const k = nw / vb.w;
    const [px, py] = cx == null ? [vb.x + vb.w / 2, vb.y + vb.h / 2] : toSvg(cx, cy);
    vb = { x: px - (px - vb.x) * k, y: py - (py - vb.y) * k, w: vb.w * k, h: vb.h * k };
    apply();
  };
  svg.addEventListener('wheel', (e) => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY); }, { passive: false });
  let drag = null, moved = false;
  const pointers = new Map();
  svg.addEventListener('pointerdown', (e) => { pointers.set(e.pointerId, [e.clientX, e.clientY]); drag = { x: e.clientX, y: e.clientY, vb: { ...vb } }; moved = false; });
  svg.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const prev = pointers.get(e.pointerId);
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size === 2 && prev) {
      const [a, b] = [...pointers.values()];
      const others = [...pointers.entries()].find(([id]) => id !== e.pointerId)[1];
      const d1 = Math.hypot(prev[0] - others[0], prev[1] - others[1]), d2 = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (d1 > 0) zoom(d1 / d2, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      moved = true; drag = { x: e.clientX, y: e.clientY, vb: { ...vb } };
      return;
    }
    const r = svg.getBoundingClientRect(); const sc = Math.max(vb.w / r.width, vb.h / r.height);
    const dx = (e.clientX - drag.x) * sc, dy = (e.clientY - drag.y) * sc;
    if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 4) { moved = true; svg.setPointerCapture(e.pointerId); }
    if (moved) { vb = { ...vb, x: drag.vb.x - dx, y: drag.vb.y - dy }; apply(); }
  });
  const up = (e) => { pointers.delete(e.pointerId); if (!pointers.size) drag = null; };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  svg.addEventListener('click', (e) => {
    if (moved) return;
    const n = e.target.closest('[data-city]');
    if (n) onCity(n.dataset.city, e);
  });

  const api = {
    zoomIn: () => zoom(1 / 1.4), zoomOut: () => zoom(1.4),
    fit: () => { vb = { x: 0, y: 0, w: W, h: H }; apply(); },
    focus(id, w = W / 2.4) { const [x, y] = cityXY(id); const h = w * (H / W); vb = { x: x - w / 2, y: y - h / 2, w, h }; apply(); },
    render(s) {
      const here = s.city;
      const routes = s.prison ? [] : S.routesFrom(s);
      const reach = new Set(routes.map((r) => r.to));
      // trail
      const tr = s.trail.map(cityXY);
      g('trail').innerHTML = tr.length > 1 ? `<polyline points="${tr.map(([x, y]) => `${x},${y}`).join(' ')}"/>` : '';
      // reachable
      g('reach').innerHTML = routes.map((r) => {
        const [x1, y1] = cityXY(here), [x2, y2] = cityXY(r.to);
        const cls = `${r.mode === 'flight' ? 'fly' : 'land'} ${r.when}${r.blocked ? ' blocked' : ''}`;
        if (r.mode === 'flight') { const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.18; return `<path d="M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}" class="${cls}"/>`; }
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
      }).join('');
      // nodes
      g('nodes').innerHTML = Object.entries(D.CITIES).map(([id, c]) => {
        const [x, y] = cityXY(id);
        const col = COUNTRY_COL[c.c];
        const vis = s.visited[id];
        const remote = c.tags.includes('remote');
        const cls = `node${vis ? ' vis' : ''}${reach.has(id) ? ' reach' : ''}${id === here ? ' here' : ''}${s.blacklist[c.c] ? ' banned' : ''}`;
        const shape = remote ? `<path d="M${x} ${y - 7} L${x + 6.5} ${y + 5} L${x - 6.5} ${y + 5} Z" fill="${vis ? col : '#fffaf0'}" stroke="${col}"/>` : `<circle cx="${x}" cy="${y}" r="${id === 'bkk' ? 6.5 : 5}" fill="${vis ? col : '#fffaf0'}" stroke="${col}"/>`;
        const lp = c.lp || 'r';
        const [tx, ty, anchor] = lp === 'l' ? [x - 9, y + 4, 'end'] : lp === 't' ? [x, y - 10, 'middle'] : lp === 'b' ? [x, y + 17, 'middle'] : [x + 9, y + 4, 'start'];
        return `<g class="${cls}" data-city="${id}"><circle cx="${x}" cy="${y}" r="14" class="hit"/>${shape}<text x="${tx}" y="${ty}" text-anchor="${anchor}">${c.name}</text></g>`;
      }).join('');
      const [mx, my] = cityXY(here);
      g('me').innerHTML = `<circle cx="${mx}" cy="${my}" r="11" class="pulse"/><text x="${mx}" y="${my - 12}" class="pin">${s.prison ? '⛓️' : '🎒'}</text>`;
    },
  };
  return api;
}
