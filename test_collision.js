import * as THREE from 'three';
import { CarPhysics } from './physics.js';

console.log('====================================================');
console.log('🧪 RUNNING HEADLESS CONTINUOUS COLLISION (CCD) TESTS');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  }
}

// ----------------------------------------------------
// TEST 1: Direct High-Speed Head-on Wall Impact
// ----------------------------------------------------
console.log('--- TEST 1: 500 KM/H DIRECT IMPACT AGAINST THIN BARRIER ---');
{
  const physics = new CarPhysics();
  const wallZ = 15.0;
  const carRadius = 1.0;

  // Thin barrier segment spanning across X at Z = 15
  const wallSegment = {
    type: 'segment',
    p1: new THREE.Vector3(-100, 0.4, wallZ),
    p2: new THREE.Vector3(100, 0.4, wallZ),
    normal: new THREE.Vector3(0, 0, -1), // faces towards car (origin)
    radius: 0.2,
    length: 200
  };

  physics.reset(new THREE.Vector3(0, 0.4, 0), 0); // At (0, 0.4, 0), heading +Z
  physics.speed = 138; // ~500 km/h
  const input = { forward: true, backward: false, left: false, right: false, drift: false, nitro: false };

  const dt = 0.05; // Large delta where travel per frame is 6.9 units!
  let breachedBoundary = false;
  let maxZReached = -Infinity;
  let bounceDetected = false;

  console.log(`Initial position: z = ${physics.position.z.toFixed(2)}, speed = ${physics.speed.toFixed(2)} units/s`);
  console.log(`Barrier location: z = ${wallZ.toFixed(2)}, car radius = ${carRadius.toFixed(2)}`);

  for (let frame = 1; frame <= 60; frame++) {
    const prevZ = physics.position.z;
    physics.update(dt, input, [wallSegment], []);
    const currZ = physics.position.z;

    if (currZ > maxZReached) maxZReached = currZ;

    // Check if the car penetrated beyond the barrier plane
    if (currZ >= wallZ) {
      breachedBoundary = true;
      console.error(`Frame ${frame}: Tunneling occurred! z = ${currZ.toFixed(3)} >= wallZ ${wallZ}`);
      break;
    }

    // Check velocity reflection
    if (prevZ > 10.0 && physics.position.z < prevZ) {
      bounceDetected = true;
    }

    if (frame % 10 === 0 || bounceDetected && frame <= 15) {
      console.log(`  Frame ${frame.toString().padStart(2, ' ')}: z = ${currZ.toFixed(3)}, speed = ${physics.speed.toFixed(2)}, heading = ${(physics.rotation * 180 / Math.PI).toFixed(1)}°`);
    }
  }

  assert(!breachedBoundary, `Car never breached wall boundary at z = ${wallZ} (Max z reached: ${maxZReached.toFixed(3)})`);
  assert(maxZReached <= wallZ - carRadius + 0.05, `Car stopped within physical contact boundary (Max z: ${maxZReached.toFixed(3)} <= ${(wallZ - carRadius).toFixed(2)})`);
  assert(bounceDetected, `Collision response actively reflected velocity along the collision normal`);
}

console.log('\n--- TEST 2: HIGH-SPEED ANGLED DRIFT INTO ROAD EDGE RAIL ---');
{
  const physics = new CarPhysics();
  const railX = 12.0;
  const carRadius = 1.0;

  // Longitudinal highway rail segment along Z at X = 12
  const railSegment = {
    type: 'segment',
    p1: new THREE.Vector3(railX, 0.4, -50),
    p2: new THREE.Vector3(railX, 0.4, 500),
    normal: new THREE.Vector3(-1, 0, 0), // faces inward toward track center (-X)
    radius: 0.3,
    length: 550
  };

  physics.reset(new THREE.Vector3(8.0, 0.4, 0), 0.35); // heading towards +X and +Z
  physics.speed = 125;
  physics.isDrifting = true;
  physics.driftAngle = 0.3;

  const input = { forward: true, backward: false, left: false, right: true, drift: true, nitro: true };
  const dt = 0.033;
  let breachedRail = false;
  let maxXReached = -Infinity;

  for (let frame = 1; frame <= 80; frame++) {
    physics.update(dt, input, [railSegment], []);
    const currX = physics.position.x;
    if (currX > maxXReached) maxXReached = currX;

    if (currX >= railX) {
      breachedRail = true;
      console.error(`Frame ${frame}: Car breached side rail! x = ${currX.toFixed(3)} >= railX ${railX}`);
      break;
    }
  }

  assert(!breachedRail, `Car contained by side rail at x = ${railX} (Max x reached: ${maxXReached.toFixed(3)})`);
  assert(maxXReached <= railX - carRadius + 0.1, `Car boundary respected on angled impact (Max x: ${maxXReached.toFixed(3)})`);
}

console.log('\n--- TEST 3: EXTREME TUNNELING ATTEMPT (12 UNITS PER FRAME DISPLACEMENT) ---');
{
  const physics = new CarPhysics();
  const thinWallZ = 5.0;

  const thinWall = {
    type: 'segment',
    p1: new THREE.Vector3(-50, 0.4, thinWallZ),
    p2: new THREE.Vector3(50, 0.4, thinWallZ),
    normal: new THREE.Vector3(0, 0, -1),
    radius: 0.1, // razor-thin 0.1 radius
    length: 100
  };

  physics.reset(new THREE.Vector3(0, 0.4, 0), 0);
  physics.speed = 150; // 150 units/s
  const largeDt = 0.08; // 150 * 0.08 = 12 units of travel! Wall is at 5 units.

  physics.update(largeDt, { forward: true }, [thinWall], []);

  console.log(`After 1 frame of 12.0-unit displacement: position z = ${physics.position.z.toFixed(3)}`);
  assert(physics.position.z < thinWallZ, `Swept ray/substep prevented tunneling on 12-unit frame leap (z = ${physics.position.z.toFixed(3)} < ${thinWallZ})`);
}

console.log('\n====================================================');
console.log(`🏁 ALL ${passedTests}/${totalTests} COLLISION SYSTEM TESTS PASSED SUCCESSFULLY!`);
console.log('====================================================');
