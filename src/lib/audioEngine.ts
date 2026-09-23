/**
 * Web Audio API Engine for Cash Stage
 * High-precision DSP synthesizers for 16-step beat machine, studio tone, radio stream, and sound FX.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private radioOsc: OscillatorNode | null = null;
  private radioGain: GainNode | null = null;
  private radioInterval: number | null = null;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // --- Drum Synthesizers for 16-Step Sequencer ---
  public playKick(time?: number) {
    const ctx = this.init();
    const t = time ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);

    gain.gain.setValueAtTime(1.0, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playSnare(time?: number) {
    const ctx = this.init();
    const t = time ?? ctx.currentTime;

    // Noise buffer for snap
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(1, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // Body tone
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);
    oscGain.gain.setValueAtTime(0.7, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    noise.start(t);
    osc.start(t);
    noise.stop(t + 0.2);
    osc.stop(t + 0.15);
  }

  public playHiHat(time?: number) {
    const ctx = this.init();
    const t = time ?? ctx.currentTime;

    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(t);
    noise.stop(t + 0.05);
  }

  public playClap(time?: number) {
    const ctx = this.init();
    const t = time ?? ctx.currentTime;

    [0, 0.015, 0.03].forEach((offset) => {
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.7, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, t + offset + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(t + offset);
      noise.stop(t + offset + 0.08);
    });
  }

  public play808(time?: number, pitch: number = 45) {
    const ctx = this.init();
    const t = time ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch * 2, t);
    osc.frequency.exponentialRampToValueAtTime(pitch, t + 0.08);

    gain.gain.setValueAtTime(0.9, t);
    gain.gain.linearRampToValueAtTime(0.6, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.8);
  }

  // --- Dice Roll Sound FX ---
  public playDiceRoll() {
    const ctx = this.init();
    const t = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const offset = i * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 350 + Math.random() * 400;
      gain.gain.setValueAtTime(0.2, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.04);
    }
  }

  // --- Snake Eyes Jackpot Chime ---
  public playJackpotChime() {
    const ctx = this.init();
    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);
      gain.gain.setValueAtTime(0.5, t + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 0.4);
    });
  }

  // --- Live Vets Radio FM Synthesized Stream ---
  public startRadioStream(onBeatChange?: (bar: number) => void) {
    if (this.radioInterval) return;
    const ctx = this.init();
    let step = 0;
    const bpm = 92;
    const intervalMs = (60 / bpm / 4) * 1000;

    this.radioInterval = window.setInterval(() => {
      const s = step % 16;
      if (s === 0 || s === 7 || s === 10) this.playKick();
      if (s === 4 || s === 12) this.playSnare();
      if (s % 2 === 0) this.playHiHat();
      if (s === 0 || s === 8) this.play808(undefined, s === 0 ? 55 : 49);

      if (onBeatChange && s === 0) {
        onBeatChange(Math.floor(step / 16));
      }
      step++;
    }, intervalMs);
  }

  public stopRadioStream() {
    if (this.radioInterval) {
      clearInterval(this.radioInterval);
      this.radioInterval = null;
    }
  }

  public isRadioPlaying(): boolean {
    return this.radioInterval !== null;
  }
}

export const audioEngine = new AudioEngine();
