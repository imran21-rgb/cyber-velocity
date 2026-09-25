// Web Audio API Procedural Sound Synthesizer with Custom Acoustic Profiles for Every Car
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initialized = false;

    // Engine sound nodes
    this.engineGain = null;
    this.engineFilter = null;

    // Oscillators and individual gain controls for 3 harmonic layers
    this.engineSub = null;
    this.subGainNode = null;

    this.engineMid = null;
    this.midGainNode = null;

    this.engineHigh = null;
    this.highGainNode = null;

    // Electric stator / thruster noise layer for EV/hybrid cars (e.g. Tesla / SpaceX)
    this.thrusterNoiseGain = null;
    this.thrusterNoiseFilter = null;

    // Nitro sound nodes
    this.nitroGain = null;
    this.nitroNoise = null;
    this.nitroFilter = null;

    // Drift / Tire screech nodes
    this.driftGain = null;
    this.driftFilter = null;

    // Synthwave music synth
    this.musicGain = null;
    this.synthTimer = null;
    this.musicPlaying = false;

    // Active car profile defaults
    this.activeProfile = {
      name: 'Standard Hypercar',
      subWave: 'sawtooth',
      midWave: 'triangle',
      highWave: 'sine',
      baseFreq: 45,
      rpmFreqMultiplier: 200,
      midHarmonic: 2.2,
      turboHarmonic: 6.0,
      filterCutoffBase: 500,
      filterCutoffRpm: 3200,
      filterQ: 3.0,
      volume: 1.0,
      subGain: 0.7,
      midGain: 0.5,
      highGain: 0.4,
      gearShiftPitch: 260,
      isElectric: false
    };
  }

  init() {
    if (this.initialized) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // ================= 1. ENGINE SYNTHESIZER =================
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(this.activeProfile.filterQ, this.ctx.currentTime);

    // Sub Layer
    this.engineSub = this.ctx.createOscillator();
    this.engineSub.type = this.activeProfile.subWave;
    this.subGainNode = this.ctx.createGain();
    this.subGainNode.gain.setValueAtTime(this.activeProfile.subGain, this.ctx.currentTime);
    this.engineSub.connect(this.subGainNode);
    this.subGainNode.connect(this.engineFilter);

    // Mid Harmonic Layer
    this.engineMid = this.ctx.createOscillator();
    this.engineMid.type = this.activeProfile.midWave;
    this.midGainNode = this.ctx.createGain();
    this.midGainNode.gain.setValueAtTime(this.activeProfile.midGain, this.ctx.currentTime);
    this.engineMid.connect(this.midGainNode);
    this.midGainNode.connect(this.engineFilter);

    // High Turbo / Stator Whine Layer
    this.engineHigh = this.ctx.createOscillator();
    this.engineHigh.type = this.activeProfile.highWave;
    this.highGainNode = this.ctx.createGain();
    this.highGainNode.gain.setValueAtTime(this.activeProfile.highGain, this.ctx.currentTime);
    this.engineHigh.connect(this.highGainNode);
    this.highGainNode.connect(this.engineFilter);

    // Filter to Engine Master Gain
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineSub.start();
    this.engineMid.start();
    this.engineHigh.start();

    // Electric / SpaceX Cold-Gas Thruster Hiss Layer
    this.thrusterNoiseGain = this.ctx.createGain();
    this.thrusterNoiseGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.thrusterNoiseFilter = this.ctx.createBiquadFilter();
    this.thrusterNoiseFilter.type = 'highpass';
    this.thrusterNoiseFilter.frequency.setValueAtTime(2500, this.ctx.currentTime);

    const thrusterBuffer = this.createNoiseBuffer(2.0);
    const thrusterNoise = this.ctx.createBufferSource();
    thrusterNoise.buffer = thrusterBuffer;
    thrusterNoise.loop = true;
    thrusterNoise.connect(this.thrusterNoiseFilter);
    this.thrusterNoiseFilter.connect(this.thrusterNoiseGain);
    this.thrusterNoiseGain.connect(this.masterGain);
    thrusterNoise.start();

    // ================= 2. NITRO BOOST SYNTHESIZER =================
    this.nitroGain = this.ctx.createGain();
    this.nitroGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.nitroFilter = this.ctx.createBiquadFilter();
    this.nitroFilter.type = 'bandpass';
    this.nitroFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    this.nitroFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    const nitroBuffer = this.createNoiseBuffer(2.0);
    this.nitroNoise = this.ctx.createBufferSource();
    this.nitroNoise.buffer = nitroBuffer;
    this.nitroNoise.loop = true;
    this.nitroNoise.connect(this.nitroFilter);
    this.nitroFilter.connect(this.nitroGain);
    this.nitroGain.connect(this.masterGain);
    this.nitroNoise.start();

    // ================= 3. TIRE DRIFT SCREECH SYNTH =================
    this.driftGain = this.ctx.createGain();
    this.driftGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.driftFilter = this.ctx.createBiquadFilter();
    this.driftFilter.type = 'bandpass';
    this.driftFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);
    this.driftFilter.Q.setValueAtTime(5.0, this.ctx.currentTime);

    const driftBuffer = this.createNoiseBuffer(2.0);
    this.driftNoise = this.ctx.createBufferSource();
    this.driftNoise.buffer = driftBuffer;
    this.driftNoise.loop = true;
    this.driftNoise.connect(this.driftFilter);
    this.driftFilter.connect(this.driftGain);
    this.driftGain.connect(this.masterGain);
    this.driftNoise.start();

    // ================= 4. AMBIENT CYBERPUNK MUSIC SYNTH =================
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.startCyberMusic();

    this.initialized = true;
  }

  // Switch sound timbre and waveform dynamics to match the active hypercar
  setCarProfile(soundProfile) {
    if (!soundProfile) return;
    this.activeProfile = { ...this.activeProfile, ...soundProfile };

    if (!this.initialized || !this.ctx) return;
    const now = this.ctx.currentTime;

    try {
      this.engineSub.type = this.activeProfile.subWave;
      this.engineMid.type = this.activeProfile.midWave;
      this.engineHigh.type = this.activeProfile.highWave;

      this.subGainNode.gain.setTargetAtTime(this.activeProfile.subGain, now, 0.05);
      this.midGainNode.gain.setTargetAtTime(this.activeProfile.midGain, now, 0.05);
      this.highGainNode.gain.setTargetAtTime(this.activeProfile.highGain, now, 0.05);

      this.engineFilter.Q.setTargetAtTime(this.activeProfile.filterQ, now, 0.05);
    } catch(e) {}
  }

  createNoiseBuffer(seconds) {
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  updateEngine(rpmRatio, throttle, speedRatio) {
    if (!this.initialized || this.isMuted) return;

    const p = this.activeProfile;
    const now = this.ctx.currentTime;

    // Base pitch calculated from car profile
    const baseFreq = p.baseFreq + (rpmRatio * p.rpmFreqMultiplier) + (speedRatio * 60);

    // Sub pitch
    this.engineSub.frequency.setTargetAtTime(baseFreq, now, 0.04);

    // Mid harmonic layer
    this.engineMid.frequency.setTargetAtTime(baseFreq * p.midHarmonic, now, 0.04);

    // High turbine / turbo spool or stator whine
    const turboWhineFreq = (baseFreq * p.turboHarmonic) + (throttle * 350);
    this.engineHigh.frequency.setTargetAtTime(turboWhineFreq, now, 0.04);

    // Dynamic filter opens as revs and throttle increase
    const filterCutoff = p.filterCutoffBase + (rpmRatio * p.filterCutoffRpm) + (throttle ? 1400 : 0);
    this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.05);

    // Volume level scaled by car volume profile
    const targetVolume = (0.16 + throttle * 0.38 + speedRatio * 0.16) * (p.volume || 1.0);
    this.engineGain.gain.setTargetAtTime(targetVolume, now, 0.04);

    // Electric / Cold-Gas Thruster hiss (active on Tesla or hyper-hybrid full throttle)
    if (this.thrusterNoiseGain) {
      if (p.isElectric && throttle) {
        this.thrusterNoiseGain.gain.setTargetAtTime(0.18 + speedRatio * 0.15, now, 0.06);
        this.thrusterNoiseFilter.frequency.setTargetAtTime(2000 + speedRatio * 4000, now, 0.05);
      } else {
        this.thrusterNoiseGain.gain.setTargetAtTime(0.0, now, 0.1);
      }
    }
  }

  setNitro(active) {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    if (active) {
      this.nitroGain.gain.setTargetAtTime(0.55, now, 0.08);
      this.nitroFilter.frequency.setTargetAtTime(1800, now, 0.1);
    } else {
      this.nitroGain.gain.setTargetAtTime(0.0, now, 0.15);
    }
  }

  setDrift(active, intensity = 1.0) {
    if (!this.initialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    if (active) {
      const vol = Math.min(0.4, intensity * 0.35);
      this.driftGain.gain.setTargetAtTime(vol, now, 0.05);
      this.driftFilter.frequency.setTargetAtTime(1600 + intensity * 600, now, 0.05);
    } else {
      this.driftGain.gain.setTargetAtTime(0.0, now, 0.1);
    }
  }

  playGearShift() {
    if (!this.initialized || this.isMuted) return;
    try {
      const p = this.activeProfile;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = p.subWave === 'sine' ? 'sine' : 'sawtooth';
      const now = this.ctx.currentTime;
      const shiftFreq = p.gearShiftPitch || 280;

      osc.frequency.setValueAtTime(shiftFreq, now);
      osc.frequency.exponentialRampToValueAtTime(shiftFreq * 0.25, now + 0.12);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch(e) {}
  }

  playBoostPadSound() {
    if (!this.initialized || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.3);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch(e) {}
  }

  playClick() {
    if (!this.initialized || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.0, now + 0.05);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch(e) {}
  }

  // Procedural Synthwave Arpeggio loop (Cyberpunk pulse)
  startCyberMusic() {
    if (this.musicPlaying) return;
    this.musicPlaying = true;

    const notes = [87.31, 103.83, 130.81, 155.56, 138.59, 130.81, 116.54, 130.81];
    let step = 0;

    const playStep = () => {
      if (!this.musicPlaying) return;
      if (!this.isMuted && this.ctx) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const filt = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(notes[step % notes.length], now);

        filt.type = 'lowpass';
        filt.frequency.setValueAtTime(600 + Math.sin(now * 0.5) * 350, now);

        g.gain.setValueAtTime(0.07, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(filt);
        filt.connect(g);
        g.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + 0.2);

        step++;
      }
      this.synthTimer = setTimeout(playStep, 150);
    };

    playStep();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0.0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

export const audioEngine = new AudioEngine();
