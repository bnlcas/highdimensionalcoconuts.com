// Procedural canvas textures: floors, placards, stand-in artworks, splats, labels.
import * as THREE from 'three';

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

export function canvasTexture(c, repeat) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- architecture ----------

export function woodFloor() {
  const c = makeCanvas(1024, 1024), g = c.getContext('2d'), r = rng(7);
  const rows = 8, rh = c.height / rows;
  for (let row = 0; row < rows; row++) {
    let x = -r() * 300;
    while (x < c.width) {
      const len = 260 + r() * 260;
      const l = 0.9 + r() * 0.16;
      g.fillStyle = `rgb(${(176 * l) | 0},${(128 * l) | 0},${(82 * l) | 0})`;
      g.fillRect(x, row * rh, len, rh);
      g.globalAlpha = 0.09;
      for (let k = 0; k < 14; k++) {
        g.strokeStyle = r() < 0.5 ? '#5a3a1c' : '#e8c79a';
        g.lineWidth = 1 + r() * 2;
        const y = row * rh + r() * rh;
        g.beginPath(); g.moveTo(x, y);
        g.bezierCurveTo(x + len * 0.3, y + (r() - 0.5) * 8, x + len * 0.6, y + (r() - 0.5) * 8, x + len, y + (r() - 0.5) * 6);
        g.stroke();
      }
      g.globalAlpha = 1;
      g.fillStyle = 'rgba(40,24,10,0.55)';
      g.fillRect(x, row * rh, 2, rh);
      x += len;
    }
    g.fillStyle = 'rgba(40,24,10,0.5)';
    g.fillRect(0, row * rh, c.width, 2);
  }
  return canvasTexture(c, [1, 1]);
}

export function marbleTexture(light = true, tiles = 2, seed = 3) {
  const c = makeCanvas(1024, 1024), g = c.getContext('2d'), r = rng(seed);
  const ts = c.width / tiles;
  for (let i = 0; i < tiles; i++) for (let j = 0; j < tiles; j++) {
    const dark = !light && (i + j) % 2 === 1;
    const base = dark ? [62, 66, 72] : [236, 232, 224];
    const l = 0.96 + r() * 0.06;
    g.fillStyle = `rgb(${base[0] * l | 0},${base[1] * l | 0},${base[2] * l | 0})`;
    g.fillRect(i * ts, j * ts, ts, ts);
    g.save();
    g.beginPath(); g.rect(i * ts, j * ts, ts, ts); g.clip();
    for (let v = 0; v < 7; v++) {
      let x = i * ts + r() * ts, y = j * ts + r() * ts;
      let a = r() * Math.PI * 2;
      g.strokeStyle = dark ? 'rgba(220,220,230,0.18)' : 'rgba(120,120,130,0.22)';
      g.lineWidth = 0.5 + r() * 2.5;
      g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 60; s++) {
        a += (r() - 0.5) * 0.5;
        x += Math.cos(a) * 9; y += Math.sin(a) * 9;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    g.restore();
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(i * ts, j * ts, ts, 2); g.fillRect(i * ts, j * ts, 2, ts);
  }
  return canvasTexture(c, [1, 1]);
}

export function concreteTexture() {
  const c = makeCanvas(512, 512), g = c.getContext('2d'), r = rng(11);
  g.fillStyle = '#9d9a95'; g.fillRect(0, 0, 512, 512);
  const img = g.getImageData(0, 0, 512, 512), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * 18;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  g.fillStyle = 'rgba(0,0,0,0.18)';
  g.fillRect(0, 0, 512, 2); g.fillRect(0, 0, 2, 512);
  return canvasTexture(c, [1, 1]);
}

export function plasterTexture() {
  const c = makeCanvas(256, 256), g = c.getContext('2d'), r = rng(5);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256);
  const img = g.getImageData(0, 0, 256, 256), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = 245 + r() * 10;
    d[i] = d[i + 1] = d[i + 2] = n;
  }
  g.putImageData(img, 0, 0);
  return canvasTexture(c, [1, 1]);
}

export function signTexture(lines, opts = {}) {
  const w = opts.w || 2048, h = opts.h || 256;
  const c = makeCanvas(w, h), g = c.getContext('2d');
  g.clearRect(0, 0, w, h);
  if (opts.bg) { g.fillStyle = opts.bg; g.fillRect(0, 0, w, h); }
  g.fillStyle = opts.color || '#2b2b2b';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const n = lines.length;
  lines.forEach((ln, i) => {
    g.font = ln.font;
    if (g.letterSpacing !== undefined) g.letterSpacing = ln.spacing || '0px';
    g.fillText(ln.text, w / 2, h * (i + 0.5) / n, w * 0.96);
  });
  return canvasTexture(c);
}

// ---------- museum placard ----------

export function placardTexture(art) {
  const c = makeCanvas(1024, 600), g = c.getContext('2d');
  g.fillStyle = '#f7f4ec'; g.fillRect(0, 0, c.width, c.height);
  let y = 78;
  const L = 56;
  g.fillStyle = '#1c1c1c';
  g.font = 'bold 50px "Helvetica Neue", Arial, sans-serif';
  g.fillText(art.artist, L, y); y += 46;
  g.fillStyle = '#555';
  g.font = '30px "Helvetica Neue", Arial, sans-serif';
  g.fillText(art.lifeShort, L, y); y += 66;
  g.fillStyle = '#1c1c1c';
  g.font = 'italic 48px Georgia, serif';
  wrap(g, art.title + ',', L, y, c.width - 2 * L, 52, (yy) => { y = yy; });
  g.font = '44px Georgia, serif';
  g.fillText(art.date, L, y); y += 54;
  g.fillStyle = '#444';
  g.font = '30px "Helvetica Neue", Arial, sans-serif';
  g.fillText(art.medium, L, y); y += 40;
  g.fillText(art.movement, L, y); y += 52;
  g.fillStyle = '#7a6a48';
  g.font = 'italic 26px Georgia, serif';
  g.fillText(art.homage ? 'Gallery stand-in: the original is still under copyright.' :
    'Acquired by the Jetson Hang Foundation for the NVIDO Museum.', L, y);
  y += 34;
  g.fillStyle = '#7a1d1d';
  g.font = 'bold 28px "Helvetica Neue", Arial, sans-serif';
  g.fillText('Value: ' + fmtMoneyLong(art.value) + (art.valueIsEstimate ? ' (est.)' : ''), L, y);
  return canvasTexture(c);
}

function wrap(g, text, x, y, maxW, lh, done) {
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (g.measureText(test).width > maxW && line) {
      g.fillText(line, x, y); y += lh; line = w;
    } else line = test;
  }
  g.fillText(line, x, y); y += lh;
  done(y);
}

export function fmtMoneyLong(v) {
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(v % 1e9 === 0 ? 0 : 2) + ' billion';
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(1).replace(/\.0$/, '') + ' million';
  return '$' + Math.round(v).toLocaleString('en-US');
}

// ---------- placeholder + stand-in artworks (copyrighted originals) ----------

export function drawPlaceholder(g, w, h, art) {
  const grd = g.createLinearGradient(0, 0, w, h);
  grd.addColorStop(0, '#3b3530'); grd.addColorStop(1, '#6d6152');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.75)';
  g.textAlign = 'center';
  g.font = `italic ${Math.max(14, w / 14) | 0}px Georgia, serif`;
  g.fillText(art.title, w / 2, h / 2);
  g.font = `${Math.max(10, w / 22) | 0}px Georgia, serif`;
  g.fillText(art.artist, w / 2, h / 2 + w / 12);
  g.textAlign = 'left';
}

function canvasGrain(g, w, h, r, amt = 14) {
  const img = g.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amt;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
}

function softRect(g, x, y, w, h, color, blur, r) {
  // Rothko-style feathered rectangle built from many translucent passes
  for (let i = 0; i < 26; i++) {
    const j = blur * (1 - i / 26);
    g.globalAlpha = 0.07;
    g.fillStyle = color;
    g.fillRect(x - j + (r() - 0.5) * 3, y - j + (r() - 0.5) * 3, w + 2 * j, h + 2 * j);
  }
  g.globalAlpha = 1;
}

export const PROCEDURAL = {
  rothko(g, w, h) {
    const r = rng(1961);
    g.fillStyle = '#c8411f'; g.fillRect(0, 0, w, h);
    softRect(g, w * 0.07, h * 0.06, w * 0.86, h * 0.40, '#ee7f2c', w * 0.03, r);
    softRect(g, w * 0.07, h * 0.50, w * 0.86, h * 0.07, '#9d1d18', w * 0.02, r);
    softRect(g, w * 0.07, h * 0.61, w * 0.86, h * 0.33, '#f2b538', w * 0.03, r);
    canvasGrain(g, w, h, r, 16);
  },
  pollock(g, w, h) {
    const r = rng(1948);
    g.fillStyle = '#cdbb98'; g.fillRect(0, 0, w, h);
    const cols = ['#111', '#111', '#111', '#f2efe6', '#e8e2d2', '#8c8c86', '#c9a227', '#9c3b1f', '#2b3a4a'];
    for (let i = 0; i < 520; i++) {
      g.strokeStyle = cols[(r() * cols.length) | 0];
      g.lineWidth = 0.5 + Math.pow(r(), 3) * 9;
      g.lineCap = 'round';
      g.globalAlpha = 0.65 + r() * 0.35;
      let x = r() * w, y = r() * h, a = r() * Math.PI * 2;
      g.beginPath(); g.moveTo(x, y);
      const n = 6 + (r() * 30) | 0;
      for (let s = 0; s < n; s++) {
        a += (r() - 0.5) * 1.6;
        const step = 6 + r() * 30;
        const nx = x + Math.cos(a) * step, ny = y + Math.sin(a) * step;
        g.quadraticCurveTo(x + (r() - 0.5) * 30, y + (r() - 0.5) * 30, nx, ny);
        x = nx; y = ny;
      }
      g.stroke();
    }
    for (let i = 0; i < 900; i++) {
      g.fillStyle = cols[(r() * cols.length) | 0];
      g.globalAlpha = 0.8;
      g.beginPath();
      g.arc(r() * w, r() * h, Math.pow(r(), 4) * 7 + 0.5, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    canvasGrain(g, w, h, r, 10);
  },
  warhol(g, w, h) {
    const flavors = ['Tomato', 'Chicken Noodle', 'Cream of Mushroom', 'Vegetable', 'Bean with Bacon', 'Beef',
      'Beef Noodle', 'Black Bean', 'Clam Chowder', 'Consommé', 'Chicken Gumbo', 'Chicken Rice',
      'Chicken Vegetable', 'Chicken with Stars', 'Cheddar Cheese', 'Cream of Asparagus', 'Cream of Celery',
      'Cream of Chicken', 'Green Pea', 'Hot Dog Bean', 'Minestrone', 'Onion', 'Tomato Rice', 'Pepper Pot',
      'Scotch Broth', 'Split Pea', 'Turkey Noodle', 'Turkey Vegetable', 'Vegetable Bean', 'Vegetarian Veg.',
      'Chili Beef', 'Beef Broth'];
    g.fillStyle = '#e9e6df'; g.fillRect(0, 0, w, h);
    const cols = 8, rows = 4, cw = w / cols, ch = h / rows;
    for (let i = 0; i < 32; i++) {
      const cx = (i % cols) * cw, cy = ((i / cols) | 0) * ch;
      // canvas panel
      g.fillStyle = '#f6f4ee'; g.fillRect(cx + cw * 0.06, cy + ch * 0.04, cw * 0.88, ch * 0.92);
      const x = cx + cw * 0.22, y = cy + ch * 0.12, cwid = cw * 0.56, chgt = ch * 0.78;
      g.fillStyle = '#b8b8b8';
      g.beginPath(); g.ellipse(x + cwid / 2, y, cwid / 2, ch * 0.035, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#c9201f'; g.fillRect(x, y, cwid, chgt * 0.45);
      g.fillStyle = '#fbfaf6'; g.fillRect(x, y + chgt * 0.45, cwid, chgt * 0.55);
      g.strokeStyle = '#222'; g.lineWidth = 1.2; g.strokeRect(x, y, cwid, chgt);
      g.fillStyle = '#fff';
      g.textAlign = 'center';
      g.font = `italic bold ${cw * 0.13 | 0}px Georgia, serif`;
      g.fillText('Soup', x + cwid / 2, y + chgt * 0.25);
      g.fillStyle = '#d6a72c';
      g.beginPath(); g.arc(x + cwid / 2, y + chgt * 0.53, cwid * 0.09, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#c9201f';
      g.font = `bold ${cw * 0.06 | 0}px Arial, sans-serif`;
      g.fillText('CONDENSED', x + cwid / 2, y + chgt * 0.68);
      g.font = `bold ${cw * 0.072 | 0}px Arial, sans-serif`;
      g.fillText(flavors[i].toUpperCase(), x + cwid / 2, y + chgt * 0.80, cwid * 0.92);
      g.fillText('SOUP', x + cwid / 2, y + chgt * 0.91);
      g.fillStyle = '#b8b8b8';
      g.beginPath(); g.ellipse(x + cwid / 2, y + chgt, cwid / 2, ch * 0.03, 0, 0, Math.PI); g.fill();
    }
    g.textAlign = 'left';
  },
};

// ---------- weapon + sculpture textures ----------

export function soupLabelTexture() {
  const c = makeCanvas(512, 256), g = c.getContext('2d'), r = rng(42);
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, '#d9a23a'); grd.addColorStop(1, '#a8561c');
  g.fillStyle = grd; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 160; i++) {
    g.fillStyle = ['#4f8a2f', '#e6c35a', '#c0391b', '#f0e0b0', '#8a5a2a'][(r() * 5) | 0];
    g.globalAlpha = 0.85;
    g.beginPath(); g.ellipse(r() * 512, r() * 256, 4 + r() * 12, 3 + r() * 8, r() * 3, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
  g.font = 'italic 900 92px Impact, "Arial Black", sans-serif';
  g.lineWidth = 8; g.strokeStyle = '#3c2a10'; g.fillStyle = '#fff23a';
  g.textAlign = 'center';
  g.strokeText('SOUP!!!', 256, 110); g.fillText('SOUP!!!', 256, 110);
  g.font = 'bold 34px Arial, sans-serif';
  g.fillStyle = '#fff';
  g.fillText('RAISES AWARENESS', 256, 168);
  g.font = '24px Arial, sans-serif';
  g.fillText('NET WT 10¾ OZ', 256, 214);
  return canvasTexture(c);
}

// Blue-and-white porcelain jar, mapped onto a LatheGeometry (u = around, v = foot -> lip)
export function jarTexture() {
  const c = makeCanvas(1024, 512), g = c.getContext('2d'), r = rng(1350);
  const W = 1024, H = 512;
  g.fillStyle = '#f2f1ea'; g.fillRect(0, 0, W, H);
  const blue = '#1f3f8f';
  g.strokeStyle = blue; g.fillStyle = blue;
  const band = (y, h) => { g.fillRect(0, H - y - h, W, h); };
  // canvas y is flipped relative to v (top of canvas = lip)
  band(H * 0.97, 8); band(H * 0.90, 4);
  // wave band near the lip
  g.lineWidth = 3;
  for (let x = 0; x < W; x += 32) {
    g.beginPath(); g.arc(x + 16, H * 0.07, 12, Math.PI, 0); g.stroke();
  }
  band(H * 0.82, 4);
  // main narrative frieze: hills, clouds, figures, pines
  g.lineWidth = 4;
  for (let k = 0; k < 7; k++) {
    const x = r() * W, y = H * (0.32 + r() * 0.2);
    g.beginPath(); g.moveTo(x - 90, y + 60);
    g.quadraticCurveTo(x, y - 40 - r() * 40, x + 90, y + 60); g.stroke();
  }
  for (let k = 0; k < 10; k++) {
    const x = r() * W, y = H * (0.25 + r() * 0.12);
    g.beginPath();
    for (let s = 0; s < 4; s++) g.arc(x + s * 14, y + (s % 2) * 4, 9, Math.PI, 0);
    g.stroke();
  }
  for (let k = 0; k < 6; k++) {
    const x = 60 + k * (W / 6) + r() * 40, y = H * 0.5;
    g.beginPath(); g.arc(x, y - 30, 9, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(x - 16, y + 32); g.lineTo(x, y - 22); g.lineTo(x + 16, y + 32); g.closePath(); g.fill();
  }
  for (let k = 0; k < 9; k++) {
    const x = r() * W, y = H * 0.66;
    g.fillRect(x - 2, y - 40, 4, 50);
    for (let s = 0; s < 4; s++) { g.beginPath(); g.ellipse(x, y - 40 + s * 10, 22 - s * 3, 5, 0, 0, Math.PI * 2); g.fill(); }
  }
  band(H * 0.26, 4);
  // lotus panels at the foot
  for (let x = 0; x < W; x += 64) {
    g.beginPath(); g.moveTo(x + 4, H * 0.94); g.quadraticCurveTo(x + 32, H * 0.72, x + 60, H * 0.94); g.stroke();
    g.beginPath(); g.moveTo(x + 14, H * 0.94); g.quadraticCurveTo(x + 32, H * 0.80, x + 50, H * 0.94); g.stroke();
  }
  band(0, 10);
  // light blur to soften the brushwork
  return canvasTexture(c);
}

export function signatureTexture() {
  const c = makeCanvas(256, 96), g = c.getContext('2d');
  g.clearRect(0, 0, 256, 96);
  g.fillStyle = '#111';
  g.font = 'bold 44px "Brush Script MT", "Comic Sans MS", cursive';
  g.fillText('R. MUTT', 10, 46);
  g.font = 'bold 34px "Brush Script MT", "Comic Sans MS", cursive';
  g.fillText('1917', 60, 86);
  return canvasTexture(c);
}

// Splat sprites for walls/floor (soup, paint, scorch)
const splatCache = new Map();
export function splatTexture(color, kind = 'splat', seed = 1) {
  const key = color + kind + seed;
  if (splatCache.has(key)) return splatCache.get(key);
  const c = makeCanvas(256, 256), g = c.getContext('2d'), r = rng(seed * 977 + color.length);
  g.clearRect(0, 0, 256, 256);
  if (kind === 'scorch') {
    const grd = g.createRadialGradient(128, 128, 10, 128, 128, 120);
    grd.addColorStop(0, 'rgba(10,8,6,0.95)');
    grd.addColorStop(0.5, 'rgba(30,20,12,0.6)');
    grd.addColorStop(1, 'rgba(40,30,20,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  } else {
    drawSplat(g, 128, 128, 70, color, r);
  }
  const t = canvasTexture(c);
  splatCache.set(key, t);
  return t;
}

export function drawSplat(g, x, y, rad, color, r, opts = {}) {
  g.fillStyle = color;
  g.beginPath();
  const n = 22;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = rad * (0.65 + r() * 0.45);
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    i === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
  }
  g.closePath(); g.fill();
  const drops = opts.drops ?? 14;
  for (let i = 0; i < drops; i++) {
    const a = r() * Math.PI * 2, d = rad * (1 + r() * 0.9);
    g.beginPath();
    g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, rad * (0.04 + r() * 0.12), 0, Math.PI * 2);
    g.fill();
  }
  if (opts.chunks) {
    for (let i = 0; i < opts.chunks; i++) {
      g.fillStyle = opts.chunkColors[(r() * opts.chunkColors.length) | 0];
      const a = r() * Math.PI * 2, d = rad * r() * 0.8;
      g.beginPath();
      g.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d, rad * 0.06 + r() * rad * 0.06, rad * 0.04 + r() * rad * 0.04, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  }
}

// Gold leaf / gilt frame texture
export function giltTexture() {
  const c = makeCanvas(256, 256), g = c.getContext('2d'), r = rng(9);
  g.fillStyle = '#e0b552'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 400; i++) {
    g.fillStyle = r() < 0.5 ? 'rgba(255,220,120,0.25)' : 'rgba(90,60,10,0.25)';
    g.fillRect(r() * 256, r() * 256, 2 + r() * 20, 1 + r() * 3);
  }
  return canvasTexture(c, [1, 1]);
}

// Elm-like wood grain for carved sculpture
export function woodGrainTexture() {
  const c = makeCanvas(512, 512), g = c.getContext('2d'), r = rng(1946);
  g.fillStyle = '#8a5a34'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) {
    const y0 = r() * 512;
    g.strokeStyle = r() < 0.5 ? 'rgba(60,34,16,0.35)' : 'rgba(190,140,90,0.25)';
    g.lineWidth = 1 + r() * 4;
    g.beginPath(); g.moveTo(0, y0);
    for (let x = 0; x <= 512; x += 32) g.lineTo(x, y0 + Math.sin(x * 0.012 + i) * 14 + (r() - 0.5) * 4);
    g.stroke();
  }
  const t = canvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
