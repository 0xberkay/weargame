// ============================================================
// ZBD · Wear OS Studio — Three.js hero scene
// A central smartwatch with orbiting app-tinted watches + drifting sparks.
// ============================================================
import * as THREE from 'three';

const canvas = document.getElementById('three-canvas');

// Respect reduced motion: render a single still frame.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0b0810, 0.045);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0.4, 11);

// ---------- lights ----------
scene.add(new THREE.AmbientLight(0x4a4256, 0.9));
const keyLight = new THREE.DirectionalLight(0xffe7b8, 1.4);
keyLight.position.set(4, 6, 6);
scene.add(keyLight);
const rim = new THREE.PointLight(0xff7a3a, 1.6, 30);
rim.position.set(-6, 2, -4);
scene.add(rim);
const fill = new THREE.PointLight(0x3a7bff, 0.9, 30);
fill.position.set(6, -3, 4);
scene.add(fill);

// ============================================================
// Watch factory — a rounded body, glowing bezel ring and screen.
// ============================================================
function makeWatch(accent, screenColor) {
  const g = new THREE.Group();

  // body
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 0.42, 48),
    new THREE.MeshStandardMaterial({ color: 0x23252b, metalness: 0.85, roughness: 0.35 })
  );
  body.rotation.x = Math.PI / 2;
  g.add(body);

  // glowing bezel ring
  const bezel = new THREE.Mesh(
    new THREE.TorusGeometry(0.98, 0.07, 20, 64),
    new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.1, metalness: 0.6, roughness: 0.3 })
  );
  bezel.position.z = 0.22;
  g.add(bezel);

  // screen (emissive, faces +z)
  const screen = new THREE.Mesh(
    new THREE.CircleGeometry(0.9, 48),
    new THREE.MeshStandardMaterial({ color: screenColor, emissive: screenColor, emissiveIntensity: 0.55, roughness: 0.5 })
  );
  screen.position.z = 0.24;
  g.add(screen);

  // crown button
  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.18, 16),
    new THREE.MeshStandardMaterial({ color: accent, metalness: 0.8, roughness: 0.3 })
  );
  crown.rotation.z = Math.PI / 2;
  crown.position.set(1.02, 0.3, 0.1);
  g.add(crown);

  // straps
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x1a1c22, metalness: 0.4, roughness: 0.7 });
  const strapGeo = new THREE.BoxGeometry(0.8, 0.7, 0.18);
  const top = new THREE.Mesh(strapGeo, strapMat); top.position.set(0, 1.25, 0); g.add(top);
  const bot = new THREE.Mesh(strapGeo, strapMat); bot.position.set(0, -1.25, 0); g.add(bot);

  return g;
}

// app accent palette (matches the cards)
const apps = [
  { accent: 0xe3bb63, screen: 0x2a1c12 }, // Gate of Anatolia
  { accent: 0x27e07a, screen: 0x06170f }, // WearSSH
  { accent: 0x1fd6a6, screen: 0x07221c }, // Vakit Wear
  { accent: 0xff49d0, screen: 0x1c0726 }, // Wear Disco
];

// central hero watch (gold)
const hero = makeWatch(0xf7e2a6, 0x140f08);
hero.scale.setScalar(1.55);
scene.add(hero);

// orbiting watches
const orbiters = [];
const ORBIT_R = 4.4;
apps.forEach((a, i) => {
  const w = makeWatch(a.accent, a.screen);
  w.scale.setScalar(0.62);
  const angle = (i / apps.length) * Math.PI * 2;
  w.userData = { angle, speed: 0.18 + i * 0.015, tilt: (i % 2 ? 1 : -1) * 0.5 };
  orbiters.push(w);
  scene.add(w);
});

// ---------- drifting sparks (embers) ----------
const SPARKS = 260;
const sp = new Float32Array(SPARKS * 3);
const spd = new Float32Array(SPARKS);
for (let i = 0; i < SPARKS; i++) {
  sp[i * 3] = (Math.random() - 0.5) * 26;
  sp[i * 3 + 1] = (Math.random() - 0.5) * 18;
  sp[i * 3 + 2] = (Math.random() - 0.5) * 14 - 2;
  spd[i] = 0.004 + Math.random() * 0.012;
}
const sparkGeo = new THREE.BufferGeometry();
sparkGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
  color: 0xf7c873, size: 0.07, transparent: true, opacity: 0.8,
  blending: THREE.AdditiveBlending, depthWrite: false,
}));
scene.add(sparks);

// ============================================================
// interaction + resize
// ============================================================
const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
window.addEventListener('pointermove', (e) => {
  pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
  pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
});

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
  const dt = Math.min(0.05, clock.getDelta());

  // smooth pointer parallax
  pointer.x += (pointer.tx - pointer.x) * 0.05;
  pointer.y += (pointer.ty - pointer.y) * 0.05;

  if (!reduceMotion) {
    hero.rotation.y = Math.sin(t * 0.3) * 0.5 + pointer.x * 0.4;
    hero.rotation.x = pointer.y * 0.25 + Math.sin(t * 0.5) * 0.06;
    hero.position.y = Math.sin(t * 0.8) * 0.18;

    orbiters.forEach((w) => {
      const u = w.userData;
      u.angle += dt * u.speed;
      w.position.set(
        Math.cos(u.angle) * ORBIT_R,
        Math.sin(u.angle * 1.3) * 1.3 + u.tilt,
        Math.sin(u.angle) * ORBIT_R * 0.5 - 1
      );
      w.rotation.y = u.angle + Math.PI / 2;
      w.rotation.z = Math.sin(t + u.angle) * 0.15;
    });

    // sparks rise & wrap
    const pos = sparkGeo.attributes.position.array;
    for (let i = 0; i < SPARKS; i++) {
      pos[i * 3 + 1] += spd[i];
      if (pos[i * 3 + 1] > 9) pos[i * 3 + 1] = -9;
    }
    sparkGeo.attributes.position.needsUpdate = true;
    sparks.rotation.y = t * 0.02;
  }

  camera.position.x += (pointer.x * 1.2 - camera.position.x) * 0.04;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}
frame();
