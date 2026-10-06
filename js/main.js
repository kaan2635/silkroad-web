// Giriş noktası: renderer, ana döngü, başlangıç ekranı, kayıt.
(function () {
  if (typeof THREE === 'undefined') {
    document.getElementById('error').style.display = 'flex';
    document.getElementById('start').classList.add('hidden');
    return;
  }

  const canvas = document.getElementById('game');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const camera = new THREE.PerspectiveCamera(55, 1, 0.3, 1200);
  const input = new Input(canvas);
  const world = new World();
  const player = new Player(world, 'Gezgin');
  const rig = new CameraRig(camera, input);
  const hud = new HUD(player, world, rig);
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
  window.addEventListener('resize', resize);
  resize();

  // --- Kayıt (localStorage) ---
  function loadSave() {
    try { return JSON.parse(localStorage.getItem(CONFIG.saveKey)) || null; } catch (e) { return null; }
  }
  function save() {
    try {
      localStorage.setItem(CONFIG.saveKey, JSON.stringify({ name: player.name, x: player.pos.x, z: player.pos.z }));
    } catch (e) { /* özel pencere vb. */ }
  }

  // --- Başlangıç ekranı ---
  const startScreen = document.getElementById('start');
  const nameInput = document.getElementById('name-input');
  const startBtn = document.getElementById('start-btn');
  const saved = loadSave();
  if (saved && saved.name) nameInput.value = saved.name;

  function start() {
    const name = (nameInput.value || '').trim() || 'Gezgin';
    player.setName(name);
    if (saved && saved.name === name && isFinite(saved.x) && isFinite(saved.z)) player.teleport(saved.x, saved.z);
    startScreen.classList.add('hidden');
    hud.show();
    started = true;
    nameInput.blur();
    hud.log('İpek Yolu\'na hoş geldin, ' + name + '!');
    hud.log('Yürümek için yere sol tıkla.');
    save();
  }
  startBtn.addEventListener('click', start);
  nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') start(); });

  // --- Tıklama: zemine ışın at, hedef belirle ---
  function handleClicks() {
    for (const c of input.clicks) {
      ndc.set((c.x / window.innerWidth) * 2 - 1, -(c.y / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObject(world.ground, false)[0];
      if (hit) {
        const lim = CONFIG.worldSize / 2 - 6;
        const p = { x: clamp(hit.point.x, -lim, lim), z: clamp(hit.point.z, -lim, lim) };
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
      player.update(dt, input, rig.yaw);
      saveT += dt;
      if (saveT > 5) { saveT = 0; save(); }
    } else {
      input.clicks.length = 0;
    }

    rig.update(dt, player.pos, !started);
    world.update(dt, player.pos, camera);
    if (started) hud.update(dt);
    renderer.render(world.scene, camera);
  }

  window.addEventListener('beforeunload', () => { if (started) save(); });
  frame();
})();
