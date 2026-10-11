// Bragging rights: a shareable "insurance claim" image and links to post it.

export const CANONICAL_URL = 'https://www.highdimensionalcoconuts.com/Work/ArtBlaster/';

export function gameUrl() {
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  return local ? CANONICAL_URL : location.origin + location.pathname.replace(/index\.html$/, '');
}

const money = (v) => '$' + Math.round(v).toLocaleString('en-US');

export function shareText(r) {
  const wrecked = r.items.filter(i => i.destroyed).map(i => i.title);
  const what = wrecked.length
    ? ` I destroyed ${wrecked.length === 1 ? wrecked[0] : `${wrecked.length} masterpieces, including ${wrecked[0]}`}.`
    : r.items.length ? ` I damaged ${r.items[0].title}.` : '';
  return `I ran up a ${money(r.total)} damage bill at the NVIDO Museum of Art in Art Blaster!${what} Rank: ${r.rankTitle}. Can you do worse?`;
}

export function shareLinks(text, url) {
  const e = encodeURIComponent;
  return {
    x: `https://twitter.com/intent/tweet?text=${e(text)}&url=${e(url)}`,
    bsky: `https://bsky.app/intent/compose?text=${e(text + ' ' + url)}`,
    reddit: `https://www.reddit.com/submit?url=${e(url)}&title=${e(text)}`,
    hn: `https://news.ycombinator.com/submitlink?u=${e(url)}&t=${e('Art Blaster: learn art history by running up the biggest museum damage bill')}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`,
  };
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function fitText(g, text, maxW, font, startPx) {
  let px = startPx;
  do { g.font = font.replace('{px}', px); px -= 2; } while (g.measureText(text).width > maxW && px > 10);
}

// 1200×630 card (the size social sites use for link previews)
export async function makeCard(r) {
  try { await document.fonts.load('60px Bungee'); } catch (e) { /* fall back to Impact */ }
  const W = 1200, H = 630;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1a1714'); bg.addColorStop(1, '#3b2a20');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // paper report card
  g.fillStyle = '#f7f3ea';
  g.fillRect(40, 40, W - 80, H - 80);
  g.fillStyle = '#7a1d1d';
  g.font = '800 20px Inter, Arial, sans-serif';
  g.fillText('INSURANCE ADJUSTER\'S REPORT  ·  THE NVIDO MUSEUM OF ART', 80, 92);
  g.fillStyle = '#2f5d00';
  fitText(g, money(r.total), 760, '{px}px Bungee, Impact, sans-serif', 92);
  g.fillText(money(r.total), 76, 190);
  g.fillStyle = '#e0322b';
  fitText(g, r.rankTitle.toUpperCase(), 760, '{px}px Bungee, Impact, sans-serif', 40);
  g.fillText(r.rankTitle.toUpperCase(), 80, 245);
  // title stamp on the right
  g.save();
  g.translate(1000, 150); g.rotate(-0.12);
  g.fillStyle = '#1d1a16'; g.font = '56px Bungee, Impact, sans-serif'; g.textAlign = 'center';
  g.fillText('ART', 0, 0);
  g.fillStyle = '#e0322b'; g.fillText('BLASTER!', 0, 58);
  g.restore();
  // the four most expensive casualties
  const items = r.items.slice(0, 4);
  const imgs = await Promise.all(items.map(i => loadImage(i.thumb)));
  const bw = 245, bh = 190, gap = 26, x0 = 80, y0 = 285;
  items.forEach((it, k) => {
    const x = x0 + k * (bw + gap);
    g.fillStyle = '#2f2a25'; g.fillRect(x, y0, bw, bh);
    const img = imgs[k];
    if (img) {
      const s = Math.min((bw - 16) / img.width, (bh - 16) / img.height);
      g.drawImage(img, x + (bw - img.width * s) / 2, y0 + (bh - img.height * s) / 2, img.width * s, img.height * s);
    }
    if (it.stamp) {
      g.save();
      g.translate(x + bw / 2, y0 + bh / 2); g.rotate(-0.25);
      g.font = '26px Bungee, Impact, sans-serif'; g.textAlign = 'center';
      const tw = g.measureText(it.stamp).width + 18;
      g.fillStyle = 'rgba(255,250,240,0.85)'; g.fillRect(-tw / 2, -22, tw, 38);
      g.strokeStyle = '#e0322b'; g.lineWidth = 4; g.strokeRect(-tw / 2, -22, tw, 38);
      g.fillStyle = '#e0322b'; g.fillText(it.stamp, 0, 8);
      g.restore();
    }
    g.fillStyle = '#1d1a16';
    fitText(g, it.title, bw, 'italic {px}px Georgia, serif', 20);
    g.fillText(it.title, x, y0 + bh + 26);
    g.fillStyle = '#7a1d1d'; g.font = '600 17px Inter, Arial, sans-serif';
    g.fillText(money(it.cost), x, y0 + bh + 50);
  });
  if (!items.length) {
    g.fillStyle = '#4a443c'; g.font = 'italic 30px Georgia, serif';
    g.fillText('Not a scratch. The docents would like to adopt you.', 80, 380);
  }
  g.fillStyle = '#6a5d4c'; g.font = '600 19px Inter, Arial, sans-serif';
  g.fillText('Can you do worse?  ' + CANONICAL_URL.replace('https://', ''), 80, H - 62);
  return c;
}
