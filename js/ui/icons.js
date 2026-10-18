/** Íconos SVG en línea. Todos heredan `currentColor` salvo que se indique un color. */

const INK = '#1E2A5E';

const svg = (size, viewBox, body, extra = '') =>
  `<svg width="${size}" height="${size}" viewBox="${viewBox}" aria-hidden="true" ${extra}>${body}</svg>`;

export const icons = {
  mic: (color = 'currentColor', size = 16) =>
    svg(
      size,
      '0 0 24 24',
      '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/>',
      `fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round"`
    ),

  star: (size = 16, color = 'currentColor') =>
    svg(size, '0 0 24 24', '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/>', `fill="${color}"`),

  /** Estrella grande con contorno, encendida o apagada. */
  rating: (size, isOn) =>
    svg(
      size,
      '0 0 24 24',
      `<path d="M12 2.2l2.95 6.1 6.7.95-4.85 4.7 1.15 6.65L12 17.45l-5.95 3.15 1.15-6.65-4.85-4.7 6.7-.95z" fill="${isOn ? '#F6C453' : '#4A5578'}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`
    ),

  sparkle: (size = 14, color = 'currentColor') =>
    svg(size, '0 0 24 24', `<path d="M12 1Q12 12 23 12Q12 12 12 23Q12 12 1 12Q12 12 12 1Z" fill="${color}"/>`),

  back: () => stroke(18, 3, '<path d="M15 5l-7 7 7 7"/>'),
  pause: () => svg(16, '0 0 24 24', '<rect x="5" y="4" width="5" height="16" rx="1.5"/><rect x="14" y="4" width="5" height="16" rx="1.5"/>', 'fill="currentColor"'),
  check: (size = 24) => stroke(size, 3.4, '<path d="M5 12l5 5 9-10"/>'),
  cross: (size = 18) => stroke(size, 3.4, '<path d="M6 6l12 12M18 6L6 18"/>'),
  arrowUp: () => stroke(24, 3, '<path d="M12 19V5M5 12l7-7 7 7"/>'),
  warning: () => stroke(24, 3.4, '<path d="M12 6v8M12 18v.5"/>'),
  clock: (color = INK) =>
    svg(28, '0 0 24 24', '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>', `fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round"`),

  speaker: (isOn) =>
    stroke(
      18,
      2.4,
      `<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/>${isOn ? '<path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>' : '<path d="M17 9l5 6M22 9l-5 6"/>'}`
    ),

  trophy: (size) =>
    svg(
      size,
      '0 0 100 100',
      `<path d="M28 14h44v22c0 14-10 24-22 24S28 50 28 36z" fill="#F6C453" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/><path d="M28 22H14c0 14 6 20 16 22M72 22h14c0 14-6 20-16 22" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><rect x="42" y="60" width="16" height="14" fill="#F2B53A" stroke="${INK}" stroke-width="6"/><rect x="30" y="74" width="40" height="14" rx="4" fill="#F2B53A" stroke="${INK}" stroke-width="6"/>`
    ),

  /** Casco de astronauta usado como avatar; el color del visor distingue a cada niño. */
  helmet: (visor, size = 26, withCrown = false) =>
    svg(
      size,
      '0 -14 100 114',
      `<circle cx="50" cy="52" r="44" fill="#FFFFFF" stroke="${INK}" stroke-width="5"/><rect x="20" y="32" width="60" height="38" rx="19" fill="${visor}" stroke="${INK}" stroke-width="4"/><ellipse cx="38" cy="44" rx="8" ry="5" fill="#FFFFFF" opacity=".75"/><rect x="44" y="4" width="12" height="9" rx="3" fill="#F26B4F" stroke="${INK}" stroke-width="3"/>${withCrown ? `<path d="M30 -12l8 9 12-14 12 14 8-9v14H30z" fill="#F6C453" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` : ''}`
    ),

  /** Explosión "¡PUM!" del globo reventado. */
  pop: () =>
    `<svg width="100%" height="100%" viewBox="0 0 100 100" aria-hidden="true"><polygon points="50,4 59,30 88,20 69,43 96,58 64,62 67,95 50,72 33,95 36,62 4,58 31,43 12,20 41,30" fill="#F26B4F" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><polygon points="50,20 57,38 76,33 64,48 76,62 57,60 50,80 43,60 24,62 36,48 24,33 43,38" fill="#F6C453"/><text x="50" y="55.5" text-anchor="middle" font-family="Fredoka, sans-serif" font-size="13" font-weight="700" fill="${INK}">¡PUM!</text></svg>`,

  /** Ilustraciones de las reglas: globo que sube, que baja, o explosión. */
  rule: (kind) => {
    if (kind === 'boom') {
      return svg(
        96,
        '0 0 100 100',
        `<polygon points="50,6 59,32 88,24 68,45 94,60 63,63 65,94 50,71 35,94 37,63 6,60 32,45 12,24 41,32" fill="#F26B4F" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><polygon points="50,28 55,42 69,39 60,50 69,59 55,59 50,74 45,59 31,59 40,50 31,39 45,42" fill="#F6C453"/>`
      );
    }
    const arrow =
      kind === 'up'
        ? '<path d="M84 76V26M72 38l12-12 12 12" fill="none" stroke="#8ED081" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>'
        : '<path d="M84 26v50M72 64l12 12 12-12" fill="none" stroke="#9EC5FF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>';
    return svg(
      96,
      '0 0 100 100',
      `<path d="M40 10C24 10 15 23 15 37c0 14 14 24 20 31h10c6-7 20-17 20-31 0-14-9-27-25-27z" fill="#F26B4F" stroke="${INK}" stroke-width="3"/><path d="M40 9c-7 3-10 16-10 28 0 12 3 23 6 31h8c3-8 6-19 6-31 0-12-3-25-10-28z" fill="#F6C453"/><rect x="32" y="76" width="16" height="14" rx="2" fill="#B9773E" stroke="${INK}" stroke-width="3"/><path d="M35 68l-1 8M45 68l1 8" stroke="#E9D9C4" stroke-width="2"/>${arrow}`
    );
  },
};

function stroke(size, width, body) {
  return svg(size, '0 0 24 24', body, `fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`);
}
