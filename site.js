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
