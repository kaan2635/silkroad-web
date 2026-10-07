// Etkinlik penceresi (J): etkinlik takvimi ve katılım, giriş ödülü takvimi, Magic POP, Arena Jetonu mağazası, kaleler, mevsim takası.
function initEventsUI(ui, ev) {
  const $ = id => document.getElementById(id), pl = ev.player, hud = ev.hud;
  const fmt = n => Math.round(n).toLocaleString('tr-TR');
  const hm = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + ' sa ' + m + ' dk' : m + ' dk'; };
  ui.w.ev = $('evw');
  ui.w.ev.querySelector('.x').addEventListener('click', () => ui.toggle('ev', false));
  const st = { tab: 'list', fort: 'jangan', pop: null };
  const say = r => { if (r && r.msg) hud.log(r.msg, r.ok ? 'lvl' : 'dmg'); SFX.play(r && r.ok ? 'ui' : 'error'); };
  const btn = (act, label, cls, extra) => '<button data-ea="' + act + '"' + (extra || '') + (cls ? ' class="' + cls + '"' : '') + '>' + label + '</button>';
  const giveName = ([id, n]) => id === '@gold' ? fmt(n) + ' altın' : id === '@moon' ? 'Ay Mühürlü eşya' : id === '@sun' ? 'Güneş Mühürlü eşya' : ITEM_BASES[id].name + (n > 1 ? ' x' + n : '');
  const giveIcon = ([id]) => id === '@gold' ? icon('coins', 'gold') : id === '@moon' || id === '@sun' ? icon('treasure', 'gold') : itemIcon(id);

  function refresh() {
    const tabs = [['list', 'Etkinlikler', 'menu_ev'], ['att', 'Giriş Ödülü', 'ev_cal'], ['pop', 'Magic POP', 'ev_pop'], ['shop', 'Jeton Mağazası', 'ev_shop'], ['forts', 'Kaleler', 'ev_fort']];
    if (ev.season) tabs.push(['season', ev.season.name, ev.season.item]);
    $('ev-tabs').innerHTML = tabs.map(t => '<button data-etab="' + t[0] + '" class="' + (st.tab === t[0] ? 'on' : '') + '">' + icon(t[2], 'gold') + ' ' + t[1] + '</button>').join('');
    let h = '';
    if (st.tab === 'list') {
      const g = ev.goldLeft();
      h += ui._row(icon('ev_gold', 'gold'), 'Gold Time', g > 0 ? '<span class="on">Şu an aktif · ' + hm(g) + ' kaldı</span> — EXP/SP +%50, ganimet +%30' : 'Her gün 20:00–22:00, hafta sonu ayrıca 13:00–15:00 · sonraki ' + hm(ev.nextGold()) + ' sonra', '', g > 0 ? '#ffd23a' : '');
      if (ev.season) h += ui._row(itemIcon(ev.season.item), ev.season.name, ev.season.desc + ' Elinde: ' + pl.inv.count(ev.season.item), '', '#ff9a4a');
      if (ZONE.event && ev.match) h += '<div class="soc-gh"><b>' + EV_INFO[ev.match.type].name + '</b> <span>' + (ev.match.over ? 'Bitti' : 'Sürüyor') + '</span>' + btn('leave', 'Etkinlikten çık', 'warn small') + '</div>';
      h += '<h4>Arenalar ve savaşlar</h4>';
      for (const k of ['arena', 'ctf', 'survival']) {
        const I = EV_INFO[k], err = ev.canJoin(k);
        h += ui._row(icon(I.icon, 'bad'), I.name + ' <small class="lvt">Sv. ' + I.min + '+</small>', I.desc + (k === 'survival' && ev.best.survival ? ' En iyi: ' + ev.best.survival + ' dalga.' : ''), btn('join', 'Katıl', err ? 'dis' : '', ' data-k="' + k + '" title="' + (err || '') + '"'));
      }
      const fe = ev.canJoin('fortress', st.fort);
      h += ui._row(icon('ev_fort', 'bad'), 'Kale Savaşı <small class="lvt">Sv. 30+ · lonca</small>', EV_INFO.fortress.desc,
        '<select id="ev-fort">' + Object.keys(FORTS).map(k => '<option value="' + k + '"' + (st.fort === k ? ' selected' : '') + '>' + FORTS[k].name + '</option>').join('') + '</select>' + btn('join', 'Saldır', fe ? 'dis' : '', ' data-k="fortress" title="' + (fe || '') + '"'));
      h += '<p class="soc-note">Etkinlikte ölünce EXP kaybetmezsin; takım savaşlarında üste yeniden doğarsın. Ödüller: Arena Jetonu, onur puanı ve EXP.</p>';
    } else if (st.tab === 'att') {
      const t = ev.today(), m = t.slice(0, 7), A = ev.att.m === m ? ev.att : { got: [], last: '' }, can = A.last !== t && A.got.length < 28;
      h += '<p class="soc-hint">Her gün bir kez giriş yapıp ödülünü al. Her 7. gün büyük ödül. Takvim her ay yenilenir.</p>';
      h += '<div class="att-grid">' + Array.from({ length: 28 }, (_, i) => {
        const d = i + 1, got = A.got.includes(d), next = !got && d === A.got.length + 1, rw = ev.attReward(d);
        return '<div class="att' + (got ? ' got' : '') + (next ? ' next' : '') + (d % 7 === 0 ? ' big' : '') + '" title="' + rw.map(giveName).join(', ') + '"><b>' + d + '</b>' + giveIcon(rw[0]) + '<small>' + giveName(rw[0]) + '</small></div>';
      }).join('') + '</div>';
      h += '<div class="soc-act">' + btn('att', can ? 'Bugünün ödülünü al' : 'Bugün alındı', can ? 'big' : 'dis') + '</div>';
    } else if (st.tab === 'pop') {
      h += '<p class="soc-hint">Magic POP: ' + MAGIC_POP_COST + ' Silk ile çarkı çevir. Mühürlü eşya, avatar, simya malzemesi ya da 200 Silk büyük ödül çıkabilir. Silk: <b>' + fmt(pl.stats.silk || 0) + '</b></p>';
      h += '<div class="pop-wheel' + (st.spin ? ' spin' : '') + '">' + MAGIC_POP.map(p => '<span>' + (p.kind === 'silk' ? icon('silkbag', 'mall') : p.kind === 'item' ? itemIcon(p.id) : p.kind === 'avatar' ? icon('av_hat', 'mall') : icon('treasure', 'gold')) + '</span>').join('') + '</div>';
      if (st.pop) h += '<div class="soc-gh pop-res"><b>' + st.pop + '</b></div>';
      h += '<div class="soc-act">' + btn('pop', 'Çarkı çevir (' + MAGIC_POP_COST + ' Silk)', (pl.stats.silk || 0) >= MAGIC_POP_COST && !st.spin ? 'big' : 'dis') + '</div>';
      h += '<p class="soc-note">Toplam çevirme: ' + ev.pops + '</p>';
    } else if (st.tab === 'shop') {
      h += '<p class="soc-hint">Arena Jetonu: <b>' + pl.inv.count('arena_coin') + '</b> — arenalar, bayrak kapmaca, hayatta kalma ve Kale Savaşı\'ndan kazanılır.</p>';
      ARENA_SHOP.forEach((x, i) => { h += ui._row(giveIcon(x), giveName([x[0], x[1]]), x[0] === '@moon' ? 'Seviyene uygun rastgele Ay Mühürlü eşya' : x[0] === '@sun' ? 'Seviyene uygun rastgele Güneş Mühürlü eşya' : (ITEM_BASES[x[0]].sub || ''), '<span class="price">' + x[2] + ' jeton</span>' + btn('buy', 'Al', pl.inv.count('arena_coin') >= x[2] ? 'small' : 'small dis', ' data-i="' + i + '"')); });
    } else if (st.tab === 'forts') {
      h += '<p class="soc-hint">Kaleler yapay loncaların elinde. Loncanla Kale Savaşı\'nı kazanırsan kale 7 gün senin olur; her gün vergi toplarsın.</p>';
      for (const k in FORTS) { const f = ev.forts[k]; h += ui._row(icon('ev_fort', f.mine ? 'gold' : 'menu'), FORTS[k].name, 'Sahibi: ' + (f.mine ? '<span class="on">' + f.owner + ' (sen)</span>' : f.owner) + ' · günlük vergi ' + fmt(FORTS[k].tax) + ' altın', ''); }
      const mine = Object.keys(ev.forts).some(k => ev.forts[k].mine);
      h += '<div class="soc-act">' + btn('tax', 'Bugünün vergisini topla', mine && ev.taxDay !== ev.today() ? '' : 'dis') + '</div>';
    } else if (st.tab === 'season' && ev.season) {
      const S = ev.season;
      h += '<p class="soc-hint">' + S.desc + ' Elinde: <b>' + pl.inv.count(S.item) + ' ' + ITEM_BASES[S.item].name + '</b></p>';
      S.rewards.forEach((r, i) => { h += ui._row(itemIcon(r[0]), ITEM_BASES[r[0]].name + (r[1] > 1 ? ' x' + r[1] : ''), ITEM_BASES[r[0]].sub || (AVATARS[r[0]] ? 'Etkinliğe özel avatar' : ''), '<span class="price">' + r[2] + ' ' + ITEM_BASES[S.item].name + '</span>' + btn('strade', 'Değiştir', pl.inv.count(S.item) >= r[2] ? 'small' : 'small dis', ' data-i="' + i + '"')); });
    }
    $('ev-body').innerHTML = h;
  }
  ui.w.ev.addEventListener('click', e => {
    const t = e.target.closest('[data-etab]'); if (t) { st.tab = t.dataset.etab; SFX.play('tab'); refresh(); return; }
    const b = e.target.closest('[data-ea]'); if (!b) return;
    if (b.classList.contains('dis')) { if (b.title) hud.log(b.title, 'dmg'); return; }
    const a = b.dataset.ea;
    if (a === 'join') { const k = b.dataset.k; say(ev.join(k, k === 'fortress' ? $('ev-fort').value : null)); ui.toggle('ev', false); return; }
    if (a === 'leave') { ev.leave(); return; }
    if (a === 'att') say(ev.claimAtt());
    if (a === 'buy') say(ev.arenaBuy(+b.dataset.i));
    if (a === 'tax') say(ev.claimTax());
    if (a === 'strade') say(ev.seasonTrade(+b.dataset.i));
    if (a === 'pop') {
      const r = ev.magicPop();
      if (!r.ok) { say(r); return; }
      st.spin = true; st.pop = null; refresh(); SFX.play('tab');
      setTimeout(() => { st.spin = false; st.pop = r.name; SFX.play(r.prize.jackpot || r.prize.kind === 'seal' ? 'levelup' : 'gem'); hud.log(r.msg, 'lvl', '#ff9ae8'); if (ui.isOpen('ev')) refresh(); }, 1400);
      return;
    }
    refresh();
  });
  ui.w.ev.addEventListener('change', e => { if (e.target.id === 'ev-fort') { st.fort = e.target.value; refresh(); } });
  $('btn-ev').addEventListener('click', () => ui.toggle('ev'));
  window.addEventListener('keydown', e => { const a = document.activeElement; if (a && (a.tagName === 'INPUT' || a.tagName === 'SELECT')) return; if (e.code === 'KeyJ') ui.toggle('ev'); });
  ev.onChange = () => { if (ui.isOpen('ev')) refresh(); };
  const oldToggle = ui.toggle;
  ui.toggle = (k, f, s) => { oldToggle(k, f, s); if (k === 'ev' && ui.isOpen('ev')) refresh(); };
  // giriş ödülü hatırlatması
  ev.remind = () => {
    const t = ev.today();
    if (ev.att.last !== t) { $('badge-ev').classList.remove('hidden'); hud.log('Günlük giriş ödülün hazır: Etkinlikler (J) → Giriş Ödülü', 'lvl', '#ffd23a'); }
    if (ev.goldLeft() > 0) hud.log('Gold Time aktif: EXP/SP +%50, ganimet +%30', 'lvl', '#ffd23a');
    if (ev.season) hud.log(ev.season.name + ' etkinliği başladı! ' + ev.season.desc, 'lvl', '#ff9a4a');
  };
  const oc = ev.claimAtt.bind(ev);
  ev.claimAtt = () => { const r = oc(); if (r.ok) $('badge-ev').classList.add('hidden'); return r; };
}
