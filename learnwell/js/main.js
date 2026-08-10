/* Learnwell: free consultation landing page */
(function () {
  'use strict';

  /* ---- mobile drawer ---- */
  var toggle = document.getElementById('navToggle');
  var drawer = document.getElementById('drawer');

  function closeDrawer() {
    drawer.classList.remove('is-open');
    drawer.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  }

  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      if (open) {
        closeDrawer();
      } else {
        drawer.hidden = false;
        drawer.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeDrawer();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  /* ---- nav shadow on scroll ---- */
  var nav = document.getElementById('nav');
  function onScroll() {
    nav.classList.toggle('is-stuck', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- lead form ----
     Validates client side, then swaps in the confirmation panel.
     Wire the submit handler to the CRM endpoint when it is available. */
  var form = document.getElementById('leadForm');
  var done = document.getElementById('formDone');

  if (form && done) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstBad = null;
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || !el.willValidate) return;
        var wrap = el.closest('.field');
        var ok = el.checkValidity();
        if (wrap) wrap.classList.toggle('is-bad', !ok);
        if (!ok && !firstBad) firstBad = el;
      });

      if (firstBad) {
        firstBad.focus();
        return;
      }

      form.hidden = true;
      done.hidden = false;
      done.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });

    form.addEventListener('input', function (e) {
      var wrap = e.target.closest('.field');
      if (wrap && wrap.classList.contains('is-bad') && e.target.checkValidity()) {
        wrap.classList.remove('is-bad');
      }
    });
  }

  /* ---- newsletter ---- */
  var sub = document.getElementById('subForm');
  var subDone = document.getElementById('subDone');
  if (sub && subDone) {
    sub.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('subEmail');
      if (!email.checkValidity()) {
        email.focus();
        return;
      }
      email.value = '';
      subDone.hidden = false;
    });
  }
})();
