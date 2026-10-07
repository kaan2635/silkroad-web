// İkonlar: game-icons.net SVG'leri (CC BY 3.0), Silkroad tarzı boyalı kare zemin üzerinde.
// icon(key, tint) → satır içi SVG metni. Zemin rengi kategoriye / elemente / dereceye göre.

const ICON_TINT = {
  phys: ['#6b4a2a', '#2a1a0e'], cold: ['#2d6f9e', '#0d2236'], lightning: ['#5a4aa8', '#1a1440'], fire: ['#b8461c', '#3a0e06'],
  force: ['#b89a3a', '#3a2a08'], buff: ['#3a7a5a', '#0e2a1c'], pass: ['#4a4a58', '#16161c'], hp: ['#a82a22', '#360a08'], mp: ['#2a52a8', '#0a1838'],
  mat: ['#2a8a9a', '#0a2a30'], quest: ['#9a7a2a', '#2e2208'], pet: ['#7a5a2a', '#24180a'], mall: ['#9a3a8a', '#2e0a28'], menu: ['#5a3a1e', '#1c1008'],
  bad: ['#7a1a1a', '#200606'], gold: ['#a8862a', '#2e2006']
};
const _iconCache = {};
let _iconId = 0;
function icon(key, tint = 'phys', o = {}) {
  const ck = key + '|' + (Array.isArray(tint) ? tint.join() : tint) + '|' + (o.flat ? 1 : 0);
  if (_iconCache[ck]) return _iconCache[ck];
  const d = ICON_PATHS[key] || ICON_PATHS.quest;
  const [c1, c2] = Array.isArray(tint) ? tint : (ICON_TINT[tint] || ICON_TINT.phys);
  const id = 'ig' + (++_iconId);
  const svg = o.flat
    ? '<svg class="ico flat" viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="' + d + '"/></svg>'
    : '<svg class="ico" viewBox="0 0 512 512" aria-hidden="true"><defs><radialGradient id="' + id + 'b" cx="35%" cy="30%" r="85%"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></radialGradient>' +
      '<linearGradient id="' + id + 'f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe8"/><stop offset="1" stop-color="#d8c08a"/></linearGradient></defs>' +
      '<rect width="512" height="512" rx="40" fill="url(#' + id + 'b)"/>' +
      '<g transform="translate(56 64) scale(.78)"><path fill="#000" opacity=".55" d="' + d + '" transform="translate(14 18)"/><path fill="url(#' + id + 'f)" d="' + d + '"/></g>' +
      '<rect x="10" y="10" width="492" height="492" rx="34" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="12"/></svg>';
  _iconCache[ck] = svg;
  return svg;
}

// Eşya → ikon anahtarı ve zemin
function _degTint(d) {
  const c = new THREE.Color(DEG_METAL[(d || 1) - 1]);
  const a = c.clone().multiplyScalar(0.55), b = c.clone().multiplyScalar(0.16);
  return ['#' + a.getHexString(), '#' + b.getHexString()];
}
function itemIcon(base) {
  const b = ITEM_BASES[base];
  if (!b) return icon('quest', 'quest');
  if (b.cat === 'weapon') return icon(b.wtype, _degTint(b.d));
  if (b.cat === 'shield') return icon('shield', _degTint(b.d));
  if (b.cat === 'armor') return icon(b.slot, _degTint(b.d));
  if (b.cat === 'acc') return icon(b.slot, _degTint(b.d));
  if (b.cat === 'avatar') return icon(b.slot === 'av_hat' && b.look.kind === 'crown' ? 'crown' : b.slot, 'mall');
  const map = {
    pill: ['pill', 'buff'], ret: ['ret', 'quest'], rev: ['rev', 'lightning'], spd: ['spd', 'buff'], zerk: ['zerk', 'fire'], arrow: ['arrow', 'phys'],
    luck: ['luck', 'gold'], astral: ['astral', 'cold'], immortal: ['immortal', 'mall'], horse: ['horse', 'pet'], horse2: ['horse', 'mall'], camel: ['camel', 'pet'],
    pet_grab: ['fox', 'pet'], pet_grab2: ['squirrel', 'mall'], pet_atk: ['wolf', 'pet'], pet_pot: ['petpot', 'pet'], sg: ['gold', 'bad'],
    prem: ['prem', 'mall'], bless: ['bless', 'mall'], rez: ['rez', 'mall'], hammer: ['hammer', 'mall'], reset_stat: ['reset', 'mall'], reset_skill: ['reset', 'mall'],
    inv_exp: ['invexp', 'mall'], st_exp: ['stexp', 'mall'], silkbag: ['silkbag', 'mall']
  };
  if (map[base]) return icon(map[base][0], map[base][1]);
  if (/^hp\d/.test(base)) return icon('hp', 'hp');
  if (/^mp\d/.test(base)) return icon('mp', 'mp');
  if (/^elx_/.test(base)) return icon('elx', 'mat');
  if (/^ms_/.test(base)) return icon('stone', 'mat');
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
