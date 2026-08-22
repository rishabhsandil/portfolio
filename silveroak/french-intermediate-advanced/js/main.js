/* Silver Oak College: French pathway landing page */
(function () {
  'use strict';

  var PHONE = '604-750-4013';

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

  /* ---- demo date window ----
     The control is a native <input type="date">, so the browser supplies the
     calendar. Only the selectable range is set here: today through 90 days out.
     Set in local time, because toISOString() would shift the date west of UTC. */
  var dateField = document.getElementById('demodate');

  function isoDay(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  if (dateField) {
    var today = new Date();
    var latest = new Date();
    latest.setDate(latest.getDate() + 90);
    dateField.min = isoDay(today);
    dateField.max = isoDay(latest);
  }

  /* ---- which page the lead came from ---- */
  var pageField = document.getElementById('pageField');
  if (pageField) pageField.value = window.location.href;

  /* ---- lead form ----
     POSTs to mail.php, which answers { success: bool, message?: string }. */
  var form = document.getElementById('leadForm');
  if (!form) return;

  var feedback = document.getElementById('formFeedback');
  var button = form.querySelector('button[type="submit"]');
  var label = button && (button.querySelector('.btn__label') || button);
  var original = label ? label.textContent : '';

  function say(msg, isError) {
    if (!feedback) return;
    feedback.textContent = msg;
    feedback.hidden = !msg;
    feedback.classList.toggle('is-error', !!isError);
    feedback.classList.toggle('is-success', !!msg && !isError);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    say('');

    // flag the first invalid control rather than relying on the native bubble
    var firstBad = null;
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || !el.willValidate || el.name === 'botcheck') return;
      var wrap = el.closest('.field');
      var ok = el.checkValidity();
      if (wrap) wrap.classList.toggle('is-bad', !ok);
      if (!ok && !firstBad) firstBad = el;
    });

    if (firstBad) {
      firstBad.focus();
      say('Please complete the highlighted fields.', true);
      return;
    }

    if (button) button.disabled = true;
    if (label) label.textContent = 'Sending…';

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    })
      .then(function (r) {
        return r.json().catch(function () { return { success: false }; });
      })
      .then(function (data) {
        if (data.success) {
          // a real page change, so the URL updates and ad platforms can fire a
          // conversion on the confirmation URL rather than on a click
          var to = form.getAttribute('data-redirect');
          if (to) {
            window.location.href = to;
            return;
          }
          form.reset();
          say('Thank you. Your demo class request is in, and our team will be in touch shortly.', false);
        } else {
          say(data.message || 'Sorry, that did not go through. Please try again, or call ' + PHONE + '.', true);
        }
      })
      .catch(function () {
        say('Network error. Please check your connection, or call ' + PHONE + '.', true);
      })
      .finally(function () {
        if (button) button.disabled = false;
        if (label) label.textContent = original;
      });
  });

  form.addEventListener('input', function (e) {
    var wrap = e.target.closest('.field');
    if (wrap && wrap.classList.contains('is-bad') && e.target.checkValidity()) {
      wrap.classList.remove('is-bad');
    }
  });
})();
