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
  window.addEventListener('resize', function () { if (window.innerWidth > 980) setMenu(false); });

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
