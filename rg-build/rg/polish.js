/* Site-wide polish: page transitions, scroll progress, counters, heading and image reveals, hero parallax. */
(function () {
  var d = document, html = d.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  html.classList.add('pz-on');

  // scroll progress
  var bar = d.createElement('div'); bar.className = 'pz-bar'; d.body.appendChild(bar);
  function prog() { var h = d.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')'; }
  addEventListener('scroll', prog, { passive: true }); prog();

  // page transitions between internal pages (fade in is pure CSS; this fades out)
  if (!reduce) {
    d.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target && a.target !== '_self') return; if (a.hasAttribute('download')) return;
      var u = new URL(a.href, location.href);
      if (u.origin !== location.origin || /\.(pdf|png|jpe?g|webp|mp4|zip)$/i.test(u.pathname)) return;
      if (u.pathname === location.pathname) return;
      e.preventDefault(); html.classList.add('pz-out'); setTimeout(function () { location.href = a.href; }, 220);
    });
    addEventListener('pageshow', function (e) { if (e.persisted) html.classList.remove('pz-out'); });
  }

  // reveals: headings and images
  var heads = d.querySelectorAll('.sec .h2, .sec-head .lead, .x-sheet-h, .cs-h, .mx-h');
  var imgs = d.querySelectorAll('.x-sc-ph img, .pl-ph img, .hcs-ph img, .x-sheet-ph img, .x-step-ph img, .cs-ph img, .row .ph img, .band img');
  heads.forEach(function (h) { h.classList.add('pz-h'); });
  imgs.forEach(function (i) { i.classList.add('pz-i'); });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('pz-v'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    heads.forEach(function (h) { io.observe(h); }); imgs.forEach(function (i) { io.observe(i); });
  } else { heads.forEach(function (h) { h.classList.add('pz-v'); }); imgs.forEach(function (i) { i.classList.add('pz-v'); }); }

  // counters: big figures count up the first time they are seen
  var nums = d.querySelectorAll('.cs-n b, .nx-i b:not([data-count]), .hcs b, .csx-tv, .stat b, .wte-c b');
  function parse(node) { var tn = null; node.childNodes.forEach(function (c) { if (!tn && c.nodeType === 3 && /\d/.test(c.textContent)) tn = c; }); if (!tn) return null;
    var m = /^(\D*?)(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(.*)$/.exec(tn.textContent); if (!m) return null; var v = parseFloat(m[2].replace(/,/g, '')); if (!isFinite(v) || v < 5) return null;
    return { tn: tn, pre: m[1], v: v, post: m[3], comma: m[2].indexOf(',') > -1, dec: (m[2].split('.')[1] || '').length }; }
  function fmt(x, p) { var s = p.dec ? x.toFixed(p.dec) : Math.round(x).toString(); if (p.comma) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); return p.pre + s + p.post; }
  if ('IntersectionObserver' in window && !reduce) {
    var nio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (!en.isIntersecting) return; nio.unobserve(en.target); var p = en.target._pz; if (!p) return;
      var t0 = null; function f(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 1300), e = 1 - Math.pow(1 - k, 3); p.tn.textContent = fmt(p.v * e, p); if (k < 1) requestAnimationFrame(f); else p.tn.textContent = fmt(p.v, p); }
      requestAnimationFrame(f); }); }, { threshold: 0.4 });
    nums.forEach(function (n) { var p = parse(n); if (p) { n._pz = p; p.tn.textContent = fmt(0, p); nio.observe(n); } });
  }

  // gentle parallax on page-hero photos
  var ph = d.querySelector('.hero:not(.home) .photo');
  if (ph && !reduce) { var tick = false; addEventListener('scroll', function () { if (tick) return; tick = true; requestAnimationFrame(function () { var y = Math.min(scrollY, innerHeight); ph.style.transform = 'translate3d(0,' + (y * 0.22) + 'px,0) scale(' + (1.04 + y * 0.00006) + ')'; tick = false; }); }, { passive: true }); }
})();
