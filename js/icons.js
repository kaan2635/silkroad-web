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
let _iconId = 0;
// o: { flat, metal: [üst, alt] glif rengi, frame: 0 düz / 1 gümüş / 2 altın süslü, glow: zemin parıltısı rengi }
function icon(key, tint = 'phys', o = {}) {
  const ck = key + '|' + (Array.isArray(tint) ? tint.join() : tint) + '|' + (o.flat ? 1 : 0) + '|' + (o.metal || '') + '|' + (o.frame || 0) + '|' + (o.glow || '');
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
      (o.glow ? '<circle cx="256" cy="262" r="230" fill="url(#' + id + 'g)"/>' : '') +
      '<g transform="translate(56 64) scale(.78)"><path fill="#000" opacity=".55" d="' + d + '" transform="translate(14 18)"/><path fill="url(#' + id + 'f)" d="' + d + '" stroke="#000" stroke-opacity=".35" stroke-width="6"/></g>';
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
    return icon(key, _degTint(b.d), { metal: _metalGlyph(b.d), frame: b.tier || 0, glow });
  }
  if (b.cat === 'avatar') return icon(b.slot === 'av_hat' && b.look.kind === 'crown' ? 'crown' : b.slot, 'mall', { frame: 2 });
  const map = {
    pill: ['pill', 'buff'], ret: ['ret', 'quest'], rev: ['rev', 'lightning'], spd: ['spd', 'buff'], zerk: ['zerk', 'fire'], arrow: ['arrow', 'phys'],
    luck: ['luck', 'gold'], astral: ['astral', 'cold'], immortal: ['immortal', 'mall'], horse: ['horse', 'pet'], horse2: ['horse', 'mall'], camel: ['camel', 'pet'],
    pet_grab: ['fox', 'pet'], pet_grab2: ['squirrel', 'mall'], pet_atk: ['wolf', 'pet'], pet_pot: ['petpot', 'pet'], sg: ['gold', 'bad'],
    prem: ['prem', 'mall'], bless: ['bless', 'mall'], rez: ['rez', 'mall'], hammer: ['hammer', 'mall'], reset_stat: ['reset', 'mall'], reset_skill: ['reset', 'mall'],
    inv_exp: ['invexp', 'mall'], st_exp: ['stexp', 'mall'], silkbag: ['silkbag', 'mall'], fw_inv1: ['menu_map', 'lightning'], fw_inv3: ['menu_map', 'mall'], fw_inv5: ['menu_map', 'fire'],
    elx_w: ['elx_w', 'fire'], elx_a: ['elx_a', 'cold'], elx_s: ['elx_s', 'buff'], elx_c: ['elx_c', 'lightning']
  };
  if (map[base]) return icon(map[base][0], map[base][1]);
  let m = /^(hp|mp)(\d)$/.exec(base);
  if (m) return icon('pot_' + Math.min(5, +m[2]), m[1], { frame: +m[2] >= 6 ? 2 : +m[2] >= 4 ? 1 : 0 });
  m = /^ms_(\w+)$/.exec(base);
  if (m) return icon(ICON_PATHS['ms_' + m[1]] ? 'ms_' + m[1] : 'stone', { str: 'fire', int: 'lightning', hp: 'hp', mp: 'mp', crit: 'gold', dur: 'buff' }[m[1]] || 'mat');
  if (/^tg_/.test(base)) return icon('tg', 'gold');
  if (b.cat === 'quest') return icon('quest', 'quest');
  return icon('quest', 'quest');
}
function skillIcon(id) {
  const s = SKILLS_BY_ID[id]; if (!s) return icon('atk');
  const M = MASTERIES[s.m];
  const tint = s.type === 'passive' ? 'pass' : M.kind === 'elem' ? M.elem : (s.type === 'buff' ? 'buff' : 'phys');
  return icon(id, tint);
}
const masteryIcon = k => icon('m_' + k, MASTERIES[k].kind === 'elem' ? MASTERIES[k].elem : 'phys');
const statusIcon = k => icon('st_' + k, 'bad');
