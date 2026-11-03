import { Screen } from '../core/Screen.js';
import { balloon, button, chip, earth, hoopArt, hoopColumn, image, topBar, voiceMeter } from '../ui/components.js';
import { icons } from '../ui/icons.js';
import { renderSky } from '../ui/background.js';
import { balloonPop, confetti, pointsPopup } from '../ui/effects.js';
import { BalloonFlight, FLIGHT_EVENT } from '../game/BalloonFlight.js';
import { BONUS, DEMO, FLIGHT, HOOPS, VOICE } from '../config.js';
import { StartScreen } from './StartScreen.js';
import { NameScreen } from './NameScreen.js';
import { VoiceTestScreen } from './VoiceTestScreen.js';

const DEMO_QUESTION = { text: '6 × 7 =', options: [36, 42, 48], answer: 42 };
const DEMO_WORD = 'LUNA';
const TARGET_HOOP = DEMO_QUESTION.options.indexOf(DEMO_QUESTION.answer);
const LOUD = 100;
const SHOUT = 60;
const SKIP_LABEL = 'Saltar demo';

/**
 * Escenas del video. Los tiempos (ms) cuentan desde que empieza a sonar la frase, así lo que
 * se ve pasa cuando la voz lo dice (las marcas salen de las pausas de cada grabación).
 * - `voice(ms)`: qué tan fuerte "grita" el niño simulado (null = se guía solo hacia el aro).
 * - `bubble(ms)`: lo que dice el niño en su globo de diálogo (un texto por momento, sin parpadeos).
 * La escena dura lo que su frase y al menos `minMs`.
 */
const SCENES = [
  {
    stage: 'flight',
    caption: 'Grita <b>Aaaa</b>: el globo sube',
    clip: 'demo-sube', // "Cuando gritas Aaaa (1.2 s), el globo sube (2.2 s), sube y sube."
    minMs: 4500,
    voice: (ms) => (ms >= 1200 ? SHOUT : 0),
    bubble: (ms) => (ms >= 1200 ? '¡Aaaa!' : null),
  },
  {
    stage: 'continue',
    caption: 'Guarda silencio: el globo baja',
    clip: 'demo-silencio', // "Shhh… cuando guardas silencio, el globo baja."
    minMs: 2200,
    voice: () => 0,
    bubble: () => 'Shhh…',
  },
  {
    stage: 'flight',
    caption: 'Si gritas muy fuerte <b>el globo se revienta</b>',
    clip: 'demo-revienta', // "Si gritas muy fuerte, (1.6 s) el globo se revienta (2.1 s)." Revienta unos 0.37 s después de gritar fuerte.
    minMs: 4000,
    voice: (ms) => (ms < 1750 ? SHOUT : LOUD),
    bubble: (ms) => (ms < 1750 ? '¡Aaaa!' : '¡AAAA!'),
  },
  {
    stage: 'question',
    caption: 'Pasa el globo por el aro con la <b>respuesta correcta</b>',
    clip: 'demo-respuesta', // "Pasa el globo por el aro con la respuesta correcta."
    minMs: 5000,
    voice: null,
    bubble: (ms, scene, flight) => (flight.x < DEMO.bubbleHidesAtX ? '¡Aaaa!' : null), // cerca de los aros se quita para no taparlos
  },
  {
    stage: 'word',
    caption: 'Di la palabra <b>antes de que se acabe el tiempo</b>',
    clip: 'demo-palabra', // "Va a salir una palabra, y tienes que decirla en voz alta antes de que se acabe el tiempo." (5.2 s)
    minMs: 6800,
    sayWordAtMs: 5400, // el niño dice la palabra cuando la voz termina de explicar
    voice: null,
    bubble: (ms, scene) => (ms >= scene.sayWordAtMs ? `¡${DEMO_WORD}!` : null),
  },
];

/**
 * ¿Cómo se juega?: un video animado de unos 25 segundos hecho con el juego mismo.
 * Un niño simulado juega cada parte (subir, bajar, reventar, elegir la respuesta, decir la
 * palabra) mientras se escucha la explicación grabada. Al terminar se puede ver otra vez o ir a jugar.
 * `inGame`: se ve después del nombre, como paso para jugar; quien ya sabe jugar puede saltarlo.
 */
export class TutorialScreen extends Screen {
  constructor(app, { inGame = false } = {}) {
    super(app);
    this.inGame = inGame;
  }

  render() {
    return `
      ${topBar({ backLabel: this.inGame ? 'Volver' : 'Inicio', right: this.inGame ? chip('Paso 2 de 3') : '', soundOn: this.app.sound.enabled })}
      ${image('greenPlanet', { x: 30, y: 460, width: 56, height: 56, className: 'anim-spin' })}
      ${earth({ x: 872, y: 450, size: 64 })}
      <div class="layer">
        <div class="panel tuto anim-enter">
          <div class="demo-frame">
            <div class="demo-sky" id="demo-sky" aria-hidden="true"></div>
            <div class="demo-stage" id="demo-stage"></div>
            <span class="demo-progress"><span class="demo-progress__fill" id="demo-progress"></span></span>
          </div>
          <div class="tuto-nav">
            ${button('Ver otra vez', { id: 'replay', variant: 'light', size: 'small' })}
            ${button(this.inGame ? SKIP_LABEL : 'Ir a jugar', { id: 'go', size: 'small' })}
          </div>
        </div>
      </div>`;
  }

  onMount() {
    this.bindMuteButton();
    this.onClick('back', () => this.app.go(this.inGame ? NameScreen : StartScreen));
    this.onClick('replay', () => this.start());
    this.onClick('go', () => {
      this.app.sfx.launch();
      this.app.go(this.inGame ? VoiceTestScreen : NameScreen);
    });
    renderSky(this.$('#demo-sky'));
    this.stage = this.$('#demo-stage');
    this.progress = this.$('#demo-progress');
    this.after(DEMO.startDelayMs, () => this.start());
    this.loop((deltaSeconds) => this.tick(deltaSeconds));
  }

  start() {
    this.$('#replay').hidden = true;
    if (this.inGame) this.$('#go').lastChild.textContent = SKIP_LABEL;
    this.finished = false;
    this.showScene(0, true);
  }

  showScene(index, first = false) {
    this.sceneIndex = index;
    this.sceneMs = 0;
    const scene = SCENES[index];
    if (scene.stage !== 'continue') this.drawStage(scene.stage);
    this.$('#demo-caption').innerHTML = scene.caption;
    this.$('#demo-caption').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
    this.app.narrator.say(scene.clip, null, first ? {} : { delayMs: 0 });
  }

  drawStage(kind) {
    const ground = image('moon', { x: -140, y: 430, width: 480, height: 230, className: 'art--ground' });
    const planets = `${image('greenPlanet', { x: 470, y: 440, width: 50, height: 50 })}${image('purplePlanet', { x: 40, y: 110, width: 40, height: 40 })}`;
    const scenery = {
      flight: `${ground}${planets}${image('ringedPlanet', { x: 700, y: 150, width: 220, height: 146 })}${balloon({ x: 0, y: 0 })}${voiceMeter()}`,
      question: `${ground}${planets}<div class="question-plate">${DEMO_QUESTION.text}<span class="question-plate__answer" id="answer">?</span></div>${hoopColumn(DEMO_QUESTION.options)}${balloon({ x: 0, y: 0 })}${voiceMeter()}`,
      word: `${image('ringedPlanet', { x: 640, y: 330, width: 300, height: 200 })}${image('purplePlanet', { x: 860, y: 140, width: 56, height: 56 })}${image('redPlanet', { x: 560, y: 480, width: 40, height: 40 })}
        ${balloon({ id: 'word-balloon', x: 90, y: 360 })}
        <div class="bonus-column"><div class="panel word-card" id="word-card"><span class="word-card__word">${DEMO_WORD}</span></div><div class="timer"><span class="timer__clock">${icons.clock()}</span><span class="timer__track"><span class="timer__fill" id="timer-fill" style="width:calc(100% - 6px)"></span></span></div></div>`,
    };
    this.stage.innerHTML = `${scenery[kind]}<div class="demo-caption" id="demo-caption"></div><span class="demo-bubble" id="demo-bubble" hidden></span>`;
    this.voiceFill = this.stage.querySelector('#voice-fill');
    this.balloonElement = this.stage.querySelector('#balloon');
    this.flight = this.balloonElement ? new BalloonFlight() : null;
    this.voiceLevel = 0;
    this.wordSaid = false;
    this.drawBalloon();
  }

  tick(deltaSeconds) {
    if (this.finished || this.sceneIndex === undefined) return;
    // El reloj de la escena espera a que la frase empiece a sonar: así todo va con la voz.
    if (!this.app.narrator.waiting) this.sceneMs += deltaSeconds * 1000;
    const scene = SCENES[this.sceneIndex];
    if (scene.stage === 'word') this.playWord(scene);
    else this.fly(deltaSeconds, scene);
    this.updateProgress(scene);

    const sceneDone = this.sceneMs >= scene.minMs && !this.app.narrator.speaking;
    if (!sceneDone) return;
    if (this.sceneIndex + 1 < SCENES.length) this.showScene(this.sceneIndex + 1);
    else this.finish();
  }

  /** El niño simulado "grita" y el globo vuela con la física del juego. */
  fly(deltaSeconds, scene) {
    if (!this.flight || this.flight.finished) return this.showBubble(null);
    const target = scene.voice ? scene.voice(this.sceneMs) : this.steerToAnswer();
    this.voiceLevel += (target - this.voiceLevel) * Math.min(1, VOICE.attack * deltaSeconds);
    const speed = scene.stage === 'question' ? DEMO.questionSpeed : 1;
    const event = this.flight.update(deltaSeconds * speed, this.voiceLevel);
    this.drawBalloon();
    if (this.voiceFill) this.voiceFill.style.width = `${this.voiceLevel}%`;
    this.showBubble(scene.bubble(this.sceneMs, scene, this.flight), this.flight);

    if (event === FLIGHT_EVENT.LAUNCHED) this.app.sfx.whoosh();
    if (event === FLIGHT_EVENT.POPPED) this.pop();
    if (event === FLIGHT_EVENT.REACHED_HOOPS) this.reachHoops();
  }

  /** En la pregunta, el niño simulado grita más o menos según le falte subir o bajar (sin cortes bruscos). */
  steerToAnswer() {
    const targetY = HOOPS.tops[TARGET_HOOP] + HOOPS.height / 2;
    const offset = this.flight.centerY - targetY;
    return Math.max(0, Math.min(SHOUT, VOICE.riseThreshold + offset * DEMO.steerGain));
  }

  drawBalloon() {
    if (!this.balloonElement) return;
    const { x, y, tiltDegrees } = this.flight;
    this.balloonElement.style.transform = `translate(${x}px, ${y}px) rotate(${tiltDegrees}deg)`;
  }

  /** Globo de diálogo arriba del globo (o del niño en la ronda bonus). */
  showBubble(text, anchor = null) {
    const bubble = this.$('#demo-bubble');
    bubble.hidden = !text;
    if (!text) return;
    if (bubble.textContent !== text) bubble.textContent = text;
    bubble.classList.toggle('demo-bubble--loud', text === '¡AAAA!');
    const x = anchor ? anchor.x + FLIGHT.width / 2 : this.wordBalloonX;
    const y = anchor ? anchor.y : this.wordBalloonY;
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
  }

  pop() {
    this.app.sfx.pop();
    this.balloonElement.style.visibility = 'hidden';
    balloonPop(this.stage, this.flight.x, this.flight.y);
  }

  reachHoops() {
    const hoopIndex = this.flight.hoopIndex();
    const hoop = this.stage.querySelector(`#hoop-${hoopIndex}`);
    if (hoopIndex !== TARGET_HOOP || !hoop) return; // en el vuelo libre no hay aros: el globo solo se detiene
    hoop.innerHTML = hoopArt('correct');
    hoop.classList.add('anim-win');
    this.stage.querySelector(`#plate-${hoopIndex}`).classList.add('answer-plate--correct');
    const answer = this.stage.querySelector('#answer');
    answer.textContent = DEMO_QUESTION.answer;
    answer.classList.add('question-plate__answer--revealed');
    this.app.sfx.correct();
    confetti(this.stage, HOOPS.x + HOOPS.width / 2, HOOPS.tops[hoopIndex] + HOOPS.height / 2, 30);
  }

  /** Ronda bonus: el tiempo corre y el niño simulado dice la palabra a tiempo. */
  playWord(scene) {
    const wordBalloon = this.stage.querySelector('#word-balloon');
    this.wordBalloonX = parseFloat(wordBalloon.style.left) + FLIGHT.width / 2;
    this.wordBalloonY = parseFloat(wordBalloon.style.top);
    this.showBubble(scene.bubble(this.sceneMs, scene));
    if (this.wordSaid) return; // como en el juego, el reloj se detiene al decir la palabra
    const remaining = Math.max(0, 1 - this.sceneMs / DEMO.wordTimerMs);
    this.stage.querySelector('#timer-fill').style.width = `calc(${remaining * 100}% - 6px)`;
    if (this.sceneMs < scene.sayWordAtMs) return;
    this.wordSaid = true;
    this.stage.querySelector('#word-card').classList.add('word-card--success');
    this.app.sfx.correct();
    pointsPopup(this.stage, 600, 150, BONUS.pointsPerWord);
  }

  updateProgress(scene) {
    const within = Math.min(1, this.sceneMs / scene.minMs);
    this.progress.style.width = `${((this.sceneIndex + within) / SCENES.length) * 100}%`;
  }

  finish() {
    this.finished = true;
    this.progress.style.width = '100%';
    this.$('#replay').hidden = false;
    if (this.inGame) this.$('#go').lastChild.textContent = 'Probar mi voz';
  }
}
