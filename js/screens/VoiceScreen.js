import { Screen } from '../core/Screen.js';
import { simControls } from '../ui/components.js';

/**
 * Base de las pantallas que escuchan la voz del niño.
 * Activa la voz simulada mientras la pantalla está abierta y muestra sus botones
 * cuando no hay micrófono.
 */
export class VoiceScreen extends Screen {
  onMount() {
    const simulated = this.app.simulatedVoice;
    simulated.activate();
    this.addCleanup(() => simulated.deactivate());
    if (this.app.voice.isReady && !this.app.voice.usesMicrophone) this.showSimControls();
  }

  showSimControls(note = '') {
    if (this.$('.sim-controls')) return;
    this.root.insertAdjacentHTML('beforeend', `${note && `<span class="sim-note">${note}</span>`}${simControls()}`);
    this.app.simulatedVoice.bindButtons(this.$$('.sim-controls__btn'));
  }

  /** Lee el nivel de voz y actualiza el medidor compacto si la pantalla lo tiene. */
  readVoice(deltaSeconds) {
    const level = this.app.voice.read(deltaSeconds);
    this.voiceFill ??= this.$('#voice-fill');
    if (this.voiceFill) this.voiceFill.style.width = `${level}%`;
    return level;
  }
}
