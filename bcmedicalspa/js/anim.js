/* BC Medical Spa — anim.js
   Posh scroll-motion layer: GSAP + ScrollTrigger (+ Lenis smooth scroll).
   Loads BEFORE main.js and sets <html class="gsap-ready"> ONLY on success,
   so the baseline (no-JS / reduced-motion / CDN failure) is never left broken.
   Inspired by venetianspa.ca & dhunwellness.com: masked text reveals, image
   scale + parallax, smooth inertia scroll, and one pinned "scroll-stop". */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;                                   // honour reduced motion
  if (!window.gsap || !window.ScrollTrigger) return;    // libs missing -> baseline reveals

  var gsap = window.gsap, ST = window.ScrollTrigger;
  var docEl = document.documentElement;

  try {
    gsap.registerPlugin(ST);
    gsap.config({ force3D: true });                     // GPU-composite transforms (smoother scroll)
    docEl.classList.add('gsap-ready');                  // tell main.js to stand down on reveals

    var desktop = window.matchMedia('(pointer:fine)').matches && window.innerWidth > 900;

    /* ---------- Smooth inertia scroll (fine-pointer desktop only) ---------- */
    if (desktop && window.Lenis) {
      var lenis = new window.Lenis({ lerp: 0.075, wheelMultiplier: 0.95, smoothWheel: true, smoothTouch: false });
      lenis.on('scroll', ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      window.__lenis = lenis;                            // main.js uses this for anchor links
      docEl.classList.add('lenis-on');
    }

    /* ---------- Word splitter (preserves nested elements like span.serif-i and <br>) ---------- */
    function splitNodes(root) {
      var out = [];
      Array.prototype.forEach.call(root.childNodes, function (node) {
        if (node.nodeType === 3) {                       // text node
          node.textContent.split(/(\s+)/).forEach(function (p) {
            if (p === '') return;
            if (/^\s+$/.test(p)) { out.push(document.createTextNode(p)); return; }
            var w = document.createElement('span'); w.className = 'word';
            var i = document.createElement('span'); i.textContent = p;
            w.appendChild(i); out.push(w);
          });
        } else if (node.nodeName === 'BR') {
          out.push(node.cloneNode());
        } else if (node.nodeType === 1) {                // element: keep wrapper, split its text
          var el = node.cloneNode(false);
          splitNodes(node).forEach(function (n) { el.appendChild(n); });
          out.push(el);
        }
      });
      return out;
    }
    function wordsOf(h) {
      var frag = splitNodes(h);
      h.textContent = '';
      frag.forEach(function (n) { h.appendChild(n); });
      return h.querySelectorAll('.word > span');
    }

    /* ---------- Masked heading reveals (soft) ----------
       Words rise out of a clip mask with a gentle ease and unhurried stagger. */
    var statementH2 = document.querySelector('.statement h2');
    var headings = gsap.utils.toArray(
      '.hero h1, .phead h1, .sec-head h2, .split__body h2, .svc__intro h2, .cta h2, .form-aside h2'
    );
    headings.forEach(function (h) {
      var spans = wordsOf(h);
      if (!spans.length) return;
      gsap.set(spans, { yPercent: 120 });
      gsap.to(spans, {
        yPercent: 0, duration: 1.25, ease: 'power2.out', stagger: 0.08,
        scrollTrigger: { trigger: h, start: 'top 90%', once: true }
      });
    });

    /* ---------- Scroll-STOP: pin the mission, build the line word-by-word (desktop) ----------
       The eyebrow + lead stay visible the whole time, so the pinned view is
       never blank — only the big headline assembles as you hold on the section. */
    if (statementH2) {
      var sSpans = wordsOf(statementH2);
      gsap.set(sSpans, { yPercent: 120, opacity: 0 });
      var sec = statementH2.closest('.section') || statementH2;
      if (desktop) {
        /* Long pin + heavy scrub smoothing + overlapping soft stagger so the
           words flow in continuously rather than snapping word-by-word. */
        gsap.timeline({
          scrollTrigger: {
            trigger: sec, start: 'center center', end: '+=130%',
            scrub: 1.6, pin: true, pinSpacing: true, anticipatePin: 1, invalidateOnRefresh: true
          }
        }).to(sSpans, { yPercent: 0, opacity: 1, ease: 'sine.out', duration: 1.4, stagger: { each: 0.18 } })
          .to({}, { duration: 0.5 });                     // gentle hold once assembled
      } else {
        gsap.to(sSpans, {
          yPercent: 0, opacity: 1, ease: 'sine.out', duration: 1.2, stagger: { each: 0.16 },
          scrollTrigger: { trigger: statementH2, start: 'top 82%', end: 'top 42%', scrub: 1.4 }
        });
      }
    }

    /* ---------- Scroll-to-reveal: soft, pronounced fade + rise ---------- */
    gsap.utils.toArray('.reveal').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 46 }, {
        opacity: 1, y: 0, duration: 1.3, ease: 'power2.out',
        delay: (parseFloat(el.getAttribute('data-d')) || 0) * 0.08,
        scrollTrigger: { trigger: el, start: 'top 87%', once: true }
      });
    });

    /* ---------- Feature images: soft scale-reveal + stronger parallax ---------- */
    gsap.utils.toArray('.split__media, .svc__media, .visit__media').forEach(function (m) {
      var img = m.querySelector('img'); if (!img) return;
      gsap.fromTo(img, { scale: 1.09 }, {
        scale: 1, duration: 1.5, ease: 'power2.out',
        scrollTrigger: { trigger: m, start: 'top 90%', once: true }
      });
      gsap.fromTo(img, { yPercent: -15 }, {
        yPercent: 15, ease: 'none',
        scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
    });

    /* ---------- Gallery (about page): subtle parallax drift ---------- */
    gsap.utils.toArray('.gallery figure').forEach(function (fig) {
      var img = fig.querySelector('img'); if (!img) return;
      gsap.fromTo(img, { yPercent: -8 }, {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
    });

    /* ---------- Hero image: soft scale-in on load + parallax on scroll ---------- */
    var heroImg = document.querySelector('.hero__media img');
    if (heroImg) {
      gsap.fromTo(heroImg, { scale: 1.08 }, { scale: 1, duration: 2.1, ease: 'power2.out' });
      gsap.to(heroImg, {
        yPercent: 12, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
      });
    }

    /* keep ScrollTrigger positions correct once fonts/images settle */
    window.addEventListener('load', function () { ST.refresh(); });
    ST.refresh();

  } catch (err) {
    /* Anything goes wrong -> restore a fully-visible, static baseline. */
    try {
      docEl.classList.remove('gsap-ready');
      docEl.classList.remove('lenis-on');
      if (window.gsap) {
        window.gsap.set('.word > span', { yPercent: 0, clearProps: 'transform' });
        window.gsap.set('.reveal', { opacity: 1, y: 0, clearProps: 'opacity,transform' });
      }
    } catch (e2) { /* last resort: do nothing, CSS baseline remains */ }
  }
})();
