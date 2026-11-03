import { AAA } from '../config.js';

const DECIMATION = 2; // la vibración de la voz se mide con la mitad de muestras: alcanza y es más rápido
const OCTAVE_TOLERANCE = 0.9;
const MIN_DECIBELS = -100; // el espectro debajo de esto cuenta como silencio

/**
 * Reconoce un "Aaaa" sostenido, sin DOM: recibe en cada cuadro la onda y el espectro del
 * micrófono y dice si en este momento suena una "a" larga (y no una persona hablando).
 * - Al hablar, el sonido cambia en cada sílaba; una "a" sostenida suena igual todo el tiempo.
 *   `analyze()` compara el "color" del sonido (su espectro) con el de hace un instante: si casi
 *   no cambió, es un sonido parejo. Además debe tener tono (una nota, no un siseo como "Shhh")
 *   y algo de sonido agudo, que sale con la boca abierta (un "Mmm" no lo tiene).
 * - `update()` exige que dure un poco, sin cortes, antes de dar el visto bueno.
 * Con `setOwnPitch()` exige además el tono del niño medido en la prueba de voz.
 */
export class AaaDetector {
  constructor(sampleRate, binCount) {
    this.sampleRate = sampleRate;
    this.binHz = sampleRate / 2 / binCount;
    this.ownPitch = null;
    this.history = []; // { time, shape }: espectros recientes, para ver si el sonido cambia
    this.reset();
  }

  reset() {
    this.heldSeconds = 0;
    this.gapSeconds = Infinity;
    this.active = false;
  }

  /** Tono (Hz) de la "a" del niño, o null para aceptar cualquier tono. */
  setOwnPitch(pitch) {
    this.ownPitch = pitch;
  }

  /** Rasgos del cuadro: tono (Hz), claridad (0-1), qué tan igual suena que hace un instante (0-1) y lo agudo (dB). */
  analyze(timeData, frequencyDecibels, nowMs = performance.now()) {
    const { pitch, clarity } = this.measurePitch(timeData);
    const steadiness = this.measureSteadiness(frequencyDecibels, nowMs);
    const brightness =
      zonePower(frequencyDecibels, binRange(AAA.brightZoneHz, this.binHz)) -
      zonePower(frequencyDecibels, binRange([AAA.spectrumHz[0], AAA.brightZoneHz[0]], this.binHz));
    const features = { pitch, clarity, steadiness, brightness };
    return { ...features, isAaa: this.looksLikeAaa(features) };
  }

  looksLikeAaa({ pitch, clarity, steadiness, brightness }) {
    if (!pitch || clarity < AAA.minClarity || steadiness < AAA.minSteadiness) return false;
    if (brightness < AAA.minBrightnessDecibels || brightness > AAA.maxBrightnessDecibels) return false;
    if (!this.ownPitch) return true;
    return pitch >= this.ownPitch / AAA.pitchDropSpread && pitch <= this.ownPitch * AAA.pitchSpread;
  }

  /**
   * Parecido (0-1) entre el espectro de este cuadro y el de hace `steadyLagMs`: se compara la
   * forma (qué frecuencias suenan más), no el volumen, así una "a" que sube o baja sigue igual.
   */
  measureSteadiness(frequencyDecibels, nowMs) {
    const [from, to] = binRange(AAA.spectrumHz, this.binHz);
    const shape = new Float32Array(to - from);
    let mean = 0;
    for (let i = from; i < to; i++) mean += Math.max(frequencyDecibels[i], MIN_DECIBELS);
    mean /= shape.length;
    let norm = 0;
    for (let i = from; i < to; i++) {
      shape[i - from] = Math.max(frequencyDecibels[i], MIN_DECIBELS) - mean;
      norm += shape[i - from] * shape[i - from];
    }
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < shape.length; i++) shape[i] /= norm;

    this.history.push({ time: nowMs, shape });
    while (this.history.length > 2 && nowMs - this.history[1].time >= AAA.steadyLagMs) this.history.shift();
    const before = this.history[0];
    if (nowMs - before.time < AAA.steadyLagMs * 0.5) return 0; // todavía no hay con qué comparar
    let similarity = 0;
    for (let i = 0; i < shape.length; i++) similarity += shape[i] * before.shape[i];
    return similarity;
  }

  /**
   * Cuadro a cuadro: la "a" cuenta después de `onsetSeconds` seguidos, sin cortes (así varias
   * sílabas, como en "acamaya", no suman). Ya activa, huecos más cortos que `graceSeconds`
   * no la apagan. `voiced` dice si el sonido supera el ruido del cuarto.
   */
  update(deltaSeconds, features, voiced) {
    if (voiced && features.isAaa) {
      this.heldSeconds += deltaSeconds;
      this.gapSeconds = 0;
    } else {
      this.gapSeconds += deltaSeconds;
      if (this.gapSeconds > this.allowedGap) this.heldSeconds = 0;
    }
    this.active = this.heldSeconds >= AAA.onsetSeconds && this.gapSeconds <= this.allowedGap;
    return this.active;
  }

  /** Hueco que se perdona: ninguno al empezar (para no juntar sílabas) y uno muy breve ya volando. */
  get allowedGap() {
    return this.active ? AAA.graceSeconds : 0;
  }

  /** Autocorrelación normalizada: busca cada cuánto se repite la onda (el tono) y qué tan igual se repite. */
  measurePitch(timeData) {
    const length = Math.floor(timeData.length / DECIMATION);
    const rate = this.sampleRate / DECIMATION;
    const minLag = Math.floor(rate / AAA.maxPitchHz);
    const maxLag = Math.min(length - 1, Math.ceil(rate / AAA.minPitchHz));
    const x = new Float32Array(length);
    for (let i = 0; i < length; i++) x[i] = timeData[i * DECIMATION];

    const scores = new Float32Array(maxLag + 1);
    let best = 0;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let cross = 0;
      let energyA = 0;
      let energyB = 0;
      for (let i = 0; i + lag < length; i++) {
        cross += x[i] * x[i + lag];
        energyA += x[i] * x[i];
        energyB += x[i + lag] * x[i + lag];
      }
      scores[lag] = cross / (Math.sqrt(energyA * energyB) + 1e-12);
      best = Math.max(best, scores[lag]);
    }
    // La onda también se "repite" al doble de tiempo (una octava abajo): se elige el primer
    // pico que casi empata con el mejor, que es el tono de verdad.
    for (let lag = minLag + 1; lag < maxLag; lag++) {
      const isPeak = scores[lag] >= scores[lag - 1] && scores[lag] >= scores[lag + 1];
      if (isPeak && scores[lag] >= best * OCTAVE_TOLERANCE) return { pitch: rate / lag, clarity: Math.max(0, scores[lag]) };
    }
    return { pitch: 0, clarity: Math.max(0, best) };
  }

}

/** Tono típico (mediana) de varios cuadros de "a". */
export function typicalPitch(frames) {
  const pitches = frames.map((frame) => frame.pitch).sort((a, b) => a - b);
  return pitches[Math.floor(pitches.length / 2)];
}

function binRange([fromHz, toHz], binHz) {
  const from = Math.round(fromHz / binHz);
  return [from, Math.max(from + 1, Math.round(toHz / binHz))];
}

/** Energía total de una zona en decibeles (suma en potencia, no en decibeles). */
function zonePower(frequencyDecibels, [from, to]) {
  let power = 0;
  for (let i = from; i < to; i++) power += Math.pow(10, frequencyDecibels[i] / 10);
  return 10 * Math.log10(power + 1e-20);
}

