// ============================================================
// ZBD — classic arcade pixel cursor
// A retro crosshair/arrow sprite that follows the mouse.
// Disabled on touch devices and when reduced motion is requested.
// ============================================================
(function () {
  if (window.matchMedia('(pointer:coarse)').matches) return;

  // 15x15 pixel mini-sword, tip at top-left (the hotspot), scaled 2x via CSS.
  const SIZE = 15, SCALE = 2;
  const cv = document.createElement('canvas');
  cv.id = 'pixel-cursor';
  cv.width = SIZE; cv.height = SIZE;
  cv.style.width = (SIZE * SCALE) + 'px';
  cv.style.height = (SIZE * SCALE) + 'px';
  const x = cv.getContext('2d');

  // colours pulled from the page theme
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue('--accent').trim() || '#ffcc33';
  const dark = '#05030a';
  const blade = '#e8eefb';   // steel
  const grip  = '#7a5230';   // leather/wood handle

  // 1 = dark outline · 2 = blade · 3 = gold guard/pommel · 4 = grip
  const M = [
    '210000000000000',
    '021000000000000',
    '002100000000000',
    '000210000000000',
    '000021000000000',
    '000002100000000',
    '000000210030000',
    '000000021300000',
    '000000002100000',
    '000000030400000',
    '000000300040000',
    '000000000004000',
    '000000000000300',
    '000000000000000',
    '000000000000000',
  ];
  function paint(hot) {
    x.clearRect(0, 0, SIZE, SIZE);
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++) {
        const v = M[r][c];
        if (v === '1') x.fillStyle = dark;
        else if (v === '2') x.fillStyle = hot ? '#ffffff' : blade;
        else if (v === '3') x.fillStyle = accent;
        else if (v === '4') x.fillStyle = grip;
        else continue;
        x.fillRect(c, r, 1, 1);
      }
  }
  paint(false);
  document.body.appendChild(cv);
  document.body.classList.add('pixel-cursor-on');
  cv.style.display = 'block';

  let tx = -50, ty = -50, hot = false;
  document.addEventListener('mousemove', (e) => {
    tx = e.clientX; ty = e.clientY;
    cv.style.transform = `translate(${tx - 1}px, ${ty - 1}px)`;
    // highlight (white tip) over interactive elements
    const t = e.target;
    const h = !!(t && t.closest && t.closest('a,button,.btn,.product,.service,canvas,input,[role="button"]'));
    if (h !== hot) { hot = h; paint(hot); }
  }, { passive: true });

  document.addEventListener('mousedown', () => { cv.style.transform += ' scale(.8)'; });
  document.addEventListener('mouseup', () => {
    cv.style.transform = `translate(${tx - 1}px, ${ty - 1}px)`;
  });
  document.addEventListener('mouseleave', () => { cv.style.display = 'none'; });
  document.addEventListener('mouseenter', () => { cv.style.display = 'block'; });
})();
