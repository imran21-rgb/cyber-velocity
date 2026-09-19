import * as THREE from 'three';

// Procedural Cyberpunk Metropolis, Elevated Highway System, Neon Billboards, and Boost Pads
export class CityBuilder {
  constructor(scene) {
    this.scene = scene;
    this.boostPads = [];
    this.colliders = [];
    this.animatedBillboards = [];
    this.trackWaypoints = [];
    this.rainParticles = null;
  }

  buildEnvironment(weather = 'neon-night') {
    const root = new THREE.Group();
    root.name = 'city-environment';

    // 1. INFINITE CYBER GRID GROUND
    const gridHelper = new THREE.GridHelper(2500, 100, 0x00f3ff, 0x151c33);
    gridHelper.position.y = -0.5;
    root.add(gridHelper);

    // Dark Ground Reflective Plane
    const groundGeo = new THREE.PlaneGeometry(3000, 3000);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x03060f,
      roughness: 0.15,
      metalness: 0.85
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.6;
    ground.receiveShadow = true;
    root.add(ground);

    // 2. HIGH-SPEED CYBER HIGHWAY CIRCUIT
    this.buildHighwayCircuit(root);

    // 3. CYBERPUNK SKYSCRAPERS & TOWERS
    this.buildSkyscrapers(root);

    // 4. FLOATING HOLOGRAPHIC BILLBOARDS
    this.buildHolographicBillboards(root);

    // 5. CYBER RAIN PARTICLE SYSTEM (Active during cyber-rain)
    this.buildRainSystem(root);

    this.scene.add(root);
    return root;
  }

  // Multi-Section Circuit with Loops, Straightaways, Banking, Overpasses, and Jump Ramps
  buildHighwayCircuit(root) {
    // Road Material with emissive cyber lane markings
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x0d111a,
      roughness: 0.4,
      metalness: 0.6
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
      segMesh.position.y -= 0.4; // place top surface at p1.y
      segMesh.lookAt(p2);
      segMesh.receiveShadow = true;
      root.add(segMesh);

      // Glowing Neon Barrier Rails
      [-roadWidth / 2, roadWidth / 2].forEach((offset, idx) => {
        const railMat = (i % 40 < 20) ? neonRailMatCyan : neonRailMatPink;
        const railGeo = new THREE.BoxGeometry(0.5, 1.2, segLength * 1.02);
        const rail = new THREE.Mesh(railGeo, railMat);
        const rPos = center.clone().add(side.clone().multiplyScalar(offset));
        rPos.y += 0.4;
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
        const dashGeo = new THREE.BoxGeometry(0.4, 0.05, segLength * 0.5);
        const dash = new THREE.Mesh(dashGeo, neonRailMatCyan);
        dash.position.copy(center);
        dash.position.y += 0.05;
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
    ctx.fillStyle = '#0a0e1c';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#00f3ff';
    ctx.font = 'bold 30px sans-serif';
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
    const padMat = new THREE.MeshBasicMaterial({ map: padTex, transparent: true, opacity: 0.9 });
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
    ramp.rotation.x -= 0.15; // incline
    root.add(ramp);
  }

  // Cyberpunk Monolith Skyscrapers
  buildSkyscrapers(root) {
    const towerColors = [0x00f3ff, 0xff0055, 0x9d00ff, 0xffaa00];

    const towerCount = 90;
    for (let i = 0; i < towerCount; i++) {
      const angle = (i / towerCount) * Math.PI * 2 + Math.random() * 0.1;
      const radius = 220 + Math.random() * 550;

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const width = 25 + Math.random() * 45;
      const depth = 25 + Math.random() * 45;
      const height = 120 + Math.random() * 320;

      const towerMat = new THREE.MeshStandardMaterial({
        color: 0x080c16,
        roughness: 0.2,
        metalness: 0.85
      });

      const towerGeo = new THREE.BoxGeometry(width, height, depth);
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(x, height / 2, z);
      root.add(tower);

      // Glowing rooftop beacon / antenna
      const beaconColor = towerColors[i % towerColors.length];
      const antennaGeo = new THREE.CylinderGeometry(0.3, 0.6, 25, 6);
      const antennaMat = new THREE.MeshBasicMaterial({ color: beaconColor });
      const antenna = new THREE.Mesh(antennaGeo, antennaMat);
      antenna.position.set(x, height + 12.5, z);
      root.add(antenna);

      // Vertical neon strip along tower edge
      const edgeGeo = new THREE.BoxGeometry(1.0, height, 1.0);
      const edgeMesh = new THREE.Mesh(edgeGeo, antennaMat);
      edgeMesh.position.set(x + width / 2, height / 2, z + depth / 2);
      root.add(edgeMesh);
    }
  }

  // Floating Cyber Hologram Billboards
  buildHolographicBillboards(root) {
    const ads = [
      { text: 'CYBER VELOCITY', sub: 'HYPER-DRIVE 2099', color: '#00f3ff' },
      { text: 'ARASAKA NEURAL', sub: 'SYNAPTIC ACCELERATION', color: '#ff0055' },
      { text: 'QUANTUM GRAVITY', sub: 'ZERO DRAG DYNAMICS', color: '#ffe600' },
      { text: 'NEO-TOKYO GT', sub: 'CIRCUIT APEX LEAGUE', color: '#00ff66' },
      { text: 'SPACEX PROPULSION', sub: 'COLD-GAS THRUST', color: '#9d00ff' }
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

      // Transparent holographic background with grid
      ctx.fillStyle = 'rgba(6, 12, 28, 0.85)';
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
        opacity: 0.85,
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
      opacity: 0.0 // hidden by default, enabled when weather is 'cyber-rain'
    });

    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    root.add(this.rainParticles);
  }

  update(delta, time, carPos) {
    // Animate floating billboards gently bobbing
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
    if (!this.rainParticles) return;
    if (weatherType === 'cyber-rain') {
      this.rainParticles.material.opacity = 0.65;
    } else {
      this.rainParticles.material.opacity = 0.0;
    }
  }
}
