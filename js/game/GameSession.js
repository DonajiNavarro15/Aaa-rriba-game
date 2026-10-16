import { createRound } from './QuestionBank.js';
import { BONUS, ROUND } from '../config.js';

/** Estado de una partida: jugador, preguntas, aciertos, puntos y tiempo. */
export class GameSession {
  constructor() {
    this.playerName = '';
    this.reset();
  }

  reset() {
    this.questions = createRound();
    this.questionIndex = 0;
    this.results = [];
    this.points = 0;
    this.wordIndex = 0;
    this.wordsSaid = 0;
    this.startedAt = performance.now();
  }

  get currentQuestion() {
    return this.questions[this.questionIndex];
  }

  get hasMoreQuestions() {
    return this.questionIndex < this.questions.length;
  }

  get correctCount() {
    return this.results.filter(Boolean).length;
  }

  /** Estrellas de la misión: 5-6 aciertos = 3, 3-4 = 2, menos = 1. */
  get missionStars() {
    if (this.correctCount >= 5) return 3;
    if (this.correctCount >= 3) return 2;
    return 1;
  }

  get elapsedSeconds() {
    return Math.round((performance.now() - this.startedAt) / 1000);
  }

  /** @returns {boolean} si la respuesta fue correcta */
  answer(option) {
    const correct = option === this.currentQuestion.answer;
    this.results[this.questionIndex] = correct;
    if (correct) this.points += ROUND.pointsPerAnswer;
    return correct;
  }

  nextQuestion() {
    const previousLevel = this.currentQuestion.level;
    this.questionIndex += 1;
    return { levelChanged: this.hasMoreQuestions && this.currentQuestion.level !== previousLevel };
  }

  get currentWord() {
    return BONUS.words[this.wordIndex];
  }

  get hasMoreWords() {
    return this.wordIndex < BONUS.words.length;
  }

  wordResult(said) {
    if (said) {
      this.wordsSaid += 1;
      this.points += BONUS.pointsPerWord;
    }
    this.wordIndex += 1;
  }
}
