// NPC'ler: şehirde Tüccar, Demirci ve Muhafız Kaptanı (görev verici).
const NPC_RANGE = 5.5;   // bu mesafeden etkileşime girilir

const NPC_DEFS = [
  { id: 'merchant', name: 'Tüccar Ali',   title: 'Tüccar',  x: 5.5,  z: -4.5, robe: 0x2e6aa8, robeDark: 0x1c3f68, hat: 'straw' },
  { id: 'smith',    name: 'Demirci Wen',  title: 'Demirci', x: -6.5, z: -5.0, robe: 0x6a5a4a, robeDark: 0x33281e, hat: 'band' },
  { id: 'captain',  name: 'Kaptan Lee',   title: 'Şehir Muhafızı', x: -3.5, z: -21, robe: 0x8a1c1c, robeDark: 0x4a0e0e, hat: 'band' }
];

function makeMarkerTexture(ch, color) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  x.font = 'bold 54px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineWidth = 7; x.strokeStyle = '#2a1a00'; x.strokeText(ch, 32, 34);
  x.fillStyle = color; x.fillText(ch, 32, 34);
  return new THREE.CanvasTexture(c);
}

class NPCManager {
  constructor(world) {
    this.world = world;
    this.list = [];
    this.tex = { '!': makeMarkerTexture('!', '#ffd23a'), '?': makeMarkerTexture('?', '#7fe36a') };
    for (const def of NPC_DEFS) {
      const h = buildHumanoid({ robe: def.robe, robeDark: def.robeDark, hat: def.hat });
      const g = new THREE.Group();
      g.add(h.group);
      const y = terrainHeight(def.x, def.z);
      g.position.set(def.x, y, def.z);
      const label = makeLabel(def.name, def.title, '#ffe08a', '#a8f0a0');
      label.position.y = 3.3;
      g.add(label);
      const mk = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex['!'], transparent: true, depthTest: false }));
      mk.scale.set(1.5, 1.5, 1); mk.position.y = 4.6; mk.visible = false; mk.renderOrder = 10;
      g.add(mk);
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 3, 8), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = 1.5;
      g.add(hit);
      world.scene.add(g);
      const npc = { ...def, group: g, model: h, hit, marker: mk, mark: null, heading: Math.atan2(-def.x, -def.z), t: Math.random() * 6 };
      hit.userData.npc = npc;
      g.rotation.y = npc.heading;
      world.obstacles.push({ x: def.x, z: def.z, r: 0.9, type: 'npc' });
      this.list.push(npc);
    }
  }

  // Görev işaretleri: '!' görev alınabilir, '?' teslim edilecek
  refreshMarkers(quests) {
    for (const n of this.list) {
      const m = quests.markerFor(n.id);
      n.mark = m;
      n.marker.visible = !!m;
      if (m) n.marker.material.map = this.tex[m];
    }
  }

  pick(raycaster) {
    const hit = raycaster.intersectObjects(this.list.map(n => n.hit), false)[0];
    return hit ? hit.object.userData.npc : null;
  }

  update(dt, player) {
    for (const n of this.list) {
      n.t += dt;
      const dx = player.pos.x - n.x, dz = player.pos.z - n.z;
      // oyuncu yakındaysa ona dön
      if (Math.hypot(dx, dz) < 14) n.heading += angleDiff(n.heading, Math.atan2(dx, dz)) * Math.min(1, dt * 6);
      n.group.rotation.y = n.heading;
      if (n.marker.visible) n.marker.position.y = 4.6 + Math.sin(n.t * 3) * 0.18;
      // hafif nefes alma
      n.model.armL.rotation.x = Math.sin(n.t * 1.6) * 0.05;
      n.model.armR.rotation.x = -Math.sin(n.t * 1.6) * 0.05;
    }
  }
}
