import { Screen } from '../core/Screen.js';
import { pauseMenu, simControls } from '../ui/components.js';
import { StartScreen } from './StartScreen.js';

const PAUSE_KEYS = new Set(['Escape', 'KeyP']);

/**
 * Base de las pantallas que escuchan la voz del niño.
 * Activa la voz simulada mientras la pantalla está abierta y muestra sus botones
 * cuando no hay micrófono. Si el HUD trae botón de pausa, también maneja el menú de pausa.
 */
export class VoiceScreen extends Screen {
  onMount() {
    const simulated = this.app.simulatedVoice;
    simulated.activate();
    this.addCleanup(() => simulated.deactivate());
    if (this.app.voice.isReady && !this.app.voice.usesMicrophone) this.showSimControls();
    if (this.$('#pause')) this.bindPause();
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

  /** Botón de pausa del HUD; Esc o P también pausan y reanudan. */
  bindPause() {
    this.onClick('pause', () => this.openPauseMenu());
    this.listen(window, 'keydown', (event) => {
      if (!PAUSE_KEYS.has(event.code)) return;
      event.preventDefault();
      if (this.paused) this.closePauseMenu();
      else this.openPauseMenu();
    });
  }

  openPauseMenu() {
    if (this.paused) return;
    this.pause();
    this.app.simulatedVoice.setPaused(true);
    this.root.insertAdjacentHTML('beforeend', pauseMenu());
    this.onClick('resume', () => this.closePauseMenu());
    this.onClick('quit', () => this.toggleQuitConfirm(true));
    this.onClick('quit-cancel', () => this.closePauseMenu());
    this.onClick('quit-confirm', () => this.app.go(StartScreen));
    this.$('#resume').focus();
  }

  closePauseMenu() {
    if (!this.paused) return;
    this.$('#pause-menu')?.remove();
    this.app.simulatedVoice.setPaused(false);
    this.resume();
  }

  toggleQuitConfirm(show) {
    this.$('#pause-main').hidden = show;
    this.$('#pause-confirm').hidden = !show;
    this.$(show ? '#quit-cancel' : '#resume').focus();
  }
}
