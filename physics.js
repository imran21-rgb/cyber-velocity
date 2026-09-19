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

  update(delta, input, colliders, boostPads) {
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

    // 6. DISPLACEMENT VECTOR
    const effectiveAngle = this.rotation + this.driftAngle;
    const forwardX = Math.sin(effectiveAngle);
    const forwardZ = Math.cos(effectiveAngle);

    this.position.x += forwardX * this.speed * delta;
    this.position.z += forwardZ * this.speed * delta;

    // 7. VERTICAL ELEVATION & JUMP PHYSICS
    const groundLevel = 0.4;
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
      this.position.y = groundLevel;
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

    // 9. COLLISION REFLECTION WITH ROAD RAILS
    if (colliders && colliders.length > 0) {
      for (const col of colliders) {
        const d = this.position.distanceTo(col.pos);
        if (d < col.radius) {
          // Soft collision bounce
          const push = col.normal.clone().multiplyScalar((col.radius - d) * 1.2);
          this.position.add(push);
          this.speed *= 0.88; // slight speed scrub
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
}
