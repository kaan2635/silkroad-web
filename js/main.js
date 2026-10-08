// Giriş noktası: renderer, ana döngü, karakter oluşturma, kayıt (v2).
(function () {
  if (typeof THREE === 'undefined') {
    document.getElementById('error').style.display = 'flex';
    document.getElementById('start').classList.add('hidden');
    return;
  }
  if (CONFIG.isTouch) document.body.classList.add('touch');
  try { if (sessionStorage.getItem('srw-autostart') === '1') { document.getElementById('travel-t').textContent = ZONE.town; document.getElementById('travel').classList.remove('hidden'); } } catch (e) { /* yok */ }

  function boot() {

  const canvas = document.getElementById('game');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !CONFIG.isTouch, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, CONFIG.isTouch ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = CONFIG.isTouch ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;

  const camera = new THREE.PerspectiveCamera(55, 1, 0.3, 1200);
  const input = new Input(canvas);
  const world = new World();
  const player = new Player(world, 'Gezgin');
  const npcs = new NPCManager(world);
  const weather = new Weather(world);
  const monsters = new MonsterManager(world);
  const rig = new CameraRig(camera, input);
  const hud = new HUD(player, world, rig, camera);
  const combat = new Combat(player, monsters, world, camera);
  const hotbar = new Hotbar(player);
  hud.combat = combat; hud.mm = monsters; hud.hotbar = hotbar; combat.hud = hud; combat.hotbar = hotbar;
  const loot = new LootManager(world, player, hud);
  combat.loot = loot;
  const pets = new PetSystem(player, world, combat, loot, hud);
  const jobs = new JobSystem(player, world, monsters, combat, hud, loot);
  combat.pets = pets; combat.jobs = jobs; pets.jobs = jobs; hud.jobs = jobs; hud.pets = pets;
  player.onDeathMount = () => pets.toggleMount(false);
  const quests = new QuestManager(player, hud, world);
  quests.combat = combat; combat.quests = quests; loot.quests = quests; hud.quests = quests;
  const auto = new AutoHunt(player, combat, monsters, hotbar, loot, hud);
  combat.auto = auto;
  const autoBtn = document.getElementById('hb-auto');
  auto.onChange = on => autoBtn.classList.toggle('on', on);
  autoBtn.addEventListener('click', () => auto.toggle());
  window.addEventListener('keydown', e => { const a = document.activeElement; if (a && a.tagName === 'INPUT') return; if (e.code === 'KeyH' && started) auto.toggle(); });
  const social = new Social({ world, player, monsters, combat, hud, loot, jobs });
  combat.social = social;
  const events = new Events({ world, player, monsters, combat, hud, social, loot });
  combat.events = events;
  const wmap = new WorldMap(player, quests);
  const ui = new UI(player, hud, quests, wmap, combat, hotbar);
  quests.onChange = () => { npcs.refreshMarkers(quests); ui.refresh(); };
  combat.onLevel = lvl => { hotbar.upgradePots(lvl); ui.refresh(); social.onPlayerLevel(lvl); };
  ui.mm = monsters; ui.jobs = jobs; ui.pets = pets;
  initSocialUI(ui, social);
  initEventsUI(ui, events);
  auto.npcs = npcs; auto.pets = pets; auto.social = social;
  initBotUI(ui, auto);
  pets.onChange = () => ui.refresh();
  jobs.onChange = () => ui.refresh();
  monsters.announce = (title, sub, kind) => {
    hud.banner(title, sub, kind === 'kill' ? 'quest' : 'unique');
    hud.log(title + ' — ' + sub, 'lvl', kind === 'kill' ? '#8ef07a' : '#ff8ae8');
    SFX.play(kind === 'kill' ? 'questdone' : 'region');
  };
  npcs.refreshMarkers(quests);
  let pendingNpc = null;
  input.bindJoystick(document.getElementById('joy-zone'), document.getElementById('joy-knob'));

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const clock = new THREE.Clock();
  let started = false;
  let saveT = 0;

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    document.documentElement.style.setProperty('--vh', (h / 100) + 'px');   // iOS Safari: 100vh araç çubuklarının altına taşar
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  document.addEventListener('gesturestart', e => e.preventDefault());   // iOS sayfa yakınlaştırmasını engelle
  window.addEventListener('resize', resize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  resize();

  new SettingsUI({ renderer, scene: world.scene, resize, onReset: () => { try { localStorage.removeItem(CONFIG.saveKey); } catch (e) {} started = false; location.reload(); } });
  let stepD = 0, lastP = null;

  // --- Kayıt (localStorage) ---
  let travelTo = null;
  // Bölge değiştir: kaydet → yükleme ekranı → sayfayı yeniden kur (otomatik devam)
  function travel(zone, arrive) {
    if (travelTo || !ZONES[zone]) return;
    if (jobs.mission) { if (!travel._warn || Date.now() - travel._warn > 4000) { hud.log('Görevdeyken bölgeden çıkamazsın.', 'dmg'); travel._warn = Date.now(); } player.target = null; player.teleport(player.pos.x, player.pos.z + (player.pos.z < 0 ? 6 : -6)); return; }
    travelTo = { zone, arrive };
    if (ZONE.fw && zone !== 'forgotten') { try { sessionStorage.removeItem('srw-fw'); } catch (e) { /* yok */ } }
    if (zone !== CUR_ZONE_ID) { combat.deathPos = null; combat.recallPos = null; }
    save();
    try { sessionStorage.setItem('srw-autostart', '1'); } catch (e) { /* yok */ }
    document.getElementById('travel-t').textContent = ZONES[zone].town;
    document.getElementById('travel-s').textContent = 'İpek Yolu boyunca yolculuk…';
    document.getElementById('travel').classList.remove('hidden');
    started = false;
    setTimeout(() => location.reload(), 600);
  }
  combat.travel = travel;
  ui.onTravel = (zone, arrive) => {
    if (jobs.cargoCount() || jobs.mission) { hud.log('Kervanla / görevdeyken ışınlanamazsın. Yolun ucundaki kapıdan yürü.', 'dmg'); player.stats.gold += (ZONE.tele.find(t => t.zone === zone) || { cost: 0 }).cost; return; }
    if (player.combatT > 0) { hud.log('Savaştayken ışınlanamazsın.', 'dmg'); player.stats.gold += (ZONE.tele.find(t => t.zone === zone) || { cost: 0 }).cost; return; }
    ui.closeNpc(); travel(zone, arrive);
  };

  function loadSave() {
    try { return JSON.parse(localStorage.getItem(CONFIG.saveKey)) || null; } catch (e) { return null; }
  }
  function save() {
    try {
      const s = player.stats;
      localStorage.setItem(CONFIG.saveKey, JSON.stringify({
        v: 2, name: player.name, race: player.race, x: player.pos.x, z: player.pos.z,
        level: s.level, exp: s.exp, gold: s.gold, silk: s.silk || 0, day: lastDay, str: s.str, int: s.int, statPts: s.statPts, zerk: s.zerk,
        hp: Math.round(s.hp), mp: Math.round(s.mp),
        inv: player.inv.serialize(), book: player.book.serialize(), hotbar: hotbar.serialize(),
        tod: world.timeOfDay, quests: quests.serialize(), death: combat.deathPos, recall: combat.recallPos,
        zone: travelTo ? travelTo.zone : CUR_ZONE_ID, arrive: travelTo ? travelTo.arrive : null,
        jobs: jobs.serialize(), pets: pets.serialize(), social: social.serialize(), events: events.serialize()
      }));
    } catch (e) { /* özel pencere vb. */ }
    Eco.save();
  }

  // Kayıttan yükle (v1 → v2 göçü dahil)
  let afterLoad = null, lastDay = '';
  function applySave(sv) {
    const s = player.stats;
    player.setRace(sv.race || 'ch');
    s.level = clamp(sv.level | 0 || 1, 1, MAX_LEVEL);
    s.maxExp = expToNext(s.level);
    s.exp = clamp(sv.exp | 0, 0, s.maxExp - 1);
    s.gold = Math.max(0, sv.gold | 0);
    if (sv.v === 2) {
      s.str = Math.max(20, sv.str | 0); s.int = Math.max(20, sv.int | 0);
      s.statPts = Math.max(0, sv.statPts | 0); s.zerk = clamp(+sv.zerk || 0, 0, ZERK_MAX);
      s.silk = sv.silk === undefined ? 100 : Math.max(0, sv.silk | 0);      // Item Mall öncesi kayıtlara 100 Silk
      lastDay = sv.day || '';
      player.inv.load(sv.inv || {});
      player.book.load(sv.book);
      hotbar.load(sv.hotbar);
      combat.deathPos = sv.death || null; combat.recallPos = sv.recall || null;
      afterLoad = () => { jobs.load(sv.jobs); pets.load(sv.pets); social.load(sv.social); events.load(sv.events); };
    } else {
      // Eski (Faz 2–4) kayıt: seviye, altın ve görevler korunur; yeni sistemlere göre başlangıç seti ve puanlar verilir
      s.str = 20 + (s.level - 1); s.int = 20 + (s.level - 1); s.statPts = 3 * (s.level - 1);
      player.inv.starter('blade');
      s.gold = Math.max(200, sv.gold | 0);
      if (sv.hpPots) player.inv.addStack('hp1', clamp(sv.hpPots | 0, 0, 250));
      if (sv.mpPots) player.inv.addStack('mp1', clamp(sv.mpPots | 0, 0, 250));
      if (sv.stones) player.inv.addStack('elx_w', clamp(Math.ceil(sv.stones / 2), 0, 20));
      player.book.sp = 20 + 15 * (s.level - 1);
      s.silk = 100;
      hud.log('Kaydın yeni sisteme taşındı: stat puanlarını (C) ve SP\'ni (K) dağıt!', 'lvl');
    }
    player.recalc();
    s.hp = isFinite(sv.hp) && sv.hp > 0 ? Math.min(s.maxHp, sv.hp) : s.maxHp;
    s.mp = isFinite(sv.mp) ? Math.min(s.maxMp, sv.mp) : s.maxMp;
    player.refreshLook();
  }

  // --- Başlangıç ekranı / karakter oluşturma ---
  const startScreen = document.getElementById('start');
  const nameInput = document.getElementById('name-input');
  const startBtn = document.getElementById('start-btn');
  const note = document.getElementById('continue-note'), create = document.getElementById('create');
  const saved = loadSave();
  let pickW = 'blade', pickA = 'protector', pickR = 'ch';
  const RACE_NOTE = { ch: 'Çinliler 7 ustalıktan istediklerini birleştirir (toplam sınır seviye ×3). Silah: kılıç, bıçak, mızrak, pala, yay.',
    eu: 'Avrupalılar 6 sınıftan en çok ikisini seçer: ana + yan sınıf (Savaşçı, Haydut, Büyücü, Lanetçi, Rahip, Ozan; toplam sınır seviye ×2).' };
  const setRacePick = r => {
    pickR = r;
    for (const id of ['pick-w', 'pick-a']) for (const b of document.getElementById(id).children) b.classList.toggle('hidden', b.dataset.race !== r);
    const fw = document.querySelector('#pick-w button[data-race="' + r + '"]'), fa = document.querySelector('#pick-a button[data-a="' + (r === 'eu' ? 'light' : 'protector') + '"]');
    if (!WEAPON_TYPES[pickW] || WEAPON_TYPES[pickW].race !== r) { pickW = fw.dataset.w; for (const b of fw.parentNode.children) b.classList.toggle('on', b === fw); }
    if (!ARMOR_TYPES[pickA] || ARMOR_TYPES[pickA].race !== r) { pickA = fa.dataset.a; for (const b of fa.parentNode.children) b.classList.toggle('on', b === fa); }
    document.getElementById('race-note').textContent = RACE_NOTE[r];
  };
  const chip = (id, attr, set) => document.getElementById(id).addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    for (const x of b.parentNode.children) x.classList.toggle('on', x === b);
    set(b.dataset[attr]); SFX.init(); SFX.play('tab');
  });
  chip('pick-w', 'w', v => { pickW = v; });
  chip('pick-a', 'a', v => { pickA = v; });
  chip('pick-r', 'r', v => setRacePick(v));
  const refreshStart = () => {
    const same = saved && saved.name && !saved.newChar && saved.name === (nameInput.value || '').trim();
    create.classList.toggle('hidden', !!same);
    note.textContent = same ? 'Kayıtlı karakter: ' + saved.name + ' (Sv. ' + (saved.level || 1) + ') — devam edilecek.' : (saved && saved.name ? 'Yeni ad = yeni karakter (' + saved.name + ' kaydının üzerine yazılır).' : '');
    startBtn.textContent = same ? 'Devam Et' : 'Karakteri Oluştur';
  };
  if (saved && saved.name) nameInput.value = saved.name;
  if (saved && saved.newChar) { nameInput.value = saved.newChar.name; pickW = saved.newChar.w || 'blade'; pickA = saved.newChar.a || 'protector'; pickR = saved.newChar.r || 'ch'; }
  { const rb = document.querySelector('#pick-r button[data-r="' + pickR + '"]'); for (const b of rb.parentNode.children) b.classList.toggle('on', b === rb); setRacePick(pickR); }
  nameInput.addEventListener('input', refreshStart);
  refreshStart();
  let autostart = false;
  try { autostart = sessionStorage.getItem('srw-autostart') === '1'; sessionStorage.removeItem('srw-autostart'); } catch (e) { /* yok */ }

  function start() {
    if (started) return;
    const name = (nameInput.value || '').trim() || 'Gezgin';
    const sameChar = saved && saved.name === name && !saved.newChar;
    const home = pickR === 'eu' ? 'constantinople' : 'jangan';
    if (!sameChar && CUR_ZONE_ID !== home) {          // yeni karakter ırkının başkentinde başlar (Jangan / Konstantinopolis)
      try {
        localStorage.setItem(CONFIG.saveKey, JSON.stringify({ v: 2, newChar: { name, w: pickW, a: pickA, r: pickR }, zone: home }));
        sessionStorage.setItem('srw-autostart', '1');
      } catch (e) { /* yok */ }
      location.reload(); return;
    }
    if (sameChar) applySave(saved);
    else {
      player.setRace(pickR);
      player.inv.starter(pickW, pickA);
      player.book.sp = 40;
      player.stats.silk = 100;
      player.inv.add(makeStack('pet_grab', 1));
      hotbar.reset();
      hotbar.pages[1][0] = { t: 'it', base: 'pet_grab' };
      player.refreshLook();
      player.teleport(0, 7);
    }
    player.setName(name);
    Eco.load(name);
    auto.loadCfg();
    if (sameChar && isFinite(saved.x) && isFinite(saved.z)) player.teleport(saved.x, saved.z);
    if (sameChar && saved.arrive) {
      const z = saved.arrive === 'S' ? 258 : saved.arrive === 'N' ? -258 : 7;
      player.teleport(saved.arrive === 'T' ? 0 : roadCenterX(z), z);
      if (saved.arrive !== 'T') { rig.yaw = saved.arrive === 'S' ? 0 : Math.PI; player.heading = saved.arrive === 'S' ? Math.PI : 0; }
      setTimeout(() => hud.banner(ZONE.name, (IS_DUNGEON ? ZONE.lv : ZONE.rings[0].lv.replace(/–.*/, '') + '+ bölgesi') + ' · ' + regionAt(player.pos.x, player.pos.z), 'region'), 400);
    }
    if (sameChar) { quests.load(saved.quests); if (isFinite(saved.tod)) world.timeOfDay = clamp(saved.tod, 0, 0.9999); }
    hotbar.upgradePots(player.stats.level);
    if (afterLoad) { afterLoad(); afterLoad = null; }
    npcs.refreshMarkers(quests);
    SFX.init(); SFX.play('ui');
    startScreen.classList.add('hidden');
    document.getElementById('travel').classList.add('hidden');
    hud.show();
    if (sameChar) document.getElementById('help').classList.add('gone'); else setTimeout(() => document.getElementById('help').classList.add('gone'), 15000);
    started = true;
    nameInput.blur();
    hud.log('İpek Yolu\'na hoş geldin, ' + name + '!');
    const today = new Date().toISOString().slice(0, 10);
    if (lastDay !== today) { lastDay = today; player.stats.silk = (player.stats.silk || 0) + 20; hud.log('Günlük giriş ödülü: +20 Silk (Item Mall)', 'lvl', '#ff9ae8'); }
    setTimeout(() => events.remind(), 2500);
    if (!sameChar) hud.log('Toplayıcı Tilki envanterinde: 2. hotbar sayfasından çağır, ganimeti senin için toplasın.', 'lvl');
    if (!sameChar) {
      hud.log('Yetenek penceresinden (K) SP harcayıp bir ustalık seç, yetenek öğren.', 'lvl');
      hud.log((ZONE.npc.captain || 'Kaptan') + ' başındaki ! işaretine bak: görevler seni bekliyor.');
      if (player.race === 'eu') hud.log('Avrupalı: en çok iki sınıf seçebilirsin — ilk ustalığın ana sınıfın olur.', 'lvl');
    }
    hud.log(CONFIG.isTouch ? 'Joystick ile yürü, canavara dokun = saldır.' : 'Canavara tıkla = saldır. Yürümek için yere tıkla.');
    save();
  }
  startBtn.addEventListener('click', start);
  nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') start(); });

  // --- Tıklama / dokunma: önce canavar, sonra zemin ---
  const ctxBtn = document.getElementById('ctx-btn');
  let ctxNpc = null, fDown = false;
  ctxBtn.addEventListener('click', () => { if (ctxNpc) { ui.openNpc(ctxNpc); ctxNpc = null; ctxBtn.classList.add('hidden'); } });
  function handleClicks() {
    for (const c of input.clicks) {
      if (player.dead) continue;
      ndc.set((c.x / window.innerWidth) * 2 - 1, -(c.y / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const m = combat.pick(raycaster);
      if (m) { pendingNpc = null; combat.select(m, true); continue; }
      const sim = social.pick(raycaster);
      if (sim) { pendingNpc = null; social.clickBot(sim, c.x, c.y); continue; }
      const npc = npcs.pick(raycaster);
      if (npc) { combat.stopAttack(); pendingNpc = npc; player.target = { x: npc.x, z: npc.z }; continue; }
      const drop = loot.pick(raycaster);
      if (drop) { pendingNpc = null; combat.stopAttack(); player.target = { x: drop.x, z: drop.z }; world.showMarker({ x: drop.x, z: drop.z }); continue; }
      const hit = raycaster.intersectObject(world.ground, false)[0];
      if (hit) {
        const lim = CONFIG.worldSize / 2 - 6;
        const p = { x: clamp(hit.point.x, -lim, lim), z: clamp(hit.point.z, -lim, lim) };
        combat.stopAttack(); auto.manual();
        pendingNpc = null;
        player.target = p;
        world.showMarker(p);
      }
    }
    input.clicks.length = 0;
  }

  // --- Ana döngü ---
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    tick(dt);
    renderer.render(world.scene, camera);
  }
  function tick(dt) {
    if (started) {
      handleClicks();
      combat.update(dt);
      player.update(dt, input, rig.yaw);
      if (player.manualMove) auto.manual();
      auto.update(dt);
      social.update(dt); social.uiUpdate(dt); events.update(dt);
      monsters.update(dt, player, combat);
      loot.update(dt);
      pets.update(dt);
      jobs.update(dt);
      npcs.update(dt, player);
      Eco.update(dt, hud);
      if (ZONE.fw && !player.dead) {               // Unutulmuş Dünya: 20 dk süre
        const left = Math.max(0, 1200 - (Date.now() - (ZONE.fw.t || Date.now())) / 1000);
        if (!ZONE.fw.t) ZONE.fw.t = Date.now();
        hud.setTimer && hud.setTimer('Unutulmuş Dünya', left);
        if (left <= 0 && !travelTo) { hud.log('Süre doldu. Rüya sona eriyor...', 'lvl'); travel(ZONE.parent, 'T'); }
      }
      if (world.spinners) for (const sp of world.spinners) sp.rotation.z += dt * 0.6;
      quests.update();
      ui.update();
      if (wmap.open) wmap.draw();
      // yakındaki NPC için bağlam düğmesi (F / dokun)
      {
        let near = null, nd = NPC_RANGE;
        if (!ui.npc && !player.dead) for (const n of npcs.list) { const d = Math.hypot(player.pos.x - n.x, player.pos.z - n.z); if (d < nd) { nd = d; near = n; } }
        if (near !== ctxNpc) { ctxNpc = near; ctxBtn.classList.toggle('hidden', !near); if (near) ctxBtn.innerHTML = (CONFIG.isTouch ? '' : '<b>F</b> ') + near.name + ' <small>' + near.title + '</small>'; }
        if (near && input.isDown('KeyF') && !fDown) { ui.openNpc(near); }
        fDown = input.isDown('KeyF');
      }
      if (pendingNpc) {
        const d = Math.hypot(player.pos.x - pendingNpc.x, player.pos.z - pendingNpc.z);
        if (player.manualMove || player.dead || (!player.target && d >= NPC_RANGE)) pendingNpc = null;
        else if (d < NPC_RANGE) { player.target = null; ui.openNpc(pendingNpc); pendingNpc = null; }
      }
      for (const pt of world.portals) if (!player.dead && Math.hypot(player.pos.x - pt.x, player.pos.z - pt.z) < 4) { travel(pt.zone, pt.arrive); break; }
      if (lastP) { stepD += Math.hypot(player.pos.x - lastP.x, player.pos.z - lastP.z); if (stepD > 1.9) { stepD = 0; if (!player.dead) SFX.play('step'); } }
      lastP = { x: player.pos.x, z: player.pos.z };
      SFX.update(dt, { combat: player.combatT > 0, night: world.isNight(), inTown: inSafeZone(player.pos.x, player.pos.z) });
      saveT += dt;
      if (saveT > 5) { saveT = 0; save(); }
    } else {
      input.clicks.length = 0;
      monsters.update(dt, player, combat);   // menüde de canavarlar dolaşsın
      npcs.update(dt, player);
    }

    rig.update(dt, player.pos, !started);
    world.update(dt, player.pos, camera);
    weather.update(dt, camera);
    if (started) hud.update(dt);
  }

  window.__game = { world, player, rig, monsters, npcs, combat, quests, hud, ui, loot, input, save, hotbar, renderer, camera, travel, pets, jobs, auto, social, events, step: (n = 20, dt = 0.05) => { for (let i = 0; i < n; i++) tick(dt); } };   // hata ayıklama / test
  window.addEventListener('beforeunload', () => { if (started) save(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && started) save(); });
  frame();
  if (autostart) setTimeout(start, 50);
  }

  // Varlıkları (3D modeller) yükle, sonra oyunu kur. Yükleme başarısız olursa prosedürel modellerle devam.
  const sb = document.getElementById('start-btn'), lf = document.getElementById('loadfill'), lt = document.getElementById('loadtxt');
  const go = ok => { lf.style.width = '100%'; lt.textContent = ok ? 'Hazır!' : 'Basit grafiklerle başlıyor'; sb.disabled = false; setTimeout(() => document.getElementById('loadbar').classList.add('done'), 300); boot(); };
  const hr = typeof HumanRig !== 'undefined' ? Promise.race([HumanRig.load(), new Promise(r => setTimeout(r, 12000))]) : Promise.resolve();
  Promise.all([Assets.load(f => { lf.style.width = Math.round(f * 90) + '%'; }), hr]).then(([ok]) => go(ok), () => go(false));
})();
