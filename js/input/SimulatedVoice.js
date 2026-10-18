/** Intensidad simulada: 0 = silencio, 1 = grito normal, 2 = grito muy fuerte. */
export const SHOUT = Object.freeze({ NONE: 0, NORMAL: 1, LOUD: 2 });

const KEY_TO_SHOUT = { Space: SHOUT.NORMAL, KeyF: SHOUT.LOUD };

/**
 * Permite jugar sin micrófono: barra espaciadora o botón = grito, F o botón rojo = grito muy fuerte.
 * Solo escucha el teclado mientras una pantalla de juego lo tenga activado.
 */
export class SimulatedVoice {
  constructor() {
    this.pressed = new Set();
    this.active = false;
    this.buttons = [];
    window.addEventListener('keydown', (event) => this.handleKey(event, true));
    window.addEventListener('keyup', (event) => this.handleKey(event, false));
  }

  get intensity() {
    let strongest = SHOUT.NONE;
    this.pressed.forEach((source) => (strongest = Math.max(strongest, Number(source.split(':')[1]))));
    return strongest;
  }

  activate() {
    this.active = true;
  }

  deactivate() {
    this.active = false;
    this.pressed.clear();
    this.buttons = [];
  }

  handleKey(event, isDown) {
    const shout = KEY_TO_SHOUT[event.code];
    if (!shout || event.target.tagName === 'INPUT') return;
    if (!this.active) return;
    event.preventDefault();
    this.setPressed(`key-${event.code}:${shout}`, isDown);
  }

  /** Durante la pausa ignora teclado y botones, sin olvidar los botones conectados. */
  setPaused(paused) {
    this.active = !paused;
    this.pressed.clear();
    this.setPressed('', false);
  }

  /** Conecta los botones en pantalla (atributo data-shout="1" o "2"). */
  bindButtons(buttons) {
    this.buttons = buttons;
    buttons.forEach((button) => {
      const source = `button-${button.dataset.shout}:${button.dataset.shout}`;
      const press = (event) => {
        event.preventDefault();
        this.setPressed(source, true);
      };
      const release = () => this.setPressed(source, false);
      button.addEventListener('pointerdown', press);
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((name) => button.addEventListener(name, release));
    });
  }

  setPressed(source, isDown) {
    if (isDown) this.pressed.add(source);
    else this.pressed.delete(source);
    this.buttons.forEach((button) =>
      button.classList.toggle('is-pressed', [...this.pressed].some((s) => s.startsWith(`button-${button.dataset.shout}`)))
    );
  }
}
