const MASTER_VOLUME = 0.5;
const ATTACK_SECONDS = 0.012;
const SILENCE = 0.001;

/**
 * Sintetizador mínimo con Web Audio: tonos y ruido filtrado.
 * No usa archivos de audio; todos los efectos se generan en el momento.
 */
export class SoundEngine {
  constructor() {
    this.context = null;
    this.master = null;
    this.enabled = true;
  }

  /** Crea o reanuda el contexto de audio. Debe llamarse desde un gesto del usuario. */
  unlock() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = MASTER_VOLUME;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') this.context.resume();
    return this.context;
  }

  toggle() {
    this.enabled = !this.enabled;
  }

  get canPlay() {
    return this.enabled && this.context !== null;
  }

  /**
   * @param {number} frequency  Hz
   * @param {object} options    delay y duración en segundos; slideTo cambia la frecuencia al final
   */
  tone(frequency, { delay = 0, duration = 0.2, wave = 'triangle', volume = 0.3, slideTo } = {}) {
    if (!this.canPlay) return;
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    this.envelope(gain, start, duration, volume);

    oscillator.connect(gain).connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  /** Ruido blanco pasado por un filtro que barre de `from` a `to` Hz. */
  noise({ delay = 0, duration = 0.3, volume = 0.3, from = 2000, to = 200, sharpness = 1 } = {}) {
    if (!this.canPlay) return;
    const start = this.context.currentTime + delay;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    source.buffer = this.whiteNoise(duration);
    filter.type = 'bandpass';
    filter.Q.value = sharpness;
    filter.frequency.setValueAtTime(from, start);
    filter.frequency.exponentialRampToValueAtTime(to, start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(SILENCE, start + duration);

    source.connect(filter).connect(gain).connect(this.master);
    source.start(start);
  }

  envelope(gain, start, duration, volume) {
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + ATTACK_SECONDS);
    gain.gain.exponentialRampToValueAtTime(SILENCE, start + duration);
  }

  whiteNoise(duration) {
    const length = Math.floor(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) samples[i] = Math.random() * 2 - 1;
    return buffer;
  }
}
