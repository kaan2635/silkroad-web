// Varlık yükleyici: js/assetpack.js içindeki (base64) Kenney CC0 glb modellerini çözer,
// her modeli tek geometriye birleştirir. Dokulu modeller kit başına tek ortak materyal,
// dokusuz modeller (Doğa kiti) köşe rengi kullanır — böylece InstancedMesh ile ucuz çizilir.
// Yükleme başarısız olursa Assets.has(...) false döner ve dünya prosedürel yedeğe düşer.

const ASSET_COLORS = {   // dokusuz (Doğa kiti) materyal adı → renk
  grass: 0x8f9a5a, leafsGreen: 0x5f9a3c, woodBark: 0x7a5a36, woodBarkDark: 0x57402a, wood: 0xa87a48, woodDark: 0x6a4a2a,
  woodInner: 0xc89a62, stone: 0xa09483, stoneDark: 0x6e6458, dirt: 0x9a7a52, colorRed: 0xa8281e, _defaultMat: 0x9a8f80, Water: 0x3aa0c8,
  leafsDark: 0x3f6a2c, colorYellow: 0xe0b020
};

const Assets = {
  ready: false, failed: 0, entries: {}, texByKit: {}, matTex: {}, matVC: null, scenes: {},

  has(key) { return !!this.entries[key]; },
  parts(key) { return this.entries[key] || null; },

  load(onProgress) {
    if (typeof ASSET_PACK === 'undefined' || !THREE.GLTFLoader) return Promise.resolve(false);
    const manager = new THREE.LoadingManager();
    manager.setURLModifier(url => {
      const m = /^(.*?)\/?Textures\/colormap\.png$/.exec(url);
      return m && ASSET_PACK.textures[m[1]] ? ASSET_PACK.textures[m[1]] : url;
    });
    const loader = new THREE.GLTFLoader(manager);
    const keys = Object.keys(ASSET_PACK.models);
    this.matVC = new THREE.MeshLambertMaterial({ vertexColors: true });
    let done = 0;
    const tick = () => { done++; if (onProgress) onProgress(done / keys.length); };

    const jobs = keys.map(key => new Promise(resolve => {
      const kit = key.split('/')[0];
      const bin = atob(ASSET_PACK.models[key]);
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      try {
        loader.parse(buf.buffer, kit + '/', gltf => {
          try {
            if (key.includes('/character-')) this.scenes[key] = this._prepChar(gltf.scene, kit);
            else this.entries[key] = this._bake(gltf.scene, kit);
          } catch (e) { this.failed++; }
          tick(); resolve();
        }, () => { this.failed++; tick(); resolve(); });
      } catch (e) { this.failed++; tick(); resolve(); }
    }));
    return Promise.all(jobs).then(() => { this.ready = Object.keys(this.entries).length > 0; return this.ready; });
  },

  // Sahneyi (dünya matrisleriyle) iki geometriye indirger: dokulu ve köşe renkli
  _bake(root, kit) {
    root.updateMatrixWorld(true);
    const tex = { pos: [], nor: [], uv: [], idx: [], base: 0 };
    const col = { pos: [], nor: [], col: [], idx: [], base: 0 };
    const c = new THREE.Color();
    let texMap = null;
    root.traverse(o => {
      if (!o.isMesh) return;
      const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      const groups = g.groups && g.groups.length ? g.groups : [{ start: 0, count: g.index ? g.index.count : g.attributes.position.count, materialIndex: 0 }];
      const P = g.attributes.position, N = g.attributes.normal, UV = g.attributes.uv, I = g.index;
      for (const gr of groups) {
        const m = mats[gr.materialIndex] || mats[0];
        const isTex = !!m.map;
        const dst = isTex ? tex : col;
        if (isTex && !texMap) texMap = m.map;
        if (!isTex) {
          c.set(ASSET_COLORS[m.name] !== undefined ? ASSET_COLORS[m.name] : 0x9a8f80);
        }
        const remap = new Map();
        for (let k = gr.start; k < gr.start + gr.count; k++) {
          const vi = I ? I.getX(k) : k;
          let ni = remap.get(vi);
          if (ni === undefined) {
            ni = dst.base++; remap.set(vi, ni);
            dst.pos.push(P.getX(vi), P.getY(vi), P.getZ(vi));
            dst.nor.push(N ? N.getX(vi) : 0, N ? N.getY(vi) : 1, N ? N.getZ(vi) : 0);
            if (isTex) dst.uv.push(UV ? UV.getX(vi) : 0, UV ? UV.getY(vi) : 0);
            else dst.col.push(c.r, c.g, c.b);
          }
          dst.idx.push(ni);
        }
      }
    });
    const parts = [];
    const mk = (d, withUV) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(d.pos, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(d.nor, 3));
      if (withUV) geo.setAttribute('uv', new THREE.Float32BufferAttribute(d.uv, 2));
      else geo.setAttribute('color', new THREE.Float32BufferAttribute(d.col, 3));
      geo.setIndex(d.idx);
      geo.computeBoundingSphere();
      return geo;
    };
    if (tex.base) parts.push({ geo: mk(tex, true), mat: this._texMat(kit, texMap) });
    if (col.base) parts.push({ geo: mk(col, false), mat: this.matVC });
    const box = new THREE.Box3();
    for (const p of parts) { p.geo.computeBoundingBox(); box.union(p.geo.boundingBox); }
    parts.size = box.getSize(new THREE.Vector3());
    return parts;
  },

  // Hareketli karakter (parçalı düğümler: bacak / kol / gövde / kafa): sahne korunur, materyaller Lambert'e çevrilir
  _prepChar(root, kit) {
    root.traverse(o => {
      if (!o.isMesh) return;
      const m = o.material;
      if (m.map) { m.map.encoding = THREE.LinearEncoding; m.map.needsUpdate = true; }
      o.material = new THREE.MeshLambertMaterial({ map: m.map || null, color: m.map ? 0xffffff : (m.color ? m.color.getHex() : 0xcccccc), transparent: m.transparent, opacity: m.opacity });
      o.castShadow = true;
    });
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    root.userData.h = box.max.y - box.min.y || 1;
    return root;
  },
  hasChar(key) { return !!this.scenes[key]; },
  // Klon: { group, legL, legR, armL, armR, head, torso } — h: hedef boy
  charModel(key, h, tint) {
    const src = this.scenes[key];
    const s = src.clone(true);
    s.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); if (tint) o.material.color.setHex(tint); } });
    const g = new THREE.Group(); g.add(s);
    s.scale.setScalar(h / src.userData.h);
    const f = n => s.getObjectByName(n) || null;
    return { group: g, legL: f('leg-left'), legR: f('leg-right'), armL: f('arm-left'), armR: f('arm-right'), head: f('head'), torso: f('torso') };
  },

  // Kit başına tek ortak doku/materyal. Eski renk uzayında (gama) çalıştığımız için çözme yapılmaz.
  _texMat(kit, map) {
    if (!this.matTex[kit]) {
      if (map) {
        map.encoding = THREE.LinearEncoding;
        map.generateMipmaps = false; map.minFilter = THREE.LinearFilter; map.magFilter = THREE.LinearFilter;
        map.needsUpdate = true;
      }
      this.matTex[kit] = new THREE.MeshLambertMaterial({ map, side: THREE.DoubleSide });
      this.texByKit[kit] = map;
    }
    return this.matTex[kit];
  }
};

// --- World yardımcıları ---
// Bir modelin çok sayıda kopyasını tek çizimde ekler. m: _matrix(...) listesi
World.prototype._inst = function (key, mats, shadow = true) {
  const parts = Assets.parts(key);
  if (!parts || !mats.length) return null;
  return parts.map(p => this._instanced(p.geo, p.mat, mats, shadow));
};

// Tek bir model (Group) — NPC yanı dekor, çeşme vb.
World.prototype._place = function (key, x, z, scale, ry = 0, y = null, shadow = true) {
  const parts = Assets.parts(key);
  if (!parts) return null;
  const g = new THREE.Group();
  for (const p of parts) { const m = new THREE.Mesh(p.geo, p.mat); m.castShadow = shadow; m.receiveShadow = true; g.add(m); }
  g.position.set(x, y === null ? terrainHeight(x, z) : y, z);
  g.rotation.y = ry; g.scale.setScalar(scale);
  this.scene.add(g);
  return g;
};
