// Arayüz: can/mana/EXP çubukları, mini harita, hotbar, sistem mesajları.
const HOTBAR = [
  { key: '1', icon: '⚔️', name: 'Temel Saldırı' },
  { key: '2', icon: '💨', name: 'Hızlı Adım' },
  { key: '3', icon: '🔥', name: 'Ateş Darbesi' },
  { key: '4', icon: '❄️', name: 'Buz Kalkanı' },
  { key: '5', icon: '🗡️', name: 'Çifte Kesik' },
  { key: '6', icon: '🧪', name: 'Can İksiri' },
  { key: '7', icon: '💧', name: 'Mana İksiri' },
  { key: '8', icon: '📜', name: 'Şehre Dönüş' }
];

class HUD {
  constructor(player, world, rig) {
    this.player = player; this.world = world; this.rig = rig;
    const $ = id => document.getElementById(id);
    this.el = {
      name: $('pname'), lvl: $('plvl'),
      hp: $('hp-fill'), hpt: $('hp-text'), mp: $('mp-fill'), mpt: $('mp-text'),
      exp: $('exp-fill'), expt: $('exp-text'),
      coords: $('coords'), fps: $('fps'), log: $('log'), hotbar: $('hotbar'), root: $('hud')
    };
    this.mm = $('minimap');
    this.ctx = this.mm.getContext('2d');
    this.frames = 0; this.fpsT = 0;
    this.slots = [];
    this._buildHotbar();
  }

  show() { this.el.root.classList.remove('hidden'); }

  _buildHotbar() {
    HOTBAR.forEach((s, i) => {
      const d = document.createElement('div');
      d.className = 'slot locked';
      d.title = s.name + ' (Faz 2)';
      d.innerHTML = '<span class="key">' + s.key + '</span>' + s.icon;
      d.addEventListener('click', () => this.useSlot(i));
      this.el.hotbar.appendChild(d);
      this.slots.push(d);
    });
    window.addEventListener('keydown', e => {
      const a = document.activeElement;
      if (a && a.tagName === 'INPUT') return;
      const m = /^Digit([1-8])$/.exec(e.code);
      if (m) this.useSlot(parseInt(m[1], 10) - 1);
    });
  }

  useSlot(i) {
    const el = this.slots[i];
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 150);
    this.log(HOTBAR[i].name + ' henüz kullanılamıyor (Faz 2\'de gelecek).');
  }

  log(msg, cls = 'sys') {
    const d = document.createElement('div');
    d.className = cls; d.textContent = msg;
    this.el.log.appendChild(d);
    while (this.el.log.children.length > 6) this.el.log.removeChild(this.el.log.firstChild);
    setTimeout(() => d.remove(), 9000);
  }

  update(dt) {
    const s = this.player.stats, e = this.el;
    e.name.textContent = this.player.name;
    e.lvl.textContent = 'Sv. ' + s.level;
    e.hp.style.width = (s.hp / s.maxHp * 100) + '%';
    e.hpt.textContent = Math.floor(s.hp) + ' / ' + s.maxHp;
    e.mp.style.width = (s.mp / s.maxMp * 100) + '%';
    e.mpt.textContent = Math.floor(s.mp) + ' / ' + s.maxMp;
    e.exp.style.width = (s.exp / s.maxExp * 100) + '%';
    e.expt.textContent = 'EXP ' + s.exp + ' / ' + s.maxExp;
    e.coords.textContent = Math.round(this.player.pos.x) + ', ' + Math.round(this.player.pos.z);

    this.frames++; this.fpsT += dt;
    if (this.fpsT >= 0.5) { e.fps.textContent = Math.round(this.frames / this.fpsT) + ' FPS'; this.frames = 0; this.fpsT = 0; }

    this._drawMinimap();
  }

  _drawMinimap() {
    const ctx = this.ctx, S = this.mm.width, R = S / 2, scale = 1.15;
    const pp = this.player.pos, yaw = this.rig.yaw;
    ctx.clearRect(0, 0, S, S);
    ctx.save();
    ctx.beginPath(); ctx.arc(R, R, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#d3b27a'; ctx.fillRect(0, 0, S, S);

    // Harita, kameranın baktığı yön yukarı olacak şekilde döner
    const a = Math.atan2(-Math.cos(yaw), -Math.sin(yaw));
    const rot = -Math.PI / 2 - a;
    ctx.translate(R, R); ctx.rotate(rot); ctx.scale(scale, scale); ctx.translate(-pp.x, -pp.z);

    // yol
    ctx.strokeStyle = '#8f7a58'; ctx.lineWidth = 8; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let z = pp.z - 110; z <= pp.z + 110; z += 8) {
      const x = roadCenterX(z);
      z === pp.z - 110 ? ctx.moveTo(x, z) : ctx.lineTo(x, z);
    }
    ctx.stroke();

    // nesneler
    const range = R / scale + 10;
    for (const o of this.world.obstacles) {
      if (Math.abs(o.x - pp.x) > range || Math.abs(o.z - pp.z) > range) continue;
      if (o.type === 'pond') { ctx.fillStyle = '#3aa0c8'; ctx.beginPath(); ctx.arc(o.x, o.z, o.r + 1, 0, 6.283); ctx.fill(); continue; }
      ctx.fillStyle = o.type === 'palm' ? '#3f7d2a' : o.type === 'cactus' ? '#5a9a3c' : o.type === 'gate' ? '#a8281e' : '#8a7a62';
      ctx.beginPath(); ctx.arc(o.x, o.z, Math.max(1.6, o.r * 0.8), 0, 6.283); ctx.fill();
    }

    // oyuncu oku
    ctx.save();
    ctx.translate(pp.x, pp.z); ctx.rotate(Math.PI - this.player.heading); ctx.scale(1 / scale, 1 / scale);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(5.5, 6); ctx.lineTo(0, 3); ctx.lineTo(-5.5, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.restore();

    // kuzey işareti
    const nx = R + Math.sin(rot) * (R - 12), ny = R - Math.cos(rot) * (R - 12);
    ctx.fillStyle = '#ffe08a'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText('K', nx, ny); ctx.fillText('K', nx, ny);
  }
}
