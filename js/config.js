/**
 * Valores ajustables del juego. Cambia aquí la dificultad sin tocar la lógica.
 * Las coordenadas están en píxeles del escenario de 960×600.
 */

export const STAGE = Object.freeze({ width: 960, height: 600, hudHeight: 64 });

/** Nivel de voz de 0 a 100. */
export const VOICE = Object.freeze({
  riseThreshold: 22, // desde aquí el globo sube
  dangerThreshold: 86, // desde aquí el globo corre peligro
  popAfterSeconds: 0.3, // tiempo seguido en peligro antes de reventar
  defaultSensitivity: 3, // 1 (poco sensible) a 5 (muy sensible)
  decibelRange: 42,
  quietestDecibels: -62,
  decibelsPerSensitivityStep: 5,
  attack: 14, // qué tan rápido sube la lectura
  release: 5, // qué tan rápido baja
  simulatedNormal: 58,
  simulatedLoud: 100,
});

/** Física del globo durante las preguntas. */
export const FLIGHT = Object.freeze({
  startX: 134,
  groundY: 420, // límite inferior: el globo queda a la altura del aro de abajo
  ceilingY: 162, // límite superior: el globo queda a la altura del aro de arriba
  launchMargin: 8,
  horizontalSpeed: 78,
  fallSpeed: 110,
  baseRiseSpeed: 70,
  riseGainPerLevel: 2.4,
  steering: 5,
  maxTiltDegrees: 6,
  centerOffsetY: 40, // del borde superior del globo al centro de la tela
  width: 72,
});

export const HOOPS = Object.freeze({
  x: 740,
  tops: [140, 272, 404],
  width: 80,
  height: 125,
  hitRadius: 52,
  plateX: 836,
  plateOffsetY: 38,
});

export const ROUND = Object.freeze({
  feedbackMs: 2300,
  retryMs: 2000,
  levelBannerMs: 1700,
  pointsPerAnswer: 1,
});

export const LEVEL_MESSAGES = Object.freeze({
  2: 'Ahora son divisiones',
  3: '¡Las más difíciles!',
});

export const BONUS = Object.freeze({
  words: ['COHETE', 'LUNA', 'ESTRELLA'],
  msPerWord: 7000,
  warningAtMs: 2600, // la tarjeta empieza a latir
  panicAtMs: 1300, // late más rápido
  heartbeatMs: 800,
  panicHeartbeatMs: 500,
  pointsPerWord: 2,
  fallbackVoiceLevel: 30, // sin reconocimiento de voz: hablar fuerte cuenta como decir la palabra
  fallbackVoiceSeconds: 0.6,
  nextWordMs: 1700,
  language: 'es-MX',
});

export const STORAGE_KEYS = Object.freeze({ crew: 'aaarriba-crew' });

export const PLAYER_VISOR = '#2F6FD1';
