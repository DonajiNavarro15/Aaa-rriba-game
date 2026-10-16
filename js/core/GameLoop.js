const MAX_FRAME_SECONDS = 0.05;

/** Bucle de animación con delta de tiempo en segundos (limitado para evitar saltos). */
export class GameLoop {
  constructor(onFrame) {
    this.onFrame = onFrame;
    this.frameId = null;
    this.lastTime = 0;
  }

  start() {
    this.lastTime = performance.now();
    const tick = (now) => {
      const deltaSeconds = Math.min(MAX_FRAME_SECONDS, (now - this.lastTime) / 1000);
      this.lastTime = now;
      const keepGoing = this.onFrame(deltaSeconds, now);
      if (keepGoing !== false && this.frameId !== null) this.frameId = requestAnimationFrame(tick);
    };
    this.frameId = requestAnimationFrame(tick);
  }

  stop() {
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.frameId = null;
  }
}
