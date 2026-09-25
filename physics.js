import * as THREE from 'three';
import { audioEngine } from './audioEngine.js';

// Arcade Cyber Hypercar Physics Engine
export class CarPhysics {
  constructor() {
    this.reset();
  }

  reset(startPos = new THREE.Vector3(0, 0.4, 10), startAngle = 0) {
    this.position = startPos.clone();
    this.rotation = startAngle; // Yaw heading in radians
    this.pitch = 0;
    this.roll = 0;

    this.speed = 0;            // Forward velocity magnitude
    this.vy = 0;               // Vertical velocity for jumping / gravity
    this.isAirborne = false;
    this.lateralVelocity = 0;  // Drift slip velocity

    this.steeringAngle = 0;
    this.nitroAmount = 100;    // 0 to 100%
    this.isNitroActive = false;
    this.isDrifting = false;
    this.driftAngle = 0;
    this.driftScore = 0;
    this.currentDriftPoints = 0;

    this.gear = 1;
    this.rpm = 1000;
    this.gForce = 0;

    // Active car specs reference
    this.specs = {
      maxSpeed: 135,
      accelRate: 50,
      brakeRate: 65,
      turnSpeed: 2.3,
      driftFactor: 0.95,
      mass: 1200,
      downforce: 2.5
    };
  }

  setCarSpecs(physicsSpecs) {
    this.specs = { ...this.specs, ...physicsSpecs };
  }

  update(delta, input, colliders, boostPads, roadQuery) {
    if (delta > 0.1) delta = 0.1; // prevent physics tunneling on lag spikes

    // 1. INPUT PROCESSING
    const throttle = input.forward ? 1 : 0;
    const brake = input.backward ? 1 : 0;
    const steerLeft = input.left ? 1 : 0;
    const steerRight = input.right ? 1 : 0;
    const driftKey = input.drift;
    const nitroKey = input.nitro;

    // 2. NITRO BOOST
    if (nitroKey && this.nitroAmount > 0 && this.speed > 5) {
      this.isNitroActive = true;
      this.nitroAmount = Math.max(0, this.nitroAmount - 35 * delta);
      audioEngine.setNitro(true);
    } else {
      this.isNitroActive = false;
      // Recharging slowly
      this.nitroAmount = Math.min(100, this.nitroAmount + 8 * delta);
      audioEngine.setNitro(false);
    }

    // 3. ACCELERATION & BRAKING
    let accelMultiplier = this.isNitroActive ? 1.85 : 1.0;
    let targetMaxSpeed = this.isNitroActive ? this.specs.maxSpeed * 1.25 : this.specs.maxSpeed;

    if (throttle > 0) {
      if (this.speed < 0) {
        // Braking while reversing
        this.speed += this.specs.brakeRate * delta;
      } else {
        // Forward acceleration
        const powerCurve = 1.0 - (this.speed / targetMaxSpeed) * 0.45;
        this.speed += this.specs.accelRate * powerCurve * accelMultiplier * delta;
        if (this.speed > targetMaxSpeed) this.speed = targetMaxSpeed;
      }
    } else if (brake > 0) {
      if (this.speed > 0) {
        // Hard braking
        this.speed -= this.specs.brakeRate * delta;
        if (this.speed < 0) this.speed = 0;
      } else {
        // Reverse
        this.speed -= this.specs.accelRate * 0.45 * delta;
        if (this.speed < -25) this.speed = -25;
      }
    } else {
      // Natural rolling friction / aerodynamic air resistance
      const airResistance = 0.008 * (this.speed * this.speed) * Math.sign(this.speed);
      const rollingFriction = 7.0 * Math.sign(this.speed);
      const totalDrag = (airResistance + rollingFriction) * delta;

      if (Math.abs(this.speed) <= Math.abs(totalDrag)) {
        this.speed = 0;
      } else {
        this.speed -= totalDrag;
      }
    }

    // 4. STEERING DYNAMICS
    const steerInput = (steerRight - steerLeft);
    // Steering sensitivity reduces at ultra-high speeds for realism and stability
    const speedRatio = Math.abs(this.speed) / this.specs.maxSpeed;
    const steerFactor = 1.0 - Math.min(0.65, speedRatio * 0.7);

    const targetSteering = steerInput * (this.specs.turnSpeed * 0.02) * steerFactor;
    this.steeringAngle += (targetSteering - this.steeringAngle) * 12 * delta;

    // 5. DRIFTING & SLIP ANGLE
    if (driftKey && Math.abs(this.speed) > 18 && steerInput !== 0) {
      this.isDrifting = true;
      const targetDriftAngle = -steerInput * 0.45;
      this.driftAngle += (targetDriftAngle - this.driftAngle) * 6 * delta;

      // Accumulate drift score
      const driftPointsIncrement = Math.floor(Math.abs(this.speed) * Math.abs(this.driftAngle) * 35 * delta);
      this.currentDriftPoints += driftPointsIncrement;
      this.driftScore += driftPointsIncrement;

      audioEngine.setDrift(true, Math.abs(this.driftAngle) * 2.5);
    } else {
      if (this.isDrifting) {
        // Drift ended
        this.currentDriftPoints = 0;
      }
      this.isDrifting = false;
      this.driftAngle *= Math.pow(0.05, delta);
      audioEngine.setDrift(false);
    }

    // Heading yaw rotation
    const turnMovement = this.speed * Math.sin(this.steeringAngle) * 0.6;
    this.rotation -= turnMovement * delta;

    // 6. CONTINUOUS DISPLACEMENT & SWEPT COLLISION DETECTION (CCD)
    // Fixed substepping guarantees no high-speed tunneling through thin geometry
    const numSubsteps = Math.max(2, Math.ceil(delta / 0.005));
    const subDelta = delta / numSubsteps;

    for (let step = 0; step < numSubsteps; step++) {
      const effectiveAngle = this.rotation + this.driftAngle;
      const forwardX = Math.sin(effectiveAngle);
      const forwardZ = Math.cos(effectiveAngle);

      const prevPos = this.position.clone();
      const nextPos = this.position.clone();
      nextPos.x += forwardX * this.speed * subDelta;
      nextPos.z += forwardZ * this.speed * subDelta;

      this.resolveCollisions(prevPos, nextPos, colliders);
      this.position.copy(nextPos);
    }

    // 7. VERTICAL ELEVATION & ROAD SURFACE COLLISION
    const groundLevel = roadQuery ? roadQuery(this.position.x, this.position.z) : 0.4;
    if (this.isAirborne) {
      this.vy -= 28.0 * delta; // Gravity
      this.position.y += this.vy * delta;

      // Airborne rotation stabilization
      this.pitch *= Math.pow(0.1, delta);
      this.roll *= Math.pow(0.1, delta);

      if (this.position.y <= groundLevel) {
        this.position.y = groundLevel;
        this.vy = 0;
        this.isAirborne = false;
      }
    } else {
      // Road surface collision response
      if (this.position.y < groundLevel) {
        this.position.y = groundLevel;
        this.vy = 0;
      } else if (this.position.y > groundLevel + 0.6) {
        // Airborne when flying off an elevated section
        this.isAirborne = true;
      } else {
        this.position.y += (groundLevel - this.position.y) * Math.min(1.0, 22 * delta);
      }

      // Pitch/roll react to steering and acceleration
      this.pitch = -(throttle - brake) * 0.04;
      this.roll = this.steeringAngle * 1.5;
    }

    // 8. BOOST PADS TRIGGER
    if (boostPads && boostPads.length > 0) {
      for (const pad of boostPads) {
        const dist = this.position.distanceTo(pad.position);
        if (dist < pad.radius) {
          // Launch hyper-boost!
          this.speed = Math.min(targetMaxSpeed * 1.35, this.speed + 45);
          this.nitroAmount = 100; // instant recharge!
          audioEngine.playBoostPadSound();
          break;
        }
      }
    }

    // 10. TRANSMISSION GEARS & VIRTUAL RPM CALCULATION
    this.calculateGearsAndRPM(throttle);

    // G-Force estimate
    this.gForce = (Math.abs(turnMovement) * 0.4 + (this.isNitroActive ? 1.4 : 0.4)).toFixed(1);

    // Update audio engine
    const rpmNorm = (this.rpm - 1000) / 8000;
    const speedRatioAud = Math.abs(this.speed) / this.specs.maxSpeed;
    audioEngine.updateEngine(rpmNorm, throttle, speedRatioAud);
  }

  calculateGearsAndRPM(throttle) {
    const absSpeedKmh = Math.abs(this.speed) * 3.6;

    if (this.speed < -1) {
      this.gear = 'R';
      this.rpm = 1500 + (Math.abs(absSpeedKmh) / 60) * 4500;
      return;
    }

    const gearThresholds = [0, 60, 130, 210, 300, 390, 470, 560];
    let currentGear = 1;

    for (let i = 1; i < gearThresholds.length; i++) {
      if (absSpeedKmh >= gearThresholds[i]) {
        currentGear = i + 1;
      }
    }

    if (currentGear !== this.gear && this.gear !== 'R') {
      audioEngine.playGearShift();
    }
    this.gear = currentGear;

    const lowerBound = gearThresholds[this.gear - 1] || 0;
    const upperBound = gearThresholds[this.gear] || 600;
    const gearProgress = Math.min(1.0, Math.max(0.0, (absSpeedKmh - lowerBound) / (upperBound - lowerBound)));

    this.rpm = 1800 + gearProgress * 6800 + (throttle ? 400 : 0);
  }

  // Trigger jump from ramp
  launchJump(verticalVelocity = 12) {
    this.isAirborne = true;
    this.vy = verticalVelocity;
  }

  // Continuous Swept Collision Detection (CCD)
  resolveCollisions(prevPos, nextPos, colliders) {
    if (!colliders || colliders.length === 0) return;

    const carRadius = 1.0;
    const px0 = prevPos.x;
    const pz0 = prevPos.z;
    const px1 = nextPos.x;
    const pz1 = nextPos.z;
    const moveX = px1 - px0;
    const moveZ = pz1 - pz0;

    let hitOccurred = false;
    let contactNormal = null;

    for (let i = 0; i < colliders.length; i++) {
      const col = colliders[i];

      // 1. Continuous Segment Collider (Road Barrier Rails)
      if (col.type === 'segment') {
        const p1 = col.p1;
        const p2 = col.p2;

        // Bounding box filter for quick rejection
        const minX = Math.min(p1.x, p2.x) - 4.0;
        const maxX = Math.max(p1.x, p2.x) + 4.0;
        const minZ = Math.min(p1.z, p2.z) - 4.0;
        const maxZ = Math.max(p1.z, p2.z) + 4.0;

        if ((px1 < minX || px1 > maxX || pz1 < minZ || pz1 > maxZ) &&
            (px0 < minX || px0 > maxX || pz0 < minZ || pz0 > maxZ)) {
          continue;
        }

        const wx = p2.x - p1.x;
        const wz = p2.z - p1.z;
        const segLenSq = wx * wx + wz * wz;
        if (segLenSq < 0.0001) continue;

        // A. Swept Ray-Segment Crossing Check
        // Checks if the displacement trajectory crossed the barrier line segment
        const det = moveX * wz - moveZ * wx;
        if (Math.abs(det) > 1e-6) {
          const u = ((p1.x - px0) * wz - (p1.z - pz0) * wx) / det;
          const v = ((p1.x - px0) * moveZ - (p1.z - pz0) * moveX) / det;
          if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
            hitOccurred = true;
            contactNormal = col.normal.clone();
            // Clamp position back to contact point + car radius offset along normal
            nextPos.x = px0 + u * moveX + contactNormal.x * carRadius;
            nextPos.z = pz0 + u * moveZ + contactNormal.z * carRadius;
            break;
          }
        }

        // B. Proximity / Penetration Overlap Check
        const t = Math.max(0, Math.min(1, ((nextPos.x - p1.x) * wx + (nextPos.z - p1.z) * wz) / segLenSq));
        const nearX = p1.x + t * wx;
        const nearZ = p1.z + t * wz;
        const dx = nextPos.x - nearX;
        const dz = nextPos.z - nearZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const effectiveRadius = carRadius + (col.radius || 0.6);

        if (dist < effectiveRadius) {
          hitOccurred = true;
          const pen = effectiveRadius - dist;
          contactNormal = col.normal.clone();
          if (dx * contactNormal.x + dz * contactNormal.z < 0) {
            nextPos.x = nearX + contactNormal.x * effectiveRadius;
            nextPos.z = nearZ + contactNormal.z * effectiveRadius;
          } else {
            nextPos.x += contactNormal.x * pen;
            nextPos.z += contactNormal.z * pen;
          }
          break;
        }
      }

      // 2. Cylinder Obstacles (Gantry Pillars)
      else if (col.type === 'cylinder') {
        const dx = nextPos.x - col.pos.x;
        const dz = nextPos.z - col.pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const effectiveRadius = carRadius + col.radius;
        if (dist < effectiveRadius) {
          hitOccurred = true;
          const n = dist > 0.001 ? new THREE.Vector3(dx / dist, 0, dz / dist) : new THREE.Vector3(0, 0, 1);
          contactNormal = n;
          nextPos.x = col.pos.x + n.x * effectiveRadius;
          nextPos.z = col.pos.z + n.z * effectiveRadius;
          break;
        }
      }

      // 3. Box Obstacles (Skyscrapers)
      else if (col.type === 'box') {
        const clampedX = Math.max(col.min.x, Math.min(col.max.x, nextPos.x));
        const clampedZ = Math.max(col.min.z, Math.min(col.max.z, nextPos.z));
        const dx = nextPos.x - clampedX;
        const dz = nextPos.z - clampedZ;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < carRadius) {
          hitOccurred = true;
          let nx = 0, nz = 0;
          if (Math.abs(dx) > Math.abs(dz)) {
            nx = dx >= 0 ? 1 : -1;
          } else {
            nz = dz >= 0 ? 1 : -1;
          }
          contactNormal = new THREE.Vector3(nx, 0, nz);
          nextPos.x = clampedX + nx * carRadius;
          nextPos.z = clampedZ + nz * carRadius;
          break;
        }
      }

      // 4. Jump Ramp Trigger
      else if (col.type === 'ramp') {
        const dx = nextPos.x - col.pos.x;
        const dz = nextPos.z - col.pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < (col.radius || 8.0) && !this.isAirborne && this.speed > 15) {
          this.launchJump(col.launchVelocity || 16);
          audioEngine.playBoostPadSound();
        }
      }

      // 5. Fallback radial colliders
      else if (col.pos && col.radius) {
        const d = nextPos.distanceTo(col.pos);
        if (d < col.radius + carRadius) {
          hitOccurred = true;
          contactNormal = col.normal ? col.normal.clone() : new THREE.Vector3().subVectors(nextPos, col.pos).normalize();
          const pen = (col.radius + carRadius) - d;
          nextPos.addScaledVector(contactNormal, pen);
          break;
        }
      }
    }

    // Velocity Response
    if (hitOccurred && contactNormal) {
      this.applyCollisionResponse(contactNormal);
    }
  }

  // Collision Response: reflect/dampen velocity along contact normal
  applyCollisionResponse(normal) {
    const effectiveAngle = this.rotation + this.driftAngle;
    const currentVel = new THREE.Vector3(
      Math.sin(effectiveAngle) * this.speed,
      0,
      Math.cos(effectiveAngle) * this.speed
    );

    const vDotN = currentVel.dot(normal);

    // Only respond if moving toward the boundary
    if (vDotN < 0) {
      const impactIntensity = Math.min(1.0, Math.abs(vDotN) / 40);
      audioEngine.playCollisionImpact(impactIntensity);
      this.justCollided = true;
      this.impactIntensity = impactIntensity;

      const restitution = 0.35; // bounce factor
      const friction = 0.88;    // tangential friction

      // Decompose: v = v_tangent + v_normal
      const vNormal = normal.clone().multiplyScalar(vDotN);
      const vTangent = new THREE.Vector3().subVectors(currentVel, vNormal);

      // Reflected velocity: tangential damped, normal reversed
      const newVel = vTangent.multiplyScalar(friction).add(vNormal.multiplyScalar(-restitution));

      this.speed = newVel.length();
      if (this.speed > 0.1) {
        const newHeading = Math.atan2(newVel.x, newVel.z);
        this.rotation = newHeading;
        this.driftAngle = 0;
      }
    }
  }
}
