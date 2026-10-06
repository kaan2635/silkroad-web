// Klavye + fare + dokunmatik giriş.
// Masaüstü: sol tık = yürü, sağ tık / sol sürükle = kamera, tekerlek = zoom.
// Mobil: dokun = yürü, tek parmak kaydır = kamera, iki parmak = zoom, joystick = yürü.
class Input {
  constructor(el) {
    this.keys = {};
    this.clicks = [];
    this.dx = 0; this.dy = 0; this.wheel = 0;
    this.joy = { x: 0, y: 0 };
    this.rotating = false;
    this.leftDown = null;
    this.leftMoved = false;
    this._touches = new Map();
    this._pinch = 0;

    const typing = () => {
      const a = document.activeElement;
      return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA');
    };
    window.addEventListener('keydown', e => { if (!typing()) this.keys[e.code] = true; });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = {}; this.rotating = false; this.leftDown = null; });

    // --- Fare ---
    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('mousedown', e => {
      if (e.button === 2 || e.button === 1) this.rotating = true;
      if (e.button === 0) { this.leftDown = { x: e.clientX, y: e.clientY }; this.leftMoved = false; }
    });
    window.addEventListener('mousemove', e => {
      if (this.leftDown && !this.leftMoved) {
        if (Math.hypot(e.clientX - this.leftDown.x, e.clientY - this.leftDown.y) > 5) this.leftMoved = true;
      }
      if (this.rotating || (this.leftDown && this.leftMoved)) {
        this.dx += e.movementX; this.dy += e.movementY;
      }
    });
    window.addEventListener('mouseup', e => {
      if (e.button === 2 || e.button === 1) this.rotating = false;
      if (e.button === 0) {
        if (this.leftDown && !this.leftMoved) this.clicks.push({ x: e.clientX, y: e.clientY });
        this.leftDown = null;
      }
    });
    el.addEventListener('wheel', e => { e.preventDefault(); this.wheel += e.deltaY; }, { passive: false });

    // --- Dokunmatik (canvas) ---
    const pinchDist = () => {
      const t = [...this._touches.values()];
      return t.length >= 2 ? Math.hypot(t[0].x - t[1].x, t[0].y - t[1].y) : 0;
    };
    el.addEventListener('touchstart', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        this._touches.set(t.identifier, { x: t.clientX, y: t.clientY, sx: t.clientX, sy: t.clientY, t: performance.now(), moved: false });
      }
      if (this._touches.size >= 2) {
        for (const v of this._touches.values()) v.moved = true;   // iki parmak = tıklama sayılmaz
        this._pinch = pinchDist();
      }
    }, { passive: false });
    el.addEventListener('touchmove', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const rec = this._touches.get(t.identifier);
        if (!rec) continue;
        if (!rec.moved && Math.hypot(t.clientX - rec.sx, t.clientY - rec.sy) > 10) rec.moved = true;
        if (this._touches.size === 1 && rec.moved) { this.dx += (t.clientX - rec.x) * 1.1; this.dy += (t.clientY - rec.y) * 1.1; }
        rec.x = t.clientX; rec.y = t.clientY;
      }
      if (this._touches.size === 2) {
        const d = pinchDist();
        this.wheel += (this._pinch - d) * 3;
        this._pinch = d;
      }
    }, { passive: false });
    const endTouch = e => {
      for (const t of e.changedTouches) {
        const rec = this._touches.get(t.identifier);
        if (rec && e.type === 'touchend' && !rec.moved && this._touches.size === 1 && performance.now() - rec.t < 450) {
          this.clicks.push({ x: t.clientX, y: t.clientY });
        }
        this._touches.delete(t.identifier);
      }
    };
    el.addEventListener('touchend', endTouch);
    el.addEventListener('touchcancel', endTouch);
  }

  // Ekrandaki sanal joystick (mobil)
  bindJoystick(zone, knob) {
    const R = 50;
    let id = null, cx = 0, cy = 0;
    const move = t => {
      let dx = t.clientX - cx, dy = t.clientY - cy;
      const d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      this.joy.x = dx / R; this.joy.y = dy / R;
      knob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
    };
    zone.addEventListener('touchstart', e => {
      e.preventDefault();
      if (id !== null) return;
      const t = e.changedTouches[0];
      id = t.identifier;
      const r = zone.getBoundingClientRect();
      cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      move(t);
    }, { passive: false });
    zone.addEventListener('touchmove', e => {
      e.preventDefault();
      for (const t of e.changedTouches) if (t.identifier === id) move(t);
    }, { passive: false });
    const end = e => {
      for (const t of e.changedTouches) {
        if (t.identifier === id) {
          id = null; this.joy.x = 0; this.joy.y = 0;
          knob.style.transform = 'translate(-50%, -50%)';
        }
      }
    };
    zone.addEventListener('touchend', end);
    zone.addEventListener('touchcancel', end);
  }

  isDown(...codes) { return codes.some(c => this.keys[c]); }

  consumeLook() { const r = { dx: this.dx, dy: this.dy }; this.dx = 0; this.dy = 0; return r; }
  consumeWheel() { const w = this.wheel; this.wheel = 0; return w; }
}
