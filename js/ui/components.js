import { icons } from './icons.js';
import { HOOPS, PLAYER_VISOR } from '../config.js';

/**
 * Piezas de interfaz reutilizables. Cada función devuelve HTML y usa las clases de css/components.
 * Las pantallas solo combinan estas piezas.
 */

const IMAGES = {
  balloon: 'assets/img/globo-astronauta.svg',
  moon: 'assets/img/base-lunar.svg',
  ringedPlanet: 'assets/img/planeta-anillos.svg',
  purplePlanet: 'assets/img/planeta-morado.svg',
  greenPlanet: 'assets/img/planeta-verde.svg',
  redPlanet: 'assets/img/planeta-rojo.svg',
  flag: 'assets/img/bandera.svg',
};

const IMAGE_LABELS = {
  balloon: 'Globo con astronauta',
  moon: 'Base lunar',
  flag: 'Bandera',
};

export function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);
}

/** Imagen del juego. Sin posición devuelve solo el <img>; con posición la coloca en el escenario. */
export function image(name, { x, y, width, height, className = '', id = '' } = {}) {
  const img = `<img src="${IMAGES[name]}" alt="${IMAGE_LABELS[name] ?? ''}" draggable="false">`;
  if (x === undefined) return img;
  return `<div class="art ${className}" ${id ? `id="${id}"` : ''} style="left:${x}px;top:${y}px;width:${width}px;height:${height}px">${img}</div>`;
}

/** Globo con astronauta. `bobbing` lo hace flotar en reposo; `inline` lo deja en el flujo normal. */
export function balloon({ id = 'balloon', x = 0, y = 0, width = 72, height = 108, bobbing = true, inline = false } = {}) {
  const position = inline ? 'position:relative' : `left:${x}px;top:${y}px`;
  return `<div class="balloon" id="${id}" style="${position};width:${width}px;height:${height}px"><div class="balloon__body ${bobbing ? 'anim-bob' : ''}">${image('balloon')}</div></div>`;
}

export function button(label, { id, variant = 'primary', size = '', icon = '', disabled = false } = {}) {
  const classes = ['btn', `btn--${variant}`, size && `btn--${size}`].filter(Boolean).join(' ');
  return `<button type="button" class="${classes}" id="${id}" ${disabled ? 'disabled' : ''}><span class="btn__gloss"></span>${icon}${label}</button>`;
}

export function panelHeader(title, { tone = 'coral', icon } = {}) {
  const iconColor = tone === 'gold' ? '#1E2A5E' : '#FFFFFF';
  const toneClass = tone === 'coral' ? '' : `panel__icon--${tone}`;
  return `<div class="panel__header"><span class="panel__icon ${toneClass}">${icon ?? icons.star(26, iconColor)}</span><span class="panel__title">${title}</span></div>`;
}

export function muteButton(soundOn, extraClass = '') {
  return `<button type="button" class="icon-btn ${extraClass}" id="mute" aria-label="Activar o silenciar sonido">${icons.speaker(soundOn)}</button>`;
}

/** Barra superior de menús: botón volver, contenido a la derecha y sonido. */
export function topBar({ backLabel = 'Volver', right = '', soundOn = true } = {}) {
  return `<header class="topbar"><button type="button" class="back-btn" id="back">${icons.back()}${backLabel}</button><span class="grow"></span>${right}${muteButton(soundOn)}</header>`;
}

export function chip(text, { gold = false, small = false, icon = '', id = '' } = {}) {
  const classes = ['chip', gold && 'chip--gold', small && 'chip--small'].filter(Boolean).join(' ');
  return `<span class="${classes}" ${id ? `id="${id}"` : ''}>${icon}${text}</span>`;
}

/** HUD de juego: jugador a la izquierda, `center` en medio y marcador a la derecha. */
export function gameHud({ playerName, points, center, soundOn }) {
  return `<header class="hud">
    <div class="hud__player"><span class="hud__avatar">${icons.helmet(PLAYER_VISOR, 40)}</span><span class="hud__names"><span class="hud__name">${escapeHtml(playerName || 'Astronauta')}</span><span class="hud__role">Tripulante</span></span></div>
    ${center}
    <span class="grow"></span>
    <div class="score"><span class="score__icon">${icons.star(20, '#1E2A5E')}</span><span class="score__value" id="points">${points}</span><span class="score__label">puntos</span></div>
    ${muteButton(soundOn)}
  </header>`;
}

/** Centro del HUD durante las preguntas: «Pregunta n de 6», nivel y barra de progreso. */
export function questionProgress({ number, total, level, results }) {
  const steps = Array.from({ length: total }, (_, i) => {
    const state = results[i] === true ? 'ok' : results[i] === false ? 'miss' : i === number - 1 ? 'current' : '';
    return `<span class="progress__step ${state && `progress__step--${state}`}"></span>`;
  }).join('');
  return `<div class="hud__center"><span class="hud__label">Pregunta ${number} de ${total}<span class="hud__level">Nivel ${level}</span></span><span class="progress">${steps}</span></div>`;
}

export function bonusBadge() {
  return `<div class="hud__center"><span class="hud__bonus">${icons.star(18, '#FFFFFF')}Ronda bonus<span class="hud__multiplier">×2</span></span></div>`;
}

export function voiceMeter() {
  return `<div class="voice-meter" aria-hidden="true"><span class="voice-meter__mic">${icons.mic('#FFFFFF', 16)}</span><span class="voice-meter__label">Voz</span><span class="voice-meter__track"><span class="voice-meter__danger"></span><span class="voice-meter__fill" id="voice-fill" style="width:0%"></span></span></div>`;
}

export function simControls() {
  return `<div class="sim-controls">
    <button type="button" class="sim-controls__btn sim-controls__btn--normal" data-shout="1">${icons.mic('#FFFFFF', 16)} Mantén: Aaaa</button>
    <button type="button" class="sim-controls__btn sim-controls__btn--loud" data-shout="2">¡AAAA! fuerte</button>
  </div>`;
}

export function resultDots(results) {
  return `<div class="result-dots">${results
    .map((ok) => `<span class="result-dot result-dot--${ok ? 'ok' : 'miss'}">${ok ? icons.check() : icons.cross()}</span>`)
    .join('')}</div>`;
}

const HOOP_COLORS = {
  ready: { stops: ['#FFF0B8', '#F6C453', '#E0892B'], glow: '#6FE3FF', glowOpacity: 0.22, glowWidth: 18, lights: true },
  correct: { stops: ['#D8F6FF', '#7FC8FF', '#3D74D6'], glow: '#7FC8FF', glowOpacity: 0.5, glowWidth: 24, lights: true },
  off: { stops: ['#6B769C', '#4A5578', '#3A4570'], glow: '#000000', glowOpacity: 0, glowWidth: 0, lights: false },
};
const HOOP_LIGHTS = 12;
let hoopGradientId = 0;

/** Dibujo del aro dorado con luces. `state`: ready | correct | off. */
export function hoopArt(state = 'ready') {
  const colors = HOOP_COLORS[state];
  const gradientId = `hoop-gradient-${hoopGradientId++}`;
  const lights = colors.lights
    ? Array.from({ length: HOOP_LIGHTS }, (_, i) => {
        const angle = (2 * Math.PI * i) / HOOP_LIGHTS;
        const alt = i % 2 === 1;
        return `<circle class="hoop__light ${alt ? 'hoop__light--alt' : ''}" cx="${(48 + 30 * Math.cos(angle)).toFixed(1)}" cy="${(75 + 60 * Math.sin(angle)).toFixed(1)}" r="3.2" fill="${alt ? '#FFFFFF' : '#FFF3C4'}"/>`;
      }).join('')
    : '';
  return `<svg width="100%" height="100%" viewBox="0 0 96 150" aria-hidden="true">
    <defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1">${colors.stops.map((c, i) => `<stop offset="${i / 2}" stop-color="${c}"/>`).join('')}</linearGradient></defs>
    <ellipse cx="48" cy="75" rx="34" ry="66" fill="none" stroke="${colors.glow}" stroke-opacity="${colors.glowOpacity}" stroke-width="${colors.glowWidth}"/>
    <ellipse cx="48" cy="75" rx="36" ry="66" fill="none" stroke="#1E2A5E" stroke-width="4"/>
    <ellipse cx="48" cy="75" rx="30" ry="60" fill="none" stroke="url(#${gradientId})" stroke-width="12"/>
    <ellipse cx="48" cy="75" rx="24" ry="54" fill="none" stroke="#1E2A5E" stroke-width="3.5"/>${lights}</svg>`;
}

/** Los tres aros con sus placas de número. */
export function hoopColumn(options) {
  return options
    .map(
      (value, i) =>
        `<div class="hoop" id="hoop-${i}" style="left:${HOOPS.x}px;top:${HOOPS.tops[i]}px">${hoopArt()}</div><span class="answer-plate" id="plate-${i}" style="left:${HOOPS.plateX}px;top:${HOOPS.tops[i] + HOOPS.plateOffsetY}px">${value}</span>`
    )
    .join('');
}

export function ruleTile(number, art, caption, detail) {
  return `<div class="rule-tile"><span class="rule-tile__number">${number}</span>${art}<span class="rule-tile__caption">${caption}</span><span class="rule-tile__detail">${detail}</span></div>`;
}
