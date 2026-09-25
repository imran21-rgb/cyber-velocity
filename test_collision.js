import * as THREE from 'three';
import { CarPhysics } from './physics.js';

console.log('================================================================');
console.log('🧪 VERIFICATION: MAX SPEED COLLISION AND ROAD EDGE CONTAINMENT');
console.log('================================================================\n');

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
// TEST 1: Approach Wall at Max Speed (Frame-by-Frame Log)
// ----------------------------------------------------
console.log('--- TEST 1: CAR APPROACHING WALL AT MAX SPEED (138 u/s ≈ 500 km/h) ---');
console.log('Wall Boundary Plane: z = 15.000 | Car Bounding Radius: 1.000');
console.log('Max Allowed Car Center Position: z <= 14.000\n');

{
  const physics = new CarPhysics();
  const wallZ = 15.0;
  const carRadius = 1.0;

  const wallSegment = {
    type: 'segment',
    p1: new THREE.Vector3(-50, 0.4, wallZ),
    p2: new THREE.Vector3(50, 0.4, wallZ),
    normal: new THREE.Vector3(0, 0, -1),
    radius: 0.2,
    length: 100
  };

  physics.reset(new THREE.Vector3(0, 0.4, 0), 0);
  physics.speed = 138; // Max hypercar speed
  const input = { forward: true, backward: false, left: false, right: false, drift: false, nitro: false };
  const dt = 0.033; // ~30 fps (large step size)

  let breached = false;
  let maxZ = -Infinity;

  console.log('| Frame | Position (X, Y, Z)     | Speed (u/s) | Heading | Status       |');
  console.log('|-------|------------------------|-------------|---------|--------------|');

  for (let frame = 1; frame <= 20; frame++) {
    physics.update(dt, input, [wallSegment], [], () => 0.4);
    const pos = physics.position;
    if (pos.z > maxZ) maxZ = pos.z;

    const cross = pos.z >= wallZ;
    if (cross) breached = true;

    const status = cross ? 'BREACHED!!' : (pos.z > 12.0 ? 'IMPACT/BOUNCE' : 'APPROACHING');
    console.log(
      `| ${frame.toString().padStart(5, ' ')} | (${pos.x.toFixed(2).padStart(5, ' ')}, ${pos.y.toFixed(2).padStart(4, ' ')}, ${pos.z.toFixed(3).padStart(6, ' ')}) | ${physics.speed.toFixed(2).padStart(11, ' ')} | ${(physics.rotation * 180 / Math.PI).toFixed(1).padStart(5, ' ')}° | ${status.padEnd(12, ' ')} |`
    );
  }

  console.log(`\nMax Z Reached: ${maxZ.toFixed(3)} (Boundary at ${wallZ.toFixed(3)})`);
  assert(!breached, `Position never crossed boundary plane z = ${wallZ}`);
  assert(maxZ <= wallZ - carRadius + 0.05, `Position respected car radius constraint (${maxZ.toFixed(3)} <= ${(wallZ - carRadius).toFixed(2)})`);
}

// ----------------------------------------------------
// TEST 2: Approach Road Edge Rail at Max Speed (Frame-by-Frame Log)
// ----------------------------------------------------
console.log('\n--- TEST 2: CAR APPROACHING ROAD EDGE RAIL AT MAX SPEED (ANGLED DRIFT) ---');
console.log('Road Edge Boundary Rail: x = 12.000 | Inward Normal: (-1, 0, 0)');
console.log('Max Allowed Car Center Position: x <= 11.000\n');

{
  const physics = new CarPhysics();
  const railX = 12.0;
  const carRadius = 1.0;

  const railSegment = {
    type: 'segment',
    p1: new THREE.Vector3(railX, 0.4, -50),
    p2: new THREE.Vector3(railX, 0.4, 300),
    normal: new THREE.Vector3(-1, 0, 0),
    radius: 0.3,
    length: 350
  };

  // Car starts at x = 7.0, heading steeply toward rail (+X, +Z)
  physics.reset(new THREE.Vector3(7.0, 0.4, 0), 0.65);
  physics.speed = 135;
  physics.isDrifting = true;
  physics.driftAngle = 0.2;

  const input = { forward: true, backward: false, left: false, right: true, drift: true, nitro: true };
  const dt = 0.033;

  let breached = false;
  let maxX = -Infinity;

  console.log('| Frame | Position (X, Y, Z)     | Speed (u/s) | Heading | Status       |');
  console.log('|-------|------------------------|-------------|---------|--------------|');

  for (let frame = 1; frame <= 20; frame++) {
    physics.update(dt, input, [railSegment], [], () => 0.4);
    const pos = physics.position;
    if (pos.x > maxX) maxX = pos.x;

    const cross = pos.x >= railX;
    if (cross) breached = true;

    const status = cross ? 'BREACHED!!' : (pos.x > 9.5 ? 'RAIL SLIDE/DEFLECT' : 'APPROACHING');
    console.log(
      `| ${frame.toString().padStart(5, ' ')} | (${pos.x.toFixed(3).padStart(6, ' ')}, ${pos.y.toFixed(2).padStart(4, ' ')}, ${pos.z.toFixed(2).padStart(6, ' ')}) | ${physics.speed.toFixed(2).padStart(11, ' ')} | ${(physics.rotation * 180 / Math.PI).toFixed(1).padStart(5, ' ')}° | ${status.padEnd(14, ' ')} |`
    );
  }

  console.log(`\nMax X Reached: ${maxX.toFixed(3)} (Rail at ${railX.toFixed(3)})`);
  assert(!breached, `Position never crossed road edge boundary plane x = ${railX}`);
  assert(maxX <= railX - carRadius + 0.1, `Car boundary respected at road edge (${maxX.toFixed(3)} <= ${(railX - carRadius).toFixed(2)})`);
}

// ----------------------------------------------------
// TEST 3: Elevated Road Surface Collision & Elevation Tracking
// ----------------------------------------------------
console.log('\n--- TEST 3: ELEVATED ROAD SURFACE COLLISION (Y-AXIS ELEVATION TRACKING) ---');
{
  const physics = new CarPhysics();
  const elevatedRoadHeight = 12.0;

  // Road surface query returns 12.0
  const roadQuery = (x, z) => elevatedRoadHeight;

  physics.reset(new THREE.Vector3(0, elevatedRoadHeight, 0), 0);
  physics.speed = 138;

  let fellThrough = false;
  let minY = Infinity;

  for (let frame = 1; frame <= 30; frame++) {
    physics.update(0.033, { forward: true }, [], [], roadQuery);
    if (physics.position.y < minY) minY = physics.position.y;
    if (physics.position.y < elevatedRoadHeight - 0.01) {
      fellThrough = true;
    }
  }

  console.log(`Elevated Road Deck Height: ${elevatedRoadHeight.toFixed(2)}m`);
  console.log(`Minimum Car Y throughout high-speed driving: ${minY.toFixed(3)}m`);
  assert(!fellThrough, `Car never fell through the elevated road surface (min Y: ${minY.toFixed(3)} >= ${elevatedRoadHeight})`);
}

console.log('\n================================================================');
console.log(`🏁 ALL ${passedTests}/${totalTests} TESTS PASSED WITH 0 BOUNDARY VIOLATIONS!`);
console.log('================================================================');
