// İkonlar: game-icons.net SVG'leri (CC BY 3.0), Silkroad tarzı boyalı kare zemin üzerinde.
// icon(key, tint) → satır içi SVG metni. Zemin rengi kategoriye / elemente / dereceye göre.

const ICON_TINT = {
  phys: ['#6b4a2a', '#2a1a0e'], cold: ['#2d6f9e', '#0d2236'], lightning: ['#5a4aa8', '#1a1440'], fire: ['#b8461c', '#3a0e06'],
  force: ['#b89a3a', '#3a2a08'], buff: ['#3a7a5a', '#0e2a1c'], pass: ['#4a4a58', '#16161c'], hp: ['#a82a22', '#360a08'], mp: ['#2a52a8', '#0a1838'],
  mat: ['#2a8a9a', '#0a2a30'], quest: ['#9a7a2a', '#2e2208'], pet: ['#7a5a2a', '#24180a'], mall: ['#9a3a8a', '#2e0a28'], menu: ['#5a3a1e', '#1c1008'],
  bad: ['#7a1a1a', '#200606'], gold: ['#a8862a', '#2e2006'],
  dark: ['#5a2a7a', '#1a0a26'], sound: ['#2a8a7a', '#0a2a24']
};
const _iconCache = {};
// Boyalı varlık sayfası (assets/ui/icons.webp, tools/slice_sheet.py): SVG içinde bir hücreyi çizer
function _sheetCell(key, x, y, w, h, extra = '') {
  const S = typeof SHEET_ICONS !== 'undefined' ? SHEET_ICONS : null, i = S && S.i[key];
  if (i === undefined || i === null) return '';
  const cx = (i % S.cols) * 64, cy = Math.floor(i / S.cols) * 64;
  return '<svg x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" viewBox="' + cx + ' ' + cy + ' 64 64"' + extra + '><image href="assets/ui/icons.webp" width="' + S.cols * 64 + '" height="' + S.rows * 64 + '"/></svg>';
}
const sheetHas = k => typeof SHEET_ICONS !== 'undefined' && SHEET_ICONS.i[k] !== undefined;
let _iconId = 0;
// o: { flat, metal: [üst, alt] glif rengi, frame: 0 düz / 1 gümüş / 2 altın süslü, glow: zemin parıltısı rengi,
//      sprite: glif yerine boyalı hücre, bg: zemin yerine boyalı hücre (glif üstte) }
function icon(key, tint = 'phys', o = {}) {
  const ck = key + '|' + (Array.isArray(tint) ? tint.join() : tint) + '|' + (o.flat ? 1 : 0) + '|' + (o.metal || '') + '|' + (o.frame || 0) + '|' + (o.glow || '') + '|' + (o.sprite || '') + '|' + (o.bg || '');
  if (_iconCache[ck]) return _iconCache[ck];
  const d = ICON_PATHS[key] || ICON_PATHS.quest;
  const [c1, c2] = Array.isArray(tint) ? tint : (ICON_TINT[tint] || ICON_TINT.phys);
  const [m1, m2] = o.metal || ['#fffbe8', '#d8c08a'];
  const id = 'ig' + (++_iconId), fr = o.frame || 0;
  let svg;
  if (o.flat) svg = '<svg class="ico flat" viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="' + d + '"/></svg>';
  else {
    svg = '<svg class="ico" viewBox="0 0 512 512" aria-hidden="true"><defs><radialGradient id="' + id + 'b" cx="35%" cy="30%" r="85%"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></radialGradient>' +
      '<linearGradient id="' + id + 'f" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="' + m1 + '"/><stop offset=".55" stop-color="' + m2 + '"/><stop offset="1" stop-color="' + m1 + '"/></linearGradient>' +
      (o.glow ? '<radialGradient id="' + id + 'g"><stop offset="0" stop-color="' + o.glow + '" stop-opacity=".75"/><stop offset="1" stop-color="' + o.glow + '" stop-opacity="0"/></radialGradient>' : '') + '</defs>' +
      '<rect width="512" height="512" rx="40" fill="url(#' + id + 'b)"/>' +
      (o.glow ? '<circle cx="256" cy="262" r="230" fill="url(#' + id + 'g)"/>' : '');
    if (o.bg) svg += '<clipPath id="' + id + 'c"><rect width="512" height="512" rx="40"/></clipPath><g clip-path="url(#' + id + 'c)">' + _sheetCell(o.bg, 0, 0, 512, 512) + '</g><rect width="512" height="512" rx="40" fill="#000" opacity=".28"/>';
    if (o.sprite) svg += _sheetCell(o.sprite, 26, 26, 460, 460);
    else if (o.bg) svg += '<g transform="translate(106 112) scale(.585)"><path fill="#000" opacity=".8" d="' + d + '" transform="translate(10 14)" stroke="#000" stroke-width="40" stroke-linejoin="round"/><path fill="url(#' + id + 'f)" d="' + d + '" stroke="#000" stroke-opacity=".6" stroke-width="10"/></g>';
    else svg += '<g transform="translate(56 64) scale(.78)"><path fill="#000" opacity=".55" d="' + d + '" transform="translate(14 18)"/><path fill="url(#' + id + 'f)" d="' + d + '" stroke="#000" stroke-opacity=".35" stroke-width="6"/></g>';
    if (fr === 0) svg += '<rect x="10" y="10" width="492" height="492" rx="34" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="12"/>';
    else {
      const col = fr === 2 ? '#f0c850' : '#d8dee8';
      svg += '<rect x="12" y="12" width="488" height="488" rx="32" fill="none" stroke="' + col + '" stroke-opacity=".9" stroke-width="14"/>' +
        '<rect x="34" y="34" width="444" height="444" rx="22" fill="none" stroke="' + col + '" stroke-opacity=".45" stroke-width="5"/>';
      if (fr === 2) for (const [x, y] of [[40, 40], [472, 40], [40, 472], [472, 472]]) svg += '<path d="M' + x + ' ' + (y - 26) + 'l26 26-26 26-26-26z" fill="' + col + '" stroke="#5a3a08" stroke-width="5"/>';
    }
    svg += '</svg>';
  }
  _iconCache[ck] = svg;
  return svg;
}

// Eşya → ikon anahtarı ve zemin
function _degTint(d) {
  const c = new THREE.Color(DEG_METAL[(d || 1) - 1]);
  const a = c.clone().multiplyScalar(0.55), b = c.clone().multiplyScalar(0.16);
  return ['#' + a.getHexString(), '#' + b.getHexString()];
}
// Derece bandı → glif çeşidi (1–2, 3–4, 5–7, 8–10)
const _degBand = d => (d <= 2 ? 1 : d <= 4 ? 2 : d <= 7 ? 3 : 4);
const _accBand = d => (d <= 3 ? 1 : d <= 7 ? 2 : 3);
function _metalGlyph(d) {
  const c = new THREE.Color(DEG_METAL[(d || 1) - 1]), hi = c.clone().lerp(new THREE.Color(0xffffff), 0.65), lo = c.clone().lerp(new THREE.Color(0x8a7a5a), 0.25);
  return ['#' + hi.getHexString(), '#' + lo.getHexString()];
}
function itemIcon(base) {
  const b = ITEM_BASES[base];
  if (!b) return icon('quest', 'quest');
  if (b.cat === 'weapon' || b.cat === 'shield' || b.cat === 'armor' || b.cat === 'acc') {
    const band = b.cat === 'acc' ? _accBand(b.d) : _degBand(b.d);
    let key;
    if (b.cat === 'weapon') key = band === 1 ? b.wtype : b.wtype + '_' + band;
    else if (b.cat === 'shield') key = band === 1 ? 'shield' : 'shield_' + band;
    else if (b.cat === 'armor') key = b.slot + '_' + b.atype;
    else key = band === 1 ? b.slot : b.slot + '_' + band;
    if (!ICON_PATHS[key]) key = b.cat === 'weapon' ? b.wtype : b.cat === 'shield' ? 'shield' : b.slot;
    const glow = b.d >= 8 ? '#' + new THREE.Color(DEG_METAL[b.d - 1]).getHexString() : null;
    return icon(key, _degTint(b.d), { metal: _metalGlyph(b.d), frame: b.tier || 0, glow, sprite: _gearSprite(b) });
  }
  if (b.cat === 'avatar') return b.slot === 'devil' ? icon('devil_1', 'fire', { frame: Math.min(2, b.look.g - 1) }) : b.slot === 'job' ? icon('job', 'gold', { frame: (JOB_SUITS[base] || { g: 1 }).g - 1 }) : icon(b.slot === 'av_hat' && b.look.kind === 'crown' ? 'crown' : b.slot, 'mall', { frame: 2 });
  const sp = _itemSprite(base, b);
  if (b.astone) return icon('as', 'cold', { frame: 1, sprite: sp });
  const map = {
    pill: ['pill', 'buff'], ret: ['ret', 'quest'], rev: ['rev', 'lightning'], spd: ['spd', 'buff'], zerk: ['zerk', 'fire'], arrow: ['arrow', 'phys'],
    luck: ['luck', 'gold'], astral: ['astral', 'cold'], immortal: ['immortal', 'mall'], horse: ['horse', 'pet'], horse2: ['horse', 'mall'], camel: ['camel', 'pet'],
    pet_grab: ['fox', 'pet'], pet_grab2: ['squirrel', 'mall'], pet_atk: ['wolf', 'pet'], pet_pot: ['petpot', 'pet'], sg: ['gold', 'bad'],
    prem: ['prem', 'mall'], bless: ['bless', 'mall'], rez: ['rez', 'mall'], hammer: ['hammer', 'mall'], reset_stat: ['reset', 'mall'], reset_skill: ['reset', 'mall'],
    inv_exp: ['invexp', 'mall'], st_exp: ['stexp', 'mall'], silkbag: ['silkbag', 'mall'], gchat: ['gchat', 'mall'], rename: ['soc_info', 'mall'], pet_food: ['pet_food', 'pet'], ox: ['ox', 'pet'], wagon: ['wagon', 'mall'], pet_atk2: ['pet_atk2', 'mall'], pet_atk3: ['pet_atk3', 'mall'], adv_elx: ['adv_elx', 'mall'], proof: ['proof', 'gold'], ess_atk: ['ess_atk', 'fire'], ess_def: ['ess_def', 'buff'], ess_mag: ['ess_mag', 'lightning'], tab_ms: ['tab_ms', 'mp'], tab_as: ['tab_as', 'buff'], arena_coin: ['arena_coin', 'gold'], pumpkin: ['pumpkin', 'fire'], snowflake: ['snowflake', 'cold'], fw_inv1: ['menu_map', 'lightning'], fw_inv3: ['menu_map', 'mall'], fw_inv5: ['menu_map', 'fire'],
    elx_w: ['elx_w', 'fire'], elx_a: ['elx_a', 'cold'], elx_s: ['elx_s', 'buff'], elx_c: ['elx_c', 'lightning']
  };
  if (map[base]) return icon(map[base][0], map[base][1], { sprite: sp });
  let m = /^(hp|mp)(\d)$/.exec(base);
  if (m) return icon('pot_' + Math.min(5, +m[2]), m[1], { frame: +m[2] >= 6 ? 2 : +m[2] >= 4 ? 1 : 0, sprite: sp });
  m = /^ms_(\w+)$/.exec(base);
  if (m) return icon(ICON_PATHS['ms_' + m[1]] ? 'ms_' + m[1] : 'stone', { str: 'fire', int: 'lightning', hp: 'hp', mp: 'mp', crit: 'gold', dur: 'buff' }[m[1]] || 'mat', { sprite: sp });
  if (b.cat === 'mat' && sp) return icon('stone', 'mat', { sprite: sp });
  if (/^tg_/.test(base)) return icon('tg', 'gold');
  if (b.cat === 'quest') return icon('quest', 'quest');
  return icon('quest', 'quest');
}
function skillIcon(id) {
  const s = SKILLS_BY_ID[id]; if (!s) return icon('atk');
  const M = MASTERIES[s.m];
  const tint = s.type === 'passive' ? 'pass' : M.kind === 'elem' ? M.elem : (s.type === 'buff' ? 'buff' : 'phys');
  return icon(id, tint, { bg: s.type === 'passive' ? null : _skillBg(s) });
}
const masteryIcon = k => icon('m_' + k, MASTERIES[k].kind === 'elem' ? MASTERIES[k].elem : 'phys');
const statusIcon = k => icon('st_' + k, 'bad');

// ---------- Boyalı varlık sayfası eşlemeleri ----------
const _pick = (pre, list, d, off = 0) => { const n = list.length, i = Math.min(n - 1, Math.max(0, Math.floor(((d || 1) - 1) * n / 14) + off)); return pre + list[i]; };
const _range = n => Array.from({ length: n }, (_, i) => i);
const SPR_WEAPON = {
  sword: ['sw', _range(16)], esword: ['sw', [1, 0, 3, 2, 5, 4, 7, 6, 9, 8, 11, 10, 13, 12, 15, 14]], tsword: ['bl', _range(14).reverse()], blade: ['bl', _range(14)],
  spear: ['sp', _range(16)], glaive: ['sp', [1, 2, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 15]], bow: ['bw', _range(13)], xbow: ['bw', [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]],
  dagger: ['dg', _range(7)], staff: ['st', [0, 5, 7, 8, 9, 10, 11, 12, 13, 14]], dstaff: ['st', [2, 1, 6, 7, 13, 14]], rod: ['st', [3, 4, 1, 6, 2]]
};
const SPR_ACC = { ring: [1, 17, 18, 21, 23, 25], earring: [5, 7, 22, 28, 30, 19, 31, 29], necklace: [0, 4, 3, 2, 6, 16, 12, 14, 15, 10, 8, 9, 13, 11, 20, 26, 27, 24] };
const SPR_CHEST = { armor: _range(15), heavy: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], protector: [15, 16, 17, 18, 19, 0, 1, 2], light: [16, 17, 18, 19, 15, 1, 2], garment: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29], robe: [29, 28, 27, 26, 25, 24, 23, 22, 21, 20] };
function _gearSprite(b) {
  if (typeof SHEET_ICONS === 'undefined') return null;
  if (b.cat === 'weapon') { const w = SPR_WEAPON[b.wtype]; return w ? _pick(w[0], w[1], b.d) : null; }
  if (b.cat === 'shield') return _pick('sh', _range(15), b.d);
  if (b.cat === 'acc') { const a = SPR_ACC[b.slot]; return a ? _pick('ac', a, b.d) : null; }
  if (b.cat === 'armor' && b.slot === 'chest') { const a = SPR_CHEST[b.atype]; return a ? _pick('eq', a, b.d) : null; }
  return null;
}
const SPR_ITEM = {
  hp1: 8, hp2: 9, hp3: 45, hp4: 79, hp5: 55, hp6: 10, hp7: 78, mp1: 2, mp2: 3, mp3: 28, mp4: 54, mp5: 80, mp6: 66, mp7: 75,
  pill: 6, spd: 7, zerk: 27, luck: 5, astral: 13, immortal: 30, rev: 17, elx_w: 14, elx_a: 23, elx_s: 19, elx_c: 24, adv_elx: 18,
  ess_atk: 31, ess_def: 64, ess_mag: 25, tab_ms: 58, tab_as: 63, proof: 61, silkbag: 15, pet_pot: 44, bless: 12, prem: 16, hammer: 37,
  horse: 'tr0', horse2: 'tr1', camel: 'tr2', ox: 'tr3',
  ms_str: 42, ms_int: 48, ms_hp: 52, ms_mp: 46, ms_crit: 47, ms_dur: 49
};
const SPR_GEMS = [56, 57, 58, 59, 60, 62, 63, 65, 67, 68, 69, 70, 71, 72, 73, 74, 76, 77, 81, 82, 83, 84, 36, 39, 40, 41, 43, 50, 51, 53];
function _itemSprite(base, b) {
  if (typeof SHEET_ICONS === 'undefined') return null;
  const v = SPR_ITEM[base];
  if (v !== undefined) return typeof v === 'string' ? v : 'it' + v;
  if (b.cat === 'mat' && !b.elx) { let h = 0; for (const ch of base) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return 'it' + SPR_GEMS[h % SPR_GEMS.length]; }
  return null;
}
const SPR_SKILL = {
  bicheon: [16, 19, 1, 22, 2], heuksal: [13, 24, 9, 11], pacheon: [8, 26, 5], cold: [4, 20, 23, 12], lightning: [3, 6, 15, 28], fire: [0, 7, 18, 21], force: [29, 27, 10, 25],
  warrior: [17, 2, 16, 19, 11], rogue: [24, 9, 22, 13], wizard: [7, 20, 28, 0, 4], warlock: [15, 3, 6, 9], cleric: [27, 29, 25, 26], bard: [12, 8, 26, 23]
};
function _skillBg(s) {
  if (typeof SHEET_ICONS === 'undefined') return null;
  const pool = SPR_SKILL[s.m]; if (!pool) return null;
  const same = SKILL_DEFS.filter(x => x.m === s.m && x.type !== 'passive'), i = same.indexOf(s);
  return 'sk' + pool[(i < 0 ? 0 : i) % pool.length];
}
// Canavar portresi (hedef çerçevesi)
const MOB_PORTRAIT = {
  wolf: 'wolf', gwolf: 'wolf', sandwolf: 'wolf', blackwolf: 'wolf', jackal: 'wolf', icewolf: 'snowwolf', frostwolf: 'snowwolf',
  tiger: 'weaktiger', u_tiger: 'blacktiger', bandit: 'bandit', hbandit: 'bandit', ebandit: 'bandit', egbandit: 'bandit', kthief: 'bandit', kguard: 'blader',
  barcher: 'banditarcher', dbandit: 'horseman', sbandit: 'horseman', abandit: 'banditarcher', orc: 'ochao', goblin: 'ochao', tribal: 'ochao', bigtribal: 'ochao',
  darkorc: 'ochaogeneral', bigorc: 'ochaogeneral', bigorcskull: 'ochaoshaman', priestess: 'snakegirl', snake: 'snakequeen', tombsnake: 'snakequeen', u_medusa: 'snakequeen',
  scorpion: 'scorpion', sandscorp: 'scorpion', kingscorp: 'scorpion', scarab: 'scorpion', scarab2: 'scorpion', spider: 'scorpion', monk: 'taoist', darkmage: 'taoist',
  ninja: 'killer', bigninja: 'killer', ewarrior: 'blader', knightfallen: 'blader', gladiator: 'blader', demon: 'devilspirit', lavademon: 'devilspirit', bigdemon: 'devilspirit',
  flydemon: 'shaitan', bluedemon: 'shaitan', hound: 'cerberus', u_cerberus: 'cerberus', ghost: 'uruchi', tombspirit: 'uruchi', icewraith: 'uruchi', skeleton: 'uruchi',
  skelminion: 'uruchi', skelmage: 'uruchi', skelarcher: 'uruchi', u_uruchi: 'stronguruchi', u_bonelord: 'stronguruchi', u_isyutaru: 'isyutaru', minotaur: 'isyutaru',
  terracotta: 'tombgeneral', terracotta2: 'tombgeneral', jiangshi: 'tombgeneral', jiangshi2: 'tombgeneral', mummy: 'tombgeneral', templeguard: 'tombgeneral',
  anubisw: 'anubis', u_anubis: 'anubis', u_isis: 'neith', u_yuno: 'horus2', mummy2: 'horus', u_haroeris: 'horus', u_seth: 'horus', u_shaitan: 'shaitanp',
  u_yarkan: 'lordyarkan', u_shadowyarkan: 'giantyarkan', u_fwboss: 'giantyarkan', u_jupiter: 'lordyarkan', u_flamelord: 'devilspirit'
};
function mobPortrait(m) {
  if (typeof SHEET_PORTRAITS === 'undefined' || !m || !m.typeKey) return '';
  const k = MOB_PORTRAIT[m.typeKey], P = SHEET_PORTRAITS, i = k && P.i[k];
  if (i === undefined || i === null || i === '') return '';
  return 'background-position:' + (i % P.cols) / (P.cols - 1) * 100 + '% ' + (P.rows > 1 ? Math.floor(i / P.cols) / (P.rows - 1) * 100 : 0) + '%;background-size:' + P.cols * 100 + '% ' + P.rows * 100 + '%';
}
