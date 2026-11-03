import { VoiceScreen } from './VoiceScreen.js';
import { button, chip, image, panelHeader, topBar } from '../ui/components.js';
import { icons } from '../ui/icons.js';
import { AAA, CALIBRATION, VOICE } from '../config.js';
import { CALIBRATION_PHASE, VoiceCalibration } from '../input/VoiceCalibration.js';
import { TutorialScreen } from './TutorialScreen.js';
import { QuestionScreen } from './QuestionScreen.js';

const POP_SHOW_MS = 1200;
const POP_COOLDOWN_MS = 1400;
const BALLOON_HALF_WIDTH = 20;
const FAILED_RETRY_MS = 1800;
const TOO_SOFT_AFTER_ATTEMPTS = 2;
const SAMPLE_MS = 8000; // muestra para diagnosticar el "Aaaa" (tecla G)
const NOT_AAA_AFTER_SECONDS = 0.6; // hablar más que esto sin "Aaaa" muestra el aviso
const VOICE_LEVELS = CALIBRATION.voiceLevelNames.length;

const STATUS = {
  connecting: { tone: 'quiet', icon: icons.mic('currentColor', 24), title: 'Conectando el micrófono…', detail: 'Si el navegador pregunta, dale permiso.' },
  silence: {
    tone: 'quiet',
    icon: icons.mic('currentColor', 24),
    title: 'Shhh… silencio',
    detail: 'Estoy escuchando.',
    clip: 'voz-silencio',
  },
  speak: {
    tone: 'rise',
    icon: icons.mic('currentColor', 24),
    title: `Ahora grita: ¡${CALIBRATION.word}!`,
    detail: '¡Fuerte!',
    clip: 'voz-palabra',
  },
  failed: {
    tone: 'danger',
    icon: icons.warning(),
    title: 'No te oí',
    detail: 'Acércate y grita otra vez.',
    clip: 'voz-no-escuche',
  },
  tooSoft: {
    tone: 'danger',
    icon: icons.warning(),
    title: 'Te oigo muy bajito',
    detail: 'Acércate mucho al micrófono.',
    clip: 'voz-muy-bajita',
  },
  quiet: { tone: 'quiet', icon: icons.arrowUp(), title: 'Un poco más fuerte', detail: 'Así el globo casi no sube.' },
  rise: { tone: 'rise', icon: icons.check(), title: '¡Muy bien!', detail: 'Así el globo sube.' },
  danger: { tone: 'danger', icon: icons.warning(), title: '¡Muy fuerte!', detail: 'Así el globo se revienta.' },
  notAaa: { tone: 'quiet', icon: icons.arrowUp(), title: 'Eso no es un Aaaa', detail: 'El globo solo sube con un Aaaa largo.' },
};

/**
 * 04 · Prueba de comunicación: primero mide el ruido del cuarto (sin barra) y luego la voz
 * del niño, así la sensibilidad se ajusta sola. Al final le dice su nivel de voz.
 * La narración grabada explica cada paso; mientras suena, la medición se espera para no tomarla como su voz.
 */
export class VoiceTestScreen extends VoiceScreen {
  render() {
    const micChip = chip('Conectando…', { id: 'mic-chip', icon: `<span class="chip__icon">${icons.mic('#FFFFFF', 14)}</span>` });
    const levelDots = Array.from({ length: VOICE_LEVELS }, () => '<span class="voice-level__dot"></span>').join('');
    return `
      ${topBar({ right: chip('Paso 3 de 3') + micChip, soundOn: this.app.sound.enabled })}
      <div class="layer">
        <div class="panel anim-enter" style="width:780px;gap:12px;padding:24px 40px 26px">
          ${panelHeader('Prueba de comunicación', { tone: 'purple', icon: icons.mic('#FFFFFF', 26) })}
          <p class="text" style="max-width:600px">Vamos a probar la comunicación con la base, di "Aaa-rriba"</p>
          <div class="meter" id="meter">
            <div class="meter__track">
              <span class="meter__danger"></span>
              <span class="meter__fill" id="meter-fill" style="width:0"></span>
              <div class="meter__balloon" id="meter-balloon">${image('balloon')}</div>
              <div class="meter__pop" id="meter-pop" hidden>${icons.pop()}</div>
            </div>
            <div class="meter__zones"><span class="meter__zone--quiet">Silencio</span><span class="meter__zone--rise">Sube</span><span class="meter__zone--danger">Peligro</span></div>
          </div>
          <div class="status"><span class="status__icon" id="status-icon"></span><span><span class="status__title" id="status-title"></span><span class="text-small" id="status-detail"></span></span></div>
          <span class="voice-level" id="voice-level" hidden>${levelDots}</span>
          <span class="calib-progress" id="calib-progress"><span class="calib-progress__fill" id="calib-fill"></span></span>
          <p class="text-small calib-note" id="calib-note" hidden>Tu voz se oye bajito o hay ruido cerca. Si el globo no sube o sube solo, acércate al micrófono y mide otra vez.</p>
          <div class="row" style="gap:20px">
            ${button('Medir otra vez', { id: 'remeasure', variant: 'light', size: 'small' })}
            ${button('¡A jugar!', { id: 'continue', size: 'small', disabled: true })}
          </div>
        </div>
      </div>`;
  }

  onMount() {
    super.onMount();
    this.onClick('back', () => this.app.go(TutorialScreen, { inGame: true }));
    this.onClick('continue', async () => {
      this.$('#continue').disabled = true;
      this.app.sfx.launch();
      await this.app.session.startRound();
      if (this.app.currentScreen === this) this.app.go(QuestionScreen);
    });
    this.onClick('remeasure', () => this.startCalibration());
    this.bindMuteButton();
    // Tecla D: panel para adultos con lo que mide el detector de "Aaaa" (sirve para ajustar AAA en config.js).
    // Con el panel abierto, G guarda una muestra de lo que mide el juego en un archivo (Descargas).
    this.listen(window, 'keydown', (event) => {
      if (event.target.tagName === 'INPUT') return;
      if (event.code === 'KeyD') this.diagnostics = this.diagnostics ? (this.diagnostics.remove(), null) : this.addDiagnostics();
      if (event.code === 'KeyG' && this.diagnostics && !this.sample) this.startSample();
    });

    this.$('#remeasure').hidden = true;
    this.calibration = null;
    this.result = null;
    this.lastPopAt = -Infinity;
    this.notAaaSeconds = 0;
    this.currentStatus = null;
    this.showStatus('connecting');
    this.showMeter(false);
    this.connectMicrophone();
    this.loop((deltaSeconds, now) => this.update(deltaSeconds, now));
  }

  async connectMicrophone() {
    const connected = await this.app.voice.connect();
    const micChip = this.$('#mic-chip');
    if (!micChip) return; // el niño ya cambió de pantalla
    micChip.lastChild.textContent = connected ? 'Escuchando' : 'Sin micrófono';
    if (connected) return this.startCalibration();
    this.showSimControls('Sin micrófono: mantén el botón o la barra espaciadora (F = muy fuerte)');
    this.finishCalibration();
    this.app.narrator.say('voz-sin-microfono');
  }

  startCalibration() {
    this.calibration = new VoiceCalibration();
    this.result = null;
    this.showMeter(false);
    this.$('#remeasure').hidden = true;
    this.$('#continue').disabled = true;
    this.$('#calib-note').hidden = true;
    this.$('#voice-level').hidden = true;
    this.$('#calib-progress').style.visibility = 'visible';
  }

  /** Sin calibración pendiente el niño ya puede probar su voz y continuar. */
  finishCalibration(result = null) {
    this.calibration = null;
    this.result = result;
    if (result) {
      this.app.voice.applyCalibration(result);
      this.app.sfx.correct();
      this.$('#calib-note').hidden = !result.noisy;
      this.$('#remeasure').hidden = false;
      this.showVoiceLevel(result.voiceLevel);
      this.app.narrator.say(`voz-nivel-${result.voiceLevel}`);
    }
    this.showMeter(true);
    this.$('#calib-progress').style.visibility = 'hidden';
    this.$('#continue').disabled = false;
  }

  /** Mientras escucha el ruido del cuarto la barra no se ve; aparece cuando le toca hablar. */
  showMeter(visible) {
    this.meterVisible = visible;
    this.$('#meter').style.visibility = visible ? 'visible' : 'hidden';
  }

  showVoiceLevel(voiceLevel) {
    this.$('#voice-level').hidden = false;
    this.$$('.voice-level__dot').forEach((dot, i) => dot.classList.toggle('voice-level__dot--on', i < voiceLevel));
    this.currentStatus = null;
  }

  addDiagnostics() {
    const panel = document.createElement('pre');
    panel.className = 'aaa-diagnostics';
    this.root.appendChild(panel);
    return panel;
  }

  /** Muestra cada regla del detector: así se ve cuál rechaza la "a" de un niño. */
  /** Muestra de diagnóstico: el sonido del micrófono (tal como lo recibe el juego) y lo que mide el detector. */
  startSample() {
    const stamp = Date.now();
    this.sample = { frames: [], startedAt: performance.now(), stamp };
    const { stream } = this.app.voice;
    if (!stream || !window.MediaRecorder) return;
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    recorder.addEventListener('dataavailable', (event) => chunks.push(event.data));
    recorder.addEventListener('stop', () => download(new Blob(chunks, { type: recorder.mimeType }), `muestra-aaa-${stamp}.webm`));
    recorder.start();
    this.after(SAMPLE_MS, () => recorder.state !== 'inactive' && recorder.stop());
    this.addCleanup(() => recorder.state !== 'inactive' && recorder.stop());
  }

  /** Guarda cuadro por cuadro lo que mide el detector durante unos segundos y lo descarga como JSON. */
  recordSample() {
    const { voice } = this.app;
    const { features, detector } = voice;
    const elapsed = performance.now() - this.sample.startedAt;
    if (features) {
      this.sample.frames.push({
        ms: Math.round(elapsed),
        decibels: round(voice.decibels),
        ambient: round(voice.ambientDecibels),
        floor: round(voice.floorDecibels),
        level: round(voice.level),
        aaaLevel: round(voice.aaaLevel),
        pitch: round(features.pitch),
        clarity: round(features.clarity, 2),
        steadiness: round(features.steadiness, 3),
        brightness: round(features.brightness, 1),
        isAaa: features.isAaa,
        held: round(detector.heldSeconds, 2),
        active: detector.active,
        ownPitch: round(detector.ownPitch),
      });
    }
    if (elapsed < SAMPLE_MS) return;
    download(new Blob([JSON.stringify({ config: AAA, frames: this.sample.frames })], { type: 'application/json' }), `muestra-aaa-${this.sample.stamp}.json`);
    this.sample = null;
  }

  showDiagnostics() {
    const { features, detector } = this.app.voice;
    if (!features) return (this.diagnostics.textContent = 'Sin micrófono');
    const mark = (ok) => (ok ? 'sí' : 'NO');
    const ownPitch = detector.ownPitch ? `${detector.ownPitch.toFixed(0)} Hz` : 'sin medir';
    this.diagnostics.textContent = [
      `tono       ${features.pitch.toFixed(0)} Hz   (el del niño: ${ownPitch})`,
      `parejo     ${features.clarity.toFixed(2)}   ${mark(features.clarity >= AAA.minClarity)}  (mín ${AAA.minClarity})`,
      `igual      ${features.steadiness.toFixed(3)}   ${mark(features.steadiness >= AAA.minSteadiness)}  (mín ${AAA.minSteadiness})`,
      `agudo      ${features.brightness.toFixed(1)} dB   ${mark(features.brightness >= AAA.minBrightnessDecibels && features.brightness <= AAA.maxBrightnessDecibels)}  (${AAA.minBrightnessDecibels} a ${AAA.maxBrightnessDecibels})`,
      `¿es "a"?   ${mark(features.isAaa)}   seguida ${detector.heldSeconds.toFixed(2)} s (globo: ${AAA.onsetSeconds} s)`,
      this.sample ? `GRABANDO MUESTRA… ${Math.ceil((SAMPLE_MS - (performance.now() - this.sample.startedAt)) / 1000)} s` : 'G = guardar muestra de 8 s',
    ].join('\n');
  }

  update(deltaSeconds, now) {
    const voice = this.app.voice;
    const anyVoice = voice.read(deltaSeconds);
    if (this.diagnostics) this.showDiagnostics();
    if (this.sample) this.recordSample();
    const narrating = this.app.narrator.speaking;
    if (this.calibration && !narrating) this.updateCalibration(deltaSeconds);
    const measuring = this.calibration !== null || !voice.isReady || narrating;
    // Ya medida la voz, la barra muestra lo mismo que moverá al globo: solo el "Aaaa".
    const level = measuring || !this.result ? anyVoice : voice.aaaLevel;
    const talkingNotAaa = anyVoice >= VOICE.riseThreshold && voice.aaaLevel < VOICE.riseThreshold;
    this.notAaaSeconds = talkingNotAaa ? this.notAaaSeconds + deltaSeconds : 0;

    // Mientras mide o suena la narración, la barra solo muestra la voz: no revienta ni cambia el estado.
    const inDanger = !measuring && level >= VOICE.dangerThreshold;
    if (inDanger && now - this.lastPopAt > POP_COOLDOWN_MS) {
      this.lastPopAt = now;
      this.app.sfx.pop();
    }
    const showingPop = now - this.lastPopAt < POP_SHOW_MS;

    const fill = this.$('#meter-fill');
    fill.style.width = `calc(${level}% - 6px)`;
    fill.classList.toggle('meter__fill--hot', inDanger);
    const meterBalloon = this.$('#meter-balloon');
    meterBalloon.style.left = `calc(${level}% - ${BALLOON_HALF_WIDTH}px)`;
    meterBalloon.style.visibility = showingPop || !this.meterVisible ? 'hidden' : 'visible';
    this.$('#meter-pop').hidden = !showingPop;

    if (measuring) return;
    if (showingPop) this.showStatus('danger');
    else if (this.result && this.notAaaSeconds >= NOT_AAA_AFTER_SECONDS) this.showStatus('notAaa');
    else if (this.result && (level >= VOICE.riseThreshold || this.currentStatus !== 'notAaa')) this.showResult();
    else this.showStatus(level >= VOICE.riseThreshold ? 'rise' : 'quiet');
  }

  updateCalibration(deltaSeconds) {
    const { calibration } = this;
    const phase = calibration.update(deltaSeconds, this.app.voice.decibels, this.app.voice.features);
    this.$('#calib-fill').style.width = `${calibration.progress * 100}%`;
    if (phase !== CALIBRATION_PHASE.SILENCE) this.showMeter(true);

    if (phase === CALIBRATION_PHASE.DONE) return this.finishCalibration(calibration.result);
    // Después de varios intentos sin escucharlo, le pide acercarse al micrófono
    // y ya puede seguir: si el micrófono falla, jugará con las flechas.
    const heardNothing = phase === CALIBRATION_PHASE.FAILED && calibration.attempt >= TOO_SOFT_AFTER_ATTEMPTS;
    if (heardNothing) this.$('#continue').disabled = false;
    const status = heardNothing ? 'tooSoft' : phase;
    if (phase === CALIBRATION_PHASE.FAILED && this.currentStatus !== status) {
      this.app.sfx.miss();
      this.after(FAILED_RETRY_MS, () => this.calibration === calibration && calibration.retrySpeaking());
    }
    this.showStatus(status);
  }

  /** Resultado de la medición: "Tu voz es suave", "media" o "fuerte". */
  showResult() {
    const { voiceLevel } = this.result;
    this.showStatus('result', {
      tone: 'rise',
      icon: icons.check(),
      title: `¡Listo! Tu voz es ${CALIBRATION.voiceLevelNames[voiceLevel - 1]}`,
      detail: 'Di Aaa para ver qué tan fuerte debes de hablar.',
    });
  }

  showStatus(key, status = STATUS[key]) {
    if (key === this.currentStatus) return;
    this.currentStatus = key;
    const icon = this.$('#status-icon');
    icon.className = `status__icon status__icon--${status.tone}`;
    icon.innerHTML = status.icon;
    this.$('#status-title').textContent = status.title;
    this.$('#status-detail').textContent = status.detail;
    if (status.clip) this.app.narrator.say(status.clip);
  }
}

function round(value, decimals = 1) {
  return value === null || !Number.isFinite(value) ? null : Number(value.toFixed(decimals));
}

function download(blob, name) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
}
