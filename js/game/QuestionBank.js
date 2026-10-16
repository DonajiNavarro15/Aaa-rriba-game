/**
 * Crea las 6 preguntas de una partida, 2 por nivel:
 * nivel 1 multiplicaciones, nivel 2 divisiones, nivel 3 las más difíciles.
 * Cada pregunta trae su texto, la respuesta y 3 opciones (una por aro).
 */

const OPTIONS_PER_QUESTION = 3;

export function createRound(random = Math.random) {
  const between = (min, max) => min + Math.floor(random() * (max - min + 1));

  const questions = [
    fixedQuestion('6 × 7 =', 42, [36, 42, 48], 1), // la misma del prototipo para empezar
    multiplication(between(2, 5), between(3, 9), 1),
    division(8, 7, 2),
    division(between(3, 6), between(3, 9), 2),
    multiplication(between(7, 9), between(6, 9), 3),
    division(between(7, 9), between(4, 9), 3),
  ];

  return questions.map((question, index) => (index === 0 ? question : shuffleOptions(question, random)));
}

function fixedQuestion(text, answer, options, level) {
  return { text, answer, options, level };
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

function shuffleOptions(question, random) {
  const options = [...question.options];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { ...question, options };
}
