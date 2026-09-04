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
        .then(function (html) {
          el.outerHTML = html;
        })
        .catch(function (err) {
          console.warn('[components] Failed to load:', el.dataset.include, err);
        });
    })).then(loadComponents); // Recursively load nested components
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

    // Handle dropdowns on mobile
    menu.querySelectorAll('.nav__item.has-dropdown > .nav__link, .nav__item.has-mega > .nav__link').forEach(function(link) {
      link.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          var item = link.parentElement;
          var wasOpen = item.classList.contains('is-open');
          // Close all others
          menu.querySelectorAll('.nav__item').forEach(function(el) { el.classList.remove('is-open'); });
          // Toggle current
          if (!wasOpen) item.classList.add('is-open');
        }
      });
    });

    // Close menu on link click (only for actual links, not dropdown triggers)
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        var isTrigger = link.parentElement.classList.contains('has-dropdown') || link.parentElement.classList.contains('has-mega');
        if (window.innerWidth <= 768 && !isTrigger) {
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

  // -- Thank You redirect -------------------------------------------------------
  // Navigates to the Thank You page after a successful submission. The Google Ads
  // conversion is fired first with an event_callback so it is not cut short by the
  // navigation; the timeout is the fallback for when gtag never calls back.
  function goToThankYou(form) {
    var action = (form && form.getAttribute('action')) || '/submit.php';
    // Clean URL, matching every other internal link on the site. .htaccess 301s
    // /thank-you.html to /thank-you, so linking the .html would cost a redirect.
    var url = action.replace('submit.php', 'thank-you');
    var done = false;
    function go() {
      if (done) return;
      done = true;
      window.location.href = url;
    }
    if (typeof gtag === 'function') {
      gtag('event', 'conversion', {
        send_to: 'AW-853928503/08lgCP_L4aMcELfUl5cD',
        event_callback: go,
        event_timeout: 1500
      });
      setTimeout(go, 1500);
    } else {
      go();
    }
  }

  // -- Multi-Step Form Logic ----------------------------------------------------
  function initForms() {
    var form = document.getElementById('multi-step-form');
    var container = document.getElementById('form-container');
    var success = document.getElementById('form-success');
    if (!form || !container || !success) return;

    var steps = form.querySelectorAll('.form-step');
    var progressSegments = document.querySelectorAll('.form-progress__segment');
    var currentStep = 1;
    var STORAGE_KEY = 'ashford_form_state';

    // -- State Management --
    function saveState() {
      var data = {
        step: currentStep,
        fields: {}
      };
      form.querySelectorAll('input, select, textarea').forEach(function(el) {
        if (el.name && el.name !== 'access_key' && el.name !== 'captcha') {
          data.fields[el.name] = el.value;
        }
      });
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function loadState() {
      var saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      try {
        var data = JSON.parse(saved);
        currentStep = data.step || 1;
        Object.keys(data.fields).forEach(function(name) {
          var el = form.querySelector('[name="' + name + '"]');
          if (el) el.value = data.fields[name];
        });
        updateUI();
      } catch(e) { console.error('Form state load failed', e); }
    }

    // -- UI Updates --
    function updateUI() {
      steps.forEach(function(step) {
        var s = parseInt(step.dataset.step);
        step.classList.toggle('is-active', s === currentStep);
        step.classList.toggle('is-past', s < currentStep);
      });
      progressSegments.forEach(function(seg) {
        var s = parseInt(seg.dataset.step);
        seg.classList.toggle('is-active', s === currentStep);
        seg.classList.toggle('is-complete', s < currentStep);
      });
    }

    // -- Validation --
    function validateStep(s) {
      var stepEl = form.querySelector('.form-step[data-step="' + s + '"]');
      var valid = true;
      stepEl.querySelectorAll('[required]').forEach(function(field) {
        if (!field.value.trim()) {
          field.style.borderColor = 'var(--color-danger)';
          valid = false;
        } else {
          field.style.borderColor = '';
        }
      });
      return valid;
    }

    // -- Submissions --
    function submitPartial() {
      var formData = new FormData(form);
      formData.set('subject', '[Partial Lead] Ashford Career College');
      // We don't wait for response, just fire and forget
      fetch(form.action, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } });
    }

    // -- Event Listeners --
    form.querySelectorAll('.btn--next').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (validateStep(currentStep)) {
          // Trigger partial submission after Step 1 (since it now contains identity)
          if (currentStep === 1) submitPartial();
          currentStep++;
          updateUI();
          saveState();
        }
      });
    });

    form.querySelectorAll('.btn--back').forEach(function(btn) {
      btn.addEventListener('click', function() {
        currentStep--;
        updateUI();
        saveState();
      });
    });

    form.querySelectorAll('input, select, textarea').forEach(function(el) {
      el.addEventListener('input', saveState);
    });

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      if (!validateStep(currentStep)) return;

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalText = submitBtn.textContent;
      submitBtn.textContent = 'Submitting...';
      submitBtn.disabled = true;

      var formData = new FormData(form);
      formData.set('subject', '[Complete Lead] Ashford Career College');

      // On success we leave the page, so the button must stay disabled through the
      // brief wait for the conversion callback. Re-enabling it would allow a
      // second submission in that window.
      var leaving = false;

      fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      }).then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.success) {
          leaving = true;
          sessionStorage.removeItem(STORAGE_KEY);
          container.style.display = 'none';
          success.classList.add('is-visible');
          // Fires the conversion, then sends the user to the Thank You page. The
          // inline success box above only shows if navigation is prevented.
          goToThankYou(form);
        } else {
          alert('Oops! There was a problem. Please try again.');
        }
      }).catch(function() {
        alert('An error occurred. Please check your connection.');
      }).finally(function() {
        if (leaving) return;
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      });
    });

    loadState();
  }

  // -- Mobile Get Details Drawer ------------------------------------------------
  function initMobileDrawer() {
    var bar      = document.getElementById('mobile-cta-bar');
    var drawer   = document.getElementById('mobile-drawer');
    var trigger  = document.getElementById('mobile-cta-trigger');
    var closeBtn = document.getElementById('drawer-close');
    var backdrop = document.getElementById('drawer-backdrop');
    var form     = document.getElementById('drawer-form');
    var body     = document.getElementById('drawer-body');
    if (!bar || !drawer) return;
    if (window.innerWidth > 768) return;
    document.body.classList.add('has-mobile-cta');

    function openDrawer() {
      drawer.classList.add('is-open');
      bar.classList.add('is-hidden');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      drawer.classList.remove('is-open');
      bar.classList.remove('is-hidden');
      document.body.style.overflow = '';
    }

    trigger  && trigger.addEventListener('click', openDrawer);
    closeBtn && closeBtn.addEventListener('click', closeDrawer);
    backdrop && backdrop.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        }).then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            body.innerHTML =
              '<div style="text-align:center;padding:var(--space-6) 0">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="var(--color-navy-700)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px;margin:0 auto var(--space-4);display:block"><polyline points="20 6 9 17 4 12"/></svg>' +
              '<h3 style="font-family:var(--font-serif);color:var(--color-navy-900);margin-bottom:var(--space-3)">Details on the way!</h3>' +
              '<p style="color:var(--color-gray-700);font-size:0.875rem">Taking you to your confirmation...</p>' +
              '</div>';
            goToThankYou(form);
          } else {
            alert('Oops! Something went wrong. Please try again.');
            submitBtn.textContent = 'Get Program Details →';
            submitBtn.disabled = false;
          }
        }).catch(function () {
          alert('An error occurred. Please check your connection.');
          submitBtn.textContent = 'Get Program Details →';
          submitBtn.disabled = false;
        });
      });
    }
  }

  // -- Email Signup Popup -------------------------------------------------------
  function initEmailPopup() {
    var popup = document.getElementById('email-popup');
    if (!popup) return;
    if (sessionStorage.getItem('ashford_popup_dismissed')) return;

    var closeBtn  = document.getElementById('popup-close');
    var backdrop  = popup.querySelector('.email-popup__backdrop');
    var form      = document.getElementById('popup-form');
    var content   = document.getElementById('popup-content');
    var dismissed = false;

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      popup.classList.remove('is-visible');
      sessionStorage.setItem('ashford_popup_dismissed', '1');
      window.removeEventListener('scroll', onScroll);
    }

    function onScroll() {
      if (window.scrollY > 60) dismiss();
    }

    setTimeout(function () {
      popup.classList.add('is-visible');
      window.addEventListener('scroll', onScroll, { passive: true });
    }, 1500);

    closeBtn && closeBtn.addEventListener('click', dismiss);
    backdrop  && backdrop.addEventListener('click', dismiss);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') dismiss();
    });

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Subscribing...';
        submitBtn.disabled = true;

        fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        }).then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            window.removeEventListener('scroll', onScroll);
            content.innerHTML =
              '<div class="email-popup__success">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
              '<h3>You\'re on the list!</h3>' +
              '<p>Thanks for signing up. We\'ll be in touch with updates and offers soon.</p>' +
              '</div>';
            setTimeout(dismiss, 2800);
          } else {
            alert('Oops! Something went wrong. Please try again.');
            submitBtn.textContent = 'Subscribe';
            submitBtn.disabled = false;
          }
        }).catch(function () {
          alert('An error occurred. Please check your connection.');
          submitBtn.textContent = 'Subscribe';
          submitBtn.disabled = false;
        });
      });
    }
  }

  // -- Generic AJAX form handler ([data-form]) ---------------------------------
  // Used by simple single-step forms (Contact, Registration) that just need to
  // POST to submit.php and show inline success/error feedback.
  function initGenericForms() {
    document.querySelectorAll('form[data-form]').forEach(function (form) {
      var feedback = form.querySelector('.form__feedback');

      function setFeedback(msg, isError) {
        if (!feedback) return;
        feedback.textContent = msg || '';
        feedback.classList.toggle('is-success', !isError && !!msg);
        feedback.classList.toggle('is-error', !!isError && !!msg);
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        setFeedback('');

        // HTML5 validation (form has novalidate)
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        var submitBtn = form.querySelector('button[type="submit"]');
        var original  = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) { submitBtn.textContent = 'Sending...'; submitBtn.disabled = true; }

        fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        }).then(function (r) { return r.json().catch(function () { return { success: false }; }); })
        .then(function (data) {
          if (data.success) {
              gtag('event', 'conversion', {
        send_to: 'AW-853928503/08lgCP_L4aMcELfUl5cD'
        });
            form.reset();
            setFeedback('Thanks — your message has been sent. An advisor will follow up shortly.', false);
          } else {
            setFeedback(data.message || 'Sorry — something went wrong. Please try again.', true);
          }
        }).catch(function () {
          setFeedback('Network error. Please check your connection and try again.', true);
        }).finally(function () {
          if (submitBtn) { submitBtn.textContent = original; submitBtn.disabled = false; }
        });
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
  // Load Cloudflare Turnstile after components are in the DOM
  function loadTurnstile() {
    if (document.getElementById('cf-turnstile-script')) return;
    if (!document.querySelector('.cf-turnstile')) return; // no widgets on this page
    var s = document.createElement('script');
    s.id = 'cf-turnstile-script';
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }

  loadComponents().then(function () {
    loadTurnstile();
    initHeaderScroll();
    initMobileNav();
    initActiveNav();
    initScrollReveal();
    initCounters();
    initMarquee();
    initFooterYear();
    initForms();
    initGenericForms();
    initMagneticButtons();
    initMobileDrawer();
    // initEmailPopup(); // Disabled: home screen subscription popup
  });

})();
