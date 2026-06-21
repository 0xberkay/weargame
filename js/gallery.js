// ============================================================
// ZBD — graceful image gallery
// App icons and screenshot frames stay hidden until their image
// actually loads, so missing files never show a broken icon.
// Drop the files into the app folder and they appear automatically.
// ============================================================
(function () {
  // App icon: hide until it loads.
  document.querySelectorAll('img.app-icon').forEach((img) => {
    const show = () => { img.style.display = ''; };
    img.style.display = 'none';
    if (img.complete && img.naturalWidth) show();
    img.addEventListener('load', show);
    img.addEventListener('error', () => { img.style.display = 'none'; });
  });

  // Screenshot sections: reveal a shot when its image loads; reveal the
  // whole section if at least one shot is present; otherwise keep it hidden.
  document.querySelectorAll('.screens').forEach((section) => {
    section.style.display = 'none';
    let alive = 0;
    const shots = section.querySelectorAll('.shot');
    shots.forEach((shot) => {
      const img = shot.querySelector('img');
      shot.style.display = 'none';
      if (!img) return;
      const ok = () => { shot.style.display = ''; section.style.display = ''; alive++; };
      const fail = () => { shot.style.display = 'none'; };
      if (img.complete) { img.naturalWidth ? ok() : fail(); }
      img.addEventListener('load', ok);
      img.addEventListener('error', fail);
    });
  });
})();
