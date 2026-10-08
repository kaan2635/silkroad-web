// Oto Av ayar penceresi (U): phBot / mBot / sBot benzeri sekmeler — Genel, Yetenekler, Koruma, Hedef, Toplama, Şehir.
function initBotUI(ui, bot) {
  const $ = id => document.getElementById(id), hud = bot.hud;
  const fmt = n => Math.round(n).toLocaleString('tr-TR');
  const hms = ms => { const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return (h ? h + ' sa ' : '') + m + ' dk ' + (s % 60) + ' sn'; };
  ui.w.bot = $('botw');
  ui.w.bot.querySelector('.x').addEventListener('click', () => ui.toggle('bot', false));
  const st = { tab: 'gen' };
  const C = () => bot.cfg;
  const tg = (path, label) => { const v = get(path); return '<button class="tg' + (v ? ' on' : '') + '" data-bt="' + path + '">' + label + '</button>'; };
  const num = (path, label, min, max, step = 1, unit = '') => '<label class="srow2"><span>' + label + '</span><input type="range" min="' + min + '" max="' + max + '" step="' + step + '" value="' + get(path) + '" data-bn="' + path + '" data-u="' + unit + '"><b>' + valTxt(get(path), unit) + '</b></label>';
  const seg = (path, opts) => '<div class="seg">' + opts.map(o => '<button class="tg' + (get(path) === o[0] ? ' on' : '') + '" data-bs="' + path + '" data-v="' + o[0] + '">' + o[1] + '</button>').join('') + '</div>';
  const valTxt = (v, u) => (u === 'off' ? (+v ? v : 'Kapalı') : u === '%' ? v + '%' : u === 'm' ? v + ' m' : u === 'dk' ? (+v ? v + ' dk' : 'Kapalı') : u === 'sv' ? (+v ? v + '. sv' : 'Kapalı') : u === '+' ? '+' + v : v);
  function get(path) { return path.split('.').reduce((o, k) => o[k], C()); }
  function set(path, v) { const ks = path.split('.'), last = ks.pop(); ks.reduce((o, k) => o[k], C())[last] = v; bot.saveCfg(); }
  const STATE = { idle: 'Beklemede', hunt: 'Avlanıyor', rest: 'Dinleniyor (oturuyor)', toTown: 'Şehre dönüyor', town: 'Şehirde ikmal yapıyor', back: 'Eğitim alanına dönüyor', dead: 'Öldü — şehirde dirilecek' };

  function stats() {
    const s = bot.st, ms = bot.on ? performance.now() - s.t0 : s.run, h = Math.max(1 / 60, ms / 3.6e6);
    const cell = (k, v) => '<div><small>' + k + '</small><b>' + v + '</b></div>';
    return '<div class="bot-stats">' + cell('Süre', hms(ms)) + cell('Av', fmt(s.kills)) + cell('Av/sa', fmt(s.kills / h)) + cell('EXP/sa', fmt(s.exp / h)) +
      cell('Altın/sa', fmt(s.gold / h)) + cell('Toplanan eşya', fmt(s.items)) + cell('Şehir turu', s.trips) + cell('Ölüm', s.deaths) + cell('Harcanan', fmt(s.spent)) + '</div>';
  }
  function refresh() {
    const c = C(), tabs = [['gen', 'Genel'], ['sk', 'Yetenekler'], ['pr', 'Koruma'], ['tg', 'Hedef'], ['pk', 'Toplama'], ['tw', 'Şehir']];
    $('bot-tabs').innerHTML = tabs.map(t => '<button data-btab="' + t[0] + '" class="' + (st.tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>').join('');
    let h = '';
    if (st.tab === 'gen') {
      const a = bot.anchor, P = bot.p.pos;
      h += '<div class="bot-head"><span class="bot-dot' + (bot.on ? ' on' : '') + '"></span><b>' + (bot.on ? STATE[bot.state] || bot.state : 'Kapalı') + '</b>' +
        '<button class="tg big' + (bot.on ? ' on' : '') + '" data-ba="toggle">' + (bot.on ? 'Durdur' : 'Başlat') + '</button></div>';
      h += '<div id="bot-live">' + stats() + '</div>';
      h += '<h4>Eğitim alanı</h4><p class="soc-hint">' + (a ? 'Merkez: ' + Math.round(a.x) + ', ' + Math.round(a.z) + ' · uzaklığın ' + Math.round(Math.hypot(P.x - a.x, P.z - a.z)) + ' m' : 'Henüz ayarlanmadı — av alanına git ve aşağıdaki düğmeye bas.') + '</p>';
      h += '<div class="seg"><button class="tg" data-ba="area">Alanı buraya ayarla</button>' + tg('walkBack', 'Alana yürüyerek dön') + tg('horse', 'Uzaksa ata bin') + tg('pets', 'Toplayıcı evcili çağır') + '</div>';
      h += num('r', 'Alan yarıçapı', 10, 70, 1, 'm');
      h += '<h4>Ölünce</h4>' + seg('onDeath', [['town', 'Şehirde diril, devam et'], ['stop', 'Botu durdur']]);
      h += '<h4>Durdurma koşulları</h4>' + num('stopLevel', 'Şu seviyede dur', 0, 110, 1, 'sv') + num('stopMin', 'Şu süre sonra dur', 0, 600, 10, 'dk');
      h += '<p class="soc-note">Kısayollar: <kbd>H</kbd> başlat/durdur · <kbd>U</kbd> bu pencere. Elle yürürsen bot durur. Ayarlar karakterine kaydedilir.</p>';
    } else if (st.tab === 'sk') {
      const L = bot.learnedActive(), atk = L.filter(s => s.type === 'atk' || s.type === 'nuke'), buf = L.filter(s => ['buff', 'imbue', 'absorb'].includes(s.type));
      h += '<div class="seg">' + tg('autoSkills', 'Setleri otomatik doldur') + '</div><p class="soc-hint">Kapalıyken seçimlerin korunur. Sıra önemlidir: ▲ ile yeteneği öne al.</p>';
      h += '<h4>Berserk</h4>' + seg('zerk', [['never', 'Kullanma'], ['strong', 'Güçlü canavarda'], ['full', 'Dolunca hemen']]);
      const chip = (s, set) => { const on = c[set].includes(s.id), i = c[set].indexOf(s.id); return '<div class="bot-sk' + (on ? ' on' : '') + '">' + '<button class="bot-skb" data-bk="' + set + '" data-id="' + s.id + '">' + skillIcon(s.id) + '<span>' + s.name + (on ? ' <small>#' + (i + 1) + '</small>' : '') + '</span></button>' + (on && i > 0 ? '<button class="bot-up" data-bu="' + set + '" data-id="' + s.id + '" title="Öne al">▲</button>' : '') + '</div>'; };
      h += '<h4>Normal canavar seti</h4><p class="soc-hint">Normal ve güçlü canavarlarda sırayla kullanılır.</p><div class="bot-skl">' + (atk.map(s => chip(s, 'atkN')).join('') || '<i>Saldırı yeteneği öğrenmedin.</i>') + '</div>';
      h += '<h4>Güçlü canavar seti</h4><p class="soc-hint">Şampiyon, elit, parti, dev ve unique canavarlarda.</p><div class="bot-skl">' + (atk.map(s => chip(s, 'atkS')).join('') || '<i>—</i>') + '</div>';
      h += '<h4>Güçlendirmeler</h4><p class="soc-hint">Süresi bitmeden yenilenir; aşılamalar savaşta, emici kalkan can %85 altındayken.</p><div class="bot-skl">' + (buf.map(s => chip(s, 'buffs')).join('') || '<i>Güçlendirme öğrenmedin.</i>') + '</div>';
    } else if (st.tab === 'pr') {
      h += '<h4>İksir</h4>' + num('hpPct', 'Can iksiri, can şunun altında', 10, 90, 5, '%') + num('mpPct', 'Mana iksiri, mana şunun altında', 10, 90, 5, '%');
      h += '<div class="seg">' + tg('pill', 'Durum bozukluğunda Evrensel Hap') + '</div>';
      h += '<h4>Dinlenme</h4><div class="seg">' + tg('rest', 'Savaş yokken otur ve yenilen') + '</div>' + num('restHp', 'Can şunun altındaysa otur', 0, 90, 5, '%') + num('restMp', 'Mana şunun altındaysa otur', 0, 90, 5, '%');
      h += '<h4>Saldırı evcili</h4>' + num('petPot', 'Evcil can iksiri eşiği', 0, 90, 5, '%') + num('petFood', 'Yem verme (tokluk)', 0, 90, 5, '%');
    } else if (st.tab === 'tg') {
      h += '<h4>Öncelik</h4>' + seg('prio', [['aggro', 'En yakın'], ['weak', 'En zayıf can'], ['strong', 'Önce güçlüler']]);
      h += '<p class="soc-hint">Sana saldıran canavarlar her durumda önce hedeflenir.</p>';
      h += '<h4>Kaçınılacak rütbeler</h4><div class="seg">' + ['champion', 'elite', 'party', 'giant', 'unique'].map(r => tg('avoid.' + r, MOB_RANKS[r].label)).join('') + '</div>';
      h += '<div class="seg">' + tg('noKS', 'Başkasının avına saldırma (KS yok)') + '</div>' + num('maxAbove', 'En çok kaç seviye üstüne saldır', 0, 20, 1, '+');
      const types = [...new Set(bot.mm.list.filter(m => !m.walker && !m.pvp && !m.type.job && m.rank !== 'unique').map(m => m.typeKey))];
      h += '<h4>Bu bölgede yok sayılacak türler</h4><div class="seg">' + (types.map(k => '<button class="tg' + (c.ignore.includes(k) ? ' on' : '') + '" data-bi="' + k + '">' + MONSTER_TYPES[k].name + '</button>').join('') || '<i>Yakında canavar yok.</i>') + '</div>';
    } else if (st.tab === 'pk') {
      h += '<p class="soc-hint">Bot yalnızca seçili ganimetleri toplar; toplayıcı evcil de bu filtreye uyar.</p>';
      h += '<div class="seg">' + tg('pick.gold', 'Altın') + tg('pick.gear', 'Ekipman') + tg('pick.pots', 'İksir ve hap') + tg('pick.mats', 'Simya malzemesi') + tg('pick.quest', 'Görev eşyası') + tg('pick.other', 'Diğer') + '</div>';
      h += '<h4>Ekipman filtresi</h4><div class="seg">' + tg('pick.sealOnly', 'Yalnızca mühürlü (SoX)') + '</div>' + num('pick.minDeg', 'En düşük derece', 0, 11, 1, 'off');
    } else if (st.tab === 'tw') {
      h += '<div class="seg">' + tg('town', 'Şehir döngüsü') + '</div><p class="soc-hint">Koşullardan biri olunca Dönüş Parşömeni okunur (yoksa yürünür), ikmal yapılır ve alana dönülür.</p>';
      h += '<h4>Şehre dönüş koşulları</h4>' + num('hpBelow', 'Can iksiri şunun altına inince', 0, 100, 5) + num('mpBelow', 'Mana iksiri şunun altına inince', 0, 100, 5) +
        num('arrowBelow', 'Ok şunun altına inince', 0, 500, 10) + num('freeBelow', 'Boş yuva şunun altına inince', 0, 10, 1) + num('durBelow', 'Dayanıklılık şunun altına inince', 0, 50, 5, '%');
      h += '<h4>Şifacı</h4>' + num('buyHp', 'Can iksiri tamamla', 0, 500, 10, 'off') + num('buyMp', 'Mana iksiri tamamla', 0, 500, 10, 'off') + num('buyPill', 'Evrensel Hap tamamla', 0, 100, 5, 'off');
      h += '<h4>Demirci</h4><div class="seg">' + tg('repair', 'Tamir et') + tg('sellJunk', 'Çöp ekipmanı sat') + '</div>' + num('keepBlue', 'Şu kadar mavi özellikli olanı tut', 1, 5, 1) + num('buyArrow', 'Ok tamamla', 0, 3000, 100, 'off');
      h += '<h4>Depo</h4><div class="seg">' + tg('storeSeal', 'Mühürlüleri depola') + tg('storeMats', 'Malzemeleri depola') + '</div>';
      h += '<p class="soc-note">Satılmayanlar: mühürlü, +3 ve üstü, kuşanılmış ve avatar eşyalar.</p>';
    }
    $('bot-body').innerHTML = h;
  }
  ui.w.bot.addEventListener('click', e => {
    const t = e.target.closest('[data-btab]'); if (t) { st.tab = t.dataset.btab; SFX.play('tab'); refresh(); return; }
    const b = e.target.closest('button'); if (!b) return;
    const d = b.dataset;
    if (d.ba === 'toggle') { bot.toggle(); }
    else if (d.ba === 'area') { if (inSafeZone(bot.p.pos.x, bot.p.pos.z) && !IS_DUNGEON) { hud.log('Şehrin güvenli alanı eğitim alanı olamaz.', 'dmg'); SFX.play('error'); return; } bot.setArea(); }
    else if (d.bt) { set(d.bt, !get(d.bt)); if (d.bt === 'autoSkills' && C().autoSkills) bot._ensureSkills(); }
    else if (d.bs) set(d.bs, d.v);
    else if (d.bi) { const L = C().ignore, i = L.indexOf(d.bi); if (i >= 0) L.splice(i, 1); else L.push(d.bi); bot.saveCfg(); }
    else if (d.bk) { const L = C()[d.bk], i = L.indexOf(d.id); if (i >= 0) L.splice(i, 1); else L.push(d.id); C().autoSkills = false; bot.saveCfg(); }
    else if (d.bu) { const L = C()[d.bu], i = L.indexOf(d.id); if (i > 0) { L.splice(i, 1); L.splice(i - 1, 0, d.id); } C().autoSkills = false; bot.saveCfg(); }
    else return;
    SFX.play('ui'); refresh();
  });
  ui.w.bot.addEventListener('input', e => {
    const k = e.target.dataset.bn; if (!k) return;
    const v = +e.target.value; set(k, v);
    e.target.nextElementSibling.textContent = valTxt(v, e.target.dataset.u);
  });
  $('hb-bot').addEventListener('click', () => ui.toggle('bot'));
  window.addEventListener('keydown', e => { const a = document.activeElement; if (a && (a.tagName === 'INPUT' || a.tagName === 'SELECT')) return; if (e.code === 'KeyU' && !e.repeat) ui.toggle('bot'); });
  const prev = bot.onChange;
  bot.onChange = on => { if (prev) prev(on); if (ui.isOpen('bot')) refresh(); };
  let lt = 0, ls = '';
  bot.onStats = () => {
    if (!ui.isOpen('bot') || st.tab !== 'gen') return;
    const now = performance.now(); if (now - lt < 1000 && ls === bot.state) return;
    if (ls !== bot.state) { ls = bot.state; refresh(); return; }
    lt = now; const el = $('bot-live'); if (el) el.innerHTML = stats();
  };
  const oldToggle = ui.toggle;
  ui.toggle = (k, f, s) => { oldToggle(k, f, s); if (k === 'bot' && ui.isOpen('bot')) refresh(); };
}
