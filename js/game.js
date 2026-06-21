// ============================================================
// Gate of Anatolia — playable demo (vanilla port)
// Endless wave brawler rendered on a 900x460 logical canvas.
// ============================================================
(function () {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // ---- DOM refs ----
  const el = {
    hearts: document.getElementById('hearts'),
    gold: document.getElementById('gold'),
    wave: document.getElementById('wave'),
    finalScore: document.getElementById('finalScore'),
    finalWave: document.getElementById('finalWave'),
    overStart: document.getElementById('overlay-start'),
    overOver: document.getElementById('overlay-over'),
    startBtn: document.getElementById('startBtn'),
    retryBtn: document.getElementById('retryBtn'),
    btnLeft: document.getElementById('btnLeft'),
    btnRight: document.getElementById('btnRight'),
    btnJump: document.getElementById('btnJump'),
    btnAtk: document.getElementById('btnAtk'),
    frame: document.querySelector('.game-frame'),
  };

  // ---- assets ----
  const P = {
    walkE: [0, 1, 2, 3].map((i) => `uploads/spr_hero_walk_east_${i}.png`),
    walkW: [0, 1, 2, 3].map((i) => `uploads/spr_hero_walk_west_${i}.png`),
    atkE: [0, 1, 2, 3, 4, 5, 6].map((i) => `uploads/spr_hero_atk_east_${i}.png`),
    atkW: [0, 1, 2, 3, 4, 5, 6].map((i) => `uploads/spr_hero_atk_west_${i}.png`),
    idleE: 'uploads/spr_hero_east.png', idleW: 'uploads/spr_hero_west.png',
    enemies: ['uploads/spr_warlord_west.png', 'uploads/spr_crusader_knight_west.png', 'uploads/spr_mongol_warrior_west.png', 'uploads/spr_archer_west.png'],
    tree: 'uploads/obj_tree.png', banner: 'uploads/obj_banner.png', chest: 'uploads/obj_chest.png',
  };
  const IMG = {};
  [...P.walkE, ...P.walkW, ...P.atkE, ...P.atkW, P.idleE, P.idleW, ...P.enemies, P.tree, P.banner, P.chest]
    .forEach((src) => { const im = new Image(); im.src = src; IMG[src] = im; });
  const img = (src) => { const i = IMG[src]; return i && i.complete && i.naturalWidth ? i : null; };

  // ---- state ----
  let started = false;
  let game;
  const input = { left: false, right: false };
  let sx = 1, sy = 1, inView = true;

  function resetGame() {
    game = {
      hero: { x: 180, y: 330, vy: 0, onGround: true, dir: 1, state: 'idle', f: 0, ft: 0, atkHit: false, inv: 0 },
      enemies: [], parts: [], floats: [], gold: 0, hp: 5, wave: 1, kills: 0, score: 0,
      spawnT: 1100, over: false, shake: 0, t: 0,
    };
  }

  function setupCanvas() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    sx = canvas.width / 900;
    sy = canvas.height / 460;
  }

  // ---- HUD ----
  function renderHearts(hp) {
    let html = '';
    for (let i = 0; i < 5; i++) html += `<span class="heart ${i < hp ? 'on' : 'off'}"></span>`;
    el.hearts.innerHTML = html;
  }
  function syncHUD() {
    el.gold.textContent = game.gold;
    el.wave.textContent = game.wave;
    renderHearts(Math.max(0, game.hp));
  }

  // ---- flow ----
  function start() {
    resetGame();
    input.left = input.right = false;
    started = true;
    el.overStart.classList.add('hidden');
    el.overOver.classList.add('hidden');
    syncHUD();
  }
  function gameOver() {
    game.over = true;
    input.left = input.right = false;
    el.finalScore.textContent = game.score;
    el.finalWave.textContent = game.wave;
    el.overOver.classList.remove('hidden');
  }

  // ---- actions ----
  function jump() { const h = game.hero; if (h.onGround && h.state !== 'attack') { h.vy = -13.5; h.onGround = false; } }
  function attack() { const h = game.hero; if (h.state !== 'attack') { h.state = 'attack'; h.f = 0; h.ft = 0; h.atkHit = false; } }

  // ---- input: keyboard ----
  function onKey(e) {
    if (!inView) return;
    const k = e.key;
    if (!started || game.over) { if (k === ' ' || k === 'Enter') { e.preventDefault(); start(); } return; }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { input.left = true; e.preventDefault(); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { input.right = true; e.preventDefault(); }
    else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') { jump(); e.preventDefault(); }
    else if (k === 'j' || k === 'J' || k === 'k' || k === 'K' || k === 'Enter') { attack(); e.preventDefault(); }
  }
  function onKeyUp(e) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') input.left = false;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') input.right = false;
  }
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKeyUp);

  // ---- input: buttons / touch ----
  const press = (fn) => (e) => { e.preventDefault(); if (started && !game.over) fn(); };
  el.startBtn.addEventListener('click', start);
  el.retryBtn.addEventListener('click', start);
  el.btnLeft.addEventListener('pointerdown', press(() => { input.left = true; }));
  el.btnRight.addEventListener('pointerdown', press(() => { input.right = true; }));
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => {
    el.btnLeft.addEventListener(ev, () => { input.left = false; });
    el.btnRight.addEventListener(ev, () => { input.right = false; });
  });
  el.btnJump.addEventListener('pointerdown', press(jump));
  el.btnAtk.addEventListener('pointerdown', press(attack));

  // ---- spawn / fx ----
  function spawn() {
    const src = P.enemies[(Math.random() * P.enemies.length) | 0];
    game.enemies.push({ x: 930, y: 330, src, spd: 1.0 + Math.min(1.7, game.wave * 0.18) + Math.random() * 0.4, bob: Math.random() * 6, dead: false, dt: 0 });
  }
  function spark(x) {
    for (let i = 0; i < 11; i++) game.parts.push({ x, y: 282, vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 5 - 1, life: 380, c: Math.random() < 0.5 ? '#f7e2a6' : '#d68c34' });
  }
  function float(x, txt) { game.floats.push({ x, y: 248, txt, life: 680 }); }

  // ---- update ----
  function update(dt) {
    const g = game, f = dt / 16.6, h = g.hero;
    g.t += dt;
    if (started && !g.over) {
      let moving = false;
      if (h.state !== 'attack') {
        const sp = 3.2 * f;
        if (input.left) { h.x -= sp; h.dir = -1; moving = true; }
        if (input.right) { h.x += sp; h.dir = 1; moving = true; }
      }
      h.x = Math.max(60, Math.min(840, h.x));
      h.vy += 0.9 * f; h.y += h.vy * f;
      if (h.y >= 330) { h.y = 330; h.vy = 0; h.onGround = true; }
      if (h.state === 'attack') { h.ft += dt; if (h.ft >= 42) { h.ft = 0; h.f++; if (h.f >= 7) { h.state = 'idle'; h.f = 0; } } }
      else if (!h.onGround) { h.state = 'jump'; }
      else if (moving) { h.state = 'walk'; h.ft += dt; if (h.ft >= 110) { h.ft = 0; h.f = (h.f + 1) % 4; } }
      else { h.state = 'idle'; }
      if (h.inv > 0) h.inv -= dt;

      if (h.state === 'attack' && h.f >= 3 && h.f <= 5) {
        const reach = 98;
        g.enemies.forEach((e) => {
          if (e.dead) return;
          const dx = e.x - h.x;
          if ((h.dir > 0 && dx > -12 && dx < reach) || (h.dir < 0 && dx < 12 && dx > -reach)) {
            e.dead = true; e.dt = 0; g.gold += 5; g.score += 10; g.kills++; spark(e.x); float(e.x, '+5'); g.shake = 6;
          }
        });
      }
      g.spawnT -= dt; if (g.spawnT <= 0) { spawn(); g.spawnT = Math.max(520, 1450 - g.wave * 110); }
      g.wave = 1 + Math.floor(g.kills / 8);
      g.enemies.forEach((e) => {
        if (e.dead) { e.dt += dt; return; }
        e.x -= e.spd * f; e.bob += dt * 0.012;
        const dx = e.x - h.x;
        if (Math.abs(dx) < 38 && h.inv <= 0) { g.hp--; h.inv = 950; e.dead = true; e.dt = 0; g.shake = 11; spark(e.x); }
      });
      g.enemies = g.enemies.filter((e) => e.x > -70 && !(e.dead && e.dt > 260));
      if (g.hp <= 0) gameOver();
    }
    g.parts.forEach((p) => { p.x += p.vx * f; p.y += p.vy * f; p.vy += 0.4 * f; p.life -= dt; });
    g.parts = g.parts.filter((p) => p.life > 0);
    g.floats.forEach((fl) => { fl.y -= 0.6 * f; fl.life -= dt; });
    g.floats = g.floats.filter((fl) => fl.life > 0);
    if (g.shake > 0) { g.shake -= dt * 0.045; if (g.shake < 0) g.shake = 0; }
    syncHUD();
  }

  // ---- draw ----
  function drawSprite(src, cx, footY, dispH) {
    const im = img(src); if (!im) return;
    const sc = dispH / im.naturalHeight, w = im.naturalWidth * sc;
    ctx.drawImage(im, cx - w / 2, footY - dispH, w, dispH);
  }
  function draw() {
    const g = game;
    ctx.imageSmoothingEnabled = false;
    const shx = (Math.random() - 0.5) * g.shake, shy = (Math.random() - 0.5) * g.shake;
    ctx.setTransform(sx, 0, 0, sy, shx * sx, shy * sy);

    let sky = ctx.createLinearGradient(0, 0, 0, 460);
    sky.addColorStop(0, '#2a1620'); sky.addColorStop(0.45, '#1a1018'); sky.addColorStop(1, '#0b0810');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, 900, 460);
    let sg = ctx.createRadialGradient(720, 120, 8, 720, 120, 175);
    sg.addColorStop(0, 'rgba(231,180,90,.85)'); sg.addColorStop(0.4, 'rgba(200,110,50,.32)'); sg.addColorStop(1, 'rgba(200,110,50,0)');
    ctx.fillStyle = sg; ctx.fillRect(440, -70, 460, 380);
    ctx.fillStyle = '#e8c074'; ctx.beginPath(); ctx.arc(720, 120, 46, 0, 7); ctx.fill();
    ctx.fillStyle = '#1d1119'; ctx.beginPath(); ctx.moveTo(0, 330); ctx.quadraticCurveTo(220, 252, 460, 318); ctx.quadraticCurveTo(700, 360, 900, 300); ctx.lineTo(900, 330); ctx.lineTo(0, 330); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#241a12'; ctx.fillRect(0, 330, 900, 130);
    ctx.fillStyle = '#3a2a1c'; ctx.fillRect(0, 330, 900, 6);
    ctx.fillStyle = '#16100b'; ctx.fillRect(0, 394, 900, 66);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 42; i++) ctx.fillRect((i * 47) % 900, 346 + (i * 13 % 42), 3, 3);

    drawSprite(P.banner, 120, 330, 116);
    drawSprite(P.tree, 800, 330, 128);
    drawSprite(P.chest, 46, 330, 52);

    g.enemies.forEach((e) => { const bob = Math.abs(Math.sin(e.bob)) * 3; ctx.globalAlpha = e.dead ? Math.max(0, 1 - e.dt / 260) : 1; drawSprite(e.src, e.x, 330 - bob, 92); });
    ctx.globalAlpha = 1;

    const h = g.hero; let src;
    if (h.state === 'attack') src = (h.dir > 0 ? P.atkE : P.atkW)[Math.min(6, h.f)];
    else if (h.state === 'walk') src = (h.dir > 0 ? P.walkE : P.walkW)[h.f % 4];
    else src = (h.dir > 0 ? P.idleE : P.idleW);
    const blink = h.inv > 0 && (Math.floor(g.t / 80) % 2 === 0);
    if (!blink) drawSprite(src, h.x, h.y, 100);

    if (h.state === 'attack' && h.f >= 3 && h.f <= 5) {
      ctx.strokeStyle = 'rgba(247,226,166,.55)'; ctx.lineWidth = 5; ctx.beginPath();
      const cx = h.x + h.dir * 34, cy = h.y - 56;
      ctx.arc(cx, cy, 42, h.dir > 0 ? -1.1 : 2.0, h.dir > 0 ? 1.1 : 4.2); ctx.stroke();
    }

    g.parts.forEach((p) => { ctx.globalAlpha = Math.max(0, p.life / 380); ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 3, 3); });
    ctx.globalAlpha = 1;
    ctx.font = '14px "Press Start 2P", monospace'; ctx.textAlign = 'center';
    g.floats.forEach((fl) => { ctx.globalAlpha = Math.max(0, fl.life / 680); ctx.fillStyle = '#f7e2a6'; ctx.fillText(fl.txt, fl.x, fl.y); });
    ctx.globalAlpha = 1; ctx.textAlign = 'left';

    let vg = ctx.createRadialGradient(450, 230, 170, 450, 230, 470);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, 900, 460);
  }

  // ---- loop ----
  let last = performance.now();
  function loop(t) {
    const dt = Math.min(48, t - last); last = t;
    if (inView) { update(dt); draw(); }
    requestAnimationFrame(loop);
  }

  // ---- boot ----
  resetGame();
  setupCanvas();
  syncHUD();
  if ('ResizeObserver' in window) new ResizeObserver(setupCanvas).observe(canvas);
  if ('IntersectionObserver' in window && el.frame) {
    new IntersectionObserver((es) => es.forEach((e) => { inView = e.isIntersecting; }), { threshold: 0.04 }).observe(el.frame);
  }
  window.addEventListener('resize', setupCanvas);
  requestAnimationFrame(loop);
})();
