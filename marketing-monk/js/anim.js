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
    var mm = gsap.matchMedia();

    /* ---- Lenis smooth scroll (desktop / fine pointer only) ---- */
    if (window.Lenis && fine && window.innerWidth >= 900) {
      var lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 1 });
      window.__lenis = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    /* ---- Intro: status pill drops, logo pops (waits for the veil entrance to lift) ---- */
    var docEl = document.documentElement;
    var introTl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      delay: docEl.classList.contains('veil-fresh') ? 1.05 :
             docEl.classList.contains('veiling') ? .6 : 0
    });
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
      mm.add('(min-width: 900px)', function () {
        // pin the media panel; tiles rain into the grid while the page holds.
        // long end distance = the scroll-stop actually holds; scrub 1.5 = weighty feel
        gsap.timeline({
          scrollTrigger: {
            trigger: '.hero-media',
            start: 'top 22%',
            end: '+=170%',
            pin: true,
            scrub: 1.5,
            anticipatePin: 1
          }
        }).from(tiles, {
          y: function () { return gsap.utils.random(240, 560); },
          rotation: function () { return gsap.utils.random(-18, 18); },
          scale: .6,
          autoAlpha: 0,
          ease: 'power2.out',
          stagger: { each: .14, from: 'random' }
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

    /* ---- Scroll-stop grid assemblies ----
       [data-assemble="pin"]  — the grid pins while its children fly into place (scrub)
       [data-assemble="flow"] — children fly into place as the grid scrolls through
       (tall grids use flow: pinning something taller than the viewport clips it) */
    gsap.utils.toArray('[data-assemble]').forEach(function (grid) {
      var kids = gsap.utils.toArray(grid.children);
      if (!kids.length) return;
      var pinMode = grid.getAttribute('data-assemble') !== 'flow';
      mm.add('(min-width: 900px)', function () {
        if (pinMode) {
          gsap.timeline({
            scrollTrigger: {
              trigger: grid, start: 'top 24%',
              end: '+=' + Math.min(170, 70 + kids.length * 14) + '%',
              pin: true, scrub: 1.5, anticipatePin: 1
            }
          }).from(kids, {
            y: function () { return gsap.utils.random(200, 440); },
            x: function () { return gsap.utils.random(-140, 140); },
            rotation: function () { return gsap.utils.random(-16, 16); },
            scale: .7, autoAlpha: 0, ease: 'power2.out',
            stagger: { each: .14, from: 'random' }
          });
        } else {
          gsap.from(kids, {
            y: 140,
            x: function () { return gsap.utils.random(-70, 70); },
            rotation: function () { return gsap.utils.random(-9, 9); },
            autoAlpha: 0, ease: 'power2.out', stagger: .1,
            scrollTrigger: { trigger: grid, start: 'top 92%', end: 'center 38%', scrub: 1.3 }
          });
        }
      });
      mm.add('(max-width: 899px)', function () {
        gsap.from(kids, {
          y: 70, autoAlpha: 0, duration: .8, ease: 'power3.out', stagger: .09,
          scrollTrigger: { trigger: grid, start: 'top 85%', toggleActions: 'play none none reverse' }
        });
      });
    });

    /* ---- Works showcase bands: fly in from alternating sides ---- */
    gsap.utils.toArray('.case-band').forEach(function (band, i) {
      var dir = i % 2 ? 1 : -1;
      gsap.fromTo(band,
        { xPercent: dir * (window.innerWidth < 900 ? 7 : 13), rotation: dir * 2, autoAlpha: 0 },
        {
          xPercent: 0, rotation: 0, autoAlpha: 1, ease: 'power2.out',
          scrollTrigger: { trigger: band, start: 'top 98%', end: 'top 40%', scrub: 1.3 }
        });
    });

    /* ---- Homepage testimonials: stat card and carousel converge from opposite sides ---- */
    var testiCards = document.querySelector('.testi-cards');
    if (testiCards) {
      var conv = { trigger: testiCards, start: 'top 96%', end: 'top 32%', scrub: 1.3 };
      gsap.fromTo('.t-stat', { xPercent: -18, rotation: -4, autoAlpha: 0 },
        { xPercent: 0, rotation: 0, autoAlpha: 1, ease: 'power2.out', scrollTrigger: conv });
      gsap.fromTo('.t-carousel', { xPercent: 14, rotation: 3, autoAlpha: 0 },
        { xPercent: 0, rotation: 0, autoAlpha: 1, ease: 'power2.out', scrollTrigger: Object.assign({}, conv) });
    }

    /* ---- Generic "fall into place" entrances (replaces the CSS reveals) ----
       Elements owned by the fancier systems above are excluded. */
    var revealEls = gsap.utils.toArray('[data-reveal]').filter(function (el) {
      return !el.closest('[data-assemble]') &&
             !el.classList.contains('case-band') &&
             !el.closest('.testi-cards');
    });
    if (revealEls.length) {
      gsap.set(revealEls, {
        autoAlpha: 0,
        y: 72,
        rotation: function () { return gsap.utils.random(-4, 4); },
        transformOrigin: '50% 100%'
      });
      /* bidirectional: fall into place scrolling down, lift back out scrolling up */
      ScrollTrigger.batch(revealEls, {
        start: 'top 90%',
        onEnter: function (batch) {
          gsap.to(batch, {
            autoAlpha: 1, y: 0, rotation: 0,
            duration: 1.15, ease: 'power3.out',
            stagger: .1, overwrite: true
          });
        },
        onLeaveBack: function (batch) {
          gsap.to(batch, {
            autoAlpha: 0, y: 64, rotation: 0,
            duration: .55, ease: 'power2.in',
            stagger: .05, overwrite: true
          });
        }
      });
      // fail-safe: nothing stays hidden if a trigger misfires
      setTimeout(function () {
        gsap.to(revealEls, { autoAlpha: 1, y: 0, rotation: 0, duration: .6, overwrite: false });
      }, 5000);
    }

    /* ---- Dark panels settle in with a scale (reverses on scroll back up) ---- */
    gsap.utils.toArray('.panel-dark').forEach(function (p) {
      gsap.from(p, {
        scale: .94, y: 44, duration: 1.25, ease: 'power3.out',
        scrollTrigger: { trigger: p, start: 'top 88%', toggleActions: 'play none none reverse' }
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

    /* ---- Page-transition veil: exit wipe on internal navigation ----
       (entrance on the destination page is pure CSS — see .page-veil in style.css) */
    var veil = document.querySelector('.page-veil');
    if (veil) {
      var veilBadge = veil.querySelector('.pv-badge');
      var leaving = false;

      /* entrance bookkeeping: once the CSS veilOut animation finishes, drop the class
         and the animation — its 'forwards' fill (translateY(-103%)) outranks GSAP's
         inline transform in the cascade, which made the NEXT exit wipe run invisibly
         ("the veil just appears out of nowhere on the destination"). */
      function clearVeiling() {
        document.documentElement.classList.remove('veiling');
        document.documentElement.classList.remove('veil-fresh');
        veil.style.animation = 'none';
        gsap.set(veil, { y: 0, yPercent: 103 });
      }
      if (document.documentElement.classList.contains('veiling')) {
        veil.addEventListener('animationend', function (ev) {
          if (ev.target === veil) clearVeiling(); // ignore the badge's own animationend
        }, { once: false });
        setTimeout(clearVeiling, 2200); // fallback if animationend never fires
      }
      document.addEventListener('click', function (e) {
        var a = e.target.closest('a');
        if (!a || leaving) return;
        if (a.target === '_blank' || a.hasAttribute('download')) return;
        var raw = a.getAttribute('href');
        if (!raw || raw[0] === '#' || /^(mailto:|tel:|javascript:)/i.test(raw)) return;
        var url;
        try { url = new URL(a.href, location.href); } catch (err) { return; }
        if (url.origin !== location.origin) return;
        if (url.pathname === location.pathname) return; // same-page (anchor) nav
        e.preventDefault();
        leaving = true;
        try { sessionStorage.setItem('mm-nav', '1'); } catch (err) {}
        // make sure no leftover entrance animation (forwards fill) can override the tween
        clearVeiling();
        // y:0 matters: GSAP parses the CSS translateY(103%) into its pixel `y` channel,
        // and yPercent stacks on top of it — without clearing y the veil never reaches
        // the viewport (it animates 1852px → 927px, entirely below the fold)
        gsap.timeline({ onComplete: function () { location.href = url.href; } })
          .fromTo(veil, { y: 0, yPercent: 103 }, { y: 0, yPercent: 0, duration: .6, ease: 'power3.inOut' })
          .fromTo(veilBadge, { scale: .5, rotation: -10, autoAlpha: 0 },
            { scale: 1, rotation: -2, autoAlpha: 1, duration: .45, ease: 'back.out(1.7)' }, .18);
      });
      // restored from back/forward cache: make sure the veil isn't stuck covering
      window.addEventListener('pageshow', function (ev) {
        if (ev.persisted) {
          leaving = false;
          clearVeiling();
        }
      });
    }

    /* keep trigger positions honest once images finish loading */
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });

    window.__mmAnimActive = true;
  }

  if (window.__mmComponents) start();
  else document.addEventListener('components:loaded', start, { once: true });
})();
