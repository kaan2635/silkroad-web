// Giriş noktası: renderer, ana döngü, başlangıç ekranı, kayıt.
(function () {
  if (typeof THREE === 'undefined') {
    document.getElementById('error').style.display = 'flex';
    document.getElementById('start').classList.add('hidden');
    return;
  }
  if (CONFIG.isTouch) document.body.classList.add('touch');

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
  const monsters = new MonsterManager(world);
  const rig = new CameraRig(camera, input);
  const hud = new HUD(player, world, rig, camera);
  const combat = new Combat(player, monsters, world, camera);
  hud.combat = combat; hud.mm = monsters; combat.hud = hud;
  const loot = new LootManager(world, player, hud);
  combat.loot = loot;
  const quests = new QuestManager(player, hud, world);
  quests.combat = combat; combat.quests = quests; loot.quests = quests; hud.quests = quests;
  const wmap = new WorldMap(player, quests);
  const ui = new UI(player, hud, quests, wmap);
  quests.onChange = () => { npcs.refreshMarkers(quests); ui.refresh(); };
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
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  document.addEventListener('gesturestart', e => e.preventDefault());   // iOS sayfa yakınlaştırmasını engelle
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  resize();

  new SettingsUI({ renderer, scene: world.scene, resize, onReset: () => { try { localStorage.removeItem(CONFIG.saveKey); } catch (e) {} started = false; location.reload(); } });
  let stepD = 0, lastP = null;

  // --- Kayıt (localStorage) ---
  function loadSave() {
    try { return JSON.parse(localStorage.getItem(CONFIG.saveKey)) || null; } catch (e) { return null; }
  }
  function save() {
    try {
      const s = player.stats;
      localStorage.setItem(CONFIG.saveKey, JSON.stringify({
        name: player.name, x: player.pos.x, z: player.pos.z,
        level: s.level, exp: s.exp, hpPots: s.hpPots, mpPots: s.mpPots,
        gold: s.gold, stones: s.stones, inv: player.inv.serialize(),
        tod: world.timeOfDay, quests: quests.serialize()
      }));
    } catch (e) { /* özel pencere vb. */ }
  }

  // --- Başlangıç ekranı ---
  const startScreen = document.getElementById('start');
  const nameInput = document.getElementById('name-input');
  const startBtn = document.getElementById('start-btn');
  const saved = loadSave();
  if (saved && saved.name) nameInput.value = saved.name;

  function start() {
    if (started) return;
    const name = (nameInput.value || '').trim() || 'Gezgin';
    const sameChar = saved && saved.name === name;
    if (sameChar) combat.applySave(saved); else { player.inv.starter(); player.teleport(0, 7); }
    player.setName(name);
    if (sameChar && isFinite(saved.x) && isFinite(saved.z)) player.teleport(saved.x, saved.z);
    if (sameChar) { quests.load(saved.quests); if (isFinite(saved.tod)) world.timeOfDay = clamp(saved.tod, 0, 0.9999); }
    npcs.refreshMarkers(quests);
    SFX.init(); SFX.play('ui');
    startScreen.classList.add('hidden');
    hud.show();
    started = true;
    nameInput.blur();
    hud.log('İpek Yolu\'na hoş geldin, ' + name + '!');
    hud.log('Kaptan Lee\'nin başındaki ! işaretine bak: görevler seni bekliyor.');
    hud.log(CONFIG.isTouch ? 'Joystick ile yürü, canavara dokun = saldır.' : 'Canavara tıkla = saldır. Yürümek için yere tıkla.');
    save();
  }
  startBtn.addEventListener('click', start);
  nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') start(); });

  // --- Tıklama / dokunma: önce canavar, sonra zemin ---
  function handleClicks() {
    for (const c of input.clicks) {
      if (player.dead) continue;
      ndc.set((c.x / window.innerWidth) * 2 - 1, -(c.y / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const m = combat.pick(raycaster);
      if (m) { pendingNpc = null; combat.select(m, true); continue; }
      const npc = npcs.pick(raycaster);
      if (npc) { combat.stopAttack(); pendingNpc = npc; player.target = { x: npc.x, z: npc.z }; continue; }
      const drop = loot.pick(raycaster);
      if (drop) { pendingNpc = null; combat.stopAttack(); player.target = { x: drop.x, z: drop.z }; world.showMarker({ x: drop.x, z: drop.z }); continue; }
      const hit = raycaster.intersectObject(world.ground, false)[0];
      if (hit) {
        const lim = CONFIG.worldSize / 2 - 6;
        const p = { x: clamp(hit.point.x, -lim, lim), z: clamp(hit.point.z, -lim, lim) };
        combat.stopAttack();
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

    if (started) {
      handleClicks();
      combat.update(dt);
      player.update(dt, input, rig.yaw);
      monsters.update(dt, player, combat);
      loot.update(dt);
      npcs.update(dt, player);
      quests.update();
      ui.update();
      if (lastP) { stepD += Math.hypot(player.pos.x - lastP.x, player.pos.z - lastP.z); if (stepD > 1.9) { stepD = 0; if (!player.dead) SFX.play('step'); } }
      lastP = { x: player.pos.x, z: player.pos.z };
      SFX.update(dt, { combat: player.combatT > 0, night: world.isNight(), inTown: inSafeZone(player.pos.x, player.pos.z) });
      if (wmap.open) wmap.draw();
      if (pendingNpc) {
        const d = Math.hypot(player.pos.x - pendingNpc.x, player.pos.z - pendingNpc.z);
        if (player.manualMove || player.dead) pendingNpc = null;
        else if (d < NPC_RANGE) { player.target = null; ui.openNpc(pendingNpc); pendingNpc = null; }
      }
      saveT += dt;
      if (saveT > 5) { saveT = 0; save(); }
    } else {
      input.clicks.length = 0;
      monsters.update(dt, player, combat);   // menüde de canavarlar dolaşsın
      npcs.update(dt, player);
    }

    rig.update(dt, player.pos, !started);
    world.update(dt, player.pos, camera);
    if (started) hud.update(dt);
    renderer.render(world.scene, camera);
  }

  window.__game = { world, player, rig, monsters, npcs, combat, quests, hud, ui, loot, input, save };   // hata ayıklama / test
  window.addEventListener('beforeunload', () => { if (started) save(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && started) save(); });
  frame();
  }

  // Varlıkları (3D modeller) yükle, sonra oyunu kur. Yükleme başarısız olursa prosedürel modellerle devam.
  const sb = document.getElementById('start-btn'), lf = document.getElementById('loadfill'), lt = document.getElementById('loadtxt');
  const go = ok => { lf.style.width = '100%'; lt.textContent = ok ? 'Hazır!' : 'Basit grafiklerle başlıyor'; sb.disabled = false; setTimeout(() => document.getElementById('loadbar').classList.add('done'), 300); boot(); };
  Assets.load(f => { lf.style.width = Math.round(f * 100) + '%'; }).then(go, () => go(false));
})();
