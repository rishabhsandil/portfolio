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

  /* ---- record which pathway card sent them to the form ----
     Saves asking it as a visible question. */
  var pathwayField = document.getElementById('pathwayField');
  document.querySelectorAll('[data-pathway]').forEach(function (cta) {
    cta.addEventListener('click', function () {
      if (pathwayField) pathwayField.value = cta.getAttribute('data-pathway');
    });
  });

  var pageField = document.getElementById('pageField');
  if (pageField) pageField.value = window.location.href;

  /* ---- forms ----
     POST to mail.php, which answers { success: bool, message?: string }. */
  function wireForm(form, opts) {
    if (!form) return;

    var feedback = document.getElementById(opts.feedbackId);
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
        var wrap = el.closest('.field') || el.closest('.consent');
        var ok = el.checkValidity();
        if (wrap) wrap.classList.toggle('is-bad', !ok);
        if (!ok && !firstBad) firstBad = el;
      });

      if (firstBad) {
        firstBad.focus();
        say(opts.invalidMsg, true);
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
            form.reset();
            say(opts.successMsg, false);
          } else {
            say(data.message || opts.errorMsg, true);
          }
        })
        .catch(function () {
          say('Network error. Please check your connection, or call 604-906-0006.', true);
        })
        .finally(function () {
          if (button) button.disabled = false;
          if (label) label.textContent = original;
        });
    });

    form.addEventListener('input', function (e) {
      var wrap = e.target.closest('.field') || e.target.closest('.consent');
      if (wrap && wrap.classList.contains('is-bad') && e.target.checkValidity()) {
        wrap.classList.remove('is-bad');
      }
    });
  }

  wireForm(document.getElementById('leadForm'), {
    feedbackId: 'formFeedback',
    invalidMsg: 'Please complete the highlighted fields.',
    successMsg: 'Thank you. Your request is in, and an advisor will be in touch within 24 hours.',
    errorMsg: 'Sorry, that did not go through. Please try again, or call 604-906-0006.'
  });

  wireForm(document.getElementById('subForm'), {
    feedbackId: 'subDone',
    invalidMsg: 'Please enter a valid email address.',
    successMsg: 'Merci. The checklist is on its way to your inbox.',
    errorMsg: 'Sorry, that did not go through. Please try again.'
  });
})();
