import * as THREE from 'three';

// Procedural 3D Futuristic Car Mesh Builder for Three.js
export class CarBuilder {
  constructor() {
    // Shared materials and geometries for high performance
    this.carbonMaterial = new THREE.MeshStandardMaterial({
      color: 0x111113,
      roughness: 0.35,
      metalness: 0.8
    });

    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x050d1a,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.7,
      transparent: true,
      opacity: 0.85
    });

    this.tireMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181a,
      roughness: 0.85,
      metalness: 0.1
    });

    this.rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2e38,
      roughness: 0.2,
      metalness: 0.9
    });
  }

  buildCar(carData, paintColor, underglowColor) {
    const carGroup = new THREE.Group();
    carGroup.name = `car-${carData.id}`;

    const pColor = paintColor || carData.defaultPaint;
    const uColor = underglowColor || carData.defaultUnderglow;

    // Primary Body Material
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(pColor),
      metalness: 0.85,
      roughness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });

    // Emissive Underglow Material
    const underglowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(uColor),
      transparent: true,
      opacity: 0.75
    });

    // Emissive Accent / Laser Materials
    const cyanLaser = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const redLaser = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const amberLaser = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const greenLaser = new THREE.MeshBasicMaterial({ color: 0x00ff66 });

    // Internal object references for dynamic animation
    const wheels = [];
    const exhaustJets = [];
    let rearWing = null;

    // 1. CHASSIS / UNDERBODY PLATFORM
    const chassisGeo = new THREE.BoxGeometry(1.9, 0.2, 4.4);
    const chassis = new THREE.Mesh(chassisGeo, this.carbonMaterial);
    chassis.position.y = 0.25;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    carGroup.add(chassis);

    // 2. UNIQUE BRAND-SPECIFIC GEOMETRY
    switch (carData.id) {
      case 'bugatti':
        this.buildBugattiBolide(carGroup, bodyMaterial, cyanLaser, redLaser);
        break;
      case 'lamborghini':
        this.buildLamboTerzo(carGroup, bodyMaterial, amberLaser, redLaser);
        break;
      case 'ferrari':
        this.buildFerrariVision(carGroup, bodyMaterial, redLaser);
        break;
      case 'porsche':
        this.buildPorscheMissionX(carGroup, bodyMaterial, greenLaser, redLaser);
        break;
      case 'tesla':
        this.buildTeslaCyberApex(carGroup, bodyMaterial, cyanLaser, redLaser);
        break;
      case 'mclaren':
        this.buildMcLarenSolus(carGroup, bodyMaterial, amberLaser, redLaser);
        break;
      case 'koenigsegg':
        this.buildKoenigseggJesko(carGroup, bodyMaterial, amberLaser, redLaser);
        break;
      case 'astonmartin':
        this.buildAstonValkyrie(carGroup, bodyMaterial, greenLaser, redLaser);
        break;
      default:
        this.buildGenericCyberHypercar(carGroup, bodyMaterial, cyanLaser, redLaser);
        break;
    }

    // 3. UNDERGLOW NEON TUBE & POINT LIGHT
    const underglowGeo = new THREE.BoxGeometry(1.6, 0.04, 3.4);
    const underglowMesh = new THREE.Mesh(underglowGeo, underglowMaterial);
    underglowMesh.position.y = 0.12;
    carGroup.add(underglowMesh);

    const underglowLight = new THREE.PointLight(new THREE.Color(uColor), 3.5, 4.5);
    underglowLight.position.set(0, 0.2, 0);
    carGroup.add(underglowLight);

    // 4. FRONT HEADLIGHT BEAMS (Projector Spotlights for night driving)
    const headLeft = new THREE.SpotLight(0xffffff, 5, 45, Math.PI / 6, 0.4);
    headLeft.position.set(-0.7, 0.5, 2.2);
    headLeft.target.position.set(-0.7, 0.1, 15);
    carGroup.add(headLeft);
    carGroup.add(headLeft.target);

    const headRight = new THREE.SpotLight(0xffffff, 5, 45, Math.PI / 6, 0.4);
    headRight.position.set(0.7, 0.5, 2.2);
    headRight.target.position.set(0.7, 0.1, 15);
    carGroup.add(headRight);
    carGroup.add(headRight.target);

    // 5. WHEELS & CYBER-RIMS
    const wheelPositions = [
      { x: -0.96, y: 0.38, z: 1.35, isFront: true },  // Front Left
      { x: 0.96, y: 0.38, z: 1.35, isFront: true },   // Front Right
      { x: -1.0, y: 0.42, z: -1.35, isFront: false }, // Rear Left (wider)
      { x: 1.0, y: 0.42, z: -1.35, isFront: false }   // Rear Right (wider)
    ];

    wheelPositions.forEach((pos, idx) => {
      const wheelAssembly = new THREE.Group();
      wheelAssembly.position.set(pos.x, pos.y, pos.z);

      const radius = pos.isFront ? 0.38 : 0.42;
      const width = pos.isFront ? 0.28 : 0.36;

      // Tire
      const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 24);
      tireGeo.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, this.tireMaterial);
      tire.castShadow = true;
      wheelAssembly.add(tire);

      // Rim
      const rimGeo = new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, width + 0.01, 16);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, this.rimMaterial);
      wheelAssembly.add(rim);

      // Glowing Rim Center Hub
      const hubGeo = new THREE.CylinderGeometry(radius * 0.25, radius * 0.25, width + 0.02, 12);
      hubGeo.rotateZ(Math.PI / 2);
      const hub = new THREE.Mesh(hubGeo, underglowMaterial);
      wheelAssembly.add(hub);

      // Brake Caliper
      const caliperGeo = new THREE.BoxGeometry(0.12, 0.18, 0.15);
      const caliperMat = new THREE.MeshStandardMaterial({ color: 0xff0044, metalness: 0.8, roughness: 0.3 });
      const caliper = new THREE.Mesh(caliperGeo, caliperMat);
      caliper.position.set(pos.x > 0 ? -0.1 : 0.1, 0.12, 0);
      wheelAssembly.add(caliper);

      carGroup.add(wheelAssembly);
      wheels.push({ group: wheelAssembly, isFront: pos.isFront });
    });

    // 6. EXHAUST JET FLAMES (Pulsing plasma thrusters)
    const jetOffsets = [-0.32, 0.32];
    jetOffsets.forEach(xOffset => {
      const jetGeo = new THREE.ConeGeometry(0.14, 0.7, 12);
      jetGeo.rotateX(-Math.PI / 2);
      const jetMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(carData.accentColor || '#00f3ff'),
        transparent: true,
        opacity: 0.0
      });
      const jet = new THREE.Mesh(jetGeo, jetMat);
      jet.position.set(xOffset, 0.42, -2.5);
      carGroup.add(jet);
      exhaustJets.push(jet);
    });

    return {
      mesh: carGroup,
      bodyMaterial,
      underglowMaterial,
      underglowLight,
      wheels,
      exhaustJets,
      data: carData,
      setUnderglowColor: (hex) => {
        underglowMaterial.color.set(hex);
        underglowLight.color.set(hex);
      },
      setPaintColor: (hex) => {
        bodyMaterial.color.set(hex);
      }
    };
  }

  // ================= BRAND SILHOUETTES =================

  // 1. BUGATTI BOLIDE 2099
  buildBugattiBolide(car, mat, cyanLaser, redLaser) {
    // Horseshoe center scoop
    const hsGeo = new THREE.TorusGeometry(0.28, 0.05, 12, 24, Math.PI);
    hsGeo.rotateZ(Math.PI);
    const hs = new THREE.Mesh(hsGeo, cyanLaser);
    hs.position.set(0, 0.32, 2.15);
    car.add(hs);

    // Front Low Slung Splitter
    const splitGeo = new THREE.BoxGeometry(2.0, 0.08, 0.8);
    const splitter = new THREE.Mesh(splitGeo, this.carbonMaterial);
    splitter.position.set(0, 0.15, 1.9);
    car.add(splitter);

    // Bugatti signature X-headlights
    [-0.7, 0.7].forEach(x => {
      const xBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.03, 0.03), cyanLaser);
      xBar1.rotation.z = Math.PI / 4;
      xBar1.position.set(x, 0.48, 2.05);
      car.add(xBar1);
      const xBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.03, 0.03), cyanLaser);
      xBar2.rotation.z = -Math.PI / 4;
      xBar2.position.set(x, 0.48, 2.05);
      car.add(xBar2);
    });

    // Main Curved Cockpit / Body
    const bodyGeo = new THREE.BoxGeometry(1.65, 0.45, 3.2);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.set(0, 0.5, 0.1);
    body.castShadow = true;
    car.add(body);

    // Canopy Bubble
    const canopyGeo = new THREE.SphereGeometry(0.72, 16, 16);
    canopyGeo.scale(1.0, 0.55, 1.8);
    const canopy = new THREE.Mesh(canopyGeo, this.glassMaterial);
    canopy.position.set(0, 0.75, -0.1);
    car.add(canopy);

    // Sweeping C-Line side scoops
    [-0.85, 0.85].forEach(x => {
      const cLineGeo = new THREE.TorusGeometry(0.48, 0.06, 8, 20, Math.PI * 1.2);
      cLineGeo.rotateY(x > 0 ? Math.PI / 2 : -Math.PI / 2);
      const cLine = new THREE.Mesh(cLineGeo, mat);
      cLine.position.set(x, 0.58, -0.2);
      car.add(cLine);
    });

    // Rear X-Taillight Laser Array
    const rearX = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.04), redLaser);
    rearX.position.set(0, 0.58, -2.18);
    car.add(rearX);

    // Massive Le Mans Bolide Rear Wing
    const wingGeo = new THREE.BoxGeometry(2.05, 0.04, 0.45);
    const wing = new THREE.Mesh(wingGeo, this.carbonMaterial);
    wing.position.set(0, 0.98, -2.05);
    car.add(wing);

    // Central Fin Stabilizer
    const finGeo = new THREE.BoxGeometry(0.04, 0.45, 1.4);
    const fin = new THREE.Mesh(finGeo, mat);
    fin.position.set(0, 0.82, -1.3);
    car.add(fin);
  }

  // 2. LAMBORGHINI TERZO MILLENNIO
  buildLamboTerzo(car, mat, amberLaser, redLaser) {
    // Ultra-sharp wedge front nose
    const noseGeo = new THREE.ConeGeometry(0.95, 1.6, 4);
    noseGeo.rotateX(-Math.PI / 2);
    noseGeo.rotateY(Math.PI / 4);
    noseGeo.scale(1.4, 0.35, 1.0);
    const nose = new THREE.Mesh(noseGeo, mat);
    nose.position.set(0, 0.4, 1.4);
    nose.castShadow = true;
    car.add(nose);

    // Y-Headlight Laser Blades
    [-0.72, 0.72].forEach(x => {
      const yStem = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.35), amberLaser);
      yStem.position.set(x, 0.38, 1.7);
      car.add(yStem);

      const yLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.04), amberLaser);
      yLeft.rotation.y = 0.5;
      yLeft.position.set(x - 0.06, 0.38, 1.85);
      car.add(yLeft);

      const yRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.04), amberLaser);
      yRight.rotation.y = -0.5;
      yRight.position.set(x + 0.06, 0.38, 1.85);
      car.add(yRight);
    });

    // Stealth Fighter Angular Canopy
    const roofGeo = new THREE.BoxGeometry(1.2, 0.35, 2.0);
    roofGeo.scale(1.0, 0.7, 1.0);
    const roof = new THREE.Mesh(roofGeo, this.glassMaterial);
    roof.position.set(0, 0.72, -0.2);
    car.add(roof);

    // Rear Hex Diffuser
    const diffGeo = new THREE.BoxGeometry(1.85, 0.35, 0.6);
    const diff = new THREE.Mesh(diffGeo, this.carbonMaterial);
    diff.position.set(0, 0.35, -1.9);
    car.add(diff);

    // Y-Taillight lightbars
    [-0.6, 0.6].forEach(x => {
      const tLight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.04), redLaser);
      tLight.position.set(x, 0.62, -2.15);
      car.add(tLight);
    });
  }

  // 3. FERRARI VISION GT
  buildFerrariVision(car, mat, redLaser) {
    // Flowing pontoon curves
    const bodyGeo = new THREE.BoxGeometry(1.8, 0.42, 3.4);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.set(0, 0.48, 0);
    body.castShadow = true;
    car.add(body);

    // Single sweep bubble cockpit
    const cockGeo = new THREE.SphereGeometry(0.68, 16, 16);
    cockGeo.scale(1.0, 0.5, 2.2);
    const cock = new THREE.Mesh(cockGeo, this.glassMaterial);
    cock.position.set(0, 0.75, -0.05);
    car.add(cock);

    // Front horizontal ultra-slim photonic beam
    const frontBeam = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.03, 0.04), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    frontBeam.position.set(0, 0.42, 2.12);
    car.add(frontBeam);

    // Signature Ferrari full-width razor laser taillight wing
    const rearWingGeo = new THREE.BoxGeometry(2.1, 0.05, 0.5);
    const rearWing = new THREE.Mesh(rearWingGeo, this.carbonMaterial);
    rearWing.position.set(0, 0.88, -1.95);
    car.add(rearWing);

    const laserTail = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.03, 0.03), redLaser);
    laserTail.position.set(0, 0.9, -2.15);
    car.add(laserTail);
  }

  // 4. PORSCHE MISSION X
  buildPorscheMissionX(car, mat, greenLaser, redLaser) {
    // Rounded sculpted prototype front
    const frontGeo = new THREE.BoxGeometry(1.7, 0.38, 1.8);
    const front = new THREE.Mesh(frontGeo, mat);
    front.position.set(0, 0.44, 1.2);
    front.castShadow = true;
    car.add(front);

    // Porsche vertical 4-point LED matrix headlights
    [-0.68, 0.68].forEach(x => {
      for (let i = 0; i < 4; i++) {
        const pLed = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        pLed.position.set(x + (i % 2 === 0 ? -0.05 : 0.05), 0.52 + (i < 2 ? 0.06 : -0.06), 2.05);
        car.add(pLed);
      }
    });

    // Glass dome Le Mans canopy
    const domeGeo = new THREE.SphereGeometry(0.72, 16, 16);
    domeGeo.scale(0.95, 0.6, 1.8);
    const dome = new THREE.Mesh(domeGeo, this.glassMaterial);
    dome.position.set(0, 0.78, 0.0);
    car.add(dome);

    // Acid green futuristic accents
    const sideFinGeo = new THREE.BoxGeometry(0.04, 0.15, 1.2);
    [-0.92, 0.92].forEach(x => {
      const sideFin = new THREE.Mesh(sideFinGeo, greenLaser);
      sideFin.position.set(x, 0.45, 0.2);
      car.add(sideFin);
    });

    // Continuous curved rear lightbar with illuminated "PORSCHE" cyber center
    const lightBarGeo = new THREE.BoxGeometry(1.85, 0.04, 0.04);
    const lightBar = new THREE.Mesh(lightBarGeo, redLaser);
    lightBar.position.set(0, 0.66, -2.15);
    car.add(lightBar);
  }

  // 5. TESLA CYBER-APEX
  buildTeslaCyberApex(car, mat, cyanLaser, redLaser) {
    // Angular faceted exoskeleton triangles
    const bodyGeo = new THREE.BoxGeometry(1.85, 0.55, 3.8);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.set(0, 0.52, 0);
    body.castShadow = true;
    car.add(body);

    // Sharp Cyber triangular roof peak
    const apexRoofGeo = new THREE.ConeGeometry(0.9, 0.6, 4);
    apexRoofGeo.rotateY(Math.PI / 4);
    apexRoofGeo.scale(1.2, 1.0, 2.5);
    const apexRoof = new THREE.Mesh(apexRoofGeo, this.glassMaterial);
    apexRoof.position.set(0, 0.95, -0.1);
    car.add(apexRoof);

    // Front horizontal cyber laser bar
    const cyberHead = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.05, 0.04), cyanLaser);
    cyberHead.position.set(0, 0.58, 1.92);
    car.add(cyberHead);

    // Rear continuous red cyber beam
    const cyberTail = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.04), redLaser);
    cyberTail.position.set(0, 0.68, -1.92);
    car.add(cyberTail);

    // SpaceX Cold-Gas Thruster Nozzles on rear
    [-0.45, 0.45].forEach(x => {
      const thrusterGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.2, 16);
      thrusterGeo.rotateX(Math.PI / 2);
      const thruster = new THREE.Mesh(thrusterGeo, this.carbonMaterial);
      thruster.position.set(x, 0.42, -1.95);
      car.add(thruster);
    });
  }

  // 6. MCLAREN SOLUS GT
  buildMcLarenSolus(car, mat, amberLaser, redLaser) {
    // Central jet cockpit pod
    const podGeo = new THREE.SphereGeometry(0.55, 16, 16);
    podGeo.scale(0.9, 0.7, 2.6);
    const pod = new THREE.Mesh(podGeo, this.glassMaterial);
    pod.position.set(0, 0.8, -0.1);
    car.add(pod);

    // Aerodynamic side pods (Dihedral pod intakes)
    [-0.65, 0.65].forEach(x => {
      const sideGeo = new THREE.BoxGeometry(0.55, 0.38, 2.4);
      const sidePod = new THREE.Mesh(sideGeo, mat);
      sidePod.position.set(x, 0.44, 0);
      car.add(sidePod);
    });

    // Massive High-Mount Biplane Rear Wing
    const wing1 = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.04, 0.4), this.carbonMaterial);
    wing1.position.set(0, 0.95, -2.0);
    car.add(wing1);

    const wing2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.03, 0.3), this.carbonMaterial);
    wing2.position.set(0, 1.15, -2.1);
    car.add(wing2);

    // Roof air scoop
    const scoopGeo = new THREE.BoxGeometry(0.25, 0.15, 0.6);
    const scoop = new THREE.Mesh(scoopGeo, this.carbonMaterial);
    scoop.position.set(0, 1.05, 0.1);
    car.add(scoop);
  }

  // 7. KOENIGSEGG JESKO QUANTUM
  buildKoenigseggJesko(car, mat, amberLaser, redLaser) {
    // Visor wraparound canopy
    const visorGeo = new THREE.SphereGeometry(0.7, 16, 16);
    visorGeo.scale(1.1, 0.55, 1.9);
    const visor = new THREE.Mesh(visorGeo, this.glassMaterial);
    visor.position.set(0, 0.75, 0.1);
    car.add(visor);

    // Main sculpted fuselage
    const bodyGeo = new THREE.BoxGeometry(1.75, 0.44, 3.5);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.set(0, 0.46, 0);
    car.add(body);

    // Dual Fighter-Jet Vertical Stabilizer Fins
    [-0.55, 0.55].forEach(x => {
      const finGeo = new THREE.BoxGeometry(0.04, 0.45, 1.2);
      const fin = new THREE.Mesh(finGeo, mat);
      fin.position.set(x, 0.85, -1.5);
      fin.rotation.z = x > 0 ? -0.15 : 0.15;
      car.add(fin);
    });

    // Top-mount boomerang active aero wing
    const wingGeo = new THREE.BoxGeometry(2.1, 0.05, 0.45);
    const wing = new THREE.Mesh(wingGeo, this.carbonMaterial);
    wing.position.set(0, 1.05, -2.15);
    car.add(wing);

    // Twin plasma exhaust center-exit
    const exhGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.18, 12);
    exhGeo.rotateX(Math.PI / 2);
    const exh = new THREE.Mesh(exhGeo, amberLaser);
    exh.position.set(0, 0.58, -2.1);
    car.add(exh);
  }

  // 8. ASTON MARTIN VALKYRIE AMR PRO
  buildAstonValkyrie(car, mat, greenLaser, redLaser) {
    // Teardrop central pilot capsule
    const dropGeo = new THREE.SphereGeometry(0.6, 16, 16);
    dropGeo.scale(0.85, 0.6, 2.2);
    const drop = new THREE.Mesh(dropGeo, this.glassMaterial);
    drop.position.set(0, 0.76, 0.1);
    car.add(drop);

    // Open-wheel aerodynamic arched wheel fairings
    [-0.75, 0.75].forEach(x => {
      const archFront = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.3, 1.2), mat);
      archFront.position.set(x, 0.5, 1.3);
      car.add(archFront);

      const archRear = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.35, 1.4), mat);
      archRear.position.set(x, 0.52, -1.2);
      car.add(archRear);
    });

    // Venturi Tunnel Underside Cutouts
    const tunnelGeo = new THREE.BoxGeometry(1.2, 0.15, 2.8);
    const tunnel = new THREE.Mesh(tunnelGeo, this.carbonMaterial);
    tunnel.position.set(0, 0.22, 0);
    car.add(tunnel);

    // Wide high-downforce rear blade
    const wingGeo = new THREE.BoxGeometry(2.15, 0.04, 0.48);
    const wing = new THREE.Mesh(wingGeo, this.carbonMaterial);
    wing.position.set(0, 0.95, -2.1);
    car.add(wing);

    // Lime green / racing cyan laser lightbar
    const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 0.04), redLaser);
    tailBar.position.set(0, 0.65, -2.2);
    car.add(tailBar);
  }

  buildGenericCyberHypercar(car, mat, cyanLaser, redLaser) {
    const bodyGeo = new THREE.BoxGeometry(1.7, 0.45, 3.4);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.set(0, 0.48, 0);
    car.add(body);
  }
}
