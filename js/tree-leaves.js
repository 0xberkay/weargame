// Wind-blown falling leaves for the logo tree.
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var host = document.getElementById('leaves');
  if (!host) return;

  // leaves drop from branch tips (relative %)
  var tips = [
    [59, 14], [37, 14], [49, 13], [77, 24], [29, 39], [68, 37]
  ];
  var shades = ['#e9e6df', '#cfcabd', '#f4f2ec', '#b9b3a4'];

  function spawn() {
    var tip = tips[(Math.random() * tips.length) | 0];
    var leaf = document.createElement('span');
    leaf.className = 'leaf';
    var wind = (Math.random() * 140 + 40) * (Math.random() < 0.5 ? -1 : 1); // gust dir
    leaf.style.left = tip[0] + '%';
    leaf.style.top = tip[1] + '%';
    leaf.style.background = shades[(Math.random() * shades.length) | 0];
    leaf.style.setProperty('--wind', wind + 'px');
    var dur = Math.random() * 3 + 4;
    leaf.style.animationDuration = dur + 's';
    var s = Math.random() * 0.6 + 0.7;
    leaf.style.width = leaf.style.height = (11 * s) + 'px';
    host.appendChild(leaf);
    setTimeout(function () { leaf.remove(); }, dur * 1000 + 100);
  }

  var timer;
  function loop() {
    spawn();
    timer = setTimeout(loop, Math.random() * 600 + 400);
  }

  // only animate when section visible (perf)
  var sec = document.querySelector('.tree-section');
  if ('IntersectionObserver' in window && sec) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !timer) loop();
        else if (!e.isIntersecting && timer) { clearTimeout(timer); timer = null; }
      });
    }, { threshold: 0.1 }).observe(sec);
  } else {
    loop();
  }
})();
