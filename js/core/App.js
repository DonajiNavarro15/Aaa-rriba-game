import { Stage } from './Stage.js';
import { SoundEngine } from '../audio/SoundEngine.js';
import { Sfx } from '../audio/Sfx.js';
import { VoiceInput } from '../input/VoiceInput.js';
import { SimulatedVoice } from '../input/SimulatedVoice.js';
import { GameSession } from '../game/GameSession.js';
import { LocalRankingRepository } from '../game/RankingRepository.js';
import { renderSky } from '../ui/background.js';

/**
 * Raíz de la aplicación: guarda los servicios compartidos y cambia de pantalla.
 * Las pantallas reciben `app` y usan `app.go(OtraPantalla)` para navegar.
 */
export class App {
  constructor({ frame, stage, background, screen }) {
    this.stage = new Stage(frame, stage);
    this.screenRoot = screen;
    this.background = background;

    const engine = new SoundEngine();
    this.sound = engine;
    this.sfx = new Sfx(engine);
    this.simulatedVoice = new SimulatedVoice();
    this.voice = new VoiceInput(engine, this.simulatedVoice);
    this.session = new GameSession();
    this.ranking = new LocalRankingRepository();

    this.currentScreen = null;
  }

  start(FirstScreen) {
    renderSky(this.background);
    this.stage.fit();
    this.go(FirstScreen);
  }

  /** Desmonta la pantalla actual (limpiando sus timers y bucles) y monta la nueva. */
  go(ScreenClass, ...args) {
    this.currentScreen?.unmount();
    this.screenRoot.replaceChildren();
    this.currentScreen = new ScreenClass(this, ...args);
    this.currentScreen.mount(this.screenRoot);
  }
}
