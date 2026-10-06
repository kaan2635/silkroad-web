// Klavye + fare girişi. Sol tık = yürü, sağ tık / sol sürükle = kamera.
class Input {
  constructor(el) {
    this.keys = {};
    this.clicks = [];
    this.dx = 0; this.dy = 0; this.wheel = 0;
    this.rotating = false;
    this.leftDown = null;
    this.leftMoved = false;

    const typing = () => {
      const a = document.activeElement;
      return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA');
    };
    window.addEventListener('keydown', e => { if (!typing()) this.keys[e.code] = true; });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = {}; this.rotating = false; this.leftDown = null; });

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
  }

  isDown(...codes) { return codes.some(c => this.keys[c]); }

  consumeLook() { const r = { dx: this.dx, dy: this.dy }; this.dx = 0; this.dy = 0; return r; }
  consumeWheel() { const w = this.wheel; this.wheel = 0; return w; }
}
