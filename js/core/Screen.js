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
    this.timers = new Set();
    this.loops = [];
    this.paused = false;
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

  /** Temporizador que se congela con `pause()` y sigue donde iba con `resume()`. */
  after(ms, callback) {
    const timer = { remaining: ms, callback, id: null, startedAt: 0 };
    this.timers.add(timer);
    if (!this.paused) this.startTimer(timer);
    this.cleanups.push(() => clearTimeout(timer.id));
  }

  startTimer(timer) {
    timer.startedAt = performance.now();
    timer.id = setTimeout(() => {
      this.timers.delete(timer);
      timer.callback();
    }, timer.remaining);
  }

  every(ms, callback) {
    const timer = setInterval(callback, ms);
    this.cleanups.push(() => clearInterval(timer));
  }

  loop(onFrame) {
    const gameLoop = new GameLoop(onFrame);
    gameLoop.start();
    this.loops.push(gameLoop);
    this.cleanups.push(() => gameLoop.stop());
    return gameLoop;
  }

  /** Congela la pantalla: temporizadores, bucles y animaciones. */
  pause() {
    if (this.paused) return;
    this.paused = true;
    this.pausedAt = performance.now();
    this.timers.forEach((timer) => {
      clearTimeout(timer.id);
      timer.remaining -= this.pausedAt - timer.startedAt;
    });
    this.loops.forEach((gameLoop) => gameLoop.stop());
    this.frozenAnimations = this.root.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running');
    this.frozenAnimations.forEach((animation) => animation.pause());
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.timers.forEach((timer) => this.startTimer(timer));
    this.loops.forEach((gameLoop) => gameLoop.start());
    this.frozenAnimations.forEach((animation) => animation.play());
    this.onResume(performance.now() - this.pausedAt);
  }

  /** Para pantallas que miden el tiempo por su cuenta: recibe cuánto duró la pausa. */
  onResume(pausedMs) {}

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
