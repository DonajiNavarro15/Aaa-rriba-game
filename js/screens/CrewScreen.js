import { Screen } from '../core/Screen.js';
import { button, chip, escapeHtml, image, panelHeader, topBar } from '../ui/components.js';
import { icons } from '../ui/icons.js';
import { confetti } from '../ui/effects.js';
import { sortRanking } from '../game/RankingRepository.js';
import { StartScreen } from './StartScreen.js';
import { NameScreen } from './NameScreen.js';
import { QuestionScreen } from './QuestionScreen.js';

const VISIBLE_ROWS = 5;
const ROW_STAGGER_S = 0.07;
const MEDALS = {
  1: ['#FFE08A', '#F2B53A'],
  2: ['#F3F6FD', '#B9C4E0'],
  3: ['#F2C29B', '#D98A4E'],
};

/** 09 · Tripulación estrella: tabla de posiciones con medallas y la fila del jugador resaltada. */
export class CrewScreen extends Screen {
  constructor(app, { highlightId = null } = {}) {
    super(app);
    this.highlightId = highlightId;
  }

  render() {
    return `
      ${topBar({ backLabel: 'Inicio', right: chip('Salón 3.º', { gold: true }), soundOn: this.app.sound.enabled })}
      ${image('greenPlanet', { x: 40, y: 450, width: 64, height: 64 })}
      ${image('purplePlanet', { x: 880, y: 470, width: 50, height: 50 })}
      ${image('ringedPlanet', { x: 800, y: 80, width: 150, height: 100 })}
      <div class="layer layer--top" style="gap:16px">
        <div class="panel anim-enter" style="width:640px;gap:7px;padding:18px 26px 20px">
          ${panelHeader('Tripulación estrella', { tone: 'gold', icon: icons.trophy(30) })}
          <div class="ranking-head"><span class="ranking-col--rank">Lugar</span><span class="ranking-col--name">Astronauta</span><span class="ranking-col--points">Puntos</span><span class="ranking-col--time">Tiempo</span></div>
          <div class="stack" id="ranking-rows" style="width:100%;gap:7px"></div>
        </div>
        <div class="row">
          ${button('Salir', { id: 'exit', variant: 'light', size: 'small' })}
          ${button('Volver a despegar', { id: 'again', size: 'small' })}
        </div>
      </div>`;
  }

  async onMount() {
    this.bindMuteButton();
    this.onClick('back', () => this.app.go(StartScreen));
    this.onClick('exit', () => this.app.go(StartScreen));
    this.onClick('again', () => this.playAgain());

    const entries = sortRanking(await this.app.ranking.getAll()).slice(0, VISIBLE_ROWS);
    this.$('#ranking-rows').innerHTML = entries.map((entry, i) => this.row(entry, i + 1)).join('');
    if (entries[0]?.id === this.highlightId) {
      this.after(400, () => {
        this.app.sfx.fanfare();
        confetti(this.root, 300, 170, 40);
      });
    }
  }

  row(entry, rank) {
    const isMe = entry.id === this.highlightId;
    const medal = MEDALS[rank];
    const rankBadge = medal
      ? `<span class="ranking-row__rank ranking-row__rank--medal" style="background:linear-gradient(180deg,${medal[0]},${medal[1]})">${rank}</span>`
      : `<span class="ranking-row__rank">${rank}</span>`;
    return `
      <div class="ranking-row ${isMe ? 'ranking-row--me' : ''} anim-enter" style="animation-delay:${rank * ROW_STAGGER_S}s">
        ${rankBadge}
        <span class="ranking-row__avatar">${icons.helmet(entry.visor, 38, rank === 1)}</span>
        <span class="ranking-row__name">${escapeHtml(entry.name)}${isMe ? '<span class="tag-you">TÚ</span>' : ''}${entry.isExample ? '<span class="tag-example">ejemplo</span>' : ''}</span>
        <span class="ranking-row__points">${icons.star(16, '#F6C453')}${entry.points}</span>
        <span class="ranking-row__time">${formatTime(entry.seconds)}</span>
      </div>`;
  }

  playAgain() {
    this.app.sfx.launch();
    if (!this.app.session.playerName) return this.app.go(NameScreen);
    this.app.session.reset();
    this.app.go(QuestionScreen);
  }
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}
