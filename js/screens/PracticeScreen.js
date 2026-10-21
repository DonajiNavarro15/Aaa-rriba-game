import { VoiceScreen } from './VoiceScreen.js';
import { balloon, gameHud, hoopArt, hoopColumn, image, voiceMeter } from '../ui/components.js';
import { icons } from '../ui/icons.js';
import { balloonPop, confetti, levelBanner, toast } from '../ui/effects.js';
import { BalloonFlight, FLIGHT_EVENT } from '../game/BalloonFlight.js';
import { FLIGHT, HOOPS, PRACTICE } from '../config.js';
import { QuestionScreen } from './QuestionScreen.js';

/** Un ejercicio por aro, de arriba hacia abajo (mismo orden que HOOPS.tops). */
const EXERCISES = [
  { name: 'de arriba', hint: 'Grita Aaaa sin parar.' },
  { name: 'de en medio', hint: 'Grita un poquito y descansa.' },
  { name: 'de abajo', hint: 'Grita poquito y luego, ¡shhh!' },
];
const PRAISES = ['¡Muy bien!', '¡Súper!', '¡Lo lograste!'];
const SKIP_BUTTON = '<button type="button" class="back-btn" id="skip">Saltar práctica</button>';
const GLIDE_MS = 350;
const FADE_MS = 900;
const TOAST_MS = 1700;

/**
 * 05 · Práctica: tres ejercicios sin puntos ni pregunta. El niño cruza el aro de arriba,
 * luego el del medio y luego el de abajo; si falla, repite el mismo sin castigo.
 * La narración grabada explica cada ejercicio y cada aviso; mientras suena, el globo espera.
 * Al terminar (o con "Saltar práctica") empieza el juego.
 */
export class PracticeScreen extends VoiceScreen {
  constructor(app, exercise = 0, retrying = false) {
    super(app);
    this.exercise = exercise;
    this.retrying = retrying;
    this.pending = null; // siguiente paso, cuando pase el tiempo y termine la narración
  }

  render() {
    const steps = EXERCISES.map((_, i) => {
      const state = i < this.exercise ? 'ok' : i === this.exercise ? 'current' : '';
      return `<span class="progress__step ${state && `progress__step--${state}`}"></span>`;
    }).join('');
    const center = `<div class="hud__center"><span class="hud__label">Práctica ${this.exercise + 1} de ${EXERCISES.length}<span class="hud__level">Sin puntos</span></span><span class="progress">${steps}</span></div>`;
    const { name, hint } = EXERCISES[this.exercise];
    return `
      ${image('moon', { x: -140, y: 430, width: 480, height: 230, className: 'art--ground' })}
      ${image('greenPlanet', { x: 470, y: 440, width: 50, height: 50 })}
      ${image('purplePlanet', { x: 40, y: 110, width: 40, height: 40 })}
      ${gameHud({ playerName: this.app.session.playerName, points: null, center, soundOn: this.app.sound.enabled, pausable: true, actions: SKIP_BUTTON })}
      <div class="practice-plate anim-enter">Pasa por el aro <b class="text-gold">${name}</b><span class="practice-plate__hint">${hint}</span></div>
      ${hoopColumn(HOOPS.tops.map(() => null))}
      ${balloon({ x: 0, y: 0 })}
      ${voiceMeter()}`;
  }

  onMount() {
    super.onMount();
    this.bindMuteButton();
    this.onClick('skip', () => this.play(), { sound: false });
    this.markTarget();
    this.flight = new BalloonFlight();
    this.balloonElement = this.$('#balloon');
    this.drawBalloon();
    this.loop((deltaSeconds, now) => this.update(deltaSeconds, now));

    if (!this.retrying) this.app.narrator.say(`practica-${this.exercise + 1}`);
  }

  /** Reproduce un aviso y sigue con `action` cuando pasen `minMs` y termine la narración. */
  sayThen(clip, minMs, action) {
    this.app.narrator.say(clip);
    this.pending = { at: performance.now() + minMs, action };
  }

  /** Solo el aro del ejercicio queda encendido. */
  markTarget() {
    HOOPS.tops.forEach((_, i) => {
      const hoop = this.$(`#hoop-${i}`);
      const isTarget = i === this.exercise;
      hoop.innerHTML = hoopArt(isTarget ? 'ready' : 'off');
      hoop.classList.toggle('hoop--off', !isTarget);
    });
  }

  update(deltaSeconds, now) {
    const level = this.readVoice(deltaSeconds);
    const narrating = this.app.narrator.speaking;
    if (this.pending && now >= this.pending.at && !narrating) {
      const { action } = this.pending;
      this.pending = null;
      return action();
    }
    if (narrating) return; // el globo no se mueve con la narración
    const event = this.flight.update(deltaSeconds, level);
    this.drawBalloon();

    if (event === FLIGHT_EVENT.LAUNCHED) {
      this.balloonElement.querySelector('.balloon__body').classList.remove('anim-bob');
      this.app.sfx.whoosh();
    }
    if (event === FLIGHT_EVENT.POPPED) this.handlePop();
    if (event === FLIGHT_EVENT.REACHED_HOOPS) this.handleHoops();
  }

  drawBalloon() {
    const { x, y, tiltDegrees } = this.flight;
    this.balloonElement.style.transform = `translate(${x}px, ${y}px) rotate(${tiltDegrees}deg)`;
  }

  handlePop() {
    const { x, y } = this.flight;
    this.app.sfx.pop();
    this.balloonElement.style.visibility = 'hidden';
    balloonPop(this.root, x, y);
    toast(this.root, { tone: 'danger', icon: icons.warning(), text: '¡PUM! Más suavecito', durationMs: TOAST_MS });
    this.retry('practica-pum');
  }

  handleHoops() {
    const hoopIndex = this.flight.hoopIndex();
    if (hoopIndex !== this.exercise) return this.handleMissedTarget(hoopIndex);

    this.glideInto(hoopIndex);
    const hoop = this.$(`#hoop-${hoopIndex}`);
    hoop.innerHTML = hoopArt('correct');
    hoop.classList.add('anim-win');
    this.app.sfx.correct();
    confetti(this.root, HOOPS.x + HOOPS.width / 2, HOOPS.tops[hoopIndex] + HOOPS.height / 2, 34);
    this.$$('.progress__step')[this.exercise].className = 'progress__step progress__step--ok';

    const next = this.exercise + 1;
    if (next < EXERCISES.length) {
      const praise = PRAISES[this.exercise];
      toast(this.root, { tone: 'success', icon: icons.check(26), text: praise, durationMs: TOAST_MS });
      this.sayThen(`practica-bien-${next}`, PRACTICE.feedbackMs, () => this.app.go(PracticeScreen, next));
      return;
    }
    this.after(PRACTICE.feedbackMs / 2, () => {
      levelBanner(this.root, '¡Ya sabes volar!', 'Ahora sí, ¡a la misión!');
      this.app.sfx.levelUp();
      this.sayThen('practica-completa', PRACTICE.doneMs, () => this.play());
    });
  }

  /** Pasó por otro aro o entre aros: repite el mismo ejercicio. */
  handleMissedTarget(hoopIndex) {
    this.app.sfx.miss();
    const text = hoopIndex < 0 ? '¡Casi! Pasa por adentro' : `Ese no. Busca el aro ${EXERCISES[this.exercise].name}`;
    toast(this.root, { tone: 'soft', icon: icons.arrowUp(), text, durationMs: TOAST_MS });
    this.balloonElement.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, fill: 'forwards' });
    this.retry(hoopIndex < 0 ? 'practica-casi' : `practica-ese-no-${this.exercise + 1}`);
  }

  /** Reproduce el aviso y sale otro globo para el mismo ejercicio. */
  retry(clip) {
    this.sayThen(clip, PRACTICE.retryMs, () => this.app.go(PracticeScreen, this.exercise, true));
  }

  glideInto(hoopIndex) {
    const from = `translate(${this.flight.x}px, ${this.flight.y}px)`;
    const to = `translate(${HOOPS.x + (HOOPS.width - FLIGHT.width) / 2}px, ${HOOPS.tops[hoopIndex] + HOOPS.height / 2 - FLIGHT.centerOffsetY}px)`;
    this.balloonElement.animate([{ transform: from }, { transform: to }], { duration: GLIDE_MS, fill: 'forwards', easing: 'ease-out' });
  }

  /** Empieza la partida de verdad. */
  play() {
    this.app.sfx.launch();
    this.app.session.reset();
    this.app.go(QuestionScreen);
  }
}
