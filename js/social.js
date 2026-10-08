// Topluluk (iSRO'daki çok oyunculu sistemlerin tek oyunculu karşılığı):
// dünyada yaşayan yapay oyuncular (botlar), sohbet kanalları, parti ve parti eşleştirme, lonca (seviye, GP, depo,
// unvan, birlik), arkadaşlar, akademi, oyuncu tezgâhları, takas, PvP pelerini / düello / cinayet, onur (Hwan) ve sıralamalar.
// Botların listesi (kadro) sabit tohumla üretilir ve gerçek zamanla seviye atlar; oyuncuya özel ilişkiler kayıtta tutulur.

const SOC_EPOCH = Date.UTC(2026, 9, 1);
const SOC_NAME_A = ['Kara', 'Ak', 'Gök', 'Demir', 'Ateş', 'Buz', 'Kurt', 'Ejder', 'Aslan', 'Kartal', 'Yıldız', 'Ay', 'Güneş', 'Fırtına', 'Gölge', 'Kızıl', 'Sessiz', 'Deli', 'Usta', 'Genç',
  'Shadow', 'Dark', 'Silk', 'Night', 'Blood', 'Iron', 'Storm', 'Frost', 'Fire', 'Ghost', 'Sultan', 'Bozkır', 'Tuna', 'Altın', 'Gümüş', 'Kızıl', 'Rüzgâr', 'Toz', 'Mavi', 'Yeşim'];
const SOC_NAME_B = ['Kurt', 'Ejder', 'Kılıç', 'Ok', 'Bıçak', 'Savaşçı', 'Avcı', 'Han', 'Bey', 'Hatun', 'Knight', 'Mage', 'Blade', 'Lord', 'Wolf', 'Hunter', 'Rose', 'Slayer', 'Atlı', 'Yay',
  'Pençe', 'Kalkan', 'Ruh', 'Yürek', 'Şahin', 'Kaplan', 'Tilki', 'Pars', 'Doğan', 'Şimşek'];
const SOC_GUILDS = ['Ejderhanlar', 'İpekYolcuları', 'KaraKartal', 'Bozkurtlar', 'Valhalla', 'NightWolves', 'Anka', 'Turan', 'SilkroadTR', 'Legends', 'Tapınakçılar', 'KızılHan'];
// Onur seviyeleri (Hwan): eşik ve unvanlar
const HWAN_REQ = [0, 100, 300, 700, 1500, 3000, 6000, 12000];
const HWAN_TITLES = {
  ch: ['', 'Yüzbaşı', 'Komutan', 'Kıdemli Komutan', 'Baş Komutan', 'General', 'Mareşal', 'Ejder Lordu'],
  eu: ['', 'Şövalye', 'Baron', 'Vikont', 'Kont', 'Marki', 'Dük', 'Prens']
};
const hwanLevel = h => { let l = 0; HWAN_REQ.forEach((r, i) => { if (h >= r) l = i; }); return l; };
// Lonca seviyeleri: üye sınırı, depo yuvası, yükselme bedeli (GP + altın)
const GUILD_LV = [null,
  { cap: 15, slots: 0 },
  { cap: 20, slots: 30, gp: 2000, gold: 50000 },
  { cap: 30, slots: 45, gp: 6000, gold: 150000 },
  { cap: 40, slots: 60, gp: 15000, gold: 400000 },
  { cap: 50, slots: 90, gp: 35000, gold: 1000000 }];

// --- Kadro: 420 yapay oyuncu (ilk 180'i eski kayıtlarla uyumlu kalır) ---
const Roster = (() => {
  const rng = mulberry32(90210), list = [], used = new Set();
  const pick = a => a[Math.floor(rng() * a.length)];
  for (let i = 0; i < 420; i++) {
    let name;
    do {
      const r = rng();
      name = r < 0.55 ? pick(SOC_NAME_A) + pick(SOC_NAME_B) : r < 0.75 ? pick(SOC_NAME_A) + '_' + pick(SOC_NAME_B) : r < 0.9 ? pick(SOC_NAME_B) + Math.floor(rng() * 99 + 1) : 'xX' + pick(SOC_NAME_B) + 'Xx';
    } while (used.has(name));
    used.add(name);
    const race = rng() < 0.6 ? 'ch' : 'eu';
    const q = rng(), base = q < 0.3 ? 1 + rng() * 39 : q < 0.6 ? 40 + rng() * 50 : q < 0.85 ? 90 + rng() * 30 : 120 + rng() * 20;
    let w, cls = null, at;
    if (race === 'ch') {
      w = pick(['blade', 'sword', 'spear', 'glaive', 'bow', 'bow', 'blade']);
      const mage = (w === 'sword' || w === 'spear') && rng() < 0.6;
      at = mage ? 'garment' : w === 'bow' ? 'protector' : rng() < 0.6 ? 'armor' : 'protector';
      cls = w === 'blade' || w === 'sword' ? ['bicheon', mage ? 'force' : 'cold'] : w === 'bow' ? ['pacheon', 'lightning'] : ['heuksal', mage ? 'force' : 'fire'];
    } else {
      const combos = [['warrior', 'cleric'], ['warrior', 'bard'], ['rogue', 'warlock'], ['rogue', 'bard'], ['wizard', 'warlock'], ['wizard', 'bard'], ['cleric', 'bard'], ['warlock', 'cleric'], ['warrior', 'warlock']];
      cls = pick(combos);
      w = pick(MASTERIES[cls[0]].weapons);
      at = cls[0] === 'warrior' ? 'heavy' : cls[0] === 'rogue' ? 'light' : 'robe';
    }
    const g = rng() < 0.68 ? Math.floor(rng() * SOC_GUILDS.length) : -1;
    const job = rng() < 0.35 ? pick(['trader', 'hunter', 'thief']) : null;
    list.push({ id: i, name, race, base, rate: 0.15 + rng() * 1.1, w, at, cls, g, job, jlv: job ? 1 + Math.floor(rng() * 7) : 0,
      honor0: Math.floor(rng() * rng() * 4000), uq0: Math.floor(rng() * rng() * 40), seed: Math.floor(rng() * 1e6),
      robe: [0xb03a2e, 0x2e6aa8, 0x3a7a5a, 0x7a3a5a, 0x8a7a3a, 0x5a3a9a, 0x2a2a34][i % 7] });
  }
  return list;
})();
const socDays = () => Math.max(0, (Date.now() - SOC_EPOCH) / 864e5);
const botLevel = b => Math.min(140, Math.max(1, Math.floor(b.base + socDays() * b.rate + (b.lvBonus || 0))));
const botHonor = b => b.honor0 + Math.floor(socDays() * b.rate * 6) + (b.honorAdd || 0);
const botOnline = b => ((b.seed + Math.floor(Date.now() / 36e5) * 7919) % 100) < 58;
const botClassName = b => b.race === 'eu' ? b.cls.map(c => MASTERIES[c].name).join(' / ') : MASTERIES[b.cls[0]].name + ' · ' + MASTERIES[b.cls[1]].name;
const botHealer = b => b.cls.includes('force') || b.cls.includes('cleric');
// Botun görünür ekipmanı (derece seviyeye göre)
function botEquip(b) {
  const L = botLevel(b), d = degreeOf(L), rar = L >= 100 ? 2 : L >= 60 ? 1 : 0, eq = {};
  eq.weapon = makeItem(b.w + '_' + d, b.seed % 3 === 0 ? rar : 0, Math.min(12, Math.floor(L / 14)));
  if (WEAPON_TYPES[b.w].oneHand) eq.shield = makeItem('shield_' + d);
  for (const p of ARMOR_PARTS) if (p !== 'head' || b.seed % 2) eq[p] = makeItem(p + '_' + b.at + '_' + d, b.seed % 4 === 0 ? rar : 0);
  return eq;
}

// --- Sohbet satırları ---
const CHAT_LINES = {
  local: ['selam', 'sa', 'as', 'parti var mı {lv}+?', 'kimse yok mu', 'lol', 'şu {mob} çok can yakıyor', 'iksir bitti ya', 'brb', 'gold time ne zaman', 'birisi tamir yapsın', 'ehe', 'güzel drop geldi', '+{plus} oldu sonunda', 'ölmüşüm', 'yine lag mı', 'buff atar mısın', 'nerede kasılıyorsunuz', 'tezgâhıma bakın ucuz', 'kim gelir mezara?'],
  global: ['WTS +{plus} {item} — fiyat sor', 'WTB {elx} x10', '{guild} loncası üye alıyor, Sv. {lv}+ fısılda', 'Kale Savaşı bu akşam, herkes hazır olsun!', '{name} ile düello isteyen?', 'Satılık Ay Mührü set, fısılda', 'Tiger Girl çıktı mı?', 'Gold Time başladı mı?', 'Akademiye çırak arıyoruz', '{zone} partisi kuruluyor, {lv}-{lv2}'],
  guild: ['akşam toplanalım', 'lonca deposuna iksir koydum', 'GP bağışlayın arkadaşlar', 'kale savaşına kim geliyor', 'selam lonca', 'gz yeni seviye!', 'birlik sohbetine bakın'],
  party: ['buradayım', 'çek', 'iksir bitiyor', 'güzel', 'şimdi büyük olana', 'buff tazeledim', 'bekle mana dolsun', 'ilerle', 'gz!', 'iyi gidiyoruz'],
  reply: { selam: ['selam :)', 'as', 'selam kanka'], sa: ['as', 'aleyküm selam'], parti: ['gel', 'davet at', 'doluyuz sorry'], nasıl: ['iyi sen?', 'kasıyoz işte'], yardım: ['nerdesin?', 'geliyorum'], teşekkür: ['rica ederim', 'np'], '?': ['bilmem valla', 'hmm', 'sor bakalım'] },
  whisper: ['hey', 'parti?', 'takas yapalım mı', 'loncaya gel', 'nasılsın', 'bana +7 silah lazım', 'düello?']
};
const CHAN = {
  all:     { name: 'Hepsi', color: '#e8dcc0' },
  local:   { name: 'Genel', color: '#f0e6d0' },
  party:   { name: 'Parti', color: '#8ef0ff' },
  guild:   { name: 'Lonca', color: '#a8f07a' },
  union:   { name: 'Birlik', color: '#ffd27a' },
  whisper: { name: 'Fısıltı', color: '#ff9ae8' },
  global:  { name: 'Küresel', color: '#ffb84a' },
  sys:     { name: 'Bildiri', color: '#ffd23a' }
};

// --- Dünyadaki yapay oyuncu ---
class SimPlayer {
  constructor(soc, bot, mode, x, z) {
    this.soc = soc; this.bot = bot; this.mode = mode; this.lvl = botLevel(bot);
    this.maxHp = Math.round(mobHp(this.lvl) * 2.2); this.hp = this.maxHp;
    this.dead = false; this.downT = 0; this.atkCd = 0; this.swingT = 0; this.walkPhase = Math.random() * 6; this.heading = Math.random() * 6.28;
    this.r = 0.7; this.wait = Math.random() * 3; this.goal = null; this.target = null; this.searchT = 0; this.healT = 4; this.slot = 0;
    const skinCol = bot.race === 'eu' ? 0xf0c8a8 : 0xe8b98a;
    const h = this.h = buildHumanoid({ robe: bot.robe, robeDark: 0x2a1a10, skin: skinCol, hair: bot.race === 'eu' ? [0x6a4020, 0xc8a050, 0x3a2412][bot.id % 3] : 0x1a1410, hat: null, weapon: null });
    this.group = new THREE.Group(); this.group.add(h.group);
    this.eq = botEquip(bot);
    const opt = it => ({ d: ITEM_BASES[it.base].d, tier: 0, plus: it.plus || 0, rarity: it.rarity || 0 });
    h.setWeapon(bot.w, opt(this.eq.weapon));
    if (this.eq.shield) h.setShield(true, opt(this.eq.shield));
    if (WEAPON_TYPES[bot.w].dual) h.setOff(bot.w, opt(this.eq.weapon));
    if (bot.w === 'bow' || bot.w === 'staff' || bot.w === 'dstaff') { h.weapon.rotation.x = -Math.PI / 2; h.weapon.position.z = 0.1; }
    dressHumanoid(h, this.eq);
    if (mode === 'pvp') this._cape(0xc02020);
    this.hit = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.4, 8), new THREE.MeshBasicMaterial({ visible: false }));
    this.hit.position.y = 1.2; this.hit.userData.sim = this; this.group.add(this.hit);
    this.group.position.set(x, terrainHeight(x, z), z);
    this.home = { x, z };
    this.relabel();
    soc.world.scene.add(this.group);
  }
  get x() { return this.group.position.x; }
  get z() { return this.group.position.z; }
  get pos() { return this.group.position; }
  _cape(color) {
    if (this.cape) { this.h.group.remove(this.cape); this.cape = null; }
    if (!color) return;
    this.cape = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.05), new THREE.MeshLambertMaterial({ color }));
    this.cape.position.set(0, 1.25, -0.42); this.cape.rotation.x = 0.12; this.h.group.add(this.cape);
  }
  relabel() {
    if (this.label) { this.group.remove(this.label); this.label.material.map.dispose(); this.label.material.dispose(); }
    const b = this.bot, soc = this.soc;
    const inParty = soc.party.includes(b.id), inGuild = soc.guild && soc.guild.members.includes(b.id);
    const col = this.mode === 'pvp' ? '#ff7a6a' : inParty ? '#8ef0ff' : inGuild ? '#a8f07a' : '#ffffff';
    const gname = inGuild ? soc.guild.name : b.g >= 0 ? SOC_GUILDS[b.g] : '';
    const t = HWAN_TITLES[b.race][hwanLevel(botHonor(b))];
    this.label = makeLabel(b.name, (gname ? '[' + gname + '] ' : '') + 'Sv. ' + this.lvl + (t ? ' · ' + t : ''), col, '#d8e8ff');
    this.label.scale.set(3.5, 1.1, 1); this.label.position.y = 2.9; this.group.add(this.label);
    if (this.stallSign) { this.group.remove(this.stallSign); this.stallSign = null; }
    if (this.mode === 'stall') {
      this.stallSign = makeLabel(this.stallTitle || 'Tezgâh', 'tezgâh · dokun', '#ffd23a', '#ffe9a8');
      this.stallSign.scale.set(3.4, 1.06, 1); this.stallSign.position.y = 3.7; this.group.add(this.stallSign);
    }
  }
  hurt(dmg, m) {
    if (this.dead) return;
    this.hp -= dmg * 0.45;
    if (this.hp <= 0) this.down();
  }
  down() {
    this.dead = true; this.downT = 0; this.target = null;
    if (this.soc.party.includes(this.bot.id)) this.soc.chat.add('party', this.bot.name, ['öldüm :(', 'düştüm, diriltin', 'ah be'][this.bot.id % 3]);
  }
  _move(tx, tz, speed, dt) {
    const p = this.group.position, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    if (d < 0.1) { this.moving = false; return 0; }
    this.heading += angleDiff(this.heading, Math.atan2(dx, dz)) * Math.min(1, dt * 10);
    const st = Math.min(d, speed * dt);
    p.x += dx / d * st; p.z += dz / d * st;
    pushOut(p, 0.5, this.soc.world.obstacles);
    if (Dungeon.on) Dungeon.clamp(p, 0.5);
    this.moving = true;
    return d - st;
  }
  _validMob(m, near) {
    if (!m || m.dead || m.removed || m.walker || m.follow || m.pvp || m.type.job) return false;
    if (m.rank === 'unique' && !near) return false;
    return !inSafeZone(m.x, m.z);
  }
  _strike(m) {
    const soc = this.soc, party = soc.party.includes(this.bot.id);
    const W = WEAPON_TYPES[this.bot.w];
    const dmg = Math.max(1, Math.round(mobHp(this.lvl) / (party ? 8 : 11) * (0.8 + Math.random() * 0.4)));
    this.swingT = 0.3;
    const apply = () => {
      if (m.dead) return;
      m.hp -= dmg; m.provoked = true;
      if (!m.targetEnt || m.targetEnt.dead) m.targetEnt = this;
      if (m.state === 'idle' || m.state === 'return') m.state = 'chase';
      if (m.onHit && m.hp > 0) m.onHit();
      if (party && soc.near(m, 30)) soc.combat.fx(m, String(dmg), 'party');
      if (m.hp <= 0) {
        m.hp = 0;
        if (party) soc.combat.killMonster(m);
        else { m.die(); if (m.onKilled) m.onKilled(soc.combat); }
      }
    };
    if (W.ranged && soc.near(this, 60)) soc.combat.vfx.projectile({ x: this.x, y: this.pos.y + 1.6, z: this.z }, m, W.ammo ? 'arrow' : projKind(W.magic), apply);
    else apply();
  }
  _fight(dt, m) {
    const W = WEAPON_TYPES[this.bot.w], range = W.ranged ? Math.min(12, W.range) : 2.4;
    const d = Math.hypot(m.x - this.x, m.z - this.z);
    if (d > range) { this._move(m.x, m.z, 6.4, dt); return; }
    this.moving = false; this.heading = Math.atan2(m.x - this.x, m.z - this.z);
    if (this.atkCd <= 0) { this.atkCd = W.spd * 1.1; this._strike(m); }
  }
  update(dt) {
    const soc = this.soc, P = soc.player.pos, p = this.group.position;
    const dp = Math.hypot(P.x - p.x, P.z - p.z);
    this.group.visible = !this.engaged && !this.cull && dp < (CONFIG.isTouch ? 110 : 170);
    const sh = this.group.visible && dp < (CONFIG.isTouch ? 26 : 45);      // uzaktakiler gölge düşürmez (çizim çağrısı tasarrufu)
    if (sh !== this._sh) { this._sh = sh; this.h.group.traverse(o => { if (o.isMesh) o.castShadow = sh; }); }
    if (this.engaged) return;
    const party = soc.party.includes(this.bot.id);
    this.label.visible = Settings.data.names && (dp < 16 || party && dp < 30);
    if (this.stallSign) this.stallSign.visible = dp < 28;
    if (this.atkCd > 0) this.atkCd -= dt;
    if (this.swingT > 0) this.swingT -= dt;
    if (this.dead) {
      this.downT += dt;
      this.h.group.rotation.z = Math.min(Math.PI / 2, this.downT * 4); p.y = terrainHeight(p.x, p.z) + 0.3;
      if (this.downT > (party ? 12 : 20)) {
        this.dead = false; this.hp = this.maxHp; this.h.group.rotation.z = 0;
        if (this.mode === 'ally' && soc.allyBase) p.set(soc.allyBase.x + (Math.random() - 0.5) * 6, 0, soc.allyBase.z + (Math.random() - 0.5) * 6);
        else if (!party && (this.mode === 'hunt' || this.mode === 'pvp') && dp > 40) p.set(this.home.x, terrainHeight(this.home.x, this.home.z), this.home.z);   // görünmezken alanına geri döner
        else if (!party) { const s = soc.townSpot(); p.set(s.x, terrainHeight(s.x, s.z), s.z); if (this.mode === 'hunt') this.mode = 'travel'; if (this.mode === 'travel') { this.trip = { ph: 'rest', t: 20 }; this.home = s; this.goal = null; this.target = null; } }
      }
      return;
    }
    if (dp > 140 && !party && this.mode !== 'travel') return;                   // uzaktakiler uyur (yolcular yürümeye devam eder)
    this.moving = false;
    if (party) this._party(dt, dp);
    else if (this.mode === 'hunt' || this.mode === 'pvp') this._hunt(dt);
    else if (this.mode === 'town') this._wander(dt);
    else if (this.mode === 'ally') this._ally(dt);
    else if (this.mode === 'travel') this._travel(dt);
    // can yenilenmesi
    if (this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + this.maxHp * (this.target ? 0.01 : 0.05) * dt);
    p.y = terrainHeight(p.x, p.z) - (this.mode === 'stall' ? 0.38 : 0);
    this.group.rotation.y = this.heading;
    if (this.group.visible) this._animate(dt);
  }
  _wander(dt) {
    this.wait -= dt;
    if (this.goal) { if (this._move(this.goal.x, this.goal.z, 2.6, dt) < 0.3) { this.goal = null; this.wait = 3 + Math.random() * 8; } }
    else if (this.wait <= 0) { const s = this.soc.townSpot(); this.goal = Math.hypot(s.x - this.x, s.z - this.z) < 25 ? s : { x: this.home.x + (Math.random() - 0.5) * 10, z: this.home.z + (Math.random() - 0.5) * 10 }; }
  }
  _hunt(dt) {
    const soc = this.soc;
    this.searchT -= dt;
    if (this.target && !this._validMob(this.target, true)) this.target = null;
    if (!this.target && this.searchT <= 0) {
      this.searchT = 2 + Math.random();
      let best = null, bd = 30;
      for (const m of soc.monsters.list) {
        if (!this._validMob(m) || Math.abs(m.level - this.lvl) > 12) continue;
        if (m === soc.combat.target || (m.state === 'chase' && !m.targetEnt)) continue;     // oyuncunun avını çalmaz
        const d = Math.hypot(m.x - this.home.x, m.z - this.home.z);
        if (d < bd) { bd = d; best = m; }
      }
      this.target = best;
    }
    if (this.target) {
      if (this.target === soc.combat.target) { this.target = null; return; }
      this._fight(dt, this.target);
    } else this._wander2(dt);
  }
  // Etkinlik müttefiki: en yakın rakibe saldırır, yoksa hedef noktaya ilerler
  _ally(dt) {
    const soc = this.soc;
    this.searchT -= dt;
    if (this.target && (this.target.dead || this.target.removed)) this.target = null;
    if (!this.target || this.searchT <= 0) {
      this.searchT = 1;
      let best = null, bd = 45;
      for (const m of soc.monsters.list) { if (m.dead || m.removed || !m.evEnemy) continue; const d = Math.hypot(m.x - this.x, m.z - this.z); if (d < bd) { bd = d; best = m; } }
      this.target = best;
    }
    if (this.target) { this._fight(dt, this.target); return; }
    const g = soc.allyGoal; if (g && Math.hypot(g.x - this.x, g.z - this.z) > 4) this._move(g.x + (this.slot % 3 - 1) * 3, g.z + (this.slot - 1) * 2, 6, dt);
  }
  // Yolcu: şehirden kapıdan çıkar, av alanına koşar, bir süre avlanır, şehre döner, dinlenir, tekrar çıkar
  _go(tx, tz, speed, dt) {
    const w = townWaypoint(this.soc.world, this.x, this.z, tx, tz), r = this._move(w.x, w.z, speed, dt);
    return w.x === tx && w.z === tz ? r : r + 50;
  }
  _travel(dt) {
    const soc = this.soc, T = this.trip || (this.trip = { ph: inSafeZone(this.x, this.z) ? 'rest' : 'hunt', t: 5 + Math.random() * 30 });
    if (T.ph === 'out') {
      if (!this.goal) {
        let ms = soc.monsters.list.filter(m => !m.dead && !m.type.job && !m.walker && !m.pvp && Math.abs(m.level - this.lvl) < 12 && !inSafeZone(m.x, m.z));
        const nearT = ms.filter(m => Math.hypot(m.x, m.z) < 150); if (nearT.length > 4) ms = nearT;     // çoğunlukla şehre yakın alanlar (yollar canlı kalsın)
        const m = ms.length ? ms[Math.floor(Math.random() * ms.length)] : null;
        if (!m) { T.ph = 'rest'; T.t = 30; return; }
        this.goal = { x: m.x + (Math.random() - 0.5) * 10, z: m.z + (Math.random() - 0.5) * 10 };
      }
      if (this._go(this.goal.x, this.goal.z, 5.2, dt) < 3) { this.home = this.goal; this.goal = null; T.ph = 'hunt'; T.t = 60 + Math.random() * 150; }
    } else if (T.ph === 'hunt') {
      this._hunt(dt); T.t -= dt;
      if (T.t <= 0 && !this.target) { T.ph = 'in'; this.goal = soc.townSpot(); }
    } else if (T.ph === 'in') {
      if (!this.goal) this.goal = soc.townSpot();
      if (this._go(this.goal.x, this.goal.z, 5.2, dt) < 1) { this.home = this.goal; this.goal = null; T.ph = 'rest'; T.t = 15 + Math.random() * 40; }
    } else {
      this._wander(dt); T.t -= dt;
      if (T.t <= 0) { T.ph = 'out'; this.goal = null; }
    }
  }
  _wander2(dt) {
    this.wait -= dt;
    if (this.goal) { if (this._move(this.goal.x, this.goal.z, 3.2, dt) < 0.5) { this.goal = null; this.wait = 2 + Math.random() * 5; } }
    else if (this.wait <= 0) this.goal = { x: this.home.x + (Math.random() - 0.5) * 24, z: this.home.z + (Math.random() - 0.5) * 24 };
  }
  _party(dt, dp) {
    const soc = this.soc, pl = soc.player, P = pl.pos, c = soc.combat;
    if (dp > 45 || pl.dead && dp > 20) { const a = this.slot * 1.1 + 2; this.group.position.set(P.x + Math.sin(a) * 3, terrainHeight(P.x, P.z), P.z + Math.cos(a) * 3); return; }
    // şifacı: oyuncuyu iyileştirir
    this.healT -= dt;
    if (botHealer(this.bot) && this.healT <= 0 && !pl.dead && pl.stats.hp / pl.stats.maxHp < 0.6) {
      this.healT = 7;
      const h = Math.round(pl.stats.maxHp * 0.18); pl.stats.hp = Math.min(pl.stats.maxHp, pl.stats.hp + h);
      c.fx(pl, '+' + h, 'heal'); c.vfx.heal(P.x, P.z); this.swingT = 0.3;
    }
    let t = this.target && this._validMob(this.target, true) ? this.target : null;
    if (!t || Math.hypot(t.x - P.x, t.z - P.z) > 30) {
      t = null;
      const ct = c.target && !c.target.dead && !c.target.pvp ? c.target : null;
      if (ct && Math.hypot(ct.x - P.x, ct.z - P.z) < 30) t = ct;
      else {
        let bd = 16;
        for (const m of soc.monsters.list) {
          if (m.dead || m.pvp || m.walker || m.state !== 'chase') continue;
          const d = Math.hypot(m.x - P.x, m.z - P.z);
          if (d < bd && (!m.targetEnt || soc.party.includes(m.targetEnt.bot && m.targetEnt.bot.id))) { bd = d; t = m; }
        }
      }
    }
    this.target = t;
    if (t && !inSafeZone(t.x, t.z)) { this._fight(dt, t); return; }
    const a = this.slot * 1.1 + 2.4, fx = P.x + Math.sin(pl.heading + a) * 2.6, fz = P.z + Math.cos(pl.heading + a) * 2.6;
    if (Math.hypot(fx - this.x, fz - this.z) > 1.2) this._move(fx, fz, Math.max(6.5, (pl.d.speed || 1) * 8), dt);
  }
  _animate(dt) {
    const h = this.h;
    if (this.mode === 'stall') { h.legL.rotation.x = h.legR.rotation.x = -1.45; h.armL.rotation.x = h.armR.rotation.x = -0.4; return; }
    this.walkPhase += dt * (this.moving ? 10 : 0);
    const k = this.moving ? 0.6 : 0, s = Math.sin(this.walkPhase);
    h.legL.rotation.x = s * k; h.legR.rotation.x = -s * k;
    h.armL.rotation.x = -s * k * 0.8;
    h.armR.rotation.x = this.swingT > 0 ? -2.2 * Math.sin((this.swingT / 0.3) * Math.PI) : s * k * 0.8;
  }
  dispose() { this.soc.world.scene.remove(this.group); }
}

// --- Sohbet ---
class ChatLog {
  constructor(soc) { this.soc = soc; this.lines = []; this.onAdd = null; }
  add(ch, from, text) {
    const l = { ch, from, text, t: Date.now() };
    this.lines.push(l); if (this.lines.length > 150) this.lines.shift();
    const C = CHAN[ch] || CHAN.local;
    if (Settings.data.chatlog !== false || ch === 'whisper' || ch === 'party' || ch === 'sys')
      this.soc.hud.log((ch === 'local' ? '' : '[' + C.name + '] ') + (from ? from + ': ' : '') + text, 'chat', C.color);
    if (this.onAdd) this.onAdd(l);
  }
}

// --- Topluluk yöneticisi ---
class Social {
  constructor(o) {
    Object.assign(this, o);       // world, player, monsters, combat, hud, loot, jobs
    this.sims = []; this.party = []; this.friends = []; this.guild = null; this.academy = null;
    this.honor = 0; this.pk = 0; this.duelW = 0; this.duelL = 0; this.murderT = 0; this.murders = 0; this.cape = false;
    this.stall = { open: false, title: 'Tezgâhım', items: [] }; this.stallBought = {}; this.sold = 0;
    this.chat = new ChatLog(this); this.player.title = this.player.title || '';
    this.timers = { local: 8 + Math.random() * 10, global: 30 + Math.random() * 30, guild: 40, party: 30, ambush: 120, gp: 60, stall: 5, acad: 600 };
    this.onChange = null;
    this._spawnZone();
  }
  changed() { if (this.onChange) this.onChange(); }
  bot(id) { return Roster[id]; }
  sim(id) { return this.sims.find(s => s.bot.id === id); }
  near(e, r) { const P = this.player.pos; return Math.hypot(e.x - P.x, e.z - P.z) < r; }
  townSpot() {
    if (Dungeon.on) return { x: (Math.random() - 0.5) * 8, z: 4 + Math.random() * 4 };
    for (let k = 0; k < 30; k++) {
      const x = (Math.random() - 0.5) * 44, z = (Math.random() - 0.5) * 44;
      if (Math.abs(x) < 4 && Math.abs(z) < 4) continue;
      if (this.world.obstacles.some(o => Math.hypot(o.x - x, o.z - z) < o.r + 1.6)) continue;
      return { x, z };
    }
    return { x: 6, z: 6 };
  }
  _zoneRange() {
    let lo = 140, hi = 1;
    for (const s of ZONE.spawns || []) { lo = Math.min(lo, s[4]); hi = Math.max(hi, s[5]); }
    if (ZONE.uniques) for (const u of ZONE.uniques) hi = Math.max(hi, u.level);
    return [lo, hi];
  }
  // Bölgeye uygun çevrimiçi botları dünyaya yerleştir
  _spawnZone() {
    const [lo, hi] = this._zoneRange(), rng = mulberry32((Math.floor(Date.now() / 6e5) * 31 + (ZONE.seed || 1) * 977) | 0);
    const busy = new Set();
    const cand = Roster.filter(b => botOnline(b));
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const touch = CONFIG.isTouch, N = touch ? 15 : 26;
    let grp = null;
    const take = (filter, n, mode) => {
      for (const b of shuffle(cand.filter(b => !busy.has(b.id) && filter(b))).slice(0, n)) {
        busy.add(b.id);
        let x, z, md = mode;
        if (md === 'hunt' || md === 'pvp') {
          if (md === 'hunt' && grp && rng() < 0.4 && Math.abs(grp.lv - botLevel(b)) < 12) { x = grp.x + (rng() - 0.5) * 6; z = grp.z + (rng() - 0.5) * 6; }    // birlikte kasılan gruplar
          else {
            const ms = this.monsters.list.filter(m => !m.dead && !m.type.job && Math.abs(m.level - botLevel(b)) < 10 && !inSafeZone(m.x, m.z));
            if (!ms.length) md = 'town'; else { const m = ms[Math.floor(rng() * ms.length)]; x = m.x + (rng() - 0.5) * 8; z = m.z + (rng() - 0.5) * 8; grp = { x, z, lv: botLevel(b) }; }
          }
        }
        if (md === 'travel' && rng() < 0.5) {         // yarısı yolda başlar
          const s = this.townSpot(), a = rng() * 6.283, r = 45 + rng() * 60; x = Math.sin(a) * r; z = Math.cos(a) * r;
          if (inSafeZone(x, z)) { x = s.x; z = s.z; }
        }
        if (x === undefined) { const s = this.townSpot(); x = s.x; z = s.z; }
        const sim = new SimPlayer(this, b, md, x, z);
        if (md === 'stall') { sim.stallTitle = this._stallTitle(b); sim.heading = Math.atan2(-x, -z); sim.relabel(); }
        this.sims.push(sim);
      }
    };
    const fit = b => botLevel(b) >= lo - 3 && botLevel(b) <= hi + 6;
    if (IS_DUNGEON) take(b => botLevel(b) >= lo - 4 && botLevel(b) <= hi + 8, touch ? 4 : 7, 'hunt');
    else {
      const stalls = touch ? 3 : 5, town = touch ? 2 : 4, trav = touch ? 3 : 5, pvp = hi >= 20 ? (touch ? 1 : 2) : 0;
      take(() => true, stalls, 'stall');
      take(() => true, town, 'town');
      take(fit, trav, 'travel');
      take(fit, N - stalls - town - trav - pvp, 'hunt');
      if (pvp) take(b => botLevel(b) >= Math.max(20, lo - 3) && botLevel(b) <= hi + 6, pvp, 'pvp');
    }
  }
  _stallTitle(b) { return ['Ucuz eşya!', 'Mühürlü set', 'İksir & iksir', '+7 silahlar', 'Elixir burada', 'Her şey yarı fiyat', 'Simya malzemesi'][b.seed % 7]; }

  // ---------- Kayıt ----------
  serialize() {
    return { party: this.party, friends: this.friends, guild: this.guild ? { ...this.guild, storage: this.guild.storage.map(Inventory.enc) } : null, academy: this.academy,
      honor: this.honor, pk: this.pk, dw: this.duelW, dl: this.duelL, murderT: Math.round(this.murderT), murders: this.murders, cape: this.cape,
      stall: { title: this.stall.title, items: this.stall.items.map(x => ({ e: Inventory.enc(x.it), p: x.price })) }, sold: this.sold };
  }
  load(d) {
    if (!d) return;
    this.party = (d.party || []).filter(id => Roster[id]).slice(0, 7);
    this.friends = (d.friends || []).filter(id => Roster[id]);
    if (d.guild) { this.guild = { ...d.guild, storage: (d.guild.storage || []).map(Inventory.dec) }; this.guild.members = (this.guild.members || []).filter(id => Roster[id]); }
    this.academy = d.academy || null;
    this.honor = d.honor | 0; this.pk = d.pk | 0; this.duelW = d.dw | 0; this.duelL = d.dl | 0; this.murderT = d.murderT || 0; this.murders = d.murders | 0;
    if (d.stall) { this.stall.title = d.stall.title || 'Tezgâhım'; this.stall.items = (d.stall.items || []).map(x => ({ it: Inventory.dec(x.e), price: x.p })).filter(x => x.it); }
    this.sold = d.sold | 0;
    this.setCape(!!d.cape, true);
    for (const id of this.party) this._joinSim(id);
    this.applyHonor();
    this.changed();
  }

  // ---------- Kesişen sistemler ----------
  expMult() {
    let k = 1;
    const n = this.party.filter(id => { const s = this.sim(id); return s && !s.dead && this.near(s, 50); }).length;
    if (n) k *= 1 + 0.08 * n;                                     // parti bonusu
    if (this.guild) k *= 1 + 0.01 * this.guild.lv;               // lonca bereketi
    if (this.academy && this.academy.role === 'junior') k *= 1.15;   // akademi öğrencisi
    return k;
  }
  applyHonor() {
    const l = hwanLevel(this.honor);
    this.player.hwan = l; this.player.title = HWAN_TITLES[this.player.race || 'ch'][l] || '';
    this.player.recalc();
  }
  addHonor(n, why) {
    const before = hwanLevel(this.honor);
    this.honor = Math.max(0, this.honor + n);
    if (n > 0) this.hud.log('+' + n + ' onur puanı' + (why ? ' (' + why + ')' : ''), 'lvl', '#ffb84a');
    if (hwanLevel(this.honor) > before) {
      const t = HWAN_TITLES[this.player.race][hwanLevel(this.honor)];
      this.hud.banner('Yeni unvan: ' + t, 'Onur seviyesi ' + hwanLevel(this.honor) + ' · saldırı +%' + hwanLevel(this.honor), 'quest'); SFX.play('levelup');
      this.chat.add('global', null, this.player.name + ' artık bir ' + t + '!');
    }
    this.applyHonor(); this.changed();
  }
  onPlayerLevel(lvl) {
    for (const id of this.party.slice(0, 2)) this.chat.add('party', Roster[id].name, ['gz!', 'tebrikler', 'gz gz', 'ooo yeni seviye'][id % 4]);
    if (this.guild && this.guild.members.length) this.chat.add('guild', Roster[this.guild.members[lvl % this.guild.members.length]].name, 'gz ' + this.player.name + '!');
    if (this.academy && this.academy.role === 'junior' && lvl >= 40) this.graduate();
  }
  onKill(m) {
    // parti üyeleri birlikte gelişir
    for (const id of this.party) { const b = Roster[id]; if (botLevel(b) < this.player.stats.level + 3 && Math.random() < 0.02) { b.lvBonus = (b.lvBonus || 0) + 1; const s = this.sim(id); if (s) { s.lvl = botLevel(b); s.relabel(); } } }
    if (m.rank === 'unique') {
      this.chat.add('global', null, this.player.name + ', ' + m.type.name + ' adlı Unique canavarı yendi!');
      this.addHonor(3, 'Unique');
      this.uqKills = (this.uqKills || 0) + 1;
    }
  }

  // ---------- Parti ----------
  _joinSim(id) {
    let s = this.sim(id);
    const P = this.player.pos;
    if (!s) { s = new SimPlayer(this, Roster[id], 'party', P.x + 2, P.z + 2); this.sims.push(s); }
    s.mode = 'party'; s._cape(null); s.slot = this.party.indexOf(id); s.relabel();
    return s;
  }
  invite(id) {
    const b = Roster[id], L = this.player.stats.level, lv = botLevel(b);
    if (this.party.includes(id)) return { ok: false, msg: b.name + ' zaten partinde.' };
    if (this.party.length >= 7) return { ok: false, msg: 'Parti dolu (8 kişi).' };
    const chance = Math.abs(lv - L) <= 20 ? 0.8 : 0.3;
    if (Math.random() > chance + (this.friends.includes(id) ? 0.15 : 0)) { this.chat.add('whisper', b.name, ['sorry şu an olmaz', 'başka partideyim', 'seviyemiz çok farklı'][id % 3]); return { ok: false, msg: b.name + ' daveti reddetti.' }; }
    this.party.push(id); this._joinSim(id);
    this.chat.add('party', b.name, ['selam parti', 'geldim', 'hadi başlayalım', 'selamlar'][id % 4]);
    this.changed();
    return { ok: true, msg: b.name + ' partiye katıldı.' };
  }
  kick(id) {
    const i = this.party.indexOf(id); if (i < 0) return;
    this.party.splice(i, 1);
    const s = this.sim(id); if (s) { s.mode = 'town'; s.target = null; s.relabel(); }
    this.party.forEach((pid, k) => { const x = this.sim(pid); if (x) x.slot = k; });
    this.hud.log(Roster[id].name + ' partiden ayrıldı.'); this.changed();
  }
  leaveParty() { for (const id of this.party.slice()) this.kick(id); }
  // Parti eşleştirme: bölgedeki seviye aralığına uygun ilanlar
  matching() {
    const L = this.player.stats.level, rng = mulberry32(Math.floor(Date.now() / 3e5) + L * 13), out = [];
    const pool = Roster.filter(b => botOnline(b) && Math.abs(botLevel(b) - L) <= 8 && !this.party.includes(b.id));
    const goals = IS_DUNGEON ? [ZONE.name + ' temizliği', 'Boss avı'] : ['EXP partisi', 'Unique avı', 'Zindan partisi', 'Görev partisi', 'Simya malzemesi avı', 'Kervan koruması'];
    for (let i = 0; i < 6 && pool.length >= 2; i++) {
      const n = 1 + Math.floor(rng() * 3), mem = [];
      for (let k = 0; k < n && pool.length; k++) mem.push(pool.splice(Math.floor(rng() * pool.length), 1)[0].id);
      const lead = Roster[mem[0]], lv = botLevel(lead);
      out.push({ id: i, lead: mem[0], members: mem, title: goals[Math.floor(rng() * goals.length)], lv: [Math.max(1, lv - 5), Math.min(140, lv + 5)], exp: rng() < 0.5 ? 'EXP paylaşımlı' : 'Serbest EXP', item: rng() < 0.5 ? 'Sırayla eşya' : 'Serbest eşya' });
    }
    return out;
  }
  joinMatch(ad) {
    if (this.party.length + ad.members.length > 7) return { ok: false, msg: 'Bu parti için yer yok.' };
    if (Math.random() < 0.15) return { ok: false, msg: Roster[ad.lead].name + ' başvurunu reddetti (parti doldu).' };
    for (const id of ad.members) if (!this.party.includes(id)) { this.party.push(id); this._joinSim(id); }
    this.chat.add('party', Roster[ad.lead].name, 'hoş geldin! ' + ad.title + ' başlıyor');
    this.changed();
    return { ok: true, msg: 'Partiye katıldın: ' + ad.title };
  }

  // ---------- Lonca ----------
  createGuild(name) {
    name = (name || '').trim().replace(/[<>]/g, '').slice(0, 14);
    const pl = this.player;
    if (this.guild) return { ok: false, msg: 'Zaten bir loncan var.' };
    if (name.length < 3) return { ok: false, msg: 'Lonca adı en az 3 harf olmalı.' };
    if (SOC_GUILDS.includes(name)) return { ok: false, msg: 'Bu adda bir lonca var.' };
    if (pl.stats.level < 20) return { ok: false, msg: 'Lonca kurmak için 20. seviye gerekli.' };
    if (pl.stats.gold < 50000) return { ok: false, msg: 'Lonca kurmak 50.000 altın.' };
    pl.stats.gold -= 50000;
    this.guild = { name, lv: 1, gp: 0, members: [], grants: {}, storage: [], notice: 'Hoş geldiniz!', union: -1, created: Date.now() };
    this.chat.add('global', null, name + ' loncası kuruldu!');
    for (const s of this.sims) s.relabel();
    this.changed();
    return { ok: true, msg: name + ' loncası kuruldu!' };
  }
  guildInvite(id) {
    const g = this.guild, b = Roster[id];
    if (!g) return { ok: false, msg: 'Önce bir lonca kur (Topluluk → Lonca).' };
    if (g.members.includes(id)) return { ok: false, msg: b.name + ' zaten loncada.' };
    if (g.members.length + 1 >= GUILD_LV[g.lv].cap) return { ok: false, msg: 'Lonca dolu (' + GUILD_LV[g.lv].cap + '). Loncayı yükselt.' };
    if (Math.random() > (b.g >= 0 ? 0.25 : 0.7)) { this.chat.add('whisper', b.name, b.g >= 0 ? 'kendi loncamı bırakamam' : 'şimdilik loncasız kalayım'); return { ok: false, msg: b.name + ' daveti reddetti.' }; }
    g.members.push(id); b.g = -1;
    this.chat.add('guild', b.name, 'selam lonca, katıldım!');
    const s = this.sim(id); if (s) s.relabel();
    this.changed();
    return { ok: true, msg: b.name + ' loncaya katıldı.' };
  }
  guildKick(id) { const g = this.guild; if (!g) return; g.members = g.members.filter(x => x !== id); delete g.grants[id]; const s = this.sim(id); if (s) s.relabel(); this.changed(); }
  donate(n) {
    const g = this.guild, book = this.player.book; n = Math.floor(n);
    if (!g || n <= 0) return { ok: false, msg: '' };
    if (book.sp < n) return { ok: false, msg: 'Yeterli SP yok.' };
    book.sp -= n; g.gp += n; book.changed(); this.changed();
    return { ok: true, msg: n + ' SP loncaya GP olarak bağışlandı.' };
  }
  guildUp() {
    const g = this.guild, nx = g && GUILD_LV[g.lv + 1];
    if (!nx) return { ok: false, msg: 'Lonca en üst seviyede.' };
    if (g.gp < nx.gp) return { ok: false, msg: nx.gp.toLocaleString('tr-TR') + ' GP gerekli.' };
    if (this.player.stats.gold < nx.gold) return { ok: false, msg: nx.gold.toLocaleString('tr-TR') + ' altın gerekli.' };
    g.gp -= nx.gp; this.player.stats.gold -= nx.gold; g.lv++;
    this.hud.banner(g.name + ' Sv. ' + g.lv, 'Üye sınırı ' + nx.cap + ' · depo ' + nx.slots + ' yuva', 'quest'); SFX.play('levelup');
    this.changed();
    return { ok: true, msg: 'Lonca ' + g.lv + '. seviyeye çıktı!' };
  }
  union(idx) {
    const g = this.guild;
    if (!g || g.lv < 2) return { ok: false, msg: 'Birlik için lonca 2. seviye olmalı.' };
    if (idx < 0) { g.union = -1; this.changed(); return { ok: true, msg: 'Birlikten ayrıldınız.' }; }
    if (Math.random() < 0.35) return { ok: false, msg: SOC_GUILDS[idx] + ' birlik teklifini reddetti.' };
    g.union = idx; this.chat.add('union', SOC_GUILDS[idx], 'birliğe hoş geldiniz!'); this.changed();
    return { ok: true, msg: SOC_GUILDS[idx] + ' ile birlik kuruldu.' };
  }
  storeIn(slot) {
    const g = this.guild, inv = this.player.inv, it = inv.slots[slot];
    if (!g || !it) return;
    if (g.storage.filter(Boolean).length >= GUILD_LV[g.lv].slots) { this.hud.log('Lonca deposu dolu (ya da lonca 1. seviyede: depo yok).', 'dmg'); return; }
    g.storage.push(it); inv.slots[slot] = null; inv.changed(); this.changed();
  }
  storeOut(i) {
    const g = this.guild, inv = this.player.inv, it = g && g.storage[i];
    if (!it) return;
    if (!inv.add(it)) { this.hud.log('Envanter dolu.', 'dmg'); return; }
    g.storage.splice(i, 1); this.changed();
  }

  // ---------- Arkadaşlar ----------
  addFriend(id) {
    const b = Roster[id];
    if (this.friends.includes(id)) return { ok: false, msg: b.name + ' zaten arkadaşın.' };
    if (this.friends.length >= 50) return { ok: false, msg: 'Arkadaş listesi dolu.' };
    if (Math.random() < 0.12) return { ok: false, msg: b.name + ' isteği reddetti.' };
    this.friends.push(id); this.changed();
    this.chat.add('whisper', b.name, 'eklendin :)');
    return { ok: true, msg: b.name + ' arkadaş listene eklendi.' };
  }
  removeFriend(id) { this.friends = this.friends.filter(x => x !== id); this.changed(); }

  // ---------- Akademi ----------
  joinAcademy() {
    const L = this.player.stats.level;
    if (this.academy) return { ok: false, msg: 'Zaten bir akademidesin.' };
    if (L >= 40) return { ok: false, msg: 'Akademiye öğrenci olarak yalnızca 40. seviyenin altında katılınır.' };
    const g = SOC_GUILDS[Math.floor(Math.random() * SOC_GUILDS.length)];
    this.academy = { role: 'junior', name: g + ' Akademisi', since: Date.now() };
    this.changed();
    return { ok: true, msg: this.academy.name + '\'ne katıldın: 40. seviyeye kadar +%15 EXP.' };
  }
  createAcademy() {
    if (this.academy) return { ok: false, msg: 'Zaten bir akademidesin.' };
    if (this.player.stats.level < 60) return { ok: false, msg: 'Akademi kurmak için 60. seviye gerekli.' };
    const juniors = Roster.filter(b => botLevel(b) < 35).slice(0, 4).map(b => b.id);
    this.academy = { role: 'senior', name: this.player.name + ' Akademisi', juniors, pts: 0, since: Date.now() };
    this.changed();
    return { ok: true, msg: 'Akademin kuruldu. Öğrencilerin geliştikçe onur puanı kazanırsın.' };
  }
  graduate() {
    const pl = this.player;
    this.hud.banner('Akademiden mezun oldun!', 'Ödüller envanterinde', 'quest'); SFX.play('questdone');
    pl.stats.gold += 30000; pl.inv.addStack('elx_w', 3); pl.inv.addStack('elx_a', 5); pl.inv.addStack('luck', 3);
    this.addHonor(40, 'mezuniyet');
    this.academy = null; this.changed();
  }
  leaveAcademy() { this.academy = null; this.changed(); }

  // ---------- Bot tezgâhları ----------
  stallItems(sim) {
    const b = sim.bot, hour = Math.floor(Date.now() / 36e5), key = b.id + ':' + hour;
    if (sim._stallKey === key) return sim._stall;
    const rng = mulberry32(b.seed + hour * 131), L = botLevel(b), out = [];
    for (let i = 0; i < 6; i++) {
      const it = randomGear(Math.max(1, L - 10 + Math.floor(rng() * 14)), rng, 2.5); it.uid = 0;
      if (rng() < 0.4) it.plus = Math.floor(rng() * rng() * 8);
      out.push({ it, price: Math.round(itemInfo(it).value * (0.85 + rng() * 0.8)) });
    }
    for (const st of ['elx_w', 'elx_a', 'luck', potFor(L, 'hp'), potFor(L, 'mp')]) if (rng() < 0.6) {
      const n = st.startsWith('hp') || st.startsWith('mp') ? 50 : 1 + Math.floor(rng() * 4);
      out.push({ it: makeStack(st, n), price: Math.round(ITEM_BASES[st].value * n * (0.9 + rng() * 0.5)) });
    }
    const bought = this.stallBought[key] || [];
    sim._stall = out.filter((x, i) => !bought.includes(i)).map((x, i) => x); sim._stallKey = key;
    sim._stallAll = out;
    return sim._stall;
  }
  buyStall(sim, idx) {
    const list = this.stallItems(sim), x = list[idx], pl = this.player;
    if (!x) return { ok: false, msg: '' };
    if (pl.stats.gold < x.price) return { ok: false, msg: 'Yeterli altın yok.' };
    const it = { ...x.it, uid: _itemUid++ };
    if (!pl.inv.add(it)) return { ok: false, msg: 'Envanter dolu.' };
    pl.stats.gold -= x.price;
    const key = sim._stallKey; (this.stallBought[key] = this.stallBought[key] || []).push(sim._stallAll.indexOf(x));
    list.splice(idx, 1);
    this.chat.add('whisper', sim.bot.name, ['iyi kullan', 'teşekkürler', 'hayırlı olsun'][sim.bot.id % 3]);
    this.changed();
    return { ok: true, msg: itemInfo(it).name + ' satın alındı (' + x.price.toLocaleString('tr-TR') + ' altın).' };
  }

  // ---------- Oyuncu tezgâhı ----------
  stallAdd(slot, price) {
    const inv = this.player.inv, it = inv.slots[slot];
    if (!it || this.stall.open) return;
    if (this.stall.items.length >= 10) { this.hud.log('Tezgâhta en çok 10 eşya olur.', 'dmg'); return; }
    this.stall.items.push({ it, price: Math.max(1, Math.round(price || this.fairPrice(it))) }); inv.slots[slot] = null; inv.changed(); this.changed();
  }
  stallRemove(i) {
    const x = this.stall.items[i]; if (!x || this.stall.open) return;
    if (!this.player.inv.add(x.it)) { this.hud.log('Envanter dolu.', 'dmg'); return; }
    this.stall.items.splice(i, 1); this.changed();
  }
  fairPrice(it) { const n = itemInfo(it); return Math.round(n.stack ? n.value * (it.n || 1) : n.value); }
  openStall() {
    const pl = this.player;
    if (!inSafeZone(pl.pos.x, pl.pos.z) || IS_DUNGEON) return { ok: false, msg: 'Tezgâh yalnızca şehirde açılır.' };
    if (!this.stall.items.length) return { ok: false, msg: 'Önce tezgâha eşya koy.' };
    this.stall.open = true; this.stall.at = { x: pl.pos.x, z: pl.pos.z }; pl.target = null; pl.sitting = true;
    if (!this.stallSign) { this.stallSign = makeLabel(this.stall.title, 'tezgâh açık', '#ffd23a', '#ffe9a8'); this.stallSign.scale.set(4.6, 1.44, 1); this.stallSign.position.y = 3.9; }
    pl.group.add(this.stallSign);
    this.changed();
    return { ok: true, msg: 'Tezgâh açıldı. Yürürsen kapanır.' };
  }
  closeStall(msg) {
    if (!this.stall.open) return;
    this.stall.open = false; this.player.sitting = false;
    if (this.stallSign) { this.player.group.remove(this.stallSign); this.stallSign.material.map.dispose(); this.stallSign = null; }
    if (msg) this.hud.log(msg); this.changed();
  }
  _stallTick() {
    const pl = this.player;
    if (Math.hypot(pl.pos.x - this.stall.at.x, pl.pos.z - this.stall.at.z) > 0.5) { this.closeStall('Tezgâh kapandı (yürüdün).'); return; }
    for (let i = this.stall.items.length - 1; i >= 0; i--) {
      const x = this.stall.items[i], fair = this.fairPrice(x.it), ratio = x.price / Math.max(1, fair);
      const p = 0.05 * clamp(1.7 - ratio, 0, 1.3);
      if (Math.random() < p) {
        const buyer = Roster[Math.floor(Math.random() * Roster.length)], net = Math.round(x.price * 0.98);
        pl.stats.gold += net; this.sold += net;
        this.stall.items.splice(i, 1);
        this.hud.log(buyer.name + ' tezgâhından ' + itemInfo(x.it).name + ' aldı: +' + net.toLocaleString('tr-TR') + ' altın', 'gold');
        SFX.play('gold');
      }
    }
    if (!this.stall.items.length) this.closeStall('Tezgâhındaki her şey satıldı!');
    this.changed();
  }

  // ---------- Takas ----------
  tradeOffer(id, items) {
    const b = Roster[id], L = botLevel(b), rng = mulberry32(b.seed + Math.floor(Date.now() / 6e5));
    let sum = 0;
    for (const it of items) {
      const n = itemInfo(it), near = n.stack || Math.abs((n.req || 1) - L) < 20;
      sum += this.fairPrice(it) * (near ? 0.45 + rng() * 0.35 : 0.32);
    }
    return Math.round(sum);
  }
  tradeDo(id, slots, offer) {
    const inv = this.player.inv;
    for (const i of slots) inv.slots[i] = null;
    inv.changed(); this.player.stats.gold += offer;
    this.chat.add('whisper', Roster[id].name, 'takas için sağ ol');
    this.hud.log('Takas tamamlandı: +' + offer.toLocaleString('tr-TR') + ' altın', 'gold'); SFX.play('gold');
    this.changed();
  }

  // ---------- PvP ----------
  setCape(on, silent) {
    const pl = this.player;
    if (on && pl.stats.level < 20) { if (!silent) this.hud.log('PvP pelerini 20. seviyeden itibaren.', 'dmg'); return false; }
    if (on && this.jobs && this.jobs.job) { if (!silent) this.hud.log('Meslek kıyafetiyle PvP pelerini giyemezsin.', 'dmg'); return false; }
    this.cape = on;
    if (pl.pvpCape) { pl.model.remove(pl.pvpCape); pl.pvpCape = null; }
    if (on) {
      pl.pvpCape = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.25, 0.06), new THREE.MeshLambertMaterial({ color: 0xc02020, emissive: 0x200000 }));
      pl.pvpCape.position.set(0, 1.25, -0.44); pl.pvpCape.rotation.x = 0.12; pl.model.add(pl.pvpCape);
      this.timers.ambush = 60 + Math.random() * 60;
    }
    if (!silent) this.hud.log(on ? 'PvP pelerinini giydin: şehir dışında pelerinli oyuncular sana saldırabilir.' : 'PvP pelerinini çıkardın.', on ? 'dmg' : 'sys');
    this.changed();
    return true;
  }
  // Bot ile çatışma: bot gizlenir, yerine aynı görünümde savaşan bir "canavar" çıkar (hedefleme, yetenek, hasar aynen işler)
  // Yapay oyuncu görünümünde savaşan bir "canavar" üret (PvP, arenalar, Kale Savaşı)
  makePvpMob(b, lvl, x, z, mode, eq) {
    const W = WEAPON_TYPES[b.w], key = 'pvp_' + b.id;
    MONSTER_TYPES[key] = { name: b.name, model: 'human', look: { robe: b.robe, dark: 0x2a1a10, weapon: b.w, skin: b.race === 'eu' ? 0xf0c8a8 : 0xe8b98a },
      hpM: mode === 'duel' ? 1.1 : 1.3, dmgM: 0.7, defM: 1.1, expM: 0, speed: 6.4, aggro: 40, range: W.ranged ? Math.min(11, W.range) : 2.6, atkInt: 1.25, hit: 1.1, scale: 1, labelY: 3.2, magic: !!W.magic };
    const m = new Monster(this.world, key, lvl, { x, z }, { rank: 'normal' });
    m.pvp = mode; m.noRespawn = true; m.respawnTime = 4; m.noLeash = true; m.state = 'chase'; m.provoked = true; m.bot = b;
    eq = eq || botEquip(b);
    if (m.h) { const opt = it => ({ d: ITEM_BASES[it.base].d, plus: it.plus || 0, rarity: it.rarity || 0 }); if (eq.shield) m.h.setShield(true, opt(eq.shield)); if (W.dual) m.h.setOff(b.w, opt(eq.weapon)); dressHumanoid(m.h, eq); }
    m.displayName = b.name; m._makeLabel();
    this.monsters.list.push(m);
    return m;
  }
  // Bot ile çatışma: bot gizlenir, yerine aynı görünümde savaşan bir "canavar" çıkar (hedefleme, yetenek, hasar aynen işler)
  engage(sim, mode) {
    if (sim.engaged || sim.dead) return null;
    const m = this.makePvpMob(sim.bot, sim.lvl, sim.x, sim.z, mode, sim.eq);
    m.sim = sim; sim.engaged = m; sim.group.visible = false;
    this.fight = m;
    return m;
  }
  _endEngage(m, won) {
    const sim = m.sim; if (!sim) return;
    sim.engaged = null;
    if (won) { sim.down(); sim.group.position.set(m.x, terrainHeight(m.x, m.z), m.z); }
    else { sim.group.position.set(m.x, terrainHeight(m.x, m.z), m.z); }
    m.removed = true; m.dead = true;
    if (this.fight === m) this.fight = null;
    if (this.combat.target === m) this.combat.clearTarget();
  }
  // Combat.killMonster PvP hedefleri için burayı çağırır
  onPvpKill(m) {
    const b = m.sim.bot, L = this.player.stats.level, lv = m.level;
    if (m.pvp === 'duel') { this.duelW++; this.addHonor(5, 'düello'); this.chat.add('local', b.name, ['gg', 'iyi dövüştün', 'rövanş isterim'][b.id % 3]); this.hud.banner('Düelloyu kazandın!', b.name + ' yenildi', 'quest'); }
    else if (m.pvp === 'murder') { this.murders++; this.murderT = 1800; this.hud.log('Pelerinsiz bir oyuncuyu öldürdün: KATİL durumundasın (30 dk). Ölürsen ağır kayıp yaşarsın.', 'dmg'); this.chat.add('global', null, this.player.name + ' masum bir oyuncuyu öldürdü!'); }
    else { this.pk++; this.addHonor(10 + Math.max(0, lv - L) * 2, 'PvP'); b.honorAdd = (b.honorAdd || 0) - 5; }
    setTimeout(() => this._endEngage(m, true), 3500);
  }
  // Combat.damagePlayer düelloda ölümcül vuruşu buraya yönlendirir
  duelLost(m) {
    this.duelL++; this.hud.banner('Düelloyu kaybettin', m.sim.bot.name + ' kazandı', 'unique');
    this.chat.add('local', m.sim.bot.name, ['gg', 'kolay oldu :P', 'iyi deneme'][m.sim.bot.id % 3]);
    this.player.stats.hp = Math.max(1, Math.round(this.player.stats.maxHp * 0.1));
    this._endEngage(m, false);
  }
  duel(id) {
    const s = this.sim(id), pl = this.player;
    if (!s || !this.near(s, 20)) return { ok: false, msg: 'Düello için yakında olmalısınız.' };
    if (inSafeZone(pl.pos.x, pl.pos.z) || inSafeZone(s.x, s.z)) return { ok: false, msg: 'Şehirde düello yapılmaz. Şehir dışına çıkın.' };
    if (this.party.includes(id)) this.kick(id);
    if (Math.random() < 0.2) return { ok: false, msg: s.bot.name + ' düelloyu reddetti.' };
    this.hud.banner('Düello!', s.bot.name + ' · 3 saniye', 'unique');
    setTimeout(() => { const m = this.engage(s, 'duel'); if (m) this.combat.select(m, true); }, 3000);
    return { ok: true, msg: s.bot.name + ' düelloyu kabul etti.' };
  }
  attackBot(sim, murder) {
    const pl = this.player;
    if (inSafeZone(pl.pos.x, pl.pos.z) || inSafeZone(sim.x, sim.z)) return { ok: false, msg: 'Şehirde PvP yapılmaz.' };
    if (this.party.includes(sim.bot.id)) return { ok: false, msg: 'Parti üyene saldıramazsın.' };
    const m = this.engage(sim, murder ? 'murder' : 'pvp'); if (m) this.combat.select(m, true);
    return { ok: true, msg: '' };
  }
  _ambush() {
    const pl = this.player, P = pl.pos, L = pl.stats.level;
    const cands = Roster.filter(b => botOnline(b) && Math.abs(botLevel(b) - L) <= 6 && !this.party.includes(b.id) && !this.friends.includes(b.id) && !(this.guild && this.guild.members.includes(b.id)) && !this.sim(b.id));
    const b = cands[Math.floor(Math.random() * cands.length)];
    if (!b) return;
    const a = Math.random() * 6.28, x = P.x + Math.sin(a) * 20, z = P.z + Math.cos(a) * 20;
    if (inSafeZone(x, z)) return;
    const s = new SimPlayer(this, b, 'pvp', x, z); this.sims.push(s);
    this.chat.add('local', b.name, ['pelerinli av buldum!', 'gel bakalım', 'PvP!'][b.id % 3]);
    this.engage(s, 'pvp');
    this.hud.log(b.name + ' (pelerinli) sana saldırıyor!', 'dmg');
  }

  // ---------- Sıralamalar ----------
  rankings(kind) {
    const pl = this.player, me = { name: pl.name, me: true };
    let rows;
    if (kind === 'level') { rows = Roster.map(b => ({ name: b.name, v: botLevel(b), sub: botClassName(b) })); me.v = pl.stats.level; me.sub = 'Sen'; }
    else if (kind === 'honor') { rows = Roster.map(b => ({ name: b.name, v: botHonor(b), sub: HWAN_TITLES[b.race][hwanLevel(botHonor(b))] || '—' })); me.v = this.honor; me.sub = pl.title || '—'; }
    else if (kind === 'unique') { rows = Roster.map(b => ({ name: b.name, v: b.uq0 + Math.floor(socDays() * b.rate * 0.3), sub: 'Unique' })); me.v = this.uqKills || 0; me.sub = 'Unique'; }
    else if (kind === 'guild') {
      rows = SOC_GUILDS.map((g, i) => ({ name: g, v: Roster.filter(b => b.g === i).reduce((a, b) => a + botLevel(b), 0), sub: Roster.filter(b => b.g === i).length + ' üye' }));
      if (this.guild) { me.name = this.guild.name; me.v = this.guild.members.reduce((a, id) => a + botLevel(Roster[id]), pl.stats.level) + this.guild.gp / 100; me.sub = (this.guild.members.length + 1) + ' üye'; } else me.v = -1;
    } else {
      rows = Roster.filter(b => b.job === kind).map(b => ({ name: b.name, v: b.jlv * 1000 + Math.floor(socDays() * b.rate * 40), sub: 'Sv. ' + b.jlv }));
      me.v = this.jobs && this.jobs.job === kind ? this.jobs.level() * 1000 + Math.floor(this.jobs.jexp || 0) : -1; me.sub = 'Sen';
    }
    if (me.v >= 0) rows.push(me);
    rows.sort((a, b) => b.v - a.v);
    rows.forEach((r, i) => { r.rank = i + 1; });
    return { top: rows.slice(0, 20), me: rows.find(r => r.me) };
  }

  // ---------- Tıklama ----------
  pick(raycaster) {
    const hits = this.sims.filter(s => s.group.visible && !s.engaged).map(s => s.hit);
    const h = raycaster.intersectObjects(hits, false)[0];
    return h ? h.object.userData.sim : null;
  }

  // ---------- Döngü ----------
  update(dt) {
    const pl = this.player;
    // görünürlük bütçesi: en yakın N yapay oyuncu çizilir (telefonda çizim çağrısı sınırı)
    if ((this._visT = (this._visT || 0) - dt) <= 0) {
      this._visT = 0.5; const P = pl.pos, cap = CONFIG.isTouch ? 10 : 18;
      const ord = this.sims.filter(x => !x.engaged).map(x => [x, Math.hypot(x.x - P.x, x.z - P.z) - (this.party.includes(x.bot.id) ? 1e4 : 0)]).sort((a, b) => a[1] - b[1]);
      ord.forEach(([x], i) => { x.cull = i >= cap; });
    }
    for (const s of this.sims) s.update(dt);
    // biten çatışmalar (oyuncu şehre kaçtı / öldü / uzaklaştı)
    if (this.fight) {
      const m = this.fight;
      if (m.removed) this.fight = null;
      else if (!m.dead && (pl.dead || inSafeZone(pl.pos.x, pl.pos.z) || Math.hypot(m.x - pl.pos.x, m.z - pl.pos.z) > 60)) {
        if (pl.dead && m.pvp === 'pvp') this.chat.add('local', m.sim.bot.name, 'kolay av');
        this._endEngage(m, false);
      }
    }
    if (this.murderT > 0) this.murderT -= dt;
    // pelerinli botlar: pelerinliyken yakından geçersen saldırır
    if (this.cape && !pl.dead && !this.fight && !inSafeZone(pl.pos.x, pl.pos.z)) {
      for (const s of this.sims) if (s.mode === 'pvp' && !s.engaged && !s.dead && this.near(s, 14) && Math.random() < dt * 0.4) { this.engage(s, 'pvp'); this.hud.log(s.bot.name + ' sana saldırıyor!', 'dmg'); break; }
      if (!IS_DUNGEON && (this.timers.ambush -= dt) <= 0) { this.timers.ambush = 100 + Math.random() * 80; this._ambush(); }
    }
    if (this.stall.open && (this.timers.stall -= dt) <= 0) { this.timers.stall = 5; this._stallTick(); }
    this._chatter(dt);
    // lonca: üyeler zamanla GP kazandırır
    if (this.guild && (this.timers.gp -= dt) <= 0) { this.timers.gp = 60; this.guild.gp += this.guild.members.length * 2; }
    if (this.academy && this.academy.role === 'senior' && (this.timers.acad -= dt) <= 0) { this.timers.acad = 600; this.addHonor(2, 'akademi'); }
  }
  _fill(t) {
    const L = this.player.stats.level, r = a => a[Math.floor(Math.random() * a.length)];
    const anyMob = this.monsters.list.find(m => !m.dead && m.rank !== 'unique');
    return t.replace('{lv2}', String(Math.min(140, L + 10))).replace('{lv}', String(Math.max(1, L - 5 + Math.floor(Math.random() * 10))))
      .replace('{mob}', anyMob ? anyMob.type.name : 'canavar').replace('{plus}', String(4 + Math.floor(Math.random() * 6)))
      .replace('{item}', ITEM_BASES[r(raceWeapons()) + '_' + degreeOf(L)].name).replace('{elx}', r(['Güçlendirme İksiri', 'Şans Tozu', 'Koruma Taşı']))
      .replace('{guild}', r(SOC_GUILDS)).replace('{name}', r(Roster).name).replace('{zone}', ZONE.name);
  }
  _chatter(dt) {
    const t = this.timers, near = this.sims.filter(s => !s.engaged && this.near(s, 40) && !this.party.includes(s.bot.id));
    if ((t.local -= dt) <= 0) { t.local = 20 + Math.random() * 30; if (near.length) { const s = near[Math.floor(Math.random() * near.length)]; this.chat.add('local', s.bot.name, this._fill(CHAT_LINES.local[Math.floor(Math.random() * CHAT_LINES.local.length)])); } }
    if ((t.global -= dt) <= 0) { t.global = 70 + Math.random() * 80; this.chat.add('global', Roster[Math.floor(Math.random() * Roster.length)].name, this._fill(CHAT_LINES.global[Math.floor(Math.random() * CHAT_LINES.global.length)])); }
    if (this.guild && this.guild.members.length && (t.guild -= dt) <= 0) { t.guild = 60 + Math.random() * 60; const id = this.guild.members[Math.floor(Math.random() * this.guild.members.length)]; this.chat.add('guild', Roster[id].name, CHAT_LINES.guild[Math.floor(Math.random() * CHAT_LINES.guild.length)]); }
    if (this.party.length && (t.party -= dt) <= 0) { t.party = 45 + Math.random() * 45; const id = this.party[Math.floor(Math.random() * this.party.length)]; this.chat.add('party', Roster[id].name, CHAT_LINES.party[Math.floor(Math.random() * CHAT_LINES.party.length)]); }
  }
  // Oyuncunun yazdığı mesaj
  // El hareketleri: /selam /dans /eğil /sevin /hayır /ağla /otur
  emote(kind) {
    const pl = this.player, EM = { wave: '👋', dance: '💃', bow: '🙇', cheer: '🎉', no: '🙅', cry: '😢' };
    if (kind === 'sit') { const r = pl.toggleSit(); if (typeof r === 'string') this.hud.log(r, 'dmg'); return; }
    pl.doEmote(kind); this.combat.fx(pl, EM[kind] || '', 'buff');
    const near = this.sims.filter(s => !s.engaged && !s.dead && this.near(s, 14));
    if (near.length && Math.random() < 0.7) { const s = near[Math.floor(Math.random() * near.length)]; setTimeout(() => this.chat.add('local', s.bot.name, { wave: 'selam :)', dance: 'hahaha güzel dans', bow: 'saygılar', cheer: 'yaşasııın', no: 'neden ki?', cry: 'ağlama ya :(' }[kind] || ':)'), 900 + Math.random() * 1500); }
  }
  say(ch, text, to) {
    text = (text || '').trim().slice(0, 120); if (!text) return { ok: false };
    const emo = { '/selam': 'wave', '/dans': 'dance', '/eğil': 'bow', '/egil': 'bow', '/sevin': 'cheer', '/hayır': 'no', '/hayir': 'no', '/ağla': 'cry', '/agla': 'cry', '/otur': 'sit' }[text.toLocaleLowerCase('tr-TR')];
    if (emo) { this.emote(emo); return { ok: true }; }
    const m = /^\/(w|p|g|u|k)\s+(.*)$/i.exec(text);
    if (m) { const map = { w: 'whisper', p: 'party', g: 'guild', u: 'union', k: 'global' }; ch = map[m[1].toLowerCase()]; text = m[2]; if (ch === 'whisper') { const sp = text.indexOf(' '); to = sp > 0 ? text.slice(0, sp) : text; text = sp > 0 ? text.slice(sp + 1) : ''; } }
    if (ch === 'party' && !this.party.length) return { ok: false, msg: 'Partin yok.' };
    if (ch === 'guild' && !this.guild) return { ok: false, msg: 'Loncan yok.' };
    if (ch === 'union' && !(this.guild && this.guild.union >= 0)) return { ok: false, msg: 'Birliğin yok.' };
    let target = null;
    if (ch === 'whisper') { target = Roster.find(b => b.name.toLowerCase() === (to || '').toLowerCase()); if (!target) return { ok: false, msg: 'Böyle bir oyuncu yok: ' + (to || '?') }; if (!botOnline(target) && !this.party.includes(target.id)) return { ok: false, msg: target.name + ' çevrimdışı.' }; }
    if (ch === 'global') { if (!this.player.inv.take('gchat', 1)) return { ok: false, msg: 'Küresel sohbet için Küresel Sohbet Parşömeni gerekli (Item Mall).' }; }
    this.chat.add(ch, this.player.name + (target ? ' → ' + target.name : ''), text);
    // cevap
    const low = text.toLocaleLowerCase('tr-TR');
    let rep = null;
    for (const k in CHAT_LINES.reply) if (low.includes(k)) { rep = CHAT_LINES.reply[k]; break; }
    let who = target;
    if (!who && ch === 'party') who = Roster[this.party[Math.floor(Math.random() * this.party.length)]];
    if (!who && ch === 'guild' && this.guild.members.length) who = Roster[this.guild.members[Math.floor(Math.random() * this.guild.members.length)]];
    if (!who && ch === 'local') { const near = this.sims.filter(s => this.near(s, 30) && !s.engaged); if (near.length && (rep || Math.random() < 0.4)) who = near[Math.floor(Math.random() * near.length)].bot; }
    if (who && (rep || ch === 'whisper' || Math.random() < 0.5)) {
      const line = (rep || CHAT_LINES.reply['?'])[Math.floor(Math.random() * (rep || CHAT_LINES.reply['?']).length)];
      setTimeout(() => this.chat.add(ch, who.name + (ch === 'whisper' ? ' → ' + this.player.name : ''), line), 1200 + Math.random() * 2500);
    }
    return { ok: true };
  }
}
