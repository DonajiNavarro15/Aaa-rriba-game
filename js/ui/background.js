import { icons } from './icons.js';
import { STAGE } from '../config.js';

const STAR_COUNT = 70;
const SPARKLE_COUNT = 12;
const SEED = 7;

/** Generador pseudoaleatorio con semilla: el cielo se ve igual en cada carga. */
function seededRandom(seed) {
  let value = seed;
  return () => (value = (value * 9301 + 49297) % 233280) / 233280;
}

/** Fondo de espacio igual al de los prototipos: azul marino, dos círculos suaves y estrellas. */
export function renderSky(container) {
  const random = seededRandom(SEED);
  const glows = `
    <span class="sky__glow" style="left:420px;top:-60px;width:620px;height:620px;background:var(--space-glow-1)"></span>
    <span class="sky__glow" style="left:-180px;top:240px;width:520px;height:520px;background:var(--space-glow-2)"></span>`;

  const stars = Array.from({ length: STAR_COUNT }, () => {
    const size = random() < 0.2 ? 3 : 2;
    return `<span class="sky__star" style="left:${random() * STAGE.width}px;top:${random() * STAGE.height}px;width:${size}px;height:${size}px;opacity:${0.35 + random() * 0.6}"></span>`;
  }).join('');

  const sparkles = Array.from(
    { length: SPARKLE_COUNT },
    () =>
      `<span class="sky__sparkle" style="left:${random() * (STAGE.width - 20)}px;top:${random() * (STAGE.height - 20)}px;animation-delay:${random() * 2.6}s">${icons.sparkle()}</span>`
  ).join('');

  container.innerHTML = glows + stars + sparkles;
}
