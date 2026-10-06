// Oyun genelinde kullanılan sabitler
const CONFIG = {
  worldSize: 600,          // dünya kenar uzunluğu (birim)
  gridSegments: 200,       // zemin ızgara çözünürlüğü
  playerSpeed: 9,          // birim / saniye
  turnSpeed: 12,
  saveKey: 'silkroad-web-save',
  isTouch: typeof window !== 'undefined' && (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)),
  sky: { horizon: 0xf0d9a8, zenith: 0x5fa4e0 },
  fog: { near: 100, far: 420 },
  camera: {
    distance: 16, minDistance: 5, maxDistance: 42,
    pitch: 0.72, minPitch: 0.12, maxPitch: 1.4,
    rotateSpeed: 0.005, zoomSpeed: 0.012
  }
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
// a > b ise ters yönde çalışır
function sstep(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
// Deterministik rastgele sayı üreteci (çok oyunculuda herkes aynı dünyayı görsün diye)
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
