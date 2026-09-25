import * as THREE from 'three';

// Open-World Vibrant Colorful Cyberpunk Metropolis (No Restricted Tracks/Roads)
export class CityBuilder {
  constructor(scene) {
    this.scene = scene;
    this.boostPads = [];
    this.colliders = [];
    this.animatedBillboards = [];
    this.buildingFootprints = [];
    this.skyBeams = [];
    this.rainParticles = null;
    this.sunGroup = null;
    this.groundMat = null;
  }

  buildEnvironment(weather = 'cyber-day') {
    const root = new THREE.Group();
    root.name = 'city-environment';

    // 1. CELESTIAL SUN & CORONA
    this.buildDaytimeSun(root);

    // 2. OPEN BOUNDLESS CITY FLOOR & COLORFUL DISTRICT GRIDS
    this.buildOpenCityGround(root);

    // 3. COLORFUL SKYSCRAPERS & MEGAPLASAS (Multi-District Color Palette)
    this.buildColorfulSkyscrapers(root);

    // 4. VERTICAL SKY-BEAMS / SEARCHLIGHT PILLARS
    this.buildSkyBeams(root);

    // 5. COLORFUL FLOATING HOLOGRAPHIC BILLBOARDS
    this.buildColorfulBillboards(root);

    // 6. FREEROAM STUNT JUMP RAMPS & SPEED BOOST PADS
    this.buildStuntParkElements(root);

    // 7. RAIN PARTICLES
    this.buildRainSystem(root);

    this.scene.add(root);

    this.setWeather(weather);

    return root;
  }

  buildDaytimeSun(root) {
    this.sunGroup = new THREE.Group();
    this.sunGroup.position.set(280, 420, 280);

    const sunGeo = new THREE.SphereGeometry(30, 24, 24);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunGroup.add(sunMesh);

    const coronaGeo = new THREE.RingGeometry(32, 95, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0x9be8ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const corona = new THREE.Mesh(coronaGeo, coronaMat);
    corona.lookAt(0, 0, 0);
    this.sunGroup.add(corona);

    root.add(this.sunGroup);
  }

  // Boundless open driving surface with colorful neon sector markings & grand plaza
  buildOpenCityGround(root) {
    // 1. Massive Ground Plane (4000 x 4000)
    const groundGeo = new THREE.PlaneGeometry(4200, 4200);
    this.groundMat = new THREE.MeshStandardMaterial({
      color: 0x0a1322,
      roughness: 0.2,
      metalness: 0.75
    });
    const ground = new THREE.Mesh(groundGeo, this.groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    root.add(ground);

    // 2. Central Grand Plaza with Concentric Neon Rings
    const ringRadii = [40, 80, 130, 190, 260];
    const ringColors = [0x00f3ff, 0xff0055, 0xffe600, 0x00ff88, 0x9d00ff];

    ringRadii.forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r - 0.7, r + 0.7, 64);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: ringColors[idx % ringColors.length],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.02;
      root.add(ring);
    });

    // 3. Multi-Colored Open Avenue Grid Lines (Spanning miles)
    const gridExtent = 1600;
    const spacing = 120; // 120m wide avenues between building blocks!

    for (let pos = -gridExtent; pos <= gridExtent; pos += spacing) {
      if (pos === 0) continue;
      const colIdx = Math.abs(Math.floor(pos / spacing)) % ringColors.length;
      const color = ringColors[colIdx];
      const lineMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45 });

      // X-direction neon lane marker
      const lineXGeo = new THREE.PlaneGeometry(gridExtent * 2, 0.8);
      lineXGeo.rotateX(-Math.PI / 2);
      const lineX = new THREE.Mesh(lineXGeo, lineMat);
      lineX.position.set(0, 0.03, pos);
      root.add(lineX);

      // Z-direction neon lane marker
      const lineZGeo = new THREE.PlaneGeometry(0.8, gridExtent * 2);
      lineZGeo.rotateX(-Math.PI / 2);
      const lineZ = new THREE.Mesh(lineZGeo, lineMat);
      lineZ.position.set(pos, 0.03, 0);
      root.add(lineZ);
    }
  }

  // 110+ Vibrant Colorful Skyscraper Towers in distinct colorful cyber districts
  buildColorfulSkyscrapers(root) {
    const districts = [
      { name: 'Cyan Sector', color: 0x00f3ff, wallColor: 0x0a243a, emissive: 0x0088cc },
      { name: 'Magenta District', color: 0xff0055, wallColor: 0x330a1a, emissive: 0xcc0044 },
      { name: 'Amber Solar Core', color: 0xffaa00, wallColor: 0x33220a, emissive: 0xcc7700 },
      { name: 'Acid Lime Hub', color: 0x00ff66, wallColor: 0x0a2e18, emissive: 0x00bb44 },
      { name: 'Hyper Violet Sector', color: 0x9d00ff, wallColor: 0x240a38, emissive: 0x7700cc },
      { name: 'Electric Coral', color: 0xff5500, wallColor: 0x30150a, emissive: 0xcc3300 },
      { name: 'Platinum Azure', color: 0x00d4ff, wallColor: 0xdde9f5, emissive: 0x0099dd }
    ];

    // City Grid layout with wide open boulevards (buildings placed with clearance)
    const buildingCoords = [];
    const minRadiusFromCenter = 85; // Leave central Grand Plaza wide open for stunts and high speed!

    for (let gx = -7; gx <= 7; gx++) {
      for (let gz = -7; gz <= 7; gz++) {
        if (gx === 0 && gz === 0) continue; // Grand Plaza

        const x = gx * 125 + (Math.sin(gx * 3 + gz) * 15);
        const z = gz * 125 + (Math.cos(gz * 3 + gx) * 15);

        const distCenter = Math.hypot(x, z);
        if (distCenter < minRadiusFromCenter) continue;

        buildingCoords.push({ x, z, gx, gz });
      }
    }

    buildingCoords.forEach((coord, idx) => {
      const district = districts[idx % districts.length];

      const width = 36 + Math.random() * 32;
      const depth = 36 + Math.random() * 32;
      const height = 120 + Math.random() * 340;

      // Colorful Building Body Material
      const bodyMat = new THREE.MeshStandardMaterial({
        color: district.wallColor,
        roughness: 0.18,
        metalness: 0.85
      });

      const towerGeo = new THREE.BoxGeometry(width, height, depth);
      const tower = new THREE.Mesh(towerGeo, bodyMat);
      tower.position.set(coord.x, height / 2, coord.z);
      tower.castShadow = true;
      tower.receiveShadow = true;
      root.add(tower);

      // Glowing Colorful Trim / Neon Edge Lines
      const trimMat = new THREE.MeshBasicMaterial({ color: district.color });

      // Rooftop Glowing Crown
      const crownGeo = new THREE.BoxGeometry(width + 2, 3.5, depth + 2);
      const crown = new THREE.Mesh(crownGeo, trimMat);
      crown.position.set(coord.x, height + 1.75, coord.z);
      root.add(crown);

      // Vertical Corner Light Strips
      [[-width / 2, -depth / 2], [width / 2, -depth / 2], [-width / 2, depth / 2], [width / 2, depth / 2]].forEach(([cx, cz]) => {
        const stripGeo = new THREE.BoxGeometry(1.2, height, 1.2);
        const strip = new THREE.Mesh(stripGeo, trimMat);
        strip.position.set(coord.x + cx, height / 2, coord.z + cz);
        root.add(strip);
      });

      // Rooftop Colorful Antenna Spire
      const antennaGeo = new THREE.CylinderGeometry(0.3, 0.8, 30, 6);
      const antenna = new THREE.Mesh(antennaGeo, trimMat);
      antenna.position.set(coord.x, height + 15, coord.z);
      root.add(antenna);

      // Register Building Collider for realistic free-roam car deflection
      this.colliders.push({
        isBox: true,
        x: coord.x,
        z: coord.z,
        hw: width / 2,
        hd: depth / 2
      });

      // Footprint for Radar Map
      this.buildingFootprints.push({
        x: coord.x,
        z: coord.z,
        w: width,
        d: depth,
        color: district.color
      });
    });
  }

  // Glowing vertical searchlight pillars shooting into the sky
  buildSkyBeams(root) {
    const beamPositions = [
      { x: 180, z: 180, color: 0x00f3ff },
      { x: -180, z: 180, color: 0xff0055 },
      { x: 180, z: -180, color: 0xffe600 },
      { x: -180, z: -180, color: 0x00ff88 },
      { x: 380, z: 0, color: 0x9d00ff },
      { x: -380, z: 0, color: 0xff5500 }
    ];

    beamPositions.forEach(b => {
      const beamGeo = new THREE.CylinderGeometry(2.5, 9, 800, 16);
      const beamMat = new THREE.MeshBasicMaterial({
        color: b.color,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(b.x, 400, b.z);
      root.add(beam);
      this.skyBeams.push(beam);
    });
  }

  // Floating multi-colored 3D holographic billboards
  buildColorfulBillboards(root) {
    const ads = [
      { text: 'CYBER VELOCITY', sub: 'NEO-TOKYO APEX', color: '#00f3ff', border: '#00f3ff' },
      { text: 'ARASAKA NEURAL', sub: 'SYNAPTIC MATRIX', color: '#ff0055', border: '#ff0055' },
      { text: 'QUANTUM GRAVITY', sub: 'ZERO FRICTION CORE', color: '#ffe600', border: '#ffe600' },
      { text: 'HYPER-DRIVE 2099', sub: 'INFINITE VELOCITY', color: '#00ff88', border: '#00ff88' },
      { text: 'SPACEX THRUST', sub: 'COLD-GAS VECTORING', color: '#9d00ff', border: '#9d00ff' },
      { text: 'SOLAR DYNAMICS', sub: 'PHOTONIC ENERGY', color: '#ff7700', border: '#ff7700' }
    ];

    const billboardLocations = [
      new THREE.Vector3(120, 60, 220),
      new THREE.Vector3(-120, 65, 220),
      new THREE.Vector3(260, 75, -120),
      new THREE.Vector3(-260, 70, -120),
      new THREE.Vector3(0, 80, -320),
      new THREE.Vector3(340, 75, 200)
    ];

    billboardLocations.forEach((pos, idx) => {
      const ad = ads[idx % ads.length];
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      // Translucent Cyber Panel
      ctx.fillStyle = 'rgba(8, 16, 36, 0.9)';
      ctx.fillRect(0, 0, 512, 256);

      ctx.strokeStyle = ad.border;
      ctx.lineWidth = 10;
      ctx.strokeRect(8, 8, 496, 240);

      ctx.fillStyle = ad.color;
      ctx.font = '900 46px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ad.text, 256, 110);

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 24px sans-serif';
      ctx.fillText(ad.sub, 256, 165);

      const tex = new THREE.CanvasTexture(canvas);
      const bMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.94,
        side: THREE.DoubleSide
      });
      const bGeo = new THREE.PlaneGeometry(65, 32);
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

  // Stunt jump ramps & speed boost pads placed in open plazas and avenues
  buildStuntParkElements(root) {
    const padSpots = [
      { x: 0, z: 90, angle: 0 },
      { x: 0, z: -90, angle: Math.PI },
      { x: 90, z: 0, angle: -Math.PI / 2 },
      { x: -90, z: 0, angle: Math.PI / 2 },
      { x: 190, z: 190, angle: Math.PI / 4 },
      { x: -190, z: 190, angle: -Math.PI / 4 },
      { x: 190, z: -190, angle: Math.PI * 0.75 },
      { x: -190, z: -190, angle: -Math.PI * 0.75 }
    ];

    padSpots.forEach((spot, idx) => {
      // Speed Boost Pad
      const padGroup = new THREE.Group();
      padGroup.position.set(spot.x, 0.06, spot.z);
      padGroup.rotation.y = spot.angle;

      const padGeo = new THREE.PlaneGeometry(10, 16);
      padGeo.rotateX(-Math.PI / 2);

      const padCanvas = document.createElement('canvas');
      padCanvas.width = 128;
      padCanvas.height = 256;
      const ctx = padCanvas.getContext('2d');
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 128, 256);
      ctx.strokeStyle = idx % 2 === 0 ? '#00f3ff' : '#ff0055';
      ctx.lineWidth = 14;

      for (let y = 45; y < 240; y += 60) {
        ctx.beginPath();
        ctx.moveTo(18, y + 30);
        ctx.lineTo(64, y);
        ctx.lineTo(110, y + 30);
        ctx.stroke();
      }

      const padTex = new THREE.CanvasTexture(padCanvas);
      const padMat = new THREE.MeshBasicMaterial({ map: padTex, transparent: true, opacity: 0.95 });
      const padMesh = new THREE.Mesh(padGeo, padMat);
      padGroup.add(padMesh);

      const padLight = new THREE.PointLight(idx % 2 === 0 ? 0x00f3ff : 0xff0055, 3.0, 15);
      padLight.position.set(0, 2, 0);
      padGroup.add(padLight);

      root.add(padGroup);

      this.boostPads.push({
        position: new THREE.Vector3(spot.x, 0, spot.z),
        radius: 8.0,
        light: padLight
      });
    });

    // Stunt Jump Ramps along the Grand Plaza perimeter
    const rampSpots = [
      { x: 0, z: 220, rotY: 0 },
      { x: 0, z: -220, rotY: Math.PI },
      { x: 220, z: 0, rotY: Math.PI / 2 },
      { x: -220, z: 0, rotY: -Math.PI / 2 }
    ];

    rampSpots.forEach(r => {
      const rampGeo = new THREE.BoxGeometry(20, 2.4, 16);
      const rampMat = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        metalness: 0.85,
        roughness: 0.2
      });
      const ramp = new THREE.Mesh(rampGeo, rampMat);
      ramp.position.set(r.x, 0.7, r.z);
      ramp.rotation.y = r.rotY;
      ramp.rotation.x = -0.16; // Incline ramp
      ramp.castShadow = true;
      root.add(ramp);
    });
  }

  buildRainSystem(root) {
    const rainCount = 4000;
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1000;
      positions[i * 3 + 1] = Math.random() * 220;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1000;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x00f3ff,
      size: 0.65,
      transparent: true,
      opacity: 0.0
    });

    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    root.add(this.rainParticles);
  }

  update(delta, time, carPos) {
    // Animate floating billboards
    this.animatedBillboards.forEach(b => {
      b.mesh.position.y = b.baseY + Math.sin(time * 1.5 + b.offset) * 2.8;
    });

    // Slowly rotate sky beams
    this.skyBeams.forEach((b, idx) => {
      b.rotation.y += (idx % 2 === 0 ? 0.3 : -0.3) * delta;
    });

    // Animate rain if active
    if (this.rainParticles && this.rainParticles.material.opacity > 0.05) {
      const positions = this.rainParticles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 260 * delta;
        if (positions[i + 1] < 0) {
          positions[i + 1] = 200;
          positions[i] = carPos.x + (Math.random() - 0.5) * 500;
          positions[i + 2] = carPos.z + (Math.random() - 0.5) * 500;
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
        this.groundMat.color.set(0x0e1b2d);
        this.groundMat.roughness = 0.22;
      } else {
        this.groundMat.color.set(0x060b14);
        this.groundMat.roughness = 0.16;
      }
    }
  }
}
