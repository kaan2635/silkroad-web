// Binek ve evcil hayvanlar: At (binek, hız), Toplayıcı Tilki (ganimeti toplar), Savaş Kurdu (hedefine saldırır).
class PetSystem {
  constructor(player, world, combat, loot, hud) {
    this.p = player; this.world = world; this.combat = combat; this.loot = loot; this.hud = hud;
    this.mounted = false; this.horse = null;
    this.grab = null; this.atk = null;
    this.atkDeadUntil = 0;
    this.jobs = null;
    this.grabKind = 1;              // 1: Toplayıcı Tilki, 2: Altın Sincap (Item Mall)
    this.filter = 'all';            // all | items | gold | gear
    this.pinv = new Array(32).fill(null);   // evcil çantası
    this.onChange = null;
  }
  pinvSize() { return this.p.inv.count('pet_grab2') ? 32 : 16; }
  changed() { if (this.onChange) this.onChange(); }
  // Filtreye göre toplanacak mı?
  wants(d) {
    if (d.kind === 'gold') return this.filter === 'all' || this.filter === 'gold';
    if (this.filter === 'gold') return false;
    if (this.filter === 'gear') return isGear(d.item.base);
    return true;
  }
  // Tilki/sincap toplar: önce oyuncu envanteri, dolarsa evcil çantası
  _petCollect(d) {
    if (d.kind === 'gold' || this.p.inv.canAdd(d.item.base, d.item.n || 1)) return this.loot._collect(d);
    const arr = this.pinv.slice(0, this.pinvSize());
    const it = d.item, n = itemInfo(it);
    if (!this.p.inv.add(it, arr, true)) { d.cool = 6; this.hud.log('Envanter ve evcil çantası dolu!', 'dmg'); return; }
    arr.forEach((x, i) => { this.pinv[i] = x; });
    this.hud.log((this.grabKind === 2 ? 'Sincap' : 'Tilki') + ' çantasına koydu: ' + n.name, 'sys', n.color);
    SFX.play('item');
    this.loot.remove(d);
    this.changed();
  }
  // Evcil çantasından oyuncu envanterine
  takeFromBag(i) {
    const it = this.pinv[i]; if (!it) return false;
    const copy = isStack(it.base) ? makeStack(it.base, it.n) : it;
    const ok = this.p.inv.add(copy);
    if (!ok) { if (isStack(it.base)) it.n = copy.n; this.changed(); return false; }
    this.pinv[i] = null; this.changed(); return true;
  }
  takeAll() { let n = 0; for (let i = 0; i < this.pinv.length; i++) if (this.pinv[i] && this.takeFromBag(i)) n++; return n; }

  useItem(b) {
    if (b.use === 'horse') { this.horseSpeed = b.speed || 1.7; return this.toggleMount(); }
    if (b.use === 'camel') return this.jobs ? this.jobs.summonTransport() : false;
    if (b.use === 'grabpet') {
      const k = b.pet || 1;
      if (this.grab && this.grabKind !== k) { this.toggleGrab(false); this.grabKind = k; return this.toggleGrab(true); }
      this.grabKind = k; return this.toggleGrab();
    }
    if (b.use === 'atkpet') return this.toggleAtk();
    if (b.use === 'petpot') {
      if (!this.atk) { this.hud.log('Savaş kurdun çağrılı değil.'); return false; }
      if (this.atk.hp >= this.atk.maxHp) { this.hud.log('Kurdun canı dolu.'); return false; }
      this.atk.hp = Math.min(this.atk.maxHp, this.atk.hp + Math.round(this.atk.maxHp * 0.4)); SFX.play('potion'); return true;
    }
    return false;
  }

  // ---------- At ----------
  toggleMount(force) {
    const on = force === undefined ? !this.mounted : force;
    if (on === this.mounted) return true;
    if (on) {
      if (this.p.dead) return false;
      if (this.jobs && this.jobs.transport) { this.hud.log('Kervan devesi varken ata binemezsin.'); return false; }
      this.combat.stopAttack();
      const q = buildQuad({ fur: 0x6a3a1a, dark: 0x2a1408, body: [0.75, 0.85, 2.0], legH: 1.05, eye: 0x1a1a1a });
      const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.8), new THREE.MeshLambertMaterial({ color: 0xa8281e }));
      saddle.position.set(0, 1.85, 0); q.group.add(saddle);
      const mane = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.8), new THREE.MeshLambertMaterial({ color: 0x1a0a04 }));
      mane.position.set(0, 2.0, 1.0); q.group.add(mane);
      this.horse = q; this.p.group.add(q.group);
      if (typeof MobModels !== 'undefined') MobModels.simple('horse', { h: 2.35, rot: -Math.PI / 2, colors: this.horseSpeed >= 2 ? { Main: 0xe8e4dc, Main_Light: 0xf4f0e8, Main_Dark: 0xb8b0a0, Hair: 0x3a3a3a } : null }, r => {
        if (this.horse !== q) return;
        for (const c of [...q.group.children]) if (c !== saddle && c !== mane) q.group.remove(c);
        q.group.remove(mane); saddle.position.set(0, 1.62, -0.05); saddle.scale.set(0.75, 1, 0.9);
        q.group.add(r.holder); q.legs = []; q.mixer = r.mixer; q.actions = r.actions; q.cur = null;
      });
      this.p.model.position.y = 1.05;
      this.p.mounted = true; this.p.mountSpeed = this.horseSpeed || 1.7; this.mounted = true;
      SFX.play('step'); this.hud.log('Atına bindin. (Saldırırsan inersin.)');
    } else {
      if (this.horse) this.p.group.remove(this.horse.group);
      this.horse = null; this.p.model.position.y = 0;
      this.p.mounted = false; this.p.mountSpeed = 1; this.mounted = false;
    }
    return true;
  }
  onAction() { if (this.mounted) { this.toggleMount(false); this.hud.log('Saldırmak için attan indin.'); } }
  onPlayerHit() { if (this.mounted && Math.random() < 0.3) { this.toggleMount(false); this.hud.log('Attan düştün!', 'dmg'); } }

  // ---------- Evcil hayvan ortak ----------
  _make(kind) {
    const fox = kind === 'grab', sq = fox && this.grabKind === 2;
    const q = buildQuad(sq ? { fur: 0xe8b030, dark: 0xfff0c0, body: [0.4, 0.4, 0.75], legH: 0.3, eye: 0x1a1a1a } : fox ? { fur: 0xe07a2a, dark: 0xf0e0d0, body: [0.45, 0.4, 0.9], legH: 0.35, eye: 0x1a1a1a } : { fur: 0x8a8a92, dark: 0x4a4a52, body: [0.6, 0.55, 1.2], legH: 0.55, eye: 0xffd23a });
    if (sq) { const t = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), new THREE.MeshLambertMaterial({ color: 0xffd23a, emissive: 0x3a2a00 })); t.scale.set(0.8, 1.4, 0.8); t.position.set(0, 0.85, -0.55); q.group.add(t); }
    const g = new THREE.Group(); g.add(q.group);
    const P = this.p.pos; g.position.set(P.x - 1.5, P.y, P.z - 1.5);
    const label = makeLabel(sq ? 'Altın Sincap' : fox ? 'Toplayıcı Tilki' : 'Savaş Kurdu', fox ? 'Toplayıcı' : 'Sv. ' + this.p.stats.level, sq ? '#ffd23a' : '#9fe3ff', '#ffe9a8');
    label.scale.set(3, 0.95, 1); label.position.y = fox ? 1.6 : 2.2; g.add(label);
    this.world.scene.add(g);
    return { group: g, legs: q.legs, heading: 0, phase: 0, get x() { return g.position.x; }, get z() { return g.position.z; }, label };
  }
  _remove(pet) { if (pet) this.world.scene.remove(pet.group); }
  _move(pet, tx, tz, speed, dt) {
    const g = pet.group.position, dx = tx - g.x, dz = tz - g.z, d = Math.hypot(dx, dz);
    if (d < 0.05) return 0;
    const st = Math.min(d, speed * dt), ox = g.x, oz = g.z;
    g.x += dx / d * st; g.z += dz / d * st;
    pet.heading = Math.atan2(dx, dz); pet.phase += dt * 14;
    pushOut(g, 0.4, this.world.obstacles);
    // duvara / engele takıldıysa hedefin yanına sıçra
    if (Math.hypot(g.x - ox, g.z - oz) < st * 0.3) { pet.stuck = (pet.stuck || 0) + dt; if (pet.stuck > 0.8) { g.x = tx - dx / d * 1.5; g.z = tz - dz / d * 1.5; pet.stuck = 0; } }
    else pet.stuck = 0;
    return d - st;
  }
  _anim(pet, moving) {
    const s = moving ? Math.sin(pet.phase) * 0.8 : 0;
    pet.legs.forEach((l, i) => { l.rotation.x = (i === 0 || i === 3 ? s : -s); });
    pet.group.rotation.y = pet.heading;
    pet.group.position.y = terrainHeight(pet.group.position.x, pet.group.position.z);
  }
  _follow(pet, dt, side) {
    const P = this.p.pos, a = this.p.heading + side;
    const tx = P.x - Math.sin(a) * 2.2, tz = P.z - Math.cos(a) * 2.2;
    const d = Math.hypot(tx - pet.x, tz - pet.z);
    if (d > 40) { pet.group.position.set(tx, 0, tz); return false; }
    if (d > 0.6) { this._move(pet, tx, tz, CONFIG.playerSpeed * (this.p.d.speed || 1) * (this.p.mountSpeed || 1) * (d > 6 ? 1.3 : 1), dt); return true; }
    return false;
  }

  toggleGrab(force) {
    const on = force === undefined ? !this.grab : force;
    if (on && !this.grab) { this.grab = this._make('grab'); this.grab.target = null; this.hud.log((this.grabKind === 2 ? 'Altın Sincap' : 'Toplayıcı Tilki') + ' çağrıldı. Yerdeki ganimeti toplar (🐾 penceresinden filtre).'); SFX.play('item'); }
    else if (!on && this.grab) { this._remove(this.grab); this.grab = null; }
    this.changed();
    return true;
  }
  toggleAtk(force) {
    const on = force === undefined ? !this.atk : force;
    if (on && !this.atk) {
      if (Date.now() < this.atkDeadUntil) { this.hud.log('Kurdun dinleniyor (' + Math.ceil((this.atkDeadUntil - Date.now()) / 1000) + ' sn).'); return false; }
      const L = this.p.stats.level;
      this.atk = this._make('atk');
      Object.assign(this.atk, { maxHp: 80 + 40 * L, hp: this._savedHp || 80 + 40 * L, cd: 0, r: 0.6, dead: false, attackAnim: 0 });
      this._savedHp = null;
      const pet = this.atk;
      pet.hurt = (dmg, m) => {
        if (pet.dead) return;
        const d = Math.max(1, Math.round(dmg * (0.9 + Math.random() * 0.2) * 100 / (100 + L * 3)));
        pet.hp -= d; this.hud.floatText({ x: pet.x, y: pet.group.position.y + 1.8, z: pet.z }, '-' + d, 'player');
        if (pet.hp <= 0) { pet.dead = true; this._remove(pet); this.atk = null; this.atkDeadUntil = Date.now() + 60000; this.hud.log('Savaş kurdun yaralandı ve geri çekildi. (60 sn)', 'dmg'); }
      };
      this.hud.log('Savaş Kurdu çağrıldı.'); SFX.play('item');
    } else if (!on && this.atk) { this._savedHp = this.atk.hp; this._remove(this.atk); this.atk = null; }
    return true;
  }

  update(dt) {
    const pl = this.p;
    if (pl.dead) { if (this.mounted) this.toggleMount(false); }
    // at: bacak animasyonu
    if (this.horse) {
      const h = this.horse;
      if (h.mixer) {
        const want = h.actions[pl.moving ? 'run' : 'idle'] || h.actions.idle;
        if (want && h.cur !== want) { if (h.cur) h.cur.fadeOut(0.2); want.reset().fadeIn(0.2).play(); h.cur = want; }
        h.mixer.update(dt);
      } else {
        const s = pl.moving ? Math.sin(performance.now() * 0.018) * 0.7 : 0;
        h.legs.forEach((l, i) => { l.rotation.x = (i === 0 || i === 3 ? s : -s); });
      }
    }
    // tilki: yakındaki ganimeti topla
    const g = this.grab;
    if (g) {
      if (g.target && (!this.loot.drops.includes(g.target))) g.target = null;
      if (!g.target) {
        let best = null, bd = this.grabKind === 2 ? 24 : 16;
        for (const d of this.loot.drops) { const dd = Math.hypot(d.x - pl.pos.x, d.z - pl.pos.z); if (dd < bd && d.cool <= 0 && this.wants(d)) { bd = dd; best = d; } }
        g.target = best;
      }
      let moving;
      if (g.target) {
        moving = this._move(g, g.target.x, g.target.z, this.grabKind === 2 ? 16 : 12, dt) > 0;
        if (Math.hypot(g.target.x - g.x, g.target.z - g.z) < 1.2) { this._petCollect(g.target); g.target = null; }
      } else moving = this._follow(g, dt, 0.9);
      this._anim(g, moving);
    }
    // savaş kurdu: oyuncunun hedefine saldır
    const a = this.atk;
    if (a) {
      const t = this.combat.target && !this.combat.target.dead && this.combat.attacking ? this.combat.target : null;
      let moving = false;
      if (a.cd > 0) a.cd -= dt;
      if (t && Math.hypot(t.x - pl.pos.x, t.z - pl.pos.z) < 30) {
        const d = Math.hypot(t.x - a.x, t.z - a.z);
        if (d > 2.2 + (t.type.hit || 1) * 0.5) moving = this._move(a, t.x, t.z, 9, dt) > 0;
        else {
          a.heading = Math.atan2(t.x - a.x, t.z - a.z);
          if (a.cd <= 0) {
            a.cd = 1.3; a.attackAnim = 0.3;
            const d0 = pl.d, K = 40 + 10 * pl.stats.level;
            const dmg = Math.max(1, Math.round((d0.phyMin + d0.phyMax) * 0.22 * K / (K + t.pdef) * (0.9 + Math.random() * 0.2)));
            this.combat.damageMonster(t, dmg, false, null);
            if (!t.dead && !t.targetEnt && Math.random() < 0.35) t.targetEnt = a;
          }
        }
      } else moving = this._follow(a, dt, -0.9);
      if (a.attackAnim > 0) { a.attackAnim -= dt; a.group.children[0].position.z = Math.sin((1 - a.attackAnim / 0.3) * Math.PI) * 0.5; }
      if (!this.combat.inSafe && a.hp < a.maxHp && !this.p.combatT) a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.01 * dt);
      if (this.atk) this._anim(a, moving);
    }
  }

  serialize() { return { m: this.mounted, hs: this.horseSpeed || 1.7, g: !!this.grab, gk: this.grabKind, f: this.filter, b: this.pinv.map(Inventory.enc), a: this.atk ? Math.round(this.atk.hp) : (this._savedHp || 0), ao: !!this.atk }; }
  load(d) {
    if (!d) return;
    this.grabKind = d.gk === 2 ? 2 : 1; this.filter = ['all', 'items', 'gold', 'gear'].includes(d.f) ? d.f : 'all';
    this.horseSpeed = d.hs || 1.7;
    (d.b || []).slice(0, 32).forEach((a, i) => { this.pinv[i] = Inventory.dec(a); });
    if (d.g) this.toggleGrab(true);
    if (d.ao) { this._savedHp = d.a || null; this.toggleAtk(true); }
    if (d.m && (this.p.inv.count('horse') || this.p.inv.count('horse2'))) this.toggleMount(true);
  }
}
