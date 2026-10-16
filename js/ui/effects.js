import { icons } from './icons.js';

/** Efectos visuales efímeros: se agregan al contenedor y se borran solos. */

const CONFETTI_COLORS = ['#F6C453', '#FF8A6B', '#9EC5FF', '#8ED081', '#B9A2F0', '#FFFFFF'];
const PIECE_COLORS = ['#F26B4F', '#F6C453'];

function spawn(container, className, styles, html = '') {
  const element = document.createElement('span');
  element.className = className;
  Object.assign(element.style, styles);
  element.innerHTML = html;
  container.appendChild(element);
  return element;
}

export function confetti(container, x, y, amount = 28) {
  for (let i = 0; i < amount; i++) {
    const piece = spawn(container, 'confetti', {
      left: `${x}px`,
      top: `${y}px`,
      width: `${8 + Math.random() * 8}px`,
      height: `${6 + Math.random() * 8}px`,
      background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      borderRadius: i % 3 ? '3px' : '50%',
    });
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 160;
    const spin = Math.random() * 720;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    piece.animate(
      [
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy - 60}px) rotate(${spin}deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${dx * 1.2}px, ${dy + 120}px) rotate(${spin * 1.4}deg)`, opacity: 0 },
      ],
      { duration: 1300 + Math.random() * 500, easing: 'cubic-bezier(.2,.8,.4,1)' }
    ).onfinish = () => piece.remove();
  }
}

export function pointsPopup(container, x, y, amount) {
  const popup = spawn(container, 'points-pop', { left: `${x}px`, top: `${y}px` }, `${icons.star(20)}+${amount}`);
  setTimeout(() => popup.remove(), 1400);
}

/** Aviso flotante. `tone`: success | soft | danger. */
export function toast(container, { tone, icon, text, durationMs = 1600 }) {
  const element = document.createElement('div');
  element.className = `toast toast--${tone}`;
  element.innerHTML = `<span class="toast__icon">${icon}</span>${text}`;
  container.appendChild(element);
  setTimeout(() => element.remove(), durationMs);
}

/** Explosión «¡PUM!» con pedazos del globo cayendo. */
export function balloonPop(container, x, y) {
  spawn(container, 'burst', { left: `${x - 40}px`, top: `${y - 30}px` }, icons.pop());
  for (let i = 0; i < 8; i++) {
    const piece = spawn(container, 'balloon-piece', {
      left: `${x + 30}px`,
      top: `${y + 30}px`,
      background: PIECE_COLORS[i % 2],
    });
    const angle = Math.random() * Math.PI * 2;
    piece.animate(
      [
        { transform: 'translate(0, 0) rotate(0deg)' },
        { transform: `translate(${Math.cos(angle) * 90}px, ${Math.sin(angle) * 60 + 160}px) rotate(${Math.random() * 600}deg)`, opacity: 0 },
      ],
      { duration: 1100, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' }
    );
  }
}

export function shake(element) {
  element.classList.remove('anim-shake');
  void element.offsetWidth; // reinicia la animación si ya estaba aplicada
  element.classList.add('anim-shake');
  setTimeout(() => element.classList.remove('anim-shake'), 500);
}

export function bump(element, scale = 1.6) {
  element?.animate([{ transform: 'scale(1)' }, { transform: `scale(${scale})` }, { transform: 'scale(1)' }], {
    duration: 450,
    easing: 'ease-out',
  });
}

export function levelBanner(container, title, text) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `<div class="level-card"><span class="level-card__title">${title}</span><span class="level-card__text">${text}</span></div>`;
  container.appendChild(overlay);
}
