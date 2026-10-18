import { FLIGHT, HOOPS, VOICE } from '../config.js';

/** Resultado de cada cuadro de vuelo. */
export const FLIGHT_EVENT = Object.freeze({
  NONE: 'none',
  LAUNCHED: 'launched',
  POPPED: 'popped',
  REACHED_HOOPS: 'reached-hoops',
});

/**
 * Física del globo, sin DOM: recibe el nivel de voz y calcula la posición.
 * - Voz en la zona "sube" → el globo sube (más fuerte, más rápido).
 * - Silencio → baja.
 * - En peligro demasiado tiempo → revienta.
 * La altura está limitada entre el aro de arriba y el de abajo para que el niño
 * siempre pueda apuntar a un aro.
 */
export class BalloonFlight {
  constructor() {
    this.x = FLIGHT.startX;
    this.y = FLIGHT.groundY;
    this.verticalSpeed = 0;
    this.launched = false;
    this.secondsInDanger = 0;
    this.finished = false;
  }

  get centerY() {
    return this.y + FLIGHT.centerOffsetY;
  }

  get tiltDegrees() {
    const tilt = this.verticalSpeed / 25;
    return Math.max(-FLIGHT.maxTiltDegrees, Math.min(FLIGHT.maxTiltDegrees, tilt));
  }

  update(deltaSeconds, voiceLevel) {
    if (this.finished) return FLIGHT_EVENT.NONE;

    this.steer(deltaSeconds, voiceLevel);
    const event = this.checkLaunch();
    if (this.launched) this.x += FLIGHT.horizontalSpeed * deltaSeconds;

    if (this.isPopping(deltaSeconds, voiceLevel)) return this.finish(FLIGHT_EVENT.POPPED);
    if (this.x + FLIGHT.width / 2 >= HOOPS.x + HOOPS.width / 2) return this.finish(FLIGHT_EVENT.REACHED_HOOPS);
    return event;
  }

  steer(deltaSeconds, voiceLevel) {
    const targetSpeed =
      voiceLevel >= VOICE.riseThreshold
        ? -(FLIGHT.baseRiseSpeed + (voiceLevel - VOICE.riseThreshold) * FLIGHT.riseGainPerLevel)
        : FLIGHT.fallSpeed;
    this.verticalSpeed += (targetSpeed - this.verticalSpeed) * Math.min(1, FLIGHT.steering * deltaSeconds);
    this.y = Math.max(FLIGHT.ceilingY, Math.min(FLIGHT.groundY, this.y + this.verticalSpeed * deltaSeconds));
  }

  checkLaunch() {
    if (this.launched || this.y >= FLIGHT.groundY - FLIGHT.launchMargin) return FLIGHT_EVENT.NONE;
    this.launched = true;
    return FLIGHT_EVENT.LAUNCHED;
  }

  isPopping(deltaSeconds, voiceLevel) {
    this.secondsInDanger = voiceLevel >= VOICE.dangerThreshold ? this.secondsInDanger + deltaSeconds : 0;
    return this.secondsInDanger > VOICE.popAfterSeconds;
  }

  finish(event) {
    this.finished = true;
    return event;
  }

  /** Índice del aro que cruzó el globo, o -1 si pasó entre aros. */
  hoopIndex() {
    return HOOPS.tops.findIndex((top) => Math.abs(this.centerY - (top + HOOPS.height / 2)) <= HOOPS.hitRadius);
  }
}
