/* marketing monk. — interactions. Native scrolling; every scroll effect is a
   lightweight rAF handler. Reveals are fail-safe: content always shows. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ---- Component loader (header/footer injected via fetch, shared across pages) ---- */
  function loadComponents() {
    var includes = [].slice.call(document.querySelectorAll('[data-include]'));
    if (!includes.length) return Promise.resolve();
    return Promise.all(includes.map(function (el) {
      var src = el.getAttribute('data-include');
      return fetch(src)
        .then(function (r) { return r.text(); })
        .then(function (html) { el.outerHTML = html; })
        .catch(function (err) { console.warn('[components] Failed to load:', src, err); });
    })).then(loadComponents); // recurse in case a fragment nests another include
  }

  function initActiveNav() {
    var path = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href === path || (!path && href === '/') || (path === '' && href === 'index.html')) a.classList.add('active');
    });
  }

  ready(function () {
    loadComponents().then(function () {
      initActiveNav();

      /* ---- Navbar scroll state ---- */
      var nav = document.querySelector('.nav');
      function onNavScroll() {
        if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
      }
      onNavScroll();
      window.addEventListener('scroll', onNavScroll, { passive: true });

      /* ---- Mobile menu ---- */
      var toggle = document.querySelector('.nav-toggle');
      var links = document.querySelector('.nav-links');
      if (toggle && links) {
        toggle.addEventListener('click', function () {
          var open = links.classList.toggle('open');
          toggle.classList.toggle('open', open);
          if (nav) nav.classList.toggle('menu-open', open);
          toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
          document.body.style.overflow = open ? 'hidden' : '';
        });
        links.querySelectorAll('a').forEach(function (a) {
          a.addEventListener('click', function () {
            links.classList.remove('open');
            toggle.classList.remove('open');
            if (nav) nav.classList.remove('menu-open');
            document.body.style.overflow = '';
          });
        });
      }

      /* ---- Hero typewriter (rotating last word) ---- */
      var typeEl = document.querySelector('[data-type-words]');
      if (typeEl) {
        var words = [];
        try { words = JSON.parse(typeEl.getAttribute('data-type-words')); } catch (e) { words = ['Clear.']; }
        if (reduce || !words.length) {
          typeEl.textContent = words[0] || 'Clear.';
        } else {
          typeEl.classList.add('type-caret');
          var wi = 0, ci = words[0].length, deleting = true;
          typeEl.textContent = words[0]; // markup shows the first word fully typed
          var TYPE_MS = 110, DEL_MS = 55, HOLD_MS = 2400, GAP_MS = 420;
          function tick() {
            if (deleting) {
              ci--;
              typeEl.textContent = words[wi].slice(0, ci);
              if (ci <= 0) { deleting = false; wi = (wi + 1) % words.length; setTimeout(tick, GAP_MS); }
              else setTimeout(tick, DEL_MS);
            } else {
              ci++;
              typeEl.textContent = words[wi].slice(0, ci);
              if (ci >= words[wi].length) { deleting = true; setTimeout(tick, HOLD_MS); }
              else setTimeout(tick, TYPE_MS);
            }
          }
          // hold the initial fully-typed word before the loop starts deleting
          setTimeout(tick, HOLD_MS);
        }
      }

      /* ---- Scroll reveal (fail-safe) ---- */
      var revealEls = document.querySelectorAll('[data-reveal]');
      function showAll() { revealEls.forEach(function (el) { el.classList.add('in'); }); }
      if (reduce || !('IntersectionObserver' in window)) {
        showAll();
      } else {
        try {
          var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
              if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
            });
          }, { threshold: 0.01, rootMargin: '0px 0px -6% 0px' });
          revealEls.forEach(function (el) { io.observe(el); });
          function revealInView() {
            var vh = window.innerHeight;
            revealEls.forEach(function (el) {
              if (el.classList.contains('in')) return;
              var r = el.getBoundingClientRect();
              if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add('in');
            });
          }
          revealInView();
          window.addEventListener('scroll', revealInView, { passive: true });
          window.addEventListener('resize', revealInView, { passive: true });
          window.addEventListener('load', function () { setTimeout(revealInView, 400); });
          setTimeout(showAll, 2600);
        } catch (err) { showAll(); }
      }

      /* ---- Scroll-linked effects (word-fill + parallax scale), one rAF loop ---- */
      var fillEls = [].slice.call(document.querySelectorAll('.wordfill'));
      fillEls.forEach(function (el) {
        if (el.dataset.split) return;
        var words = el.textContent.trim().split(/\s+/);
        el.innerHTML = words.map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
        el.dataset.split = '1';
      });
      var parallaxEls = [].slice.call(document.querySelectorAll('[data-parallax-scale]'));
      var ticking = false;
      function scrollFx() {
        ticking = false;
        var vh = window.innerHeight;
        fillEls.forEach(function (el) {
          var r = el.getBoundingClientRect();
          // progress 0→1 while the block travels from 85% to 35% of the viewport
          var p = (vh * 0.85 - r.top) / (vh * 0.5);
          p = Math.max(0, Math.min(1, p));
          var spans = el.querySelectorAll('.w');
          var lit = Math.round(p * spans.length);
          spans.forEach(function (s, i) { s.classList.toggle('lit', i < lit); });
        });
        parallaxEls.forEach(function (el) {
          var r = el.getBoundingClientRect();
          var p = (vh - r.top) / (vh + r.height); // 0 entering → 1 leaving
          p = Math.max(0, Math.min(1, p));
          var s = 1.06 - p * 0.06;
          el.style.transform = 'scale(' + s.toFixed(4) + ')';
        });
      }
      function onFxScroll() {
        if (!ticking) { ticking = true; requestAnimationFrame(scrollFx); }
      }
      if (!reduce && (fillEls.length || parallaxEls.length)) {
        scrollFx();
        window.addEventListener('scroll', onFxScroll, { passive: true });
        window.addEventListener('resize', onFxScroll, { passive: true });
      } else if (reduce) {
        fillEls.forEach(function (el) { el.querySelectorAll('.w').forEach(function (s) { s.classList.add('lit'); }); });
      }

      /* ---- Count-up stats ---- */
      var counters = document.querySelectorAll('[data-count]');
      function setFinal(el) {
        var t = parseFloat(el.getAttribute('data-count'));
        var dec = (el.getAttribute('data-count').split('.')[1] || '').length;
        el.textContent = dec ? t.toFixed(dec) : t.toLocaleString();
      }
      function animateCount(el) {
        var target = parseFloat(el.getAttribute('data-count'));
        var dec = (el.getAttribute('data-count').split('.')[1] || '').length;
        var dur = 1400, start = null;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var val = target * (1 - Math.pow(1 - p, 3));
          el.textContent = dec ? val.toFixed(dec) : Math.round(val).toLocaleString();
          if (p < 1) requestAnimationFrame(step); else setFinal(el);
        }
        requestAnimationFrame(step);
      }
      if (reduce || !('IntersectionObserver' in window)) {
        counters.forEach(setFinal);
      } else {
        var co = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
          });
        }, { threshold: 0.6 });
        counters.forEach(function (el) { co.observe(el); });
      }

      /* ---- Testimonial carousel (image + quote slide together; one shared arrow set) ---- */
      document.querySelectorAll('.t-carousel').forEach(function (car) {
        var slides = [].slice.call(car.querySelectorAll('.t-slide'));
        if (!slides.length) return;
        var index = 0, timer = null;
        function show(i) {
          index = (i + slides.length) % slides.length;
          slides.forEach(function (s, si) { s.classList.toggle('active', si === index); });
        }
        function restart() {
          if (reduce) return;
          clearInterval(timer);
          timer = setInterval(function () { show(index + 1); }, 6000);
        }
        var prev = car.querySelector('.t-prev'), next = car.querySelector('.t-next');
        if (prev) prev.addEventListener('click', function () { show(index - 1); restart(); });
        if (next) next.addEventListener('click', function () { show(index + 1); restart(); });
        show(0);
        restart();
      });

      /* ---- Highlights carousel (translateX track) ---- */
      document.querySelectorAll('.hl-carousel').forEach(function (c) {
        var track = c.querySelector('.hl-track');
        var items = [].slice.call(c.querySelectorAll('.hl-item'));
        if (!track || !items.length) return;
        var dotsWrap = c.parentElement.querySelector('.hl-dots');
        var dots = dotsWrap ? [].slice.call(dotsWrap.querySelectorAll('.hl-dot')) : [];
        var index = 0;
        function maxIndex() {
          var viewport = c.querySelector('.hl-viewport');
          var visible = Math.max(1, Math.round(viewport.offsetWidth / (items[0].offsetWidth + 16)));
          return Math.max(0, items.length - visible);
        }
        function go(i) {
          index = Math.max(0, Math.min(i, maxIndex()));
          var gap = parseFloat(getComputedStyle(track).gap) || 16;
          var x = index * (items[0].offsetWidth + gap);
          track.style.transform = 'translateX(' + (-x) + 'px)';
          dots.forEach(function (d, di) { d.classList.toggle('active', di === index); });
        }
        var prev = c.querySelector('.hl-nav.prev'), next = c.querySelector('.hl-nav.next');
        if (prev) prev.addEventListener('click', function () { go(index - 1); });
        if (next) next.addEventListener('click', function () { go(index + 1); });
        dots.forEach(function (d, di) { d.addEventListener('click', function () { go(di); }); });
        window.addEventListener('resize', function () { go(index); }, { passive: true });
        go(0);
      });

      /* ---- Industry filter (portfolio) ---- */
      var fxGrid = document.getElementById('fxGrid');
      var fxChips = document.querySelectorAll('.fx-chip');
      if (fxGrid && fxChips.length) {
        var fxCards = fxGrid.querySelectorAll('[data-industry]');
        fxChips.forEach(function (chip) {
          chip.addEventListener('click', function () {
            var f = chip.getAttribute('data-filter');
            fxChips.forEach(function (ch) {
              var on = ch === chip;
              ch.classList.toggle('active', on);
              ch.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
            fxCards.forEach(function (card) {
              card.hidden = !(f === 'all' || card.getAttribute('data-industry') === f);
            });
          });
        });
      }

      /* ---- Footer live clock ("Canada → HH:MM:SS") + back to top ---- */
      var clock = document.querySelector('[data-clock]');
      if (clock) {
        function tickClock() {
          var d = new Date();
          clock.textContent = d.toLocaleTimeString('en-CA', { hour12: false });
        }
        tickClock();
        setInterval(tickClock, 1000);
      }
      var backTop = document.querySelector('.back-top');
      if (backTop) backTop.addEventListener('click', function () {
        if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.2 });
        else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      });

      /* ---- Anchor smoothing with nav offset (Lenis-aware when anim.js is active) ---- */
      function smoothTo(y) {
        if (window.__lenis) window.__lenis.scrollTo(y, { duration: 1.1 });
        else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      }
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var id = a.getAttribute('href');
          if (id.length < 2) return;
          var t = document.querySelector(id);
          if (!t) return;
          e.preventDefault();
          smoothTo(t.getBoundingClientRect().top + window.scrollY - 100);
        });
      });

      /* ---- Footer year ---- */
      var yr = document.querySelector('[data-year]');
      if (yr) yr.textContent = new Date().getFullYear();

      /* ---- Forms (client-side only for now — no backend wired up yet, see DESIGN.md) ---- */
      document.querySelectorAll('form[data-form]').forEach(function (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (!form.checkValidity()) {
            var bad = form.querySelector(':invalid');
            if (bad) (bad.closest('.u-field, .field') || bad).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
            form.reportValidity();
            return;
          }
          var ok = form.querySelector('.form-success');
          var btn = form.querySelector('[type="submit"]');
          if (btn) { btn.disabled = true; btn.style.opacity = '.7'; }
          setTimeout(function () {
            if (ok) ok.classList.add('show');
            form.reset();
            if (btn) { btn.disabled = false; btn.style.opacity = ''; }
          }, 400);
        });
      });

      /* ---- Hand off to the animation layer (anim.js waits for this) ---- */
      window.__mmComponents = true;
      document.dispatchEvent(new CustomEvent('components:loaded'));
    });
  });
})();
