// Topluluk arayüzü: Topluluk penceresi (parti, lonca, arkadaşlar, akademi, tezgâh, onur/PvP, sıralama),
// sohbet penceresi, oyuncuya dokununca açılan eylem menüsü, parti çerçeveleri ve küçük iletişim pencereleri (takas, tezgâh, bilgi).
function initSocialUI(ui, soc) {
  const $ = id => document.getElementById(id), hud = soc.hud, pl = soc.player;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = n => Math.round(n).toLocaleString('tr-TR');
  ui.w.soc = $('socw'); ui.w.chat = $('chatw'); ui.w.dlg = $('dlgw');
  for (const k of ['soc', 'chat', 'dlg']) ui.w[k].querySelector('.x').addEventListener('click', () => ui.toggle(k, false));
  const st = { tab: 'party', rank: 'level', chatTab: 'all', dlg: null, lastWhisper: null, match: null, trade: null };
  const say = r => { if (r && r.msg) hud.log(r.msg, r.ok ? 'sys' : 'dmg'); SFX.play(r && r.ok ? 'ui' : 'error'); };
  const row = (ic, name, sub, right, color) => ui._row(ic, name, sub, right || '', color);
  const btn = (act, label, cls, extra) => '<button data-sa="' + act + '"' + (extra || '') + (cls ? ' class="' + cls + '"' : '') + '>' + label + '</button>';
  const hpBar = (v, max) => '<span class="sbar"><i style="width:' + Math.max(0, Math.min(100, v / max * 100)) + '%"></i></span>';
  const botIcon = b => icon('m_' + b.cls[0], MASTERIES[b.cls[0]].kind === 'elem' ? MASTERIES[b.cls[0]].elem : 'phys');

  // ---------- Topluluk penceresi ----------
  const TABS = [['party', 'Parti', 'soc_party'], ['guild', 'Lonca', 'soc_guild'], ['friend', 'Arkadaşlar', 'soc_friend'], ['acad', 'Akademi', 'soc_acad'], ['stall', 'Tezgâh', 'soc_stall'], ['honor', 'Onur · PvP', 'soc_honor'], ['rank', 'Sıralama', 'soc_rank']];
  function refreshSoc() {
    $('soc-tabs').innerHTML = TABS.map(t => '<button data-stab="' + t[0] + '" class="' + (st.tab === t[0] ? 'on' : '') + '">' + icon(t[2], 'gold') + ' ' + t[1] + '</button>').join('');
    let h = '';
    const L = pl.stats.level;
    if (st.tab === 'party') {
      h += '<p class="soc-hint">Dünyadaki bir oyuncuya dokun → <b>Parti daveti</b>. Partideyken yakındaki her üye için EXP +%8; şifacılar seni iyileştirir.</p>';
      if (soc.party.length) {
        h += '<h4>Partin (' + (soc.party.length + 1) + '/8)</h4>' + row(icon('menu_char', 'menu'), esc(pl.name) + ' (sen)', 'Sv. ' + L, '');
        for (const id of soc.party) {
          const b = Roster[id], s = soc.sim(id);
          h += row(botIcon(b), esc(b.name), 'Sv. ' + botLevel(b) + ' · ' + botClassName(b) + (s ? ' ' + hpBar(s.hp, s.maxHp) : ''),
            btn('whisper', 'Fısılda', 'small', ' data-id="' + id + '"') + btn('kick', 'Çıkar', 'small warn', ' data-id="' + id + '"'), '#8ef0ff');
        }
        h += '<div class="soc-act">' + btn('leave', 'Partiden ayrıl', 'warn') + btn('match', 'Parti eşleştirme') + '</div>';
      } else h += '<p class="soc-empty">Partin yok.</p><div class="soc-act">' + btn('match', 'Parti eşleştirme: uygun partileri listele') + '</div>';
      if (st.match) {
        h += '<h4>Parti eşleştirme · ' + ZONE.name + '</h4>';
        for (const ad of st.match) h += row(icon('soc_match', 'gold'), esc(ad.title) + ' · Sv. ' + ad.lv[0] + '–' + ad.lv[1], 'Lider ' + esc(Roster[ad.lead].name) + ' · ' + ad.members.length + ' kişi · ' + ad.exp + ' · ' + ad.item, btn('join', 'Katıl', 'small', ' data-ad="' + ad.id + '"'));
        if (!st.match.length) h += '<p class="soc-empty">Şu an seviyene uygun ilan yok.</p>';
      }
    } else if (st.tab === 'guild') {
      const g = soc.guild;
      if (!g) {
        h += '<p class="soc-hint">Lonca kur: 20. seviye ve 50.000 altın. Lonca seviyesi yükseldikçe üye sınırı, ortak depo ve EXP bereketi artar; birlik kurup Kale Savaşı\'na katılırsın.</p>' +
          '<div class="soc-form"><input id="soc-gname" maxlength="14" placeholder="Lonca adı"><button data-sa="gcreate">Lonca kur</button></div>' +
          '<h4>Sunucudaki loncalar</h4>' + SOC_GUILDS.map((n, i) => row(icon('soc_guild', 'gold'), n, Roster.filter(b => b.g === i).length + ' üye', '')).join('');
      } else {
        const G = GUILD_LV[g.lv], nx = GUILD_LV[g.lv + 1];
        h += '<div class="soc-gh"><b>' + esc(g.name) + '</b> <span>Sv. ' + g.lv + ' · ' + fmt(g.gp) + ' GP · ' + (g.members.length + 1) + '/' + G.cap + ' üye · EXP +%' + g.lv + '</span></div>';
        h += '<div class="soc-act">' + (nx ? btn('gup', 'Yükselt (' + fmt(nx.gp) + ' GP + ' + fmt(nx.gold) + ' altın)', pl.stats.gold >= nx.gold && g.gp >= nx.gp ? '' : 'dis') : '<span class="soc-note">En üst seviye</span>') +
          btn('gdon', '100 SP bağışla', 'small', ' data-n="100"') + btn('gdon', '1.000 SP bağışla', 'small', ' data-n="1000"') + '</div>';
        h += '<div class="soc-form"><label>Birlik</label><select id="soc-union"><option value="-1">— yok —</option>' + SOC_GUILDS.map((n, i) => '<option value="' + i + '"' + (g.union === i ? ' selected' : '') + '>' + n + '</option>').join('') + '</select><button data-sa="gunion">Teklif et</button></div>';
        h += '<h4>Üyeler</h4>' + row(icon('menu_char', 'menu'), esc(pl.name) + ' (lonca ustası)', 'Sv. ' + L, '');
        const GR = ['', 'Komutan', 'Hazinedar', 'Akıncı', 'Şifacı', 'Çırak'];
        for (const id of g.members) {
          const b = Roster[id], on = botOnline(b) || soc.party.includes(id);
          h += row(botIcon(b), esc(b.name) + (g.grants[id] ? ' <em class="grant">' + g.grants[id] + '</em>' : ''), 'Sv. ' + botLevel(b) + ' · ' + botClassName(b) + ' · ' + (on ? '<span class="on">çevrimiçi</span>' : 'çevrimdışı'),
            '<select data-grant="' + id + '">' + GR.map(t => '<option' + ((g.grants[id] || '') === t ? ' selected' : '') + ' value="' + t + '">' + (t || 'unvan') + '</option>').join('') + '</select>' + btn('gkick', 'At', 'small warn', ' data-id="' + id + '"'), '#a8f07a');
        }
        if (!g.members.length) h += '<p class="soc-empty">Henüz üye yok. Oyunculara dokunup <b>Loncaya davet</b> et.</p>';
        h += '<h4>Lonca deposu (' + g.storage.length + '/' + G.slots + ')</h4>';
        if (!G.slots) h += '<p class="soc-empty">Depo lonca 2. seviyede açılır.</p>';
        else {
          h += '<div class="soc-grid">' + g.storage.map((it, i) => '<div class="slot" data-gout="' + i + '" title="Al">' + itemIcon(it.base) + (it.n > 1 ? '<b class="n">' + it.n + '</b>' : '') + '</div>').join('') + '</div>';
          h += '<p class="soc-note">Koymak için çantandan seç:</p><div class="soc-grid">' + pl.inv.slots.map((it, i) => it ? '<div class="slot" data-gin="' + i + '">' + itemIcon(it.base) + (it.n > 1 ? '<b class="n">' + it.n + '</b>' : '') + '</div>' : '').join('') + '</div>';
        }
        h += '<div class="soc-act">' + btn('gdisband', 'Loncayı dağıt', 'warn small') + '</div>';
      }
    } else if (st.tab === 'friend') {
      h += '<p class="soc-hint">Oyunculara dokunup <b>Arkadaş ekle</b>. Arkadaşlar parti davetini daha kolay kabul eder; PvP pusularında sana saldırmaz.</p>';
      if (!soc.friends.length) h += '<p class="soc-empty">Arkadaş listen boş.</p>';
      for (const id of soc.friends) {
        const b = Roster[id], on = botOnline(b);
        h += row(botIcon(b), esc(b.name), 'Sv. ' + botLevel(b) + ' · ' + botClassName(b) + ' · ' + (on ? '<span class="on">çevrimiçi</span>' : 'çevrimdışı'),
          (on ? btn('whisper', 'Fısılda', 'small', ' data-id="' + id + '"') + btn('invite', 'Parti', 'small', ' data-id="' + id + '"') : '') + btn('unfriend', 'Sil', 'small warn', ' data-id="' + id + '"'));
      }
    } else if (st.tab === 'acad') {
      const a = soc.academy;
      h += '<p class="soc-hint">Akademi: 40. seviyenin altındaki oyuncular öğrenci olarak katılır (+%15 EXP) ve 40\'ta mezun olup ödül alır. 60. seviyeden itibaren kendi akademini kurup öğrencilerinden onur kazanırsın.</p>';
      if (!a) h += '<div class="soc-act">' + btn('ajoin', 'Öğrenci olarak katıl', L < 40 ? '' : 'dis') + btn('acreate', 'Akademi kur', L >= 60 ? '' : 'dis') + '</div>';
      else {
        h += '<div class="soc-gh"><b>' + esc(a.name) + '</b> <span>' + (a.role === 'junior' ? 'Öğrencisin · +%15 EXP · mezuniyet 40. seviyede (' + Math.max(0, 40 - L) + ' seviye kaldı)' : 'Akademi ustasısın · her 10 dakikada +2 onur') + '</span></div>';
        if (a.juniors) for (const id of a.juniors) h += row(botIcon(Roster[id]), esc(Roster[id].name), 'Öğrenci · Sv. ' + botLevel(Roster[id]), '');
        h += '<div class="soc-act">' + btn('aleave', 'Akademiden ayrıl', 'warn small') + '</div>';
      }
    } else if (st.tab === 'stall') {
      const S = soc.stall;
      h += '<p class="soc-hint">Şehirde tezgâh aç: koyduğun eşyalar sen dururken yoldan geçen oyunculara satılır. Fiyat makul değere (piyasa) ne kadar yakınsa o kadar hızlı satılır. Yürürsen tezgâh kapanır.</p>';
      h += '<div class="soc-form"><input id="soc-stitle" maxlength="20" value="' + esc(S.title) + '"' + (S.open ? ' disabled' : '') + '>' + (S.open ? btn('sclose', 'Tezgâhı kapat', 'warn') : btn('sopen', 'Tezgâhı aç')) + '</div>';
      h += '<h4>Tezgâhtakiler (' + S.items.length + '/10)' + (soc.sold ? ' · toplam satış ' + fmt(soc.sold) + ' altın' : '') + '</h4>';
      if (!S.items.length) h += '<p class="soc-empty">Tezgâh boş.</p>';
      S.items.forEach((x, i) => {
        const n = itemInfo(x.it), fair = soc.fairPrice(x.it), r = x.price / Math.max(1, fair);
        h += row(itemIcon(x.it.base), '<span style="color:' + n.color + '">' + esc(n.name) + (x.it.n > 1 ? ' x' + x.it.n : '') + '</span>', 'Piyasa ~' + fmt(fair) + ' · ' + (r <= 0.9 ? '<span class="on">hızlı satar</span>' : r <= 1.25 ? 'normal' : r <= 1.6 ? '<span class="warnc">yavaş</span>' : '<span class="bad">satmaz</span>'),
          '<input type="number" class="sprice" data-sp="' + i + '" min="1" value="' + x.price + '"' + (S.open ? ' disabled' : '') + '>' + (S.open ? '' : btn('srem', 'Geri al', 'small', ' data-i="' + i + '"')));
      });
      if (!S.open) h += '<p class="soc-note">Eklemek için çantandan seç:</p><div class="soc-grid">' + pl.inv.slots.map((it, i) => it ? '<div class="slot" data-sadd="' + i + '">' + itemIcon(it.base) + (it.n > 1 ? '<b class="n">' + it.n + '</b>' : '') + '</div>' : '').join('') + '</div>';
    } else if (st.tab === 'honor') {
      const lv = hwanLevel(soc.honor), nx = HWAN_REQ[lv + 1], T = HWAN_TITLES[pl.race];
      h += '<div class="soc-gh"><b>' + (T[lv] || 'Unvansız') + '</b> <span>Onur ' + fmt(soc.honor) + (nx ? ' / ' + fmt(nx) + ' → ' + T[lv + 1] : ' · en üst unvan') + ' · saldırı +%' + lv + '</span></div>';
      h += '<div class="soc-prog"><i style="width:' + (nx ? Math.min(100, (soc.honor - HWAN_REQ[lv]) / (nx - HWAN_REQ[lv]) * 100) : 100) + '%"></i></div>';
      h += '<p class="soc-hint">Onur puanı: pelerinli oyuncuları yenmek, düello kazanmak, Unique öldürmek, arenalar ve Kale Savaşı. Unvan (Hwan) seviyesi her kademede saldırıya +%1 verir.</p>';
      h += row(icon('soc_pvp', 'bad'), 'PvP pelerini', soc.cape ? '<span class="bad">Giyili</span> — şehir dışında pelerinli oyuncular saldırabilir; PvP ölümünde EXP kaybetmezsin.' : 'Çıkarılmış. 20. seviyeden itibaren giyilebilir.', btn('cape', soc.cape ? 'Çıkar' : 'Giy', soc.cape ? 'warn' : ''));
      h += row(icon('soc_kill', 'bad'), 'Katil durumu', soc.murderT > 0 ? '<span class="bad">KATİLSİN · ' + Math.ceil(soc.murderT / 60) + ' dk</span> — ölürsen 3 kat EXP ve altının %10\'u gider' : 'Temiz. Pelerinsiz birine saldırmak seni katil yapar.', '');
      h += '<h4>İstatistik</h4><div class="soc-stats"><span>PvP zafer <b>' + soc.pk + '</b></span><span>Düello <b>' + soc.duelW + '–' + soc.duelL + '</b></span><span>Cinayet <b>' + soc.murders + '</b></span><span>Unique <b>' + (soc.uqKills || 0) + '</b></span></div>';
      h += '<h4>Unvanlar</h4><div class="soc-stats">' + T.slice(1).map((t, i) => '<span' + (lv >= i + 1 ? ' class="on"' : '') + '>' + t + ' <small>' + fmt(HWAN_REQ[i + 1]) + '</small></span>').join('') + '</div>';
    } else if (st.tab === 'rank') {
      const K = [['level', 'Seviye'], ['honor', 'Onur'], ['guild', 'Lonca'], ['unique', 'Unique'], ['trader', 'Tüccar'], ['hunter', 'Avcı'], ['thief', 'Hırsız']];
      h += '<div class="filt">' + K.map(k => '<button data-rk="' + k[0] + '" class="' + (st.rank === k[0] ? 'on' : '') + '">' + k[1] + '</button>').join('') + '</div>';
      const R = soc.rankings(st.rank);
      h += '<div class="soc-rank">' + R.top.map(r => '<div class="rk' + (r.me ? ' me' : '') + '"><b>' + r.rank + '</b><span>' + esc(r.name) + '<small>' + esc(r.sub || '') + '</small></span><em>' + fmt(r.v) + '</em></div>').join('') + '</div>';
      if (R.me && R.me.rank > 20) h += '<div class="soc-rank"><div class="rk me"><b>' + R.me.rank + '</b><span>' + esc(R.me.name) + '<small>' + esc(R.me.sub || '') + '</small></span><em>' + fmt(R.me.v) + '</em></div></div>';
      if (!R.me) h += '<p class="soc-empty">Bu sıralamada yer almıyorsun.</p>';
    }
    $('soc-body').innerHTML = h;
  }
  ui.w.soc.addEventListener('click', e => {
    const t = e.target.closest('[data-stab]'); if (t) { st.tab = t.dataset.stab; SFX.play('tab'); refreshSoc(); return; }
    const rk = e.target.closest('[data-rk]'); if (rk) { st.rank = rk.dataset.rk; SFX.play('tab'); refreshSoc(); return; }
    const gi = e.target.closest('[data-gin]'); if (gi) { soc.storeIn(+gi.dataset.gin); refreshSoc(); return; }
    const go = e.target.closest('[data-gout]'); if (go) { soc.storeOut(+go.dataset.gout); refreshSoc(); return; }
    const sa = e.target.closest('[data-sadd]'); if (sa) { soc.stallAdd(+sa.dataset.sadd); refreshSoc(); return; }
    const b = e.target.closest('[data-sa]'); if (!b || b.classList.contains('dis')) return;
    const a = b.dataset.sa, id = +b.dataset.id;
    if (a === 'whisper') openChat('whisper', Roster[id].name);
    else if (a === 'kick') soc.kick(id);
    else if (a === 'leave') soc.leaveParty();
    else if (a === 'match') { st.match = soc.matching(); SFX.play('tab'); }
    else if (a === 'join') { const ad = st.match.find(x => x.id === +b.dataset.ad); say(soc.joinMatch(ad)); st.match = st.match.filter(x => x !== ad); }
    else if (a === 'gcreate') say(soc.createGuild($('soc-gname').value));
    else if (a === 'gup') say(soc.guildUp());
    else if (a === 'gdon') say(soc.donate(Math.min(+b.dataset.n, pl.book.sp)));
    else if (a === 'gunion') say(soc.union(+$('soc-union').value));
    else if (a === 'gkick') soc.guildKick(id);
    else if (a === 'gdisband') { if (b.dataset.sure) { for (const it of soc.guild.storage) pl.inv.add(it); soc.guild = null; for (const s of soc.sims) s.relabel(); soc.changed(); hud.log('Lonca dağıtıldı.'); } else { b.dataset.sure = 1; b.textContent = 'Emin misin? Yeniden bas'; return; } }
    else if (a === 'invite') say(soc.invite(id));
    else if (a === 'unfriend') soc.removeFriend(id);
    else if (a === 'ajoin') say(soc.joinAcademy());
    else if (a === 'acreate') say(soc.createAcademy());
    else if (a === 'aleave') soc.leaveAcademy();
    else if (a === 'sopen') { soc.stall.title = ($('soc-stitle').value || 'Tezgâhım').slice(0, 20); say(soc.openStall()); }
    else if (a === 'sclose') soc.closeStall('Tezgâh kapandı.');
    else if (a === 'srem') soc.stallRemove(+b.dataset.i);
    else if (a === 'cape') soc.setCape(!soc.cape);
    refreshSoc();
  });
  ui.w.soc.addEventListener('change', e => {
    const g = e.target.closest('[data-grant]'); if (g && soc.guild) { soc.guild.grants[+g.dataset.grant] = g.value; refreshSoc(); }
    const p = e.target.closest('[data-sp]'); if (p) { const x = soc.stall.items[+p.dataset.sp]; if (x) x.price = Math.max(1, Math.round(+p.value || 1)); refreshSoc(); }
  });

  // ---------- Sohbet ----------
  const CH_TABS = ['all', 'local', 'party', 'guild', 'whisper', 'global'];
  function refreshChat() {
    $('chat-tabs').innerHTML = CH_TABS.map(c => '<button data-ch="' + c + '" class="' + (st.chatTab === c ? 'on' : '') + '" style="color:' + CHAN[c].color + '">' + CHAN[c].name + '</button>').join('');
    const lines = soc.chat.lines.filter(l => st.chatTab === 'all' || l.ch === st.chatTab || (st.chatTab === 'guild' && l.ch === 'union'));
    $('chat-lines').innerHTML = lines.slice(-80).map(l => '<div style="color:' + (CHAN[l.ch] || CHAN.local).color + '"><small>' + new Date(l.t).toTimeString().slice(0, 5) + '</small> ' + (l.ch !== 'local' ? '[' + CHAN[l.ch].name + '] ' : '') + (l.from ? '<b data-wn="' + esc(l.from.split(' → ')[0]) + '">' + esc(l.from) + '</b>: ' : '') + esc(l.text) + '</div>').join('') || '<p class="soc-empty">Henüz mesaj yok.</p>';
    const el = $('chat-lines'); el.scrollTop = el.scrollHeight;
    const inp = $('chat-input');
    inp.placeholder = st.chatTab === 'whisper' ? (st.lastWhisper ? st.lastWhisper + ' kişisine fısılda…' : '/w Ad mesaj') : st.chatTab === 'global' ? 'Küresel mesaj (Küresel Sohbet Parşömeni: ' + pl.inv.count('gchat') + ')' : 'Mesaj yaz… (/w Ad · /p · /g · /k)';
  }
  function openChat(ch, to) {
    if (ch) st.chatTab = ch === 'local' ? 'all' : ch;
    if (to) st.lastWhisper = to;
    ui.toggle('chat', true); refreshChat();
    $('badge-chat').classList.add('hidden');
    setTimeout(() => { if (!CONFIG.isTouch || ch) $('chat-input').focus(); }, 30);
  }
  soc.openChat = openChat;
  ui.w.chat.addEventListener('click', e => {
    const t = e.target.closest('[data-ch]'); if (t) { st.chatTab = t.dataset.ch; SFX.play('tab'); refreshChat(); return; }
    const w = e.target.closest('[data-wn]'); if (w && w.dataset.wn !== pl.name) { st.chatTab = 'whisper'; st.lastWhisper = w.dataset.wn; refreshChat(); $('chat-input').focus(); }
  });
  $('chat-form').addEventListener('submit', e => {
    e.preventDefault();
    const inp = $('chat-input'), v = inp.value;
    if (!v.trim()) { inp.blur(); return; }
    const ch = st.chatTab === 'all' ? 'local' : st.chatTab;
    const r = soc.say(ch, ch === 'whisper' && !/^\//.test(v) ? v : v, st.lastWhisper);
    if (r && r.msg) hud.log(r.msg, 'dmg');
    if (r && r.ok) inp.value = '';
    refreshChat();
  });
  $('chat-input').addEventListener('keydown', e => { if (e.key === 'Escape') { e.target.blur(); ui.toggle('chat', false); } e.stopPropagation(); });
  soc.chat.onAdd = l => {
    if (l.ch === 'whisper' && l.from && !l.from.startsWith(pl.name)) { st.lastWhisper = l.from.split(' → ')[0]; if (!ui.isOpen('chat')) $('badge-chat').classList.remove('hidden'); }
    if (ui.isOpen('chat')) refreshChat();
  };
  $('btn-chat').addEventListener('click', () => { if (ui.isOpen('chat')) ui.toggle('chat', false); else openChat(); });
  $('btn-soc').addEventListener('click', () => ui.toggle('soc'));
  window.addEventListener('keydown', e => {
    const a = document.activeElement;
    if (a && (a.tagName === 'INPUT' || a.tagName === 'SELECT')) return;
    if (e.code === 'KeyO') ui.toggle('soc');
    else if (e.key === 'Enter' && !$('start').offsetParent) { e.preventDefault(); openChat(); }
  });

  // ---------- Oyuncuya dokununca ----------
  const menu = $('botmenu');
  function closeMenu() { menu.classList.add('hidden'); }
  document.addEventListener('pointerdown', e => { if (!menu.contains(e.target)) closeMenu(); }, true);
  soc.clickBot = (sim, x, y) => {
    const b = sim.bot;
    if (soc.cape && sim.mode === 'pvp' && !sim.dead) { say(soc.attackBot(sim, false)); return; }
    const inP = soc.party.includes(b.id), inG = soc.guild && soc.guild.members.includes(b.id), fr = soc.friends.includes(b.id);
    const it = (a, label, ic, cls) => '<button data-bm="' + a + '"' + (cls ? ' class="' + cls + '"' : '') + '>' + icon(ic, cls === 'warn' ? 'bad' : 'gold') + label + '</button>';
    menu.innerHTML = '<div class="bm-h"><b>' + esc(b.name) + '</b><small>Sv. ' + sim.lvl + ' · ' + botClassName(b) + (b.g >= 0 ? ' · ' + SOC_GUILDS[b.g] : '') + '</small></div>' +
      (sim.mode === 'stall' ? it('stall', 'Tezgâha bak', 'soc_stall') : '') +
      it('info', 'Bilgi', 'soc_info') + it('whisper', 'Fısılda', 'soc_whisper') +
      (inP ? it('kick', 'Partiden çıkar', 'soc_party') : it('invite', 'Parti daveti', 'soc_party')) +
      (fr ? '' : it('friend', 'Arkadaş ekle', 'soc_friend')) +
      (soc.guild && !inG ? it('ginvite', 'Loncaya davet', 'soc_guild') : '') +
      it('trade', 'Takas', 'soc_trade') + (inP ? '' : it('duel', 'Düello', 'soc_duel')) +
      (inP ? '' : it('murder', sim.mode === 'pvp' ? 'Saldır (PvP)' : 'Saldır (cinayet)', 'soc_kill', 'warn'));
    menu._sim = sim;
    menu.classList.remove('hidden');
    const r = menu.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(window.innerWidth - r.width - 8, x + 10)) + 'px';
    menu.style.top = Math.max(8, Math.min(window.innerHeight - r.height - 8, y - 20)) + 'px';
  };
  menu.addEventListener('click', e => {
    const b = e.target.closest('[data-bm]'); if (!b) return;
    const sim = menu._sim, id = sim.bot.id, a = b.dataset.bm;
    if (a === 'murder' && sim.mode !== 'pvp' && !b.dataset.sure) { b.dataset.sure = 1; b.lastChild.textContent = 'Emin misin? Katil olursun'; return; }
    closeMenu();
    if (a === 'info') openDlg('info', sim);
    else if (a === 'stall') openDlg('stall', sim);
    else if (a === 'whisper') openChat('whisper', sim.bot.name);
    else if (a === 'invite') say(soc.invite(id));
    else if (a === 'kick') soc.kick(id);
    else if (a === 'friend') say(soc.addFriend(id));
    else if (a === 'ginvite') say(soc.guildInvite(id));
    else if (a === 'trade') { st.trade = { id, sel: [] }; openDlg('trade', sim); }
    else if (a === 'duel') say(soc.duel(id));
    else if (a === 'murder') { const r = soc.attackBot(sim, sim.mode !== 'pvp'); if (r.msg) say(r); }
  });

  // ---------- Küçük pencereler ----------
  function openDlg(kind, sim) { st.dlg = { kind, sim }; ui.toggle('dlg', true); refreshDlg(); }
  function refreshDlg() {
    const d = st.dlg; if (!d) return;
    const sim = d.sim, b = sim.bot;
    let h = '';
    if (d.kind === 'info') {
      $('dlg-title').textContent = b.name;
      const hon = botHonor(b), t = HWAN_TITLES[b.race][hwanLevel(hon)];
      h += '<div class="soc-gh"><b>' + esc(b.name) + '</b> <span>Sv. ' + botLevel(b) + ' · ' + RACE_NAMES[b.race] + ' · ' + botClassName(b) + '</span></div>';
      h += '<div class="soc-stats"><span>Lonca <b>' + (b.g >= 0 ? SOC_GUILDS[b.g] : soc.guild && soc.guild.members.includes(b.id) ? esc(soc.guild.name) : '—') + '</b></span><span>Unvan <b>' + (t || '—') + '</b></span><span>Onur <b>' + fmt(hon) + '</b></span>' + (b.job ? '<span>Meslek <b>' + JOBS[b.job].name + ' ' + b.jlv + '</b></span>' : '') + '</div>';
      h += '<h4>Ekipman</h4><div class="soc-grid">' + Object.keys(sim.eq).map(k => '<div class="slot" title="' + esc(itemInfo(sim.eq[k]).name) + '">' + itemIcon(sim.eq[k].base) + (sim.eq[k].plus ? '<b class="n">+' + sim.eq[k].plus + '</b>' : '') + '</div>').join('') + '</div>';
    } else if (d.kind === 'stall') {
      $('dlg-title').textContent = (sim.stallTitle || 'Tezgâh') + ' · ' + b.name;
      const list = soc.stallItems(sim);
      h += '<p class="soc-hint">Altının: <b>' + fmt(pl.stats.gold) + '</b></p>';
      list.forEach((x, i) => { const n = itemInfo(x.it); h += row(itemIcon(x.it.base), '<span style="color:' + n.color + '">' + esc(n.name) + (x.it.n > 1 ? ' x' + x.it.n : '') + '</span>', (n.stack ? n.sub : (itemStatText(n) + (n.req ? ' · Sv. ' + n.req : ''))), '<span class="price">' + fmt(x.price) + '</span>' + btn('buy', 'Al', 'small', ' data-i="' + i + '"')); });
      if (!list.length) h += '<p class="soc-empty">Tezgâh boşaldı. Bir saat sonra yeniden dolar.</p>';
    } else if (d.kind === 'trade') {
      $('dlg-title').textContent = 'Takas · ' + b.name;
      const T = st.trade, items = T.sel.map(i => pl.inv.slots[i]).filter(Boolean);
      const offer = items.length ? soc.tradeOffer(b.id, items) : 0;
      h += '<p class="soc-hint">Vermek istediğin eşyaları seç; ' + esc(b.name) + ' karşılığında altın teklif eder. Kendi seviyesine uygun eşyalara daha çok verir.</p>';
      h += '<div class="soc-grid">' + pl.inv.slots.map((it, i) => it && isGear(it.base) || it && ITEM_BASES[it.base].cat === 'mat' ? '<div class="slot' + (T.sel.includes(i) ? ' sel' : '') + '" data-tsel="' + i + '" data-tip="sl:' + i + '">' + itemIcon(it.base) + (it.n > 1 ? '<b class="n">' + it.n + '</b>' : '') + '</div>' : '').join('') + '</div>';
      h += '<div class="soc-gh"><b>Teklif: ' + fmt(offer) + ' altın</b> <span>' + items.length + ' eşya · NPC\'ye satış ' + fmt(items.reduce((a, it) => a + sellPrice(it), 0)) + '</span></div>';
      h += '<div class="soc-act">' + btn('tok', 'Takası onayla', items.length ? '' : 'dis') + btn('tno', 'Vazgeç', 'warn') + '</div>';
    }
    $('dlg-body').innerHTML = h;
  }
  ui.w.dlg.addEventListener('click', e => {
    const d = st.dlg; if (!d) return;
    const ts = e.target.closest('[data-tsel]');
    if (ts) { const i = +ts.dataset.tsel, T = st.trade; T.sel = T.sel.includes(i) ? T.sel.filter(x => x !== i) : T.sel.concat(i); SFX.play('ui'); refreshDlg(); return; }
    const b = e.target.closest('[data-sa]'); if (!b || b.classList.contains('dis')) return;
    if (b.dataset.sa === 'buy') say(soc.buyStall(d.sim, +b.dataset.i));
    else if (b.dataset.sa === 'tok') { const items = st.trade.sel.map(i => pl.inv.slots[i]).filter(Boolean); soc.tradeDo(d.sim.bot.id, st.trade.sel, soc.tradeOffer(d.sim.bot.id, items)); st.trade.sel = []; ui.toggle('dlg', false); return; }
    else if (b.dataset.sa === 'tno') { ui.toggle('dlg', false); return; }
    refreshDlg();
  });

  // ---------- Parti çerçeveleri ----------
  let pfT = 0;
  soc.uiUpdate = dt => {
    if ((pfT -= dt) > 0) return; pfT = 0.3;
    $('party-frames').innerHTML = soc.party.map(id => {
      const s = soc.sim(id), b = Roster[id];
      return '<div class="pf' + (s && s.dead ? ' dead' : '') + '"><span>' + esc(b.name) + ' <small>' + botLevel(b) + '</small></span>' + (s ? hpBar(s.hp, s.maxHp) : '') + '</div>';
    }).join('');
  };
  soc.onChange = () => { if (ui.isOpen('soc')) refreshSoc(); if (ui.isOpen('dlg')) refreshDlg(); };
  const oldRefresh = ui.refresh.bind(ui);
  ui.refresh = () => { oldRefresh(); if (ui.isOpen('soc')) refreshSoc(); };
  const oldToggle = ui.toggle.bind(ui);
  ui.toggle = (k, force, silent) => { oldToggle(k, force, silent); if (ui.isOpen(k)) { if (k === 'soc') refreshSoc(); if (k === 'chat') refreshChat(); } };
}
