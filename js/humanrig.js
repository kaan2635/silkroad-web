// Gerçekçi insan karakter (Quaternius, CC0): Modular Character Outfits – Fantasy kıyafetleri (köylü / korucu, erkek / kadın)
// + Universal Base Characters başları ve saçları + Universal Animation Library klipleri. buildHumanoid({ rig: true }) ile
// kurulan eski (prosedürel) gövde, modeller yüklenince bununla değiştirilir. Kıyafet dokusu ekipman rengine boyanır;
// zırh plakaları, cübbe eteği, miğfer, omuzluk gibi parçalar dinlenme pozunda hesaplanıp kemiklere takılır.

const HUMAN_H = 2.2;                 // oyundaki boy (eski gövdeyle aynı ölçek)
// Eski süper kahraman gövdesindeki kemik konumları: zırh parçalarının ölçüleri buna göre yazıldı, her şablona taşınır
const RIG_REF = { pelvis: [0, 0.949, -0.043], spine_01: [0, 1.072, -0.007], spine_02: [0, 1.178, 0.004], spine_03: [0, 1.311, 0.007], neck_01: [0, 1.52, -0.041], Head: [0, 1.6, -0.017],
  upperarm_l: [0.212, 1.455, -0.065], lowerarm_l: [0.463, 1.455, -0.073], hand_l: [0.706, 1.455, -0.065], upperarm_r: [-0.212, 1.455, -0.065], lowerarm_r: [-0.463, 1.455, -0.073], hand_r: [-0.706, 1.455, -0.065],
  thigh_l: [0.114, 0.971, -0.036], calf_l: [0.114, 0.542, -0.036], thigh_r: [-0.114, 0.971, -0.036], calf_r: [-0.114, 0.542, -0.036] };
const RIG_HAIR = { m: ['simpleparted', 'buzzed', 'buns', 'long'], f: ['long', 'buns', 'buzzedfemale'] };
const HumanRig = {
  ready: false, failed: false, T: {}, clips: {}, waiting: [], S: 1, src: {},

  load() {
    if (this._p) return this._p;
    if (!THREE.GLTFLoader || !THREE.SkeletonUtils) { this.failed = true; return (this._p = Promise.resolve(false)); }
    const L = new THREE.GLTFLoader(), D = 'assets/models/human/';
    const get = f => new Promise((res, rej) => L.load(D + f + '.glb', g => res([f, g]), undefined, rej));
    const files = ['anims', 'm_peasant', 'm_ranger', 'f_peasant', 'f_ranger', 'm_head', 'f_head', 'hair_beard', ...new Set([...RIG_HAIR.m, ...RIG_HAIR.f].map(h => 'hair_' + h))];
    this._p = Promise.all(files.map(get)).then(list => {
      for (const [f, g] of list) this.src[f] = g;
      for (const c of this.src.anims.animations) this.clips[c.name] = c;
      for (const v of ['m_peasant', 'm_ranger', 'f_peasant', 'f_ranger']) this.T[v] = this._template(v);
      this.ready = true;
      for (const f of this.waiting) { try { f(); } catch (e) { console.error(e); } }
      this.waiting = [];
      return true;
    }).catch(e => { console.warn('İnsan modeli yüklenemedi', e); this.failed = true; return false; });
    return this._p;
  },
  whenReady(f) { if (this.ready) f(); else if (!this.failed) this.waiting.push(f); },

  // Şablon: kıyafet iskeleti + baş + saçlar + sakal + etekler (hepsi aynı kemiklere bağlı)
  _template(v) {
    const sx = v[0], scene = THREE.SkeletonUtils.clone(this.src[v].scene), bones = {};
    scene.updateMatrixWorld(true);
    scene.traverse(o => { if (o.isBone) bones[o.name] = o; });
    let holder = null; scene.traverse(o => { if (o.isSkinnedMesh && !holder) holder = o.parent; });
    scene.traverse(o => {
      if (!o.isMesh) return;
      o.userData.part = /Hood/.test(o.name) ? 'hood' : /Pauldron/.test(o.name) ? 'pauldron' : 'outfit';
      if (/MI_Regular/.test(o.material.name)) o.userData.part = 'hands';
    });
    const graft = (src, part) => {
      src.updateMatrixWorld(true);
      const list = []; src.traverse(o => { if (o.isSkinnedMesh) list.push(o); });
      for (const sm of list) {
        const nb = sm.skeleton.bones.map(b => bones[b.name]);
        if (nb.some(b => !b)) continue;
        const m = new THREE.SkinnedMesh(sm.geometry, sm.material); m.name = sm.name;
        holder.add(m); m.bind(new THREE.Skeleton(nb, sm.skeleton.boneInverses), sm.bindMatrix);
        m.userData.part = part === 'head' ? (/Eye|Face|Brow/.test(sm.name) && !/Retopology|SuperHero|Superhero_/.test(sm.name) ? (/Eyes?$|Face$/.test(sm.name) ? 'eyes' : 'brows') : 'head') : part;
      }
    };
    graft(this.src[sx + '_head'].scene, 'head');
    for (const hs of RIG_HAIR[sx]) graft(this.src['hair_' + hs].scene, 'hair:' + hs);
    if (sx === 'm') graft(this.src.hair_beard.scene, 'beard');
    scene.updateMatrixWorld(true);
    const rest = {}; scene.traverse(o => { if (o.isBone) rest[o.name] = o.matrixWorld.clone(); });
    const T = { v, female: sx === 'f', scene, rest, holder };
    const rp = b => new THREE.Vector3().setFromMatrixPosition(rest[b]);
    // baş kutusu: baş ağının baş kemiğinden yukarısı
    const hb = new THREE.Box3(), hy = rp('neck_01').y + 0.04, tv = new THREE.Vector3();
    scene.traverse(o => { if (o.isSkinnedMesh && o.userData.part === 'head') { const P = o.geometry.attributes.position; for (let i = 0; i < P.count; i++) { tv.fromBufferAttribute(P, i).applyMatrix4(o.bindMatrix); if (tv.y > hy) hb.expandByPoint(tv); } } });
    T.head = { c: hb.getCenter(new THREE.Vector3()), s: hb.getSize(new THREE.Vector3()) };
    // eski ölçülerden bu şablona dönüşüm (genişlik ve boy oranı)
    const ref = n => new THREE.Vector3(...RIG_REF[n]);
    T.kx = Math.abs(rp('upperarm_l').x - rp('upperarm_r').x) / 0.424; T.ky = (rp('Head').y - rp('pelvis').y) / (1.6 - 0.949);
    T.kx = Math.min(1.05, Math.max(0.8, T.kx)); T.ky = Math.min(1.05, Math.max(0.85, T.ky)); T.kz = T.kx * 0.95;
    T.map = (b, x, y, z) => { const r = RIG_REF[b] ? ref(b) : null; if (!r) return new THREE.Vector3(x, y, z); const t = rp(b); return new THREE.Vector3(t.x + (x - r.x) * T.kx, t.y + (y - r.y) * T.ky, t.z + (z - r.z) * T.kz); };
    // etekler (kalça + uyluklar, yürürken salınır)
    const pel = rp('pelvis'), bl = ['pelvis', 'thigh_l', 'thigh_r'].map(n => bones[n]);
    const inv = bl.map(b => new THREE.Matrix4().copy(rest[b.name]).invert());
    const skirt = (len, r0, r1) => {
      const seg = 28, rows = 8, pos = [], si = [], sw = [], idx = [], uv = [], top = pel.y + 0.07;
      len *= T.ky; r0 *= T.kx; r1 *= T.kx;
      for (let j = 0; j <= rows; j++) {
        const t = j / rows, y = top - len * t, r = r0 + (r1 - r0) * Math.pow(t, 0.8);
        for (let i = 0; i <= seg; i++) {
          const a = i / seg * Math.PI * 2, sxx = Math.sin(a), cz = Math.cos(a);
          pos.push(sxx * r, y, cz * r * 0.82 + pel.z + 0.01); uv.push(i / seg * 4, t * 3);
          const k = Math.min(1, t * 1.15), wl = Math.max(0, sxx) * k * 0.9 + (cz > 0 ? cz * 0.3 * k : 0), wr = Math.max(0, -sxx) * k * 0.9 + (cz > 0 ? cz * 0.3 * k : 0);
          si.push(0, 1, 2, 0); sw.push(Math.max(0, 1 - wl - wr), wl, wr, 0);
        }
      }
      for (let j = 0; j < rows; j++) for (let i = 0; i < seg; i++) { const a = j * (seg + 1) + i, b2 = a + seg + 1; idx.push(a, b2, a + 1, a + 1, b2, b2 + 1); }
      const G = new THREE.BufferGeometry();
      G.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      G.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); G.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
      G.setIndex(idx); G.computeVertexNormals();
      const m = new THREE.SkinnedMesh(G, new THREE.MeshLambertMaterial({ color: 0x884433, side: THREE.DoubleSide }));
      scene.add(m); m.bind(new THREE.Skeleton(bl, inv), new THREE.Matrix4());
      return m;
    };
    for (const [k, a] of Object.entries({ long: [0.74, 0.2, 0.34], mid: [0.5, 0.19, 0.28], short: [0.3, 0.185, 0.23] })) skirt(...a).userData.part = 'skirt_' + k;
    // ekran dışı kırpma için sabit sınır küresi
    const bs = new THREE.Sphere(new THREE.Vector3(0, 0.95, 0), 1.25);
    scene.traverse(o => { if (o.isMesh) { o.geometry.boundingSphere = bs.clone(); o.castShadow = true; } });
    if (!this.Sset) { const box = new THREE.Box3().setFromObject(scene); this.S = HUMAN_H / Math.max(1.6, hb.max.y + 0.02); this.Sset = true; }
    // dokulardaki ortalama ten rengi
    const avg = map => {
      try {
        const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'); x.drawImage(map.image, 0, 0, 64, 64);
        const d = x.getImageData(0, 0, 64, 64).data; let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i] > 60 && d[i] > d[i + 1] + 8 && d[i + 1] > d[i + 2]) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
        return n ? new THREE.Color(r / n / 255, g / n / 255, b / n / 255) : null;
      } catch (e) { return null; }
    };
    scene.traverse(o => { if (o.isMesh && (o.userData.part === 'head' || o.userData.part === 'hands') && o.material.map && !o.material.userData.avg) o.material.userData.avg = avg(o.material.map); });
    return T;
  },

  // dinlenme pozundaki model uzayı → kemik yereli
  attach(rig, bone, obj, mat) {
    const B = rig.bones[bone], R = rig.T.rest[bone];
    if (!B || !R) return obj;
    const m = new THREE.Matrix4().copy(R).invert().multiply(mat);
    m.decompose(obj.position, obj.quaternion, obj.scale);
    B.add(obj);
    return obj;
  },
  restPos(b) { return new THREE.Vector3().setFromMatrixPosition(this._T.rest[b]); },

  // kıyafet malzemesi: dokunun açık yerleri gömlek, koyu yerleri pantolon rengine çekilir (desen korunur)
  _tintMat(src) {
    const map = src.map; if (map) map.encoding = THREE.LinearEncoding;
    const m = new THREE.MeshLambertMaterial({ map, skinning: true, side: THREE.DoubleSide });
    const U = m.userData.u = { uA: { value: new THREE.Color(1, 1, 1) }, uB: { value: new THREE.Color(1, 1, 1) }, uK: { value: 0 } };
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uA; uniform vec3 uB; uniform float uK;')
        .replace('#include <map_fragment>', `#include <map_fragment>
          float lum = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
          vec3 tint = mix(uB, uA, smoothstep(0.16, 0.42, lum));
          diffuseColor.rgb = mix(diffuseColor.rgb, clamp(lum * tint * 2.1, 0.0, 1.0), uK);`);
    };
    m.customProgramCacheKey = () => 'humantint';
    return m;
  },

  // Yeni karakter örneği. o: { v: 'm_peasant'.., hair, beard }
  make(o = {}) {
    const T = this.T[o.v] || this.T.m_peasant;
    const model = THREE.SkeletonUtils.clone(T.scene), bones = {}, parts = {};
    model.traverse(n => {
      if (n.isBone) bones[n.name] = n;
      if (!n.isMesh) return;
      const p = n.userData.part || 'outfit', s = n.material;
      (parts[p] = parts[p] || []).push(n);
      if (p === 'outfit' || p === 'hood' || p === 'pauldron') n.material = this._tintMat(s);
      else if (p.startsWith('skirt_')) n.material = s.clone();
      else {
        const map = s.map; if (map) map.encoding = THREE.LinearEncoding;
        const hair = p.startsWith('hair') || p === 'beard' || p === 'brows';
        n.material = new THREE.MeshLambertMaterial({ map, skinning: true, transparent: false, alphaTest: hair ? 0.35 : 0, side: hair ? THREE.DoubleSide : THREE.FrontSide });
        n.material.userData.avg = s.userData.avg;
        if (hair || p === 'eyes') n.castShadow = false;
      }
    });
    model.scale.setScalar(this.S);
    const root = new THREE.Group(); root.add(model);
    const rig = { root, model, bones, parts, T, v: T.v, mixer: new THREE.AnimationMixer(model), actions: {}, cur: null, outfit: [], S: this.S,
      U: { uShirt: { value: new THREE.Color() }, uPants: { value: new THREE.Color() }, uBoots: { value: new THREE.Color() }, uGlove: { value: new THREE.Color() }, uSkin: { value: new THREE.Color(1, 1, 1) }, uGloveOn: { value: 0 } } };
    this._T = T;
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
    this.setLook(rig, o);
    rig.play = (name, oo = {}) => this.play(rig, name, oo);
    rig.update = dt => rig.mixer.update(dt);
    return rig;
  },
  // saç / sakal / başlık görünürlüğü
  setLook(rig, o) {
    const P = rig.parts, hair = o.hair && P['hair:' + o.hair] ? o.hair : RIG_HAIR[rig.T.female ? 'f' : 'm'][0];
    for (const k in P) if (k.startsWith('hair:')) for (const m of P[k]) m.visible = !o.hideHair && k === 'hair:' + hair;
    for (const m of P.beard || []) m.visible = !!o.beard;
    for (const m of P.hood || []) m.visible = !!o.hood;
    for (const m of P.pauldron || []) m.visible = o.pauldron !== false;
    const hc = new THREE.Color(o.hairColor || 0x1a1410);
    for (const k of Object.keys(P).filter(k => k.startsWith('hair:') || k === 'beard' || k === 'brows')) for (const m of P[k]) m.material.color.copy(hc).multiplyScalar(1.6);
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
    if (!h.rig) return;
    // kıyafet türü: deri zırh → korucu, diğerleri → köylü kıyafeti (üstüne zırh / cübbe)
    const fem = !!h.female, at0 = c.ch && c.ch.b.atype;
    const want = (fem ? 'f_' : 'm_') + (at0 === 'protector' || (c.npc && c.npc.hat === 'hood') ? 'ranger' : 'peasant');
    if (h.rig.v !== want && this.T[want]) swapRig(h, want);
    const rig = h.rig;
    this._clearOutfit(rig); this._T = rig.T;
    const U = rig.U, TT = rig.T;
    const R = (b, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { const hd0 = b === 'Head'; return new THREE.Matrix4().compose(hd0 ? new THREE.Vector3(x, y, z) : TT.map(b, x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), hd0 ? new THREE.Vector3(sx, sy, sz) : new THREE.Vector3(sx * TT.kx, sy * TT.ky, sz * TT.kz)); };
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
    for (const k of ['head', 'hands']) for (const m of rig.parts[k] || []) { const av = m.material.userData.avg || new THREE.Color(0.85, 0.65, 0.5); m.material.color.copy(new THREE.Color(c.skin || 0xe8b98a)).multiply(new THREE.Color(1 / av.r, 1 / av.g, 1 / av.b)).multiplyScalar(0.95); }
    const H = TT.head, hc = H.c, hs = H.s;
    const covered = !!(hd || avH || (c.hat && !c.noHat && !['band', 'bun', 'straw'].includes(c.hat)));
    const style = c.hairStyle || (fem ? 'long' : c.race === 'eu' ? 'simpleparted' : 'buns');
    this.setLook(rig, { hair: style, hideHair: covered && !(avH && avH.b.look.kind === 'ears'), beard: !!c.beard, hairColor: c.hair, hood: !!(c.npc && c.npc.hat === 'hood' && !hd), pauldron: !!(sh || (ch && ch.b.atype === 'protector')) });
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
        U.uShirt.value.copy(M.color.clone().multiplyScalar(0.9));
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
    // kıyafet boyası
    const at = ch && ch.b.atype, k = avD || (c.npc && !(N && N.armor)) ? 0.7 : at === 'protector' ? 0.3 : at === 'garment' ? 0.72 : at === 'armor' ? 0.5 : 0.55;
    for (const p of ['outfit', 'hood', 'pauldron']) for (const m of rig.parts[p] || []) { const u = m.material.userData.u; u.uA.value.copy(U.uShirt.value); u.uB.value.copy(U.uPants.value); u.uK.value = k; }
    for (const m of rig.parts.hands || []) if (hn) m.material.color.copy(U.uGlove.value).multiplyScalar(1.3);
    for (const kk of ['long', 'mid', 'short']) for (const m of rig.parts['skirt_' + kk] || []) { m.visible = skirt === kk; if (skirt === kk) m.material.color.copy(skirtCol); }
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
    const rig = HumanRig.make({ v: (h.female ? 'f_' : 'm_') + 'peasant' });
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

// kıyafet türü değişince modeli değiştir (animasyon ve tutucular korunur)
function swapRig(h, v) {
  const old = h.rig, rig = HumanRig.make({ v });
  for (const [o, n] of [[old.handR, rig.handR], [old.handL, rig.handL]]) for (const c of o.children.slice()) n.add(c);
  const par = old.root.parent; if (par) { par.remove(old.root); par.add(rig.root); }
  rig.root.position.copy(old.root.position);
  if (CONFIG.isTouch && !h.isPlayer) rig.root.traverse(o => { if (o.isMesh) o.castShadow = false; });
  HumanRig.play(rig, old.curName || 'Idle_Loop', { fade: 0 });
  h.rig = rig;
}
