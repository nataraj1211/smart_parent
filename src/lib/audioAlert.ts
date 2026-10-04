// Web Audio API Siren Generator
class EmergencyAudio {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private isPlaying = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public startSiren() {
    if (this.isPlaying) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      // Create main siren oscillator
      this.osc = this.ctx.createOscillator();
      this.gainNode = this.ctx.createGain();

      // Create LFO for modulating siren pitch
      this.lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      // Police / Ambulance style oscillation (600Hz to 1200Hz)
      this.osc.type = "sawtooth";
      this.osc.frequency.setValueAtTime(800, this.ctx.currentTime);

      this.lfo.type = "triangle";
      this.lfo.frequency.setValueAtTime(1.5, this.ctx.currentTime); // 1.5 cycles per second
      lfoGain.gain.setValueAtTime(350, this.ctx.currentTime); // sweep range +-350Hz

      this.lfo.connect(this.osc.frequency);
      this.osc.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      // Volume ramp
      this.gainNode.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.gainNode.gain.exponentialRampToValueAtTime(0.3, this.ctx.currentTime + 0.3);

      this.osc.start();
      this.lfo.start();
      this.isPlaying = true;
    } catch (e) {
      console.warn("Audio Context playback failed (interaction required):", e);
    }
  }

  public stopSiren() {
    if (!this.isPlaying) return;
    try {
      if (this.gainNode && this.ctx) {
        this.gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        setTimeout(() => {
          this.osc?.stop();
          this.lfo?.stop();
          this.osc?.disconnect();
          this.lfo?.disconnect();
          this.gainNode?.disconnect();
          this.osc = null;
          this.lfo = null;
          this.gainNode = null;
          this.isPlaying = false;
        }, 220);
      } else {
        this.osc?.stop();
        this.lfo?.stop();
        this.osc = null;
        this.lfo = null;
        this.gainNode = null;
        this.isPlaying = false;
      }
    } catch {
      this.isPlaying = false;
    }
  }

  public playBeep(freq = 880, duration = 0.15) {
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // ignore
    }
  }

  public getIsPlaying() {
    return this.isPlaying;
  }
}

export const emergencyAudio = new EmergencyAudio();
