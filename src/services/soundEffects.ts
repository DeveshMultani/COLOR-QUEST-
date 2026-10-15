/**
 * Web Audio API procedural synthesizer for ColorQuest.
 * Zero external audio assets; runs everywhere without latency or missing file errors.
 */

class SoundService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.6; // 0 to 1

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Soft tick for button and swatch clicks.
   */
  public playClick() {
    if (this.isMuted || this.volume <= 0.01) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.12 * this.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.045);
    } catch {
      // Audio errors fail silently
    }
  }

  /**
   * Harmonious chord for correct region fill.
   */
  public playCorrect() {
    if (this.isMuted || this.volume <= 0.01) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.035);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.setValueAtTime(0.18 * this.volume, ctx.currentTime + idx * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.035 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.035);
        osc.stop(ctx.currentTime + idx * 0.035 + 0.38);
      });
    } catch {
      // Graceful fallback
    }
  }

  /**
   * Pleasant partial chord for scheme-compatible placement.
   */
  public playCompatible() {
    if (this.isMuted || this.volume <= 0.01) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [440, 554.37]; // A4, C#5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.04);

        gain.gain.setValueAtTime(0.12 * this.volume, ctx.currentTime + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.04 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.04);
        osc.stop(ctx.currentTime + idx * 0.04 + 0.28);
      });
    } catch {}
  }

  /**
   * Low dull buzzer for incorrect color choice.
   */
  public playIncorrect() {
    if (this.isMuted || this.volume <= 0.01) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.16 * this.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.19);
    } catch {}
  }

  /**
   * Shimmering harp arpeggio for hint.
   */
  public playHint() {
    if (this.isMuted || this.volume <= 0.01) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const freqs = [659.25, 830.61, 987.77, 1318.51];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.045);

        gain.gain.setValueAtTime(0.15 * this.volume, ctx.currentTime + idx * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.045 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.045);
        osc.stop(ctx.currentTime + idx * 0.045 + 0.32);
      });
    } catch {}
  }

  /**
   * Triumphant fanfare for puzzle completion.
   */
  public playVictory() {
    if (this.isMuted || this.volume <= 0.01) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const chords = [
        { freqs: [523.25, 659.25, 783.99], time: 0, dur: 0.18 },       // C major
        { freqs: [587.33, 739.99, 880.00], time: 0.20, dur: 0.18 },    // D major
        { freqs: [659.25, 830.61, 987.77], time: 0.40, dur: 0.22 },    // E major
        { freqs: [783.99, 987.77, 1174.66, 1567.98], time: 0.65, dur: 0.65 }, // G major grand
      ];

      chords.forEach(chord => {
        chord.freqs.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + chord.time);

          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.setValueAtTime(0.16 * this.volume, ctx.currentTime + chord.time);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + chord.time + chord.dur);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + chord.time);
          osc.stop(ctx.currentTime + chord.time + chord.dur + 0.05);
        });
      });
    } catch {}
  }
}

export const sounds = new SoundService();
