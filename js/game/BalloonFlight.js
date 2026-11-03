import { FLIGHT, HOOPS, VOICE } from '../config.js';

/** Resultado de cada cuadro de vuelo. */
export const FLIGHT_EVENT = Object.freeze({
  NONE: 'none',
  LAUNCHED: 'launched',
  POPPED: 'popped',
  REACHED_HOOPS: 'reached-hoops',
});

const NO_ARROWS = Object.freeze({ x: 0, y: 0 });

/**
 * Física del globo, sin DOM: recibe el nivel de voz y calcula la posición.
 * - Voz en la zona "sube" → el globo sube (más fuerte, más rápido).
 * - Silencio → baja.
 * - En peligro demasiado tiempo → revienta.
 * - Flechas del teclado → lo mueven en las cuatro direcciones. Desde la primera flecha el globo se
 *   queda donde lo dejen, para poder apuntar sin voz; si además hay voz, sigue subiendo y avanzando.
 * La altura está limitada entre el aro de arriba y el de abajo para que el niño
 * siempre pueda apuntar a un aro.
 */
export class BalloonFlight {
  constructor() {
    this.x = FLIGHT.startX;
    this.y = FLIGHT.groundY;
    this.verticalSpeed = 0;
    this.launched = false;
    this.usingArrows = false;
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

  update(deltaSeconds, voiceLevel, arrows = NO_ARROWS) {
    if (this.finished) return FLIGHT_EVENT.NONE;

    const arrowPressed = arrows.x !== 0 || arrows.y !== 0;
    if (arrowPressed) this.usingArrows = true;
    this.steer(deltaSeconds, voiceLevel, arrows.y);
    const event = this.checkLaunch(arrowPressed);
    this.moveForward(deltaSeconds, voiceLevel, arrows.x);

    if (this.isPopping(deltaSeconds, voiceLevel)) return this.finish(FLIGHT_EVENT.POPPED);
    if (this.x + FLIGHT.width / 2 >= HOOPS.x + HOOPS.width / 2) return this.finish(FLIGHT_EVENT.REACHED_HOOPS);
    return event;
  }

  steer(deltaSeconds, voiceLevel, arrowY) {
    const targetSpeed = arrowY !== 0 ? arrowY * FLIGHT.arrowSpeed : this.voiceSpeed(voiceLevel);
    this.verticalSpeed += (targetSpeed - this.verticalSpeed) * Math.min(1, FLIGHT.steering * deltaSeconds);
    this.y = Math.max(FLIGHT.ceilingY, Math.min(FLIGHT.groundY, this.y + this.verticalSpeed * deltaSeconds));
  }

  voiceSpeed(voiceLevel) {
    if (voiceLevel >= VOICE.riseThreshold) return -(FLIGHT.baseRiseSpeed + (voiceLevel - VOICE.riseThreshold) * FLIGHT.riseGainPerLevel);
    return this.usingArrows ? 0 : FLIGHT.fallSpeed;
  }

  moveForward(deltaSeconds, voiceLevel, arrowX) {
    if (!this.launched) return;
    const drifting = !this.usingArrows || voiceLevel >= VOICE.riseThreshold;
    const speed = arrowX !== 0 ? arrowX * FLIGHT.arrowSpeed : drifting ? FLIGHT.horizontalSpeed : 0;
    this.x = Math.max(FLIGHT.minX, this.x + speed * deltaSeconds);
  }

  checkLaunch(arrowPressed) {
    if (this.launched || (!arrowPressed && this.y >= FLIGHT.groundY - FLIGHT.launchMargin)) return FLIGHT_EVENT.NONE;
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
