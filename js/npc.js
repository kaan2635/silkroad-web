// NPC'ler: şehir kapısının yanında Tüccar ve Demirci.
const NPC_RANGE = 5.5;   // bu mesafeden etkileşime girilir

const NPC_DEFS = [
  { id: 'merchant', name: 'Tüccar Ali',   title: 'Tüccar',  x: 5.5,  z: -4.5, robe: 0x2e6aa8, robeDark: 0x1c3f68, hat: 'straw' },
  { id: 'smith',    name: 'Demirci Wen',  title: 'Demirci', x: -6.5, z: -5.0, robe: 0x6a5a4a, robeDark: 0x33281e, hat: 'band' }
];

class NPCManager {
  constructor(world) {
    this.world = world;
    this.list = [];
    for (const def of NPC_DEFS) {
      const h = buildHumanoid({ robe: def.robe, robeDark: def.robeDark, hat: def.hat });
      const g = new THREE.Group();
      g.add(h.group);
      const y = terrainHeight(def.x, def.z);
      g.position.set(def.x, y, def.z);
      const label = makeLabel(def.name, def.title, '#ffe08a', '#a8f0a0');
      label.position.y = 3.3;
      g.add(label);
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 3, 8), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.y = 1.5;
      g.add(hit);
      world.scene.add(g);
      const npc = { ...def, group: g, model: h, hit, heading: Math.atan2(-def.x, -def.z), t: Math.random() * 6 };
      hit.userData.npc = npc;
      g.rotation.y = npc.heading;
      world.obstacles.push({ x: def.x, z: def.z, r: 0.9, type: 'npc' });
      this.list.push(npc);
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
      // hafif nefes alma
      n.model.armL.rotation.x = Math.sin(n.t * 1.6) * 0.05;
      n.model.armR.rotation.x = -Math.sin(n.t * 1.6) * 0.05;
    }
  }
}
