// Ayarlar: ses, grafik kalitesi, gölgeler, kamera hassasiyeti, FPS göstergesi. localStorage'a kaydedilir.
const Settings = {
  KEY: 'silkroad-web-settings',
  data: { master: 0.8, sfx: 0.9, music: 0.45, shadows: true, quality: CONFIG.isTouch ? 'medium' : 'high', fps: !CONFIG.isTouch, sens: 1, names: true, autopot: false, autohp: 0.45, automp: 0.3 },
  listeners: [],
  load() {
    try { Object.assign(this.data, JSON.parse(localStorage.getItem(this.KEY)) || {}); } catch (e) { /* özel pencere */ }
  },
  save() { try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* yoksay */ } },
  set(k, v) { this.data[k] = v; this.save(); for (const f of this.listeners) f(k, v); },
  on(fn) { this.listeners.push(fn); }
};
Settings.load();

class SettingsUI {
  constructor(opts) {   // opts: { renderer, resize, onReset }
    this.opts = opts;
    this.win = document.getElementById('settings');
    this.body = document.getElementById('set-body');
    this.resetArm = false;
    document.getElementById('btn-settings').addEventListener('click', () => this.toggle());
    this.win.addEventListener('click', e => { if (e.target.closest('.x')) this.toggle(false); });
    window.addEventListener('keydown', e => {
      const a = document.activeElement; if (a && a.tagName === 'INPUT' && a.type === 'text') return;
      if (e.code === 'Escape' && !window.__escClosed) this.toggle();
      window.__escClosed = false;
    });
    this.body.addEventListener('input', e => {
      const el = e.target.closest('[data-k]'); if (!el) return;
      const k = el.dataset.k;
      if (el.type === 'range') { const v = +el.value; Settings.set(k, v); el.nextElementSibling.textContent = Math.round(v * (k === 'sens' ? 100 : 100)) + '%'; }
    });
    this.body.addEventListener('click', e => {
      const t = e.target.closest('[data-tg]'), q = e.target.closest('[data-q]'), r = e.target.closest('[data-reset]');
      if (t) { Settings.set(t.dataset.tg, !Settings.data[t.dataset.tg]); SFX.play('tab'); this.render(); }
      else if (q) { Settings.set('quality', q.dataset.q); SFX.play('tab'); this.render(); }
      else if (r) {
        if (!this.resetArm) { this.resetArm = true; this.render(); return; }
        this.opts.onReset();
      }
    });
    this.apply();
    Settings.on(k => this.apply(k));
  }

  toggle(force) {
    const open = force === undefined ? this.win.classList.contains('hidden') : force;
    this.win.classList.toggle('hidden', !open);
    this.resetArm = false;
    if (open) { this.render(); SFX.play('ui'); }
  }

  // Ayarları oyuna uygula (k verilirse sadece ilgili ayar)
  apply(k) {
    const d = Settings.data, o = this.opts, all = k === undefined;
    if (all || k === 'master' || k === 'sfx' || k === 'music') SFX.setVolumes({ master: d.master, sfx: d.sfx, music: d.music });
    if (all || k === 'quality') {
      const cap = d.quality === 'low' ? 1 : d.quality === 'medium' ? 1.5 : 2;
      o.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
      o.resize();
    }
    if (all || k === 'shadows') {
      o.renderer.shadowMap.enabled = !!d.shadows;
      o.scene.traverse(m => { if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach(x => { x.needsUpdate = true; }); });
    }
    if (all || k === 'sens') CONFIG.camera.rotateSpeed = (CONFIG.camera._baseRot || (CONFIG.camera._baseRot = CONFIG.camera.rotateSpeed)) * d.sens;
    if (all || k === 'fps') { const fps = document.getElementById('fps'); if (fps) fps.style.display = d.fps ? '' : 'none'; }
  }

  render() {
    const d = Settings.data;
    const slider = (k, label, min, max) => '<label class="srow2"><span>' + label + '</span><input type="range" min="' + min + '" max="' + max + '" step="0.05" value="' + d[k] + '" data-k="' + k + '"><b>' + Math.round(d[k] * 100) + '%</b></label>';
    const tog = (k, label) => '<button class="tg' + (d[k] ? ' on' : '') + '" data-tg="' + k + '">' + label + ': ' + (d[k] ? 'Açık' : 'Kapalı') + '</button>';
    const qb = (q, l) => '<button class="tg' + (d.quality === q ? ' on' : '') + '" data-q="' + q + '">' + l + '</button>';
    const keys = CONFIG.isTouch ? '' :
      '<h4>Kontroller</h4><div class="keys"><span><kbd>Sol tık</kbd> yürü / saldır</span><span><kbd>Sağ tık</kbd> kamera</span><span><kbd>WASD</kbd> yürü</span><span><kbd>Tab</kbd> hedef</span>' +
      '<span><kbd>Space</kbd> saldır</span><span><kbd>1–8</kbd> hotbar</span><span><kbd>Shift+1–8</kbd> 2. sayfa</span><span><kbd>F1/F2</kbd> sayfa</span><span><kbd>Z</kbd> berserk</span>' +
      '<span><kbd>I</kbd> envanter</span><span><kbd>C</kbd> karakter</span><span><kbd>K</kbd> yetenekler</span><span><kbd>L</kbd> görevler</span><span><kbd>M</kbd> harita</span><span><kbd>Esc</kbd> ayarlar</span></div>';
    this.body.innerHTML =
      '<h4>Ses</h4>' + slider('master', 'Genel', 0, 1) + slider('sfx', 'Efektler', 0, 1) + slider('music', 'Müzik ve ortam', 0, 1) +
      '<h4>Görüntü</h4><div class="seg"><span>Kalite</span>' + qb('low', 'Düşük') + qb('medium', 'Orta') + qb('high', 'Yüksek') + '</div>' +
      '<div class="seg">' + tog('shadows', 'Gölgeler') + tog('fps', 'FPS') + tog('names', 'Canavar isimleri') + '</div>' +
      '<h4>Otomatik İksir</h4><div class="seg">' + tog('autopot', 'Otomatik iksir') + '</div>' + slider('autohp', 'Can eşiği', 0.1, 0.9) + slider('automp', 'Mana eşiği', 0.1, 0.9) +
      '<h4>Kontrol</h4>' + slider('sens', 'Kamera hassasiyeti', 0.4, 2) + keys +
      '<h4>Kayıt</h4><div class="seg"><button class="tg warn" data-reset="1">' + (this.resetArm ? 'Emin misin? Tüm ilerleme silinir' : 'Kaydı sıfırla') + '</button></div>' +
      '<p class="credit">3D modeller: <b>Kenney</b> (CC0) · Three.js (MIT) · ses ve müzik oyun içinde üretilir.</p>';
  }
}
