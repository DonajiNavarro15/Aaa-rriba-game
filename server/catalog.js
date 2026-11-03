/**
 * Catálogo de operaciones que se guarda en Mongo, por nivel:
 * nivel 1 sumas y restas, nivel 2 multiplicaciones, nivel 3 divisiones.
 * Cada operación tiene como máximo una cifra de dos dígitos. También guarda las palabras del bonus.
 */

import { BONUS_WORDS } from '../js/game/words.js';

const OPTIONS_PER_QUESTION = 3;

/** Lo que pide una partida: tipo de operación de cada pregunta, en orden. */
export const ROUND_KINDS = ['suma', 'resta', 'multiplicacion', 'multiplicacion', 'division', 'division'];
export const WORD_KIND = 'palabra';
export const WORDS_PER_ROUND = 3;

export function buildCatalog(random = Math.random) {
  const questions = [];
  for (let b = 1; b <= 9; b++) {
    for (let a = 2; a <= 89; a++) questions.push(question('suma', 1, `${a} + ${b} =`, a + b, [a + b - 1, a + b + 1]));
    for (let a = b + 1; a <= 99; a++) questions.push(question('resta', 1, `${a} - ${b} =`, a - b, [a - b - 1, a - b + 1]));
    const largest = b <= 5 ? 20 : 10; // las tablas del 6 al 9 solo llegan al 10
    for (let a = 2; a <= largest; a++) {
      questions.push(question('multiplicacion', 2, `${a} × ${b} =`, a * b, [a * b - b, a * b + b]));
      if (b > 1 && a * b <= 99) questions.push(question('division', 3, `${a * b} ÷ ${b} =`, a, [a - 1, a + 1]));
    }
  }
  for (const word of BONUS_WORDS) questions.push({ kind: WORD_KIND, text: word });
  return withQueuePositions(questions, random);
}

/** Revuelve cada tipo de operación y le da a cada una su lugar en la fila. */
function withQueuePositions(questions, random) {
  const nextPosition = {};
  return questions
    .map((item) => ({ item, order: random() }))
    .sort((a, b) => a.order - b.order)
    .map(({ item }) => {
      nextPosition[item.kind] ??= 0;
      return { ...item, position: nextPosition[item.kind]++ };
    });
}

function question(kind, level, text, answer, distractors) {
  const options = new Set([answer, ...distractors.filter((value) => value > 0)]);
  let extra = answer + 2;
  while (options.size < OPTIONS_PER_QUESTION) options.add(extra++);
  return { kind, level, text, answer, options: [...options] };
}
