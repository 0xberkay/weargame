// ============================================================
// ZBD · Wear OS Studio — i18n + scroll reveal
// ============================================================
(function () {
  const I18N = {
    tr: {
      nav_apps: 'Uygulamalar', nav_demo: 'Oyun Demo',
      hero_tag: 'WEAR OS · BİLEĞİNDEKİ STÜDYO',
      hero_title: 'Bileğin için<br>tasarlandı',
      hero_sub: "SSH'tan namaz vakitlerine, disko ışıklarından destansı bir pixel oyuna — Wear OS için tasarlanmış uygulamalarım, tek bir yerde.",
      hero_explore: 'Uygulamaları Keşfet', hero_play: '▶ Oyunu Oyna', scroll: 'KAYDIR',
      apps_label: 'UYGULAMALARIM', apps_title: 'Wear OS Koleksiyonu',
      apps_desc: 'Her biri yuvarlak ekran için sıfırdan tasarlandı. Aşağıdaki canlı saat önizlemeleri gerçek zamanlı çizilir.',
      cat_game: 'OYUN', cat_tools: 'ARAÇLAR', cat_life: 'YAŞAM', cat_enter: 'EĞLENCE',
      app_gate: '24 bölümlük destansı pixel aksiyon-RPG. Malazgirt 1071 — bileğinde.',
      app_ssh: 'Bileğinden tam SSH terminali. Sunucularına bağlan, komut çalıştır — her yerden.',
      app_vakit: 'Namaz vakitleri, kıble pusulası ve zikirmatik. Tamamen çevrimdışı, complication destekli.',
      app_disco: 'Saatini akıcı renk geçişlerinden oluşan bir ışık şovuna çevir. Parti senin bileğinde.',
      btn_playdemo: '▶ Demoyu Oyna',
      demo_label: 'OYNANABİLİR DEMO', demo_title: 'Gate of Anatolia',
      demo_desc: 'Akıncılar geçidi tuttu. Onları sen savur — tıpkı saatindeki gibi.',
      hud_wave: 'DALGA', hud_score: 'PUAN',
      overlay_ready: 'Sefere Hazır mısın?', overlay_start: 'BAŞLA',
      overlay_controls: '◀ ▶ HAREKET · BOŞLUK ZIPLA · J / ENTER KILIÇ',
      overlay_gameover: 'Geçit Düştü', overlay_retry: 'TEKRAR OYNA',
      btn_jump: 'ZIP', btn_sword: 'KILIÇ',
      controls_info: 'MASAÜSTÜ: OK TUŞLARI + BOŞLUK + J · MOBİL: EKRAN TUŞLARI',
      footer_note: 'Wear OS için sevgiyle yapıldı · © 2026',
    },
    en: {
      nav_apps: 'Apps', nav_demo: 'Game Demo',
      hero_tag: 'WEAR OS · A STUDIO ON YOUR WRIST',
      hero_title: 'Built for<br>your wrist',
      hero_sub: 'From SSH to prayer times, disco lights to an epic pixel game — my apps, crafted for Wear OS, all in one place.',
      hero_explore: 'Explore the Apps', hero_play: '▶ Play the Game', scroll: 'SCROLL',
      apps_label: 'MY APPS', apps_title: 'The Wear OS Collection',
      apps_desc: 'Each one designed from scratch for the round display. The live watch previews below are rendered in real time.',
      cat_game: 'GAME', cat_tools: 'TOOLS', cat_life: 'LIFESTYLE', cat_enter: 'ENTERTAINMENT',
      app_gate: 'A 24-chapter epic pixel action-RPG. Manzikert 1071 — right on your wrist.',
      app_ssh: 'A full SSH terminal from your wrist. Connect to your servers and run commands — anywhere.',
      app_vakit: 'Prayer times, Qibla compass and tasbih counter. Fully offline, with watch-face complications.',
      app_disco: 'Turn your watch into a light show of smooth color transitions. The party is on your wrist.',
      btn_playdemo: '▶ Play Demo',
      demo_label: 'PLAYABLE DEMO', demo_title: 'Gate of Anatolia',
      demo_desc: "Raiders hold the pass. Sweep them away — right from your watch.",
      hud_wave: 'WAVE', hud_score: 'SCORE',
      overlay_ready: 'Ready for the Campaign?', overlay_start: 'START',
      overlay_controls: '◀ ▶ MOVE · SPACE JUMP · J / ENTER SWORD',
      overlay_gameover: 'The Gate Has Fallen', overlay_retry: 'PLAY AGAIN',
      btn_jump: 'JUMP', btn_sword: 'SWORD',
      controls_info: 'DESKTOP: ARROW KEYS + SPACE + J · MOBILE: ON-SCREEN BUTTONS',
      footer_note: 'Made with love for Wear OS · © 2026',
    },
  };

  let lang = (navigator.language || '').toLowerCase().startsWith('tr') ? 'tr' : 'en';
  const langBtn = document.getElementById('langBtn');

  function apply() {
    const dict = I18N[lang];
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const v = dict[node.dataset.i18n];
      if (v != null) node.innerHTML = v;
    });
    if (langBtn) langBtn.textContent = lang === 'tr' ? 'EN' : 'TR';
  }
  apply();

  if (langBtn) langBtn.addEventListener('click', () => { lang = lang === 'tr' ? 'en' : 'tr'; apply(); });

  // ---- scroll reveal ----
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    reveals.forEach((r) => io.observe(r));
  } else {
    reveals.forEach((r) => r.classList.add('in'));
  }
})();
