/* marketing monk. — high-end animation layer (GSAP + ScrollTrigger + Lenis).
   Progressive enhancement: if this file or the vendor libs fail to load, main.js's
   IntersectionObserver reveals still run and the site works untouched.
   prefers-reduced-motion: this whole layer is skipped. */
(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function start() {
    document.documentElement.classList.add('gsap-ready');
    gsap.registerPlugin(ScrollTrigger);

    var fine = window.matchMedia('(pointer: fine)').matches;

    /* ---- Lenis smooth scroll (desktop / fine pointer only) ---- */
    if (window.Lenis && fine && window.innerWidth >= 900) {
      var lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
      window.__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    /* ---- Intro: status pill drops, logo pops ---- */
    var introTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (document.querySelector('.status-pill')) {
      introTl.from('.status-pill', { yPercent: -130, duration: .65, ease: 'back.out(1.6)' }, 0);
    }
    if (document.querySelector('.nav .wm-badge')) {
      introTl.from('.nav .wm-badge', { scale: 0, rotation: -10, duration: .6, ease: 'back.out(1.7)' }, .1);
    }

    /* ---- Hero intro (homepage) ---- */
    var heroH1 = document.querySelector('.hero h1');
    if (heroH1) {
      introTl
        .from(heroH1, { y: 60, autoAlpha: 0, duration: .9 }, .15)
        .from(heroH1.querySelectorAll('.chip-img'), { scale: 0, rotation: -14, duration: .7, ease: 'back.out(2)', stagger: .12 }, .45)
        .from('.hero .sub', { y: 30, autoAlpha: 0, duration: .7 }, .55)
        .from('.hero .hero-actions', { y: 24, autoAlpha: 0, duration: .6 }, .7);
    }

    /* ---- Interior page-hero ghost heading ---- */
    var pageGhost = document.querySelector('.page-hero .ghost');
    if (pageGhost) {
      introTl.from(pageGhost, { scale: .82, y: 50, autoAlpha: 0, duration: 1 }, .2);
    }

    /* ---- Hero collage: scroll-stop, tiles fall into place ---- */
    var collage = document.querySelector('.collage');
    if (collage) {
      var tiles = gsap.utils.toArray('.collage .c-tile');
      var mm = gsap.matchMedia();
      mm.add('(min-width: 900px)', function () {
        // pin the media panel; tiles rain into the grid while the page holds
        gsap.timeline({
          scrollTrigger: {
            trigger: '.hero-media',
            start: 'top 24%',
            end: '+=80%',
            pin: true,
            scrub: 1,
            anticipatePin: 1
          }
        }).from(tiles, {
          y: function () { return gsap.utils.random(240, 560); },
          rotation: function () { return gsap.utils.random(-18, 18); },
          scale: .6,
          autoAlpha: 0,
          ease: 'power2.out',
          stagger: { each: .09, from: 'random' }
        });
      });
      mm.add('(max-width: 899px)', function () {
        // no pin on touch — a staggered drop as the panel enters
        gsap.from(tiles, {
          y: 90,
          rotation: function () { return gsap.utils.random(-8, 8); },
          autoAlpha: 0,
          duration: .8,
          ease: 'power3.out',
          stagger: .07,
          scrollTrigger: { trigger: '.hero-media', start: 'top 82%' }
        });
      });
    }

    /* ---- Generic "fall into place" entrances (replaces the CSS reveals) ---- */
    var revealEls = gsap.utils.toArray('[data-reveal]');
    if (revealEls.length) {
      gsap.set(revealEls, {
        autoAlpha: 0,
        y: 72,
        rotation: function () { return gsap.utils.random(-4, 4); },
        transformOrigin: '50% 100%'
      });
      ScrollTrigger.batch(revealEls, {
        start: 'top 88%',
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, {
            autoAlpha: 1, y: 0, rotation: 0,
            duration: .95, ease: 'power3.out',
            stagger: .09, overwrite: true
          });
        }
      });
      // fail-safe: nothing stays hidden if a trigger misfires
      setTimeout(function () {
        gsap.to(revealEls, { autoAlpha: 1, y: 0, rotation: 0, duration: .6, overwrite: false });
      }, 5000);
    }

    /* ---- Dark panels settle in with a scale ---- */
    gsap.utils.toArray('.panel-dark').forEach(function (p) {
      gsap.from(p, {
        scale: .94, y: 44, duration: 1.05, ease: 'power3.out',
        scrollTrigger: { trigger: p, start: 'top 86%', once: true }
      });
    });

    /* ---- Ghost headings: slow parallax drift behind their panels ---- */
    gsap.utils.toArray('.ghost').forEach(function (g) {
      if (g.closest('.page-hero')) return; // page heroes animate on load instead
      gsap.fromTo(g, { yPercent: 28 }, {
        yPercent: -12, ease: 'none',
        scrollTrigger: { trigger: g, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    /* ---- Ribbons: skew with scroll velocity ---- */
    var tracks = gsap.utils.toArray('.rb-track');
    if (tracks.length) {
      var skewSetters = tracks.map(function (t) { return gsap.quickSetter(t, 'skewX', 'deg'); });
      var proxy = { skew: 0 };
      var clampSkew = gsap.utils.clamp(-10, 10);
      ScrollTrigger.create({
        onUpdate: function (self) {
          var skew = clampSkew(self.getVelocity() / -250);
          if (Math.abs(skew) > Math.abs(proxy.skew)) {
            proxy.skew = skew;
            gsap.to(proxy, {
              skew: 0, duration: .7, ease: 'power3', overwrite: true,
              onUpdate: function () { skewSetters.forEach(function (s) { s(proxy.skew); }); }
            });
          }
        }
      });
    }

    /* ---- Footer giant wordmark: rise + fade (transform/opacity only — animating
       a blur() filter per scroll frame was a measurable jank source; the static
       CSS blur on .f-giant stays) ---- */
    var giant = document.querySelector('.f-giant');
    if (giant) {
      gsap.fromTo(giant,
        { yPercent: 34, autoAlpha: .25 },
        {
          yPercent: 0, autoAlpha: 1, ease: 'none',
          scrollTrigger: { trigger: '.footer', start: 'top 85%', end: 'bottom bottom', scrub: true }
        });
    }

    /* ---- Magnetic buttons (fine pointer only) ---- */
    if (fine) {
      document.querySelectorAll('.btn').forEach(function (btn) {
        btn.addEventListener('mousemove', function (e) {
          var r = btn.getBoundingClientRect();
          gsap.to(btn, {
            x: (e.clientX - r.left - r.width / 2) * .28,
            y: (e.clientY - r.top - r.height / 2) * .4,
            duration: .4, ease: 'power2.out'
          });
        });
        btn.addEventListener('mouseleave', function () {
          gsap.to(btn, { x: 0, y: 0, duration: .55, ease: 'elastic.out(1, .45)' });
        });
      });
    }

    /* keep trigger positions honest once images finish loading */
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });

    window.__mmAnimActive = true;
  }

  if (window.__mmComponents) start();
  else document.addEventListener('components:loaded', start, { once: true });
})();
