// ============================================================
// ZBD · Wear OS Studio — live round watch-face previews
// Each <canvas class="face" data-face="..."> is drawn in real time,
// clipped to a circle to mimic a Wear OS round display.
// ============================================================
(function () {
  const faces = [];
  document.querySelectorAll('canvas.face').forEach((c) => {
    faces.push({ canvas: c, ctx: c.getContext('2d'), type: c.dataset.face, r: c.width / 2 });
  });
  if (!faces.length) return;

  // shared image cache for the game face (reuse existing pixel art)
  const IMG = {};
  function img(src) {
    if (!IMG[src]) { const i = new Image(); i.src = src; IMG[src] = i; }
    const i = IMG[src];
    return i.complete && i.naturalWidth ? i : null;
  }
  ['assets/menu.png', 'uploads/spr_hero_east.png', 'uploads/spr_warlord_west.png'].forEach(img);

  function clipCircle(ctx, r) {
    ctx.beginPath();
    ctx.arc(r, r, r, 0, Math.PI * 2);
    ctx.clip();
  }

  // ---------------------------------------------------------
  // GATE OF ANATOLIA — pixel scene with bobbing hero
  // ---------------------------------------------------------
  function drawGame(ctx, r, t) {
    const size = r * 2;
    const bg = img('assets/menu.png');
    if (bg) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(bg, 0, 0, size, size);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, size);
      g.addColorStop(0, '#2a1620'); g.addColorStop(1, '#0b0810');
      ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    }
    // ground glow
    const sun = ctx.createRadialGradient(size * 0.72, size * 0.3, 4, size * 0.72, size * 0.3, size * 0.5);
    sun.addColorStop(0, 'rgba(231,180,90,.5)'); sun.addColorStop(1, 'rgba(231,180,90,0)');
    ctx.fillStyle = sun; ctx.fillRect(0, 0, size, size);

    // bobbing hero + approaching enemy
    ctx.imageSmoothingEnabled = false;
    const hero = img('uploads/spr_hero_east.png');
    const foe = img('uploads/spr_warlord_west.png');
    const bob = Math.abs(Math.sin(t * 3)) * 4;
    if (hero) { const h = size * 0.32, w = hero.naturalWidth / hero.naturalHeight * h; ctx.drawImage(hero, size * 0.3 - w / 2, size * 0.72 - h - bob, w, h); }
    if (foe) { const ex = size * 0.95 - ((t * 22) % (size * 0.7)); const h = size * 0.3, w = foe.naturalWidth / foe.naturalHeight * h; ctx.drawImage(foe, ex, size * 0.72 - h, w, h); }

    // title
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.round(size * 0.085)}px Oswald, sans-serif`;
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillText('ANATOLIA', r + 1, size * 0.2 + 1);
    ctx.fillStyle = '#f7e2a6'; ctx.fillText('ANATOLIA', r, size * 0.2);
  }

  // ---------------------------------------------------------
  // WEARSSH — live terminal
  // ---------------------------------------------------------
  const sshLines = [
    '$ ssh root@vps', 'Last login: now', '$ uptime', ' 12 days, load 0.4',
    '$ docker ps', ' web   running', ' db    running', '$ systemctl status',
    ' ● active (running)', '$ tail -f log', ' 200 OK  /api', '$ _'
  ];
  function drawSSH(ctx, r, t) {
    const size = r * 2;
    ctx.fillStyle = '#02100a'; ctx.fillRect(0, 0, size, size);
    // top bar
    ctx.fillStyle = '#0a3322'; ctx.fillRect(0, 0, size, size * 0.16);
    ctx.fillStyle = '#27e07a'; ctx.textAlign = 'center';
    ctx.font = `600 ${Math.round(size * 0.07)}px 'JetBrains Mono', monospace`;
    ctx.fillText('WearSSH', r, size * 0.115);

    const shown = Math.min(sshLines.length, 1 + Math.floor(t * 1.6) % (sshLines.length + 4));
    ctx.textAlign = 'left';
    ctx.font = `${Math.round(size * 0.055)}px 'JetBrains Mono', monospace`;
    const x = size * 0.13, top = size * 0.26, lh = size * 0.062;
    for (let i = 0; i < shown && i < 11; i++) {
      const line = sshLines[i % sshLines.length];
      ctx.fillStyle = line.startsWith('$') ? '#27e07a' : '#5fd8a0';
      ctx.fillText(line, x, top + i * lh);
    }
    // blinking cursor
    if (Math.floor(t * 2) % 2 === 0) {
      ctx.fillStyle = '#27e07a';
      const cy = top + Math.min(shown, 11) * lh;
      ctx.fillRect(x, cy - lh * 0.7, size * 0.05, lh * 0.7);
    }
  }

  // ---------------------------------------------------------
  // VAKIT WEAR — prayer clock, crescent, qibla needle
  // ---------------------------------------------------------
  const prayers = ['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'];
  function drawVakit(ctx, r, t) {
    const size = r * 2;
    const g = ctx.createRadialGradient(r, r * 0.7, 8, r, r, size);
    g.addColorStop(0, '#0e3b30'); g.addColorStop(1, '#04130f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);

    // crescent + star
    ctx.save();
    ctx.translate(r, size * 0.26);
    ctx.fillStyle = '#1fd6a6';
    ctx.beginPath(); ctx.arc(0, 0, size * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(size * 0.05, -size * 0.02, size * 0.11, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // current time
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const blink = now.getSeconds() % 2 ? ':' : ' ';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#eafff7';
    ctx.font = `700 ${Math.round(size * 0.15)}px Oswald, sans-serif`;
    ctx.fillText(`${hh}${blink}${mm}`, r, size * 0.56);

    // next prayer label cycling
    const idx = Math.floor(t / 2) % prayers.length;
    ctx.fillStyle = '#1fd6a6';
    ctx.font = `600 ${Math.round(size * 0.06)}px Barlow, sans-serif`;
    ctx.fillText('Sıradaki · ' + prayers[idx], r, size * 0.68);

    // qibla ring + rotating needle
    ctx.strokeStyle = 'rgba(31,214,166,.35)'; ctx.lineWidth = size * 0.012;
    ctx.beginPath(); ctx.arc(r, size * 0.83, size * 0.1, 0, Math.PI * 2); ctx.stroke();
    ctx.save();
    ctx.translate(r, size * 0.83);
    ctx.rotate(Math.sin(t * 0.6) * 0.5 - 0.3);
    ctx.fillStyle = '#ffce5a';
    ctx.beginPath(); ctx.moveTo(0, -size * 0.09); ctx.lineTo(size * 0.03, 0); ctx.lineTo(-size * 0.03, 0); ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------
  // WEAR DISCO — rotating rainbow rings
  // ---------------------------------------------------------
  function drawDisco(ctx, r, t) {
    const size = r * 2;
    ctx.fillStyle = '#0a0410'; ctx.fillRect(0, 0, size, size);
    const rings = 5;
    for (let k = rings; k >= 1; k--) {
      const rad = (k / rings) * r * 0.92;
      const hueShift = t * 90 + k * 40;
      ctx.save();
      ctx.translate(r, r);
      ctx.rotate((t * (k % 2 ? 1 : -1)) * (0.6 + k * 0.1));
      const seg = 24;
      for (let s = 0; s < seg; s++) {
        const a0 = (s / seg) * Math.PI * 2;
        const a1 = ((s + 1) / seg) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, rad, a0, a1);
        ctx.closePath();
        const hue = (hueShift + s * (360 / seg)) % 360;
        const light = 50 + Math.sin(t * 3 + s) * 14;
        ctx.fillStyle = `hsl(${hue} 95% ${light}%)`;
        ctx.fill();
      }
      // punch a hole for the next ring
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.arc(0, 0, rad * 0.78, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // center pulse
    const pr = r * 0.16 * (1 + Math.sin(t * 6) * 0.18);
    const cg = ctx.createRadialGradient(r, r, 0, r, r, pr);
    cg.addColorStop(0, '#fff'); cg.addColorStop(1, `hsl(${(t * 120) % 360} 95% 60%)`);
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(r, r, pr, 0, Math.PI * 2); ctx.fill();
  }

  const drawers = { game: drawGame, ssh: drawSSH, vakit: drawVakit, disco: drawDisco };

  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  // only animate faces that are on screen (perf)
  const onScreen = new WeakSet();
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target); });
    }, { threshold: 0.05 });
    faces.forEach((f) => io.observe(f.canvas));
  } else {
    faces.forEach((f) => onScreen.add(f.canvas));
  }

  const start = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    if (!running) return;
    const t = (now - start) / 1000;
    faces.forEach((f) => {
      if (!onScreen.has(f.canvas)) return;
      const ctx = f.ctx;
      ctx.save();
      clipCircle(ctx, f.r);
      (drawers[f.type] || (() => {}))(ctx, f.r, t);
      // subtle screen shine
      const sh = ctx.createLinearGradient(0, 0, f.r * 2, f.r * 2);
      sh.addColorStop(0, 'rgba(255,255,255,.12)'); sh.addColorStop(0.4, 'rgba(255,255,255,0)');
      ctx.fillStyle = sh; ctx.fillRect(0, 0, f.r * 2, f.r * 2);
      ctx.restore();
    });
  }
  requestAnimationFrame(tick);
})();
