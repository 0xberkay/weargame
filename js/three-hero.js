// ============================================================
// ZBD · Wear OS Studio — Three.js hero scene
// ONE central smartwatch you can spin (drag + inertia + idle drift),
// with a mini app launcher rendered on its screen. Click an app
// tile to open that app's page.
// ============================================================
import * as THREE from 'three';

const canvas = document.getElementById('three-canvas');

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
// app data — accent + launcher tile + link
// ============================================================
const apps = [
  { name: 'Anatolia', accent: '#e3bb63', glyph: '🏰', href: 'apps/anatolia/' },
  { name: 'WearSSH',  accent: '#27e07a', glyph: '⌘',  href: 'apps/wearssh/' },
  { name: 'Vakit',    accent: '#1fd6a6', glyph: '☾',  href: 'apps/vakitwear/' },
  { name: 'Disco',    accent: '#ff49d0', glyph: '✦',  href: 'apps/weardisco/' },
];

// ============================================================
// launcher tile texture — drawn on a 2D canvas
// ============================================================
function tileTexture(app) {
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const x = c.getContext('2d');

  // rounded background with accent glow
  const r = 54;
  x.fillStyle = '#0c0a12';
  roundRect(x, 8, 8, s - 16, s - 16, r);
  x.fill();

  const grad = x.createRadialGradient(s / 2, s * 0.38, 20, s / 2, s / 2, s * 0.7);
  grad.addColorStop(0, app.accent);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  x.globalAlpha = 0.45;
  roundRect(x, 8, 8, s - 16, s - 16, r);
  x.fill();
  x.fillStyle = grad;
  roundRect(x, 8, 8, s - 16, s - 16, r);
  x.fill();
  x.globalAlpha = 1;

  // accent border
  x.lineWidth = 6;
  x.strokeStyle = app.accent;
  roundRect(x, 11, 11, s - 22, s - 22, r - 3);
  x.stroke();

  // glyph
  x.fillStyle = '#fff';
  x.font = '120px "Sora", system-ui, sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(app.glyph, s / 2, s * 0.43);

  // label
  x.font = '600 34px "Sora", system-ui, sans-serif';
  x.fillStyle = '#e8eaf5';
  x.fillText(app.name, s / 2, s * 0.82);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

function roundRect(x, px, py, w, h, r) {
  x.beginPath();
  x.moveTo(px + r, py);
  x.arcTo(px + w, py, px + w, py + h, r);
  x.arcTo(px + w, py + h, px, py + h, r);
  x.arcTo(px, py + h, px, py, r);
  x.arcTo(px, py, px + w, py, r);
  x.closePath();
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

// ---------- launcher tiles (children of the screen, so they spin with it) ----------
const tiles = [];
const TILE = 0.5;       // tile size in watch-local units
const OFF = 0.4;        // grid offset from center
const grid = [
  [-OFF,  OFF], [OFF,  OFF],
  [-OFF, -OFF], [OFF, -OFF],
];
apps.forEach((app, i) => {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(TILE, TILE),
    new THREE.MeshBasicMaterial({ map: tileTexture(app), transparent: true })
  );
  m.position.set(grid[i][0], grid[i][1], 0.255);
  m.userData = { app, baseScale: 1, hover: 0 };
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
    hoverTile = pickTile();
    canvas.style.cursor = hoverTile ? 'pointer' : '';
  }
});

canvas.addEventListener('pointerup', (e) => {
  dragging = false;
  // cursor set via CSS
  // treat as click if pointer barely moved
  if (moved < 6) {
    setNDC(e);
    const t = pickTile();
    if (t) window.location.href = t.userData.app.href;
  }
});

canvas.addEventListener('pointerleave', () => { dragging = false; hoverTile = null; });
// cursor set via CSS

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

  // tile hover pop
  tiles.forEach((m) => {
    const target = (m === hoverTile && !dragging) ? 1 : 0;
    m.userData.hover += (target - m.userData.hover) * 0.18;
    const s = 1 + m.userData.hover * 0.16;
    m.scale.setScalar(s);
    m.position.z = 0.255 + m.userData.hover * 0.03;
  });

  renderer.render(scene, camera);
}
frame();
