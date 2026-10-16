import { VoiceScreen } from './VoiceScreen.js';
import { button, chip, image, panelHeader, topBar } from '../ui/components.js';
import { icons } from '../ui/icons.js';
import { VOICE } from '../config.js';
import { NameScreen } from './NameScreen.js';
import { HowToPlayScreen } from './HowToPlayScreen.js';

const POP_SHOW_MS = 1200;
const POP_COOLDOWN_MS = 1400;
const BALLOON_HALF_WIDTH = 20;

const STATUS = {
  quiet: { tone: 'quiet', icon: icons.arrowUp(), title: 'Un poco más fuerte', detail: 'Con esta voz el globo casi no despega.' },
  rise: { tone: 'rise', icon: icons.check(), title: '¡Comunicación perfecta!', detail: 'Con esta voz el globo sube.' },
  danger: { tone: 'danger', icon: icons.warning(), title: '¡Muy fuerte!', detail: 'En el juego, el globo se revienta.' },
};

/** 03 · Prueba de comunicación: el niño aprende qué tan fuerte gritar. */
export class VoiceTestScreen extends VoiceScreen {
  render() {
    const micChip = chip('Conectando…', { id: 'mic-chip', icon: `<span class="chip__icon">${icons.mic('#FFFFFF', 14)}</span>` });
    return `
      ${topBar({ right: chip('Paso 2 de 2') + micChip, soundOn: this.app.sound.enabled })}
      <div class="layer">
        <div class="panel anim-enter" style="width:780px;gap:12px;padding:24px 40px 26px">
          ${panelHeader('Prueba de comunicación', { tone: 'purple', icon: icons.mic('#FFFFFF', 26) })}
          <p class="text" style="max-width:560px">Revisa la comunicación con la base: grita <b>«Aaaa»</b> y mira hasta dónde llega la barra.</p>
          <div class="meter">
            <div class="meter__track">
              <span class="meter__danger"></span>
              <span class="meter__fill" id="meter-fill" style="width:0"></span>
              <div class="meter__balloon" id="meter-balloon">${image('balloon')}</div>
              <div class="meter__pop" id="meter-pop" hidden>${icons.pop()}</div>
            </div>
            <div class="meter__zones"><span class="meter__zone--quiet">Silencio</span><span class="meter__zone--rise">Sube</span><span class="meter__zone--danger">Peligro</span></div>
          </div>
          <div class="status"><span class="status__icon" id="status-icon"></span><span><span class="status__title" id="status-title"></span><span class="text-small" id="status-detail"></span></span></div>
          <div class="row" style="gap:28px">
            <label class="slider" for="sensitivity">Sensibilidad <input id="sensitivity" type="range" min="1" max="5" step="1" value="${this.app.voice.sensitivity}"></label>
            ${button('Continuar', { id: 'continue', size: 'small' })}
          </div>
        </div>
      </div>`;
  }

  onMount() {
    super.onMount();
    this.onClick('back', () => this.app.go(NameScreen));
    this.onClick('continue', () => this.app.go(HowToPlayScreen, { fromStart: false }));
    this.bindMuteButton();
    this.listen(this.$('#sensitivity'), 'input', (event) => (this.app.voice.sensitivity = Number(event.target.value)));

    this.connectMicrophone();
    this.lastPopAt = -Infinity;
    this.currentStatus = null;
    this.loop((deltaSeconds, now) => this.update(deltaSeconds, now));
  }

  async connectMicrophone() {
    const connected = await this.app.voice.connect();
    const micChip = this.$('#mic-chip');
    if (!micChip) return; // el niño ya cambió de pantalla
    micChip.lastChild.textContent = connected ? 'Escuchando' : 'Sin micrófono';
    if (!connected) this.showSimControls('Sin micrófono: mantén el botón o la barra espaciadora (F = muy fuerte)');
  }

  update(deltaSeconds, now) {
    const level = this.app.voice.read(deltaSeconds);
    const inDanger = level >= VOICE.dangerThreshold;
    if (inDanger && now - this.lastPopAt > POP_COOLDOWN_MS) {
      this.lastPopAt = now;
      this.app.sfx.pop();
    }
    const showingPop = now - this.lastPopAt < POP_SHOW_MS;

    const fill = this.$('#meter-fill');
    fill.style.width = `calc(${level}% - 6px)`;
    fill.classList.toggle('meter__fill--hot', inDanger);
    const meterBalloon = this.$('#meter-balloon');
    meterBalloon.style.left = `calc(${level}% - ${BALLOON_HALF_WIDTH}px)`;
    meterBalloon.style.visibility = showingPop ? 'hidden' : 'visible';
    this.$('#meter-pop').hidden = !showingPop;

    this.showStatus(showingPop ? 'danger' : level >= VOICE.riseThreshold ? 'rise' : 'quiet');
  }

  showStatus(key) {
    if (key === this.currentStatus) return;
    this.currentStatus = key;
    const status = STATUS[key];
    const icon = this.$('#status-icon');
    icon.className = `status__icon status__icon--${status.tone}`;
    icon.innerHTML = status.icon;
    this.$('#status-title').textContent = status.title;
    this.$('#status-detail').textContent = status.detail;
  }
}
