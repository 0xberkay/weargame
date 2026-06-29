// ============================================================
// ZBD · Wear OS Studio — Three.js hero scene
// ONE central smartwatch you can spin (drag + inertia + idle drift),
// with an Apple-Watch-style honeycomb of circular app icons on its
// screen. Click an icon to open that app's page.
// ============================================================
import * as THREE from 'three';

const canvas = document.getElementById('three-canvas');
const hintEl = document.getElementById('watch-hint');
const DEFAULT_HINT = hintEl ? hintEl.textContent : '';

// Respect reduced motion: render a single still frame.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0b0810, 0.04);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 0.1, 9);

// ---------- lights ----------
scene.add(new THREE.AmbientLight(0x4a4256, 1.0));
const keyLight = new THREE.DirectionalLight(0xffe7b8, 1.5);
keyLight.position.set(4, 6, 6);
scene.add(keyLight);
const rim = new THREE.PointLight(0xff7a3a, 1.6, 30);
rim.position.set(-6, 2, -4);
scene.add(rim);
const fill = new THREE.PointLight(0x3a7bff, 1.0, 30);
fill.position.set(6, -3, 4);
scene.add(fill);

// ============================================================
// app data — accent + drawn glyph + link
// Real Play-Store icons are gated behind auth; these vector glyphs
// reproduce each app's brand mark so they can be swapped 1:1 later.
// ============================================================
const apps = [
  { name: 'Gate of Anatolia', accent: '#e3bb63', href: 'apps/anatolia/',  draw: drawSword   },
  { name: 'WearSSH',          accent: '#27e07a', href: 'apps/wearssh/',   draw: drawTerminal},
  { name: 'Vakit Wear',       accent: '#1fd6a6', href: 'apps/vakitwear/', draw: drawCrescent},
  { name: 'Wear Disco',       accent: '#ff49d0', href: 'apps/weardisco/', draw: drawSparkle },
  { name: 'Wet Watch',        accent: '#00cfff', href: 'apps/wetwatch/',  draw: drawDrop    },
];

// ---------- colour helpers ----------
function hexToRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function mix(h, t, a) { const [r, g, b] = hexToRgb(h); return `rgb(${Math.round(r + (t - r) * a)},${Math.round(g + (t - g) * a)},${Math.round(b + (t - b) * a)})`; }
const lighten = (h, a) => mix(h, 255, a);
const darken  = (h, a) => mix(h, 0, a);

// ============================================================
// circular app-icon texture — drawn on a 2D canvas (Apple-Watch look)
// ============================================================
function iconTexture(app) {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const x = c.getContext('2d');
  const cx = s / 2, r = s * 0.47;

  // base disc with vertical depth gradient
  const g = x.createLinearGradient(0, cx - r, 0, cx + r);
  g.addColorStop(0, lighten(app.accent, 0.30));
  g.addColorStop(1, darken(app.accent, 0.34));
  x.fillStyle = g;
  x.beginPath(); x.arc(cx, cx, r, 0, 7); x.fill();

  // soft top sheen
  const sheen = x.createRadialGradient(cx, cx - r * 0.55, 4, cx, cx - r * 0.4, r * 1.4);
  sheen.addColorStop(0, 'rgba(255,255,255,0.40)');
  sheen.addColorStop(0.55, 'rgba(255,255,255,0)');
  x.fillStyle = sheen;
  x.beginPath(); x.arc(cx, cx, r, 0, 7); x.fill();

  // crisp rim
  x.lineWidth = s * 0.014;
  x.strokeStyle = 'rgba(255,255,255,0.30)';
  x.beginPath(); x.arc(cx, cx, r - x.lineWidth / 2, 0, 7); x.stroke();

  // white glyph (with a subtle drop shadow for legibility)
  x.save();
  x.translate(cx, cx);
  x.fillStyle = '#fff';
  x.strokeStyle = '#fff';
  x.shadowColor = 'rgba(0,0,0,0.30)';
  x.shadowBlur = s * 0.03;
  x.shadowOffsetY = s * 0.012;
  app.draw(x, s);
  x.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

// ---------- per-app glyphs (origin at icon centre, white fill/stroke) ----------
function drawSword(x, s) {
  const u = s / 256;
  // blade
  x.beginPath();
  x.moveTo(0, -78 * u);
  x.lineTo(11 * u, -54 * u);
  x.lineTo(11 * u, 42 * u);
  x.lineTo(-11 * u, 42 * u);
  x.lineTo(-11 * u, -54 * u);
  x.closePath(); x.fill();
  // crossguard
  x.fillRect(-34 * u, 42 * u, 68 * u, 14 * u);
  // grip
  x.fillRect(-7 * u, 56 * u, 14 * u, 34 * u);
  // pommel
  x.beginPath(); x.arc(0, 96 * u, 11 * u, 0, 7); x.fill();
}

function drawTerminal(x, s) {
  const u = s / 256;
  x.lineWidth = 16 * u; x.lineJoin = 'round'; x.lineCap = 'round';
  // chevron ">"
  x.beginPath();
  x.moveTo(-40 * u, -34 * u);
  x.lineTo(-2 * u, 4 * u);
  x.lineTo(-40 * u, 42 * u);
  x.stroke();
  // underscore prompt
  x.fillRect(8 * u, 30 * u, 46 * u, 14 * u);
}

function drawCrescent(x, s) {
  const u = s / 256;
  x.save();
  x.beginPath(); x.arc(4 * u, 0, 62 * u, 0, 7); x.fill();
  // carve the inner circle to leave a crescent
  x.globalCompositeOperation = 'destination-out';
  x.beginPath(); x.arc(28 * u, -10 * u, 54 * u, 0, 7); x.fill();
  x.restore();
}

function drawSparkle(x, s) {
  const u = s / 256;
  const star = (cx, cy, R) => {
    const r = R * 0.32;
    x.beginPath();
    x.moveTo(cx, cy - R);
    x.quadraticCurveTo(cx + r * 0.4, cy - r * 0.4, cx + R, cy);
    x.quadraticCurveTo(cx + r * 0.4, cy + r * 0.4, cx, cy + R);
    x.quadraticCurveTo(cx - r * 0.4, cy + r * 0.4, cx - R, cy);
    x.quadraticCurveTo(cx - r * 0.4, cy - r * 0.4, cx, cy - R);
    x.closePath(); x.fill();
  };
  star(-8 * u, -6 * u, 60 * u);
  star(46 * u, 44 * u, 26 * u);
  star(-46 * u, 40 * u, 18 * u);
}

function drawDrop(x, s) {
  const u = s / 256;
  x.beginPath();
  x.moveTo(0, -74 * u);
  x.bezierCurveTo(46 * u, -14 * u, 52 * u, 24 * u, 52 * u, 36 * u);
  x.arc(0, 36 * u, 52 * u, 0, Math.PI, false);
  x.bezierCurveTo(-52 * u, 24 * u, -46 * u, -14 * u, 0, -74 * u);
  x.closePath(); x.fill();
  // highlight
  x.save();
  x.globalAlpha = 0.45;
  x.beginPath(); x.ellipse(-16 * u, 24 * u, 9 * u, 16 * u, -0.3, 0, 7); x.fillStyle = '#fff'; x.fill();
  x.restore();
}

// ============================================================
// the watch
// ============================================================
const watch = new THREE.Group();
scene.add(watch);

// body
const body = new THREE.Mesh(
  new THREE.CylinderGeometry(1, 1, 0.42, 64),
  new THREE.MeshStandardMaterial({ color: 0x23252b, metalness: 0.9, roughness: 0.32 })
);
body.rotation.x = Math.PI / 2;
watch.add(body);

// glowing bezel
const bezel = new THREE.Mesh(
  new THREE.TorusGeometry(0.98, 0.07, 24, 96),
  new THREE.MeshStandardMaterial({ color: 0xf7e2a6, emissive: 0xf7c873, emissiveIntensity: 1.0, metalness: 0.7, roughness: 0.28 })
);
bezel.position.z = 0.22;
watch.add(bezel);

// dark screen base
const screen = new THREE.Mesh(
  new THREE.CircleGeometry(0.92, 64),
  new THREE.MeshStandardMaterial({ color: 0x05040a, emissive: 0x0a0814, emissiveIntensity: 0.6, roughness: 0.5 })
);
screen.position.z = 0.24;
watch.add(screen);

// crown
const crown = new THREE.Mesh(
  new THREE.CylinderGeometry(0.07, 0.07, 0.18, 20),
  new THREE.MeshStandardMaterial({ color: 0xf7e2a6, metalness: 0.85, roughness: 0.28 })
);
crown.rotation.z = Math.PI / 2;
crown.position.set(1.02, 0.3, 0.1);
watch.add(crown);

// straps
const strapMat = new THREE.MeshStandardMaterial({ color: 0x1a1c22, metalness: 0.4, roughness: 0.7 });
const strapGeo = new THREE.BoxGeometry(0.8, 0.7, 0.18);
const topStrap = new THREE.Mesh(strapGeo, strapMat); topStrap.position.set(0, 1.25, 0); watch.add(topStrap);
const botStrap = new THREE.Mesh(strapGeo, strapMat); botStrap.position.set(0, -1.25, 0); watch.add(botStrap);

watch.scale.setScalar(2.1);

// ---------- honeycomb of circular app icons (children of the watch, so they spin with it) ----------
const tiles = [];
const TILE = 0.37;        // icon diameter in watch-local units
// Apple-Watch-style honeycomb: two icons over three, half-offset rows
const grid = [
  [-0.205,  0.27], [0.205,  0.27],
  [-0.41,  -0.10], [0.0,   -0.10], [0.41, -0.10],
];
apps.forEach((app, i) => {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(TILE, TILE),
    new THREE.MeshBasicMaterial({ map: iconTexture(app), transparent: true })
  );
  m.position.set(grid[i][0], grid[i][1], 0.255);
  m.userData = { app, hover: 0 };
  tiles.push(m);
  watch.add(m);
});

// ---------- drifting sparks ----------
const SPARKS = 220;
const sp = new Float32Array(SPARKS * 3);
const spd = new Float32Array(SPARKS);
for (let i = 0; i < SPARKS; i++) {
  sp[i * 3] = (Math.random() - 0.5) * 16;
  sp[i * 3 + 1] = (Math.random() - 0.5) * 16;
  sp[i * 3 + 2] = (Math.random() - 0.5) * 12 - 3;
  spd[i] = 0.004 + Math.random() * 0.012;
}
const sparkGeo = new THREE.BufferGeometry();
sparkGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
  color: 0x22d3c5, size: 0.07, transparent: true, opacity: 0.7,
  blending: THREE.AdditiveBlending, depthWrite: false,
}));
scene.add(sparks);

// ============================================================
// interaction — drag to spin (with inertia) + click to open app
// ============================================================
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

// rotation state
let rotY = 0, rotX = 0;          // current
let velY = 0, velX = 0;          // angular velocity
let dragging = false;
let moved = 0;
let last = { x: 0, y: 0 };
let hoverTile = null;

function setHint(t) { if (hintEl) hintEl.textContent = t; }

function setNDC(e) {
  const rect = canvas.getBoundingClientRect();
  ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

function pickTile() {
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(tiles, false)[0];
  return hit ? hit.object : null;
}

canvas.addEventListener('pointerdown', (e) => {
  dragging = true;
  moved = 0;
  last.x = e.clientX; last.y = e.clientY;
  velY = velX = 0;
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  setNDC(e);

  if (dragging) {
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    last.x = e.clientX; last.y = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    velY = dx * 0.006;
    velX = dy * 0.004;
    rotY += velY;
    rotX += velX;
  } else {
    const prev = hoverTile;
    hoverTile = pickTile();
    canvas.style.cursor = hoverTile ? 'pointer' : '';
    if (hoverTile !== prev) setHint(hoverTile ? hoverTile.userData.app.name : DEFAULT_HINT);
  }
});

canvas.addEventListener('pointerup', (e) => {
  dragging = false;
  // treat as click if pointer barely moved
  if (moved < 6) {
    setNDC(e);
    const t = pickTile();
    if (t) window.location.href = t.userData.app.href;
  }
});

canvas.addEventListener('pointerleave', () => { dragging = false; hoverTile = null; setHint(DEFAULT_HINT); });

function resize() {
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ============================================================
// loop
// ============================================================
const clock = new THREE.Clock();
let visible = true;
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

function frame() {
  requestAnimationFrame(frame);
  if (!visible) return;

  const t = clock.getElapsedTime();

  if (!reduceMotion) {
    if (!dragging) {
      // inertia decay
      rotY += velY;
      rotX += velX;
      velY *= 0.94;
      velX *= 0.94;
      // gentle idle auto-spin + ease tilt back to level
      rotY += 0.0016;
      rotX += (0 - rotX) * 0.02;
    }

    // soft breathing bob
    watch.position.y = Math.sin(t * 0.8) * 0.12;

    // sparks rise & wrap
    const pos = sparkGeo.attributes.position.array;
    for (let i = 0; i < SPARKS; i++) {
      pos[i * 3 + 1] += spd[i];
      if (pos[i * 3 + 1] > 9) pos[i * 3 + 1] = -9;
    }
    sparkGeo.attributes.position.needsUpdate = true;
    sparks.rotation.y = t * 0.02;
  }

  // clamp vertical tilt so the screen never flips away
  rotX = Math.max(-0.6, Math.min(0.6, rotX));
  watch.rotation.y = rotY;
  watch.rotation.x = rotX;

  // icon hover pop
  tiles.forEach((m) => {
    const target = (m === hoverTile && !dragging) ? 1 : 0;
    m.userData.hover += (target - m.userData.hover) * 0.18;
    const s = 1 + m.userData.hover * 0.18;
    m.scale.setScalar(s);
    m.position.z = 0.255 + m.userData.hover * 0.04;
  });

  renderer.render(scene, camera);
}
frame();
