// Silkroad tarzı kamera: karakteri yörüngede takip eder.
// Sağ tık (veya sol sürükle) = döndür, tekerlek = yakınlaştır, Q/E = döndür.
class CameraRig {
  constructor(camera, input) {
    this.camera = camera;
    this.input = input;
    this.yaw = 0.5;
    this.pitch = CONFIG.camera.pitch;
    this.distance = CONFIG.camera.distance;
    this.smoothDistance = this.distance;
    this.focus = new THREE.Vector3(0, 1.8, 0);
  }

  update(dt, playerPos, orbit) {
    const c = CONFIG.camera, inp = this.input;
    const look = inp.consumeLook();
    const wheel = inp.consumeWheel();

    if (orbit) {
      this.yaw += dt * 0.08;          // menüde yavaş dönen kamera
    } else {
      this.yaw -= look.dx * c.rotateSpeed;
      this.pitch = clamp(this.pitch + look.dy * c.rotateSpeed, c.minPitch, c.maxPitch);
      if (inp.isDown('KeyQ')) this.yaw += dt * 1.8;
      if (inp.isDown('KeyE')) this.yaw -= dt * 1.8;
      this.distance = clamp(this.distance + wheel * c.zoomSpeed, c.minDistance, c.maxDistance);
    }
    this.smoothDistance += (this.distance - this.smoothDistance) * Math.min(1, dt * 10);

    const want = new THREE.Vector3(playerPos.x, playerPos.y + 1.8, playerPos.z);
    this.focus.lerp(want, 1 - Math.exp(-dt * 14));

    // Arazi kamerayı kapatıyorsa (vadi/kum tepesi) mesafeyi kısalt
    let d = this.smoothDistance;
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch), sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
    for (let i = 1; i <= 10; i++) {
      const t = i / 10, px = this.focus.x + sy * cp * d * t, pz = this.focus.z + cy * cp * d * t, py = this.focus.y + sp * d * t;
      if (py < terrainHeight(px, pz) + 0.7) { d = Math.max(3.5, d * (i - 1) / 10); break; }
    }
    this._occ = d;
    const cam = this.camera;
    cam.position.set(
      this.focus.x + Math.sin(this.yaw) * cp * d,
      this.focus.y + Math.sin(this.pitch) * d,
      this.focus.z + Math.cos(this.yaw) * cp * d
    );
    // Kamera zeminin altına girmesin
    const minY = terrainHeight(cam.position.x, cam.position.z) + 1.0;
    if (cam.position.y < minY) cam.position.y = minY;
    cam.lookAt(this.focus);
  }
}
