// Legal Comfort design preview — shared behaviour. No data leaves the page.
(function () {
  // Header border on scroll
  var header = document.querySelector('.site-header');
  var onScroll = function () { header && header.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Mobile menu
  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('mobile-nav');
  function setMenu(open) {
    if (!btn || !menu) return;
    btn.setAttribute('aria-expanded', String(open));
    btn.querySelector('.label').textContent = open ? 'Close' : 'Menu';
    if (open && header) menu.style.top = Math.max(0, header.getBoundingClientRect().bottom) + 'px';
    menu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { var f = menu.querySelector('a'); f && f.focus(); }
  }
  if (btn) btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true'); });
  if (menu) menu.addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a) return;
    setMenu(false);
    var href = a.getAttribute('href');
    if (href && href.charAt(0) === '#' && href.length > 1) {
      var target = document.getElementById(href.slice(1));
      if (target) {
        e.preventDefault();
        history.pushState(null, '', href);
        requestAnimationFrame(function () {
          target.scrollIntoView({ block: 'start' });
          target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true });
        });
      }
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && btn && btn.getAttribute('aria-expanded') === 'true') { setMenu(false); btn.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 1180) setMenu(false); });

  // Desktop dropdowns: hover/focus via CSS, plus click/tap and Escape via the toggle buttons
  var subs = document.querySelectorAll('.has-sub');
  function closeSubs(except) {
    subs.forEach(function (li) {
      if (li === except) return;
      li.classList.remove('open');
      var b = li.querySelector('.sub-toggle'); b && b.setAttribute('aria-expanded', 'false');
    });
  }
  subs.forEach(function (li) {
    var b = li.querySelector('.sub-toggle');
    if (!b) return;
    b.addEventListener('click', function () {
      var open = !li.classList.contains('open');
      closeSubs(li);
      li.classList.toggle('open', open);
      b.setAttribute('aria-expanded', String(open));
    });
    li.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && li.classList.contains('open')) { closeSubs(); b.focus(); }
    });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.has-sub')) closeSubs(); });

  // Table of contents highlight (inner page)
  var tocLinks = document.querySelectorAll('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.remove('active'); });
          var a = map[en.target.id]; a && a.classList.add('active');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); el && io.observe(el); });
  }

  // Placeholder-style select: grey until a choice is made
  document.querySelectorAll('form.enq select').forEach(function (sel) {
    var sync = function () { sel.classList.toggle('empty', sel.value === ''); };
    sel.addEventListener('change', sync); sync();
  });

  // Enquiry / callback switch: changes which fields are required and their labels
  document.querySelectorAll('form.enq').forEach(function (form) {
    var radios = form.querySelectorAll('input[name="mode"]');
    if (!radios.length) return;
    form.applyMode = function () {
      var cb = form.querySelector('input[name="mode"]:checked').value === 'callback';
      var key = cb ? 'callback' : 'enquiry';
      form.querySelectorAll('[data-enquiry]').forEach(function (el) {
        var v = el.getAttribute('data-' + key);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = v; else el.textContent = v;
      });
      var req = { 'f-email': !cb, 'f-msg': !cb, 'f-phone': cb, 'f-time': cb };
      Object.keys(req).forEach(function (id) {
        var el = document.getElementById(id); if (!el) return;
        el.required = req[id];
        if (!req[id]) { el.removeAttribute('aria-invalid'); var e = document.getElementById(el.getAttribute('aria-describedby').split(' ')[0]); e && e.classList.remove('show'); }
      });
      form.querySelectorAll('.cb-only').forEach(function (el) { el.hidden = !cb; });
    };
    radios.forEach(function (r) { r.addEventListener('change', form.applyMode); });
    form.applyMode();
  });

  // WhatsApp: preview mode until the firm's number is set in build.py
  var toast = document.querySelector('.wa-toast'), toastTimer;
  document.querySelectorAll('[data-wa-demo]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (!toast) return;
      toast.textContent = 'Preview: the WhatsApp number is to come. On the live site this opens WhatsApp with the message "' + a.getAttribute('data-wa-text') + '"';
      clearTimeout(toastTimer); toastTimer = setTimeout(function () { toast.textContent = ''; }, 6000);
    });
  });
  // Desktop QR code (only rendered once a number is set and the QR library is loaded)
  document.querySelectorAll('.wa-qr[data-wa-qr]').forEach(function (box) {
    var url = box.getAttribute('data-wa-qr');
    if (!url || typeof qrcode !== 'function') return;
    var qr = qrcode(0, 'M'); qr.addData(url); qr.make();
    box.querySelector('.qr-box').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  });

  // Demo enquiry form: validates locally, never submits anywhere.
  document.querySelectorAll('form.enq').forEach(function (form) {
    var done = form.parentElement.querySelector('.form-done');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      form.querySelectorAll('[required]').forEach(function (el) {
        var err = document.getElementById(el.getAttribute('aria-describedby').split(' ')[0]);
        var ok = el.value.trim() !== '' && (el.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
        el.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (err && err.classList.contains('err')) err.classList.toggle('show', !ok);
        if (!ok && !firstBad) firstBad = el;
      });
      if (firstBad) { firstBad.focus(); return; }
      form.reset();
      form.querySelectorAll('select').forEach(function (sel) { sel.classList.add('empty'); });
      form.applyMode && form.applyMode();
      form.hidden = true;
      if (done) { done.classList.add('show'); done.focus(); }
    });
    if (done) {
      var again = done.querySelector('button');
      again && again.addEventListener('click', function () {
        done.classList.remove('show'); form.hidden = false; form.querySelector('input').focus();
      });
    }
  });
})();
