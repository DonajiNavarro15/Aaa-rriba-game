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
  defaultFloorDecibels: -52, // antes de medir la voz: desde aquí empieza la barra
  defaultDecibelRange: 42, // antes de medir la voz: decibeles de la barra completa
  browserNoiseSuppression: true, // el navegador limpia el ruido de fondo antes de medir
  lowCutHz: 150, // filtro de voz: quita zumbidos y ruido grave (ventiladores, autos)
  highCutHz: 3500, // filtro de voz: quita siseos y ruido agudo
  ambientRiseDecibelsPerSecond: 0.4, // si el cuarto se vuelve ruidoso, el piso sube despacio
  ambientFallSpeed: 4, // si el cuarto se calma, el piso vuelve rápido
  attack: 14, // qué tan rápido sube la lectura
  release: 5, // qué tan rápido baja
  simulatedNormal: 58,
  simulatedLoud: 100,
});

/** Medición de la voz en la prueba de comunicación: primero el silencio del cuarto, luego la voz. */
export const CALIBRATION = Object.freeze({
  word: 'Aaaa-rriba',
  silenceMs: 2200,
  speakMaxMs: 5000,
  // Por intento: cada vez que no se escucha, se acepta una voz más bajita y más corta.
  voicedOverNoiseDecibels: [5, 3], // cuenta como voz si supera al ruido por esto
  voicedSecondsNeeded: [0.5, 0.4, 0.3], // voz mínima para dar la medición por buena
  playableMarginLevel: 8, // la voz medida debe pasar la zona "sube" por esto; si no, se pide otra vez
  endAfterQuietSeconds: 0.5, // si ya habló suficiente, termina al callarse
  noisePercentile: 0.9, // toma los ruidos más fuertes del cuarto, no el promedio
  voicePercentile: 0.6,
  noiseMarginDecibels: 6, // el piso queda por encima del ruido del cuarto
  minVoiceSpanDecibels: 11, // espacio mínimo entre el piso y la voz (en cuartos ruidosos)
  noiseGuardDecibels: 2, // con voz bajita, el piso nunca queda por debajo del ruido + esto
  minVoiceLevel: 40, // con voz bajita, la barra se achica para que su voz llegue aquí
  minDecibelRange: 6, // la barra nunca se achica más que esto (si no, el globo tiembla)
  // La barra se acomoda a la voz del niño, no al ruido: como está cerca del micrófono, su voz
  // llega más fuerte que la de otras personas del cuarto, que quedan debajo de la zona "sube".
  riseBelowVoiceDecibels: 8, // el globo sube desde aquí por debajo de su voz
  dangerAboveVoiceDecibels: 10, // el globo corre peligro desde aquí por encima de su voz
  noisyRoomSpanDecibels: 12, // con menos espacio que esto se avisa que hay mucho ruido
  voiceLevelDecibels: [-42, -34, -26, -18], // desde aquí la voz es nivel 2, 3, 4 y 5
  voiceLevelNames: ['Suavecita', 'Suave', 'Normal', 'Fuerte', 'Muy fuerte'],
});

/** Ronda de práctica: tres ejercicios, uno por aro (arriba, en medio, abajo), sin puntos. */
export const PRACTICE = Object.freeze({
  feedbackMs: 1800,
  retryMs: 1600,
  doneMs: 2200, // tiempo del aviso final antes de entrar al juego
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

/** Frases grabadas que se escuchan antes del juego real (guion en js/audio/narration.js). */
export const NARRATOR = Object.freeze({
  folder: 'assets/audio',
  extension: 'wav', // formato que guarda grabar.html (suena en todos los navegadores)
  startDelayMs: 600, // espera a que la pantalla termine de aparecer antes de hablar
  tailMs: 400, // después de sonar, espera esto antes de volver a escuchar al niño
});

export const STORAGE_KEYS = Object.freeze({ crew: 'aaarriba-crew' });

export const PLAYER_VISOR = '#2F6FD1';
