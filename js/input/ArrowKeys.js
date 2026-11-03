const KEY_TO_DIRECTION = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

/** Flechas del teclado: mueven el globo aunque el micrófono falle. */
export class ArrowKeys {
  constructor() {
    this.pressed = new Set();
  }

  /** @returns {{x: number, y: number}} hacia dónde apuntan las flechas presionadas (-1, 0 o 1) */
  get direction() {
    const direction = { x: 0, y: 0 };
    this.pressed.forEach((code) => {
      direction.x += KEY_TO_DIRECTION[code].x;
      direction.y += KEY_TO_DIRECTION[code].y;
    });
    return direction;
  }

  handleKey(event, isDown) {
    if (!KEY_TO_DIRECTION[event.code]) return;
    event.preventDefault();
    if (isDown) this.pressed.add(event.code);
    else this.pressed.delete(event.code);
  }

  /** Al salir de la ventana el navegador no avisa cuando se suelta la tecla. */
  clear() {
    this.pressed.clear();
  }
}
