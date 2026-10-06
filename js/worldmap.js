// Dünya haritası (M): sabit kuzey-yukarı harita; vahalar, harabeler, şehir, bölgeler ve oyuncu.
class WorldMap {
  constructor(player, quests) {
    this.player = player; this.quests = quests;
    this.canvas = document.getElementById('wmap-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.S = this.canvas.width;
    this.open = false;
    this.base = null;
  }

  _px(v) { return (v + CONFIG.worldSize / 2) / CONFIG.worldSize * this.S; }

  _buildBase() {
    const S = this.S, c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d'), k = S / CONFIG.worldSize;
    x.fillStyle = '#c9a468'; x.fillRect(0, 0, S, S);
    // bölge halkaları (dıştan içe)
    const ring = (r, col) => { x.fillStyle = col; x.beginPath(); x.arc(S / 2, S / 2, r * k, 0, 6.283); x.fill(); };
    ring(420, '#c98a5a');     // Kızıl Kum Denizi
    ring(195, '#d8b878');     // Akrep Çölü
    ring(110, '#e3cb92');     // Kurt Vadisi
    x.strokeStyle = 'rgba(80,50,20,.35)'; x.lineWidth = 1; x.setLineDash([4, 4]);
    for (const r of [110, 195]) { x.beginPath(); x.arc(S / 2, S / 2, r * k, 0, 6.283); x.stroke(); }
    x.setLineDash([]);
    // dünya sınırı
    x.strokeStyle = 'rgba(60,30,10,.7)'; x.lineWidth = 2;
    x.strokeRect(this._px(-CONFIG.worldSize / 2) + 1, this._px(-CONFIG.worldSize / 2) + 1, S - 2, S - 2);
    // kervan yolu
    x.strokeStyle = '#8a6e48'; x.lineWidth = 4; x.lineJoin = 'round'; x.beginPath();
    for (let z = -300; z <= 300; z += 6) { const px = this._px(roadCenterX(z)), py = this._px(z); z === -300 ? x.moveTo(px, py) : x.lineTo(px, py); }
    x.stroke();
    // vahalar
    PONDS.forEach((p, i) => {
      x.fillStyle = '#3aa0c8'; x.strokeStyle = '#2a6f2a'; x.lineWidth = 3;
      x.beginPath(); x.arc(this._px(p.x), this._px(p.z), 6, 0, 6.283); x.fill(); x.stroke();
    });
    // harabeler
    for (const r of RUINS) {
      x.fillStyle = '#6a5a48'; const px = this._px(r.x), py = this._px(r.z);
      x.fillRect(px - 5, py - 5, 10, 10);
      x.fillStyle = '#e04030'; x.fillRect(px - 2, py - 2, 4, 4);
    }
    // şehir
    const h = TOWN_HALF * k;
    x.fillStyle = '#d9c9a0'; x.strokeStyle = '#a8281e'; x.lineWidth = 3;
    x.fillRect(S / 2 - h, S / 2 - h, h * 2, h * 2); x.strokeRect(S / 2 - h, S / 2 - h, h * 2, h * 2);

    // yazılar
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const txt = (t, px, py, size, col) => {
      x.font = 'bold ' + size + 'px sans-serif'; x.lineWidth = 3; x.strokeStyle = 'rgba(40,24,8,.85)';
      x.strokeText(t, px, py); x.fillStyle = col; x.fillText(t, px, py);
    };
    txt('JANGAN', S / 2, S / 2 - 4, 11, '#fff3c0');
    txt('Şehri', S / 2, S / 2 + 8, 9, '#fff3c0');
    PONDS.forEach((p, i) => txt(POND_NAMES[i], this._px(p.x), this._px(p.z) - 13, 9, '#bfefff'));
    RUINS.forEach(r => txt('Harabe', this._px(r.x), this._px(r.z) - 12, 9, '#ffb8a8'));
    txt('KURT VADİSİ', S / 2, this._px(-95), 10, '#f5e6b8');
    txt('AKREP ÇÖLÜ', S / 2, this._px(-165), 10, '#f5e6b8');
    txt('KIZIL KUM DENİZİ', S / 2, this._px(-250), 11, '#ffd9c0');
    txt('KIZIL KUM DENİZİ', S / 2, this._px(250), 11, '#ffd9c0');
    this.base = c;
  }

  draw() {
    if (!this.open) return;
    if (!this.base) this._buildBase();
    const x = this.ctx, S = this.S, pl = this.player;
    x.clearRect(0, 0, S, S);
    x.drawImage(this.base, 0, 0);
    // aktif "keşfet" görev hedefleri
    const targets = this.quests ? this.quests.activeTargets() : [];
    PONDS.forEach((p, i) => {
      if (!targets.includes(POND_NAMES[i])) return;
      x.strokeStyle = '#ffd23a'; x.lineWidth = 3; x.beginPath(); x.arc(this._px(p.x), this._px(p.z), 12 + Math.sin(performance.now() * 0.005) * 2, 0, 6.283); x.stroke();
    });
    if (targets.includes('Kızıl Kum Denizi')) {
      x.fillStyle = '#ffd23a'; x.font = 'bold 12px sans-serif'; x.textAlign = 'center';
      x.fillText('★ Görev hedefi', S / 2, this._px(-232)); x.fillText('★ Görev hedefi', S / 2, this._px(268));
    }
    // oyuncu oku
    x.save();
    x.translate(this._px(pl.pos.x), this._px(pl.pos.z)); x.rotate(Math.PI - pl.heading);
    x.fillStyle = '#fff'; x.strokeStyle = '#000'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(0, -9); x.lineTo(6.5, 7); x.lineTo(0, 3.5); x.lineTo(-6.5, 7); x.closePath(); x.fill(); x.stroke();
    x.restore();
    x.fillStyle = '#fff'; x.font = 'bold 11px sans-serif'; x.textAlign = 'left';
    x.strokeStyle = '#000'; x.lineWidth = 3;
    const label = pl.name;
    x.strokeText(label, this._px(pl.pos.x) + 10, this._px(pl.pos.z) - 8); x.fillText(label, this._px(pl.pos.x) + 10, this._px(pl.pos.z) - 8);
    // kuzey
    x.fillStyle = '#ffe08a'; x.font = 'bold 14px sans-serif'; x.textAlign = 'center'; x.strokeText('K ↑', 22, 16); x.fillText('K ↑', 22, 16);
  }
}
