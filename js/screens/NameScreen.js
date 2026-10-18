import { Screen } from '../core/Screen.js';
import { button, chip, escapeHtml, image, panelHeader, topBar } from '../ui/components.js';
import { icons } from '../ui/icons.js';
import { PLAYER_VISOR } from '../config.js';
import { StartScreen } from './StartScreen.js';
import { VoiceTestScreen } from './VoiceTestScreen.js';

const MAX_NAME_LENGTH = 12;
const FOCUS_DELAY_MS = 300;

/** 02 · Credencial de astronauta (nombre) */
export class NameScreen extends Screen {
  render() {
    return `
      ${topBar({ right: chip('Paso 1 de 2'), soundOn: this.app.sound.enabled })}
      ${image('redPlanet', { x: 70, y: 430, width: 70, height: 70 })}
      ${image('purplePlanet', { x: 840, y: 110, width: 56, height: 56 })}
      <div class="layer" style="padding-top:20px">
        <form class="panel anim-enter" id="name-form" style="width:720px;padding:28px 36px 32px;gap:22px" autocomplete="off">
          ${panelHeader('Credencial de astronauta', { tone: 'blue', icon: icons.helmet(PLAYER_VISOR, 34) })}
          <div class="row" style="align-items:stretch;gap:26px;width:100%">
            <div class="badge-card"><span class="anim-bob">${icons.helmet(PLAYER_VISOR, 110)}</span>${chip('Tripulante', { gold: true, small: true })}</div>
            <div class="stack grow" style="align-items:flex-start;text-align:left">
              <label class="field-label" for="player-name">Tu nombre</label>
              <input class="field" id="player-name" type="text" maxlength="${MAX_NAME_LENGTH}" placeholder="Escribe tu nombre" value="${escapeHtml(this.app.session.playerName)}">
              <p class="text-small">Al terminar, aparecerás en la Tripulación estrella según tus puntos.</p>
              <div class="row row--start" style="margin-top:8px">${button('Listo', { id: 'ready', size: 'small' })}</div>
            </div>
          </div>
        </form>
      </div>`;
  }

  onMount() {
    this.input = this.$('#player-name');
    this.readyButton = this.$('#ready');

    this.listen(this.input, 'input', () => {
      this.updateReadyState();
      this.app.sfx.keyTap();
    });
    this.listen(this.$('#name-form'), 'submit', (event) => {
      event.preventDefault();
      this.app.sound.unlock();
      this.app.sfx.click();
      this.submit();
    });
    this.onClick('ready', () => this.submit());
    this.onClick('back', () => this.app.go(StartScreen));
    this.bindMuteButton();

    this.updateReadyState();
    this.after(FOCUS_DELAY_MS, () => this.input.focus());
  }

  get name() {
    return this.input.value.trim();
  }

  updateReadyState() {
    this.readyButton.disabled = !this.name;
    this.input.classList.toggle('field--filled', Boolean(this.name));
  }

  submit() {
    if (!this.name) return;
    this.app.session.playerName = this.name;
    this.app.go(VoiceTestScreen);
  }
}
