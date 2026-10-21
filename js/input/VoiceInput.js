import { VOICE } from '../config.js';
import { SHOUT } from './SimulatedVoice.js';

const FFT_SIZE = 1024;
const WOBBLE_MS = 180;
const WOBBLE_AMOUNT = 6;

/**
 * Lee el volumen del micrófono y lo convierte en un nivel de 0 a 100.
 * Contra el ruido exterior: el navegador suprime ruido, un filtro deja pasar solo las
 * frecuencias de la voz y la barra empieza por encima del ruido del cuarto (medido en
 * la prueba de comunicación y seguido durante el juego).
 * Si no hay micrófono, usa la voz simulada (teclado o botones).
 */
export class VoiceInput {
  constructor(soundEngine, simulatedVoice) {
    this.soundEngine = soundEngine;
    this.simulated = simulatedVoice;
    this.analyser = null;
    this.samples = null;
    this.mode = 'idle'; // 'idle' | 'microphone' | 'simulated'
    this.floorDecibels = VOICE.defaultFloorDecibels;
    this.decibelRange = VOICE.defaultDecibelRange;
    this.ambientDecibels = null; // ruido del cuarto; null hasta medir la voz
    this.ambientMarginDecibels = 0; // distancia entre el ruido y el piso de la barra
    this.decibels = -Infinity; // lectura cruda del último cuadro
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
        audio: { echoCancellation: true, noiseSuppression: VOICE.browserNoiseSuppression, autoGainControl: false },
      });
      const context = this.soundEngine.unlock();
      this.analyser = context.createAnalyser();
      this.analyser.fftSize = FFT_SIZE;
      this.samples = new Float32Array(this.analyser.fftSize);
      context
        .createMediaStreamSource(stream)
        .connect(voiceFilter(context, 'highpass', VOICE.lowCutHz))
        .connect(voiceFilter(context, 'lowpass', VOICE.highCutHz))
        .connect(this.analyser);
      this.mode = 'microphone';
      return true;
    } catch {
      this.mode = 'simulated';
      return false;
    }
  }

  /** Guarda la medición de la prueba de comunicación (ver VoiceCalibration). */
  applyCalibration({ floorDecibels, decibelRange, noiseDecibels }) {
    this.floorDecibels = floorDecibels;
    this.decibelRange = decibelRange;
    this.ambientDecibels = noiseDecibels;
    this.ambientMarginDecibels = floorDecibels - noiseDecibels;
  }

  /** Nivel suavizado: sube rápido y baja despacio para que el globo no tiemble. */
  read(deltaSeconds) {
    const target = Math.max(this.microphoneLevel(deltaSeconds), this.simulatedLevel());
    const speed = target > this.level ? VOICE.attack : VOICE.release;
    this.level += (target - this.level) * Math.min(1, speed * deltaSeconds);
    return this.level;
  }

  microphoneLevel(deltaSeconds) {
    if (!this.usesMicrophone) return 0;
    this.analyser.getFloatTimeDomainData(this.samples);
    const meanSquare = this.samples.reduce((sum, sample) => sum + sample * sample, 0) / this.samples.length;
    this.decibels = 20 * Math.log10(Math.sqrt(meanSquare) + 1e-8);
    this.trackAmbient(deltaSeconds);
    const floor = Math.max(this.floorDecibels, (this.ambientDecibels ?? -Infinity) + this.ambientMarginDecibels);
    return clamp(((this.decibels - floor) / this.decibelRange) * 100, 0, 100);
  }

  /**
   * Sigue el ruido del cuarto: baja rápido cuando hay silencio y sube despacio,
   * así un ruido que se queda (salón, tráfico) deja de mover el globo, pero la voz no.
   */
  trackAmbient(deltaSeconds) {
    if (this.ambientDecibels === null) return;
    const difference = this.decibels - this.ambientDecibels;
    this.ambientDecibels +=
      difference < 0
        ? difference * Math.min(1, VOICE.ambientFallSpeed * deltaSeconds)
        : Math.min(difference, VOICE.ambientRiseDecibelsPerSecond * deltaSeconds);
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

function voiceFilter(context, type, frequency) {
  const filter = context.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  return filter;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
