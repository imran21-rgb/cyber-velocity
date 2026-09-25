import * as THREE from 'three';

// Procedural Cyberpunk Metropolis with Dynamic Solar Daylight, Highway Circuit, Billboards & Boost Pads
export class CityBuilder {
  constructor(scene) {
    this.scene = scene;
    this.boostPads = [];
    this.colliders = [];
    this.animatedBillboards = [];
    this.trackWaypoints = [];
    this.rainParticles = null;
    this.sunGroup = null;
    this.towers = [];
    this.groundMesh = null;
  }

  buildEnvironment(weather = 'cyber-day') {
    const root = new THREE.Group();
    root.name = 'city-environment';

    // 1. SCI-FI CELESTIAL SUN & CORONA (For Daytime Metropolis)
    this.buildDaytimeSun(root);

    // 2. INFINITE CYBER GRID GROUND
    const gridHelper = new THREE.GridHelper(3000, 120, 0x00f3ff, 0x1f3455);
    gridHelper.position.y = -0.5;
    root.add(gridHelper);

    // Ground Reflective Plane
    const groundGeo = new THREE.PlaneGeometry(3500, 3500);
    this.groundMat = new THREE.MeshStandardMaterial({
      color: 0x0a1424,
      roughness: 0.18,
      metalness: 0.82
    });
    this.groundMesh = new THREE.Mesh(groundGeo, this.groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = -0.6;
    this.groundMesh.receiveShadow = true;
    root.add(this.groundMesh);

    // 3. HIGH-SPEED CYBER HIGHWAY CIRCUIT
    this.buildHighwayCircuit(root);

    // 4. DAYTIME METROPOLIS SKYSCRAPERS & MEGASPIRES
    this.buildSkyscrapers(root);

    // 5. FLOATING HOLOGRAPHIC BILLBOARDS
    this.buildHolographicBillboards(root);

    // 6. CYBER RAIN PARTICLE SYSTEM (Active during cyber-rain)
    this.buildRainSystem(root);

    this.scene.add(root);

    // Apply initial weather theme
    this.setWeather(weather);

    return root;
  }

  // Futuristic Solar Sun & Atmospheric Flare
  buildDaytimeSun(root) {
    this.sunGroup = new THREE.Group();
    this.sunGroup.position.set(280, 420, 280);

    // Central Sun Sphere
    const sunGeo = new THREE.SphereGeometry(28, 24, 24);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunGroup.add(sunMesh);

    // Glowing Corona Rings
    const coronaGeo = new THREE.RingGeometry(30, 85, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0x8be5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });
    const corona = new THREE.Mesh(coronaGeo, coronaMat);
    corona.lookAt(0, 0, 0);
    this.sunGroup.add(corona);

    root.add(this.sunGroup);
  }

  // Multi-Section Circuit with Loops, Straightaways, Banking, Overpasses, and Jump Ramps
  buildHighwayCircuit(root) {
    // Road Material with emissive cyber lane markings
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x161f30,
      roughness: 0.35,
      metalness: 0.65
    });

    const neonRailMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const neonRailMatPink = new THREE.MeshBasicMaterial({ color: 0xff0055 });
    const neonRailMatYellow = new THREE.MeshBasicMaterial({ color: 0xffe600 });

    // Define track path using smooth CatmullRomCurve3
    const curvePoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 350),
      new THREE.Vector3(120, 0, 600),
      new THREE.Vector3(380, 5, 750),
      new THREE.Vector3(650, 12, 600),     // Elevated section
      new THREE.Vector3(750, 20, 250),     // High flyover
      new THREE.Vector3(650, 15, -150),
      new THREE.Vector3(450, 6, -350),
      new THREE.Vector3(200, 2, -500),
      new THREE.Vector3(-150, 0, -550),
      new THREE.Vector3(-450, 0, -400),
      new THREE.Vector3(-650, 8, -150),    // Mountain loop
      new THREE.Vector3(-600, 14, 200),
      new THREE.Vector3(-400, 5, 450),
      new THREE.Vector3(-180, 0, 250)
    ];

    this.trackCurve = new THREE.CatmullRomCurve3(curvePoints, true);
    this.trackWaypoints = this.trackCurve.getPoints(120);

    // Generate Extruded Highway Ribbon
    const numPoints = 250;
    const points = this.trackCurve.getSpacedPoints(numPoints);
    const roadWidth = 24;

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const forward = new THREE.Vector3().subVectors(p2, p1).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const side = new THREE.Vector3().crossVectors(forward, up).normalize();

      const segLength = p1.distanceTo(p2);

      // Road Segment Box
      const segGeo = new THREE.BoxGeometry(roadWidth, 0.8, segLength * 1.02);
      const segMesh = new THREE.Mesh(segGeo, roadMat);

      // Center segment between p1 and p2
      const center = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      segMesh.position.copy(center);
      segMesh.position.y -= 0.4;
      segMesh.lookAt(p2);
      segMesh.receiveShadow = true;
      root.add(segMesh);

      // Glowing Highway Barrier Rails
      [-roadWidth / 2, roadWidth / 2].forEach((offset, idx) => {
        const railMat = (i % 40 < 20) ? neonRailMatCyan : neonRailMatPink;
        const railGeo = new THREE.BoxGeometry(0.55, 1.3, segLength * 1.02);
        const rail = new THREE.Mesh(railGeo, railMat);
        const rPos = center.clone().add(side.clone().multiplyScalar(offset));
        rPos.y += 0.45;
        rail.position.copy(rPos);
        rail.lookAt(p2.clone().add(side.clone().multiplyScalar(offset)));
        root.add(rail);

        // Track collider line
        if (i % 3 === 0) {
          this.colliders.push({
            pos: rPos,
            radius: 3.0,
            normal: side.clone().multiplyScalar(idx === 0 ? 1 : -1)
          });
        }
      });

      // Luminous Center Lane Dash Markers
      if (i % 2 === 0) {
        const dashGeo = new THREE.BoxGeometry(0.45, 0.06, segLength * 0.5);
        const dash = new THREE.Mesh(dashGeo, neonRailMatCyan);
        dash.position.copy(center);
        dash.position.y += 0.06;
        dash.lookAt(p2);
        root.add(dash);
      }

      // Highway Under-Pillars for elevated sections
      if (p1.y > 2.0 && i % 4 === 0) {
        const pillarHeight = p1.y + 1;
        const pillarGeo = new THREE.CylinderGeometry(1.6, 2.2, pillarHeight, 8);
        const pillar = new THREE.Mesh(pillarGeo, roadMat);
        pillar.position.set(p1.x, p1.y - pillarHeight / 2, p1.z);
        root.add(pillar);
      }

      // Overhead Cyber Gantry Arches
      if (i % 25 === 0) {
        this.buildGantryArch(root, center, side, p2, (i % 50 === 0) ? neonRailMatYellow : neonRailMatCyan);
      }

      // Speed Boost Pads along track
      if (i % 30 === 12) {
        this.buildBoostPad(root, center, side, p2);
      }

      // Jump Ramps
      if (i === 45 || i === 150) {
        this.buildJumpRamp(root, center, forward, side);
      }
    }
  }

  buildGantryArch(root, pos, side, target, mat) {
    const archGroup = new THREE.Group();
    archGroup.position.copy(pos);
    archGroup.position.y += 4.5;
    archGroup.lookAt(target);

    // Left & Right Pillars
    [-13, 13].forEach(x => {
      const pGeo = new THREE.BoxGeometry(0.8, 9, 0.8);
      const p = new THREE.Mesh(pGeo, mat);
      p.position.set(x, 0, 0);
      archGroup.add(p);
    });

    // Top Beam
    const topGeo = new THREE.BoxGeometry(26.8, 0.8, 0.8);
    const top = new THREE.Mesh(topGeo, mat);
    top.position.set(0, 4.5, 0);
    archGroup.add(top);

    // Holographic overhead speed sign
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 256;
    signCanvas.height = 64;
    const ctx = signCanvas.getContext('2d');
    ctx.fillStyle = '#0f1a30';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#00f3ff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPEED ZONE // ∞', 128, 44);

    const tex = new THREE.CanvasTexture(signCanvas);
    const signGeo = new THREE.PlaneGeometry(12, 3);
    const signMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 3.2, 0);
    archGroup.add(sign);

    root.add(archGroup);
  }

  buildBoostPad(root, pos, side, target) {
    const padGroup = new THREE.Group();
    padGroup.position.copy(pos);
    padGroup.position.y += 0.08;
    padGroup.lookAt(target);

    // Glowing Chevrons
    const padGeo = new THREE.PlaneGeometry(8, 14);
    padGeo.rotateX(-Math.PI / 2);

    const padCanvas = document.createElement('canvas');
    padCanvas.width = 128;
    padCanvas.height = 256;
    const ctx = padCanvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 128, 256);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 14;

    for (let y = 50; y < 240; y += 60) {
      ctx.beginPath();
      ctx.moveTo(20, y + 30);
      ctx.lineTo(64, y);
      ctx.lineTo(108, y + 30);
      ctx.stroke();
    }

    const padTex = new THREE.CanvasTexture(padCanvas);
    const padMat = new THREE.MeshBasicMaterial({ map: padTex, transparent: true, opacity: 0.95 });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padGroup.add(padMesh);

    // Boost Pad Point Light
    const padLight = new THREE.PointLight(0x00f3ff, 2.5, 12);
    padLight.position.set(0, 1.5, 0);
    padGroup.add(padLight);

    root.add(padGroup);

    this.boostPads.push({
      position: pos.clone(),
      radius: 7.0,
      light: padLight
    });
  }

  buildJumpRamp(root, pos, forward, side) {
    const rampGeo = new THREE.BoxGeometry(16, 1.8, 14);
    const rampMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.8, roughness: 0.2 });
    const ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.position.copy(pos);
    ramp.position.y += 0.5;
    ramp.lookAt(pos.clone().add(forward));
    ramp.rotation.x -= 0.15;
    root.add(ramp);
  }

  // Futuristic Metropolis Skyscraper Skyline
  buildSkyscrapers(root) {
    const towerAccentColors = [0x00f3ff, 0xff0055, 0x00ff88, 0xffaa00, 0x0099ff];

    // High-tech architectural palette: daytime reflective glass & titanium alloys
    const buildingMaterials = [
      new THREE.MeshStandardMaterial({ color: 0xdde6f0, roughness: 0.15, metalness: 0.85 }), // White Platinum
      new THREE.MeshStandardMaterial({ color: 0x1a2e4c, roughness: 0.1, metalness: 0.9 }),  // Azure Glass
      new THREE.MeshStandardMaterial({ color: 0x48586d, roughness: 0.2, metalness: 0.8 }),  // Titanium Grey
      new THREE.MeshStandardMaterial({ color: 0x0e1b2e, roughness: 0.12, metalness: 0.92 })  // Deep Obsidian Glass
    ];

    const towerCount = 95;
    for (let i = 0; i < towerCount; i++) {
      const angle = (i / towerCount) * Math.PI * 2 + Math.random() * 0.12;
      const radius = 220 + Math.random() * 560;

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const width = 28 + Math.random() * 48;
      const depth = 28 + Math.random() * 48;
      const height = 130 + Math.random() * 340;

      const mat = buildingMaterials[i % buildingMaterials.length];
      const towerGeo = new THREE.BoxGeometry(width, height, depth);
      const tower = new THREE.Mesh(towerGeo, mat);
      tower.position.set(x, height / 2, z);
      tower.castShadow = true;
      tower.receiveShadow = true;
      root.add(tower);
      this.towers.push(tower);

      // Daytime solar spire beacon
      const beaconColor = towerAccentColors[i % towerAccentColors.length];
      const antennaGeo = new THREE.CylinderGeometry(0.35, 0.7, 28, 6);
      const antennaMat = new THREE.MeshBasicMaterial({ color: beaconColor });
      const antenna = new THREE.Mesh(antennaGeo, antennaMat);
      antenna.position.set(x, height + 14, z);
      root.add(antenna);

      // Vertical aerodynamic neon architectural fin
      const edgeGeo = new THREE.BoxGeometry(1.2, height, 1.2);
      const edgeMesh = new THREE.Mesh(edgeGeo, antennaMat);
      edgeMesh.position.set(x + width / 2, height / 2, z + depth / 2);
      root.add(edgeMesh);
    }
  }

  // Floating Cyber Hologram Billboards
  buildHolographicBillboards(root) {
    const ads = [
      { text: 'CYBER VELOCITY', sub: 'HYPER-DRIVE 2099', color: '#00d4ff' },
      { text: 'ARASAKA NEURAL', sub: 'SYNAPTIC ACCELERATION', color: '#ff0055' },
      { text: 'SOLAR DYNAMICS', sub: 'CLEAN QUANTUM POWER', color: '#ffb700' },
      { text: 'NEO-TOKYO GT', sub: 'DAYTIME APEX LEAGUE', color: '#00ff88' },
      { text: 'SPACEX PROPULSION', sub: 'COLD-GAS THRUST', color: '#0088ff' }
    ];

    const billboardPositions = [
      new THREE.Vector3(60, 55, 180),
      new THREE.Vector3(420, 65, 480),
      new THREE.Vector3(600, 75, -50),
      new THREE.Vector3(0, 50, -420),
      new THREE.Vector3(-450, 60, 100)
    ];

    billboardPositions.forEach((pos, idx) => {
      const ad = ads[idx % ads.length];
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      // Daytime semi-translucent glass backing
      ctx.fillStyle = 'rgba(12, 24, 48, 0.88)';
      ctx.fillRect(0, 0, 512, 256);

      ctx.strokeStyle = ad.color;
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, 492, 236);

      ctx.fillStyle = ad.color;
      ctx.font = '900 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ad.text, 256, 110);

      ctx.fillStyle = '#ffffff';
      ctx.font = '600 24px sans-serif';
      ctx.fillText(ad.sub, 256, 165);

      const tex = new THREE.CanvasTexture(canvas);
      const bMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide
      });
      const bGeo = new THREE.PlaneGeometry(60, 30);
      const billboard = new THREE.Mesh(bGeo, bMat);
      billboard.position.copy(pos);
      billboard.lookAt(0, pos.y, 0);

      root.add(billboard);

      this.animatedBillboards.push({
        mesh: billboard,
        baseY: pos.y,
        offset: idx
      });
    });
  }

  buildRainSystem(root) {
    const rainCount = 4000;
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 800;
      positions[i * 3 + 1] = Math.random() * 200;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 800;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x00f3ff,
      size: 0.6,
      transparent: true,
      opacity: 0.0
    });

    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    root.add(this.rainParticles);
  }

  update(delta, time, carPos) {
    // Animate floating billboards
    this.animatedBillboards.forEach(b => {
      b.mesh.position.y = b.baseY + Math.sin(time * 1.5 + b.offset) * 2.5;
    });

    // Animate rain if active
    if (this.rainParticles && this.rainParticles.material.opacity > 0.05) {
      const positions = this.rainParticles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 250 * delta;
        if (positions[i + 1] < 0) {
          positions[i + 1] = 180;
          positions[i] = carPos.x + (Math.random() - 0.5) * 400;
          positions[i + 2] = carPos.z + (Math.random() - 0.5) * 400;
        }
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }
  }

  setWeather(weatherType) {
    if (this.sunGroup) {
      this.sunGroup.visible = (weatherType === 'cyber-day');
    }

    if (this.rainParticles) {
      this.rainParticles.material.opacity = (weatherType === 'cyber-rain') ? 0.65 : 0.0;
    }

    if (this.groundMat) {
      if (weatherType === 'cyber-day') {
        this.groundMat.color.set(0x0e1c30);
        this.groundMat.roughness = 0.22;
      } else {
        this.groundMat.color.set(0x03060f);
        this.groundMat.roughness = 0.15;
      }
    }
  }
}
