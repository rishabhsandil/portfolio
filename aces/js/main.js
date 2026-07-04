/* Aspire — interactions. Native scrolling (no smooth-scroll library).
   Reveals are fail-safe: if anything goes wrong, content is shown. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    /* ---- Navbar scroll state ---- */
    var nav = document.querySelector('.nav');
    function onScroll() {
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

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

    /* ---- Scroll reveal (fail-safe) ---- */
    var revealEls = document.querySelectorAll('[data-reveal], .clip-reveal');
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

        /* Robust fallback: reveal on scroll (covers any case the observer misses) */
        function revealInView() {
          var vh = window.innerHeight;
          revealEls.forEach(function (el) {
            if (el.classList.contains('in')) return;
            var r = el.getBoundingClientRect();
            if (r.top < vh * 0.9 && r.bottom > 0) el.classList.add('in');
          });
        }
        revealInView();
        window.addEventListener('scroll', revealInView, { passive: true });
        window.addEventListener('resize', revealInView, { passive: true });
        /* Ultimate safety: nothing stays hidden permanently */
        window.addEventListener('load', function () { setTimeout(revealInView, 400); });
        setTimeout(showAll, 2600);
      } catch (err) { showAll(); }
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

    /* ---- Vertical tabs ---- */
    document.querySelectorAll('[data-tabs]').forEach(function (group) {
      var tabs = group.querySelectorAll('.tab');
      var panels = group.querySelectorAll('.o-panel');
      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          var id = tab.getAttribute('data-tab');
          tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
          panels.forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-panel') === id); });
        });
      });
    });

    /* ---- Best-country-by-field filter ---- */
    var fxGrid = document.getElementById('fieldGrid');
    var fxChips = document.querySelectorAll('.fx-chip');
    if (fxGrid && fxChips.length) {
      var fxCards = fxGrid.querySelectorAll('.fx-card');
      fxChips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          var f = chip.getAttribute('data-filter');
          fxChips.forEach(function (c) {
            var on = c === chip;
            c.classList.toggle('active', on);
            c.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          fxCards.forEach(function (card) {
            var show = f === 'all' || (' ' + card.getAttribute('data-countries') + ' ').indexOf(' ' + f + ' ') !== -1;
            card.hidden = !show;
          });
        });
      });
    }

    /* ---- Anchor smoothing with nav offset (native, lightweight) ---- */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        var y = t.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      });
    });

    /* ---- Footer year ---- */
    var yr = document.querySelector('[data-year]');
    if (yr) yr.textContent = new Date().getFullYear();

    /* ---- Real form submission (POST to submit.php, JSON response) ---- */
    function lockForm(form) {
      form.querySelectorAll('input,select,textarea,button').forEach(function (f) {
        if (f.type !== 'hidden') f.setAttribute('disabled', 'true');
      });
    }
    document.querySelectorAll('form[data-ajax]').forEach(function (form) {
      // clear a group's invalid flag once the user picks an option
      form.querySelectorAll('.choice input').forEach(function (r) {
        r.addEventListener('change', function () {
          var c = r.closest('.choice');
          if (c) c.classList.remove('invalid');
        });
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        // visually flag any required pill-group with no selection
        form.querySelectorAll('.choice').forEach(function (c) {
          var req = c.querySelector('input[required]');
          if (req) c.classList.toggle('invalid', !form.querySelector('input[name="' + req.name + '"]:checked'));
        });
        if (!form.checkValidity()) {
          var bad = form.querySelector(':invalid');
          if (bad) (bad.closest('.field, .yn, .form-group') || bad).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
          form.reportValidity();
          return;
        }
        var ok = form.querySelector('.form-success');
        var btn = form.querySelector('[type="submit"]');
        var btnText = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.style.opacity = '.7'; btn.innerHTML = 'Sending…'; }
        fetch(form.getAttribute('action'), { method: 'POST', body: new FormData(form) })
          .then(function (r) { return r.json().catch(function () { return { success: false }; }); })
          .then(function (res) {
            if (res && res.success) {
              if (ok) { ok.classList.add('show'); ok.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); }
              lockForm(form);
            } else {
              if (btn) { btn.disabled = false; btn.style.opacity = ''; btn.innerHTML = btnText; }
              alert((res && res.message) || 'Sorry, we could not send your message. Please call (604) 316-8015 or email info@aspirecareers.ca.');
            }
          })
          .catch(function () {
            if (btn) { btn.disabled = false; btn.style.opacity = ''; btn.innerHTML = btnText; }
            alert('Network error — please email info@aspirecareers.ca or call (604) 316-8015.');
          });
      });
    });
  });
})();
