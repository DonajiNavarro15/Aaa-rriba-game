import { VoiceScreen } from './VoiceScreen.js';
import { balloon, gameHud, hoopArt, hoopColumn, image, questionProgress, voiceMeter } from '../ui/components.js';
import { icons } from '../ui/icons.js';
import { balloonPop, bump, confetti, levelBanner, pointsPopup, shake, toast } from '../ui/effects.js';
import { BalloonFlight, FLIGHT_EVENT } from '../game/BalloonFlight.js';
import { FLIGHT, HOOPS, LEVEL_MESSAGES, ROUND } from '../config.js';
import { MissionScreen } from './MissionScreen.js';

const PRAISES = ['¡Correcto, astronauta!', '¡Muy bien!', '¡Excelente!', '¡Así se hace!'];
const GLIDE_MS = 350;
const FADE_MS = 900;
const POINTS_DELAY_MS = 500;
const TOAST_MS = 1900;

/** 05/06 · Pregunta: el globo vuela con la voz y responde al cruzar un aro. */
export class QuestionScreen extends VoiceScreen {
  get session() {
    return this.app.session;
  }

  render() {
    const { session } = this;
    const question = session.currentQuestion;
    const progress = questionProgress({
      number: session.questionIndex + 1,
      total: session.questions.length,
      level: question.level,
      results: session.results,
    });
    return `
      ${image('moon', { x: -140, y: 430, width: 480, height: 230 })}
      ${image('greenPlanet', { x: 470, y: 440, width: 50, height: 50 })}
      ${image('purplePlanet', { x: 40, y: 110, width: 40, height: 40 })}
      ${gameHud({ playerName: session.playerName, points: session.points, center: progress, soundOn: this.app.sound.enabled })}
      <div class="question-plate anim-enter" id="question">${question.text}<span class="question-plate__answer" id="answer">?</span></div>
      ${hoopColumn(question.options)}
      ${balloon({ x: 0, y: 0 })}
      ${voiceMeter()}`;
  }

  onMount() {
    super.onMount();
    this.bindMuteButton();
    this.flight = new BalloonFlight();
    this.balloonElement = this.$('#balloon');
    this.drawBalloon();
    this.loop((deltaSeconds) => this.update(deltaSeconds));
  }

  update(deltaSeconds) {
    const level = this.readVoice(deltaSeconds);
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
    shake(this.root);
    toast(this.root, { tone: 'danger', icon: icons.warning(), text: '¡PUM! Grita un poco más suave', durationMs: TOAST_MS });
    this.retry();
  }

  handleHoops() {
    const hoopIndex = this.flight.hoopIndex();
    if (hoopIndex < 0) return this.handleMissedHoops();

    const question = this.session.currentQuestion;
    const correct = this.session.answer(question.options[hoopIndex]);
    this.glideInto(hoopIndex);
    this.revealAnswer(question, hoopIndex);
    this.markProgress(correct);

    if (correct) this.celebrate(hoopIndex);
    else this.encourage(question.answer);

    this.after(ROUND.feedbackMs, () => this.goToNextQuestion());
  }

  handleMissedHoops() {
    this.app.sfx.miss();
    toast(this.root, { tone: 'soft', icon: icons.arrowUp(), text: '¡Casi! Pasa por dentro de un aro', durationMs: TOAST_MS });
    this.balloonElement.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, fill: 'forwards' });
    this.retry();
  }

  /** Repite la misma pregunta con un globo nuevo. */
  retry() {
    this.after(ROUND.retryMs, () => this.app.go(QuestionScreen));
  }

  glideInto(hoopIndex) {
    const from = `translate(${this.flight.x}px, ${this.flight.y}px)`;
    const to = `translate(${HOOPS.x + (HOOPS.width - FLIGHT.width) / 2}px, ${HOOPS.tops[hoopIndex] + HOOPS.height / 2 - FLIGHT.centerOffsetY}px)`;
    this.balloonElement.animate([{ transform: from }, { transform: to }], { duration: GLIDE_MS, fill: 'forwards', easing: 'ease-out' });
  }

  revealAnswer(question, chosenIndex) {
    const correctIndex = question.options.indexOf(question.answer);
    question.options.forEach((_, i) => {
      const hoop = this.$(`#hoop-${i}`);
      const plate = this.$(`#plate-${i}`);
      const isCorrect = i === correctIndex;
      hoop.innerHTML = hoopArt(isCorrect ? 'correct' : 'off');
      hoop.classList.toggle('hoop--off', !isCorrect);
      hoop.classList.toggle('anim-win', isCorrect);
      plate.classList.add(isCorrect ? 'answer-plate--correct' : 'answer-plate--off');
      if (isCorrect) plate.classList.add('anim-win');
      if (i === chosenIndex && !isCorrect) shake(plate);
    });

    const answer = this.$('#answer');
    answer.textContent = question.answer;
    answer.classList.add('question-plate__answer--revealed');
    bump(answer, 1.25);
  }

  markProgress(correct) {
    const step = this.$$('.progress__step')[this.session.questionIndex];
    if (step) step.className = `progress__step progress__step--${correct ? 'ok' : 'miss'}`;
  }

  celebrate(hoopIndex) {
    const hoopCenterY = HOOPS.tops[hoopIndex] + HOOPS.height / 2;
    this.app.sfx.correct();
    confetti(this.root, HOOPS.x + HOOPS.width / 2, hoopCenterY, 34);
    pointsPopup(this.root, HOOPS.x - 70, HOOPS.tops[hoopIndex] + 10, 1);
    this.after(POINTS_DELAY_MS, () => {
      const points = this.$('#points');
      points.textContent = this.session.points;
      bump(points);
    });
    const praise = PRAISES[this.session.questionIndex % PRAISES.length];
    toast(this.root, { tone: 'success', icon: icons.check(26), text: praise, durationMs: TOAST_MS });
  }

  encourage(answer) {
    this.app.sfx.wrong();
    toast(this.root, { tone: 'soft', icon: icons.star(24, '#F6C453'), text: `Era ${answer}. ¡La próxima sale!`, durationMs: TOAST_MS });
  }

  goToNextQuestion() {
    const { levelChanged } = this.session.nextQuestion();
    if (!this.session.hasMoreQuestions) return this.app.go(MissionScreen);
    if (!levelChanged) return this.app.go(QuestionScreen);

    const level = this.session.currentQuestion.level;
    levelBanner(this.root, `¡Nivel ${level}!`, LEVEL_MESSAGES[level]);
    this.app.sfx.levelUp();
    confetti(this.root, 480, 280, 24);
    this.after(ROUND.levelBannerMs, () => this.app.go(QuestionScreen));
  }
}
