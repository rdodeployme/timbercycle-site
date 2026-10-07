/* Timbercycle — animated yard (home hero).
   Pallets ride the belt into the grading gate. Sound ones lift onto the
   "back to work" stack; the rest drop into the shredder and come out as chip
   onto a growing mulch pile. Pure canvas, no dependencies, pauses off-screen,
   renders a single still frame for reduced-motion visitors. */
(function () {
  'use strict';
  var cv = document.getElementById('yard');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');

  var VW = 600, VH = 420;                    // virtual scene
  var C = {
    tan: '#D45A3D', tanDeep: '#8E2D19', grain: '#B7432A', acc: '#E2694C',
    grey: '#5B5650', greyDeep: '#3B3834',
    line: 'rgba(255,255,255,.16)', text: '#FFFFFF', sub: '#A9A39B', bg: '#0B0B0B'
  };

  var BELT_Y = 250, GATE_X = 290, SPEED = 74;
  var STACK = { x: 432, base: 172, max: 6 };
  var HOP = { x: 412, y: 300 };
  var PILE = { x: 508, base: 410, w: 172, maxH: 72 };
  var PATTERN = [1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1];   // 1 = reusable, ~58%

  var pallets = [], chips = [];
  var stackN = 0, ship = 0, pile = 0, pileFade = 0;
  var spawnT = 0, seq = 0, beltOff = 0, teeth = 0;

  function bez(a, b, c, t) { var u = 1 - t; return u * u * a + 2 * u * t * b + t * t * c; }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function spawn() {
    pallets.push({ x: -70, y: BELT_Y - 18, keep: PATTERN[seq++ % PATTERN.length], phase: 'belt', t: 0, sx: 0, sy: 0, tint: 0 });
  }

  function step(dt) {
    beltOff = (beltOff + SPEED * dt) % 30;
    teeth += dt * 6;
    spawnT -= dt;
    if (spawnT <= 0) { spawn(); spawnT = 1.25; }

    for (var i = pallets.length - 1; i >= 0; i--) {
      var p = pallets[i];
      if (p.phase === 'belt') {
        p.x += SPEED * dt;
        if (p.x + 28 >= GATE_X + 8) { p.phase = 'arc'; p.t = 0; p.sx = p.x; p.sy = p.y; }
      } else if (p.phase === 'arc') {
        p.t += dt / (p.keep ? 1.05 : .8);
        if (!p.keep) p.tint = Math.min(1, p.tint + dt * 3);
        var t = ease(Math.min(p.t, 1));
        if (p.keep) {
          var ty = STACK.base - 18 - stackN * 17;
          p.x = bez(p.sx, 350, STACK.x, t);
          p.y = bez(p.sy, ty - 70, ty, t);
        } else {
          p.x = bez(p.sx, 372, HOP.x - 28, t);
          p.y = bez(p.sy, BELT_Y - 24, HOP.y - 12, t);
        }
        if (p.t >= 1) {
          if (p.keep) { if (ship === 0) stackN++; }
          else { for (var k = 0; k < 16; k++) chips.push({ x: HOP.x + (Math.random() * 14 - 7), y: HOP.y + 38, vx: 35 + Math.random() * 85, vy: -20 + Math.random() * 30, s: 2 + Math.random() * 3.2, c: Math.random() < .55 ? C.tan : (Math.random() < .5 ? C.tanDeep : C.grain), d: Math.random() * .25 }); }
          pallets.splice(i, 1);
        }
      }
    }

    if (stackN >= STACK.max && ship === 0) ship = .0001;
    if (ship > 0) { ship += dt / 1.4; if (ship >= 1) { ship = 0; stackN = 0; } }

    for (var j = chips.length - 1; j >= 0; j--) {
      var c = chips[j];
      if (c.d > 0) { c.d -= dt; continue; }
      c.vy += 520 * dt; c.x += c.vx * dt; c.y += c.vy * dt;
      var dx = (c.x - PILE.x) / (PILE.w / 2);
      var top = PILE.base - Math.max(0, 1 - dx * dx) * Math.max(6, pile * PILE.maxH);
      if (c.y >= top || c.y > VH) { chips.splice(j, 1); pile = Math.min(1, pile + .0045); }
    }
    if (pile >= 1 && pileFade === 0) pileFade = .0001;
    if (pileFade > 0) { pileFade += dt / 1.4; if (pileFade >= 1) { pileFade = 0; pile = 0; } }
  }

  /* ---------- drawing ---------- */
  function pallet(x, y, tint, alpha) {
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    var deck = tint > .5 ? C.grey : C.tan, blk = tint > .5 ? C.greyDeep : C.tanDeep;
    ctx.fillStyle = deck;
    rr(x, y, 58, 6, 1.5); ctx.fill();               // top deck
    ctx.fillStyle = blk;
    ctx.fillRect(x + 2, y + 6, 9, 7); ctx.fillRect(x + 24.5, y + 6, 9, 7); ctx.fillRect(x + 47, y + 6, 9, 7);
    ctx.fillStyle = deck;
    rr(x, y + 13, 58, 4, 1); ctx.fill();            // bottom deck
    if (tint > .5) {                                 // crack mark on rejects
      ctx.strokeStyle = C.greyDeep; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(x + 18, y); ctx.lineTo(x + 23, y + 4); ctx.lineTo(x + 20, y + 6); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function label(txt, x, y, col, size, weight, align) {
    ctx.fillStyle = col; ctx.font = (weight || 600) + ' ' + (size || 12) + 'px Poppins, system-ui, sans-serif';
    ctx.textAlign = align || 'left'; ctx.fillText(txt, x, y);
  }

  function draw() {
    var w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    var k = Math.min(w / VW, h / VH);
    ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * (w - VW * k) / 2, dpr * (h - VH * k) / 2);
    ctx.clearRect(-50, -50, VW + 100, VH + 100);

    // ---- belt
    ctx.strokeStyle = C.line; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(4, BELT_Y + 1); ctx.lineTo(GATE_X + 14, BELT_Y + 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, BELT_Y + 15); ctx.lineTo(GATE_X + 14, BELT_Y + 15); ctx.stroke();
    ctx.fillStyle = '#1A1918';
    for (var rx = 14 - beltOff; rx < GATE_X + 10; rx += 30) {
      if (rx < 6) continue;
      ctx.beginPath(); ctx.arc(rx, BELT_Y + 8, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1; ctx.stroke();
    }
    label('YOUR SITE', 6, BELT_Y + 42, C.sub, 12, 600);

    // ---- grading gate
    ctx.strokeStyle = C.acc; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(GATE_X, BELT_Y - 2); ctx.lineTo(GATE_X, BELT_Y - 64); ctx.lineTo(GATE_X + 16, BELT_Y - 64); ctx.lineTo(GATE_X + 16, BELT_Y - 2); ctx.stroke();
    ctx.fillStyle = 'rgba(226,105,76,.14)'; ctx.fillRect(GATE_X, BELT_Y - 64, 16, 62);
    label('GRADE', GATE_X + 8, BELT_Y - 76, C.acc, 13, 700, 'center');

    // ---- stack platform + label
    var shipX = ship > 0 ? ease(ship) * 170 : 0, shipA = ship > 0 ? 1 - ship : 1;
    ctx.strokeStyle = C.line; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(STACK.x - 22, STACK.base + 1); ctx.lineTo(STACK.x + 128, STACK.base + 1); ctx.stroke();
    for (var s = 0; s < stackN; s++) pallet(STACK.x + shipX, STACK.base - 18 - s * 17, 0, shipA);
    label('01', STACK.x - 24, 46, C.acc, 36, 800);
    label('BACK TO WORK', STACK.x + 24, 32, C.text, 14, 700);
    label('reconditioned pallets', STACK.x + 24, 50, C.sub, 12, 500);

    // ---- hopper / shredder
    ctx.fillStyle = '#161616'; ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(HOP.x - 34, HOP.y); ctx.lineTo(HOP.x + 34, HOP.y); ctx.lineTo(HOP.x + 14, HOP.y + 38); ctx.lineTo(HOP.x - 14, HOP.y + 38); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(HOP.x, HOP.y + 20); ctx.strokeStyle = '#8E877E'; ctx.lineWidth = 2;
    for (var g = 0; g < 4; g++) { var a = teeth + g * Math.PI / 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 3, Math.sin(a) * 3); ctx.lineTo(Math.cos(a) * 10, Math.sin(a) * 10); ctx.stroke(); }
    ctx.restore();

    // ---- pile
    var ph = Math.max(6, pile * PILE.maxH) * (pileFade > 0 ? 1 - ease(pileFade) : 1);
    var grd = ctx.createLinearGradient(0, PILE.base - PILE.maxH, 0, PILE.base);
    grd.addColorStop(0, C.tan); grd.addColorStop(1, C.tanDeep);
    ctx.fillStyle = grd; ctx.beginPath(); ctx.moveTo(PILE.x - PILE.w / 2, PILE.base);
    for (var px = -1; px <= 1.0001; px += .05) ctx.lineTo(PILE.x + px * PILE.w / 2, PILE.base - (1 - px * px) * ph);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(PILE.x - PILE.w / 2 - 10, PILE.base + 1); ctx.lineTo(PILE.x + PILE.w / 2 + 6, PILE.base + 1); ctx.stroke();
    var LX = HOP.x - 48;
    label('02', LX, 334, '#8E877E', 36, 800, 'right');
    label('MULCH, FIBRE,', LX, 356, C.text, 14, 700, 'right');
    label('FEEDSTOCK', LX, 373, C.text, 14, 700, 'right');
    label('anything past repair', LX, 392, C.sub, 12, 500, 'right');

    // ---- moving pallets + chips
    for (var i = 0; i < pallets.length; i++) pallet(pallets[i].x, pallets[i].y, pallets[i].tint);
    for (var j = 0; j < chips.length; j++) { var c = chips[j]; if (c.d > 0) continue; ctx.fillStyle = c.c; ctx.fillRect(c.x, c.y, c.s, c.s * .7); }
  }

  /* ---------- loop ---------- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var running = false, last = 0, raf = 0;

  // warm up so the scene is never empty on first paint
  for (var w0 = 0; w0 < 60 * 9; w0++) step(1 / 60);

  function frame(ts) {
    if (!running) return;
    var dt = Math.min((ts - (last || ts)) / 1000, 1 / 20); last = ts;
    step(dt); draw(); raf = requestAnimationFrame(frame);
  }
  function start() { if (running || reduce) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  draw();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  window.addEventListener('resize', draw);
  if (reduce) return;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }, { threshold: .05 }).observe(cv);
  } else start();
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
})();
