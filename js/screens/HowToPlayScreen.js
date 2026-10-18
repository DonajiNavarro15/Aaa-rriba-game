import { Screen } from '../core/Screen.js';
import { button, image, panelHeader, ruleTile, topBar } from '../ui/components.js';
import { icons } from '../ui/icons.js';
import { VoiceTestScreen } from './VoiceTestScreen.js';
import { QuestionScreen } from './QuestionScreen.js';

/** 04 · Tu misión: recordatorio de las reglas justo antes de la primera pregunta. */
export class HowToPlayScreen extends Screen {
  render() {
    return `
      ${topBar({ backLabel: 'Volver', soundOn: this.app.sound.enabled })}
      ${image('greenPlanet', { x: 40, y: 450, width: 64, height: 64 })}
      ${image('redPlanet', { x: 870, y: 100, width: 50, height: 50 })}
      <div class="layer" style="gap:22px">
        <div class="panel anim-enter" style="width:840px;padding:22px 34px 26px;gap:20px">
          ${panelHeader('Tu misión', { tone: 'gold' })}
          <div class="row" style="gap:26px;align-items:stretch">
            ${ruleTile(1, `<span class="anim-bob">${icons.rule('up')}</span>`, 'Sostén el grito', 'El globo sube')}
            ${ruleTile(2, icons.rule('down'), 'Deja de gritar', 'El globo baja')}
            ${ruleTile(3, icons.rule('boom'), 'Grita muy fuerte', '¡El globo se revienta!')}
          </div>
          <p class="text" style="font-size:20px">Cruza el aro con la <b class="text-gold">respuesta correcta</b> y llega hasta los planetas.</p>
          ${button('¡Despegar!', { id: 'continue' })}
        </div>
      </div>`;
  }

  onMount() {
    this.onClick('back', () => this.app.go(VoiceTestScreen));
    this.onClick('continue', () => {
      this.app.sfx.launch();
      this.app.session.reset();
      this.app.go(QuestionScreen);
    });
    this.bindMuteButton();
  }
}
