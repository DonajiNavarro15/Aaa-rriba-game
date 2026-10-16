import { Screen } from '../core/Screen.js';
import { balloon, bonusBadge, button, gameHud, image, panelHeader } from '../ui/components.js';
import { icons } from '../ui/icons.js';
import { confetti } from '../ui/effects.js';
import { BONUS, PLAYER_VISOR } from '../config.js';
import { CrewScreen } from './CrewScreen.js';

const ARRIVAL_MS = 1400;
const SPARKLES = [
  [520, 120, '#F6C453', 26],
  [770, 160, '#FF8A6B', 22],
  [890, 280, '#F6C453', 30],
  [480, 300, '#9EC5FF', 20],
  [660, 96, '#8ED081', 24],
  [860, 470, '#FF8A6B', 18],
];

/** 08 · Llega a los planetas (o «casi llegas» si no dijo ninguna palabra). Guarda el resultado. */
export class PlanetsScreen extends Screen {
  get session() {
    return this.app.session;
  }

  get reachedPlanets() {
    return this.session.wordsSaid > 0;
  }

  render() {
    const { session } = this;
    const said = session.wordsSaid;
    const sparkles = SPARKLES.map(
      ([x, y, color, size], i) =>
        `<span class="art anim-bob" style="left:${x}px;top:${y}px;width:${size}px;height:${size}px;animation-delay:${i * 0.3}s">${icons.sparkle(size, color)}</span>`
    ).join('');
    const message = this.reachedPlanets
      ? `Dijiste ${said} de ${BONUS.words.length} palabras a tiempo y ganaste ${said * BONUS.pointsPerWord} puntos más. Ya eres parte de la tripulación estrella.`
      : 'Esta vez no dijiste las palabras a tiempo, pero tus puntos sí cuentan para la tripulación.';

    return `
      ${gameHud({ playerName: session.playerName, points: session.points, center: bonusBadge(), soundOn: this.app.sound.enabled })}
      ${image('redPlanet', { x: 380, y: 100, width: 50, height: 50 })}
      ${image('purplePlanet', { x: 850, y: 86, width: 70, height: 70 })}
      ${image('ringedPlanet', { x: 430, y: 300, width: 450, height: 300 })}
      ${this.reachedPlanets ? sparkles : ''}
      ${balloon({ id: 'arriving-balloon', x: 600, y: 186, bobbing: false })}
      ${this.reachedPlanets ? image('flag', { x: 722, y: 272, width: 56, height: 76, id: 'flag' }) : ''}
      <div class="panel panel--left anim-enter" style="position:absolute;left:40px;top:150px;width:400px;gap:12px;padding:28px 30px">
        ${panelHeader(this.reachedPlanets ? '¡Llegaste!' : '¡Casi llegas!', { tone: 'gold' })}
        <div class="row row--start" style="gap:4px">${[0, 1, 2].map((i) => icons.rating(44, i < said)).join('')}</div>
        <p class="title" style="font-size:32px">${this.reachedPlanets ? '¡Llegaste a los planetas!' : 'Te quedaste cerquita'}</p>
        <p class="text-small">${message}</p>
        ${button('Ver tripulación', { id: 'crew', size: 'small', icon: icons.star(20, '#FFFFFF') })}
      </div>`;
  }

  onMount() {
    this.bindMuteButton();
    const saving = this.saveResult();
    this.playArrival();
    this.onClick('crew', async () => this.app.go(CrewScreen, { highlightId: await saving }));
  }

  /** @returns {Promise<string>} id de la entrada guardada */
  async saveResult() {
    const saved = await this.app.ranking.add({
      name: this.session.playerName || 'Astronauta',
      points: this.session.points,
      seconds: this.session.elapsedSeconds,
      visor: PLAYER_VISOR,
    });
    return saved.id;
  }

  playArrival() {
    this.$('#arriving-balloon').animate(
      [{ transform: 'translate(-500px, 260px) scale(.7)' }, { transform: 'translate(0, 0) scale(1)' }],
      { duration: ARRIVAL_MS, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' }
    );
    if (!this.reachedPlanets) {
      this.after(900, () => this.app.sfx.miss());
      return;
    }
    const flag = this.$('#flag');
    flag.style.transformOrigin = 'bottom left';
    flag.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1.15)' }, { transform: 'scaleY(1)' }], {
      duration: 500,
      delay: ARRIVAL_MS,
      easing: 'ease-out',
      fill: 'backwards',
    });
    this.after(ARRIVAL_MS - 100, () => {
      this.app.sfx.fanfare();
      confetti(this.root, 700, 260, 50);
    });
  }
}
