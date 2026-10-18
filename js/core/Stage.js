import { STAGE } from '../config.js';

const MIN_SCALE = 0.2;
/** Tope de crecimiento: en pantallas grandes el juego no se agranda más, se ve más cielo alrededor. */
const MAX_SCALE = 1.2;

/**
 * Hace que el escenario llene toda la ventana.
 * El área de juego mide 960×600 y queda centrada; el escenario crece hacia los lados
 * (o hacia arriba y abajo) según la forma de la ventana, así no quedan franjas.
 */
export class Stage {
  constructor(frame, stage) {
    this.frame = frame;
    this.stage = stage;
    window.addEventListener('resize', () => this.fit());
  }

  fit() {
    const viewport = this.frame.parentElement;
    const styles = getComputedStyle(viewport);
    const availableWidth = viewport.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
    const availableHeight = viewport.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);
    const scale = clamp(Math.min(availableWidth / STAGE.width, availableHeight / STAGE.height), MIN_SCALE, MAX_SCALE);
    const width = availableWidth / scale;
    const height = availableHeight / scale;

    this.stage.style.setProperty('--stage-width', `${width}px`);
    this.stage.style.setProperty('--stage-height', `${height}px`);
    this.stage.style.setProperty('--play-offset-x', `${(width - STAGE.width) / 2}px`);
    this.stage.style.setProperty('--play-offset-y', `${(height - STAGE.height) / 2}px`);
    this.stage.style.transform = `scale(${scale})`;
    this.frame.style.width = `${availableWidth}px`;
    this.frame.style.height = `${availableHeight}px`;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
