// Gerçekçi insan karakter: Quaternius Universal Base Characters (CC0) gövdesi + Universal Animation Library (CC0)
// klipleri. buildHumanoid({ rig: true }) ile kurulan eski (prosedürel) gövde, model yüklenince bununla değiştirilir.
// Giysi: gövde dokusu üzerine kemik ağırlıklarından çıkarılan bölge maskeleriyle (gömlek / pantolon / çizme / eldiven)
// renk boyanır; zırh, cübbe eteği, miğfer, omuzluk gibi parçalar dinlenme pozunda hesaplanıp kemiklere takılır.

const HUMAN_H = 2.2;                 // oyundaki boy (eski gövdeyle aynı ölçek)
const HumanRig = {
  ready: false, failed: false, src: null, clips: {}, rest: {}, waiting: [], S: 1,

  load() {
    if (this._p) return this._p;
    if (!THREE.GLTFLoader || !THREE.SkeletonUtils) { this.failed = true; return (this._p = Promise.resolve(false)); }
    const L = new THREE.GLTFLoader();
    const get = f => new Promise((res, rej) => L.load(f, res, undefined, rej));
    this._p = Promise.all([get('assets/models/human/male.glb'), get('assets/models/human/anims.glb')]).then(([body, an]) => {
      this._prep(body.scene);
      for (const c of an.animations) this.clips[c.name] = c;
      this.ready = true;
      for (const f of this.waiting) { try { f(); } catch (e) { console.error(e); } }
      this.waiting = [];
      return true;
    }).catch(e => { console.warn('İnsan modeli yüklenemedi', e); this.failed = true; return false; });
    return this._p;
  },
  whenReady(f) { if (this.ready) f(); else if (!this.failed) this.waiting.push(f); },

  _prep(scene) {
    this.src = scene;
    scene.updateMatrixWorld(true);
    let body = null;
    scene.traverse(o => {
      if (o.isBone || o.name === 'root') this.rest[o.name] = o.matrixWorld.clone();
      if (o.isSkinnedMesh && /SuperHero/i.test(o.name)) body = o;
    });
    const box = new THREE.Box3().setFromObject(scene);
    this.S = HUMAN_H / (box.max.y - box.min.y);
    // kemik → bölge (gömlek, pantolon, çizme, eldiven)
    const bones = body.skeleton.bones.map(b => b.name);
    const region = n => /^(spine|clavicle|upperarm|lowerarm)/.test(n) ? 0 : /^(pelvis|thigh|calf)/.test(n) ? 1 : /^(foot|ball)/.test(n) ? 2 : /^(hand|thumb|index|middle|ring|pinky)/.test(n) ? 3 : -1;
    const g = body.geometry, P = g.attributes.position, SI = g.attributes.skinIndex, SW = g.attributes.skinWeight;
    const cloth = new Float32Array(P.count * 4), head = new THREE.Box3(), v = new THREE.Vector3();
    const bm = body.bindMatrix;
    for (let i = 0; i < P.count; i++) {
      const w = [0, 0, 0, 0]; let headW = 0;
      const G = ['getX', 'getY', 'getZ', 'getW'];
      for (let k = 0; k < 4; k++) {
        const bi = SI[G[k]](i), wt = SW[G[k]](i); if (!wt) continue;
        const n = bones[bi], r = region(n);
        if (r >= 0) w[r] += wt;
        if (/^(Head|neck_01)$/.test(n)) headW += wt;
      }
      v.fromBufferAttribute(P, i).applyMatrix4(bm);
      // çizme baldırın alt yarısını da kaplar; pantolon oraya kadar
      if (v.y < 0.36 && w[1] > 0) { const f = Math.min(1, (0.36 - v.y) / 0.05); w[2] += w[1] * f; w[1] *= 1 - f; }
      // gömlek yakası boyna biraz taşar
      if (headW > 0.5 && v.y < 1.53) w[0] += 0.4;
      for (let k = 0; k < 4; k++) cloth[i * 4 + k] = Math.min(1, w[k]);
      if (headW > 0.85 && v.y > 1.55) head.expandByPoint(v);
    }
    g.setAttribute('cloth', new THREE.BufferAttribute(cloth, 4));
    this.head = { c: head.getCenter(new THREE.Vector3()), s: head.getSize(new THREE.Vector3()) };
    this.bones = bones;
    // giysi kabukları: gövde ağının bölge üçgenleri, normal boyunca şişirilmiş (aynı iskelete bağlı → doğal kırışır)
    const N = g.attributes.normal, I = g.index, UV = g.attributes.uv;
    const shell = (ch, off, th = 0.5, extra) => {
      const keep = [], map = new Map(), pos = [], nor = [], si = [], sw = [], uv = [];
      for (let t = 0; t < I.count; t += 3) {
        const a = I.getX(t), b2 = I.getX(t + 1), c = I.getX(t + 2);
        if (cloth[a * 4 + ch] < th || cloth[b2 * 4 + ch] < th || cloth[c * 4 + ch] < th) continue;
        for (const vi of [a, b2, c]) {
          let ni = map.get(vi);
          if (ni === undefined) {
            ni = map.size; map.set(vi, ni);
            v.fromBufferAttribute(P, vi); const n = new THREE.Vector3().fromBufferAttribute(N, vi);
            const o = typeof off === 'function' ? off(v, n) : off;
            pos.push(v.x + n.x * o, v.y + n.y * o, v.z + n.z * o); nor.push(n.x, n.y, n.z);
            for (let k = 0; k < 4; k++) { si.push(SI[['getX', 'getY', 'getZ', 'getW'][k]](vi)); sw.push(SW[['getX', 'getY', 'getZ', 'getW'][k]](vi)); }
            uv.push(UV ? UV.getX(vi) : 0, UV ? UV.getY(vi) : 0);
          }
          keep.push(ni);
        }
      }
      if (extra && extra.smooth) this._smooth(pos, keep, extra.smooth);
      const G = new THREE.BufferGeometry();
      G.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      G.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); G.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
      G.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); G.setIndex(keep);
      if (extra && extra.smooth) this._normals(G);
      return G;
    };
    // gövdede bol giysi: göğüs / karın daha çok, kollarda az
    const shirtOff = (p, n) => p.y > 1.0 && Math.abs(p.x) < 0.24 ? 0.016 + Math.max(0, 0.012 - Math.abs(p.y - 1.15) * 0.02) : 0.011;
    this.shell = { shirt: shell(0, shirtOff, 0.45, { smooth: 10 }), pants: shell(1, p => 0.015 + (p.y > 0.8 ? 0.005 : 0), 0.45, { smooth: 8 }), boots: shell(2, 0.02, 0.4, { smooth: 6 }), glove: shell(3, 0.006, 0.5) };
    // kabukların örttüğü gövde üçgenlerini at (görünmez; çizim yükünü yarıya indirir)
    {
      const th = [0.45, 0.45, 0.4], keep = [];
      for (let t = 0; t < I.count; t += 3) {
        const a = I.getX(t), b2 = I.getX(t + 1), c = I.getX(t + 2);
        let hid = false;
        for (let k = 0; k < 3 && !hid; k++) hid = cloth[a * 4 + k] >= th[k] && cloth[b2 * 4 + k] >= th[k] && cloth[c * 4 + k] >= th[k];
        if (!hid) keep.push(a, b2, c);
      }
      g.setIndex(keep);
    }
    // etek (kalçaya ve uyluklara ağırlıklı → yürürken bacaklarla salınır)
    const bi = n => bones.indexOf(n);
    this.skirt = (len, r0, r1) => {
      const seg = 28, rows = 8, pos = [], si = [], sw = [], idx = [], uv = [], top = 1.02, bot = top - len;
      for (let j = 0; j <= rows; j++) {
        const t = j / rows, y = top - len * t, r = r0 + (r1 - r0) * Math.pow(t, 0.8);
        for (let i = 0; i <= seg; i++) {
          const a = i / seg * Math.PI * 2, sx = Math.sin(a), cz = Math.cos(a);
          pos.push(sx * r, y, cz * r * 0.82 - 0.03); uv.push(i / seg * 4, t * 3);
          const k = Math.min(1, t * 1.15), wl = Math.max(0, sx) * k * 0.9 + (cz > 0 ? cz * 0.5 * k * 0.6 : 0), wr = Math.max(0, -sx) * k * 0.9 + (cz > 0 ? cz * 0.5 * k * 0.6 : 0);
          si.push(bi('pelvis'), bi('thigh_l'), bi('thigh_r'), 0); sw.push(Math.max(0, 1 - wl - wr), wl, wr, 0);
        }
      }
      for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) { const a = j * (seg + 1) + i, b2 = a + seg + 1; idx.push(a, b2, a + 1, a + 1, b2, b2 + 1); }
      const G = new THREE.BufferGeometry();
      G.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      G.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); G.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
      G.setIndex(idx); G.computeVertexNormals();
      return G;
    };
    this.skirts = { long: this.skirt(0.74, 0.19, 0.33), mid: this.skirt(0.5, 0.185, 0.27), short: this.skirt(0.3, 0.18, 0.22) };
    // animasyonda modelden pek taşmayan sabit sınır küresi → ekran dışı karakterler çizilmez
    const bs = new THREE.Sphere(new THREE.Vector3(0, 0.95, 0), 1.25);
    for (const G2 of [g, ...Object.values(this.shell), ...Object.values(this.skirts)]) G2.boundingSphere = bs.clone();
    scene.traverse(o => { if (o.isMesh && o.geometry !== g) o.geometry.boundingSphere = bs.clone(); });
    // dokudaki ortalama ten rengi (ten tonunu buna göre ölçekleriz)
    try {
      const im = body.material.map.image, cv = document.createElement('canvas'); cv.width = cv.height = 64;
      const x = cv.getContext('2d'); x.drawImage(im, 0, 0, 64, 64); const d = x.getImageData(0, 0, 64, 64).data;
      let r = 0, gg = 0, b3 = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] > 60 && d[i] > d[i + 1] + 8 && d[i + 1] > d[i + 2]) { r += d[i]; gg += d[i + 1]; b3 += d[i + 2]; n++; }
      if (n) this.skinAvg = new THREE.Color(r / n / 255, gg / n / 255, b3 / n / 255);
    } catch (e) { /* yok */ }
    // kumaş dokusu (dokuma + kıvrım gürültüsü)
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d');
    const id = x.createImageData(128, 128), rr = typeof mulberry32 === 'function' ? mulberry32(7) : Math.random;
    for (let yy = 0; yy < 128; yy++) for (let xx = 0; xx < 128; xx++) {
      const w = ((xx + yy) % 2 ? 0.97 : 1) * (0.95 + 0.05 * Math.sin(yy * 0.2 + Math.sin(xx * 0.1) * 2)) * (0.95 + rr() * 0.05);
      const k = (yy * 128 + xx) * 4, c = Math.round(255 * Math.min(1, w)); id.data[k] = id.data[k + 1] = id.data[k + 2] = c; id.data[k + 3] = 255;
    }
    x.putImageData(id, 0, 0);
    this.fabric = new THREE.CanvasTexture(cv); this.fabric.wrapS = this.fabric.wrapT = THREE.RepeatWrapping; this.fabric.repeat.set(3, 3);
  },

  // Taubin yumuşatma (kas detayını giderir, hacmi korur); aynı konumdaki dikiş köşeleri birlikte taşınır
  _groups(pos) {
    const key = new Map(), gid = new Int32Array(pos.length / 3); let n = 0;
    for (let i = 0; i < gid.length; i++) { const k = Math.round(pos[i * 3] * 1e4) + ',' + Math.round(pos[i * 3 + 1] * 1e4) + ',' + Math.round(pos[i * 3 + 2] * 1e4); let g = key.get(k); if (g === undefined) { g = n++; key.set(k, g); } gid[i] = g; }
    return { gid, n };
  },
  _smooth(pos, idx, iters) {
    const { gid, n } = this._groups(pos), P = new Float32Array(n * 3), cnt = new Uint16Array(n), nb = Array.from({ length: n }, () => new Set()), edge = new Map();
    for (let i = 0; i < gid.length; i++) { const g = gid[i]; if (!cnt[g]) { P[g * 3] = pos[i * 3]; P[g * 3 + 1] = pos[i * 3 + 1]; P[g * 3 + 2] = pos[i * 3 + 2]; } cnt[g]++; }
    for (let t = 0; t < idx.length; t += 3) for (let k = 0; k < 3; k++) {
      const a = gid[idx[t + k]], b = gid[idx[t + (k + 1) % 3]]; nb[a].add(b); nb[b].add(a);
      const e = a < b ? a + '_' + b : b + '_' + a; edge.set(e, (edge.get(e) || 0) + 1);
    }
    const fixed = new Uint8Array(n);
    for (const [e, c] of edge) if (c === 1) { const [a, b] = e.split('_'); fixed[+a] = fixed[+b] = 1; }
    const T = new Float32Array(n * 3);
    for (let it = 0; it < iters * 2; it++) {
      const f = it % 2 ? -0.53 : 0.5;
      for (let g = 0; g < n; g++) {
        if (fixed[g] || !nb[g].size) { T[g * 3] = P[g * 3]; T[g * 3 + 1] = P[g * 3 + 1]; T[g * 3 + 2] = P[g * 3 + 2]; continue; }
        let x = 0, y = 0, z = 0; for (const o of nb[g]) { x += P[o * 3]; y += P[o * 3 + 1]; z += P[o * 3 + 2]; }
        const k = nb[g].size; T[g * 3] = P[g * 3] + f * (x / k - P[g * 3]); T[g * 3 + 1] = P[g * 3 + 1] + f * (y / k - P[g * 3 + 1]); T[g * 3 + 2] = P[g * 3 + 2] + f * (z / k - P[g * 3 + 2]);
      }
      P.set(T);
    }
    for (let i = 0; i < gid.length; i++) { const g = gid[i]; pos[i * 3] = P[g * 3]; pos[i * 3 + 1] = P[g * 3 + 1]; pos[i * 3 + 2] = P[g * 3 + 2]; }
  },
  // dikişlerde kesintisiz normaller
  _normals(G) {
    G.computeVertexNormals();
    const p = G.attributes.position.array, nr = G.attributes.normal.array, { gid, n } = this._groups(p), acc = new Float32Array(n * 3);
    for (let i = 0; i < gid.length; i++) { const g = gid[i]; acc[g * 3] += nr[i * 3]; acc[g * 3 + 1] += nr[i * 3 + 1]; acc[g * 3 + 2] += nr[i * 3 + 2]; }
    for (let i = 0; i < gid.length; i++) { const g = gid[i], l = Math.hypot(acc[g * 3], acc[g * 3 + 1], acc[g * 3 + 2]) || 1; nr[i * 3] = acc[g * 3] / l; nr[i * 3 + 1] = acc[g * 3 + 1] / l; nr[i * 3 + 2] = acc[g * 3 + 2] / l; }
  },

  // dinlenme pozundaki model uzayı → kemik yereli
  attach(rig, bone, obj, mat) {
    const B = rig.bones[bone], R = this.rest[bone];
    if (!B || !R) return obj;
    const m = new THREE.Matrix4().copy(R).invert().multiply(mat);
    m.decompose(obj.position, obj.quaternion, obj.scale);
    B.add(obj);
    return obj;
  },
  restPos(b) { return new THREE.Vector3().setFromMatrixPosition(this.rest[b]); },

  _bodyMat(src) {
    const map = src.map; if (map) map.encoding = THREE.LinearEncoding;
    const m = new THREE.MeshLambertMaterial({ map, skinning: true });
    const U = m.userData.u = { uShirt: { value: new THREE.Color(0x8a3a2a) }, uPants: { value: new THREE.Color(0x3a2a20) }, uBoots: { value: new THREE.Color(0x2a1c12) }, uGlove: { value: new THREE.Color(0xe8b98a) }, uSkin: { value: new THREE.Color(1, 1, 1) }, uGloveOn: { value: 0 } };
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 cloth;\nvarying vec4 vCloth;\nvarying vec3 vRigPos;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCloth = cloth;\nvRigPos = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uShirt; uniform vec3 uPants; uniform vec3 uBoots; uniform vec3 uGlove; uniform vec3 uSkin; uniform float uGloveOn;\nvarying vec4 vCloth;\nvarying vec3 vRigPos;')
        .replace('#include <map_fragment>', `#include <map_fragment>
          float lum = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
          vec4 cw = vCloth; cw.w *= uGloveOn;
          float wsum = clamp(cw.x + cw.y + cw.z + cw.w, 0.0, 1.0);
          vec3 fab = (uShirt * cw.x + uPants * cw.y + uBoots * cw.z + uGlove * cw.w) / max(0.001, cw.x + cw.y + cw.z + cw.w);
          float weave = 0.94 + 0.06 * sin(vRigPos.y * 900.0) * sin(vRigPos.x * 700.0 + vRigPos.z * 500.0);
          float shade = clamp(0.62 + (lum - 0.55) * 1.1, 0.35, 1.15) * weave;
          diffuseColor.rgb = mix(diffuseColor.rgb * uSkin, fab * shade, wsum);`);
    };
    m.customProgramCacheKey = () => 'humanbody';
    return m;
  },

  // Yeni karakter örneği
  make() {
    const model = THREE.SkeletonUtils.clone(this.src), bones = {};
    let body = null;
    model.traverse(o => {
      if (o.isBone || o.name === 'root') bones[o.name] = o;
      if (o.isMesh) {
        o.castShadow = true;
        if (/SuperHero/i.test(o.name)) { body = o; o.material = this._bodyMat(o.material); }
        else {
          const s = o.material, map = s.map; if (map) map.encoding = THREE.LinearEncoding;
          o.material = new THREE.MeshLambertMaterial({ map, skinning: true, transparent: /Hair/.test(s.name), alphaTest: /Hair/.test(s.name) ? 0.3 : 0, side: THREE.DoubleSide });
          o.castShadow = false;
          if (/Hair/.test(s.name)) o.material.userData.brow = true;
        }
      }
    });
    model.scale.setScalar(this.S);
    const root = new THREE.Group(); root.add(model);
    const rig = { root, model, bones, body, U: body.material.userData.u, mixer: new THREE.AnimationMixer(model), actions: {}, cur: null, outfit: [], S: this.S, shells: {} };
    const mkShell = (geo, k) => {
      const m = new THREE.SkinnedMesh(geo, new THREE.MeshLambertMaterial({ color: 0x884433, map: this.fabric, skinning: true, side: k === 'skirt' ? THREE.DoubleSide : THREE.FrontSide }));
      m.bind(body.skeleton, body.bindMatrix); m.castShadow = true;
      body.parent.add(m); rig.shells[k] = m; return m;
    };
    for (const k in this.shell) mkShell(this.shell[k], k);
    for (const k in this.skirts) mkShell(this.skirts[k], 'skirt_' + k).visible = false;
    // silah / kalkan tutucular (eski el grubunun ekseni: y dirseğe doğru, z ileri)
    for (const side of ['r', 'l']) {
      const hp = this.restPos('hand_' + side), ep = this.restPos('lowerarm_' + side), mp = this.restPos('middle_01_' + side);
      const y = ep.clone().sub(hp).normalize(), z = new THREE.Vector3(0, 0, 1), x = new THREE.Vector3().crossVectors(y, z).normalize();
      z.crossVectors(x, y).normalize();
      const pos = hp.clone().lerp(mp, 0.62).add(new THREE.Vector3(0, -0.025, 0.01));
      const M = new THREE.Matrix4().makeBasis(x, y, z).setPosition(pos);
      const holder = new THREE.Group();
      this.attach(rig, 'hand_' + side, holder, M);
      holder.scale.multiplyScalar(1 / this.S);
      rig['hand' + side.toUpperCase()] = holder;
    }
    rig.play = (name, o = {}) => this.play(rig, name, o);
    rig.update = dt => rig.mixer.update(dt);
    return rig;
  },

  play(rig, name, o) {
    const clip = this.clips[name]; if (!clip) return null;
    let a = rig.actions[name];
    if (!a) { a = rig.actions[name] = rig.mixer.clipAction(clip); }
    a.timeScale = o.speed || 1;
    if (rig.cur === a && !o.restart) return a;
    const fade = o.fade === undefined ? 0.2 : o.fade;
    a.reset(); a.enabled = true; a.setEffectiveWeight(1);
    if (o.once) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } else a.setLoop(THREE.LoopRepeat, Infinity);
    if (rig.cur && rig.cur !== a) a.crossFadeFrom(rig.cur, fade, false);
    a.play();
    rig.cur = a; rig.curName = name;
    return a;
  },

  // ---------- Giydirme ----------
  _clearOutfit(rig) { for (const m of rig.outfit) m.parent && m.parent.remove(m); rig.outfit = []; },
  // c: { robe, robeDark, boots, gloves, skin, hair, beard, ch, lg, hd, sh, hn, ft, avD, avH, avA, dv, sealE, hat, noHat, cape }
  dress(h, c) {
    const rig = h.rig; if (!rig) return;
    this._clearOutfit(rig);
    const U = rig.U;
    const R = (b, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
    const add = (bone, geo, mat, M, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = shadow && (!CONFIG.isTouch || h.isPlayer); this.attach(rig, bone, m, M); rig.outfit.push(m); return m; };
    const cyl = (rt, rb, hh, seg = 16, open = false) => new THREE.CylinderGeometry(rt, rb, hh, seg, 1, open);
    const sph = (r, a = 14, b = 10, t0 = 0, tl = Math.PI) => new THREE.SphereGeometry(r, a, b, 0, 6.283, t0, tl);
    const lm = (col, em) => { const m = new THREE.MeshLambertMaterial({ color: col }); if (em) m.emissive = em; return m; };
    const robe = new THREE.Color(c.robe), dark = new THREE.Color(c.robeDark);
    const { ch, lg, hd, sh, hn, ft, avD, avH, avA, dv, sealE } = c;
    const gold = _metal(0xd8a830, null, 70);
    let skirt = null, skirtCol = null;
    // gövde boyası
    U.uShirt.value.copy(robe); U.uPants.value.copy(dark);
    U.uBoots.value.copy(ft ? armorMat(ft.b.atype, ft.b.d, ft.b.tier, null, true).color : new THREE.Color(0x2a1c12));
    U.uGloveOn.value = hn ? 1 : 0;
    if (hn) U.uGlove.value.copy(armorMat(hn.b.atype, hn.b.d, hn.b.tier, null, true).color);
    const av = this.skinAvg || new THREE.Color(0.91, 0.73, 0.54);
    U.uSkin.value.copy(new THREE.Color(c.skin || 0xe8b98a)).multiply(new THREE.Color(1 / av.r, 1 / av.g, 1 / av.b)).multiplyScalar(0.92);
    // saç (başlık yoksa)
    const H = this.head, hc = H.c, hs = H.s;
    const covered = !!(hd || avH || (c.hat && !c.noHat && c.hat !== 'band' && c.hat !== 'bun'));
    const hairM = lm(c.hair || 0x1a1410);
    if (!covered || (avH && avH.b.look.kind === 'ears')) {
      add('Head', sph(1, 16, 10, 0, 1.75), hairM, R('Head', hc.x, hc.y + hs.y * 0.08, hc.z - hs.z * 0.06, -0.25, 0, 0, hs.x * 0.56, hs.y * 0.6, hs.z * 0.6));
      if (c.race !== 'eu') {             // Çin: tepede topuz
        add('Head', sph(0.05, 10, 8), hairM, R('Head', hc.x, hc.y + hs.y * 0.55, hc.z - hs.z * 0.12));
        add('Head', cyl(0.018, 0.018, 0.13, 6), _metal(0xd8a830, null, 60), R('Head', hc.x, hc.y + hs.y * 0.55, hc.z - hs.z * 0.12, 0, 0, Math.PI / 2));
      } else add('Head', sph(1, 14, 8, 1.2, 1.2), hairM, R('Head', hc.x, hc.y - hs.y * 0.05, hc.z - hs.z * 0.12, 0, 0, 0, hs.x * 0.55, hs.y * 0.55, hs.z * 0.5));
    }
    if (c.beard) add('Head', new THREE.ConeGeometry(0.045, 0.12, 8), lm(c.beard), R('Head', hc.x, hc.y - hs.y * 0.52, hc.z + hs.z * 0.38, Math.PI + 0.35, 0, 0));
    // gövde parçaları (model uzayı, metre)
    const sp3 = this.restPos('spine_03'), sp1 = this.restPos('spine_01'), pel = this.restPos('pelvis');
    if (avD) {
      skirt = 'long'; skirtCol = new THREE.Color(avD.b.look.c1);
      add('spine_01', cyl(0.17, 0.17, 0.06), lm(avD.b.look.c3 || 0xffd23a), R('spine_01', 0, 1.02, 0, 0, 0, 0, 1, 1, 0.78));
      U.uShirt.value.set(avD.b.look.c1); U.uPants.value.set(avD.b.look.c2);
    } else if (ch) {
      const at = ch.b.atype, d = ch.b.d, M = armorMat(at, d, ch.b.tier, sealE(ch)), M2 = armorMat(at, d, 0, null, true);
      if (at === 'armor') {
        add('spine_03', cyl(0.205, 0.185, 0.36, 18), M, R('spine_03', 0, 1.3, 0.005, 0, 0, 0, 1, 1, 0.7));                    // göğüs plakası
        add('spine_02', cyl(0.18, 0.17, 0.16, 18), M2, R('spine_02', 0, 1.1, 0.0, 0, 0, 0, 1, 1, 0.72));                       // karın
        add('spine_03', new THREE.TorusGeometry(0.2, 0.012, 4, 22), d >= 4 ? gold : M2, R('spine_03', 0, 1.47, 0.0, Math.PI / 2, 0, 0, 1, 0.7, 1));
        add('spine_03', new THREE.TorusGeometry(0.19, 0.009, 4, 22), M2, R('spine_03', 0, 1.22, 0.003, Math.PI / 2, 0, 0, 1, 0.72, 1));
        for (let i = 0; i < 6; i++) {                                                                                            // bel plakaları (tasset)
          const a = (i / 6) * Math.PI * 2 + 0.26, sx = Math.sin(a), sz = Math.cos(a);
          const bone = i === 0 || i === 5 ? 'pelvis' : sx > 0 ? 'thigh_l' : 'thigh_r';
          add(bone, new THREE.BoxGeometry(0.12, 0.2, 0.018), M2, R(bone, sx * 0.19, 0.86, sz * 0.15 - 0.02, 0.2 * sz, a, -0.2 * sx));
        }
        if (d >= 6 && !ch.b.eu) add('spine_03', sph(0.035, 10, 8), gold, R('spine_03', 0, 1.33, 0.15));
        if (ch.b.eu) {
          const tab = new THREE.Color().setHSL(DEG_HUE[d - 1], 0.55, 0.32);
          add('spine_03', new THREE.BoxGeometry(0.24, 0.45, 0.012), lm(tab), R('spine_03', 0, 1.25, 0.15));
          add('pelvis', new THREE.BoxGeometry(0.22, 0.34, 0.012), lm(tab), R('pelvis', 0, 0.8, 0.15, 0.12));
          const cm = d >= 4 ? gold : lm(0xe8e0d0);
          add('spine_03', new THREE.BoxGeometry(0.035, 0.2, 0.01), cm, R('spine_03', 0, 1.3, 0.158)); add('spine_03', new THREE.BoxGeometry(0.13, 0.035, 0.01), cm, R('spine_03', 0, 1.34, 0.158));
        }
        U.uShirt.value.copy(robe.clone().multiplyScalar(0.8));
      } else if (at === 'protector') {
        add('spine_03', cyl(0.195, 0.18, 0.34, 18), M, R('spine_03', 0, 1.3, 0.0, 0, 0, 0, 1, 1, 0.7));
        skirt = 'short'; skirtCol = M.color.clone().multiplyScalar(0.85); U.uShirt.value.copy(M.color.clone().multiplyScalar(0.7));
        add('spine_03', new THREE.BoxGeometry(0.04, 0.46, 0.012), lm(0x2a1a0e), R('spine_03', 0, 1.28, 0.13, 0, 0, 0.62));
        for (let i = 0; i < 5; i++) add('spine_03', sph(0.012, 6, 4), _metal(d >= 4 ? 0xd8a830 : 0xb0b4bc, null, 60), R('spine_03', -0.12 + i * 0.06, 1.15 + i * 0.08 * 0.62 * 1.4 * 0.9, 0.135));
        add('spine_01', cyl(0.175, 0.17, 0.05), lm(0x2a1a0e), R('spine_01', 0, 1.0, 0, 0, 0, 0, 1, 1, 0.75));
        for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.4, sx = Math.sin(a), sz = Math.cos(a), bone = sx > 0.3 ? 'thigh_l' : sx < -0.3 ? 'thigh_r' : 'pelvis'; add(bone, new THREE.BoxGeometry(0.14, 0.17, 0.016), M2, R(bone, sx * 0.18, 0.88, sz * 0.14 - 0.02, 0.16 * sz, a, -0.16 * sx)); }
        if (ch.b.eu) for (const sx of [-1, 1]) add('pelvis', new THREE.BoxGeometry(0.07, 0.08, 0.05), lm(0x3a2412), R('pelvis', sx * 0.14, 0.95, 0.12));
      } else {
        // cübbe: gövdede renk, belden aşağı geniş etek, yaka şeritleri, kuşak
        U.uShirt.value.copy(M.color); U.uPants.value.copy(M.color.clone().multiplyScalar(0.8));
        const skirtM = M.clone(); skirtM.side = THREE.DoubleSide;
        skirt = 'long'; skirtCol = M.color.clone();
        for (const s of [-1, 1]) add('spine_03', new THREE.BoxGeometry(0.035, 0.32, 0.01), lm(robe.clone().multiplyScalar(0.55)), R('spine_03', s * 0.05, 1.36, 0.14, -0.08, 0, s * 0.42));
        add('spine_01', cyl(0.178, 0.172, 0.08), lm(d >= 4 ? 0xd8a830 : 0x2a1a10), R('spine_01', 0, 1.0, 0, 0, 0, 0, 1, 1, 0.75));
        for (const s of [-1, 1]) add('lowerarm_' + (s > 0 ? 'l' : 'r'), cyl(0.06, 0.1, 0.18, 12, true), skirtM, R('lowerarm_' + (s > 0 ? 'l' : 'r'), s * 0.62, 1.455, -0.07, 0, 0, Math.PI / 2));     // geniş yen
        if (ch.b.eu && !hd && !avH) add('Head', sph(1, 14, 10, 0, 1.9), skirtM, R('Head', hc.x, hc.y + hs.y * 0.05, hc.z - hs.z * 0.1, -0.35, 0, 0, hs.x * 0.66, hs.y * 0.7, hs.z * 0.72));
      }
    } else {
      // zırhsız: basit kumaş tunik + kuşak
      skirt = 'mid'; skirtCol = robe.clone();
      add('spine_01', cyl(0.176, 0.17, 0.06), lm(robe.clone().multiplyScalar(0.5)), R('spine_01', 0, 1.0, 0, 0, 0, 0, 1, 1, 0.75));
    }
    // NPC: uzun cübbe, kuşak, geniş yen, önlük, maske, zırh
    const N = c.npc;
    if (N) {
      skirt = 'long'; skirtCol = robe.clone(); U.uShirt.value.copy(robe); U.uPants.value.copy(dark);
      const sash = lm(N.sash || dark), dm = lm(dark);
      add('spine_01', cyl(0.18, 0.174, 0.09), sash, R('spine_01', 0, 1.0, 0, 0, 0, 0, 1, 1, 0.76));
      add('pelvis', new THREE.BoxGeometry(0.06, 0.32, 0.012), sash, R('pelvis', 0.05, 0.82, 0.15, 0.08));
      for (const s2 of [-1, 1]) add('spine_03', new THREE.BoxGeometry(0.035, 0.32, 0.01), dm, R('spine_03', s2 * 0.05, 1.36, 0.14, -0.08, 0, s2 * 0.42));
      const sl = lm(robe); sl.side = THREE.DoubleSide;
      for (const s2 of [-1, 1]) add('lowerarm_' + (s2 > 0 ? 'l' : 'r'), cyl(0.06, 0.11, 0.2, 12, true), sl, R('lowerarm_' + (s2 > 0 ? 'l' : 'r'), s2 * 0.62, 1.455, -0.07, 0, 0, Math.PI / 2));
      if (N.apron) add('pelvis', new THREE.BoxGeometry(0.3, 0.55, 0.012), lm(N.apron), R('pelvis', 0, 0.78, 0.17, 0.08));
      if (N.mask) add('Head', new THREE.BoxGeometry(hs.x * 1.05, hs.y * 0.3, hs.z * 0.6), lm(0x1a1a1a), R('Head', hc.x, hc.y - hs.y * 0.25, hc.z + hs.z * 0.25));
      if (N.armor) {
        const am = _metal(N.armor, null, 50);
        add('spine_03', cyl(0.205, 0.185, 0.36, 18), am, R('spine_03', 0, 1.3, 0.005, 0, 0, 0, 1, 1, 0.7));
        for (const s2 of ['l', 'r']) { const p = this.restPos('upperarm_' + s2), sx = s2 === 'l' ? 1 : -1; add('upperarm_' + s2, sph(0.11, 14, 7, 0, 1.6), am, R('upperarm_' + s2, p.x + sx * 0.04, p.y + 0.035, p.z, 0, 0, -sx * 0.35, 1.05, 0.72, 1)); }
        const cp = lm(dark); cp.side = THREE.DoubleSide;
        add('spine_03', new THREE.PlaneGeometry(0.42, 1.0, 1, 4), cp, R('spine_03', 0, 0.98, -0.17, 0.1, 0, 0));
      }
      if (N.basket) add('Head', cyl(0.15, 0.11, 0.15, 12), lm(0xb08a4a), R('Head', hc.x, hc.y + hs.y * 0.62, hc.z));
      if (N.sack) add('spine_03', sph(0.15, 10, 8), lm(0xc8b088), R('spine_03', -0.12, 1.45, -0.18, 0, 0, 0, 1, 0.8, 1.2));
    }
    // şapka / miğfer
    const top = hc.y + hs.y * 0.5;
    if (avH) {
      const k = avH.b.look.kind;
      if (k === 'crown') { add('Head', cyl(0.12, 0.1, 0.08, 10, true), lm(0xffd23a, new THREE.Color(0x3a2a00)), R('Head', hc.x, top + 0.01, hc.z)).material.side = THREE.DoubleSide; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; add('Head', new THREE.ConeGeometry(0.02, 0.06, 4), lm(0xffd23a), R('Head', hc.x + Math.sin(a) * 0.11, top + 0.07, hc.z + Math.cos(a) * 0.11)); } }
      else if (k === 'ears') for (const sx of [-1, 1]) add('Head', new THREE.ConeGeometry(0.04, 0.14, 4), lm(avH.b.look.c1), R('Head', hc.x + sx * 0.07, top + 0.04, hc.z, 0, 0, -sx * 0.25));
      else { add('Head', new THREE.ConeGeometry(0.32, 0.2, 18), lm(avH.b.look.c1), R('Head', hc.x, top + 0.07, hc.z)); add('Head', cyl(0.12, 0.12, 0.04, 14), lm(avH.b.look.c2 || 0xc0302a), R('Head', hc.x, top - 0.02, hc.z)); }
    } else if (hd) {
      const at = hd.b.atype, d = hd.b.d, M = armorMat(at, d, hd.b.tier, sealE(hd));
      const hr = Math.max(hs.x, hs.z) * 0.62;
      if (at === 'armor') {
        add('Head', sph(hr, 16, 10, 0, 1.3), M, R('Head', hc.x, hc.y + hs.y * 0.04, hc.z - 0.005, 0, 0, 0, 1, 1.05, 1.08));
        add('Head', new THREE.TorusGeometry(hr * 0.98, 0.009, 5, 22), d >= 4 ? gold : M, R('Head', hc.x, hc.y + hs.y * 0.12, hc.z, Math.PI / 2, 0, 0, 1, 1.08, 1));
        add('Head', new THREE.CylinderGeometry(hr, hr * 1.12, hs.y * 0.45, 16, 1, true, Math.PI * 0.55, Math.PI * 0.9), M, R('Head', hc.x, hc.y - hs.y * 0.12, hc.z - 0.01)).material.side = THREE.DoubleSide;
        add('Head', new THREE.BoxGeometry(0.016, 0.06, 0.02), M, R('Head', hc.x, hc.y + hs.y * 0.05, hc.z + hr * 1.05));
        if (hd.b.eu) add('Head', new THREE.BoxGeometry(0.02, 0.05, hr * 2), d >= 6 ? gold : M, R('Head', hc.x, top + 0.04, hc.z));
        else add('Head', new THREE.ConeGeometry(0.03, 0.15, 8), lm(d >= 6 ? 0xd8a830 : 0xb02a1a), R('Head', hc.x, top + 0.09, hc.z - 0.02, -0.3, 0, 0));
        if (d >= 8) for (const sx of [-1, 1]) add('Head', new THREE.ConeGeometry(0.02, 0.15, 6), lm(0xe8e0d0), R('Head', hc.x + sx * hr, top, hc.z, 0, 0, -sx * 0.7));
      } else if (at === 'protector') {
        add('Head', sph(hr, 16, 10, 0, 1.45), M, R('Head', hc.x, hc.y + hs.y * 0.03, hc.z - 0.01, 0, 0, 0, 1, 1.02, 1.08));
        add('Head', cyl(hr * 0.99, hr * 0.99, 0.025, 18), lm(0x2a1a0e), R('Head', hc.x, hc.y + hs.y * 0.12, hc.z, 0, 0, 0, 1, 1, 1.08));
        if (d >= 4) add('Head', sph(0.016, 6, 4), gold, R('Head', hc.x, hc.y + hs.y * 0.12, hc.z + hr * 1.08));
      } else {
        add('Head', cyl(hr * 0.75, hr * 0.92, hs.y * 0.4, 14), M, R('Head', hc.x, top + 0.02, hc.z - 0.01));
        add('Head', new THREE.BoxGeometry(0.025, hs.y * 0.9, 0.008), M, R('Head', hc.x, hc.y - 0.02, hc.z - hr * 1.02, 0.2, 0, 0));
        if (d >= 4) add('Head', new THREE.OctahedronGeometry(0.02), _metal(0x4ad8ff, null, 100), R('Head', hc.x, top + 0.03, hc.z + hr * 0.82));
      }
    } else if (c.hat && !c.noHat) {
      const hw = hs.x * 0.56, hk = c.hat, blk = lm(0x161616);
      if (hk === 'straw') add('Head', new THREE.ConeGeometry(0.34, 0.17, 18), lm(0xd8b66a), R('Head', hc.x, top + 0.03, hc.z));
      else if (hk === 'band') add('Head', cyl(hw, hw, 0.035, 14), lm(0xc0302a), R('Head', hc.x, hc.y + hs.y * 0.15, hc.z - 0.005, 0, 0, 0, 1, 1, 1.1));
      else if (hk === 'bun') add('Head', new THREE.BoxGeometry(0.13, 0.012, 0.012), lm(0xd9a92e), R('Head', hc.x, hc.y + hs.y * 0.55, hc.z - hs.z * 0.12));
      else if (hk === 'scholar') { add('Head', cyl(hw * 0.85, hw * 1.0, 0.09, 14), blk, R('Head', hc.x, top - 0.02, hc.z - 0.01, 0, 0, 0, 1, 1, 1.1)); add('Head', new THREE.BoxGeometry(0.03, 0.17, 0.008), blk, R('Head', hc.x, top - 0.08, hc.z - hs.z * 0.58, 0.2)); }
      else if (hk === 'official') { add('Head', new THREE.BoxGeometry(hw * 1.9, 0.1, hw * 2.0), blk, R('Head', hc.x, top - 0.01, hc.z - 0.01)); add('Head', new THREE.BoxGeometry(hw * 1.3, 0.07, hw * 1.2), blk, R('Head', hc.x, top + 0.07, hc.z - 0.03)); for (const sx of [-1, 1]) add('Head', new THREE.BoxGeometry(0.22, 0.012, 0.035), blk, R('Head', hc.x + sx * (hw + 0.1), top + 0.02, hc.z - 0.04)); }
      else if (hk === 'turban') { add('Head', new THREE.TorusGeometry(hw * 0.92, 0.04, 8, 18), lm(0xf0ead8), R('Head', hc.x, top - 0.02, hc.z, Math.PI / 2, 0, 0, 1, 1.1, 1)); add('Head', sph(hw * 0.95, 14, 8, 0, 1.6), lm(c.npc && c.npc.sash || 0x2a6a8a), R('Head', hc.x, top - 0.02, hc.z, 0, 0, 0, 1, 0.75, 1.1)); }
      else if (hk === 'helmet') { const am = _metal(c.npc && c.npc.armor || 0x8a8f98, null, 50); add('Head', sph(hw * 1.08, 16, 10, 0, 1.4), am, R('Head', hc.x, hc.y + hs.y * 0.05, hc.z, 0, 0, 0, 1, 1.05, 1.1)); add('Head', new THREE.ConeGeometry(0.025, 0.13, 6), lm(0xc0302a), R('Head', hc.x, top + 0.09, hc.z)); add('Head', new THREE.TorusGeometry(hw * 1.07, 0.012, 5, 20), lm(0xd9a92e), R('Head', hc.x, hc.y + hs.y * 0.08, hc.z, Math.PI / 2, 0, 0, 1, 1.1, 1)); }
      else if (hk === 'hood') { const hm = lm(robe); hm.side = THREE.DoubleSide; add('Head', sph(1, 14, 10, 0, 1.95), hm, R('Head', hc.x, hc.y + hs.y * 0.05, hc.z - hs.z * 0.1, -0.35, 0, 0, hs.x * 0.68, hs.y * 0.72, hs.z * 0.74)); }
    }
    // omuzluk
    if (sh && !avD) {
      const at = sh.b.atype, d = sh.b.d, M = armorMat(at, d, sh.b.tier, sealE(sh));
      for (const s of ['l', 'r']) {
        const sx = s === 'l' ? 1 : -1, b = 'upperarm_' + s, p = this.restPos(b);
        if (at === 'garment') { add(b, sph(0.1, 12, 6, 0, 1.4), M, R(b, p.x + sx * 0.03, p.y + 0.03, p.z, 0, 0, 0, 1.2, 0.6, 1)); continue; }
        add(b, sph(at === 'armor' ? 0.115 : 0.1, 14, 7, 0, 1.6), M, R(b, p.x + sx * 0.04, p.y + 0.035, p.z + 0.005, 0, 0, -sx * 0.35, 1.05, 0.72, 1));
        if (at === 'armor') add(b, sph(0.105, 14, 7, 0, 1.5), M, R(b, p.x + sx * 0.08, p.y - 0.015, p.z + 0.005, 0, 0, -sx * 0.6, 1, 0.6, 0.95));
        if (d >= 7 && at === 'armor') add(b, new THREE.ConeGeometry(0.025, 0.1, 6), _metal(0xe8e8e8, null, 90), R(b, p.x + sx * 0.08, p.y + 0.09, p.z, 0, 0, -sx * 0.4));
      }
    }
    // kolluk / eldiven
    if (hn) {
      const M = armorMat(hn.b.atype, hn.b.d, hn.b.tier, sealE(hn), hn.b.atype !== 'armor');
      for (const s of ['l', 'r']) { const sx = s === 'l' ? 1 : -1, a = this.restPos('lowerarm_' + s), e = this.restPos('hand_' + s); add('lowerarm_' + s, cyl(0.048, 0.056, 0.13, 12), M, R('lowerarm_' + s, a.x + (e.x - a.x) * 0.72, a.y, a.z, 0, 0, Math.PI / 2, 1, 1, 1.05)); }
    }
    // dizlik / baldırlık
    if (lg && lg.b.atype !== 'garment') {
      const M = armorMat(lg.b.atype, lg.b.d, lg.b.tier, sealE(lg));
      for (const s of ['l', 'r']) {
        const k = this.restPos('calf_' + s);
        add('calf_' + s, cyl(0.062, 0.052, 0.2, 12), M, R('calf_' + s, k.x, k.y - 0.17, k.z + 0.012, 0, 0, 0, 1, 1, 1.08));
        if (lg.b.atype === 'armor') add('calf_' + s, sph(0.045, 10, 8), M, R('calf_' + s, k.x, k.y, k.z + 0.06));
      }
      U.uPants.value.copy(armorColor(lg.b.atype, lg.b.d, lg.b.tier, true));
    }
    // çizme ağzı
    if (ft) {
      const M = armorMat(ft.b.atype, ft.b.d, ft.b.tier, sealE(ft), ft.b.atype !== 'armor');
      for (const s of ['l', 'r']) { const k = this.restPos('calf_' + s); add('calf_' + s, cyl(0.06, 0.055, 0.035, 12, true), M, R('calf_' + s, k.x, 0.36, k.z + 0.01, 0, 0, 0, 1, 1, 1.1)).material.side = THREE.DoubleSide; }
    }
    // pelerin (meslek / PvP)
    if (c.cape) {
      const cm = lm(c.cape); cm.side = THREE.DoubleSide;
      add('spine_03', new THREE.PlaneGeometry(0.42, 0.95, 1, 4), cm, R('spine_03', 0, 1.0, -0.17, 0.12, 0, 0));
    }
    // sırt süsü (avatar)
    if (avA) {
      const k = avA.b.look.kind;
      if (k === 'wings') for (const sx of [-1, 1]) add('spine_03', new THREE.BoxGeometry(0.03, 0.45, 0.6), new THREE.MeshLambertMaterial({ color: avA.b.look.c1, emissive: new THREE.Color(avA.b.look.c1).multiplyScalar(0.35), transparent: true, opacity: 0.85 }), R('spine_03', sx * 0.2, 1.4, -0.3, 0, sx * 0.6, sx * 0.3));
      else if (k === 'flag') { add('spine_03', new THREE.BoxGeometry(0.025, 1.1, 0.025), lm(0x5a3a1a), R('spine_03', 0, 1.55, -0.2)); add('spine_03', new THREE.BoxGeometry(0.015, 0.4, 0.3), lm(avA.b.look.c1), R('spine_03', 0, 1.9, -0.36)); }
      else add('spine_03', new THREE.TorusGeometry(0.28, 0.025, 6, 24), new THREE.MeshBasicMaterial({ color: avA.b.look.c1, transparent: true, opacity: 0.8 }), R('spine_03', 0, 1.2, -0.25), false);
    }
    // giysi kabukları
    const SH = rig.shells, leather = ch && ch.b.atype === 'protector';
    SH.shirt.material.color.copy(U.uShirt.value); SH.pants.material.color.copy(U.uPants.value); SH.boots.material.color.copy(U.uBoots.value);
    SH.glove.visible = !!hn; if (hn) SH.glove.material.color.copy(U.uGlove.value);
    SH.shirt.material.map = leather ? null : this.fabric; SH.shirt.material.needsUpdate = true;
    for (const k of ['long', 'mid', 'short']) { const m = SH['skirt_' + k]; m.visible = skirt === k; if (skirt === k) m.material.color.copy(skirtCol); }
    // Şeytan Ruhu
    if (dv && !avH) {
      const g = dv.b.look.g, hm = new THREE.MeshPhongMaterial({ color: g >= 3 ? 0x2a0a0a : 0x5a1010, emissive: g >= 3 ? 0x6a0a0a : 0x2a0404, shininess: 60 });
      for (const sx of [-1, 1]) add('Head', new THREE.ConeGeometry(0.025 + g * 0.004, 0.13 + g * 0.025, 7), hm, R('Head', hc.x + sx * 0.08, top + 0.03, hc.z, 0, 0, -sx * (0.45 + g * 0.05)));
    }
  }
};

// eski humanoid nesnesine gerçekçi modeli tak (yüklenince)
function upgradeHumanoid(h) {
  HumanRig.whenReady(() => {
    if (h.rig || h.disposed) return;
    const rig = HumanRig.make();
    h.rig = rig;
    // eski parçaları gizle; silah / kalkan tutucularını yeni ellere taşı
    for (const ch of h.group.children.slice()) ch.visible = false;
    for (const m of h.outfit || []) m.parent && m.parent.remove(m);
    h.outfit = [];
    for (const [old, holder, flip] of [[h.hand, rig.handR, false], [h.handL, rig.handL, true]]) {
      old.parent && old.parent.remove(old);
      old.position.set(0, 0, 0); old.rotation.set(0, flip ? Math.PI : 0, 0);
      holder.add(old);
    }
    h.group.add(rig.root);
    if (CONFIG.isTouch && !h.isPlayer) rig.root.traverse(o => { if (o.isMesh) o.castShadow = false; });   // telefonda yalnız oyuncu gölge düşürür
    rig.play('Idle_Loop', { fade: 0 });
    rig.mixer.update(Math.random() * 2);
    if (h.lastDress) HumanRig.dress(h, h.lastDress);
    else HumanRig.dress(h, { robe: h.robe.color.getHex(), robeDark: h.robeDark.color.getHex(), skin: h.skin.color.getHex(), hair: h.hairMat.color.getHex(), sealE: () => null, hat: h.hatKind, noHat: h.noHat });
    if (h.onRig) h.onRig(rig);
  });
}

// Oyuncu / yapay oyuncu için durumdan klip seçimi
// st: { dead, mounted, sitting, moving, speed, swing (yeni vuruş başladı mı), swingKind, combat, emote, wtype }
function rigAnimate(rig, st, dt) {
  let name = 'Idle_Loop', o = {}, sitY = 0;
  if (rig.atkLeft > 0) rig.atkLeft -= dt;
  if (st.swing && !st.dead) {
    // yeni vuruş: türüne göre klip, tek sefer
    const k = st.swingKind;
    const n = k === 'cast' ? 'Spell_Simple_Shoot' : k === 'bow' ? 'Pistol_Shoot' : k === 'thrust' ? 'Punch_Jab' : st.unarmed ? (Math.random() < 0.5 ? 'Punch_Jab' : 'Punch_Cross') : 'Sword_Attack';
    const dur = HumanRig.clips[n] ? HumanRig.clips[n].duration : 1;
    const speed = Math.max(1, dur / Math.max(0.35, st.atkLen || 0.75));
    rig.atkName = n; rig.atkLeft = dur / speed;
    HumanRig.play(rig, n, { once: true, fade: 0.08, restart: true, speed });
  } else if (st.dead) { name = 'Death01'; o = { once: true, fade: 0.15 }; }
  else if (st.mounted) name = 'Driving_Loop';
  else if (st.sitting) {
    sitY = -0.42;
    if (rig.curName === 'Sitting_Enter' && rig.cur.time < rig.cur.getClip().duration - 0.05) name = 'Sitting_Enter';
    else if (rig.curName === 'Sitting_Enter' || rig.curName === 'Sitting_Idle_Loop') name = 'Sitting_Idle_Loop';
    else { name = 'Sitting_Enter'; o = { once: true }; }
  }
  else if (rig.atkLeft > 0 && !st.moving) name = null;
  else if (st.moving) {
    const sp = st.speed || 1;
    if (st.walk) { name = 'Walk_Loop'; o = { speed: Math.max(0.8, Math.min(1.4, sp)) }; }
    else if (sp > 1.45) { name = 'Sprint_Loop'; o = { speed: Math.min(1.25, sp / 1.7) }; }
    else { name = 'Jog_Fwd_Loop'; o = { speed: Math.max(0.8, Math.min(1.4, sp)) }; }
  }
  else if (st.emote) {
    const E = { wave: 'Interact', dance: 'Dance_Loop', bow: 'PickUp_Table', cheer: 'Jump_Loop', no: 'Idle_Talking_Loop', cry: 'Crouch_Idle_Loop' };
    name = E[st.emote] || 'Idle_Talking_Loop';
  }
  else if (st.combat) name = st.wtype === 'bow' || st.wtype === 'xbow' ? 'Pistol_Aim_Neutral' : st.magic ? 'Spell_Simple_Idle_Loop' : st.unarmed ? 'Idle_Loop' : 'Sword_Idle';
  if (name) HumanRig.play(rig, name, o);
  rig.root.position.y += (sitY - rig.root.position.y) * Math.min(1, dt * 4);
  rig.mixer.update(dt);
}

// İnsan düşmanlar (haydutlar, şövalyeler, rahipler): gerçekçi model + türe göre teçhizat
const RIG_MOB_GEAR = {
  bandit: { at: 'protector', set: ['legs', 'feet', 'hands'], w: 'blade' }, dbandit: { at: 'protector', set: ['legs', 'feet', 'shoulder'], w: 'glaive' },
  ebandit: { at: 'protector', set: ['legs', 'feet', 'hands'], w: 'blade' }, abandit: { at: 'protector', set: ['legs', 'feet'], w: 'blade' },
  egbandit: { at: 'protector', set: ['chest', 'legs', 'feet'], w: 'blade' }, kthief: { at: 'protector', set: ['legs', 'feet', 'hands'], w: 'blade' },
  barcher: { at: 'protector', set: ['chest', 'legs', 'feet'], w: 'bow' }, hbandit: { at: 'protector', set: ['chest', 'legs', 'feet', 'shoulder'], w: 'spear' },
  sbandit: { at: 'protector', set: ['chest', 'legs', 'feet', 'shoulder', 'head'], w: 'spear' }, kguard: { at: 'armor', set: ['chest', 'legs', 'feet', 'shoulder', 'head', 'hands'], w: 'spear' },
  monk: { at: 'garment', set: ['chest', 'feet'], w: 'spear' }, ninja: { at: 'protector', set: ['legs', 'feet', 'hands', 'head'], w: 'blade' },
  gladiator: { at: 'heavy', set: ['chest', 'shoulder', 'legs', 'feet'], w: 'sword', race: 'eu', shield: true }, ewarrior: { at: 'heavy', set: ['chest', 'shoulder', 'legs', 'feet', 'head', 'hands'], w: 'sword', race: 'eu', shield: true },
  knightfallen: { at: 'heavy', set: ['chest', 'shoulder', 'legs', 'feet', 'head', 'hands'], w: 'tsword', race: 'eu' }, darkmage: { at: 'robe', set: ['chest', 'head', 'feet'], w: 'staff', race: 'eu' }
};
function rigMobEquip(gear, level) {
  const eq = {}, d0 = typeof degreeOf === 'function' ? degreeOf(level) : 1;
  for (const slot of gear.set || []) {
    for (let d = d0; d >= 1; d--) { const b = slot + '_' + gear.at + '_' + d; if (ITEM_BASES[b]) { eq[slot] = makeItem(b); break; } }
  }
  return eq;
}
