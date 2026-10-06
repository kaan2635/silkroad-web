// Ses: tamamen WebAudio ile üretilen efektler, rüzgâr/cırcır ortamı ve pentatonik (Çin tarzı) müzik.
// Dosya indirmez; telif sorunu yok. Tarayıcı kuralı gereği SFX.init() ilk kullanıcı dokunuşunda çağrılır.

const SFX = {
  ctx: null, master: null, sfxBus: null, musicBus: null, noiseBuf: null,
  vol: { master: 0.8, sfx: 0.9, music: 0.45 }, mood: 'day', _lastStep: 0, _t: { music: 0, amb: 0 }, _beat: 0,

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      const c = this.ctx = new AC();
      this.master = c.createGain(); this.sfxBus = c.createGain(); this.musicBus = c.createGain();
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      this.sfxBus.connect(this.master); this.musicBus.connect(this.master); this.master.connect(comp); comp.connect(c.destination);
      const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
      this.applyVolumes();
      this._startWind();
    } catch (e) { this.ctx = null; }
  },

  applyVolumes() {
    if (!this.ctx) return;
    this.master.gain.value = this.vol.master;
    this.sfxBus.gain.value = this.vol.sfx;
    this.musicBus.gain.value = this.vol.music;
  },
  setVolumes(v) { Object.assign(this.vol, v); this.applyVolumes(); },

  // --- yapı taşları ---
  _osc(type, f0, f1, t0, dur, vol, bus = this.sfxBus) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(bus); o.start(t0); o.stop(t0 + dur + 0.05);
  },
  _noise(t0, dur, vol, f0, f1, q = 1, type = 'bandpass', bus = this.sfxBus) {
    const c = this.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; s.loop = true; fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f0, t0); if (f1 !== f0) fl.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(fl); fl.connect(g); g.connect(bus); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
  },
  _note(freq, t0, dur, vol, type = 'triangle', bus = this.sfxBus) { this._osc(type, freq, freq, t0, dur, vol, bus); },

  // --- efektler ---
  play(name) {
    const c = this.ctx; if (!c || c.state !== 'running') return;
    const t = c.currentTime, P = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.7, 1318.5];
    switch (name) {
      case 'hit': this._noise(t, 0.09, 0.5, 900, 200, 0.8); this._osc('sine', 150, 55, t, 0.12, 0.5); break;
      case 'crit': this._noise(t, 0.12, 0.6, 1800, 300, 0.8); this._osc('sine', 190, 50, t, 0.16, 0.6); this._note(1568, t + 0.02, 0.18, 0.18, 'square'); break;
      case 'swing': this._noise(t, 0.14, 0.22, 500, 2400, 1.2); break;
      case 'hurt': this._osc('sawtooth', 220, 90, t, 0.18, 0.3); this._noise(t, 0.1, 0.25, 600, 200, 0.7); break;
      case 'kill': this._osc('triangle', 330, 70, t, 0.3, 0.35); this._noise(t, 0.2, 0.3, 700, 120, 0.6); break;
      case 'fire': this._noise(t, 0.35, 0.4, 300, 1800, 0.9); this._osc('sawtooth', 180, 520, t, 0.3, 0.14); break;
      case 'buff': [0, 2, 4].forEach((k, i) => this._note(P[k + 2], t + i * 0.06, 0.35, 0.16, 'sine')); this._noise(t, 0.3, 0.07, 3000, 6000, 3); break;
      case 'potion': this._osc('sine', 300, 700, t, 0.12, 0.25); this._osc('sine', 450, 900, t + 0.1, 0.12, 0.2); break;
      case 'cast': this._osc('sine', 260, 520, t, 0.5, 0.18); this._noise(t, 0.5, 0.08, 2000, 800, 2); break;
      case 'coin': this._note(1318.5, t, 0.12, 0.2, 'square'); this._note(1760, t + 0.07, 0.22, 0.2, 'square'); break;
      case 'gem': this._note(1568, t, 0.3, 0.2, 'sine'); this._note(2093, t + 0.08, 0.35, 0.16, 'sine'); break;
      case 'item': this._note(784, t, 0.18, 0.2, 'triangle'); this._note(1046.5, t + 0.08, 0.3, 0.2, 'triangle'); break;
      case 'equip': this._noise(t, 0.08, 0.35, 2500, 1200, 2); this._osc('triangle', 220, 160, t, 0.1, 0.25); break;
      case 'ui': this._noise(t, 0.03, 0.2, 3500, 2500, 3); break;
      case 'tab': this._note(880, t, 0.06, 0.1, 'sine'); break;
      case 'error': this._osc('square', 160, 120, t, 0.18, 0.15); break;
      case 'upgrade': [0, 2, 4, 5, 7].forEach((k, i) => this._note(P[k], t + i * 0.07, 0.4, 0.2, 'triangle')); break;
      case 'fail': this._osc('sawtooth', 260, 70, t, 0.45, 0.22); break;
      case 'quest': [0, 3, 4].forEach((k, i) => this._note(P[k], t + i * 0.1, 0.5, 0.2, 'sine')); break;
      case 'questdone': [0, 2, 3, 4, 6].forEach((k, i) => { this._note(P[k], t + i * 0.09, 0.6, 0.22, 'triangle'); this._note(P[k] / 2, t + i * 0.09, 0.6, 0.1, 'sine'); }); break;
      case 'levelup': [0, 2, 4, 5, 7, 6, 7].forEach((k, i) => { this._note(P[k], t + i * 0.1, 0.7, 0.24, 'triangle'); this._note(P[k] * 2, t + i * 0.1, 0.4, 0.08, 'sine'); }); break;
      case 'death': this._osc('sawtooth', 220, 40, t, 1.2, 0.3); this._noise(t, 0.9, 0.2, 500, 60, 0.6); break;
      case 'region': [2, 4].forEach((k, i) => this._note(P[k] / 2, t + i * 0.25, 1.2, 0.1, 'sine')); break;
      case 'step': this._noise(t, 0.05, 0.07, 700 + Math.random() * 300, 300, 0.7); break;
    }
  },

  // --- ortam: rüzgâr (+ gece cırcır böcekleri) ---
  _startWind() {
    const c = this.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; s.loop = true; fl.type = 'bandpass'; fl.frequency.value = 420; fl.Q.value = 0.6; g.gain.value = 0.0;
    s.connect(fl); fl.connect(g); g.connect(this.musicBus); s.start();
    this.wind = { fl, g };
  },

  // Her karede çağrılır
  update(dt, ctxInfo) {
    const c = this.ctx; if (!c || c.state !== 'running') return;
    const t = c.currentTime;
    this.mood = ctxInfo.combat ? 'combat' : (ctxInfo.night ? 'night' : 'day');
    // rüzgâr
    this._t.amb -= dt;
    if (this._t.amb <= 0) {
      this._t.amb = 2 + Math.random() * 3;
      const base = ctxInfo.inTown ? 0.012 : 0.035;
      this.wind.g.gain.linearRampToValueAtTime(base * (0.5 + Math.random()), t + 2.5);
      this.wind.fl.frequency.linearRampToValueAtTime(260 + Math.random() * 500, t + 2.5);
    }
    if (ctxInfo.night && !ctxInfo.combat && Math.random() < dt * 3) {          // cırcır böceği
      const f = 4200 + Math.random() * 600;
      for (let i = 0; i < 3; i++) this._osc('sine', f, f, t + i * 0.06, 0.04, 0.012, this.musicBus);
    }
    // müzik: yavaş pentatonik melodi
    this._t.music -= dt;
    if (this._t.music <= 0) {
      const beat = 60 / (this.mood === 'combat' ? 84 : 56);
      this._t.music = beat * (this.mood === 'night' ? 2 : 1);
      this._beat++;
      this._playMusicBeat(t);
    }
  },

  _playMusicBeat(t) {
    const scale = [0, 2, 4, 7, 9], root = 146.83;            // D majör pentatonik
    const night = this.mood === 'night', combat = this.mood === 'combat';
    const f = (deg, oct) => root * Math.pow(2, (scale[deg % 5] + 12 * (oct + Math.floor(deg / 5))) / 12);
    // bas / pad: iki ölçüde bir
    if (this._beat % 8 === 1) {
      const d = night ? 0 : [0, 3, 2, 4][(this._beat >> 3) % 4];
      this._osc('sine', f(d, 0) , f(d, 0), t, 5, 0.1, this.musicBus);
      this._osc('triangle', f(d, 0) * 1.5, f(d, 0) * 1.5, t, 4.5, 0.04, this.musicBus);
    }
    // melodi (pipa/guzheng benzeri tıngırtı)
    const p = combat ? 0.5 : night ? 0.7 : 0.55;
    if (Math.random() < p) {
      const deg = Math.floor(Math.random() * 7), oct = night ? 1 : 2;
      const fr = f(deg, oct), len = night ? 2.4 : 1.4;
      this._osc('triangle', fr, fr, t, len, 0.11, this.musicBus);
      this._osc('sine', fr * 2, fr * 2, t, len * 0.5, 0.035, this.musicBus);
      if (Math.random() < 0.25) { const fr2 = f(Math.floor(Math.random() * 5), oct + 1); this._osc('triangle', fr2, fr2, t + 0.25, 1.0, 0.07, this.musicBus); }
    }
    // savaşta hafif davul
    if (combat) {
      this._osc('sine', 110, 45, t, 0.25, 0.22, this.musicBus);
      if (this._beat % 2) this._noise(t, 0.06, 0.08, 1500, 800, 1, 'bandpass', this.musicBus);
    }
  }
};

// Sayfa ilk dokunuşunda sesi aç (iOS/Chrome otomatik oynatma kuralı)
['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, () => SFX.init(), { once: false, passive: true }));
