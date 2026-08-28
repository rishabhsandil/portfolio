/* prep-logos.js — normalises raw client logo files into assets/logos/<slug>.webp
 *
 * The client's logos arrive as raster exports with baked-in backgrounds, generic filenames
 * and wildly different padding/aspect. This trims each to its artwork, fits it into a common
 * box, knocks out light backgrounds to transparency, and re-encodes as WebP. See DESIGN.md
 * "Client logos" for the reasoning behind each step.
 *
 * Run from the project root, with playwright installed and SRC pointing at the raw folder:
 *   node tools/prep-logos.js
 * It drives the Chromium already on disk (canvas does the image work — no image library).
 * Update SRC, EXE and MAP when a new batch arrives.
 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const SRC = 'C:/Users/Rish/Downloads/drive-download-20260828T194839Z-1-001';
const OUT = 'c:/Users/Rish/Desktop/Personal GIT/portfolio/marketing-monk/assets/logos';

// Generic Drive filenames → brand slugs, read off the artwork itself.
const MAP = {
  'Learnwell.png'                            : 'learnwell',
  'c68f92b0c62dbd524706061a97d282b5.jpg'     : 'ambar-surrey',
  'images (1).jpg'                           : 'spicy-pier',
  'images (1).png'                           : 'magic-malts',
  'images (2).jpg'                           : 'chai-coffee-company',
  'images (2).png'                           : 'ashford-career-college',
  'images (3).jpg'                           : 'smoke-2-snack',
  'images (3).png'                           : 'snack-stories',
  'images (4).jpg'                           : 'spinny-cars',
  'images (4).png'                           : 'woodhouse-realty',
  'images (5).jpg'                           : 'masala-malt-co',
  'images (6).jpg'                           : 'hattrick',
  'images (7).jpg'                           : 'silver-oak-college',
  'images (8).jpg'                           : 'lakhe-wale-jewellers',
  'images (9).jpg'                           : 'strava-college',
  'images.jpg'                               : 'kk-monogram',
  'images.png'                               : 'salt-and-steak',
  'logo.jpg'                                 : 'barcelos',
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ chromiumSandbox:false, executablePath:'C:/Users/Rish/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe' });
  const p = await b.newPage();
  await p.goto('about:blank');

  for (const [file, slug] of Object.entries(MAP)) {
    const buf = fs.readFileSync(path.join(SRC, file));
    const ext = file.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
    const dataUri = 'data:image/' + ext + ';base64,' + buf.toString('base64');

    const res = await p.evaluate(async ({ dataUri }) => {
      const img = new Image();
      img.src = dataUri;
      await img.decode();

      const w = img.naturalWidth, h = img.naturalHeight;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, w, h).data;
      const at = (x, y) => { const i = (y * w + x) * 4; return [d[i], d[i+1], d[i+2], d[i+3]]; };

      // Background = the dominant corner colour (or transparency).
      const corners = [at(0,0), at(w-1,0), at(0,h-1), at(w-1,h-1)];
      const transparent = corners.every(c => c[3] < 16);
      const bg = corners[0];
      const TOL = 18;
      const isBg = (x, y) => {
        const [r, gg, bb, a] = at(x, y);
        if (transparent) return a < 16;
        if (a < 16) return true;
        return Math.abs(r-bg[0]) <= TOL && Math.abs(gg-bg[1]) <= TOL && Math.abs(bb-bg[2]) <= TOL;
      };
      const rowBg = y => { for (let x = 0; x < w; x++) if (!isBg(x, y)) return false; return true; };
      const colBg = x => { for (let y = 0; y < h; y++) if (!isBg(x, y)) return false; return true; };

      let top = 0, bot = h - 1, left = 0, right = w - 1;
      while (top < bot && rowBg(top)) top++;
      while (bot > top && rowBg(bot)) bot--;
      while (left < right && colBg(left)) left++;
      while (right > left && colBg(right)) right--;

      let cw = right - left + 1, ch = bot - top + 1;
      if (cw < 8 || ch < 8) { left = 0; top = 0; cw = w; ch = h; }   // trim failed → keep original

      // Fit each mark inside one common box rather than forcing a common height:
      // height-only normalisation makes wide wordmarks enormous next to square badges.
      // Cap the scale at 2x native so the low-res sources don't get upscaled to mush.
      const BOX_W = 330, BOX_H = 120;   // ~2x the 54px display height
      let scale = Math.min(BOX_W / cw, BOX_H / ch);
      scale = Math.min(scale, 2);
      const sw = Math.max(1, Math.round(cw * scale)), sh = Math.max(1, Math.round(ch * scale));

      const o = document.createElement('canvas');
      o.width = sw; o.height = sh;
      const og = o.getContext('2d', { willReadFrequently: true });
      og.imageSmoothingQuality = 'high';
      og.drawImage(img, left, top, cw, ch, 0, 0, sw, sh);

      // Knock a LIGHT background out to transparency so the mark can sit on the site's
      // warm-grey panel instead of forcing the strip to be white. Marks with a dark or
      // saturated background are left opaque on purpose — they read as brand chips, and
      // knocking their background out would strand white artwork on a light panel.
      const lum = 0.2126*bg[0] + 0.7152*bg[1] + 0.0722*bg[2];
      const lightBg = !transparent && lum > 200;
      if (lightBg) {
        const im = og.getImageData(0, 0, sw, sh), q = im.data;
        const LO = 10, HI = 45;   // ramp, so antialiased edges fade out instead of fringing
        for (let i = 0; i < q.length; i += 4) {
          const dist = Math.max(Math.abs(q[i]-bg[0]), Math.abs(q[i+1]-bg[1]), Math.abs(q[i+2]-bg[2]));
          let a = (dist - LO) / (HI - LO);
          a = a < 0 ? 0 : a > 1 ? 1 : a;
          q[i+3] = Math.round(q[i+3] * a);
        }
        og.putImageData(im, 0, 0);
      }
      return { png: o.toDataURL('image/webp', 0.92), src: w + 'x' + h, trimmed: cw + 'x' + ch,
               out: sw + 'x' + sh, transparent, knockout: lightBg };
    }, { dataUri });

    const outPath = path.join(OUT, slug + '.webp');
    fs.writeFileSync(outPath, Buffer.from(res.png.split(',')[1], 'base64'));
    const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
    console.log(slug.padEnd(24), res.src.padEnd(11), '→ trim', res.trimmed.padEnd(11), '→', res.out.padEnd(9), kb + 'KB', (res.knockout ? 'bg knocked out' : 'opaque chip'));
  }
  await b.close();
})();
