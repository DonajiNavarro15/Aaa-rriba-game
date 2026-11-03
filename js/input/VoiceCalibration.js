import { AAA, CALIBRATION, VOICE } from '../config.js';
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
    this.attempt = 0;
    this.result = null;
    this.startPhase(CALIBRATION_PHASE.SILENCE);
  }

  startPhase(phase) {
    this.phase = phase;
    this.elapsedMs = 0;
    this.samples = [];
    this.voicedSeconds = 0;
    this.quietSeconds = 0;
    this.aaaFrames = []; // cuadros de su "Aaaa", para guardar su tono
    this.aaaDecibels = []; // volumen de su "Aaaa": la barra se mide con él, no con toda la palabra
    this.aaaSeconds = 0;
  }

  /** Vuelve a pedir la palabra sin volver a medir el silencio, aceptando una voz más bajita. */
  retrySpeaking() {
    this.attempt += 1;
    this.startPhase(CALIBRATION_PHASE.SPEAK);
  }

  /** Umbrales del intento actual (el último se repite). */
  get voicedOverNoise() {
    return byAttempt(CALIBRATION.voicedOverNoiseDecibels, this.attempt);
  }

  get voicedSecondsNeeded() {
    return byAttempt(CALIBRATION.voicedSecondsNeeded, this.attempt);
  }

  /** Avance de la fase actual, de 0 a 1. */
  get progress() {
    if (this.phase === CALIBRATION_PHASE.SILENCE) return Math.min(1, this.elapsedMs / CALIBRATION.silenceMs);
    if (this.phase === CALIBRATION_PHASE.SPEAK) return Math.min(1, this.voicedSeconds / this.voicedSecondsNeeded);
    return 1;
  }

  /** `features` son los rasgos del cuadro (AaaDetector), o null sin micrófono. @returns {string} la fase después de este cuadro */
  update(deltaSeconds, decibels, features = null) {
    this.elapsedMs += deltaSeconds * 1000;
    if (this.phase === CALIBRATION_PHASE.SILENCE) this.listenToSilence(decibels);
    else if (this.phase === CALIBRATION_PHASE.SPEAK) this.listenToVoice(deltaSeconds, decibels, features);
    return this.phase;
  }

  listenToSilence(decibels) {
    this.samples.push(decibels);
    if (this.elapsedMs < CALIBRATION.silenceMs) return;
    this.noiseDecibels = percentile(this.samples, CALIBRATION.noisePercentile);
    this.startPhase(CALIBRATION_PHASE.SPEAK);
  }

  listenToVoice(deltaSeconds, decibels, features) {
    if (decibels >= this.noiseDecibels + this.voicedOverNoise) {
      this.samples.push(decibels);
      this.voicedSeconds += deltaSeconds;
      this.quietSeconds = 0;
      if (features?.isAaa) {
        this.aaaFrames.push(features);
        this.aaaDecibels.push(decibels);
        this.aaaSeconds += deltaSeconds;
      }
    } else {
      this.quietSeconds += deltaSeconds;
    }

    const enoughVoice = this.voicedSeconds >= this.voicedSecondsNeeded;
    if (enoughVoice && this.quietSeconds >= CALIBRATION.endAfterQuietSeconds) return this.finish();
    if (this.elapsedMs >= CALIBRATION.speakMaxMs) {
      if (enoughVoice) this.finish();
      else this.phase = CALIBRATION_PHASE.FAILED;
    }
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
    const heldAaa = this.aaaSeconds >= AAA.pitchMinSeconds;
    const voiceDecibels = heldAaa
      ? percentile(this.aaaDecibels, CALIBRATION.aaaPercentile)
      : percentile(this.samples, CALIBRATION.voicePercentile);
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
      // Tono de su "Aaaa" (de "¡Aaaa-rriba!"); si casi no sostuvo la "a", no se guarda.
      ownPitch: heldAaa ? typicalPitch(this.aaaFrames) : null,
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
