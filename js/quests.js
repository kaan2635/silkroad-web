// Görev sistemi: öldür / topla / ulaş / teslim et. Görev vericiler: Kaptan Lee, Tüccar Ali, Demirci Wen.

// type: 'kill' (target = canavar türü) | 'collect' (target = 'stone') | 'visit' (target = bölge adı) | 'deliver' (to = NPC id)
// type: 'kill' (target = canavar türü) | 'collect' (target = görev eşyası) | 'visit' (target = bölge adı) | 'deliver' (to = NPC id)
// reward: { exp, gold, items: [[base, adet]], gear: { base, rarity } } — base 'WEAPON_d' / 'CHEST_d' oyuncunun silah / zırh türüne göre seçilir
const QUEST_DEFS = [
  { id: 'wolves', name: 'Kurt Sürüsü', giver: 'captain', minLevel: 1, type: 'kill', target: 'wolf', n: 6, noun: 'Kurt',
    desc: 'Vadideki kurtlar kervanlara saldırıyor. Şehrin dışındaki 6 kurdu avla.',
    reward: { exp: 70, gold: 50, items: [['hp1', 10]] } },
  { id: 'fangs', name: 'Kurt Dişleri', giver: 'merchant', minLevel: 1, type: 'collect', target: 'q_fang', n: 5, noun: 'Kurt Dişi',
    desc: 'Şifacılar ilaç için kurt dişi istiyor. Kurtlardan 5 Kurt Dişi topla.',
    reward: { gold: 100, gear: { base: 'necklace_1', rarity: 0 } } },
  { id: 'parcel', name: 'Kaptanın Mektubu', giver: 'captain', minLevel: 2, type: 'deliver', to: 'smith',
    desc: 'Bu mektubu Demirci Wen\'e ulaştır. Kendisi meydanın batısında.',
    reward: { exp: 60, gold: 40, items: [['arrow', 500]] } },
  { id: 'oasis', name: 'Yeşim Vahası', giver: 'merchant', minLevel: 2, type: 'visit', target: 'Yeşim Vahası',
    desc: 'Kervanlar su için Yeşim Vahası\'na uğrar. Yolu keşfet: vahayı bul (şehrin batı-güneybatısı).',
    reward: { exp: 150, gold: 80, items: [['mp1', 10]] } },
  { id: 'scorp', name: 'Çöl Zehri', giver: 'captain', minLevel: 4, after: 'wolves', type: 'kill', target: 'scorpion', n: 8, noun: 'Dev Akrep',
    desc: 'Akrep Çölü\'nde dev akrepler yolu kapattı. 8 akrebi temizle. Zehirlerine karşı Evrensel Hap taşı.',
    reward: { exp: 450, gold: 150, gear: { base: 'WEAPON_1', rarity: 1 } } },
  { id: 'smith', name: 'Ocak İçin İğne', giver: 'smith', minLevel: 4, type: 'collect', target: 'q_tail', n: 5, noun: 'Akrep İğnesi',
    desc: 'Simya iksirlerimde akrep iğnesi kullanıyorum. 5 Akrep İğnesi getir, karşılığında sana güçlendirme iksiri vereyim.',
    reward: { gold: 120, items: [['elx_w', 2], ['elx_a', 3], ['luck', 1]] } },
  { id: 'bandit', name: 'Haydut Kampları', giver: 'captain', minLevel: 6, after: 'scorp', type: 'kill', target: 'bandit', n: 8, noun: 'Haydut',
    desc: 'Harabelerdeki haydutlar kervanları soyuyor. 8 haydutu etkisiz hale getir.',
    reward: { exp: 900, gold: 300, gear: { base: 'CHEST_1', rarity: 2 } } },
  { id: 'caravan', name: 'Kızıl Kum Denizi', giver: 'merchant', minLevel: 8, after: 'oasis', type: 'visit', target: 'Kızıl Kum Denizi',
    desc: 'Kervan yolunun ucunda, şehirden çok uzakta Kızıl Kum Denizi var. Orayı keşfet ve haber getir. Dikkatli ol!',
    reward: { exp: 1400, gold: 400, items: [['luck', 2], ['elx_a', 3], ['ms_str', 1]] } },
  { id: 'golem', name: 'Kum Devleri', giver: 'captain', minLevel: 10, after: 'bandit', type: 'kill', target: 'golem', n: 8, noun: 'Kum Devi',
    desc: 'Kızıl Kum Denizi\'nde kum devleri uyandı. 8 devi yık; şehrin güvenliği sana emanet.',
    reward: { exp: 3000, gold: 800, gear: { base: 'WEAPON_2', rarity: 1 }, items: [['astral', 1]] } }
];

class QuestManager {
  constructor(player, hud, world) {
    this.p = player; this.hud = hud; this.world = world;
    this.combat = null;
    this.state = {};          // id -> { s: 'active'|'ready'|'done', p: ilerleme }
    this.region = null;
    this.onChange = null;
    this.defs = QUEST_DEFS;
  }

  def(id) { return this.defs.find(q => q.id === id); }
  _changed() { if (this.onChange) this.onChange(); }

  // none | locked | active | ready | done
  status(q) {
    const st = this.state[q.id];
    if (st) return st.s;
    if (this.p.stats.level < q.minLevel) return 'locked';
    if (q.after && !(this.state[q.after] && this.state[q.after].s === 'done')) return 'locked';
    return 'none';
  }
  lockText(q) {
    if (this.p.stats.level < q.minLevel) return 'Sv. ' + q.minLevel + ' gerekli';
    if (q.after) { const a = this.def(q.after); return 'Önce: ' + a.name; }
    return '';
  }
  progress(q) { const st = this.state[q.id]; return st ? st.p : 0; }
  need(q) { return q.n || 1; }
  turnTo(q) { return q.type === 'deliver' ? q.to : q.giver; }

  accept(id) {
    const q = this.def(id);
    if (!q || this.status(q) !== 'none') return { ok: false, msg: 'Bu görev şu an alınamaz.' };
    this.state[id] = { s: 'active', p: 0 };
    if (q.type === 'deliver') this.state[id] = { s: 'ready', p: 1 };
    this.hud.log('Görev alındı: ' + q.name, 'lvl');
    SFX.play('quest');
    if (q.type === 'visit' && this.region === q.target) this._add(q, 1);   // zaten oradaysa
    if (q.type === 'collect') this._syncCollect();
    this._changed();
    return { ok: true, msg: 'Görev alındı: ' + q.name };
  }

  _add(q, n) {
    const st = this.state[q.id];
    if (!st || st.s !== 'active') return;
    st.p = Math.min(this.need(q), st.p + n);
    if (st.p >= this.need(q)) {
      st.s = 'ready';
      this.hud.log('Görev tamamlandı: ' + q.name + ' — ödül için ' + this._npcName(this.turnTo(q)) + '\'e dön.', 'lvl');
      if (this.hud.banner) this.hud.banner('Görev Tamamlandı', q.name, 'quest');
      SFX.play('questdone');
    } else this.hud.log(q.name + ': ' + st.p + '/' + this.need(q), 'sys', '#ffe08a');
    this._changed();
  }

  _npcName(id) { const n = (typeof NPC_DEFS !== 'undefined') && NPC_DEFS.find(d => d.id === id); return n ? n.name : id; }

  onKill(typeKey) { for (const q of this.defs) if (q.type === 'kill' && q.target === typeKey) this._add(q, 1); }
  onCollect() { this._syncCollect(); }
  // Toplama görevleri: ilerleme = envanterdeki adet
  _syncCollect() {
    for (const q of this.defs) {
      if (q.type !== 'collect') continue;
      const st = this.state[q.id];
      if (!st || st.s === 'done') continue;
      const c = Math.min(q.n, this.p.inv.count(q.target));
      if (c !== st.p) {
        const was = st.s;
        st.p = c; st.s = c >= q.n ? 'ready' : 'active';
        if (st.s === 'ready' && was !== 'ready') {
          this.hud.log('Görev tamamlandı: ' + q.name + ' — ödül için ' + this._npcName(this.turnTo(q)) + '\'e dön.', 'lvl');
          if (this.hud.banner) this.hud.banner('Görev Tamamlandı', q.name, 'quest');
          SFX.play('questdone');
        } else if (st.s === 'active') this.hud.log(q.name + ': ' + c + '/' + q.n, 'sys', '#ffe08a');
        this._changed();
      }
    }
  }
  onVisit(region) { for (const q of this.defs) if (q.type === 'visit' && q.target === region) this._add(q, 1); }

  // Bu görev eşyasını isteyen aktif görev var mı (düşme için)
  wantsItem(base) {
    return this.defs.some(q => q.type === 'collect' && q.target === base && this.state[q.id] && this.state[q.id].s === 'active');
  }
  // 'WEAPON_d' / 'CHEST_d' → oyuncunun türüne göre gerçek eşya
  _gearBase(base) {
    const m = /^(WEAPON|CHEST)_(\d+)$/.exec(base);
    if (!m) return base;
    if (m[1] === 'WEAPON') return (this.p.inv.weaponType() || 'blade') + '_' + m[2];
    const ch = this.p.inv.equip.chest; return 'chest_' + (ch ? ITEM_BASES[ch.base].atype : 'protector') + '_' + m[2];
  }

  // Ödül metni
  rewardText(q) {
    const r = q.reward, a = [];
    if (r.exp) a.push(r.exp + ' EXP');
    if (r.gold) a.push(r.gold + ' 💰');
    for (const [b, n] of r.items || []) a.push(ITEM_BASES[b].icon + ' ' + ITEM_BASES[b].name + (n > 1 ? ' x' + n : ''));
    if (r.gear) { const g = this._gearBase(r.gear.base); a.push((r.gear.rarity ? RARITY[r.gear.rarity].name + ' ' : '') + ITEM_BASES[g].name); }
    return a.join(' · ');
  }

  turnIn(id) {
    const q = this.def(id), st = this.state[id];
    if (!q || !st || st.s !== 'ready') return { ok: false, msg: 'Teslim edilecek görev yok.' };
    const r = q.reward, s = this.p.stats, inv = this.p.inv;
    const need = (r.gear ? 1 : 0) + (r.items || []).length;
    if (inv.freeCount() < need) return { ok: false, msg: 'Envanterde ' + need + ' boş yer gerekli.' };
    if (q.type === 'collect' && !inv.take(q.target, q.n)) return { ok: false, msg: 'Görev eşyaları eksik.' };
    st.s = 'done';
    if (r.gold) s.gold += r.gold;
    for (const [b, n] of r.items || []) inv.add(makeStack(b, n));
    if (r.gear) { const g = this._gearBase(r.gear.base); inv.add(makeItem(g, r.gear.rarity, 0, rollBlues(g, r.gear.rarity))); }
    if (r.exp && this.combat) { this.combat.fx(this.p, '+' + r.exp + ' EXP', 'exp'); this.combat.gainExp(r.exp); }
    SFX.play('levelup');
    this.hud.log('Görev teslim edildi: ' + q.name + ' (' + this.rewardText(q) + ')', 'lvl');
    this._changed();
    return { ok: true, msg: '✅ ' + q.name + ' tamamlandı! ' + this.rewardText(q) };
  }

  // Bir NPC'nin penceresinde gösterilecek görevler
  forNpc(npcId) {
    const out = [];
    for (const q of this.defs) {
      const s = this.status(q);
      if (q.giver === npcId && (s === 'none' || s === 'locked' || s === 'active')) out.push({ q, s });
      else if (this.turnTo(q) === npcId && s === 'ready') out.push({ q, s });
    }
    return out;
  }

  // NPC başındaki işaret: '?' teslim edilecek, '!' alınabilir görev
  markerFor(npcId) {
    let m = null;
    for (const q of this.defs) {
      const s = this.status(q);
      if (s === 'ready' && this.turnTo(q) === npcId) return '?';
      if (s === 'none' && q.giver === npcId) m = '!';
    }
    return m;
  }

  activeList() { return this.defs.filter(q => this.state[q.id] && this.state[q.id].s !== 'done'); }
  activeTargets() { return this.activeList().filter(q => q.type === 'visit' && this.state[q.id].s === 'active').map(q => q.target); }
  doneCount() { return this.defs.filter(q => this.state[q.id] && this.state[q.id].s === 'done').length; }

  objectiveText(q) {
    const st = this.state[q.id];
    if (st.s === 'ready') return '✔ Tamamlandı — ' + this._npcName(this.turnTo(q)) + '\'e git';
    if (q.type === 'kill' || q.type === 'collect') return q.noun + ': ' + st.p + '/' + q.n;
    if (q.type === 'visit') return q.target + ' bölgesini keşfet';
    return '';
  }

  trackerHTML() {
    const list = this.activeList();
    if (!list.length) return '';
    return list.map(q => '<div class="tq' + (this.state[q.id].s === 'ready' ? ' ok' : '') + '"><b>' + q.name + '</b><span>' + this.objectiveText(q) + '</span></div>').join('');
  }

  // Her karede: bölge takibi
  update() {
    this._syncT = (this._syncT || 0) + 1;
    if (this._syncT % 20 === 0) this._syncCollect();
    const r = regionAt(this.p.pos.x, this.p.pos.z);
    if (r !== this.region) {
      const first = this.region === null;
      this.region = r;
      if (!first && this.hud.banner) { this.hud.banner(r, REGION_LEVELS[r] || '', 'region'); SFX.play('region'); }
      this.onVisit(r);
    }
  }

  serialize() { return JSON.parse(JSON.stringify(this.state)); }
  load(data) {
    this.state = {};
    if (!data || typeof data !== 'object') return;
    if (data.stones && !data.fangs) data.fangs = data.stones;     // eski kayıt
    for (const q of this.defs) {
      const st = data[q.id];
      if (st && ['active', 'ready', 'done'].includes(st.s)) this.state[q.id] = { s: st.s, p: Math.max(0, st.p | 0) };
    }
    this._changed();
  }
}
