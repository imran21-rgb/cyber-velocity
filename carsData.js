// Database of iconic futuristic hypercars from world-renowned manufacturers
export const CARS_DATA = [
  {
    id: 'bugatti',
    brand: 'BUGATTI',
    model: 'BOLIDE 2099 // QUANTUM',
    origin: 'FRANCE // MOLSHEIM',
    desc: 'Quad-turbo W16 quantum hybrid with hyper-stabilized active aerodynamics and quad-plasma rear thrusters.',
    specs: {
      speed: 98,
      speedVal: '500 KM/H',
      accel: 95,
      accelVal: '1.4s',
      handling: 90,
      handlingVal: '9.4 / 10',
      nitro: 96,
      nitroVal: 'HYPER'
    },
    physics: {
      maxSpeed: 138, // in units (~500 km/h)
      accelRate: 48,
      brakeRate: 65,
      turnSpeed: 2.2,
      driftFactor: 0.96,
      mass: 1250,
      downforce: 2.5
    },
    defaultPaint: '#0033ff',
    paints: ['#0033ff', '#00f3ff', '#111111', '#ffffff', '#ff0055', '#ffe600'],
    defaultUnderglow: '#00f3ff',
    underglows: ['#00f3ff', '#ff0055', '#00ff66', '#9d00ff', '#ffe600'],
    accentColor: '#00f3ff'
  },
  {
    id: 'lamborghini',
    brand: 'LAMBORGHINI',
    model: 'TERZO MILLENNIO // CYBER-V12',
    origin: 'ITALY // SANT’AGATA',
    desc: 'Self-healing carbon nanotube bodywork with supercapacitor storage and signature Y-laser blade optics.',
    specs: {
      speed: 94,
      speedVal: '460 KM/H',
      accel: 97,
      accelVal: '1.3s',
      handling: 94,
      handlingVal: '9.6 / 10',
      nitro: 92,
      nitroVal: 'OVERDRIVE'
    },
    physics: {
      maxSpeed: 128,
      accelRate: 52,
      brakeRate: 70,
      turnSpeed: 2.4,
      driftFactor: 0.98,
      mass: 1180,
      downforce: 2.8
    },
    defaultPaint: '#ff8800',
    paints: ['#ff8800', '#ffe600', '#111111', '#00ff66', '#ff0033', '#4400cc'],
    defaultUnderglow: '#ffaa00',
    underglows: ['#ffaa00', '#ffe600', '#ff0055', '#00f3ff', '#00ff66'],
    accentColor: '#ffaa00'
  },
  {
    id: 'ferrari',
    brand: 'FERRARI',
    model: 'VISION GT // CYBER-ROSSO',
    origin: 'ITALY // MARANELLO',
    desc: 'Pure aerodynamic poetry sculpted with three-motor hybrid electric KERS and razor-thin photonic taillight wing.',
    specs: {
      speed: 95,
      speedVal: '475 KM/H',
      accel: 94,
      accelVal: '1.5s',
      handling: 97,
      handlingVal: '9.8 / 10',
      nitro: 94,
      nitroVal: 'KERS BOOST'
    },
    physics: {
      maxSpeed: 132,
      accelRate: 50,
      brakeRate: 68,
      turnSpeed: 2.5,
      driftFactor: 0.94,
      mass: 1220,
      downforce: 2.7
    },
    defaultPaint: '#e60000',
    paints: ['#e60000', '#111111', '#ffe600', '#ffffff', '#0033aa', '#333333'],
    defaultUnderglow: '#ff0033',
    underglows: ['#ff0033', '#ffe600', '#ffffff', '#00f3ff', '#9d00ff'],
    accentColor: '#ff0033'
  },
  {
    id: 'porsche',
    brand: 'PORSCHE',
    model: 'MISSION X // NEO-STUTTGART',
    origin: 'GERMANY // ZUFFENHAUSEN',
    desc: 'Lightweight hyper-concept with 1:1 power-to-weight ratio, 900-volt system architecture, and Le Mans aero canopy.',
    specs: {
      speed: 92,
      speedVal: '450 KM/H',
      accel: 98,
      accelVal: '1.2s',
      handling: 98,
      handlingVal: '9.9 / 10',
      nitro: 93,
      nitroVal: 'TURBO S'
    },
    physics: {
      maxSpeed: 125,
      accelRate: 54,
      brakeRate: 75,
      turnSpeed: 2.6,
      driftFactor: 0.92,
      mass: 1150,
      downforce: 3.0
    },
    defaultPaint: '#a0aab5',
    paints: ['#a0aab5', '#ffffff', '#111111', '#00e5ff', '#ff3300', '#00bb44'],
    defaultUnderglow: '#00ff66',
    underglows: ['#00ff66', '#00f3ff', '#ffffff', '#ffaa00', '#9d00ff'],
    accentColor: '#00ff66'
  },
  {
    id: 'tesla',
    brand: 'TESLA',
    model: 'CYBER-APEX // SPACEX HYPERDRIVE',
    origin: 'USA // AUSTIN',
    desc: 'Cold-gas rocket thruster package with cold-rolled 30X exoskeleton and instant neural-flux vectoring torque.',
    specs: {
      speed: 96,
      speedVal: '480 KM/H',
      accel: 100,
      accelVal: '1.1s',
      handling: 88,
      handlingVal: '8.9 / 10',
      nitro: 99,
      nitroVal: 'ROCKET CORE'
    },
    physics: {
      maxSpeed: 133,
      accelRate: 60,
      brakeRate: 62,
      turnSpeed: 2.1,
      driftFactor: 0.99,
      mass: 1380,
      downforce: 2.2
    },
    defaultPaint: '#778899',
    paints: ['#778899', '#151515', '#ffffff', '#cc0000', '#00ccff', '#ffaa00'],
    defaultUnderglow: '#00f3ff',
    underglows: ['#00f3ff', '#ff0033', '#ffffff', '#9d00ff', '#ffe600'],
    accentColor: '#00f3ff'
  },
  {
    id: 'mclaren',
    brand: 'MCLAREN',
    model: 'SOLUS GT // APEX-2099',
    origin: 'UK // WOKING',
    desc: 'Track-exclusive central jet canopy single-seater with twin aerodynamic ground-effect venturis.',
    specs: {
      speed: 93,
      speedVal: '455 KM/H',
      accel: 96,
      accelVal: '1.35s',
      handling: 99,
      handlingVal: '10 / 10',
      nitro: 91,
      nitroVal: 'DRS AERO'
    },
    physics: {
      maxSpeed: 126,
      accelRate: 53,
      brakeRate: 74,
      turnSpeed: 2.7,
      driftFactor: 0.91,
      mass: 1100,
      downforce: 3.2
    },
    defaultPaint: '#ff5500',
    paints: ['#ff5500', '#00d0ff', '#111111', '#ffffff', '#330088', '#00ff88'],
    defaultUnderglow: '#ff6600',
    underglows: ['#ff6600', '#00f3ff', '#9d00ff', '#00ff66', '#ffffff'],
    accentColor: '#ff5500'
  },
  {
    id: 'koenigsegg',
    brand: 'KOENIGSEGG',
    model: 'JESKO // QUANTUM-ABSOLUT',
    origin: 'SWEDEN // ÄNGELHOLM',
    desc: 'Dual fighter-jet fins, active twin-turbo plasma chamber, and highest terminal theoretical velocity.',
    specs: {
      speed: 100,
      speedVal: '525 KM/H',
      accel: 93,
      accelVal: '1.6s',
      handling: 91,
      handlingVal: '9.2 / 10',
      nitro: 97,
      nitroVal: 'WARP COUPLER'
    },
    physics: {
      maxSpeed: 145,
      accelRate: 49,
      brakeRate: 66,
      turnSpeed: 2.3,
      driftFactor: 0.95,
      mass: 1290,
      downforce: 2.4
    },
    defaultPaint: '#222225',
    paints: ['#222225', '#ffffff', '#ffaa00', '#ff0044', '#00e5ff', '#3300aa'],
    defaultUnderglow: '#ffaa00',
    underglows: ['#ffaa00', '#00f3ff', '#ff0055', '#00ff66', '#ffffff'],
    accentColor: '#ffaa00'
  },
  {
    id: 'astonmartin',
    brand: 'ASTON MARTIN',
    model: 'VALKYRIE // AMR PRO 2099',
    origin: 'UK // GAYDON',
    desc: 'F1 venturi tunnel hyperstructure, teardrop pilot capsule, and naturally aspirated V12 hybrid banshee scream.',
    specs: {
      speed: 94,
      speedVal: '465 KM/H',
      accel: 95,
      accelVal: '1.45s',
      handling: 96,
      handlingVal: '9.7 / 10',
      nitro: 95,
      nitroVal: 'F1 KERS'
    },
    physics: {
      maxSpeed: 129,
      accelRate: 51,
      brakeRate: 72,
      turnSpeed: 2.6,
      driftFactor: 0.93,
      mass: 1160,
      downforce: 3.1
    },
    defaultPaint: '#004d40',
    paints: ['#004d40', '#00a86b', '#111111', '#ffffff', '#ffaa00', '#0099ff'],
    defaultUnderglow: '#00ffaa',
    underglows: ['#00ffaa', '#00f3ff', '#ffe600', '#ff0055', '#9d00ff'],
    accentColor: '#00ffaa'
  }
];
