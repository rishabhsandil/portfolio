/*
  Contrast audit snippet (DevTools)
  - Open any page in the browser
  - Open DevTools Console
  - Paste this file's contents
  - Run: auditContrast({ minRatio: 4.5 })

  Notes:
  - This is a best-effort static audit. Text over images/gradients can be hard
    to evaluate precisely; the script approximates by finding the nearest
    non-transparent background color up the DOM tree.
*/

function auditContrast(options = {}) {
  const { minRatio = 4.5, minTextLength = 2 } = options;

  const clamp01 = (n) => Math.max(0, Math.min(1, n));

  function parseColor(str) {
    if (!str) return null;
    const s = str.trim().toLowerCase();
    if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

    const rgba = s.match(/^rgba?\(([^)]+)\)$/);
    if (rgba) {
      const parts = rgba[1].split(',').map((p) => p.trim());
      const r = Number(parts[0]);
      const g = Number(parts[1]);
      const b = Number(parts[2]);
      const a = parts.length === 4 ? Number(parts[3]) : 1;
      if ([r, g, b, a].some((v) => Number.isNaN(v))) return null;
      return { r, g, b, a: clamp01(a) };
    }

    // rgb from hex
    const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
      const h = hex[1];
      if (h.length === 3) {
        const r = parseInt(h[0] + h[0], 16);
        const g = parseInt(h[1] + h[1], 16);
        const b = parseInt(h[2] + h[2], 16);
        return { r, g, b, a: 1 };
      }
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      return { r, g, b, a: 1 };
    }

    return null;
  }

  function srgbToLinear(channel) {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function relativeLuminance({ r, g, b }) {
    const R = srgbToLinear(r);
    const G = srgbToLinear(g);
    const B = srgbToLinear(b);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }

  function contrastRatio(fg, bg) {
    const L1 = relativeLuminance(fg);
    const L2 = relativeLuminance(bg);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function blend(fg, bg) {
    // Alpha compositing: fg over bg
    const a = fg.a + bg.a * (1 - fg.a);
    if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
    const r = (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a;
    const g = (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a;
    const b = (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a;
    return { r, g, b, a };
  }

  function getEffectiveBgColor(el) {
    // Walk up DOM accumulating background colors until opaque-ish.
    let cur = el;
    let accum = { r: 255, g: 255, b: 255, a: 1 }; // default white page

    while (cur && cur.nodeType === 1) {
      const cs = getComputedStyle(cur);
      const bg = parseColor(cs.backgroundColor);
      if (bg && bg.a > 0) {
        accum = blend(bg, accum);
        if (accum.a >= 0.98) break;
      }
      cur = cur.parentElement;
    }

    return { r: accum.r, g: accum.g, b: accum.b, a: 1 };
  }

  function isVisible(el) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  const results = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);

  while (walker.nextNode()) {
    const el = walker.currentNode;
    if (!isVisible(el)) continue;

    const text = (el.innerText || '').trim().replace(/\s+/g, ' ');
    if (text.length < minTextLength) continue;

    const cs = getComputedStyle(el);
    const fg = parseColor(cs.color);
    if (!fg) continue;

    const bg = getEffectiveBgColor(el);
    const ratio = contrastRatio({ ...fg, a: 1 }, bg);

    if (ratio < minRatio) {
      results.push({
        ratio: Number(ratio.toFixed(2)),
        text: text.slice(0, 90),
        color: cs.color,
        background: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
        element: el,
      });
    }
  }

  results.sort((a, b) => a.ratio - b.ratio);
  console.table(results.map(({ ratio, text, color, background }) => ({ ratio, text, color, background })));
  console.log('Select the DOM element from a row by running: results[i].element');
  return results;
}
