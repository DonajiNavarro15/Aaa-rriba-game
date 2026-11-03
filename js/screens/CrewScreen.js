import { Screen } from '../core/Screen.js';
import { button, earth, escapeHtml, image, panelHeader, topBar } from '../ui/components.js';
import { icons } from '../ui/icons.js';
import { confetti } from '../ui/effects.js';
import { StartScreen } from './StartScreen.js';
import { NameScreen } from './NameScreen.js';
import { QuestionScreen } from './QuestionScreen.js';

const PAGE_SIZE = 5;
const ROW_STAGGER_S = 0.07;
const MEDALS = {
  1: ['#FFE08A', '#F2B53A'],
  2: ['#F3F6FD', '#B9C4E0'],
  3: ['#F2C29B', '#D98A4E'],
};

/** 09 · Tripulación estrella: tabla de posiciones con medallas y la fila del jugador resaltada. */
export class CrewScreen extends Screen {
  /** `afterGame`: viene de terminar una partida; solo entonces se ofrece volver a despegar. */
  constructor(app, { highlightId = null, afterGame = false } = {}) {
    super(app);
    this.highlightId = highlightId;
    this.afterGame = afterGame;
  }

  render() {
    return `
      ${topBar({ backLabel: 'Inicio', soundOn: this.app.sound.enabled })}
      ${image('greenPlanet', { x: 40, y: 450, width: 64, height: 64, className: 'anim-spin' })}
      ${image('purplePlanet', { x: 880, y: 470, width: 50, height: 50, className: 'anim-spin anim-spin--reverse' })}
      ${image('ringedPlanet', { x: 800, y: 80, width: 150, height: 100, className: 'anim-sway' })}
      ${earth({ x: 46, y: 96, size: 80 })}
      <div class="layer layer--top" style="gap:16px">
        <div class="panel anim-enter" style="width:640px;gap:7px;padding:18px 26px 20px">
          ${panelHeader('Tripulación estrella', { tone: 'gold', icon: icons.trophy(30) })}
          <div class="ranking-head"><span class="ranking-col--rank">Lugar</span><span class="ranking-col--name">Nombre del astronauta</span><span class="ranking-col--points">Puntos</span><span class="ranking-col--time">Tiempo</span></div>
          <div class="stack ranking-rows" id="ranking-rows"></div>
          <div class="ranking-pager" id="ranking-pager" hidden>
            <button type="button" class="icon-btn" id="page-prev" aria-label="Hoja anterior">${icons.back()}</button>
            <span class="ranking-pager__label" id="page-label"></span>
            <button type="button" class="icon-btn" id="page-next" aria-label="Hoja siguiente">${icons.forward()}</button>
          </div>
        </div>
        <div class="row">
          ${button('Salir', { id: 'exit', variant: 'light', size: 'small' })}
          ${this.afterGame ? button('Volver a despegar', { id: 'again', size: 'small' }) : ''}
        </div>
      </div>`;
  }

  async onMount() {
    this.bindMuteButton();
    this.onClick('back', () => this.app.go(StartScreen));
    this.onClick('exit', () => this.app.go(StartScreen));
    this.onClick('again', () => this.playAgain());

    this.onClick('page-prev', () => this.showPage({ page: this.page - 1 }));
    this.onClick('page-next', () => this.showPage({ page: this.page + 1 }));

    // Abre en la hoja donde está el jugador.
    const { page, entries } = await this.showPage({ aroundId: this.highlightId });
    if (this.highlightId && page === 1 && entries[0]?.id === this.highlightId) {
      this.after(400, () => {
        this.app.sfx.fanfare();
        confetti(this.root, 300, 170, 40);
      });
    }
  }

  async showPage(options) {
    const request = (this.lastRequest = {});
    const result = await this.app.ranking.getPage({ ...options, pageSize: PAGE_SIZE });
    const rows = this.$('#ranking-rows');
    if (!rows || request !== this.lastRequest) return result; // ya cambió de pantalla o de hoja

    const { entries, page, totalPages, firstRank } = result;
    this.page = page;
    rows.innerHTML = entries.map((entry, i) => this.row(entry, firstRank + i, i)).join('');
    this.$('#ranking-pager').hidden = totalPages <= 1;
    this.$('#page-label').textContent = `Hoja ${page} de ${totalPages}`;
    this.$('#page-prev').disabled = page <= 1;
    this.$('#page-next').disabled = page >= totalPages;
    return result;
  }

  row(entry, rank, position) {
    const isMe = entry.id === this.highlightId;
    const medal = MEDALS[rank];
    const rankBadge = medal
      ? `<span class="ranking-row__rank ranking-row__rank--medal" style="background:linear-gradient(180deg,${medal[0]},${medal[1]})">${rank}</span>`
      : `<span class="ranking-row__rank">${rank}</span>`;
    return `
      <div class="ranking-row ${isMe ? 'ranking-row--me' : ''} anim-enter" style="animation-delay:${(position + 1) * ROW_STAGGER_S}s">
        ${rankBadge}
        <span class="ranking-row__avatar">${icons.helmet(entry.visor, 38, rank === 1)}</span>
        <span class="ranking-row__name">${escapeHtml(entry.name)}${isMe ? '<span class="tag-you">TÚ</span>' : ''}${entry.isExample ? '<span class="tag-example">ejemplo</span>' : ''}</span>
        <span class="ranking-row__points">${icons.star(16, '#F6C453')}${entry.points}</span>
        <span class="ranking-row__time">${formatTime(entry.seconds)}</span>
      </div>`;
  }

  async playAgain() {
    this.app.sfx.launch();
    if (!this.app.session.playerName) return this.app.go(NameScreen);
    this.$('#again').disabled = true;
    await this.app.session.startRound();
    if (this.app.currentScreen === this) this.app.go(QuestionScreen);
  }
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}
