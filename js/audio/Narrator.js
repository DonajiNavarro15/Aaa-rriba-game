import { NARRATOR } from '../config.js';

/**
 * Reproduce las frases grabadas en assets/audio (ver narration.js y grabar.html),
 * para los niños que todavía no leen bien. Respeta el botón de sonido.
 * Solo suena una frase a la vez: una nueva corta la anterior.
 * Si una frase todavía no está grabada, no suena y la pantalla sigue normal.
 */
export class Narrator {
  constructor(soundEngine) {
    this.soundEngine = soundEngine;
    this.current = null;
    this.endedAt = -Infinity;
  }

  /**
   * true mientras suena (y un momento después, por el eco del cuarto); las pantallas que
   * escuchan al niño se esperan para no confundir la grabación con su voz.
   */
  get speaking() {
    return this.current !== null || performance.now() - this.endedAt < NARRATOR.tailMs;
  }

  static fileFor(clip) {
    return `${NARRATOR.folder}/${clip}.${NARRATOR.extension}`;
  }

  /** Reproduce la frase `clip`. `onEnd` se llama al terminar, o enseguida si no hay grabación o el sonido está apagado. */
  say(clip, onEnd = null) {
    this.stop();
    if (!this.soundEngine.enabled) {
      onEnd?.();
      return;
    }
    const audio = new Audio(Narrator.fileFor(clip));
    const finish = (heard) => {
      if (this.current !== audio) return; // la cortó otra frase o stop()
      this.current = null;
      if (heard) this.endedAt = performance.now(); // sin grabación no hay eco que esperar
      onEnd?.();
    };
    audio.addEventListener('ended', () => finish(true));
    audio.addEventListener('error', () => finish(false));
    this.current = audio;
    // Espera a que la pantalla termine de aparecer (animación de entrada) antes de hablar.
    setTimeout(() => {
      if (this.current === audio) audio.play().catch(() => finish(false));
    }, NARRATOR.startDelayMs);
  }

  /** Calla sin avisar a quien la pidió (se usa al cambiar de pantalla, pausar o apagar el sonido). */
  stop() {
    const audio = this.current;
    this.current = null;
    audio?.pause();
  }
}
