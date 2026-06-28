// Wet Watch — hero fluid simulation, faithful to the real app:
// black screen, gooey connected liquid, target ring, droplets, live HUD.
(function () {
  const canvas = document.getElementById('fluid-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // offscreen buffer for the gooey (metaball-ish) liquid pass
  const blob = document.createElement('canvas');
  blob.width = W; blob.height = H;
  const bctx = blob.getContext('2d');

  // ---- liquid presets (match the in-game palette) ----
  const LIQUIDS = [
    { name: 'Water',   tag: 'Balanced flow',  color: '#3ec8ff', dark: '#0a2734', gravity: 0.16, visc: 0.985, mech: null },
    { name: 'Acid',    tag: 'Melts gates',    color: '#86f000', dark: '#1a2e05', gravity: 0.14, visc: 0.985, mech: 'Vortex' },
    { name: 'Oil',     tag: 'Slippery squeeze',color:'#ffb43a', dark: '#2e2105', gravity: 0.18, visc: 0.992, mech: 'Crosswind' },
    { name: 'Honey',   tag: 'Sticky pour',    color: '#ffd23a', dark: '#2e2505', gravity: 0.10, visc: 0.996, mech: null },
    { name: 'Lava',    tag: 'Heavy fall',     color: '#ff6a2a', dark: '#2e1205', gravity: 0.26, visc: 0.978, mech: 'Gravity Surge' },
    { name: 'Mercury', tag: 'Scatters',       color: '#c9d8e3', dark: '#1b2730', gravity: 0.24, visc: 0.982, mech: 'Wind Gusts' },
  ];
  const CYCLE = 5.2;             // seconds per liquid
  let idx = 0, level = 51;

  // ---- particles ----
  const N = 30;
  const P = [];
  for (let i = 0; i < N; i++) {
    P.push({ x: W * (.3 + Math.random() * .4), y: H * (.25 + Math.random() * .4),
             vx: (Math.random() - .5) * 1.5, vy: Math.random() * 1.5, r: 11 + Math.random() * 9 });
  }
  // a couple of resting droplets near the bottom (decorative, like the app)
  const drops = [
    { x: W * .22, y: H * .9, r: 13 },
    { x: W * .76, y: H * .9, r: 12 },
  ];

  // ---- target hole (sways = "Moving Hole") ----
  const hole = { x: W * .5, y: H * .76, r: 19, phase: 0, moving: true };

  // two shelves
  const shelves = [
    { x: W * .12, y: H * .5,  w: W * .3, h: 7 },
    { x: W * .56, y: H * .62, w: W * .3, h: 7 },
  ];

  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  const start = performance.now();
  let prev = start;

  function hexA(hex, a) {
    return `rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},${a})`;
  }

  function tick(now) {
    requestAnimationFrame(tick);
    if (!running) return;
    const dt = Math.min((now - prev) / 1000, .05); prev = now;
    const elapsed = (now - start) / 1000;

    const newIdx = Math.floor(elapsed / CYCLE) % LIQUIDS.length;
    if (newIdx !== idx) { idx = newIdx; level = 40 + Math.floor(Math.random() * 150); }
    const liq = LIQUIDS[idx];

    // progress through the current liquid drives the "fill %"
    const phase = (elapsed % CYCLE) / CYCLE;            // 0..1
    const captured = Math.round(8 + phase * 31);        // current %
    const quota = 67;                                   // target %
    const timeLeft = Math.max(0, Math.round(45 - phase * 19));

    // moving hole
    hole.phase += dt * 1.1;
    hole.x = W * .5 + Math.sin(hole.phase) * W * .2;

    // simulate
    for (const p of P) {
      p.vy += liq.gravity;
      p.vx *= liq.visc; p.vy *= liq.visc;
      // gentle pull toward the hole so the stream reads as "aiming"
      const adx = hole.x - p.x, ady = hole.y - p.y;
      const d = Math.hypot(adx, ady) || 1;
      p.vx += (adx / d) * 0.05; p.vy += (ady / d) * 0.02;

      for (const s of shelves) {
        if (p.x + p.r > s.x && p.x - p.r < s.x + s.w && p.y + p.r > s.y && p.y - p.r < s.y + s.h) {
          p.y = s.y - p.r; p.vy *= -.3; p.vx *= .8;
        }
      }
      p.x += p.vx; p.y += p.vy;
      if (p.x - p.r < 0) { p.x = p.r; p.vx = Math.abs(p.vx) * .5; }
      if (p.x + p.r > W) { p.x = W - p.r; p.vx = -Math.abs(p.vx) * .5; }

      const dx = p.x - hole.x, dy = p.y - hole.y;
      if (dx * dx + dy * dy < (hole.r + p.r * .3) ** 2 || p.y - p.r > H + 10) {
        // recycle to the top as a fresh pour
        p.x = W * (.35 + Math.random() * .3); p.y = -p.r;
        p.vx = (Math.random() - .5) * 1.2; p.vy = .6 + Math.random();
        p.r = 11 + Math.random() * 9;
      }
    }

    // ===== DRAW =====
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // shelves (dark navy rounded bars, like the app)
    ctx.fillStyle = '#0e2330';
    for (const s of shelves) { ctx.beginPath(); ctx.roundRect(s.x, s.y, s.w, s.h, 4); ctx.fill(); }

    // target: dark disc + bright animated ring
    ctx.fillStyle = liq.dark;
    ctx.beginPath(); ctx.arc(hole.x, hole.y, hole.r, 0, 7); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = hexA(liq.color, .9);
    ctx.beginPath(); ctx.arc(hole.x, hole.y, hole.r, 0, 7); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.strokeStyle = hexA(liq.color, .35);
    ctx.beginPath(); ctx.arc(hole.x, hole.y, hole.r + 5 + Math.sin(elapsed * 3) * 1.5, 0, 7); ctx.stroke();

    // ---- gooey liquid pass (blur union = connected blob) ----
    bctx.clearRect(0, 0, W, H);
    bctx.filter = 'blur(5px)';
    bctx.fillStyle = liq.color;
    for (const p of P) { bctx.beginPath(); bctx.arc(p.x, p.y, p.r, 0, 7); bctx.fill(); }
    for (const d of drops) { bctx.beginPath(); bctx.arc(d.x, d.y, d.r, 0, 7); bctx.fill(); }
    bctx.filter = 'none';

    // soft glow halo
    ctx.save();
    ctx.globalAlpha = .35; ctx.filter = 'blur(7px)';
    ctx.drawImage(blob, 0, 0);
    ctx.filter = 'none'; ctx.globalAlpha = 1;
    ctx.restore();
    // crisp gooey body via contrast threshold → metaball edge
    ctx.save();
    ctx.filter = 'contrast(9)';
    ctx.drawImage(blob, 0, 0);
    ctx.filter = 'none';
    ctx.restore();
    // solid cores so the blob reads as full liquid, not glow
    ctx.fillStyle = liq.color;
    for (const p of P)    { ctx.beginPath(); ctx.arc(p.x, p.y, p.r * .82, 0, 7); ctx.fill(); }
    for (const d of drops) { ctx.beginPath(); ctx.arc(d.x, d.y, d.r * .82, 0, 7); ctx.fill(); }

    // specular highlights on bigger particles
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    for (const p of P) {
      if (p.r < 13) continue;
      ctx.beginPath(); ctx.arc(p.x - p.r * .3, p.y - p.r * .3, p.r * .18, 0, 7); ctx.fill();
    }

    // ===== HUD (matches the real app) =====
    ctx.textAlign = 'center';
    const cx = W * .5;

    // time
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
    ctx.fillStyle = '#cfd6dd'; ctx.font = '600 13px Sora, sans-serif';
    ctx.fillText(`${hh}:${mm}`, cx, 22);

    // big percentage
    ctx.font = '800 27px Sora, sans-serif';
    ctx.fillStyle = liq.color;
    ctx.fillText(`${captured}% / ${quota}%`, cx, 58);

    // time · level
    ctx.font = '600 13px Sora, sans-serif'; ctx.fillStyle = '#aeb6bf';
    ctx.fillText(`${timeLeft}s  ·  Lv ${level}`, cx, 80);

    // liquid : flow
    ctx.font = '600 14px Sora, sans-serif'; ctx.fillStyle = liq.color;
    ctx.fillText(`${liq.name}: ${liq.tag}`, cx, 102);

    // mechanic (orange) — show "Moving Hole" + any liquid-specific one
    ctx.font = '700 13px Sora, sans-serif'; ctx.fillStyle = '#ff9a3a';
    const mech = liq.mech ? liq.mech : 'Moving Hole';
    ctx.fillText(mech, cx, 122);

    // pause button (right side)
    const px = W - 30, py = 118, pr = 17;
    ctx.fillStyle = hexA(liq.color, .92);
    ctx.beginPath(); ctx.arc(px, py, pr, 0, 7); ctx.fill();
    ctx.fillStyle = '#06222e';
    ctx.fillRect(px - 5, py - 6, 3.4, 12);
    ctx.fillRect(px + 1.6, py - 6, 3.4, 12);

    // subtle screen glare
    const sh = ctx.createLinearGradient(0, 0, W, H);
    sh.addColorStop(0, 'rgba(255,255,255,.05)');
    sh.addColorStop(.45, 'rgba(255,255,255,0)');
    ctx.fillStyle = sh; ctx.fillRect(0, 0, W, H);
  }

  requestAnimationFrame(tick);
})();
