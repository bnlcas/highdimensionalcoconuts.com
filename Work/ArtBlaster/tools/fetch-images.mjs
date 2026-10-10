// Download the public-domain artwork images from Wikimedia Commons into img/.
// usage: node tools/fetch-images.mjs   (run from Work/ArtBlaster)
import { writeFile, access } from 'node:fs/promises';
import { ARTWORKS } from '../src/artworks.js';

for (const a of ARTWORKS) {
  if (!a.commons) continue;
  const out = new URL(`../${a.img}`, import.meta.url);
  try { await access(out); console.log('have', a.img); continue; } catch { /* fetch it */ }
  let res;
  for (let attempt = 0; attempt < 6; attempt++) {
    res = await fetch(a.commons.url, { headers: { 'User-Agent': 'ArtBlaster/1.0 (highdimensionalcoconuts.com; personal art-history game)' } });
    if (res.status !== 429) break;
    const wait = 10 * (attempt + 1);
    console.log(`rate limited on ${a.id}, waiting ${wait}s`);
    await new Promise(r => setTimeout(r, wait * 1000));
  }
  if (!res.ok) { console.error('FAILED', a.id, res.status); continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(out, buf);
  console.log('got ', a.img, (buf.length / 1024).toFixed(0) + ' KB');
  await new Promise(r => setTimeout(r, 4000)); // be polite to Wikimedia
}
