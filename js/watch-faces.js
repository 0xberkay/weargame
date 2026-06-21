// ============================================================
// ZBD — live round watch-face previews (asset-free, procedural)
// Any <canvas class="face" data-face="game|ssh|vakit|disco"> is drawn
// in real time and clipped to a circle to mimic a Wear OS display.
// Works from any folder depth (no external image dependencies).
// ============================================================
(function () {
  const faces = [];
  document.querySelectorAll('canvas.face').forEach((c) => {
    faces.push({ canvas: c, ctx: c.getContext('2d'), type: c.dataset.face, r: c.width / 2 });
  });
  if (!faces.length) return;

  const clipCircle = (ctx, r) => { ctx.beginPath(); ctx.arc(r, r, r, 0, Math.PI * 2); ctx.clip(); };
  const px = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

  // ---------------------------------------------------------
  // GATE OF ANATOLIA — procedural pixel scene
  // ---------------------------------------------------------
  function drawGame(ctx, r, t) {
    const S = r * 2;
    let sky = ctx.createLinearGradient(0, 0, 0, S);
    sky.addColorStop(0, '#2a1620'); sky.addColorStop(.5, '#1a1018'); sky.addColorStop(1, '#0b0810');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, S, S);
    // sun glow
    const sun = ctx.createRadialGradient(S * .72, S * .3, 4, S * .72, S * .3, S * .55);
    sun.addColorStop(0, 'rgba(231,180,90,.85)'); sun.addColorStop(.4, 'rgba(200,110,50,.3)'); sun.addColorStop(1, 'rgba(200,110,50,0)');
    ctx.fillStyle = sun; ctx.fillRect(0, 0, S, S);
    px(ctx, S * .72 - S * .1, S * .3 - S * .1, S * .2, S * .2, '#e8c074');
    ctx.fillStyle = '#1d1119';
    ctx.beginPath(); ctx.moveTo(0, S * .66); ctx.quadraticCurveTo(S * .25, S * .55, S * .5, S * .64);
    ctx.quadraticCurveTo(S * .78, S * .72, S, S * .6); ctx.lineTo(S, S); ctx.lineTo(0, S); ctx.fill();
    px(ctx, 0, S * .72, S, S * .28, '#241a12');
    px(ctx, 0, S * .72, S, S * .015, '#3a2a1c');

    const unit = S / 26;
    // hero (facing right) bobbing
    const hb = Math.abs(Math.sin(t * 3)) * unit * .5;
    drawHero(ctx, S * .32, S * .72 - hb, unit, '#caa24a', '#8a2c22');
    // approaching enemy from the right
    const ex = S * 1.0 - ((t * 26) % (S * .8));
    drawHero(ctx, ex, S * .72, unit * .9, '#5a6470', '#2a2f38', true);

    // title
    ctx.textAlign = 'center';
    ctx.font = `800 ${Math.round(S * .085)}px Sora, Oswald, sans-serif`;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillText('ANATOLIA', r + 1, S * .19 + 1);
    ctx.fillStyle = '#f7e2a6'; ctx.fillText('ANATOLIA', r, S * .19);
  }
  function drawHero(ctx, cx, footY, u, body, armor, flip) {
    const d = flip ? -1 : 1;
    // legs
    px(ctx, cx - u * .9, footY - u, u * .8, u, armor);
    px(ctx, cx + u * .1, footY - u, u * .8, u, armor);
    // torso
    px(ctx, cx - u, footY - u * 2.6, u * 2, u * 1.7, body);
    // head
    px(ctx, cx - u * .7, footY - u * 3.7, u * 1.4, u * 1.1, '#e8c79a');
    px(ctx, cx - u * .7, footY - u * 4.0, u * 1.4, u * .4, armor); // helmet
    // sword
    px(ctx, cx + d * u * 1.2, footY - u * 3, u * .25 * 1, u * 2.4, '#d9dde6');
  }

  // ---------------------------------------------------------
  // WEARSSH — live terminal
  // ---------------------------------------------------------
  const sshLines = ['$ ssh root@vps', 'Last login: now', '$ uptime', ' up 12d, load 0.4',
    '$ docker ps', ' web   up', ' db    up', '$ systemctl status', ' active (running)',
    '$ tail -f log', ' 200 OK /api', '$ _'];
  function drawSSH(ctx, r, t) {
    const S = r * 2;
    px(ctx, 0, 0, S, S, '#02100a');
    px(ctx, 0, 0, S, S * .16, '#0a3322');
    ctx.fillStyle = '#27e07a'; ctx.textAlign = 'center';
    ctx.font = `600 ${Math.round(S * .07)}px 'JetBrains Mono', monospace`;
    ctx.fillText('WearSSH', r, S * .115);
    const shown = 1 + Math.floor(t * 1.6) % (sshLines.length + 3);
    ctx.textAlign = 'left';
    ctx.font = `${Math.round(S * .055)}px 'JetBrains Mono', monospace`;
    const x = S * .13, top = S * .26, lh = S * .062;
    for (let i = 0; i < shown && i < 11; i++) {
      const line = sshLines[i % sshLines.length];
      ctx.fillStyle = line.startsWith('$') ? '#27e07a' : '#5fd8a0';
      ctx.fillText(line, x, top + i * lh);
    }
    if (Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = '#27e07a';
      ctx.fillRect(x, top + Math.min(shown, 11) * lh - lh * .7, S * .05, lh * .7); }
  }

  // ---------------------------------------------------------
  // VAKIT WEAR — prayer clock + crescent + qibla needle
  // ---------------------------------------------------------
  const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  function drawVakit(ctx, r, t) {
    const S = r * 2;
    const g = ctx.createRadialGradient(r, r * .7, 8, r, r, S);
    g.addColorStop(0, '#0e3b30'); g.addColorStop(1, '#04130f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    // crescent
    ctx.save(); ctx.translate(r, S * .26); ctx.fillStyle = '#1fd6a6';
    ctx.beginPath(); ctx.arc(0, 0, S * .12, 0, 7); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(S * .05, -S * .02, S * .11, 0, 7); ctx.fill(); ctx.restore();
    // clock
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0'), mm = String(now.getMinutes()).padStart(2, '0');
    const sep = now.getSeconds() % 2 ? ':' : ' ';
    ctx.textAlign = 'center'; ctx.fillStyle = '#eafff7';
    ctx.font = `700 ${Math.round(S * .15)}px Sora, Oswald, sans-serif`;
    ctx.fillText(`${hh}${sep}${mm}`, r, S * .56);
    ctx.fillStyle = '#1fd6a6'; ctx.font = `600 ${Math.round(S * .06)}px Barlow, sans-serif`;
    ctx.fillText('Next · ' + prayers[Math.floor(t / 2) % prayers.length], r, S * .68);
    // qibla
    ctx.strokeStyle = 'rgba(31,214,166,.35)'; ctx.lineWidth = S * .012;
    ctx.beginPath(); ctx.arc(r, S * .83, S * .1, 0, 7); ctx.stroke();
    ctx.save(); ctx.translate(r, S * .83); ctx.rotate(Math.sin(t * .6) * .5 - .3);
    ctx.fillStyle = '#ffce5a'; ctx.beginPath();
    ctx.moveTo(0, -S * .09); ctx.lineTo(S * .03, 0); ctx.lineTo(-S * .03, 0); ctx.fill(); ctx.restore();
  }

  // ---------------------------------------------------------
  // WEAR DISCO — rotating rainbow rings
  // ---------------------------------------------------------
  function drawDisco(ctx, r, t) {
    const S = r * 2; px(ctx, 0, 0, S, S, '#0a0410');
    const rings = 5;
    for (let k = rings; k >= 1; k--) {
      const rad = (k / rings) * r * .92, hueShift = t * 90 + k * 40;
      ctx.save(); ctx.translate(r, r); ctx.rotate((t * (k % 2 ? 1 : -1)) * (.6 + k * .1));
      const seg = 24;
      for (let s = 0; s < seg; s++) {
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, rad, (s / seg) * 7, ((s + 1) / seg) * 7); ctx.closePath();
        ctx.fillStyle = `hsl(${(hueShift + s * (360 / seg)) % 360} 95% ${50 + Math.sin(t * 3 + s) * 14}%)`; ctx.fill();
      }
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.arc(0, 0, rad * .78, 0, 7); ctx.fill(); ctx.restore();
    }
    const pr = r * .16 * (1 + Math.sin(t * 6) * .18);
    const cg = ctx.createRadialGradient(r, r, 0, r, r, pr);
    cg.addColorStop(0, '#fff'); cg.addColorStop(1, `hsl(${(t * 120) % 360} 95% 60%)`);
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(r, r, pr, 0, 7); ctx.fill();
  }

  const drawers = { game: drawGame, ssh: drawSSH, vakit: drawVakit, disco: drawDisco };

  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });
  const onScreen = new WeakSet();
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) =>
      e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target)), { threshold: .05 });
    faces.forEach((f) => io.observe(f.canvas));
  } else faces.forEach((f) => onScreen.add(f.canvas));

  const start = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    if (!running) return;
    const t = (now - start) / 1000;
    faces.forEach((f) => {
      if (!onScreen.has(f.canvas)) return;
      const ctx = f.ctx; ctx.save(); clipCircle(ctx, f.r);
      (drawers[f.type] || (() => {}))(ctx, f.r, t);
      const sh = ctx.createLinearGradient(0, 0, f.r * 2, f.r * 2);
      sh.addColorStop(0, 'rgba(255,255,255,.12)'); sh.addColorStop(.4, 'rgba(255,255,255,0)');
      ctx.fillStyle = sh; ctx.fillRect(0, 0, f.r * 2, f.r * 2); ctx.restore();
    });
  }
  requestAnimationFrame(tick);
})();
