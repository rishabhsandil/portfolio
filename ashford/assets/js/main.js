/* Ashford Career College - Premium Site Interactions */
(function () {
  'use strict';

  // -- Component loader --------------------------------------------------------
  function loadComponents() {
    var includes = [].slice.call(document.querySelectorAll('[data-include]'));
    if (!includes.length) return Promise.resolve();
    return Promise.all(includes.map(function (el) {
      return fetch(el.dataset.include)
        .then(function (r) { return r.text(); })
        .then(function (html) { el.outerHTML = html; })
        .catch(function (err) {
          console.warn('[components] Failed to load:', el.dataset.include, err);
        });
    }));
  }

  // -- Scroll Progress Bar ------------------------------------------------------
  function initScrollProgress() {
    var bar = document.getElementById('scroll-progress');
    if (!bar) return;
    window.addEventListener('scroll', function () {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct.toFixed(2) + '%';
    }, { passive: true });
  }

  // -- Header scroll glass effect ----------------------------------------------
  function initHeaderScroll() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var threshold = 50;
    function onScroll() {
      header.classList.toggle('is-scrolled', window.scrollY > threshold);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run on load
  }

  // -- Back to Top button -------------------------------------------------------
  function initBackToTop() {
    var btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.classList.toggle('is-visible', window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // -- Scroll Reveal with stagger -----------------------------------------------
  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) {
      observer.observe(el);
    });

    // Stagger: when a .stagger container enters view, reveal all its children
    var staggerObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var children = entry.target.querySelectorAll('.reveal');
          children.forEach(function (child) {
            child.classList.add('is-visible');
          });
          staggerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.stagger').forEach(function (el) {
      staggerObserver.observe(el);
    });
  }

  // -- Counter Animation ---------------------------------------------------------
  function animateCounter(el, target, suffix) {
    var start = 0;
    var duration = 1800;
    var startTime = null;
    // Ease out cubic
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var current = Math.floor(easeOut(progress) * target);
      el.textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  }

  function initCounters() {
    if (!('IntersectionObserver' in window)) return;
    var counters = document.querySelectorAll('.stat__number[data-count]');
    if (!counters.length) return;

    var seen = new Set();
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !seen.has(entry.target)) {
          seen.add(entry.target);
          var el = entry.target;
          var raw = el.dataset.count;
          var suffix = el.dataset.suffix || '';
          var target = parseFloat(raw);
          if (!isNaN(target)) animateCounter(el, target, suffix);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { counterObserver.observe(el); });
  }

  // -- Subtle hero parallax ------------------------------------------------------
  function initHeroParallax() {
    var bg = document.querySelector('.hero__bg');
    if (!bg) return;
    // Only on devices with no motion preference and sufficient screen
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 768) return;

    window.addEventListener('scroll', function () {
      var scrollY = window.scrollY;
      // Move at 30% of scroll speed for parallax depth
      bg.style.transform = 'translateY(' + (scrollY * 0.28).toFixed(1) + 'px)';
    }, { passive: true });
  }

  // -- Marquee duplication --------------------------------------------------------
  function initMarquee() {
    var track = document.querySelector('.marquee-track');
    if (!track) return;
    // Clone children to fill seamlessly
    var items = track.innerHTML;
    track.innerHTML = items + items; // duplicate for seamless loop
  }

  // -- Mobile nav --------------------------------------------------------------
  function initMobileNav() {
    var toggle = document.querySelector('.nav__toggle');
    var menu   = document.querySelector('.nav__menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('is-open');
      toggle.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = (isOpen && window.innerWidth <= 768) ? 'hidden' : '';
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth <= 768) {
          menu.classList.remove('is-open');
          toggle.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      });
    });
  }

  // -- Active nav link ----------------------------------------------------------
  function initActiveNav() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav__link').forEach(function (link) {
      var href = link.getAttribute('href');
      if (href === path || (path === '' && href === 'index.html')) {
        link.classList.add('is-active');
      }
    });
  }

  // -- Footer year --------------------------------------------------------------
  function initFooterYear() {
    var yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  // -- Form validation -----------------------------------------------------------
  function initForms() {
    document.querySelectorAll('form[data-form]').forEach(function (form) {
      var feedback = form.querySelector('.form__feedback');

      // Live border reset on input
      form.querySelectorAll('input, textarea, select').forEach(function (field) {
        field.addEventListener('input', function () {
          if (field.value.trim()) field.style.borderColor = '';
        });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();

        var captcha = form.querySelector('[name="captcha"]');
        if (captcha && captcha.value.trim() !== '8') {
          if (feedback) {
            feedback.className = 'form__feedback is-error';
            feedback.textContent = 'Please answer the security question correctly (which is bigger, 2 or 8?).';
          }
          return;
        }

        var valid = true;
        form.querySelectorAll('[required]').forEach(function (field) {
          if (!field.value.trim()) {
            field.style.borderColor = 'var(--color-danger)';
            valid = false;
          } else {
            field.style.borderColor = '';
          }
        });

        if (!valid) {
          if (feedback) {
            feedback.className = 'form__feedback is-error';
            feedback.textContent = 'Please complete all required fields.';
          }
          return;
        }

        if (feedback) {
          feedback.className = 'form__feedback is-success';
          feedback.textContent = 'Thank you! Your message has been received. We will reply within 1\u20132 business days.';
        }
        form.reset();
      });
    });
  }

  // -- Magnetic button effect --------------------------------------------------
  function initMagneticButtons() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if ('ontouchstart' in window) return; // skip on touch devices

    document.querySelectorAll('.btn--gold, .btn--primary').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + (x * 0.12).toFixed(1) + 'px, ' + (y * 0.12 - 2).toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  // -- Bootstrap ---------------------------------------------------------------
  // Initialize progress bar and parallax immediately (don't need components)
  initScrollProgress();
  initHeroParallax();
  initBackToTop();

  // Load components then initialize everything that depends on the DOM
  loadComponents().then(function () {
    initHeaderScroll();
    initMobileNav();
    initActiveNav();
    initScrollReveal();
    initCounters();
    initMarquee();
    initFooterYear();
    initForms();
    initMagneticButtons();
  });

})();
