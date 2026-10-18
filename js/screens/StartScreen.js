import { Screen } from '../core/Screen.js';
import { button, earth, image, balloon, muteButton } from '../ui/components.js';
import { icons } from '../ui/icons.js';
import { NameScreen } from './NameScreen.js';
import { VoiceTestScreen } from './VoiceTestScreen.js';
import { TutorialScreen } from './TutorialScreen.js';
import { CrewScreen } from './CrewScreen.js';

/** 01 · Inicio */
export class StartScreen extends Screen {
  render() {
    const { voice } = this.app;
    const micText = voice.usesMicrophone ? 'Micrófono listo' : voice.isReady ? 'Sin micrófono' : 'Se pedirá el micrófono';
    return `
      ${image('moon', { x: -170, y: 430, width: 560, height: 270 , className: 'art--ground' })}
      ${image('ringedPlanet', { x: 690, y: 40, width: 270, height: 180, className: 'anim-sway' })}
      ${image('purplePlanet', { x: 70, y: 90, width: 60, height: 60, className: 'anim-spin' })}
      ${image('greenPlanet', { x: 830, y: 400, width: 54, height: 54, className: 'anim-spin anim-spin--reverse' })}
      ${earth({ x: 56, y: 250, size: 90 })}
      <div class="layer layer--full anim-enter" style="gap:12px">
        ${balloon({ id: 'logo-balloon', width: 115, height: 173, inline: true })}
        <h1 class="logo"><span class="logo__a">Aaa</span>-<span class="logo__b">rriba</span></h1>
        <p class="text" style="font-size:21px;margin-bottom:8px">Sube en tu globo, responde y llega a los planetas.</p>
        ${button('¡Despegar!', { id: 'play', size: 'large' })}
        <div class="row" style="margin-top:12px">
          ${button('¿Cómo se juega?', { id: 'how', variant: 'light', size: 'small' })}
          ${button('Tripulación estrella', { id: 'crew', variant: 'light', size: 'small', icon: icons.star(18, '#F2B53A') })}
        </div>
      </div>
      <span class="mic-status">${icons.mic('#9EB0E8', 14)}<span class="status-dot"></span>${micText}</span>
      ${muteButton(this.app.sound.enabled, 'icon-btn--corner')}`;
  }

  onMount() {
    this.onClick('play', () => {
      this.app.sfx.launch();
      this.app.go(this.app.session.playerName ? VoiceTestScreen : NameScreen);
    });
    this.onClick('how', () => this.app.go(TutorialScreen));
    this.onClick('crew', () => this.app.go(CrewScreen));
    this.bindMuteButton();
  }
}
