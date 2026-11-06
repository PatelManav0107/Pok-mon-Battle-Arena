/**
 * Retro Synthesized Web Audio API Sound System
 * Zero external audio assets required; runs everywhere with crisp 8-bit/16-bit sound synthesis.
 */

export class AudioManager {
  constructor() {
    this.enabled = true;
    this.audioCtx = null;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.audioCtx = new AudioContext();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) this.playTone(520, 'triangle', 0.08);
    return this.enabled;
  }

  playTone(freq, type = 'square', duration = 0.1, delay = 0, vol = 0.08) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + delay);
      gain.gain.setValueAtTime(vol, this.audioCtx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(this.audioCtx.currentTime + delay);
      osc.stop(this.audioCtx.currentTime + delay + duration);
    } catch (e) {}
  }

  play(kind) {
    if (!this.enabled) return;
    switch (kind) {
      case 'click':
        this.playTone(520, 'triangle', 0.07, 0, 0.07);
        this.playTone(680, 'triangle', 0.07, 0.04, 0.07);
        break;
      case 'pick':
        this.playTone(440, 'square', 0.08, 0, 0.06);
        this.playTone(587, 'square', 0.11, 0.06, 0.06);
        break;
      case 'sendout':
        this.playTone(300, 'sine', 0.08, 0, 0.08);
        this.playTone(450, 'sine', 0.08, 0.06, 0.08);
        this.playTone(650, 'triangle', 0.15, 0.12, 0.09);
        break;
      case 'recall':
        this.playTone(680, 'sine', 0.07, 0, 0.07);
        this.playTone(460, 'sine', 0.08, 0.06, 0.07);
        this.playTone(280, 'triangle', 0.12, 0.12, 0.07);
        break;
      case 'countdown':
        this.playTone(440, 'square', 0.12, 0, 0.09);
        break;
      case 'fight':
        this.playTone(880, 'triangle', 0.35, 0, 0.11);
        break;
      case 'lowhp':
        this.playTone(660, 'square', 0.07, 0, 0.05);
        this.playTone(520, 'square', 0.09, 0.09, 0.05);
        break;
      case 'attack':
        this.playTone(220, 'sawtooth', 0.09, 0, 0.09);
        this.playTone(150, 'sawtooth', 0.12, 0.05, 0.09);
        break;
      case 'supereffective':
        this.playTone(523, 'square', 0.08, 0, 0.09);
        this.playTone(659, 'square', 0.08, 0.07, 0.09);
        this.playTone(784, 'square', 0.16, 0.14, 0.1);
        break;
      case 'notvery':
        this.playTone(240, 'triangle', 0.12, 0, 0.07);
        this.playTone(180, 'triangle', 0.15, 0.09, 0.07);
        break;
      case 'faint':
        this.playTone(380, 'sawtooth', 0.14, 0, 0.08);
        this.playTone(290, 'sawtooth', 0.14, 0.12, 0.08);
        this.playTone(200, 'sawtooth', 0.25, 0.24, 0.08);
        break;
      case 'win':
        this.playTone(523, 'square', 0.12, 0, 0.09);
        this.playTone(659, 'square', 0.12, 0.12, 0.09);
        this.playTone(784, 'square', 0.12, 0.24, 0.09);
        this.playTone(1046, 'square', 0.35, 0.36, 0.1);
        break;
      case 'cooldown_warn':
        this.playTone(190, 'sawtooth', 0.08, 0, 0.08);
        this.playTone(145, 'sawtooth', 0.11, 0.07, 0.08);
        break;
      case 'ult_cutin':
        // Dramatic rising anime synth chord + power chime
        this.playTone(261.6, 'sawtooth', 0.14, 0.0, 0.1);
        this.playTone(329.6, 'sawtooth', 0.14, 0.08, 0.1);
        this.playTone(392.0, 'sawtooth', 0.14, 0.16, 0.1);
        this.playTone(523.2, 'square', 0.25, 0.24, 0.11);
        this.playTone(784.0, 'triangle', 0.45, 0.38, 0.11);
        this.playTone(1046.5, 'sine', 0.55, 0.48, 0.1);
        break;
      case 'ult_blast':
        for (let i = 0; i < 9; i++) {
          this.playTone(120 + (i % 3) * 85, 'sawtooth', 0.14, i * 0.09, 0.11);
        }
        this.playTone(75, 'square', 0.55, 0.4, 0.12);
        break;
    }
  }

  playMoveSfx(sfxKey) {
    if (!this.enabled) return;
    switch (sfxKey) {
      case 'beam_fire':
        for (let i = 0; i < 6; i++) this.playTone(180 + (i % 2) * 60, 'sawtooth', 0.12, i * 0.09, 0.07);
        break;
      case 'hydro':
      case 'surf':
        for (let i = 0; i < 7; i++) this.playTone(140 + i * 25, 'triangle', 0.12, i * 0.08, 0.08);
        break;
      case 'ice':
        this.playTone(880, 'sine', 0.1, 0, 0.08);
        this.playTone(1174, 'triangle', 0.12, 0.1, 0.08);
        this.playTone(1567, 'sine', 0.2, 0.2, 0.09);
        break;
      case 'solar':
        for (let i = 0; i < 6; i++) this.playTone(350 + i * 90, 'sine', 0.12, i * 0.14, 0.06);
        this.playTone(220, 'sawtooth', 0.45, 0.95, 0.1);
        break;
      case 'thunder':
        this.playTone(920, 'sawtooth', 0.07, 0, 0.09);
        this.playTone(420, 'square', 0.09, 0.06, 0.09);
        this.playTone(780, 'sawtooth', 0.12, 0.14, 0.09);
        this.playTone(160, 'sawtooth', 0.25, 0.22, 0.1);
        break;
      case 'psychic':
      case 'moonblast':
        this.playTone(620, 'sine', 0.18, 0, 0.08);
        this.playTone(480, 'sine', 0.18, 0.15, 0.08);
        this.playTone(740, 'sine', 0.25, 0.3, 0.08);
        break;
      case 'earthquake':
      case 'slam':
      case 'explosion':
        this.playTone(110, 'sawtooth', 0.25, 0, 0.11);
        this.playTone(85, 'square', 0.3, 0.15, 0.11);
        break;
      case 'slash':
      case 'claw':
      case 'quick':
        this.playTone(700, 'triangle', 0.06, 0, 0.08);
        this.playTone(980, 'sawtooth', 0.09, 0.05, 0.08);
        break;
      case 'bite':
        this.playTone(260, 'sawtooth', 0.08, 0, 0.09);
        this.playTone(140, 'square', 0.14, 0.09, 0.1);
        break;
      case 'flurry':
      case 'outrage':
        for (let i = 0; i < 5; i++) this.playTone(280 + (i % 2) * 140, 'square', 0.07, i * 0.1, 0.08);
        break;
      default:
        this.play('attack');
    }
  }
}

export const audio = new AudioManager();
