import { GameLoop } from './GameLoop.js';
import { icons } from '../ui/icons.js';

/**
 * Clase base de todas las pantallas.
 * - `render()` devuelve el HTML.
 * - `onMount()` conecta eventos y arranca animaciones.
 * Todo lo que se registre con `listen`, `after` o `loop` se limpia solo al salir.
 */
export class Screen {
  constructor(app) {
    this.app = app;
    this.root = null;
    this.cleanups = [];
  }

  render() {
    return '';
  }

  onMount() {}

  mount(root) {
    this.root = root;
    root.innerHTML = this.render();
    this.onMount();
  }

  unmount() {
    this.cleanups.forEach((cleanup) => cleanup());
    this.cleanups = [];
  }

  $(selector) {
    return this.root.querySelector(selector);
  }

  $$(selector) {
    return [...this.root.querySelectorAll(selector)];
  }

  listen(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    this.cleanups.push(() => target.removeEventListener(event, handler, options));
  }

  /** Clic con sonido; el primer clic también desbloquea el audio del navegador. */
  onClick(id, handler, { sound = true } = {}) {
    const element = this.root.querySelector(`#${id}`);
    if (!element) return;
    this.listen(element, 'click', (event) => {
      this.app.sound.unlock();
      if (sound) this.app.sfx.click();
      handler(event);
    });
  }

  after(ms, callback) {
    const timer = setTimeout(callback, ms);
    this.cleanups.push(() => clearTimeout(timer));
  }

  every(ms, callback) {
    const timer = setInterval(callback, ms);
    this.cleanups.push(() => clearInterval(timer));
  }

  loop(onFrame) {
    const gameLoop = new GameLoop(onFrame);
    gameLoop.start();
    this.cleanups.push(() => gameLoop.stop());
    return gameLoop;
  }

  addCleanup(cleanup) {
    this.cleanups.push(cleanup);
  }

  /** Botón de sonido que aparece en las barras superiores. */
  bindMuteButton() {
    this.onClick(
      'mute',
      () => {
        this.app.sound.toggle();
        this.$('#mute').innerHTML = icons.speaker(this.app.sound.enabled);
      },
      { sound: false }
    );
  }
}
