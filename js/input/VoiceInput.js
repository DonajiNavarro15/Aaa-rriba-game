import { AAA, VOICE } from '../config.js';
import { SHOUT } from './SimulatedVoice.js';
import { AaaDetector } from './AaaDetector.js';

const FFT_SIZE = 2048; // ventana de ~43 ms: alcanza para medir el tono de la voz
const WOBBLE_MS = 180;
const WOBBLE_AMOUNT = 6;

/**
 * Lee el volumen del micrófono y lo convierte en un nivel de 0 a 100.
 * Contra el ruido exterior: el navegador suprime ruido, un filtro deja pasar solo las
 * frecuencias de la voz y la barra empieza por encima del ruido del cuarto (medido en
 * la prueba de comunicación y seguido durante el juego).
 * Además reconoce el "Aaaa" (AaaDetector): `aaaLevel` solo sube con una "a" sostenida,
 * así el globo no se mueve cuando alguien habla. `level` sigue cualquier voz (ronda bonus).
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
    this.level = 0; // cualquier voz
    this.aaaLevel = 0; // solo el "Aaaa"
    this.detector = null;
    this.stream = null; // el micrófono, para grabar muestras de diagnóstico
    this.features = null; // rasgos del último cuadro (tono, si parece "a"…)
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
      this.stream = stream;
      const context = this.soundEngine.unlock();
      this.analyser = context.createAnalyser();
      this.analyser.fftSize = FFT_SIZE;
      this.samples = new Float32Array(this.analyser.fftSize);
      this.spectrum = new Float32Array(this.analyser.frequencyBinCount);
      this.detector = new AaaDetector(context.sampleRate, this.analyser.frequencyBinCount);
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
  applyCalibration({ floorDecibels, decibelRange, noiseDecibels, ownPitch }) {
    this.floorDecibels = floorDecibels;
    this.decibelRange = decibelRange;
    this.ambientDecibels = noiseDecibels;
    this.ambientMarginDecibels = floorDecibels - noiseDecibels;
    this.detector?.setOwnPitch(ownPitch);
  }

  /**
   * Niveles suavizados: suben rápido y bajan despacio para que el globo no tiemble.
   * Devuelve `level` (cualquier voz) y deja en `aaaLevel` el que solo cuenta el "Aaaa".
   */
  read(deltaSeconds) {
    const microphone = this.microphoneLevel(deltaSeconds);
    const simulated = this.simulatedLevel();
    // En el juego no siempre se grita: un "Aaaa" suave cuenta si supera el ruido del cuarto, y sube el
    // globo aunque no llegue a la zona "sube" de la barra. Más fuerte, sube más rápido.
    const aboveNoise = this.ambientDecibels === null ? microphone > 0 : this.decibels >= this.ambientDecibels + AAA.minAboveNoiseDecibels;
    const aaa = this.detector?.update(deltaSeconds, this.features, aboveNoise) ? Math.max(microphone, AAA.softAaaLevel) : 0;
    this.level = smooth(this.level, Math.max(microphone, simulated), deltaSeconds);
    this.aaaLevel = smooth(this.aaaLevel, Math.max(aaa, simulated), deltaSeconds);
    return this.level;
  }

  microphoneLevel(deltaSeconds) {
    if (!this.usesMicrophone) return 0;
    this.analyser.getFloatTimeDomainData(this.samples);
    const meanSquare = this.samples.reduce((sum, sample) => sum + sample * sample, 0) / this.samples.length;
    this.decibels = 20 * Math.log10(Math.sqrt(meanSquare) + 1e-8);
    this.analyser.getFloatFrequencyData(this.spectrum);
    this.features = this.detector.analyze(this.samples, this.spectrum);
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

function smooth(current, target, deltaSeconds) {
  const speed = target > current ? VOICE.attack : VOICE.release;
  return current + (target - current) * Math.min(1, speed * deltaSeconds);
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
