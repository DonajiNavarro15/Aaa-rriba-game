import { BONUS } from '../config.js';

const FATAL_ERRORS = new Set(['not-allowed', 'service-not-allowed', 'network', 'audio-capture']);

/**
 * Detecta si el niño dijo la palabra del bonus.
 * Usa el reconocimiento de voz del navegador cuando existe; si no, hablar fuerte
 * durante un momento cuenta como haberla dicho.
 */
export class WordListener {
  constructor({ useSpeech }) {
    this.useSpeech = useSpeech;
    this.recognition = null;
    this.speechWorks = false;
    this.voicedSeconds = 0;
    this.onHeard = null;
    this.onWrong = null;
  }

  /** `onWrong` (opcional) se llama si el niño termina de decir otra palabra; solo con reconocimiento de voz. */
  listen(word, onHeard, onWrong = null) {
    this.onHeard = onHeard;
    this.onWrong = onWrong;
    this.voicedSeconds = 0;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!this.useSpeech || !SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = BONUS.language;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const said = normalize(event.results[i][0].transcript).trim();
          if (said.includes(normalize(word))) this.heard();
          else if (event.results[i].isFinal && said) this.wrong();
        }
      };
      recognition.onerror = (event) => {
        if (FATAL_ERRORS.has(event.error)) this.speechWorks = false;
      };
      recognition.onend = () => {
        if (this.speechWorks && this.recognition === recognition) this.safeStart(recognition);
      };
      this.recognition = recognition;
      this.speechWorks = this.safeStart(recognition);
    } catch {
      this.speechWorks = false;
    }
  }

  /** Respaldo sin reconocimiento: llamar en cada cuadro con el nivel de voz. */
  update(deltaSeconds, voiceLevel) {
    if (this.speechWorks || !this.onHeard) return;
    this.voicedSeconds =
      voiceLevel >= BONUS.fallbackVoiceLevel
        ? this.voicedSeconds + deltaSeconds
        : Math.max(0, this.voicedSeconds - deltaSeconds / 2);
    if (this.voicedSeconds >= BONUS.fallbackVoiceSeconds) this.heard();
  }

  stop() {
    this.onHeard = null;
    this.onWrong = null;
    if (!this.recognition) return;
    this.recognition.onend = null;
    try {
      this.recognition.abort();
    } catch {
      /* el reconocimiento ya estaba detenido */
    }
    this.recognition = null;
  }

  heard() {
    const callback = this.onHeard;
    this.onHeard = null;
    this.onWrong = null;
    callback?.();
  }

  wrong() {
    const callback = this.onWrong;
    if (!callback) return;
    this.onHeard = null;
    this.onWrong = null;
    callback();
  }

  safeStart(recognition) {
    try {
      recognition.start();
      return true;
    } catch {
      return false;
    }
  }
}

function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase();
}
