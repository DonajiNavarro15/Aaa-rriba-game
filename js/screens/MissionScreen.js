import { Screen } from '../core/Screen.js';
import { balloon, button, gameHud, image, panelHeader, resultDots } from '../ui/components.js';
import { icons } from '../ui/icons.js';
import { BonusScreen } from './BonusScreen.js';

const STAR_SIZES = [56, 72, 56];
const FIRST_STAR_DELAY_MS = 300;
const STAR_INTERVAL_MS = 320;
const FANFARE_DELAY_MS = 1300;

/** 06b · Misión cumplida: resumen de las preguntas antes de la ronda bonus. */
export class MissionScreen extends Screen {
  render() {
    const session = this.app.session;
    const steps = session.results
      .map((ok) => `<span class="progress__step progress__step--${ok ? 'ok' : 'miss'}"></span>`)
      .join('');
    const center = `<div class="hud__center"><span class="hud__label">Preguntas terminadas</span><span class="progress">${steps}</span></div>`;
    const stars = STAR_SIZES.map(
      (size, i) => `<span class="mission-star" style="opacity:0">${icons.rating(size, i < session.missionStars)}</span>`
    ).join('');
    const pointsWord = session.points === 1 ? 'punto' : 'puntos';

    return `
      ${gameHud({ playerName: session.playerName, points: session.points, center, soundOn: this.app.sound.enabled })}
      ${image('ringedPlanet', { x: 720, y: 330, width: 240, height: 160 })}
      ${image('purplePlanet', { x: 880, y: 90, width: 52, height: 52 })}
      ${image('redPlanet', { x: 50, y: 440, width: 48, height: 48 })}
      ${balloon({ id: 'mission-balloon', x: 56, y: 130, width: 79, height: 119 })}
      <div class="layer" style="padding-top:26px">
        <div class="panel anim-enter" style="width:600px;gap:12px">
          ${panelHeader('¡Misión cumplida!', { tone: 'gold' })}
          <div class="stars">${stars}</div>
          ${resultDots(session.results)}
          <p class="text text-strong" style="font-size:21px"><b>${session.correctCount} de ${session.results.length} correctas</b> · ${session.points} ${pointsWord}</p>
          <p class="text-small" style="max-width:460px">Ahora vas a la ronda bonus: di la palabra a tiempo para llegar a los planetas. Cada palabra vale doble.</p>
          ${button('¡A la ronda bonus!', { id: 'bonus' })}
        </div>
      </div>`;
  }

  onMount() {
    this.bindMuteButton();
    this.revealStars();
    this.after(FANFARE_DELAY_MS, () => this.app.sfx.fanfare());
    this.onClick('bonus', () => {
      this.app.sfx.launch();
      this.app.go(BonusScreen);
    });
  }

  revealStars() {
    const earned = this.app.session.missionStars;
    this.$$('.mission-star').forEach((star, i) => {
      this.after(FIRST_STAR_DELAY_MS + i * STAR_INTERVAL_MS, () => {
        star.style.opacity = 1;
        star.animate([{ transform: 'scale(0) rotate(-90deg)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], {
          duration: 420,
          easing: 'ease-out',
        });
        if (i < earned) this.app.sfx.star(i);
      });
    });
  }
}
