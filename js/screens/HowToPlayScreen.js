import { Screen } from '../core/Screen.js';
import { button, chip, image, panelHeader, ruleTile, topBar } from '../ui/components.js';
import { icons } from '../ui/icons.js';
import { VoiceTestScreen } from './VoiceTestScreen.js';
import { NameScreen } from './NameScreen.js';

/** 03 · Tu misión: las reglas del juego antes de medir la voz y practicar. */
export class HowToPlayScreen extends Screen {
  render() {
    return `
      ${topBar({ backLabel: 'Volver', right: chip('Paso 2 de 3'), soundOn: this.app.sound.enabled })}
      ${image('greenPlanet', { x: 40, y: 450, width: 64, height: 64 })}
      ${image('redPlanet', { x: 870, y: 100, width: 50, height: 50 })}
      <div class="layer" style="gap:22px">
        <div class="panel anim-enter" style="width:840px;padding:22px 34px 26px;gap:20px">
          ${panelHeader('Tu misión', { tone: 'gold' })}
          <div class="row" style="gap:26px;align-items:stretch">
            ${ruleTile(1, `<span class="anim-bob">${icons.rule('up')}</span>`, 'Grita sin parar', 'El globo sube')}
            ${ruleTile(2, icons.rule('down'), 'Guarda silencio', 'El globo baja')}
            ${ruleTile(3, icons.rule('boom'), 'Grita muy fuerte', '¡Se revienta!')}
          </div>
          <p class="text" style="font-size:20px">Busca el aro con la <b class="text-gold">respuesta</b> y llega a los planetas.</p>
          ${button('Probar mi voz', { id: 'continue' })}
        </div>
      </div>`;
  }

  onMount() {
    this.onClick('back', () => this.app.go(NameScreen));
    this.onClick('continue', () => this.app.go(VoiceTestScreen));
    this.bindMuteButton();
    this.app.narrator.say('mision');
  }
}
