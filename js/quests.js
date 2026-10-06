// Görev sistemi: öldür / topla / ulaş / teslim et. Görev vericiler: Kaptan Lee, Tüccar Ali, Demirci Wen.

// type: 'kill' (target = canavar türü) | 'collect' (target = 'stone') | 'visit' (target = bölge adı) | 'deliver' (to = NPC id)
const QUEST_DEFS = [
  { id: 'wolves', name: 'Kurt Sürüsü', giver: 'captain', minLevel: 1, type: 'kill', target: 'wolf', n: 6, noun: 'Kurt',
    desc: 'Vadideki kurtlar kervanlara saldırıyor. Şehrin dışındaki 6 kurdu avla.',
    reward: { exp: 70, gold: 50, hpPots: 3 } },
  { id: 'stones', name: 'Demirci İçin Taş', giver: 'merchant', minLevel: 1, type: 'collect', target: 'stone', n: 3, noun: 'Yükseltme Taşı',
    desc: 'Demirciler hep taş istiyor. Canavarlardan 3 Yükseltme Taşı topla (taşlar sende kalır).',
    reward: { gold: 100, item: { base: 'b2', rarity: 1 } } },
  { id: 'parcel', name: 'Kaptanın Mektubu', giver: 'captain', minLevel: 2, type: 'deliver', to: 'smith',
    desc: 'Bu mektubu Demirci Wen\'e ulaştır. Kendisi surların yanında, meydanın batısında.',
    reward: { exp: 40, gold: 40 } },
  { id: 'oasis', name: 'Yeşim Vahası', giver: 'merchant', minLevel: 2, type: 'visit', target: 'Yeşim Vahası',
    desc: 'Kervanlar su için Yeşim Vahası\'na uğrar. Yolu keşfet: vahayı bul (şehrin batı-güneybatısı).',
    reward: { exp: 120, gold: 80, mpPots: 3 } },
  { id: 'scorp', name: 'Çöl Zehri', giver: 'captain', minLevel: 3, after: 'wolves', type: 'kill', target: 'scorpion', n: 8, noun: 'Dev Akrep',
    desc: 'Akrep Çölü\'nde dev akrepler yolu kapattı. 8 akrebi temizle.',
    reward: { exp: 220, gold: 150, item: { base: 'w2', rarity: 1 } } },
  { id: 'smith', name: 'Ocak İçin Taş', giver: 'smith', minLevel: 3, type: 'collect', target: 'stone', n: 5, noun: 'Yükseltme Taşı',
    desc: 'Ocağım için taş lazım. 5 Yükseltme Taşı topla; karşılığında sana bir miğfer vereyim.',
    reward: { stones: 2, gold: 120, item: { base: 'h2', rarity: 1 } } },
  { id: 'bandit', name: 'Haydut Kampları', giver: 'captain', minLevel: 4, after: 'scorp', type: 'kill', target: 'bandit', n: 8, noun: 'Haydut',
    desc: 'Harabelerdeki haydutlar kervanları soyuyor. 8 haydutu etkisiz hale getir.',
    reward: { exp: 450, gold: 300, item: { base: 'a2', rarity: 2 } } },
  { id: 'caravan', name: 'Kızıl Kum Denizi', giver: 'merchant', minLevel: 5, after: 'oasis', type: 'visit', target: 'Kızıl Kum Denizi',
    desc: 'Kervan yolunun ucunda, şehirden çok uzakta Kızıl Kum Denizi var. Orayı keşfet ve haber getir. Dikkatli ol!',
    reward: { exp: 600, gold: 400, stones: 3 } },
  { id: 'golem', name: 'Kum Devleri', giver: 'captain', minLevel: 7, after: 'bandit', type: 'kill', target: 'golem', n: 8, noun: 'Kum Devi',
    desc: 'Kızıl Kum Denizi\'nde kum devleri uyandı. 8 devi yık; şehrin güvenliği sana emanet.',
    reward: { exp: 1500, gold: 800, item: { base: 'w3', rarity: 2 } } }
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
    if (q.type === 'visit' && this.region === q.target) this._add(q, 1);   // zaten oradaysa
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
    } else this.hud.log(q.name + ': ' + st.p + '/' + this.need(q), 'sys', '#ffe08a');
    this._changed();
  }

  _npcName(id) { const n = (typeof NPC_DEFS !== 'undefined') && NPC_DEFS.find(d => d.id === id); return n ? n.name : id; }

  onKill(typeKey) { for (const q of this.defs) if (q.type === 'kill' && q.target === typeKey) this._add(q, 1); }
  onCollect(kind) { for (const q of this.defs) if (q.type === 'collect' && q.target === kind) this._add(q, 1); }
  onVisit(region) { for (const q of this.defs) if (q.type === 'visit' && q.target === region) this._add(q, 1); }

  // Aktif bir taş toplama görevi varsa taş düşme şansı artar
  wantsStones() {
    return this.defs.some(q => q.type === 'collect' && q.target === 'stone' && this.state[q.id] && this.state[q.id].s === 'active');
  }

  // Ödül metni
  rewardText(q) {
    const r = q.reward, a = [];
    if (r.exp) a.push(r.exp + ' EXP');
    if (r.gold) a.push(r.gold + ' 💰');
    if (r.stones) a.push(r.stones + ' 💎');
    if (r.hpPots) a.push(r.hpPots + ' 🧪');
    if (r.mpPots) a.push(r.mpPots + ' 💧');
    if (r.item) a.push(itemInfo(makeItem(r.item.base, r.item.rarity, 0)).name);
    return a.join(' · ');
  }

  turnIn(id) {
    const q = this.def(id), st = this.state[id];
    if (!q || !st || st.s !== 'ready') return { ok: false, msg: 'Teslim edilecek görev yok.' };
    const r = q.reward, s = this.p.stats, inv = this.p.inv;
    if (r.item && inv.free() < 0) return { ok: false, msg: 'Envanter dolu! Yer aç.' };
    st.s = 'done';
    if (r.gold) s.gold += r.gold;
    if (r.stones) s.stones += r.stones;
    if (r.hpPots) s.hpPots += r.hpPots;
    if (r.mpPots) s.mpPots += r.mpPots;
    if (r.item) inv.add(makeItem(r.item.base, r.item.rarity, 0));
    if (r.exp && this.combat) { this.combat.fx(this.p, '+' + r.exp + ' EXP', 'exp'); this.combat.gainExp(r.exp); }
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
    const r = regionAt(this.p.pos.x, this.p.pos.z);
    if (r !== this.region) {
      const first = this.region === null;
      this.region = r;
      if (!first && this.hud.banner) this.hud.banner(r, REGION_LEVELS[r] || '', 'region');
      this.onVisit(r);
    }
  }

  serialize() { return JSON.parse(JSON.stringify(this.state)); }
  load(data) {
    this.state = {};
    if (!data || typeof data !== 'object') return;
    for (const q of this.defs) {
      const st = data[q.id];
      if (st && ['active', 'ready', 'done'].includes(st.s)) this.state[q.id] = { s: st.s, p: Math.max(0, st.p | 0) };
    }
    this._changed();
  }
}
