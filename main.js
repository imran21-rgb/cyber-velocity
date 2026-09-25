import * as THREE from 'three';
import { CARS_DATA } from './carsData.js';
import { CarBuilder } from './carBuilder.js';
import { CityBuilder } from './cityBuilder.js';
import { CarPhysics } from './physics.js';
import { audioEngine } from './audioEngine.js';

class CyberVelocityGame {
  constructor() {
    this.currentCarIndex = 0;
    this.currentWeather = 'cyber-day';
    this.cameraMode = 'chase'; // 'chase', 'hood', 'far', 'orbit'
    this.cameraModes = ['chase', 'hood', 'far'];
    this.currentCameraIdx = 0;

    this.isDriving = false;
    this.clock = new THREE.Clock();
    this.timerSeconds = 0;
    this.topSpeedEver = 0;

    // Active car custom paint & underglow
    this.customPaints = {};
    this.customUnderglows = {};

    // Input state
    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      drift: false,
      nitro: false
    };

    this.initDOM();
    this.initThree();
    this.initCar();
    this.initEnvironment();
    this.initParticles();
    this.setupEventListeners();
    this.renderCarDock();
    this.updateGarageUI();

    // Start render loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initDOM() {
    this.container = document.getElementById('canvas-container');
    this.hudElement = document.getElementById('hud');
    this.garageElement = document.getElementById('garage-screen');

    // HUD Elements
    this.hudCarBrand = document.getElementById('hud-car-brand');
    this.hudCarModel = document.getElementById('hud-car-model');
    this.hudSpeed = document.getElementById('hud-speed');
    this.hudGear = document.getElementById('hud-gear');
    this.hudTimer = document.getElementById('hud-timer');
    this.hudDriftScore = document.getElementById('hud-drift-score');
    this.hudTopSpeed = document.getElementById('hud-top-speed');
    this.hudNitroPct = document.getElementById('nitro-pct');
    this.hudNitroBar = document.getElementById('boost-bar-fill');
    this.hudTachoActive = document.getElementById('tacho-active');
    this.hudTraction = document.getElementById('hud-traction');
    this.hudGForce = document.getElementById('hud-gforce');
    this.speedVignette = document.getElementById('speed-vignette');
    this.driftAlert = document.getElementById('drift-alert');
    this.driftPointsElem = document.getElementById('drift-points');
    this.boostAlert = document.getElementById('boost-alert');
    this.camNameElem = document.getElementById('cam-name');
    this.radarCanvas = document.getElementById('radar-canvas');
    this.radarCtx = this.radarCanvas.getContext('2d');
  }

  initThree() {
    // 1. Scene: Bright Sci-Fi Azure Daylight Metropolis
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x70bcf2);
    this.scene.fog = new THREE.FogExp2(0x70bcf2, 0.00065);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3500);
    this.camera.position.set(0, 3, -7);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting: Crisp Daytime Sunlight & Sky Fill
    this.ambientLight = new THREE.AmbientLight(0xa6d8fc, 2.4);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 3.4);
    this.dirLight.position.set(250, 420, 250);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 1200;
    const d = 160;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);

    // Accent directional fill (Daytime sky bounce)
    this.accentLight = new THREE.DirectionalLight(0x72c4f8, 1.6);
    this.accentLight.position.set(-200, 180, -200);
    this.scene.add(this.accentLight);

    // Showroom spotlight
    this.showroomSpot = new THREE.SpotLight(0xffffff, 6, 35, Math.PI / 4, 0.35);
    this.showroomSpot.position.set(0, 9, 0);
    this.showroomSpot.target.position.set(0, 0, 0);
    this.scene.add(this.showroomSpot);
    this.scene.add(this.showroomSpot.target);

    // Window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initCar() {
    this.carBuilder = new CarBuilder();
    this.physics = new CarPhysics();

    this.loadCarMesh(this.currentCarIndex);
  }

  loadCarMesh(index) {
    if (this.currentCarObject) {
      this.scene.remove(this.currentCarObject.mesh);
    }

    const carData = CARS_DATA[index];
    const paint = this.customPaints[carData.id] || carData.defaultPaint;
    const underglow = this.customUnderglows[carData.id] || carData.defaultUnderglow;

    this.currentCarObject = this.carBuilder.buildCar(carData, paint, underglow);
    this.physics.setCarSpecs(carData.physics);
    audioEngine.setCarProfile(carData.soundProfile);

    this.scene.add(this.currentCarObject.mesh);

    if (!this.isDriving) {
      // In Showroom / Garage: center car
      this.currentCarObject.mesh.position.set(0, 0.4, 0);
      this.currentCarObject.mesh.rotation.set(0, 0, 0);
    } else {
      this.currentCarObject.mesh.position.copy(this.physics.position);
      this.currentCarObject.mesh.rotation.y = this.physics.rotation;
    }
  }

  initEnvironment() {
    this.cityBuilder = new CityBuilder(this.scene);
    this.cityGroup = this.cityBuilder.buildEnvironment(this.currentWeather);
  }

  initParticles() {
    // 1. Warp Speed Streaks Particle System (Hyperspace lines)
    const warpCount = 600;
    const warpGeo = new THREE.BufferGeometry();
    const warpPositions = new Float32Array(warpCount * 6); // 2 vertices per line streak

    for (let i = 0; i < warpCount; i++) {
      const x = (Math.random() - 0.5) * 60;
      const y = Math.random() * 20;
      const z = (Math.random() - 0.5) * 120;
      warpPositions[i * 6] = x;
      warpPositions[i * 6 + 1] = y;
      warpPositions[i * 6 + 2] = z;
      warpPositions[i * 6 + 3] = x;
      warpPositions[i * 6 + 4] = y;
      warpPositions[i * 6 + 5] = z + 6;
    }
    warpGeo.setAttribute('position', new THREE.BufferAttribute(warpPositions, 3));

    const warpMat = new THREE.LineBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.0
    });
    this.warpLines = new THREE.LineSegments(warpGeo, warpMat);
    this.scene.add(this.warpLines);

    // 2. Drift Sparks System
    const sparkCount = 150;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount * 3; i++) {
      sparkPositions[i] = 0;
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));

    const sparkMat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.35,
      transparent: true,
      opacity: 0.0
    });
    this.driftSparks = new THREE.Points(sparkGeo, sparkMat);
    this.scene.add(this.driftSparks);
  }

  setupEventListeners() {
    // Keyboard down
    window.addEventListener('keydown', (e) => {
      audioEngine.init(); // User gesture unlocks audio context
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.input.forward = true;
      if (code === 'KeyS' || code === 'ArrowDown') this.input.backward = true;
      if (code === 'KeyA' || code === 'ArrowLeft') this.input.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') this.input.right = true;
      if (code === 'Space') { this.input.drift = true; e.preventDefault(); }
      if (code === 'ShiftLeft' || code === 'ShiftRight') this.input.nitro = true;
      if (code === 'KeyC') this.cycleCamera();
      if (code === 'KeyR') this.respawnCar();
      if (code === 'KeyG') this.toggleGarage();
      if (code === 'KeyM') this.toggleAudio();
    });

    // Keyboard up
    window.addEventListener('keyup', (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.input.forward = false;
      if (code === 'KeyS' || code === 'ArrowDown') this.input.backward = false;
      if (code === 'KeyA' || code === 'ArrowLeft') this.input.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') this.input.right = false;
      if (code === 'Space') this.input.drift = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight') this.input.nitro = false;
    });

    // Carousel Navigation
    document.getElementById('car-prev-btn').addEventListener('click', () => {
      audioEngine.init();
      audioEngine.playClick();
      this.currentCarIndex = (this.currentCarIndex - 1 + CARS_DATA.length) % CARS_DATA.length;
      this.loadCarMesh(this.currentCarIndex);
      this.updateGarageUI();
    });

    document.getElementById('car-next-btn').addEventListener('click', () => {
      audioEngine.init();
      audioEngine.playClick();
      this.currentCarIndex = (this.currentCarIndex + 1) % CARS_DATA.length;
      this.loadCarMesh(this.currentCarIndex);
      this.updateGarageUI();
    });

    // Launch Drive
    document.getElementById('btn-launch-drive').addEventListener('click', () => {
      audioEngine.init();
      audioEngine.playBoostPadSound();
      this.startDriving();
    });

    // Return to Garage
    document.getElementById('btn-return-garage').addEventListener('click', () => {
      audioEngine.playClick();
      this.returnToGarage();
    });

    // Camera Toggle
    document.getElementById('btn-camera').addEventListener('click', () => {
      audioEngine.playClick();
      this.cycleCamera();
    });

    // Audio Toggle
    document.getElementById('btn-audio').addEventListener('click', () => {
      this.toggleAudio();
    });

    // Weather buttons
    document.querySelectorAll('.weather-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        audioEngine.playClick();
        document.querySelectorAll('.weather-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.setWeather(btn.dataset.weather);
      });
    });

    // Touch controls
    const bindTouch = (id, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); audioEngine.init(); this.input[key] = true; });
      el.addEventListener('touchend', (e) => { e.preventDefault(); this.input[key] = false; });
    };

    bindTouch('touch-left-btn', 'left');
    bindTouch('touch-right-btn', 'right');
    bindTouch('touch-gas-btn', 'forward');
    bindTouch('touch-brake-btn', 'backward');
    bindTouch('touch-drift-btn', 'drift');
    bindTouch('touch-nitro-btn', 'nitro');
  }

  renderCarDock() {
    const dock = document.getElementById('cars-dock');
    dock.innerHTML = '';
    CARS_DATA.forEach((car, idx) => {
      const card = document.createElement('div');
      card.className = `dock-card ${idx === this.currentCarIndex ? 'active' : ''}`;
      card.innerHTML = `
        <div class="dock-brand">${car.brand}</div>
        <div class="dock-model">${car.model.split('//')[0]}</div>
      `;
      card.addEventListener('click', () => {
        audioEngine.init();
        audioEngine.playClick();
        this.currentCarIndex = idx;
        this.loadCarMesh(idx);
        this.updateGarageUI();
      });
      dock.appendChild(card);
    });
  }

  updateGarageUI() {
    const car = CARS_DATA[this.currentCarIndex];

    document.getElementById('garage-car-origin').textContent = car.origin;
    document.getElementById('garage-car-name').textContent = car.brand;
    document.getElementById('garage-car-subtitle').textContent = car.model;
    document.getElementById('garage-car-desc').textContent = car.desc;

    document.getElementById('spec-speed').style.width = `${car.specs.speed}%`;
    document.getElementById('spec-speed-val').textContent = car.specs.speedVal;

    document.getElementById('spec-accel').style.width = `${car.specs.accel}%`;
    document.getElementById('spec-accel-val').textContent = car.specs.accelVal;

    document.getElementById('spec-handling').style.width = `${car.specs.handling}%`;
    document.getElementById('spec-handling-val').textContent = car.specs.handlingVal;

    document.getElementById('spec-nitro').style.width = `${car.specs.nitro}%`;
    document.getElementById('spec-nitro-val').textContent = car.specs.nitroVal;

    const soundBadge = document.getElementById('garage-car-sound');
    if (soundBadge && car.soundProfile) {
      soundBadge.innerHTML = `<span>🔊 SOUND: ${car.soundProfile.name}</span>`;
      soundBadge.title = car.soundProfile.desc;
    }

    // Render Paint Color Chips
    const paintContainer = document.getElementById('paint-colors');
    paintContainer.innerHTML = '';
    const activePaint = this.customPaints[car.id] || car.defaultPaint;

    car.paints.forEach(color => {
      const chip = document.createElement('div');
      chip.className = `color-chip ${color.toLowerCase() === activePaint.toLowerCase() ? 'active' : ''}`;
      chip.style.backgroundColor = color;
      chip.addEventListener('click', () => {
        audioEngine.playClick();
        this.customPaints[car.id] = color;
        this.currentCarObject.setPaintColor(color);
        this.updateGarageUI();
      });
      paintContainer.appendChild(chip);
    });

    // Render Neon Underglow Chips
    const neonContainer = document.getElementById('neon-colors');
    neonContainer.innerHTML = '';
    const activeNeon = this.customUnderglows[car.id] || car.defaultUnderglow;

    car.underglows.forEach(color => {
      const chip = document.createElement('div');
      chip.className = `color-chip ${color.toLowerCase() === activeNeon.toLowerCase() ? 'active' : ''}`;
      chip.style.backgroundColor = color;
      chip.style.boxShadow = `0 0 8px ${color}`;
      chip.addEventListener('click', () => {
        audioEngine.playClick();
        this.customUnderglows[car.id] = color;
        this.currentCarObject.setUnderglowColor(color);
        this.updateGarageUI();
      });
      neonContainer.appendChild(chip);
    });

    // Update Dock selection
    document.querySelectorAll('.dock-card').forEach((c, idx) => {
      c.classList.toggle('active', idx === this.currentCarIndex);
    });
  }

  setWeather(weather) {
    this.currentWeather = weather;
    this.cityBuilder.setWeather(weather);

    if (weather === 'cyber-day') {
      this.scene.fog.color.set(0x70bcf2);
      this.scene.fog.density = 0.00065;
      this.scene.background.set(0x70bcf2);
      this.ambientLight.color.set(0xa6d8fc);
      this.ambientLight.intensity = 2.4;
      this.dirLight.color.set(0xffffff);
      this.dirLight.intensity = 3.4;
      this.dirLight.position.set(250, 420, 250);
      this.accentLight.color.set(0x72c4f8);
      this.accentLight.intensity = 1.6;
    } else if (weather === 'cyber-rain') {
      this.scene.fog.color.set(0x020510);
      this.scene.fog.density = 0.0018;
      this.scene.background.set(0x020510);
      this.ambientLight.color.set(0x0a1428);
      this.ambientLight.intensity = 1.4;
      this.dirLight.color.set(0x00d4ff);
      this.dirLight.intensity = 2.0;
    } else if (weather === 'synth-sunset') {
      this.scene.fog.color.set(0x1a0628);
      this.scene.fog.density = 0.0016;
      this.scene.background.set(0x1a0628);
      this.ambientLight.color.set(0x350d4f);
      this.ambientLight.intensity = 1.6;
      this.dirLight.color.set(0xff5500);
      this.dirLight.intensity = 2.6;
      this.accentLight.color.set(0xff0088);
    } else {
      // Neon night
      this.scene.fog.color.set(0x050814);
      this.scene.fog.density = 0.0018;
      this.scene.background.set(0x050814);
      this.ambientLight.color.set(0x1a243d);
      this.ambientLight.intensity = 1.8;
      this.dirLight.color.set(0x00f3ff);
      this.dirLight.intensity = 2.5;
      this.accentLight.color.set(0xff0055);
    }
  }

  startDriving() {
    this.isDriving = true;
    this.garageElement.classList.add('hidden');
    this.hudElement.classList.remove('hidden');

    const car = CARS_DATA[this.currentCarIndex];
    this.hudCarBrand.textContent = car.brand;
    this.hudCarModel.textContent = car.model;

    // Reset physics on start of track
    this.physics.reset(new THREE.Vector3(0, 0.4, 15), 0);
  }

  returnToGarage() {
    this.isDriving = false;
    this.garageElement.classList.remove('hidden');
    this.hudElement.classList.add('hidden');

    // Reset car orientation in garage
    this.currentCarObject.mesh.position.set(0, 0.4, 0);
    this.currentCarObject.mesh.rotation.set(0, 0, 0);
  }

  toggleGarage() {
    if (this.isDriving) {
      this.returnToGarage();
    } else {
      this.startDriving();
    }
  }

  cycleCamera() {
    this.currentCameraIdx = (this.currentCameraIdx + 1) % this.cameraModes.length;
    this.cameraMode = this.cameraModes[this.currentCameraIdx];
    this.camNameElem.textContent = this.cameraMode.toUpperCase();
  }

  respawnCar() {
    audioEngine.playBoostPadSound();
    this.physics.reset(new THREE.Vector3(0, 0.4, 20), 0);
  }

  toggleAudio() {
    const muted = audioEngine.toggleMute();
    document.getElementById('icon-sound-on').classList.toggle('hidden', muted);
    document.getElementById('icon-sound-off').classList.toggle('hidden', !muted);
  }

  // ================= MAIN GAME LOOP =================
  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.08);
    const time = this.clock.getElapsedTime();

    if (this.isDriving) {
      // 1. Update Physics
      this.physics.update(delta, this.input, this.cityBuilder.colliders, this.cityBuilder.boostPads);

      // 2. Update Car Mesh Transform
      const carMesh = this.currentCarObject.mesh;
      carMesh.position.copy(this.physics.position);
      carMesh.rotation.y = this.physics.rotation + this.physics.driftAngle;
      carMesh.rotation.x = this.physics.pitch;
      carMesh.rotation.z = this.physics.roll;

      // 3. Wheel Spin & Steering Rotation
      const wheelRoll = (this.physics.speed * delta) / 0.4;
      this.currentCarObject.wheels.forEach(w => {
        w.group.children[0].rotation.x += wheelRoll; // spin tire
        if (w.isFront) {
          w.group.rotation.y = this.physics.steeringAngle * 1.4;
        }
      });

      // 4. Exhaust Plasma Jet Animation
      const throttleActive = this.input.forward || this.physics.isNitroActive;
      const jetScale = this.physics.isNitroActive ? (2.2 + Math.random() * 0.4) : (throttleActive ? 1.0 : 0.0);
      this.currentCarObject.exhaustJets.forEach(jet => {
        jet.scale.set(jetScale, jetScale * 1.5, jetScale);
        jet.material.opacity = jetScale > 0.1 ? 0.85 : 0.0;
      });

      // 5. Camera Position Tracking
      this.updateDriveCamera(delta);

      // 6. Hyperspace Warp Lines & Drift Sparks
      this.updateVFX(delta);

      // 7. Update HUD Telemetry
      this.updateHUD(delta);

      // 8. Render Mini Radar Track Map
      this.renderRadar();

      // 9. Update City Environment (animations, billboards)
      this.cityBuilder.update(delta, time, this.physics.position);

    } else {
      // GARAGE SHOWROOM MODE: Elegant orbit around car
      const orbitSpeed = 0.4;
      const radius = 6.8;
      const camX = Math.sin(time * orbitSpeed) * radius;
      const camZ = Math.cos(time * orbitSpeed) * radius;
      this.camera.position.set(camX, 2.2 + Math.sin(time * 0.5) * 0.3, camZ);
      this.camera.lookAt(0, 0.7, 0);

      // Gentle floating underglow effect
      if (this.currentCarObject) {
        this.currentCarObject.mesh.position.y = 0.4 + Math.sin(time * 2.0) * 0.02;
      }
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  updateDriveCamera(delta) {
    const carPos = this.physics.position;
    const carHeading = this.physics.rotation;
    const speedRatio = Math.min(1.0, Math.abs(this.physics.speed) / this.physics.specs.maxSpeed);

    let targetPos = new THREE.Vector3();
    let lookTarget = new THREE.Vector3();

    if (this.cameraMode === 'chase') {
      // Dynamic Chase: pulls back with speed, tilts on turns
      const distance = 6.2 + speedRatio * 2.2;
      const height = 2.3 + speedRatio * 0.6;
      targetPos.x = carPos.x - Math.sin(carHeading) * distance;
      targetPos.y = carPos.y + height;
      targetPos.z = carPos.z - Math.cos(carHeading) * distance;

      lookTarget.set(carPos.x, carPos.y + 1.2, carPos.z);
      // Camera lag smoothing
      this.camera.position.lerp(targetPos, 14 * delta);
      this.camera.lookAt(lookTarget);

      // FOV Expansion for speed sensation
      const targetFOV = 60 + speedRatio * 25 + (this.physics.isNitroActive ? 12 : 0);
      this.camera.fov += (targetFOV - this.camera.fov) * 5 * delta;
      this.camera.updateProjectionMatrix();

    } else if (this.cameraMode === 'hood') {
      // Cockpit / Hood View
      targetPos.x = carPos.x + Math.sin(carHeading) * 0.8;
      targetPos.y = carPos.y + 0.95;
      targetPos.z = carPos.z + Math.cos(carHeading) * 0.8;

      lookTarget.x = carPos.x + Math.sin(carHeading) * 25;
      lookTarget.y = carPos.y + 0.8;
      lookTarget.z = carPos.z + Math.cos(carHeading) * 25;

      this.camera.position.copy(targetPos);
      this.camera.lookAt(lookTarget);
      this.camera.fov = 75;
      this.camera.updateProjectionMatrix();

    } else if (this.cameraMode === 'far') {
      // Far Cinematic View
      const distance = 11.0;
      const height = 4.5;
      targetPos.x = carPos.x - Math.sin(carHeading) * distance;
      targetPos.y = carPos.y + height;
      targetPos.z = carPos.z - Math.cos(carHeading) * distance;

      lookTarget.set(carPos.x, carPos.y + 1.0, carPos.z);
      this.camera.position.lerp(targetPos, 10 * delta);
      this.camera.lookAt(lookTarget);
      this.camera.fov = 55;
      this.camera.updateProjectionMatrix();
    }
  }

  updateVFX(delta) {
    const absSpeed = Math.abs(this.physics.speed);
    const speedKmh = Math.floor(absSpeed * 3.6);

    // 1. Hyperspace Warp Lines (Active when >250 km/h or Nitro)
    if (speedKmh > 240 || this.physics.isNitroActive) {
      this.warpLines.position.copy(this.physics.position);
      this.warpLines.rotation.y = this.physics.rotation;
      this.warpLines.material.opacity = Math.min(0.8, (speedKmh - 240) / 180 + (this.physics.isNitroActive ? 0.4 : 0));
      this.speedVignette.style.opacity = (this.physics.isNitroActive ? 0.75 : 0.35);
    } else {
      this.warpLines.material.opacity = 0.0;
      this.speedVignette.style.opacity = 0;
    }

    // 2. Drift Sparks & Smoke
    if (this.physics.isDrifting && absSpeed > 20) {
      this.driftSparks.material.opacity = 0.85;
      const posArr = this.driftSparks.geometry.attributes.position.array;
      const carPos = this.physics.position;

      for (let i = 0; i < posArr.length; i += 3) {
        if (Math.random() > 0.5) {
          posArr[i] = carPos.x + (Math.random() - 0.5) * 2;
          posArr[i + 1] = carPos.y + Math.random() * 0.4;
          posArr[i + 2] = carPos.z - Math.cos(this.physics.rotation) * 1.8 + (Math.random() - 0.5);
        }
      }
      this.driftSparks.geometry.attributes.position.needsUpdate = true;
    } else {
      this.driftSparks.material.opacity = 0.0;
    }
  }

  updateHUD(delta) {
    // Speed (KM/H)
    const speedKmh = Math.floor(Math.abs(this.physics.speed) * 3.6);
    this.hudSpeed.textContent = speedKmh;

    if (speedKmh > this.topSpeedEver) {
      this.topSpeedEver = speedKmh;
      this.hudTopSpeed.textContent = `${this.topSpeedEver} KM/H`;
    }

    // Gear & RPM Tachometer
    this.hudGear.textContent = this.physics.gear;
    const rpmRatio = (this.physics.rpm - 1000) / 8000;
    // Tachometer SVG dashoffset (380 is full arc length)
    const dashOffset = 380 - Math.min(380, Math.max(0, rpmRatio * 380));
    this.hudTachoActive.style.strokeDashoffset = dashOffset;

    // Nitro Gauge
    const nitroPct = Math.floor(this.physics.nitroAmount);
    this.hudNitroPct.textContent = `${nitroPct}%`;
    this.hudNitroBar.style.width = `${nitroPct}%`;

    // Drift Scoring & Notification
    this.hudDriftScore.textContent = this.physics.driftScore.toLocaleString();
    if (this.physics.isDrifting && this.physics.currentDriftPoints > 50) {
      this.driftAlert.classList.add('active');
      this.driftPointsElem.textContent = this.physics.currentDriftPoints.toLocaleString();
    } else {
      this.driftAlert.classList.remove('active');
    }

    // Hyperdrive / Boost Notification
    if (this.physics.isNitroActive) {
      this.boostAlert.classList.add('active');
    } else {
      this.boostAlert.classList.remove('active');
    }

    // Timer
    this.timerSeconds += delta;
    const mins = Math.floor(this.timerSeconds / 60);
    const secs = (this.timerSeconds % 60).toFixed(1);
    this.hudTimer.textContent = `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;

    // Telemetry Panel
    this.hudTraction.textContent = this.physics.isDrifting ? 'DRIFT SLIP' : 'OPTIMAL';
    this.hudTraction.className = `telemetry-val ${this.physics.isDrifting ? 'yellow' : 'ok'}`;
    this.hudGForce.textContent = `${this.physics.gForce} G`;
  }

  // Mini Radar Canvas Renderer for Open-World City
  renderRadar() {
    const ctx = this.radarCtx;
    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.12; // Scale open city coords to radar

    ctx.clearRect(0, 0, w, h);

    const carPos = this.physics.position;
    const cosHeading = Math.cos(-this.physics.rotation);
    const sinHeading = Math.sin(-this.physics.rotation);

    // 1. Draw Plaza Rings on Radar
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.25)';
    ctx.lineWidth = 1;
    [30, 70, 120].forEach(r => {
      const relX = (0 - carPos.x) * scale;
      const relZ = (0 - carPos.z) * scale;
      const rx = cx + (relX * cosHeading - relZ * sinHeading);
      const ry = cy + (relX * sinHeading + relZ * cosHeading);
      ctx.beginPath();
      ctx.arc(rx, ry, r * scale, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 2. Draw Colorful City Building Blocks
    const buildings = this.cityBuilder.buildingFootprints;
    if (buildings && buildings.length > 0) {
      for (const b of buildings) {
        const relX = (b.x - carPos.x) * scale;
        const relZ = (b.z - carPos.z) * scale;

        // Skip buildings far outside radar range
        if (Math.hypot(relX, relZ) > 85) continue;

        const radX = cx + (relX * cosHeading - relZ * sinHeading);
        const radY = cy + (relX * sinHeading + relZ * cosHeading);

        const bw = b.w * scale;
        const bd = b.d * scale;

        ctx.fillStyle = `#${b.color.toString(16).padStart(6, '0')}77`;
        ctx.fillRect(radX - bw / 2, radY - bd / 2, bw, bd);
      }
    }

    // 3. Draw Boost Pads on Radar
    const pads = this.cityBuilder.boostPads;
    if (pads && pads.length > 0) {
      ctx.fillStyle = '#ffe600';
      for (const p of pads) {
        const relX = (p.position.x - carPos.x) * scale;
        const relZ = (p.position.z - carPos.z) * scale;
        if (Math.hypot(relX, relZ) > 85) continue;

        const px = cx + (relX * cosHeading - relZ * sinHeading);
        const py = cy + (relX * sinHeading + relZ * cosHeading);
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Draw Player Blip (Always in center pointing forward)
    ctx.fillStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowBlur = 0;

    // Player direction pointer
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - 8);
    ctx.stroke();
  }
}

// Instantiate game on load
window.addEventListener('DOMContentLoaded', () => {
  new CyberVelocityGame();
});
