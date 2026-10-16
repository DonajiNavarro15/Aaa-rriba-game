import { STAGE } from '../config.js';

const MIN_SCALE = 0.2;
const MAX_SCALE = 1.5;

/** Escala el escenario fijo de 960×600 para que quepa en la ventana sin deformarse. */
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

    this.stage.style.transform = `scale(${scale})`;
    this.frame.style.width = `${STAGE.width * scale}px`;
    this.frame.style.height = `${STAGE.height * scale}px`;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
