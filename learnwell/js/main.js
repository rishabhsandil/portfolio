/* Learnwell: free consultation landing page
   The lead form and the newsletter form are the institute's own LeadConnector
   (GoHighLevel) embeds, the same two forms learnwellinstitute.ca uses. They are
   cross-origin iframes: submission, validation and Cloudflare Turnstile are all
   handled inside them by link.msgsndr.com/js/form_embed.js, so there is nothing
   for this file to do. Fields are edited in the client's GoHighLevel account. */
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
})();
