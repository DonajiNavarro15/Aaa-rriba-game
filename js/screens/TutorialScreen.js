import { Screen } from '../core/Screen.js';
import { button, earth, hoopArt, image, panelHeader, topBar } from '../ui/components.js';
import { icons } from '../ui/icons.js';
import { BONUS } from '../config.js';
import { StartScreen } from './StartScreen.js';
import { NameScreen } from './NameScreen.js';

/** Cada paso del tutorial: título, dibujo de la escena y explicación corta. */
const STEPS = [
  {
    title: 'Prueba tu voz',
    scene: () => `
      <span class="tuto-mic">${icons.mic('#FFFFFF', 64)}</span>
      <span class="tuto-shout anim-bob">¡Aaaa!</span>`,
    text: 'Antes de despegar, grita <b class="text-gold">Aaaa</b> para revisar que el micrófono te escuche.',
  },
  {
    title: 'Vuela con tu voz',
    scene: () => `
      <div class="tuto-rule"><span class="anim-bob">${icons.rule('up')}</span><b>Sostén el grito</b>Sube</div>
      <div class="tuto-rule">${icons.rule('down')}<b>Deja de gritar</b>Baja</div>
      <div class="tuto-rule">${icons.rule('boom')}<b>¡Muy fuerte!</b>Se revienta</div>`,
    text: 'Tu voz mueve el globo. ¡Cuidado! Si gritas <b class="text-gold">demasiado fuerte</b>, el globo se revienta.',
  },
  {
    title: 'Elige la respuesta',
    scene: () => `
      <span class="tuto-question">6 × 7 = ?</span>
      <div class="tuto-flight">
        <span class="tuto-balloon anim-bob">${image('balloon')}</span>
        <span class="tuto-path"></span>
        <div class="tuto-hoops">
          ${[36, 42, 48]
            .map((value) => {
              const correct = value === 42;
              return `<span class="tuto-hoop ${correct ? '' : 'tuto-hoop--off'}"><span class="tuto-hoop__art">${hoopArt(correct ? 'correct' : 'off')}</span><span class="tuto-plate ${correct ? 'tuto-plate--correct' : ''}">${value}</span></span>`;
            })
            .join('')}
        </div>
      </div>`,
    text: 'En tu pantalla aparecerá una operación matemática. Lleva el globo al aro que tenga la <b class="text-gold">respuesta correcta</b>.',
  },
  {
    title: 'Ronda bonus',
    scene: () => `
      <div class="tuto-word">
        <span class="tuto-word__label">${icons.mic('#FFFFFF', 18)}¡Di la palabra!</span>
        <span class="tuto-word__text">LUNA</span>
      </div>
      <span class="tuto-clock">${icons.clock()}</span>`,
    text: `Di en voz alta la palabra que aparece <b class="text-gold">antes de que se acabe el tiempo</b>. ¡Cada palabra vale ${BONUS.pointsPerWord} puntos!`,
  },
  {
    title: 'Llega a los planetas',
    scene: () => `
      <span class="tuto-balloon anim-bob">${image('balloon')}</span>
      <span class="tuto-path tuto-path--short"></span>
      <span class="tuto-planet anim-sway">${image('ringedPlanet')}<span class="tuto-flag">${image('flag')}</span></span>
      <span class="tuto-earth">${earth()}</span>`,
    text: 'Junta puntos, llega a los planetas y gana tu lugar en la <b class="text-gold">Tripulación estrella</b>.',
  },
];

/** Tutorial paso a paso desde el inicio: explica todo lo que pasa en una partida. */
export class TutorialScreen extends Screen {
  constructor(app) {
    super(app);
    this.step = 0;
  }

  render() {
    const dots = STEPS.map((_, i) => `<button type="button" class="tuto-dot" data-step="${i}" aria-label="Paso ${i + 1}"></button>`).join('');
    return `
      ${topBar({ backLabel: 'Inicio', soundOn: this.app.sound.enabled })}
      ${image('greenPlanet', { x: 40, y: 450, width: 64, height: 64, className: 'anim-spin' })}
      ${image('redPlanet', { x: 870, y: 100, width: 50, height: 50, className: 'anim-spin anim-spin--reverse' })}
      ${earth({ x: 860, y: 440, size: 76 })}
      <div class="layer">
        <div class="panel tuto anim-enter">
          <div id="tuto-step"></div>
          <div class="tuto-nav">
            ${button('Atrás', { id: 'prev', variant: 'light', size: 'small' })}
            <div class="tuto-dots" id="dots">${dots}</div>
            <div class="tuto-actions">
              ${button('Pantalla principal', { id: 'home', variant: 'light', size: 'small' })}
              ${button('Siguiente', { id: 'next', size: 'small' })}
            </div>
          </div>
        </div>
      </div>`;
  }

  onMount() {
    this.bindMuteButton();
    this.onClick('back', () => this.app.go(StartScreen));
    this.onClick('prev', () => this.show(this.step - 1));
    this.onClick('home', () => this.app.go(StartScreen));
    this.onClick('next', () => (this.isLastStep ? this.play() : this.show(this.step + 1)));
    this.listen(this.$('#dots'), 'click', (event) => {
      const dot = event.target.closest('[data-step]');
      if (!dot) return;
      this.app.sfx.click();
      this.show(Number(dot.dataset.step));
    });
    this.show(0);
  }

  get isLastStep() {
    return this.step === STEPS.length - 1;
  }

  show(step) {
    this.step = Math.max(0, Math.min(step, STEPS.length - 1));
    const { title, scene, text } = STEPS[this.step];
    this.$('#tuto-step').innerHTML = `
      <div class="tuto-step anim-enter">
        ${panelHeader(`<span class="tuto-count">${this.step + 1}/${STEPS.length}</span>${title}`, { tone: 'gold' })}
        <div class="tuto-scene">${scene()}</div>
        <p class="text tuto-text">${text}</p>
      </div>`;
    this.$('#prev').style.visibility = this.step === 0 ? 'hidden' : 'visible';
    this.$('#home').hidden = !this.isLastStep;
    this.$('#next').lastChild.textContent = this.isLastStep ? 'Ir a jugar' : 'Siguiente';
    this.$$('.tuto-dot').forEach((dot, i) => dot.classList.toggle('tuto-dot--on', i === this.step));
  }

  play() {
    this.app.sfx.launch();
    this.app.go(NameScreen);
  }
}
