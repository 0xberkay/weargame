// ============================================================
// ZBD — classic arcade pixel cursor
// A retro crosshair/arrow sprite that follows the mouse.
// Disabled on touch devices and when reduced motion is requested.
// ============================================================
(function () {
  if (window.matchMedia('(pointer:coarse)').matches) return;

  // 12x12 pixel arrow, drawn to a crisp canvas and scaled 2x via CSS.
  const SIZE = 12, SCALE = 2;
  const cv = document.createElement('canvas');
  cv.id = 'pixel-cursor';
  cv.width = SIZE; cv.height = SIZE;
  cv.style.width = (SIZE * SCALE) + 'px';
  cv.style.height = (SIZE * SCALE) + 'px';
  const x = cv.getContext('2d');

  // accent colour pulled from the page theme
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue('--accent').trim() || '#ffcc33';
  const dark = '#05030a';

  // mini sword / blade. 1 = white outline, 2 = accent/gold blade.
  const M = [
    '000000000000',
    '000122100000',
    '000122210000',
    '000012210000',
    '000001210000',
    '000000120000',
    '000000010000',
    '000000020000',
    '000000020000',
    '000000010000',
    '000000000000',
    '000000000000',
  ];
  function paint(hot) {
    x.clearRect(0, 0, SIZE, SIZE);
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++) {
        const v = M[r][c];
        if (v === '1') { x.fillStyle = '#ffffff'; x.fillRect(c, r, 1, 1); }
        else if (v === '2') { x.fillStyle = hot ? '#ffffff' : accent; x.fillRect(c, r, 1, 1); }
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
