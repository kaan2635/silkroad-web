// Savaş: hedefleme, otomatik saldırı, yetenekler, hasar, EXP / seviye, ölüm.

const MELEE_RANGE = 2.7;
const expToNext = l => Math.round(60 * l * l + 40);

// Hotbar yetenekleri. use(c) false dönerse yetenek kullanılmamış sayılır (mana/bekleme harcanmaz).
const SKILLS = [
  { key: '1', icon: '⚔️', name: 'Temel Saldırı', mp: 0, cd: 0, tip: 'Hedefe otomatik saldırır',
    use: c => { c.startAttack(); return true; } },
  { key: '2', icon: '💨', name: 'Hızlı Adım', sfx: 'buff', mp: 10, cd: 14, tip: '4 sn hız artışı',
    use: c => { c.player.buffs.haste = 4; c.fx(c.player, 'Hızlı Adım!', 'buff'); return true; } },
  { key: '3', icon: '🔥', name: 'Ateş Darbesi', sfx: 'fire', mp: 15, cd: 4, tip: 'Uzaktan ateş topu (2.4x hasar)',
    use: c => {
      const t = c.requireTarget(14); if (!t) return false;
      c.faceTarget(t); c.player.swingT = 0.3;
      c.spawnProjectile(t, () => c.hitWithSkill(t, 2.4));
      return true;
    } },
  { key: '4', icon: '❄️', name: 'Buz Kalkanı', sfx: 'buff', mp: 20, cd: 22, tip: '8 sn boyunca hasarı yarıya indirir',
    use: c => { c.player.buffs.shield = 8; c.fx(c.player, 'Buz Kalkanı!', 'buff'); return true; } },
  { key: '5', icon: '🗡️', name: 'Çifte Kesik', sfx: 'swing', mp: 12, cd: 6, tip: 'Yakın dövüş, 2 vuruş (1.5x)',
    use: c => {
      const t = c.requireTarget(MELEE_RANGE + 0.8); if (!t) return false;
      c.faceTarget(t); c.player.swingT = 0.3;
      c.hitWithSkill(t, 1.5);
      c.later(0.25, () => { if (!t.dead && !c.player.dead) { c.player.swingT = 0.3; c.hitWithSkill(t, 1.5); } });
      return true;
    } },
  { key: '6', icon: '🧪', name: 'Can İksiri', sfx: 'potion', mp: 0, cd: 8, tip: 'Can yeniler', potion: 'hpPots',
    use: c => {
      const s = c.player.stats;
      if (s.hpPots <= 0) { c.hud.log('Can iksirin kalmadı.'); return false; }
      if (s.hp >= s.maxHp) { c.hud.log('Canın zaten dolu.'); return false; }
      s.hpPots--; const h = 60 + s.level * 8; s.hp = Math.min(s.maxHp, s.hp + h);
      c.fx(c.player, '+' + h, 'heal'); return true;
    } },
  { key: '7', icon: '💧', name: 'Mana İksiri', sfx: 'potion', mp: 0, cd: 8, tip: 'Mana yeniler', potion: 'mpPots',
    use: c => {
      const s = c.player.stats;
      if (s.mpPots <= 0) { c.hud.log('Mana iksirin kalmadı.'); return false; }
      if (s.mp >= s.maxMp) { c.hud.log('Manan zaten dolu.'); return false; }
      s.mpPots--; const m = 40 + s.level * 5; s.mp = Math.min(s.maxMp, s.mp + m);
      c.fx(c.player, '+' + m + ' MP', 'mana'); return true;
    } },
  { key: '8', icon: '📜', name: 'Şehre Dönüş', sfx: 'cast', mp: 0, cd: 60, tip: '3 sn kıpırdamadan bekle, şehre ışınlan',
    use: c => {
      if (c.casting) return false;
      c.casting = { t: 3, total: 3, name: 'Şehre dönüş' };
      c.hud.log('Şehre dönülüyor... 3 saniye kıpırdama.');
      return true;
    } }
];

class Combat {
  constructor(player, mm, world, camera) {
    this.player = player; this.mm = mm; this.world = world; this.camera = camera;
    this.hud = null;
    this.quests = null;
    this.target = null;
    this.attacking = false;
    this.cds = new Array(SKILLS.length).fill(0);
    this.cdMax = new Array(SKILLS.length).fill(1);
    this.casting = null;
    this.loot = null;        // main.js bağlar
    this.projectiles = [];
    this.timers = [];
    this.inSafe = true;
    this.pGeo = new THREE.SphereGeometry(0.35, 10, 8);
    this.pMat = new THREE.MeshBasicMaterial({ color: 0xff7a1a });

    this.ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.3, 32),
      new THREE.MeshBasicMaterial({ color: 0xff4a3a, transparent: true, opacity: 0.85, depthTest: false, side: THREE.DoubleSide }));
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.renderOrder = 4;
    this.ring.visible = false;
    world.scene.add(this.ring);

    window.addEventListener('keydown', e => {
      const a = document.activeElement;
      if (a && a.tagName === 'INPUT') return;
      if (e.code === 'Tab') { e.preventDefault(); this.targetNearest(); }
      else if (e.code === 'Space') { e.preventDefault(); this.toggleAttack(); }
      else if (e.code === 'Escape') { this.clearTarget(); }
      else { const m = /^Digit([1-8])$/.exec(e.code); if (m) this.useSkill(parseInt(m[1], 10) - 1); }
    });
  }

  // ---------- Hedefleme ----------
  pick(raycaster) {
    const hit = raycaster.intersectObjects(this.mm.hitMeshes(), false)[0];
    return hit ? hit.object.userData.monster : null;
  }
  select(m, attack) {
    this.target = m;
    if (attack) this.startAttack();
  }
  clearTarget() { this.target = null; this.attacking = false; }
  startAttack() {
    if (!this.target) { const t = this.mm.nearest(this.player.pos, 20); if (t) this.target = t; }
    if (!this.target) { this.hud.log('Hedef yok. Bir canavara dokun / tıkla.'); return; }
    this.attacking = true;
  }
  stopAttack() { this.attacking = false; }
  toggleAttack() { if (this.attacking) this.stopAttack(); else this.startAttack(); }
  targetNearest() {
    // Tab: bir sonraki en yakın canavar
    const p = this.player.pos;
    const cands = this.mm.list.filter(m => !m.dead && Math.hypot(m.x - p.x, m.z - p.z) < 40 && m !== this.target)
      .sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z));
    if (cands.length) this.target = cands[0];
    else if (!this.target) this.hud.log('Yakında canavar yok.');
  }
  requireTarget(range) {
    let t = this.target && !this.target.dead ? this.target : null;
    if (!t) { t = this.mm.nearest(this.player.pos, range); if (t) this.target = t; }
    if (!t) { this.hud.log('Hedef yok.'); return null; }
    if (this.dist(t) > range) { this.hud.log('Hedef çok uzak.'); return null; }
    return t;
  }
  dist(m) { return Math.hypot(m.x - this.player.pos.x, m.z - this.player.pos.z); }
  faceTarget(m) { this.player.heading = Math.atan2(m.x - this.player.pos.x, m.z - this.player.pos.z); }

  // ---------- Hasar ----------
  rollDamage(mult) {
    const lvl = this.player.stats.level;
    let d = (10 + lvl * 4 + this.player.inv.bonus.atk) * mult * (0.85 + Math.random() * 0.3);
    const crit = Math.random() < 0.12;
    if (crit) d *= 1.8;
    return { dmg: Math.max(1, Math.round(d)), crit };
  }
  hitWithSkill(m, mult) {
    if (m.dead) return;
    const r = this.rollDamage(mult);
    this.damageMonster(m, r.dmg, r.crit);
  }
  damageMonster(m, dmg, crit) {
    if (m.dead) return;
    m.hp -= dmg;
    m.provoke();
    this.player.combatT = 5;
    this.fx(m, String(dmg), crit ? 'crit' : 'hit');
    SFX.play(crit ? 'crit' : 'hit');
    if (m.hp <= 0) { m.hp = 0; this.killMonster(m); }
  }
  killMonster(m) {
    m.die();
    if (this.target === m) { this.target = null; this.attacking = false; }
    const p = this.player.stats;
    const base = m.type.exp * (1 + 0.25 * (m.level - 1));
    const exp = Math.max(1, Math.round(base * clamp(1 + 0.2 * (m.level - p.level), 0.1, 1.6)));
    this.hud.log(m.type.name + ' öldürüldü. +' + exp + ' EXP', 'exp');
    SFX.play('kill');
    this.fx(this.player, '+' + exp + ' EXP', 'exp');
    this.gainExp(exp);
    if (this.loot) this.loot.dropFrom(m);
    if (this.quests) this.quests.onKill(m.typeKey);
  }
  damagePlayer(amount, m) {
    const pl = this.player;
    if (pl.dead) return;
    const def = pl.stats.level * 2 + pl.inv.bonus.def;
    let dmg = amount * (100 / (100 + def * 4)) * (0.9 + Math.random() * 0.2);
    if (pl.buffs.shield > 0) dmg *= 0.5;
    dmg = Math.max(1, Math.round(dmg));
    pl.stats.hp -= dmg;
    pl.combatT = 5;
    this.fx(pl, '-' + dmg, 'player');
    SFX.play('hurt');
    if (this.casting) { this.casting = null; this.hud.log('Büyü bozuldu!'); }
    if (pl.stats.hp <= 0) { pl.stats.hp = 0; this.die(m); }
  }

  // ---------- EXP / seviye ----------
  gainExp(n) {
    const s = this.player.stats;
    s.exp += n;
    let up = false;
    while (s.exp >= s.maxExp) { s.exp -= s.maxExp; s.level++; s.maxExp = expToNext(s.level); this.applyLevel(); up = true; }
    if (up) {
      s.hp = s.maxHp; s.mp = s.maxMp;
      this.player.setName(this.player.name);
      this.hud.log('SEVİYE ATLADIN! Yeni seviye: ' + s.level, 'lvl');
      SFX.play('levelup');
      this.fx(this.player, 'SEVİYE ATLADIN!', 'lvl');
    }
  }
  applyLevel() {
    const s = this.player.stats;
    s.maxExp = expToNext(s.level);
    this.player.inv.recalc();
  }
  // Kayıttan yükle
  applySave(sv) {
    const s = this.player.stats;
    if (sv && sv.level > 0) {
      s.level = Math.min(99, sv.level | 0);
      this.applyLevel();
      s.exp = clamp(sv.exp | 0, 0, s.maxExp - 1);
      if (isFinite(sv.hpPots)) s.hpPots = clamp(sv.hpPots | 0, 0, 999);
      if (isFinite(sv.mpPots)) s.mpPots = clamp(sv.mpPots | 0, 0, 999);
      if (sv.inv) {
        s.gold = Math.max(0, sv.gold | 0); s.stones = Math.max(0, sv.stones | 0);
        this.player.inv.load(sv.inv);
      } else this.player.inv.starter();      // Faz 2 kaydı: eşya sistemi yok, başlangıç ekipmanı ver
      s.hp = s.maxHp; s.mp = s.maxMp;
    } else this.player.inv.starter();
  }

  // ---------- Ölüm / yeniden doğma ----------
  die(m) {
    const pl = this.player;
    pl.dead = true;
    this.attacking = false; this.target = null; this.casting = null;
    this.hud.log((m ? m.type.name : 'Bir canavar') + ' seni yendi.', 'dmg');
    this.hud.showDeath(true);
    SFX.play('death');
  }
  respawn() {
    const pl = this.player, s = pl.stats;
    pl.revive();
    pl.teleport(0, 6);
    s.hp = Math.round(s.maxHp * 0.5); s.mp = Math.round(s.maxMp * 0.5);
    const loss = Math.round(s.maxExp * 0.1);
    s.exp = Math.max(0, s.exp - loss);
    this.hud.showDeath(false);
    this.hud.log('Şehirde yeniden doğdun. -' + loss + ' EXP', 'dmg');
  }

  // ---------- Yetenekler ----------
  useSkill(i) {
    const pl = this.player, s = SKILLS[i];
    if (!s || pl.dead) return;
    if (this.cds[i] > 0) { this.hud.log(s.name + ' bekleme süresinde.'); return; }
    if (pl.stats.mp < s.mp) { this.hud.log('Yeterli mana yok.'); return; }
    if (s.use(this) === false) { SFX.play('error'); return; }
    SFX.play(s.sfx || 'ui');
    pl.stats.mp -= s.mp;
    this.cds[i] = s.cd; this.cdMax[i] = Math.max(0.01, s.cd);
    this.hud.flashSlot(i);
  }
  fx(entity, text, cls) {
    const p = entity.pos || entity.group.position;
    const h = entity === this.player ? 3.0 : 2.4 * (entity.baseScale || 1);
    this.hud.floatText({ x: p.x, y: p.y + h, z: p.z }, text, cls);
  }
  later(sec, fn) { this.timers.push({ t: sec, fn }); }

  spawnProjectile(target, onHit) {
    const mesh = new THREE.Mesh(this.pGeo, this.pMat);
    const p = this.player.pos;
    mesh.position.set(p.x, p.y + 1.7, p.z);
    this.world.scene.add(mesh);
    this.projectiles.push({ mesh, target, onHit });
  }

  // ---------- Ana güncelleme ----------
  update(dt) {
    const pl = this.player;
    for (let i = 0; i < this.cds.length; i++) if (this.cds[i] > 0) this.cds[i] = Math.max(0, this.cds[i] - dt);
    for (let i = this.timers.length - 1; i >= 0; i--) {
      this.timers[i].t -= dt;
      if (this.timers[i].t <= 0) { const f = this.timers[i].fn; this.timers.splice(i, 1); f(); }
    }
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i], t = pr.target;
      const tp = t.group.position;
      const dx = tp.x - pr.mesh.position.x, dy = tp.y + 1.1 - pr.mesh.position.y, dz = tp.z - pr.mesh.position.z;
      const d = Math.hypot(dx, dy, dz), step = 22 * dt;
      if (t.dead) { this.world.scene.remove(pr.mesh); this.projectiles.splice(i, 1); continue; }
      if (d < 0.9 || d < step) { this.world.scene.remove(pr.mesh); this.projectiles.splice(i, 1); pr.onHit(); }
      else pr.mesh.position.set(pr.mesh.position.x + dx / d * step, pr.mesh.position.y + dy / d * step, pr.mesh.position.z + dz / d * step);
    }

    // Güvenli bölge geçişleri
    const safe = inSafeZone(pl.pos.x, pl.pos.z);
    if (safe !== this.inSafe) {
      this.inSafe = safe;
      this.hud.log(safe ? 'Güvenli bölgeye girdin.' : 'Güvenli bölgeden çıktın. Dikkat!');
    }

    if (pl.dead) { this.ring.visible = false; return; }
    if (pl.attackCd > 0) pl.attackCd -= dt;
    if (pl.manualMove) this.attacking = false;

    // Şehre dönüş büyüsü
    if (this.casting) {
      if (pl.moving || pl.manualMove) { this.casting = null; this.hud.log('Büyü bozuldu (hareket ettin).'); }
      else {
        this.casting.t -= dt;
        if (this.casting.t <= 0) {
          this.casting = null;
          pl.teleport(0, 6);
          this.hud.log('Şehre ulaştın.');
        }
      }
    }

    // Hedef doğrulama
    if (this.target && (this.target.dead || this.dist(this.target) > 60)) { this.target = null; this.attacking = false; }

    // Otomatik saldırı: menzile yürü, vur
    if (this.attacking && this.target) {
      const t = this.target, d = this.dist(t);
      if (d > MELEE_RANGE - 0.3) { pl.target = { x: t.x, z: t.z }; }
      else {
        pl.target = null;
        this.faceTarget(t);
        if (pl.attackCd <= 0) {
          pl.attackCd = 1.0;
          pl.swingT = 0.3;
          SFX.play('swing');
          const r = this.rollDamage(1);
          this.damageMonster(t, r.dmg, r.crit);
        }
      }
    }

    // Hedef halkası
    if (this.target && !this.target.dead) {
      const t = this.target, k = (t.baseScale || 1) * (1 + Math.sin(performance.now() * 0.008) * 0.06);
      this.ring.visible = true;
      this.ring.position.set(t.x, terrainHeight(t.x, t.z) + 0.2, t.z);
      this.ring.scale.set(k, k, k);
    } else this.ring.visible = false;
  }
}
