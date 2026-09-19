// Web Audio API Procedural Sound Synthesizer for Hypercar Engine, Nitro, Drifting, and Cyber Synthwave
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initialized = false;

    // Engine sound nodes
    this.engineGain = null;
    this.engineSub = null;
    this.engineMid = null;
    this.engineHigh = null;
    this.engineFilter = null;

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
    this.engineFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    // Sub rumble oscillator
    this.engineSub = this.ctx.createOscillator();
    this.engineSub.type = 'sawtooth';
    this.engineSub.frequency.setValueAtTime(55, this.ctx.currentTime);

    // Mid harmonic oscillator
    this.engineMid = this.ctx.createOscillator();
    this.engineMid.type = 'triangle';
    this.engineMid.frequency.setValueAtTime(110, this.ctx.currentTime);

    // Turbine electric hyper-whine (FM-like)
    this.engineHigh = this.ctx.createOscillator();
    this.engineHigh.type = 'sine';
    this.engineHigh.frequency.setValueAtTime(220, this.ctx.currentTime);

    this.engineSub.connect(this.engineFilter);
    this.engineMid.connect(this.engineFilter);
    this.engineHigh.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineSub.start();
    this.engineMid.start();
    this.engineHigh.start();

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
    this.musicGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.startCyberMusic();

    this.initialized = true;
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

    // RPM scales from 0.0 to 1.0
    const now = this.ctx.currentTime;
    const baseFreq = 45 + rpmRatio * 180 + speedRatio * 80;

    // Sub pitch
    this.engineSub.frequency.setTargetAtTime(baseFreq, now, 0.05);
    // Mid harmonic
    this.engineMid.frequency.setTargetAtTime(baseFreq * 2.2, now, 0.05);
    // Turbine whine
    this.engineHigh.frequency.setTargetAtTime(baseFreq * 4.5 + throttle * 400, now, 0.05);

    // Filter frequency opens up with throttle
    const filterCutoff = 400 + rpmRatio * 2800 + (throttle ? 1200 : 0);
    this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.06);

    // Volume level
    const targetVolume = 0.15 + throttle * 0.35 + speedRatio * 0.15;
    this.engineGain.gain.setTargetAtTime(targetVolume, now, 0.05);
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
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
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
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.3);
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

  // Procedural Synthwave Arpeggio loop (80s Cyberpunk pulse)
  startCyberMusic() {
    if (this.musicPlaying) return;
    this.musicPlaying = true;

    // F minor cyberpunk scale: F2, Ab2, C3, Eb3, Db3, C3, Bb2, C3
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

        g.gain.setValueAtTime(0.08, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(filt);
        filt.connect(g);
        g.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + 0.2);

        step++;
      }
      this.synthTimer = setTimeout(playStep, 150); // 100 BPM 16th notes
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
