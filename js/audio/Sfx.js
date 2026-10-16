/** Notas usadas por los efectos (Hz). */
const NOTE = {
  C4: 262, E4: 330, G4: 392, A4: 440, F4: 349, Eb4: 311, Bb3: 233,
  C5: 523, E5: 659, G5: 784, C6: 1047, E6: 1319, G6: 1568, C7: 2093,
};

/**
 * Catálogo de efectos de sonido con nombre. Cada efecto combina tonos y ruido del SoundEngine.
 * Para cambiar cómo suena algo del juego, se edita solo aquí.
 */
export class Sfx {
  constructor(engine) {
    this.engine = engine;
  }

  arpeggio(notes, { step = 0.08, duration = 0.3, wave = 'triangle', volume = 0.28 } = {}) {
    notes.forEach((frequency, i) => this.engine.tone(frequency, { delay: i * step, duration, wave, volume }));
  }

  click() {
    this.engine.tone(740, { duration: 0.07, volume: 0.22, slideTo: 520 });
  }

  keyTap() {
    this.engine.tone(900 + Math.random() * 300, { duration: 0.04, volume: 0.08 });
  }

  launch() {
    this.whoosh();
    this.arpeggio([NOTE.C4, NOTE.E4, NOTE.G4], { step: 0.07, duration: 0.2, volume: 0.15 });
  }

  whoosh() {
    this.engine.noise({ duration: 0.7, volume: 0.25, from: 300, to: 2400, sharpness: 2 });
  }

  correct() {
    this.arpeggio([NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6]);
    this.engine.tone(NOTE.G6, { delay: 0.34, duration: 0.4, wave: 'sine', volume: 0.12 });
    this.engine.tone(NOTE.C7, { delay: 0.42, duration: 0.35, wave: 'sine', volume: 0.08 });
  }

  /** Incorrecto: un «boing» suave que baja, sin sonar a regaño. */
  wrong() {
    this.engine.tone(NOTE.G4, { duration: 0.22, wave: 'sine', slideTo: NOTE.E4 });
    this.engine.tone(NOTE.Eb4, { delay: 0.2, duration: 0.38, wave: 'sine', slideTo: NOTE.Bb3 });
  }

  /** Pasó sin entrar a ningún aro. */
  miss() {
    this.engine.tone(300, { duration: 0.18, volume: 0.22, slideTo: 380 });
    this.engine.tone(380, { delay: 0.16, duration: 0.22, volume: 0.2, slideTo: 300 });
  }

  pop() {
    this.engine.noise({ duration: 0.35, volume: 0.7, from: 3000, to: 300, sharpness: 0.7 });
    this.engine.tone(160, { duration: 0.25, wave: 'sine', volume: 0.5, slideTo: 50 });
    this.engine.tone(900, { delay: 0.02, duration: 0.08, wave: 'square', volume: 0.08, slideTo: 300 });
  }

  levelUp() {
    const notes = [NOTE.G4, NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6];
    this.arpeggio(notes, { step: 0.09, duration: 0.28, wave: 'square', volume: 0.1 });
    this.arpeggio(notes, { step: 0.09, duration: 0.3, volume: 0.2 });
  }

  star(index) {
    this.engine.tone(NOTE.G5 + index * 196, { duration: 0.25, volume: 0.25 });
  }

  fanfare() {
    const melody = [
      [NOTE.C5, 0, 0.15], [NOTE.E5, 0.15, 0.15], [NOTE.G5, 0.3, 0.15],
      [NOTE.C6, 0.45, 0.5], [NOTE.G5, 0.75, 0.15], [NOTE.C6, 0.9, 0.7],
    ];
    melody.forEach(([frequency, delay, duration]) => {
      this.engine.tone(frequency, { delay, duration: duration + 0.1, wave: 'square', volume: 0.08 });
      this.engine.tone(frequency, { delay, duration: duration + 0.15, volume: 0.22 });
    });
    this.engine.tone(NOTE.C4, { duration: 1.6, volume: 0.15 });
  }

  /** Latido «lub-dub» para cuando se acaba el tiempo del bonus. */
  heartbeat() {
    this.engine.tone(70, { duration: 0.16, wave: 'sine', volume: 0.7, slideTo: 45 });
    this.engine.tone(64, { delay: 0.17, duration: 0.2, wave: 'sine', volume: 0.55, slideTo: 40 });
  }

  tick() {
    this.engine.tone(1400, { duration: 0.035, wave: 'square', volume: 0.06 });
  }

  wordSaid() {
    this.arpeggio([NOTE.C6, NOTE.E6, NOTE.G6], { step: 0.09, duration: 0.3, volume: 0.3 });
    this.engine.noise({ delay: 0.05, duration: 0.5, volume: 0.06, from: 6000, to: 9000, sharpness: 4 });
  }

  timeUp() {
    this.arpeggio([NOTE.C5, NOTE.A4, NOTE.F4], { step: 0.14, duration: 0.25, volume: 0.22 });
  }
}
