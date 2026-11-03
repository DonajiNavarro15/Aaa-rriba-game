/**
 * Las 6 preguntas de una partida, 2 por nivel:
 * nivel 1 sumas y restas, nivel 2 multiplicaciones, nivel 3 divisiones.
 * Cada pregunta trae su texto, la respuesta y 3 opciones (una por aro).
 * Máximo una cifra de dos dígitos por operación. Salen del servidor (Mongo), que no repite
 * operaciones ni palabras entre partidas; sin servidor se crean aquí.
 */

import { API, BONUS } from '../config.js';
import { BONUS_WORDS } from './words.js';

const OPTIONS_PER_QUESTION = 3;
const QUESTIONS_PER_ROUND = 6;

export async function fetchRound() {
  try {
    const response = await fetch(`${API.baseUrl}/rounds`, { method: 'POST', signal: AbortSignal.timeout(API.timeoutMs) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const round = await response.json();
    if (round.questions?.length !== QUESTIONS_PER_ROUND || round.words?.length !== BONUS.wordsPerRound) throw new Error('Partida incompleta');
    return round;
  } catch {
    return createRound();
  }
}

export function createRound(random = Math.random) {
  const between = (min, max) => min + Math.floor(random() * (max - min + 1));

  const questions = [
    addition(between(2, 89), between(1, 9), 1),
    subtraction(between(10, 99), between(1, 9), 1),
    multiplication(between(2, 10), between(1, 9), 2),
    multiplication(between(11, 20), between(2, 5), 2),
    division(between(2, 5), between(3, 12), 3),
    division(between(6, 9), between(2, 9), 3),
  ];

  const words = shuffled(BONUS_WORDS, random).slice(0, BONUS.wordsPerRound);
  return { questions: questions.map((question) => ({ ...question, options: shuffled(question.options, random) })), words };
}

/** Distractores: el número anterior y el siguiente. */
function addition(a, b, level) {
  const answer = a + b;
  return { text: `${a} + ${b} =`, answer, options: uniqueOptions(answer, [answer - 1, answer + 1]), level };
}

/** Distractores: el número anterior y el siguiente. */
function subtraction(a, b, level) {
  const answer = a - b;
  return { text: `${a} - ${b} =`, answer, options: uniqueOptions(answer, [answer - 1, answer + 1]), level };
}

/** Distractores: una tabla antes y una después (p. ej. 6×7 → 36, 42, 48). */
function multiplication(a, b, level) {
  const answer = a * b;
  return { text: `${a} × ${b} =`, answer, options: uniqueOptions(answer, [answer - b, answer + b]), level };
}

/** Distractores: el número anterior y el siguiente. */
function division(divisor, quotient, level) {
  return {
    text: `${divisor * quotient} ÷ ${divisor} =`,
    answer: quotient,
    options: uniqueOptions(quotient, [quotient - 1, quotient + 1]),
    level,
  };
}

function uniqueOptions(answer, distractors) {
  const options = new Set([answer, ...distractors.filter((value) => value > 0)]);
  let extra = answer + 2;
  while (options.size < OPTIONS_PER_QUESTION) options.add(extra++);
  return [...options].sort((x, y) => x - y);
}

function shuffled(values, random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
