// Live, damageable painting surfaces. Each painting owns a canvas composited from:
//   base (the artwork) + damage (soup, paint, lipstick, char, gashes) - holes (burn-through, craters)
import { makeCanvas, canvasTexture, drawPlaceholder, drawSplat, PROCEDURAL, rng } from './textures.js';

let seedCounter = 1;

export class ArtSurface {
  constructor(art) {
    const big = art.w * art.h > 1.5;
    const maxPx = big ? 1280 : 768;
    const aspect = art.w / art.h;
    this.W = aspect >= 1 ? maxPx : Math.round(maxPx * aspect);
    this.H = aspect >= 1 ? Math.round(maxPx / aspect) : maxPx;
    this.ppm = this.W / art.w;
    this.base = makeCanvas(this.W, this.H);
    this.dmg = makeCanvas(this.W, this.H);
    this.holes = makeCanvas(this.W, this.H);
    this.live = makeCanvas(this.W, this.H);
    this.texture = canvasTexture(this.live);
    this.r = rng(seedCounter++ * 7919);
    this.drips = [];
    this.hasHoles = false;
    const g = this.base.getContext('2d');
    if (art.proc) PROCEDURAL[art.proc](g, this.W, this.H);
    else drawPlaceholder(g, this.W, this.H, art);
    this.dirty = true;
    if (art.img) this.load(art.img, art);
  }

  load(url, art) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.base.getContext('2d').drawImage(img, 0, 0, this.W, this.H);
      this.dirty = true;
    };
    img.onerror = () => {
      // fall back to Wikimedia if the local copy is missing
      if (art.commons && url !== art.commons.url) this.load(art.commons.url, art);
      else console.warn('Could not load image for', art.title, url);
    };
    img.src = url;
  }

  px(u, v) { return [u * this.W, (1 - v) * this.H]; }

  splat(u, v, radiusM, color, opts = {}) {
    const g = this.dmg.getContext('2d');
    const [x, y] = this.px(u, v);
    const rad = radiusM * this.ppm;
    g.globalAlpha = opts.alpha ?? 0.95;
    drawSplat(g, x, y, rad, color, this.r, opts);
    g.globalAlpha = 1;
    const nd = opts.drips ?? 3;
    for (let i = 0; i < nd; i++) {
      this.drips.push({
        x: x + (this.r() - 0.5) * rad * 1.4, y: y + rad * 0.3,
        len: 0, max: rad * (1 + this.r() * 3), w: Math.max(1.5, rad * (0.08 + this.r() * 0.12)),
        speed: rad * (0.5 + this.r()), color,
      });
    }
    this.dirty = true;
  }

  stroke(u0, v0, u1, v1, color, widthM) {
    const g = this.dmg.getContext('2d');
    const [x0, y0] = this.px(u0, v0), [x1, y1] = this.px(u1, v1);
    g.strokeStyle = color; g.lineCap = 'round'; g.lineJoin = 'round';
    g.lineWidth = Math.max(2, widthM * this.ppm);
    g.globalAlpha = 0.9;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.globalAlpha = 1;
    this.dirty = true;
  }

  gash(u, v, lenM, angle) {
    const g = this.dmg.getContext('2d'), h = this.holes.getContext('2d');
    const [x, y] = this.px(u, v);
    const len = lenM * this.ppm, r = this.r;
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10 - 0.5;
      pts.push([x + Math.cos(angle) * len * t + (r() - 0.5) * len * 0.06, y + Math.sin(angle) * len * t + (r() - 0.5) * len * 0.06]);
    }
    const width = Math.max(2, len * 0.035);
    g.strokeStyle = 'rgba(230,220,200,0.9)'; g.lineWidth = width * 2.4; g.lineCap = 'round';
    this._poly(g, pts);
    h.strokeStyle = '#fff'; h.lineWidth = width; h.lineCap = 'round';
    this._poly(h, pts);
    this.hasHoles = true;
    this.dirty = true;
  }

  crater(u, v, radM) {
    const g = this.dmg.getContext('2d'), h = this.holes.getContext('2d');
    const [x, y] = this.px(u, v);
    const rad = radM * this.ppm, r = this.r;
    g.strokeStyle = 'rgba(30,20,10,0.8)';
    for (let i = 0; i < 9; i++) {
      const a = r() * Math.PI * 2;
      let px = x, py = y;
      g.lineWidth = 1 + r() * 2.5;
      g.beginPath(); g.moveTo(px, py);
      for (let s = 0; s < 6; s++) {
        px += Math.cos(a + (r() - 0.5) * 0.8) * rad * 0.45;
        py += Math.sin(a + (r() - 0.5) * 0.8) * rad * 0.45;
        g.lineTo(px, py);
      }
      g.stroke();
    }
    g.fillStyle = 'rgba(225,212,190,0.95)';
    this._blob(g, x, y, rad * 0.75);
    h.fillStyle = '#fff';
    this._blob(h, x, y, rad * 0.55);
    this.hasHoles = true;
    this.dirty = true;
  }

  burn(u, v, radM, holeFrac) {
    const g = this.dmg.getContext('2d');
    const [x, y] = this.px(u, v);
    const rad = radM * this.ppm;
    const grd = g.createRadialGradient(x, y, rad * 0.2, x, y, rad);
    grd.addColorStop(0, 'rgba(8,5,3,0.95)');
    grd.addColorStop(0.6, 'rgba(45,25,10,0.7)');
    grd.addColorStop(1, 'rgba(120,70,20,0)');
    g.fillStyle = grd;
    g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
    if (holeFrac > 0) {
      const h = this.holes.getContext('2d');
      h.fillStyle = '#fff';
      this._blob(h, x, y, rad * holeFrac);
      this.hasHoles = true;
    }
    this.dirty = true;
  }

  _poly(g, pts) {
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts) g.lineTo(p[0], p[1]);
    g.stroke();
  }

  _blob(g, x, y, rad) {
    g.beginPath();
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI * 2, rr = rad * (0.7 + this.r() * 0.5);
      i ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath(); g.fill();
  }

  update(dt) {
    if (this.drips.length) {
      const g = this.dmg.getContext('2d');
      g.lineCap = 'round';
      for (let i = this.drips.length - 1; i >= 0; i--) {
        const d = this.drips[i];
        const step = Math.min(d.speed * dt, d.max - d.len);
        g.strokeStyle = d.color; g.lineWidth = d.w;
        g.beginPath(); g.moveTo(d.x, d.y + d.len); g.lineTo(d.x, d.y + d.len + step); g.stroke();
        d.len += step;
        d.w *= 0.995;
        if (d.len >= d.max - 0.01) {
          g.fillStyle = d.color;
          g.beginPath(); g.arc(d.x, d.y + d.len, d.w * 0.9, 0, Math.PI * 2); g.fill();
          this.drips.splice(i, 1);
        }
      }
      this.dirty = true;
    }
    if (!this.dirty) return;
    const g = this.live.getContext('2d');
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, this.W, this.H);
    g.drawImage(this.base, 0, 0);
    g.drawImage(this.dmg, 0, 0);
    if (this.hasHoles) {
      g.globalCompositeOperation = 'destination-out';
      g.drawImage(this.holes, 0, 0);
      g.globalCompositeOperation = 'source-over';
    }
    this.texture.needsUpdate = true;
    this.dirty = false;
  }
}

// Transparent overlay on protective glass: splats and cracks land here instead of on the art.
export class GlassSurface {
  constructor(w, h) {
    const px = 512;
    this.W = w >= h ? px : Math.round(px * w / h);
    this.H = w >= h ? Math.round(px * h / w) : px;
    this.ppm = this.W / w;
    this.c = makeCanvas(this.W, this.H);
    this.texture = canvasTexture(this.c);
    this.r = rng(seedCounter++ * 104729);
  }
  splat(u, v, radM, color) {
    const g = this.c.getContext('2d');
    g.globalAlpha = 0.85;
    drawSplat(g, u * this.W, (1 - v) * this.H, radM * this.ppm, color, this.r, { drops: 10 });
    g.globalAlpha = 1;
    this.texture.needsUpdate = true;
  }
  stroke(u0, v0, u1, v1, color, widthM) {
    const g = this.c.getContext('2d');
    g.strokeStyle = color; g.lineCap = 'round'; g.lineWidth = Math.max(2, widthM * this.ppm);
    g.beginPath(); g.moveTo(u0 * this.W, (1 - v0) * this.H); g.lineTo(u1 * this.W, (1 - v1) * this.H); g.stroke();
    this.texture.needsUpdate = true;
  }
  crack(u, v, severity) {
    const g = this.c.getContext('2d'), r = this.r;
    const x = u * this.W, y = (1 - v) * this.H;
    g.strokeStyle = 'rgba(255,255,255,0.85)';
    const n = 6 + severity * 6;
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      let px = x, py = y;
      g.lineWidth = 0.6 + r();
      g.beginPath(); g.moveTo(px, py);
      const segs = 3 + (r() * 5) | 0;
      for (let s = 0; s < segs; s++) {
        px += Math.cos(a + (r() - 0.5) * 0.6) * (10 + r() * 30) * (1 + severity * 0.5);
        py += Math.sin(a + (r() - 0.5) * 0.6) * (10 + r() * 30) * (1 + severity * 0.5);
        g.lineTo(px, py);
      }
      g.stroke();
    }
    g.beginPath(); g.arc(x, y, 3 + severity * 3, 0, Math.PI * 2);
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.fill();
    this.texture.needsUpdate = true;
  }
}
