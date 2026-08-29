/* prep-team.js — crops team headshots to the team card's 4:5 and writes
 * assets/images/team/<slug>.webp. Run from the project root with playwright installed:
 *   node tools/prep-team.js
 * Update SRC and the SHOTS rects when new headshots arrive. Photos are shot on a yellow
 * seamless; the sampled backdrop is what --team-backdrop in style.css matches, so the
 * members without a photo blend with the ones who have one. See DESIGN.md.
 */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const SRC = 'C:/Users/Rish/Downloads/team pics';
const OUT = 'c:/Users/Rish/Desktop/Personal GIT/portfolio/marketing-monk/assets/images/team';

// 4:5 crop window per photo, chosen by eye from the source framing:
// Alton is a full-body standing shot, Darpan a head-and-shoulders, Yuvraj a square 3/4 profile.
// Explicit 4:5 rects, picked by eye so the three heads land at a similar scale: Alton's
// source is a full-body standing shot and needs a much tighter window than the other two.
const SHOTS = [
  { file:'Alton.png',  slug:'alton-saurav-haldar', rect:[130,165,480,600] },
  { file:'Darpan.png', slug:'darpan-rathod',       rect:[0,100,1023,1279] },
  { file:'Yuvraj.png', slug:'yuvraj-rajput',       rect:[220,0,1003,1254] },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ chromiumSandbox:false, executablePath:'C:/Users/Rish/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe' });
  const p = await b.newPage(); await p.goto('about:blank');

  for (const sh of SHOTS) {
    const buf = fs.readFileSync(path.join(SRC, sh.file));
    const dataUri = 'data:image/png;base64,' + buf.toString('base64');
    const r = await p.evaluate(async ({ dataUri, rect }) => {
      const img = new Image(); img.src = dataUri; await img.decode();
      const w = img.naturalWidth, h = img.naturalHeight;

      // sample the backdrop from the top-left corner
      const s = document.createElement('canvas'); s.width = w; s.height = h;
      const sg = s.getContext('2d', { willReadFrequently:true }); sg.drawImage(img,0,0);
      const px = sg.getImageData(4,4,1,1).data;

      const [sx, sy, cw, chh] = rect;

      const OW = 800, OH = 1000;
      const o = document.createElement('canvas'); o.width = OW; o.height = OH;
      const og = o.getContext('2d'); og.imageSmoothingQuality = 'high';
      og.drawImage(img, sx, sy, cw, chh, 0, 0, OW, OH);
      return { webp:o.toDataURL('image/webp',0.86), src:w+'x'+h, crop:cw+'x'+chh+'@'+sx+','+sy,
               bg:'#'+[px[0],px[1],px[2]].map(v=>v.toString(16).padStart(2,'0')).join('') };
    }, { dataUri, rect: sh.rect });

    const out = path.join(OUT, sh.slug + '.webp');
    fs.writeFileSync(out, Buffer.from(r.webp.split(',')[1],'base64'));
    console.log(sh.slug.padEnd(22), r.src.padEnd(10), 'crop', r.crop.padEnd(18), 'backdrop', r.bg,
                (fs.statSync(out).size/1024).toFixed(0)+'KB');
  }
  await b.close();
})();
