import { VOICE } from '../config.js';
import { SHOUT } from './SimulatedVoice.js';

const FFT_SIZE = 1024;
const WOBBLE_MS = 180;
const WOBBLE_AMOUNT = 6;

/**
 * Lee el volumen del micrófono y lo convierte en un nivel de 0 a 100.
 * Si no hay micrófono, usa la voz simulada (teclado o botones).
 */
export class VoiceInput {
  constructor(soundEngine, simulatedVoice) {
    this.soundEngine = soundEngine;
    this.simulated = simulatedVoice;
    this.analyser = null;
    this.samples = null;
    this.mode = 'idle'; // 'idle' | 'microphone' | 'simulated'
    this.sensitivity = VOICE.defaultSensitivity;
    this.level = 0;
  }

  get usesMicrophone() {
    return this.mode === 'microphone';
  }

  get isReady() {
    return this.mode !== 'idle';
  }

  /** Pide el micrófono una sola vez. Devuelve true si se conectó. */
  async connect() {
    if (this.usesMicrophone) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
      });
      const context = this.soundEngine.unlock();
      this.analyser = context.createAnalyser();
      this.analyser.fftSize = FFT_SIZE;
      this.samples = new Float32Array(this.analyser.fftSize);
      context.createMediaStreamSource(stream).connect(this.analyser);
      this.mode = 'microphone';
      return true;
    } catch {
      this.mode = 'simulated';
      return false;
    }
  }

  /** Nivel suavizado: sube rápido y baja despacio para que el globo no tiemble. */
  read(deltaSeconds) {
    const target = Math.max(this.microphoneLevel(), this.simulatedLevel());
    const speed = target > this.level ? VOICE.attack : VOICE.release;
    this.level += (target - this.level) * Math.min(1, speed * deltaSeconds);
    return this.level;
  }

  microphoneLevel() {
    if (!this.usesMicrophone) return 0;
    this.analyser.getFloatTimeDomainData(this.samples);
    const meanSquare = this.samples.reduce((sum, sample) => sum + sample * sample, 0) / this.samples.length;
    const decibels = 20 * Math.log10(Math.sqrt(meanSquare) + 1e-8);
    const floor = VOICE.quietestDecibels + (5 - this.sensitivity) * VOICE.decibelsPerSensitivityStep;
    return clamp(((decibels - floor) / VOICE.decibelRange) * 100, 0, 100);
  }

  simulatedLevel() {
    switch (this.simulated.intensity) {
      case SHOUT.LOUD:
        return VOICE.simulatedLoud;
      case SHOUT.NORMAL:
        return VOICE.simulatedNormal + Math.sin(performance.now() / WOBBLE_MS) * WOBBLE_AMOUNT;
      default:
        return 0;
    }
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
