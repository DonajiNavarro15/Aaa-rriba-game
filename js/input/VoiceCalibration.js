import { CALIBRATION, VOICE } from '../config.js';
import { typicalPitch } from './AaaDetector.js';

/** Fase de la medición de voz. */
export const CALIBRATION_PHASE = Object.freeze({
  SILENCE: 'silence', // escucha el ruido del cuarto
  SPEAK: 'speak', // espera a que el niño diga la palabra
  FAILED: 'failed', // no se escuchó suficiente voz
  DONE: 'done',
});

/**
 * Mide el ruido del cuarto y la voz del niño, sin DOM.
 * Recibe los decibeles de cada cuadro y al final calcula desde dónde empieza la barra
 * (por encima del ruido) y cuántos decibeles abarca (para que su voz quede en la zona "sube").
 */
export class VoiceCalibration {
  constructor() {
    this.noiseDecibels = null;
    this.narrationSamples = []; // lo que se cuela de la narración al micrófono mientras el niño calla
    this.attempt = 0;
    this.result = null;
    this.startPhase(CALIBRATION_PHASE.SILENCE);
  }

  startPhase(phase) {
    this.phase = phase;
    this.elapsedMs = 0;
    this.samples = []; // decibeles del silencio del cuarto
    this.aaaSegments = []; // cada "Aaaa" sostenido, sin cortes: { frames, decibels, seconds, gapSeconds }
  }

  /** Vuelve a pedir la palabra sin volver a medir el silencio, aceptando una voz más bajita y una "a" más corta. */
  retrySpeaking() {
    this.attempt += 1;
    this.startPhase(CALIBRATION_PHASE.SPEAK);
  }

  /** Umbrales del intento actual (el último se repite). */
  get voicedOverNoise() {
    return byAttempt(CALIBRATION.voicedOverNoiseDecibels, this.attempt);
  }

  get aaaSecondsNeeded() {
    return byAttempt(CALIBRATION.aaaSecondsNeeded, this.attempt);
  }

  /** Lo más largo que ha sostenido un "Aaaa" en este intento. */
  get longestAaaSeconds() {
    return Math.max(0, ...this.aaaSegments.map((segment) => segment.seconds));
  }

  /** Avance de la fase actual, de 0 a 1. */
  get progress() {
    if (this.phase === CALIBRATION_PHASE.SILENCE) return Math.min(1, this.elapsedMs / CALIBRATION.silenceMs);
    if (this.phase === CALIBRATION_PHASE.SPEAK) return Math.min(1, this.longestAaaSeconds / this.aaaSecondsNeeded);
    return 1;
  }

  /**
   * `features` son los rasgos del cuadro (AaaDetector), o null sin micrófono. `narrating` dice si
   * suena una frase grabada: el tiempo de la fase no corre mientras habla.
   * @returns {string} la fase después de este cuadro
   */
  update(deltaSeconds, decibels, features = null, narrating = false) {
    if (narrating) {
      this.listenDuringNarration(deltaSeconds, decibels, features);
      return this.phase;
    }
    this.elapsedMs += deltaSeconds * 1000;
    if (this.phase === CALIBRATION_PHASE.SILENCE) this.listenToSilence(decibels);
    else if (this.phase === CALIBRATION_PHASE.SPEAK) this.listenToVoice(deltaSeconds, decibels, features);
    return this.phase;
  }

  /**
   * La narración termina pidiendo "¡Aaaa-rriba!" y el niño suele gritar junto con ella.
   * Mientras suena el "Shhh" (él calla) se mide cuánto se cuela la narración al micrófono;
   * después, durante una frase, lo que suene claramente más fuerte que eso es su voz y cuenta.
   */
  listenDuringNarration(deltaSeconds, decibels, features) {
    if (this.phase === CALIBRATION_PHASE.SILENCE) {
      this.narrationSamples.push(decibels);
      return;
    }
    const leak = this.narrationLeakDecibels;
    if (this.phase !== CALIBRATION_PHASE.SPEAK || leak === null) return;
    if (decibels >= leak + CALIBRATION.overNarrationDecibels) this.listenToVoice(deltaSeconds, decibels, features);
  }

  /** Volumen con que se oye la narración en el micrófono, o null si no se alcanzó a medir. */
  get narrationLeakDecibels() {
    if (this.narrationSamples.length < CALIBRATION.minNarrationFrames) return null;
    return percentile(this.narrationSamples, CALIBRATION.narrationPercentile);
  }

  listenToSilence(decibels) {
    this.samples.push(decibels);
    if (this.elapsedMs < CALIBRATION.silenceMs) return;
    this.noiseDecibels = percentile(this.samples, CALIBRATION.noisePercentile);
    this.startPhase(CALIBRATION_PHASE.SPEAK);
  }

  /**
   * Solo cuenta el "Aaaa": un sonido parejo, con tono y boca abierta, más fuerte que el ruido.
   * Golpes, ruidos y gente platicando cerca no cambian la medición ni la dan por terminada.
   * Termina cuando el niño sostuvo su "Aaaa" y la "a" ya acabó (la "rriba" no cuenta).
   */
  listenToVoice(deltaSeconds, decibels, features) {
    const loudEnough = decibels >= this.noiseDecibels + this.voicedOverNoise;
    this.trackAaa(deltaSeconds, decibels, loudEnough && features?.isAaa ? features : null);

    const heldAaa = this.childAaa !== null;
    const aaaEnded = this.aaaSegments.at(-1)?.gapSeconds >= CALIBRATION.endAfterQuietSeconds;
    if (heldAaa && aaaEnded) return this.finish();
    if (this.elapsedMs >= CALIBRATION.speakMaxMs) {
      if (heldAaa) this.finish();
      else this.phase = CALIBRATION_PHASE.FAILED;
    }
  }

  /**
   * Separa cada "Aaaa" sostenido: un corte más largo que `aaaGapSeconds` empieza otro. Así el
   * "Aaaa" del niño no se mezcla con una nota de otra persona o de la tele que suene antes o después.
   */
  trackAaa(deltaSeconds, decibels, aaaFeatures) {
    let segment = this.aaaSegments.at(-1);
    if (!aaaFeatures) {
      if (segment) segment.gapSeconds += deltaSeconds;
      return;
    }
    if (!segment || segment.gapSeconds > CALIBRATION.aaaGapSeconds) {
      segment = { frames: [], decibels: [], seconds: 0, gapSeconds: 0 };
      this.aaaSegments.push(segment);
    }
    segment.frames.push(aaaFeatures);
    segment.decibels.push(decibels);
    segment.seconds += deltaSeconds;
    segment.gapSeconds = 0;
  }

  /**
   * El "Aaaa" del niño: de los que duraron lo suficiente, el más fuerte (él está pegado al
   * micrófono; los demás sonidos llegan de más lejos). null si no sostuvo ninguno.
   */
  get childAaa() {
    let best = null;
    for (const segment of this.aaaSegments) {
      if (segment.seconds < this.aaaSecondsNeeded) continue;
      segment.typicalDecibels = percentile(segment.decibels, CALIBRATION.aaaPercentile);
      if (!best || segment.typicalDecibels > best.typicalDecibels) best = segment;
    }
    return best;
  }

  /**
   * La zona "sube" va de un poco por debajo de la voz medida a un poco por encima, así los
   * sonidos más bajos que la voz del niño (otras personas lejos del micrófono) no mueven el globo.
   * Con una voz bajita (cerca del ruido) el piso se queda justo encima del ruido y la barra se
   * achica, para que su voz siga subiendo el globo sin que el ruido lo mueva.
   * La voz se mide con su "Aaaa" (lo que mueve el globo en el juego): la palabra completa
   * ("rriba" y el final que se apaga) suena más bajito, y con ella un "Aaaa" largo reventaría el globo.
   */
  finish() {
    const aaa = this.childAaa;
    const voiceDecibels = aaa.typicalDecibels;
    const fullRange =
      (CALIBRATION.riseBelowVoiceDecibels + CALIBRATION.dangerAboveVoiceDecibels) /
      ((VOICE.dangerThreshold - VOICE.riseThreshold) / 100);
    const voiceFloor = voiceDecibels - CALIBRATION.riseBelowVoiceDecibels - (VOICE.riseThreshold / 100) * fullRange;
    let floorDecibels = Math.max(voiceFloor, this.noiseDecibels + CALIBRATION.noiseMarginDecibels);
    if (floorDecibels > voiceDecibels - CALIBRATION.minVoiceSpanDecibels) {
      floorDecibels = Math.max(
        voiceDecibels - CALIBRATION.minVoiceSpanDecibels,
        this.noiseDecibels + CALIBRATION.noiseGuardDecibels
      );
    }
    const decibelRange = Math.max(
      CALIBRATION.minDecibelRange,
      Math.min(fullRange, (voiceDecibels - floorDecibels) / (CALIBRATION.minVoiceLevel / 100))
    );
    // Si su voz no alcanza a subir el globo con esta barra, mejor pedirle que se acerque.
    const voiceLevelOnBar = ((voiceDecibels - floorDecibels) / decibelRange) * 100;
    if (voiceLevelOnBar < VOICE.riseThreshold + CALIBRATION.playableMarginLevel) {
      this.phase = CALIBRATION_PHASE.FAILED;
      return;
    }
    this.result = {
      voiceLevel: 1 + CALIBRATION.voiceLevelDecibels.filter((threshold) => voiceDecibels >= threshold).length,
      floorDecibels,
      decibelRange,
      noiseDecibels: this.noiseDecibels,
      noisy: voiceDecibels - this.noiseDecibels < CALIBRATION.noisyRoomSpanDecibels,
      ownPitch: typicalPitch(aaa.frames), // tono de su "Aaaa" (de "¡Aaaa-rriba!")
    };
    this.phase = CALIBRATION_PHASE.DONE;
  }
}

function byAttempt(values, attempt) {
  return values[Math.min(attempt, values.length - 1)];
}

function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(fraction * sorted.length))];
}
