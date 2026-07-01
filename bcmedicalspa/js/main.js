/* BC Medical Spa — main.js
   Native scrolling only. No external libraries. Fail-safe reveals. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sticky / dark-aware nav ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () {
      if (window.scrollY > 24) nav.classList.add('is-solid');
      else nav.classList.remove('is-solid');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile drawer ---------- */
  var toggle = document.querySelector('.nav__toggle');
  var drawer = document.querySelector('.drawer');
  if (toggle && drawer) {
    var setOpen = function (open) {
      drawer.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);   // hides the sticky action bar
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', function () {
      setOpen(!drawer.classList.contains('open'));
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  /* ---------- Smooth anchor scroll with nav offset ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (window.__lenis) { window.__lenis.scrollTo(target, { offset: -84 }); return; }
      var top = target.getBoundingClientRect().top + window.scrollY - 84;
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Reveal on scroll (fail-safe) ----------
     If the GSAP layer (anim.js) initialised, it owns the reveals and headings,
     so this IntersectionObserver stands down to avoid two systems fighting. */
  var gsapMode = document.documentElement.classList.contains('gsap-ready');
  var reveals = document.querySelectorAll('.reveal');
  var showAll = function () { reveals.forEach(function (el) { el.classList.add('in'); }); };
  if (gsapMode) {
    /* GSAP/ScrollTrigger controls .reveal — nothing to do here. */
  } else if (reduce || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    try {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
      // safety net: if anything is still hidden after 3s, show it
      setTimeout(function () {
        reveals.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight) el.classList.add('in');
        });
      }, 3000);
    } catch (err) { showAll(); }
  }

  /* ---------- Count-up stats ---------- */
  var stats = document.querySelectorAll('[data-count]');
  if (stats.length) {
    var run = function (el) {
      var end = parseFloat(el.getAttribute('data-count'));
      var dec = (end % 1 !== 0) ? 1 : 0;
      if (reduce) { el.textContent = end.toFixed(dec); return; }
      var start = null, dur = 1600;
      var tick = function (t) {
        if (!start) start = t;
        var p = Math.min((t - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (end * eased).toFixed(dec);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = end.toFixed(dec);
      };
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      var so = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { run(en.target); so.unobserve(en.target); }
        });
      }, { threshold: 0.6 });
      stats.forEach(function (el) { so.observe(el); });
    } else {
      stats.forEach(run);
    }
  }

  /* ---------- Testimonial rotator ---------- */
  var quoteWrap = document.querySelector('.quotes');
  if (quoteWrap) {
    var quotes = quoteWrap.querySelectorAll('.quote');
    var dotsWrap = quoteWrap.querySelector('.qdots');
    var i = 0, timer = null;
    if (quotes.length > 1 && dotsWrap) {
      quotes.forEach(function (q, idx) {
        var b = document.createElement('button');
        b.setAttribute('aria-label', 'Testimonial ' + (idx + 1));
        if (idx === 0) b.classList.add('active');
        b.addEventListener('click', function () { go(idx); reset(); });
        dotsWrap.appendChild(b);
      });
      var dots = dotsWrap.querySelectorAll('button');
      var go = function (n) {
        quotes[i].classList.remove('active');
        dots[i].classList.remove('active');
        i = (n + quotes.length) % quotes.length;
        quotes[i].classList.add('active');
        dots[i].classList.add('active');
      };
      var reset = function () {
        if (reduce) return;
        clearInterval(timer);
        timer = setInterval(function () { go(i + 1); }, 6000);
      };
      reset();
    }
  }

  /* ---------- Forms (front-end only demo) ---------- */
  document.querySelectorAll('form[data-demo]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = form.querySelector('.form__note');
      if (note) {
        note.classList.add('show');
        note.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      }
      form.reset();
    });
  });

  /* ---------- Year ---------- */
  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
