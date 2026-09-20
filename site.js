(function () {
  'use strict';

  /* ---------- mobile nav ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.textContent = open ? '✕' : '☰';
    });
  }

  /* ---------- enquiry forms: compose a pre-filled email ---------- */
  var TO = 'info@timbercycle.com.au';
  document.querySelectorAll('form[data-mailto]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var lines = [];
      form.querySelectorAll('input, select, textarea').forEach(function (f) {
        if (!f.name || !f.value) return;
        var lbl = form.querySelector('label[for="' + f.id + '"]');
        lines.push((lbl ? lbl.textContent.trim() : f.name) + ': ' + f.value);
      });
      var subject = form.getAttribute('data-subject') || 'Timbercycle enquiry';
      window.location.href = 'mailto:' + TO +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\n') + '\n');
      var msg = form.querySelector('.form-msg');
      if (msg) { msg.classList.add('show'); }
    });
  });

  /* ---------- pallet program calculator ---------- */
  var calc = document.getElementById('calc');
  if (!calc) return;

  var el = function (id) { return document.getElementById(id); };
  var n0 = function (v) { return Math.round(v).toLocaleString('en-AU'); };
  var n1 = function (v) {
    return v.toLocaleString('en-AU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };

  var fields = ['ppw', 'ppw-n', 'pct', 'sites', 'kg', 'tpl', 'dens'];

  /* keep the slider and the exact-figure box in step */
  var slider = el('ppw'), box = el('ppw-n');
  if (slider && box) {
    slider.addEventListener('input', function () { box.value = slider.value; });
    box.addEventListener('input', function () {
      var v = parseFloat(box.value) || 0;
      slider.value = Math.min(Math.max(v, slider.min), slider.max);
    });
  }
  var out = {};

  function read(id) { return parseFloat(el(id).value) || 0; }

  function run() {
    var ppw = parseFloat((box && box.value) || 0) || read('ppw');
    var pct = read('pct'), sites = read('sites');
    var kg = read('kg'), tpl = read('tpl') || 20, dens = read('dens') || 250;

    var perYear = ppw * 52 * Math.max(sites, 1);
    var tonnes = perYear * kg / 1000;
    var reuse = perYear * pct / 100;
    var shred = perYear - reuse;
    var shredT = shred * kg / 1000;
    var loads = tonnes / tpl;
    var cubic = shredT * 1000 / dens;          // m3 of mulch
    var area = cubic / 0.075;                   // m2 covered at 75mm
    var ovals = area / 18000;                   // ~MCG-sized playing surface

    el('o-pallets').textContent = n0(perYear);
    el('o-tonnes').textContent = n0(tonnes);
    el('o-reuse').textContent = n0(reuse);
    el('o-shred').textContent = n0(shredT);
    el('o-loads').textContent = n0(loads);

    var rp = perYear ? (reuse / perYear) * 100 : 0;
    var segR = el('seg-reuse'), segS = el('seg-shred');
    segR.style.width = rp + '%';
    segS.style.width = (100 - rp) + '%';
    segR.textContent = rp >= 14 ? Math.round(rp) + '% reused' : '';
    segS.textContent = (100 - rp) >= 14 ? Math.round(100 - rp) + '% recycled' : '';

    el('o-scale').textContent = ovals >= 0.95
      ? n1(ovals) + (ovals < 1.95 ? ' football oval' : ' football ovals')
      : n0(area) + ' m²';
    el('o-scale-tail').textContent = ovals >= 0.95
      ? 'covered in mulch, 75 mm deep, every year.'
      : 'of ground covered in mulch, 75 mm deep, every year.';

    var bl = el('calc-build');
    if (bl) bl.href = 'program-builder.html?ppw=' + Math.round(ppw) + '&sites=' + Math.max(sites, 1) + '&pct=' + Math.round(pct);
    el('v-ppw').textContent = n0(ppw);
    el('v-pct').textContent = Math.round(pct) + '%';
    el('v-sites').textContent = n0(Math.max(sites, 1));

    out = {
      perYear: perYear, tonnes: tonnes, reuse: reuse, shredT: shredT,
      loads: loads, ppw: ppw, pct: pct, sites: sites, kg: kg
    };
  }

  fields.forEach(function (id) {
    var f = el(id);
    if (f) { f.addEventListener('input', run); f.addEventListener('change', run); }
  });
  run();

  function summary() {
    return [
      'PALLET PROGRAM ESTIMATE',
      '',
      'Pallets per week (per site): ' + n0(out.ppw),
      'Sites: ' + n0(Math.max(out.sites, 1)),
      'Estimated reusable share: ' + Math.round(out.pct) + '%',
      'Assumed average pallet weight: ' + out.kg + ' kg',
      '',
      'Pallets per year: ' + n0(out.perYear),
      'Timber per year: ' + n0(out.tonnes) + ' tonnes',
      'Pallets back into service: ' + n0(out.reuse) + ' per year',
      'Timber to mulch / fibre: ' + n0(out.shredT) + ' tonnes per year',
      'Equivalent semi-trailer loads: ' + n0(out.loads) + ' per year',
      ''
    ].join('\n');
  }

  var form = el('calc-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var contact = [];
      form.querySelectorAll('input, textarea').forEach(function (f) {
        if (!f.name || !f.value) return;
        var lbl = form.querySelector('label[for="' + f.id + '"]');
        contact.push((lbl ? lbl.textContent.trim() : f.name) + ': ' + f.value);
      });
      window.location.href = 'mailto:' + TO +
        '?subject=' + encodeURIComponent('Bulk pallet program enquiry') +
        '&body=' + encodeURIComponent(contact.join('\n') + '\n\n' + summary());
      var m = form.querySelector('.form-msg');
      if (m) { m.classList.add('show'); }
    });
  }

  var copyBtn = el('calc-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = summary();
      var done = function () {
        copyBtn.textContent = 'Copied';
        setTimeout(function () { copyBtn.textContent = 'Copy the numbers'; }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        var t = document.createElement('textarea');
        t.value = text; document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); } catch (err) {}
        document.body.removeChild(t); done();
      }
    });
  }
})();

/* ============================================================
   v3 — reveal, count-up, hero mini calculator, program builder
   ============================================================ */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fmt = function (v) { return Math.round(v).toLocaleString('en-AU'); };

  /* reveal */
  var rv = document.querySelectorAll('.rv');
  if (rv.length && 'IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (n) { io.observe(n); });
  } else { rv.forEach(function (n) { n.classList.add('in'); }); }

  /* count-up for static metrics marked data-count */
  var cu = document.querySelectorAll('[data-count]');
  if (cu.length && 'IntersectionObserver' in window && !reduce) {
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var n = e.target, end = parseFloat(n.getAttribute('data-count')), t0 = null;
        var step = function (ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / 900, 1), ease = 1 - Math.pow(1 - p, 3);
          n.textContent = fmt(end * ease);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step); io2.unobserve(n);
      });
    }, { threshold: .4 });
    cu.forEach(function (n) { io2.observe(n); });
  }

  /* hero mini calculator */
  var mi = document.getElementById('mini-ppw');
  if (mi) {
    var out = document.getElementById('mini-out'), go = document.getElementById('mini-go');
    var upd = function () {
      var v = parseFloat(mi.value) || 0;
      out.textContent = fmt(v * 52);
      go.href = 'pallet-calculator.html?ppw=' + Math.round(v);
    };
    mi.addEventListener('input', upd); upd();
  }

  /* calculator: accept ?ppw=&sites=&pct= */
  var q = {};
  location.search.replace(/^\?/, '').split('&').forEach(function (kv) {
    var p = kv.split('='); if (p[0]) q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
  });
  var setv = function (id, v) {
    var n = document.getElementById(id); if (n && v !== undefined && v !== '') { n.value = v; n.dispatchEvent(new Event('input', { bubbles: true })); }
  };
  if (document.getElementById('calc')) {
    setv('ppw-n', q.ppw); setv('ppw', q.ppw); setv('sites', q.sites); setv('pct', q.pct);
  }

  /* program builder */
  var sheet = document.getElementById('sheet');
  if (!sheet) return;
  var el = function (id) { return document.getElementById(id); };
  var read = function (id) { return parseFloat(el(id).value) || 0; };
  var b = {};

  function build() {
    var ppw = read('b-ppw'), sites = Math.max(read('b-sites'), 1), pct = read('b-pct');
    var kg = 25;
    var perYear = ppw * 52 * sites, tonnes = perYear * kg / 1000;
    var reuse = perYear * pct / 100, shredT = (perYear - reuse) * kg / 1000;
    var perWeekAll = ppw * sites;
    var freq = perWeekAll >= 1500 ? 'Multiple collections per week' :
               perWeekAll >= 500  ? 'Weekly collection' :
               perWeekAll >= 150  ? 'Fortnightly collection' : 'Monthly or on-call collection';
    var kit  = perWeekAll >= 1500 ? 'Trailer or bulk bin per site, swapped on schedule' :
               perWeekAll >= 500  ? 'Pallet cages or a trailer per site' :
               perWeekAll >= 150  ? 'Pallet cages positioned at your stacking point' : 'Collection from your existing stack, no equipment needed';

    el('s-co').textContent = el('b-co').value || 'Your company';
    el('s-loc').textContent = el('b-loc').value || 'Victoria';
    el('s-date').textContent = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
    el('s-ppw').textContent = fmt(ppw);
    el('s-sites').textContent = fmt(sites);
    el('s-pct').textContent = Math.round(pct) + '%';
    el('s-year').textContent = fmt(perYear);
    el('s-tonnes').textContent = fmt(tonnes);
    el('s-reuse').textContent = fmt(reuse);
    el('s-shred').textContent = fmt(shredT);
    el('s-freq').textContent = freq;
    el('s-kit').textContent = kit;
    el('v-b-ppw').textContent = fmt(ppw);
    el('v-b-sites').textContent = fmt(sites);
    el('v-b-pct').textContent = Math.round(pct) + '%';

    b = { ppw: ppw, sites: sites, pct: pct, perYear: perYear, tonnes: tonnes, reuse: reuse, shredT: shredT, freq: freq, kit: kit };
  }
  ['b-ppw', 'b-sites', 'b-pct', 'b-co', 'b-loc'].forEach(function (id) {
    var n = el(id); if (n) { n.addEventListener('input', build); n.addEventListener('change', build); }
  });
  setv('b-ppw', q.ppw); setv('b-sites', q.sites); setv('b-pct', q.pct);
  build();

  function text() {
    return [
      'TIMBERCYCLE PALLET PROGRAM SUMMARY',
      'Prepared for: ' + (el('b-co').value || 'Your company'),
      'Sites: ' + el('s-loc').textContent,
      '',
      'SITE PROFILE',
      'Pallets per week per site: ' + fmt(b.ppw),
      'Number of sites: ' + fmt(b.sites),
      'Estimated reusable share: ' + Math.round(b.pct) + '%',
      '',
      'ANNUAL VOLUMES (est.)',
      'Pallets: ' + fmt(b.perYear),
      'Timber: ' + fmt(b.tonnes) + ' tonnes',
      'Back into service: ' + fmt(b.reuse) + ' pallets',
      'Shredded to mulch / fibre: ' + fmt(b.shredT) + ' tonnes',
      '',
      'PROPOSED OPERATION',
      'Collection: ' + b.freq,
      'Equipment: ' + b.kit,
      'Commercial structure: modelled against these volumes after site assessment.',
      ''
    ].join('\n');
  }
  var pb = el('b-print'); if (pb) pb.addEventListener('click', function () { window.print(); });
  var sb = el('b-send');
  if (sb) sb.addEventListener('click', function () {
    var who = [];
    ['b-name', 'b-email', 'b-phone'].forEach(function (id) { var n = el(id); if (n && n.value) who.push(n.previousElementSibling.textContent.trim() + ': ' + n.value); });
    window.location.href = 'mailto:info@timbercycle.com.au?subject=' + encodeURIComponent('Pallet program summary - ' + (el('b-co').value || 'enquiry')) +
      '&body=' + encodeURIComponent(who.join('\n') + '\n\n' + text());
    var m = el('b-msg'); if (m) m.classList.add('show');
  });
})();

/* ============================================================
   v5 — dropdown navigation (click/keyboard; hover handled in CSS)
   ============================================================ */
(function () {
  var dds = document.querySelectorAll('.dd');
  if (!dds.length) return;
  function closeAll(except) {
    dds.forEach(function (d) { if (d !== except) { d.classList.remove('open'); d.querySelector('.dd__btn').setAttribute('aria-expanded', 'false'); } });
  }
  dds.forEach(function (d) {
    var btn = d.querySelector('.dd__btn');
    btn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var open = !d.classList.contains('open');
      closeAll(d);
      d.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.dd')) closeAll(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
})();
