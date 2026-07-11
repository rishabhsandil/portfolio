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
    var path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      if (a.getAttribute('href') === path) a.classList.add('active');
    });
  }

  ready(function () {
    loadComponents().then(function () {
      initActiveNav();

      /* ---- Hero headline typewriter (homepage only) ---- */
      var heroType = document.getElementById('heroType');
      if (heroType && !reduce) {
        var typePhrases = ['Medicine.', 'Law.', 'Veterinary.', 'Health and Social Work.', 'High Demand Fields.', 'Canada and Globally.'];
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
        var countryLabels = { canada: 'Canada', australia: 'Australia', uk: 'United Kingdom', ireland: 'Ireland', caribbean: 'Caribbean' };
        var UNI_DATA = {
          'medicine|Oxford': { full: 'University of Oxford', location: 'Oxford, England', blurb: 'One of the world\'s oldest medical schools, built around Oxford\'s hallmark tutorial system and a strong pre-clinical science foundation before clinical training.', programs: [{ name: 'BA Medical Sciences + BM BCh', desc: 'Six-year undergraduate medicine, pre-clinical science followed by clinical training in Oxford\'s teaching hospitals.' }] },
          'medicine|Imperial': { full: 'Imperial College London', location: 'London, England', blurb: 'A research-intensive medical school in the heart of London, known for early clinical exposure and strong links to top NHS teaching hospitals.', programs: [{ name: 'MBBS Medicine', desc: 'Six-year program with an integrated BSc and early patient contact from year one.' }] },
          'medicine|Saba (SUSOM)': { full: 'Saba University School of Medicine (SUSOM)', location: 'Saba, Dutch Caribbean', blurb: 'Founded in 1992 with 3,500+ graduates. Basic science is completed on Saba before clinical rotations in the U.S. and Canada, with a 98% first-time USMLE Step 1 pass rate (2024).', programs: [{ name: '4-Year Doctor of Medicine (MD) Program', desc: 'Ten semesters: basic science on Saba (semesters 1-5), then clinical rotations across North America (semesters 6-10).' }] },
          'medicine|MUA (Nevis)': { full: 'Medical University of the Americas (MUA)', location: 'Nevis, St. Kitts and Nevis', blurb: 'Founded in 1998 with 1,800+ graduates and a 5:1 student-to-faculty ratio; 93% three-year U.S. residency placement rate.', programs: [{ name: '4-Year MD Program', desc: 'Ten-semester Doctor of Medicine program: basic science on Nevis, clinical rotations in the U.S. and Canada.' }, { name: '5-Year & 6-Year BSc/MD Program', desc: 'Accelerated pre-med-to-MD pathways for students who want a foundational science year (or two) before the MD program.' }, { name: 'MBBS to MD Pathway', desc: 'Advanced-standing transfer for MBBS graduates seeking MD-equivalent standing to practice in the U.S. and Canada.' }] },
          'medicine|St. Matthew\'s (SMUSOM)': { full: 'St. Matthew\'s University School of Medicine (SMUSOM)', location: 'Grand Cayman', blurb: 'Established in 1997 with 2,300+ graduates; 100% three-year residency placement rate and 97% first-time USMLE Step 2 CK pass rate (2024).', programs: [{ name: 'MBBS to MD Pathway', desc: 'Direct-entry advanced standing for MBBS graduates: basic science on Grand Cayman, clinical rotations across the U.S. and Canada.' }] },
          'nursing|Sydney': { full: 'University of Sydney', location: 'Sydney, NSW', blurb: 'Clinical placements across major Sydney teaching hospitals with strong pathways into specialty and postgraduate nursing.', programs: [{ name: 'Bachelor of Nursing (Advanced Studies)', desc: 'Combines core nursing training with an extra research or leadership stream.' }] },
          'nursing|Monash': { full: 'Monash University', location: 'Melbourne, VIC', blurb: 'One of Australia\'s largest nursing schools, with simulation-based clinical training and international placement options.', programs: [{ name: 'Bachelor of Nursing', desc: 'Broad clinical placement network across Melbourne\'s major hospital and health networks.' }] },
          'nursing|Griffith': { full: 'Griffith University', location: 'Gold Coast / Brisbane, QLD', blurb: 'Strong focus on practical, placement-heavy training with close ties to Queensland Health facilities.', programs: [{ name: 'Bachelor of Nursing', desc: 'Placement-driven degree with strong graduate employment outcomes in Queensland.' }] },
          'dentistry|Melbourne': { full: 'University of Melbourne', location: 'Melbourne, VIC', blurb: 'A graduate-entry dental program built around Melbourne\'s on-campus clinics, treating real patients from year one of clinical training.', programs: [{ name: 'Doctor of Dental Surgery (DDS)', desc: 'Graduate-entry program combining clinical training with research.' }] },
          'dentistry|Griffith': { full: 'Griffith University', location: 'Gold Coast, QLD', blurb: 'Direct-entry dentistry with hands-on clinical training from second year in Griffith\'s own dental clinics.', programs: [{ name: 'Bachelor of Dental Science', desc: 'Direct school-leaver entry pathway into dentistry.' }] },
          'dentistry|James Cook': { full: 'James Cook University', location: 'Cairns / Townsville, QLD', blurb: 'Focused on training dentists for regional and rural practice, with placements across northern Queensland.', programs: [{ name: 'Bachelor of Dental Surgery', desc: 'Rural- and regional-focused clinical training model.' }] },
          'pharmacy|Monash': { full: 'Monash University', location: 'Melbourne, VIC', blurb: 'Australia\'s largest pharmacy school, with strong ties to hospital and community pharmacy placements.', programs: [{ name: 'Bachelor of Pharmacy (Honours)', desc: 'Four-year honours pathway with extensive placement hours.' }] },
          'pharmacy|UQ': { full: 'University of Queensland', location: 'Brisbane, QLD', blurb: 'Research-strong program with a purpose-built pharmacy practice and simulation centre.', programs: [{ name: 'Bachelor of Pharmacy (Honours)', desc: 'Simulation-based training paired with hospital and community placements.' }] },
          'pharmacy|Griffith': { full: 'Griffith University', location: 'Gold Coast, QLD', blurb: 'Practice-focused degree with placements across Queensland community and hospital pharmacies.', programs: [{ name: 'Bachelor of Pharmacy', desc: 'Practice-oriented curriculum with early placement exposure.' }] },
          'physiotherapy|Sydney': { full: 'University of Sydney', location: 'Sydney, NSW', blurb: 'One of the oldest physiotherapy schools in Australia, with placements across major Sydney hospitals and clinics.', programs: [{ name: 'Master of Physiotherapy', desc: 'Graduate-entry pathway with broad clinical placement exposure.' }] },
          'physiotherapy|Bond': { full: 'Bond University', location: 'Gold Coast, QLD', blurb: 'Accelerated, small-cohort program with three intakes a year and hands-on clinical training from the first semester.', programs: [{ name: 'Doctor of Physiotherapy', desc: 'Accelerated, small-class format with three annual intakes.' }] },
          'physiotherapy|Melbourne': { full: 'University of Melbourne', location: 'Melbourne, VIC', blurb: 'Graduate-entry program with a strong research base and placements across Victoria\'s major health networks.', programs: [{ name: 'Doctor of Physiotherapy', desc: 'Research-driven graduate program with statewide clinical placements.' }] },
          'veterinary-science|Sydney': { full: 'University of Sydney', location: 'Camden / Sydney, NSW', blurb: 'Australia\'s oldest vet school, with its own teaching hospital and farm for large- and small-animal clinical training.', programs: [{ name: 'Doctor of Veterinary Medicine (DVM)', desc: 'Graduate-entry program with hospital and farm-based clinical training.' }] },
          'veterinary-science|Melbourne': { full: 'University of Melbourne', location: 'Melbourne, VIC', blurb: 'A graduate-entry program built around U-Vet\'s teaching hospitals in Werribee and the CBD.', programs: [{ name: 'Doctor of Veterinary Medicine (DVM)', desc: 'Clinical training across two dedicated teaching hospitals.' }] },
          'veterinary-science|St. Matthew\'s (SMUSVM)': { full: 'St. Matthew\'s University School of Veterinary Medicine (SMUSVM)', location: 'Grand Cayman', blurb: 'Founded in 2005 with 450+ DVM graduates. Listed with the AVMA and a Provisional Member of AAVMC, with up to $65,000 USD in scholarships available.', programs: [{ name: 'Doctor of Veterinary Medicine (DVM) Program', desc: 'Ten semesters: seven on Grand Cayman, then clinical rotations at affiliated schools in the U.S., Canada or the U.K.' }, { name: 'Pre-Veterinary Master\'s & Gateway Programs', desc: 'Pathway options for students who need extra science preparation before starting the DVM program, on-campus or online.' }] },
          'ai-computer-science|Waterloo': { full: 'University of Waterloo', location: 'Waterloo, ON', blurb: 'Canada\'s top-ranked co-op program, students alternate study terms with paid industry placements at leading tech companies.', programs: [{ name: 'Bachelor of Computer Science, AI specialization', desc: 'Mandatory co-op terms build real industry experience alongside coursework.' }] },
          'ai-computer-science|Toronto': { full: 'University of Toronto', location: 'Toronto, ON', blurb: 'Home to some of the world\'s leading AI researchers, with direct ties to Toronto\'s Vector Institute.', programs: [{ name: 'BSc Computer Science, AI focus', desc: 'Research-heavy stream with access to Vector Institute collaborations.' }] },
          'ai-computer-science|UCC': { full: 'University College Cork', location: 'Cork, Ireland', blurb: 'A dedicated AI stream inside UCC\'s computer science degree, with strong links to Cork\'s growing tech sector.', programs: [{ name: 'BSc Computer Science (Artificial Intelligence)', desc: 'AI-focused stream with a paid industry placement year.' }] },
          'software-engineering|Waterloo': { full: 'University of Waterloo', location: 'Waterloo, ON', blurb: 'A joint Math/Engineering program with mandatory co-op, one of the most sought-after software degrees in North America.', programs: [{ name: 'Bachelor of Software Engineering', desc: 'Combines math and engineering fundamentals with six co-op work terms.' }] },
          'software-engineering|Toronto': { full: 'University of Toronto', location: 'Toronto, ON', blurb: 'Rigorous, engineering-accredited software program with options to specialize in AI, systems or security.', programs: [{ name: 'BASc Software Engineering', desc: 'Engineering-accredited degree with late-stage specialization options.' }] },
          'software-engineering|UBC': { full: 'University of British Columbia', location: 'Vancouver, BC', blurb: 'A small, closely-mentored cohort combining computer science and engineering fundamentals, based in Vancouver.', programs: [{ name: 'BASc Software Engineering', desc: 'Small-cohort program blending CS theory with engineering design.' }] },
          'data-analytics|Limerick': { full: 'University of Limerick', location: 'Limerick, Ireland', blurb: 'Strong industry placement year built into the degree, with close ties to Limerick\'s tech and finance employers.', programs: [{ name: 'BSc Data Analytics', desc: 'Includes a paid industry placement year.' }] },
          'data-analytics|UCC': { full: 'University College Cork', location: 'Cork, Ireland', blurb: 'Combines statistics, computing and business analytics with real-world project work.', programs: [{ name: 'BSc Data Science and Analytics', desc: 'Project-based curriculum spanning statistics, computing and business analytics.' }] },
          'data-analytics|MTU': { full: 'Munster Technological University', location: 'Cork, Ireland', blurb: 'Practically oriented program with a strong emphasis on tools and workplace-ready analytics skills.', programs: [{ name: 'BSc Data Science', desc: 'Applied, tools-first approach to data science training.' }] },
          'cybersecurity|Waterloo': { full: 'University of Waterloo', location: 'Waterloo, ON', blurb: 'Co-op placements with major Canadian financial institutions and tech security teams.', programs: [{ name: 'BCS, Cybersecurity option', desc: 'Security-focused coursework paired with co-op work terms.' }] },
          'cybersecurity|Toronto': { full: 'University of Toronto', location: 'Toronto, ON', blurb: 'Strong theoretical foundation in cryptography and systems security paired with applied coursework.', programs: [{ name: 'BSc Computer Science, Cybersecurity specialization', desc: 'Balances cryptography theory with applied systems security.' }] },
          'cybersecurity|Calgary': { full: 'University of Calgary', location: 'Calgary, AB', blurb: 'Growing security program with ties to Calgary\'s energy-sector cybersecurity employers.', programs: [{ name: 'BSc Computer Science (Cybersecurity)', desc: 'Coursework aligned with energy-sector and industrial security employers.' }] },
          'engineering|Waterloo': { full: 'University of Waterloo', location: 'Waterloo, ON', blurb: 'Canada\'s largest co-op engineering program, alternating study and paid work terms.', programs: [{ name: 'Bachelor of Engineering (multiple disciplines)', desc: 'Choice of discipline with six paid co-op work terms.' }] },
          'engineering|Toronto': { full: 'University of Toronto', location: 'Toronto, ON', blurb: 'One of Canada\'s top-ranked engineering faculties, with broad discipline choice after a shared first year.', programs: [{ name: 'BASc Engineering', desc: 'Shared first year, then choice of engineering discipline.' }] },
          'engineering|UBC': { full: 'University of British Columbia', location: 'Vancouver, BC', blurb: 'Strong industry and research ties, with a shared first-year before choosing a specialization.', programs: [{ name: 'BASc Engineering', desc: 'Shared foundation year followed by discipline specialization.' }] },
          'biotechnology|UCC': { full: 'University College Cork', location: 'Cork, Ireland', blurb: 'Hands-on lab training with links to Cork\'s cluster of pharmaceutical and biotech employers.', programs: [{ name: 'BSc Biotechnology', desc: 'Lab-based degree with strong pharma and biotech industry links.' }] },
          'biotechnology|Limerick': { full: 'University of Limerick', location: 'Limerick, Ireland', blurb: 'Includes a paid industry placement year with Ireland\'s biopharma sector.', programs: [{ name: 'BSc Biological & Pharmaceutical Chemistry', desc: 'Combines chemistry and biology with a biopharma placement year.' }] },
          'biotechnology|ATU': { full: 'Atlantic Technological University', location: 'Galway, Ireland', blurb: 'Practically focused program with strong lab-based, workplace-ready skills training.', programs: [{ name: 'BSc Applied Biotechnology', desc: 'Applied, lab-heavy curriculum focused on workplace readiness.' }] },
          'business|LSE': { full: 'London School of Economics (LSE)', location: 'London, England', blurb: 'A globally ranked business degree combining rigorous economics and management theory in central London.', programs: [{ name: 'BSc Management', desc: 'Economics-grounded management degree in central London.' }] },
          'business|Warwick': { full: 'University of Warwick', location: 'Coventry, England', blurb: 'Top-ranked Warwick Business School, known for strong employer links and consistently high graduate outcomes.', programs: [{ name: 'BSc Management', desc: 'Strong employer partnerships and placement-year options.' }] },
          'business|Manchester': { full: 'University of Manchester', location: 'Manchester, England', blurb: 'One of the UK\'s largest business schools, with flexible specializations across marketing, finance and strategy.', programs: [{ name: 'BSc Management', desc: 'Flexible specialization across marketing, finance and strategy.' }] },
          'finance|LSE': { full: 'London School of Economics (LSE)', location: 'London, England', blurb: 'One of the most competitive finance degrees globally, feeding directly into London\'s banking and consulting sectors.', programs: [{ name: 'BSc Finance', desc: 'Highly selective program with direct pipelines into London finance.' }] },
          'finance|Imperial': { full: 'Imperial College London', location: 'London, England', blurb: 'Combines finance theory with quantitative and data science skills, based at Imperial Business School.', programs: [{ name: 'BSc Economics, Finance and Data Science', desc: 'Blends finance theory with quantitative and data science training.' }] },
          'finance|UCC': { full: 'University College Cork', location: 'Cork, Ireland', blurb: 'Accredited pathway toward professional qualifications like the CFA, with strong local placement links.', programs: [{ name: 'BSc Finance', desc: 'Accredited pathway toward CFA and other professional qualifications.' }] },
          'law|Oxford': { full: 'University of Oxford', location: 'Oxford, England', blurb: 'One of the most respected law degrees in the world, built on Oxford\'s tutorial teaching model.', programs: [{ name: 'BA Jurisprudence (Law)', desc: 'Tutorial-based teaching model with globally recognized standing.' }] },
          'law|LSE': { full: 'London School of Economics (LSE)', location: 'London, England', blurb: 'A rigorous, research-led law degree in the heart of London with strong links to top UK firms.', programs: [{ name: 'LLB Laws', desc: 'Research-led law degree with strong City-firm placement links.' }] },
          'law|UCC': { full: 'University College Cork', location: 'Cork, Ireland', blurb: 'A well-established law degree with a strong reputation among Irish and EU legal employers.', programs: [{ name: 'BCL (Bachelor of Civil Law)', desc: 'Well-regarded among Irish and EU legal employers.' }] },
          'hospitality|Griffith': { full: 'Griffith University', location: 'Gold Coast, QLD', blurb: 'Practical, industry-linked program on the Gold Coast, one of Australia\'s biggest tourism hubs.', programs: [{ name: 'Bachelor of International Tourism and Hotel Management', desc: 'Industry placements across the Gold Coast\'s tourism sector.' }] },
          'hospitality|Bond': { full: 'Bond University', location: 'Gold Coast, QLD', blurb: 'Accelerated degree with guaranteed industry placements and small class sizes.', programs: [{ name: 'Bachelor of Hotel Management', desc: 'Accelerated, small-cohort format with guaranteed placements.' }] },
          'hospitality|UQ': { full: 'University of Queensland', location: 'Brisbane, QLD', blurb: 'Strong academic grounding paired with practical industry placement opportunities.', programs: [{ name: 'Bachelor of Business Management (Tourism, Hotel and Event Management)', desc: 'Business fundamentals combined with tourism and event management practice.' }] },
          'environmental-science|UQ': { full: 'University of Queensland', location: 'Brisbane, QLD', blurb: 'Broad science foundation with fieldwork opportunities across Queensland\'s diverse ecosystems.', programs: [{ name: 'Bachelor of Environmental Science', desc: 'Fieldwork across Queensland\'s reef, rainforest and outback ecosystems.' }] },
          'environmental-science|James Cook': { full: 'James Cook University', location: 'Cairns / Townsville, QLD', blurb: 'Based near the Great Barrier Reef and Wet Tropics, with a strong tropical ecology and conservation focus.', programs: [{ name: 'Bachelor of Environmental Science', desc: 'Tropical ecology and reef conservation focus.' }] },
          'environmental-science|UBC': { full: 'University of British Columbia', location: 'Vancouver, BC', blurb: 'Strong fieldwork and research opportunities across British Columbia\'s coast and forests.', programs: [{ name: 'BSc Environmental Sciences', desc: 'Fieldwork across BC\'s coastal and forest ecosystems.' }] },
          'agriculture|UCD': { full: 'University College Dublin', location: 'Dublin, Ireland', blurb: 'Ireland\'s leading agricultural science degree, with strong ties to the country\'s farming and agri-food sector.', programs: [{ name: 'BAgrSc (Agricultural Science)', desc: 'Strong ties to Ireland\'s farming and agri-food industry.' }] },
          'agriculture|UQ': { full: 'University of Queensland', location: 'Brisbane, QLD', blurb: 'Strong research base with practical placements across Queensland\'s agriculture industry.', programs: [{ name: 'Bachelor of Agricultural Science', desc: 'Research-driven degree with industry placement options.' }] },
          'agriculture|Guelph': { full: 'University of Guelph', location: 'Guelph, ON', blurb: 'Canada\'s leading agricultural university, with extensive research farms and strong industry placement links.', programs: [{ name: 'Bachelor of Bio-Resource Management / Agriculture', desc: 'Hands-on training across Guelph\'s research farms.' }] }
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
                alert((res && res.message) || 'Sorry, we could not send your message. Please call +1 (604) 316-8015 or email info@aspirecareers.ca.');
              }
            })
            .catch(function () {
              if (btn) { btn.disabled = false; btn.style.opacity = ''; btn.innerHTML = btnText; }
              alert('Network error, please email info@aspirecareers.ca or call +1 (604) 316-8015.');
            });
        });
      });
    });
  });
})();
