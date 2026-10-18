import { icons } from './icons.js';

const STAR_COUNT = 110;
const SPARKLE_COUNT = 12;
const SEED = 7;

/** Generador pseudoaleatorio con semilla: el cielo se ve igual en cada carga. */
function seededRandom(seed) {
  let value = seed;
  return () => (value = (value * 9301 + 49297) % 233280) / 233280;
}

/** Fondo de espacio igual al de los prototipos: azul marino, dos círculos suaves y estrellas. Cubre toda la ventana. */
export function renderSky(container) {
  const random = seededRandom(SEED);
  const glows = `
    <span class="sky__glow" style="left:calc(50% - 60px);top:calc(50% - 360px);width:620px;height:620px;background:var(--space-glow-1)"></span>
    <span class="sky__glow" style="left:calc(50% - 660px);top:calc(50% - 60px);width:520px;height:520px;background:var(--space-glow-2)"></span>`;

  const stars = Array.from({ length: STAR_COUNT }, () => {
    const size = random() < 0.2 ? 3 : 2;
    return `<span class="sky__star" style="left:${random() * 100}%;top:${random() * 100}%;width:${size}px;height:${size}px;opacity:${0.35 + random() * 0.6}"></span>`;
  }).join('');

  const sparkles = Array.from(
    { length: SPARKLE_COUNT },
    () =>
      `<span class="sky__sparkle" style="left:${random() * 97}%;top:${random() * 96}%;animation-delay:${random() * 2.6}s">${icons.sparkle()}</span>`
  ).join('');

  container.innerHTML = glows + stars + sparkles;
}
