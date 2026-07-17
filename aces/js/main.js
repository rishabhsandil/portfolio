/* Aspire — interactions. Native scrolling (no smooth-scroll library).
   Reveals are fail-safe: if anything goes wrong, content is shown. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ---- Component loader (notice/header/footer injected via fetch, shared across pages) ---- */
  function loadComponents() {
    var includes = [].slice.call(document.querySelectorAll('[data-include]'));
    if (!includes.length) return Promise.resolve();
    return Promise.all(includes.map(function (el) {
      var src = el.getAttribute('data-include');
      return fetch(src)
        .then(function (r) { return r.text(); })
        .then(function (html) { el.outerHTML = html; })
        .catch(function (err) { console.warn('[components] Failed to load:', src, err); });
    })).then(loadComponents); // recurse in case an included fragment itself has [data-include]
  }

  /* ---- Active nav link (header is shared markup, so mark the current page via JS) ---- */
  function initActiveNav() {
    var path = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href === path || (!path && href === '/')) a.classList.add('active');
    });
  }

  ready(function () {
    loadComponents().then(function () {
      initActiveNav();

      /* ---- Hero headline typewriter (homepage only) ---- */
      var heroType = document.getElementById('heroType');
      if (heroType && !reduce) {
        var typePhrases = ['Medicine.', 'Veterinary Medicine.', 'Law.'];
        // Reserve enough height for the tallest wrapped state across every phrase
        // (including the brief empty pause between words) so the line count never
        // changes and the rest of the hero doesn't jump as text types/deletes.
        var heroTypeH1 = heroType.closest('h1');
        function reserveHeroTypeHeight() {
          if (!heroTypeH1) return;
          var currentText = heroType.textContent;
          heroTypeH1.style.minHeight = '';
          var maxH = 0;
          [''].concat(typePhrases).forEach(function (p) {
            heroType.textContent = p;
            maxH = Math.max(maxH, heroTypeH1.offsetHeight);
          });
          heroType.textContent = currentText;
          heroTypeH1.style.minHeight = maxH + 'px';
        }
        reserveHeroTypeHeight();
        var heroTypeResizeTimer;
        window.addEventListener('resize', function () {
          clearTimeout(heroTypeResizeTimer);
          heroTypeResizeTimer = setTimeout(reserveHeroTypeHeight, 150);
        });
        var typeIndex = 0;
        var charIndex = typePhrases[0].length; // markup already shows the first phrase fully typed
        var isDeleting = true;
        var TYPE_MS = 115, DELETE_MS = 60, PAUSE_FULL_MS = 2600, PAUSE_EMPTY_MS = 500;
        function typeTick() {
          var word = typePhrases[typeIndex];
          if (isDeleting) {
            charIndex--;
            heroType.textContent = word.slice(0, charIndex);
            if (charIndex <= 0) {
              isDeleting = false;
              typeIndex = (typeIndex + 1) % typePhrases.length;
              setTimeout(typeTick, PAUSE_EMPTY_MS);
            } else {
              setTimeout(typeTick, DELETE_MS);
            }
          } else {
            var next = typePhrases[typeIndex];
            charIndex++;
            heroType.textContent = next.slice(0, charIndex);
            if (charIndex >= next.length) {
              isDeleting = true;
              setTimeout(typeTick, PAUSE_FULL_MS);
            } else {
              setTimeout(typeTick, TYPE_MS);
            }
          }
        }
        // markup already shows "Globally." fully typed — hold it on screen before the
        // first deletion starts, instead of deleting immediately on page load
        setTimeout(typeTick, PAUSE_FULL_MS);
      }

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
          // the Programs mega-menu trigger toggles its panel on mobile instead of
          // closing the whole menu — handled separately below
          if (a.parentElement.classList.contains('has-mega')) return;
          a.addEventListener('click', function () {
            links.classList.remove('open');
            toggle.classList.remove('open');
            if (nav) nav.classList.remove('menu-open');
            document.body.style.overflow = '';
          });
        });
      }

      /* ---- Programs mega-menu ----
         Panel itself: hover on desktop (pure CSS), tap-to-toggle on mobile (JS below).
         Fields → Countries: click-to-expand accordion, same on every device — clicking
         a field name reveals its countries; clicking a country navigates to the result. */
      var megaTrigger = document.querySelector('.nav-item.has-mega > a');
      var megaItem = megaTrigger ? megaTrigger.parentElement : null;
      if (megaTrigger && megaItem) {
        megaTrigger.addEventListener('click', function (e) {
          if (window.innerWidth <= 900) {
            e.preventDefault();
            megaItem.classList.toggle('mega-open');
          }
        });
      }
      document.querySelectorAll('.mega-field-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var field = btn.parentElement;
          var wasOpen = field.classList.contains('field-open');
          document.querySelectorAll('.mega-field.field-open').forEach(function (f) { f.classList.remove('field-open'); });
          if (!wasOpen) field.classList.add('field-open');
        });
      });

      /* ---- Important-notice modal (once per browser session) ---- */
      var notice = document.getElementById('notice');
      if (notice) {
        var noticeKey = 'aspire-notice-dismissed';
        var seen = false;
        try { seen = sessionStorage.getItem(noticeKey) === '1'; } catch (e) {}
        var lastFocus = null;
        function closeNotice() {
          notice.classList.remove('open');
          document.body.style.overflow = '';
          try { sessionStorage.setItem(noticeKey, '1'); } catch (e) {}
          document.removeEventListener('keydown', onNoticeKey);
          setTimeout(function () { notice.hidden = true; }, 360);
          if (lastFocus && lastFocus.focus) lastFocus.focus();
        }
        function onNoticeKey(e) { if (e.key === 'Escape') closeNotice(); }
        function openNotice() {
          lastFocus = document.activeElement;
          notice.hidden = false;
          // force reflow so the transition runs from the hidden state
          void notice.offsetWidth;
          notice.classList.add('open');
          document.body.style.overflow = 'hidden';
          document.addEventListener('keydown', onNoticeKey);
          var focusBtn = notice.querySelector('.notice-actions .btn') || notice.querySelector('.notice-close');
          if (focusBtn) focusBtn.focus();
        }
        notice.querySelectorAll('[data-notice-close]').forEach(function (el) {
          el.addEventListener('click', closeNotice);
        });
        if (!seen) setTimeout(openNotice, 500);
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

      /* ---- Tabs / track toggle ---- */
      document.querySelectorAll('[data-tabs]').forEach(function (group) {
        var tabs = group.querySelectorAll('.tab');
        var panels = group.querySelectorAll('[data-panel]');
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

        /* Deep-link from the Programs mega-menu: ?field=medicine&country=uk
           builds a direct "your match" view — field name, country, and a card
           per college tagged to that specific country (not the field's full,
           mixed-country list), each listing the programs it runs with a brief
           description. Keyed "field|shortName" against the pill text used in
           .fx-unis so every combination can carry its own program details. */
        var countryLabels = { uk: 'United Kingdom', caribbean: 'Caribbean' };
        var UNI_DATA = {
          'medicine|Saba (SUSOM)': { full: 'Saba University School of Medicine (SUSOM)', location: 'Saba, Dutch Caribbean', blurb: 'Founded in 1992 with 3,500+ graduates. Basic science is completed on Saba before clinical rotations in the U.S. and Canada, with a 98% first-time USMLE Step 1 pass rate (2024).', programs: [{ name: '4-Year Doctor of Medicine (MD) Program', desc: 'Ten semesters: basic science on Saba (semesters 1-5), then clinical rotations across North America (semesters 6-10).' }] },
          'medicine|MUA (Nevis)': { full: 'Medical University of the Americas (MUA)', location: 'Nevis, St. Kitts and Nevis', blurb: 'Founded in 1998 with 1,800+ graduates and a 5:1 student-to-faculty ratio; 93% three-year U.S. residency placement rate.', programs: [{ name: '4-Year MD Program', desc: 'Ten-semester Doctor of Medicine program: basic science on Nevis, clinical rotations in the U.S. and Canada.' }, { name: '5-Year & 6-Year BSc/MD Program', desc: 'Accelerated pre-med-to-MD pathways for students who want a foundational science year (or two) before the MD program.' }, { name: 'MBBS to MD Pathway', desc: 'Advanced-standing transfer for MBBS graduates seeking MD-equivalent standing to practice in the U.S. and Canada.' }] },
          'medicine|St. Matthew\'s (SMUSOM)': { full: 'St. Matthew\'s University School of Medicine (SMUSOM)', location: 'Grand Cayman', blurb: 'Established in 1997 with 2,300+ graduates; 100% three-year residency placement rate and 97% first-time USMLE Step 2 CK pass rate (2024).', programs: [{ name: 'MBBS to MD Pathway', desc: 'Direct-entry advanced standing for MBBS graduates: basic science on Grand Cayman, clinical rotations across the U.S. and Canada.' }] },
          'veterinary-science|St. Matthew\'s (SMUSVM)': { full: 'St. Matthew\'s University School of Veterinary Medicine (SMUSVM)', location: 'Grand Cayman', blurb: 'Founded in 2005 with 450+ DVM graduates. Listed with the AVMA and a Provisional Member of AAVMC, with up to $65,000 USD in scholarships available.', programs: [{ name: 'Doctor of Veterinary Medicine (DVM) Program', desc: 'Ten semesters: seven on Grand Cayman, then clinical rotations at affiliated schools in the U.S., Canada or the U.K.' }, { name: 'Pre-Veterinary Master\'s & Gateway Programs', desc: 'Pathway options for students who need extra science preparation before starting the DVM program, on-campus or online.' }] },
          'law|The University of Law': { full: 'The University of Law', location: 'England, United Kingdom', blurb: 'One of the UK\'s leading specialist providers of legal education, with campuses across England and a strong focus on preparing students for professional legal careers.', programs: [{ name: 'Law programs — details coming soon', desc: '' }] }
        };
        var deepParams = new URLSearchParams(window.location.search);
        var deepCountry = deepParams.get('country');
        var deepField = deepParams.get('field');
        var result = document.getElementById('fieldResult');
        if (result && deepField && deepCountry) {
          var deepCard = fxGrid.querySelector('.fx-card[data-field="' + deepField + '"]');
          if (deepCard) {
            var colleges = deepCard.querySelectorAll('.fx-unis span[data-country="' + deepCountry + '"]');
            if (colleges.length) {
              document.getElementById('frField').textContent = deepCard.querySelector('h3').textContent;
              document.getElementById('frCountry').textContent = countryLabels[deepCountry] || deepCountry;
              var list = document.getElementById('frList');
              list.innerHTML = '';
              colleges.forEach(function (c) {
                var card = document.createElement('article');
                card.className = 'uni-card';
                var info = UNI_DATA[deepField + '|' + c.textContent];
                if (info) {
                  var progs = info.programs.map(function (p) {
                    return '<li><span class="prog-name">' + p.name + '</span><span class="prog-desc">' + p.desc + '</span></li>';
                  }).join('');
                  card.innerHTML =
                    '<div class="uni-card-head"><h3>' + info.full + '</h3><span class="uni-loc">' + info.location + '</span></div>' +
                    '<p class="uni-blurb">' + info.blurb + '</p>' +
                    '<ul class="uni-programs">' + progs + '</ul>';
                } else {
                  card.innerHTML =
                    '<div class="uni-card-head"><h3>' + c.textContent + '</h3></div>' +
                    '<p class="uni-blurb">Ask your advisor about program options and requirements here.</p>';
                }
                list.appendChild(card);
              });
              result.hidden = false;
              requestAnimationFrame(function () { result.classList.add('is-visible'); });
              setTimeout(function () {
                result.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
              }, 150);
            }
          }
        }
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
                alert((res && res.message) || 'Sorry, we could not send your message. Please call +1 (604) 316-8015 or email info@acesglobal.ca.');
              }
            })
            .catch(function () {
              if (btn) { btn.disabled = false; btn.style.opacity = ''; btn.innerHTML = btnText; }
              alert('Network error, please email info@acesglobal.ca or call +1 (604) 316-8015.');
            });
        });
      });
    });
  });
})();
