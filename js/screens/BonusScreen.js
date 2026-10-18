import { VoiceScreen } from './VoiceScreen.js';
import { balloon, bonusBadge, gameHud, image, panelHeader, voiceMeter } from '../ui/components.js';
import { icons } from '../ui/icons.js';
import { bump, confetti, pointsPopup, shake, toast } from '../ui/effects.js';
import { WordListener } from '../input/WordListener.js';
import { BONUS } from '../config.js';
import { PlanetsScreen } from './PlanetsScreen.js';

const BALLOON_START = { x: 60, y: 380 };
const BALLOON_STEP = { x: 130, y: -20 };
const POINTS_DELAY_MS = 450;
const MISS_TOAST_MS = 1500;
/** Cómo terminó cada palabra. */
const OUTCOME = Object.freeze({ SAID: 'said', WRONG: 'wrong', TIME_UP: 'time-up' });

/** 07 · Ronda bonus: decir la palabra antes de que se acabe el tiempo. */
export class BonusScreen extends VoiceScreen {
  get session() {
    return this.app.session;
  }

  render() {
    const { session } = this;
    const position = {
      x: BALLOON_START.x + session.wordsSaid * BALLOON_STEP.x,
      y: BALLOON_START.y + session.wordsSaid * BALLOON_STEP.y,
    };
    return `
      ${gameHud({ playerName: session.playerName, points: session.points, center: bonusBadge(), soundOn: this.app.sound.enabled, pausable: true })}
      ${image('ringedPlanet', { x: 640, y: 300, width: 330, height: 220 })}
      ${image('purplePlanet', { x: 860, y: 90, width: 66, height: 66 })}
      ${image('redPlanet', { x: 560, y: 470, width: 44, height: 44 })}
      <div class="bonus-column">
        <div class="panel word-card anim-enter" id="word-card">
          ${panelHeader('¡Di la palabra!', { icon: icons.mic('#FFFFFF', 26) })}
          <span class="word-card__word" id="word">${session.currentWord}</span>
        </div>
        <div class="timer"><span class="timer__clock">${icons.clock()}</span><span class="timer__track"><span class="timer__fill" id="timer-fill" style="width:calc(100% - 6px)"></span></span></div>
        <span class="listening"><i class="listening__bar"></i><i class="listening__bar"></i><i class="listening__bar"></i>Palabra ${session.wordIndex + 1} de ${BONUS.words.length} · te escucho</span>
      </div>
      ${balloon({ id: 'bonus-balloon', ...position })}
      ${voiceMeter()}`;
  }

  onMount() {
    super.onMount();
    this.bindMuteButton();
    this.card = this.$('#word-card');
    this.timerFill = this.$('#timer-fill');
    this.startedAt = performance.now();
    this.lastBeatAt = 0;
    this.lastSecond = 0;
    this.finished = false;

    this.listener = new WordListener({ useSpeech: this.app.voice.usesMicrophone });
    this.listener.listen(
      this.session.currentWord,
      () => !this.paused && this.finish(OUTCOME.SAID),
      () => !this.paused && this.finish(OUTCOME.WRONG)
    );
    this.addCleanup(() => this.listener.stop());

    this.loop((deltaSeconds, now) => this.update(deltaSeconds, now));
  }

  /** El reloj de la palabra no corre durante la pausa. */
  onResume(pausedMs) {
    this.startedAt += pausedMs;
    this.lastBeatAt += pausedMs;
  }

  update(deltaSeconds, now) {
    if (this.finished) return false;
    const level = this.readVoice(deltaSeconds);
    this.listener.update(deltaSeconds, level);

    const elapsed = now - this.startedAt;
    const remaining = Math.max(0, BONUS.msPerWord - elapsed);
    this.timerFill.style.width = `calc(${(remaining / BONUS.msPerWord) * 100}% - 6px)`;
    this.updateUrgency(remaining, elapsed, now);

    if (remaining <= 0) this.finish(OUTCOME.TIME_UP);
    return !this.finished;
  }

  /** Últimos segundos: la tarjeta late, la barra se pone roja y suena el corazón. */
  updateUrgency(remaining, elapsed, now) {
    if (remaining >= BONUS.warningAtMs) {
      const second = Math.floor(elapsed / 1000);
      if (second !== this.lastSecond) {
        this.lastSecond = second;
        this.app.sfx.tick();
      }
      return;
    }
    const panic = remaining < BONUS.panicAtMs;
    this.card.classList.add('word-card--warning');
    this.card.classList.toggle('word-card--panic', panic);
    this.timerFill.classList.add('timer__fill--low');
    if (now - this.lastBeatAt > (panic ? BONUS.panicHeartbeatMs : BONUS.heartbeatMs)) {
      this.lastBeatAt = now;
      this.app.sfx.heartbeat();
    }
  }

  finish(outcome) {
    if (this.finished) return;
    this.finished = true;
    this.listener.stop();
    this.card.classList.remove('word-card--warning', 'word-card--panic');

    if (outcome === OUTCOME.SAID) this.celebrate();
    else if (outcome === OUTCOME.WRONG) this.wrongWord();
    else this.timeUp();

    this.session.wordResult(outcome === OUTCOME.SAID);
    this.after(BONUS.nextWordMs, () => this.app.go(this.session.hasMoreWords ? BonusScreen : PlanetsScreen));
  }

  celebrate() {
    this.app.sfx.wordSaid();
    this.card.classList.add('word-card--success');
    this.$('#word').insertAdjacentHTML('beforeend', icons.check(44));
    confetti(this.root, 480, 190, 30);
    pointsPopup(this.root, 640, 150, BONUS.pointsPerWord);
    this.after(POINTS_DELAY_MS, () => {
      const points = this.$('#points');
      points.textContent = this.session.points;
      bump(points);
    });
    this.$('#bonus-balloon').animate(
      [{ transform: 'translate(0, 0)' }, { transform: `translate(${BALLOON_STEP.x}px, ${BALLOON_STEP.y}px)` }],
      { duration: 900, fill: 'forwards', easing: 'cubic-bezier(.3,1.3,.5,1)' }
    );
  }

  /** Dijo otra palabra: se avisa y sale la siguiente. */
  wrongWord() {
    this.app.sfx.wrong();
    this.card.classList.add('word-card--missed');
    shake(this.card);
    toast(this.root, { tone: 'soft', icon: icons.cross(22), text: 'Palabra incorrecta', durationMs: MISS_TOAST_MS });
  }

  timeUp() {
    this.app.sfx.timeUp();
    this.card.classList.add('word-card--missed');
    toast(this.root, { tone: 'soft', icon: icons.clock('#FFFFFF'), text: '¡Se acabó el tiempo!', durationMs: MISS_TOAST_MS });
  }
}
