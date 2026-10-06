const STATUS_ICONS = { stun: '💫', freeze: '🧊', knock: '⤵️', slow: '🐌', burn: '🔥', bleed: '🩸', poison: '☠️' };
// Arayüz: can/mana/EXP, hedef çerçevesi, hotbar + bekleme süreleri, mini harita, mesajlar, hasar yazıları.
class HUD {
  constructor(player, world, rig, camera) {
    this.player = player; this.world = world; this.rig = rig; this.camera = camera;
    this.combat = null;      // main.js bağlar
    this.mm = null;          // canavar yöneticisi, main.js bağlar
    this.quests = null;      // görev yöneticisi, main.js bağlar
    this.hotbar = null;      // main.js bağlar
    const $ = id => document.getElementById(id);
    this.el = {
      name: $('pname'), lvl: $('plvl'),
      hp: $('hp-fill'), hpt: $('hp-text'), mp: $('mp-fill'), mpt: $('mp-text'),
      exp: $('exp-fill'), expt: $('exp-text'),
      pgold: $('pgold'), coords: $('coords'), fps: $('fps'), log: $('log'), hotbar: $('hotbar'), root: $('hud'),
      tf: $('target-frame'), tfName: $('tf-name'), tfLvl: $('tf-lvl'), tfFill: $('tf-fill'), tfText: $('tf-text'), tfSt: $('tf-st'),
      buffs: $('buffs'), cast: $('cast'), castFill: $('cast-fill'), castText: $('cast-text'),
      death: $('death'), fx: $('fx'), clock: $('clock'), banner: $('banner'), tracker: $('tracker'),
      zerk: $('zerk'), page: $('hb-page'), placeHint: $('place-hint'), badgeC: $('badge-c'), badgeK: $('badge-k')
    };
    this.mmCanvas = $('minimap');
    this.ctx = this.mmCanvas.getContext('2d');
    this.frames = 0; this.fpsT = 0;
    this.slots = [];
    this.floats = [];
    this._v = new THREE.Vector3();
    this._buildHotbar();
    this.el.zerk.innerHTML = '<i></i><i></i><i></i><i></i><i></i>';
    this.zerkOrbs = [...this.el.zerk.children];
    this.el.zerk.addEventListener('click', () => this.combat && this.combat.activateZerk());
    this.el.page.addEventListener('click', () => { if (this.hotbar) { this.hotbar.setPage(1 - this.hotbar.page); SFX.play('tab'); } });

    $('btn-respawn').addEventListener('click', () => this.combat && this.combat.respawn());
    const bt = $('btn-target');
    if (bt) bt.addEventListener('click', () => { if (this.combat) { this.combat.targetNearest(); this.combat.startAttack(); } });
  }

  show() { this.el.root.classList.remove('hidden'); }

  _buildHotbar() {
    for (let i = 0; i < HOTBAR_SLOTS; i++) {
      const d = document.createElement('div');
      d.className = 'slot';
      d.innerHTML = '<span class="key">' + (i + 1) + '</span><span class="ic"></span><div class="cd"></div><span class="cdt"></span><span class="cnt"></span>';
      d.addEventListener('click', () => this._slotClick(i));
      this.el.hotbar.appendChild(d);
      this.slots.push({ el: d, ic: d.querySelector('.ic'), cd: d.querySelector('.cd'), cdt: d.querySelector('.cdt'), cnt: d.querySelector('.cnt'), lastCnt: -1, lastCdt: '', lastIcon: null });
    }
  }
  _slotClick(i) {
    const hb = this.hotbar; if (!hb) return;
    if (hb.placing) {
      hb.set(hb.page, i, hb.placing === 'clear' ? null : hb.placing);
      hb.placing = null; SFX.play('equip');
      this.log('Hotbar güncellendi.');
      return;
    }
    if (this.combat) this.combat.useSlot(hb.get(hb.page, i));
  }
  // Bir yetenek kullanıldığında ilgili yuvayı parlat
  flashKey(id) {
    const hb = this.hotbar; if (!hb) return;
    hb.pages[hb.page].forEach((e, i) => { if (e && e.t === 'sk' && e.id === id) { const el = this.slots[i].el; el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 150); } });
  }

  showDeath(v) { this.el.death.classList.toggle('hidden', !v); }

  // Bölge / görev afişi (ekranın üstünde birkaç saniye)
  banner(title, sub, cls = 'region') {
    const b = this.el.banner;
    b.className = cls;
    b.innerHTML = '<div class="bt">' + title + '</div>' + (sub ? '<div class="bs">' + sub + '</div>' : '');
    void b.offsetWidth;   // animasyonu yeniden başlat
    b.classList.add('show');
    clearTimeout(this._bt);
    this._bt = setTimeout(() => b.classList.remove('show'), 3200);
  }

  log(msg, cls = 'sys', color) {
    const d = document.createElement('div');
    d.className = cls; d.textContent = msg;
    if (color) d.style.color = color;
    this.el.log.appendChild(d);
    while (this.el.log.children.length > (CONFIG.isTouch ? 3 : 6)) this.el.log.removeChild(this.el.log.firstChild);
    setTimeout(() => d.remove(), 9000);
  }

  floatText(pos, text, cls = '') {
    const el = document.createElement('div');
    el.className = 'ft ' + cls;
    el.textContent = text;
    this.el.fx.appendChild(el);
    this.floats.push({ el, x: pos.x, y: pos.y, z: pos.z, t: 0, life: cls === 'lvl' ? 2.2 : 1.1 });
    if (this.floats.length > 50) { const f = this.floats.shift(); f.el.remove(); }
  }

  _updateFloats(dt) {
    const w = window.innerWidth, h = window.innerHeight, v = this._v;
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.t += dt; f.y += dt * 1.5;
      if (f.t > f.life) { f.el.remove(); this.floats.splice(i, 1); continue; }
      v.set(f.x, f.y, f.z).project(this.camera);
      if (v.z > 1) { f.el.style.opacity = 0; continue; }
      f.el.style.opacity = Math.min(1, (f.life - f.t) / 0.4);
      f.el.style.transform = 'translate(' + ((v.x * 0.5 + 0.5) * w) + 'px,' + ((-v.y * 0.5 + 0.5) * h) + 'px) translate(-50%,-50%)';
    }
  }

  _hotbarUpdate() {
    const c = this.combat, hb = this.hotbar, s = this.player.stats;
    if (!c || !hb) return;
    this.el.page.textContent = (hb.page + 1) + '/2';
    this.el.root.classList.toggle('placing', !!hb.placing);
    for (let i = 0; i < HOTBAR_SLOTS; i++) {
      const sl = this.slots[i], e = hb.get(hb.page, i), v = hb.view(e);
      const icon = v ? v.icon : '';
      if (icon !== sl.lastIcon) { sl.ic.textContent = icon; sl.lastIcon = icon; sl.el.title = v ? v.name + ' — ' + v.tip : 'Boş'; }
      sl.el.classList.toggle('empty', !v);
      const key = c.slotKey(e), cd = key ? (c.cd[key] || 0) : 0;
      sl.cd.style.height = cd > 0 ? (cd / c.cdMax[key] * 100) + '%' : '0';
      const txt = cd > 0 ? (cd >= 10 ? Math.ceil(cd) : cd.toFixed(1)) : '';
      if (txt !== sl.lastCdt) { sl.cdt.textContent = txt; sl.lastCdt = txt; }
      sl.el.classList.toggle('nomp', !!(v && ((v.mp && s.mp < v.mp) || v.learned === false || (v.count === 0))));
      sl.el.classList.toggle('active', !!(e && e.t === 'atk' && c.attacking));
      sl.el.classList.toggle('ready', !!(e && e.t === 'zerk' && s.zerk >= ZERK_MAX));
      const cnt = v && v.count !== undefined ? v.count : -1;
      if (cnt !== sl.lastCnt) { sl.cnt.textContent = cnt >= 0 ? cnt : ''; sl.lastCnt = cnt; }
    }
  }

  update(dt) {
    const pl = this.player, s = pl.stats, e = this.el, c = this.combat;
    e.name.textContent = pl.name;
    e.lvl.textContent = 'Sv. ' + s.level;
    e.hp.style.width = (s.hp / s.maxHp * 100) + '%';
    e.hpt.textContent = Math.ceil(s.hp) + ' / ' + s.maxHp;
    e.mp.style.width = (s.mp / s.maxMp * 100) + '%';
    e.mpt.textContent = Math.floor(s.mp) + ' / ' + s.maxMp;
    e.exp.style.width = (s.exp / s.maxExp * 100) + '%';
    e.expt.textContent = 'EXP %' + (s.exp / s.maxExp * 100).toFixed(2) + ' · SP ' + pl.book.sp;
    e.pgold.textContent = '💰 ' + s.gold.toLocaleString('tr-TR');
    e.coords.textContent = Math.round(pl.pos.x) + ', ' + Math.round(pl.pos.z);
    const ck = (this.world.isNight() ? '🌙 ' : '☀️ ') + this.world.clockText() + ' · ' + (this.quests ? this.quests.region || '' : '');
    if (ck !== this._lastClock) { e.clock.textContent = ck; this._lastClock = ck; }
    if (this.quests) {
      const th = this.quests.trackerHTML();
      if (th !== this._lastTrack) { e.tracker.innerHTML = th; e.tracker.classList.toggle('hidden', !th); this._lastTrack = th; }
    }
    // rozetler: harcanmamış stat puanı / öğrenilebilir yetenek
    e.badgeC.classList.toggle('hidden', !s.statPts);
    e.badgeC.textContent = s.statPts;
    e.badgeK.classList.toggle('hidden', pl.book.sp < 5);

    // berserk küreleri
    const z = pl.zerkT > 0 ? 5 : s.zerk;
    this.zerkOrbs.forEach((o, i) => { const f = clamp(z - i, 0, 1); o.style.setProperty('--f', f); });
    e.zerk.classList.toggle('full', s.zerk >= ZERK_MAX);
    e.zerk.classList.toggle('on', pl.zerkT > 0);

    this.frames++; this.fpsT += dt;
    if (this.fpsT >= 0.5) { e.fps.textContent = Math.round(this.frames / this.fpsT) + ' FPS'; this.frames = 0; this.fpsT = 0; }

    if (c) {
      // hedef çerçevesi
      const t = c.target;
      if (t && !t.dead) {
        e.tf.classList.remove('hidden');
        e.tf.dataset.rank = t.rank;
        e.tfName.textContent = t.displayName;
        e.tfLvl.textContent = 'Sv. ' + t.level;
        e.tfFill.style.width = (t.hp / t.maxHp * 100) + '%';
        e.tfText.textContent = Math.ceil(t.hp).toLocaleString('tr-TR') + ' / ' + t.maxHp.toLocaleString('tr-TR');
        const st = Object.keys(t.status).map(k => STATUS_ICONS[k] || '').join(' ');
        if (st !== this._lastTfSt) { e.tfSt.textContent = st; this._lastTfSt = st; }
      } else e.tf.classList.add('hidden');
      this._hotbarUpdate();

      // büyü çubuğu
      if (c.casting) {
        e.cast.classList.remove('hidden');
        e.castFill.style.width = ((1 - c.casting.t / c.casting.total) * 100) + '%';
        e.castText.textContent = c.casting.name;
      } else e.cast.classList.add('hidden');
    }

    // aktif güçlendirmeler ve etkiler
    let b = '';
    const chip = (icon, t, bad) => '<span' + (bad ? ' class="bad"' : '') + '>' + icon + '<small>' + (t >= 60 ? Math.ceil(t / 60) + 'dk' : Math.ceil(t)) + '</small></span>';
    if (pl.zerkT > 0) b += chip('😤', pl.zerkT);
    if (pl.imbue) b += chip(pl.imbue.icon, pl.imbue.t);
    for (const id in pl.buffs) b += chip(pl.buffs[id].icon, pl.buffs[id].t);
    if (pl.absorb) b += chip('🌟', pl.absorb.t);
    if (pl.speedScrollT > 0) b += chip('🐎', pl.speedScrollT);
    for (const k in pl.status) b += chip(STATUS_ICONS[k] || '❗', pl.status[k].t, true);
    if (b !== this._lastBuffs) { e.buffs.innerHTML = b; this._lastBuffs = b; }

    this._updateFloats(dt);
    this._drawMinimap();
  }

  _drawMinimap() {
    const ctx = this.ctx, S = this.mmCanvas.width, R = S / 2, scale = 1.15;
    const pp = this.player.pos, yaw = this.rig.yaw;
    ctx.clearRect(0, 0, S, S);
    ctx.save();
    ctx.beginPath(); ctx.arc(R, R, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#d3b27a'; ctx.fillRect(0, 0, S, S);

    // Harita, kameranın baktığı yön yukarı olacak şekilde döner
    const a = Math.atan2(-Math.cos(yaw), -Math.sin(yaw));
    const rot = -Math.PI / 2 - a;
    ctx.translate(R, R); ctx.rotate(rot); ctx.scale(scale, scale); ctx.translate(-pp.x, -pp.z);

    // güvenli bölge
    ctx.fillStyle = 'rgba(120,200,120,.25)';
    ctx.fillRect(-SAFE_HALF, -SAFE_HALF, SAFE_HALF * 2, SAFE_HALF * 2);
    ctx.strokeStyle = '#a8281e'; ctx.lineWidth = 2; ctx.strokeRect(-TOWN_HALF, -TOWN_HALF, TOWN_HALF * 2, TOWN_HALF * 2);

    // yol
    ctx.strokeStyle = '#8f7a58'; ctx.lineWidth = 8; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let z = pp.z - 110; z <= pp.z + 110; z += 8) {
      const x = roadCenterX(z);
      z === pp.z - 110 ? ctx.moveTo(x, z) : ctx.lineTo(x, z);
    }
    ctx.stroke();

    // nesneler
    const range = R / scale + 10;
    for (const o of this.world.obstacles) {
      if (Math.abs(o.x - pp.x) > range || Math.abs(o.z - pp.z) > range) continue;
      if (o.type === 'wall' || o.type === 'lamp') continue;
      if (o.type === 'pond') { ctx.fillStyle = '#3aa0c8'; ctx.beginPath(); ctx.arc(o.x, o.z, o.r + 1, 0, 6.283); ctx.fill(); continue; }
      ctx.fillStyle = o.type === 'palm' ? '#3f7d2a' : o.type === 'cactus' ? '#5a9a3c' : o.type === 'gate' ? '#a8281e' : o.type === 'npc' ? '#ffd24a' : o.type === 'house' ? '#c9b48a' : o.type === 'wagon' ? '#7a5a36' : '#8a7a62';
      ctx.beginPath(); ctx.arc(o.x, o.z, Math.max(1.6, o.r * 0.8), 0, 6.283); ctx.fill();
    }

    // canavarlar
    if (this.mm) {
      const tgt = this.combat && this.combat.target;
      for (const m of this.mm.list) {
        if (m.dead || Math.abs(m.x - pp.x) > range || Math.abs(m.z - pp.z) > range) continue;
        ctx.fillStyle = m === tgt ? '#ffffff' : m.rank === 'unique' ? '#ff4ad8' : m.rank === 'giant' ? '#ff7a3a' : m.rank === 'champion' ? '#ffd23a' : '#e0302a';
        ctx.strokeStyle = '#300'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(m.x, m.z, m === tgt ? 3.2 : m.rank === 'normal' ? 2.4 : 3.4, 0, 6.283); ctx.fill(); ctx.stroke();
      }
    }

    // oyuncu oku
    ctx.save();
    ctx.translate(pp.x, pp.z); ctx.rotate(Math.PI - this.player.heading); ctx.scale(1 / scale, 1 / scale);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(5.5, 6); ctx.lineTo(0, 3); ctx.lineTo(-5.5, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.restore();

    // kuzey işareti
    const nx = R + Math.sin(rot) * (R - 12), ny = R - Math.cos(rot) * (R - 12);
    ctx.fillStyle = '#ffe08a'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText('K', nx, ny); ctx.fillText('K', nx, ny);
  }
}
