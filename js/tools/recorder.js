import { NARRATION } from '../audio/narration.js';
import { Narrator } from '../audio/Narrator.js';
import { NARRATOR } from '../config.js';

/**
 * Página grabar.html: graba cada frase de narration.js con el micrófono y la guarda como
 * assets/audio/<clave>.wav. Recorta el silencio del principio y del final e iguala el volumen.
 */

const SAMPLE_RATE = 22050; // suficiente para voz y pesa la mitad que la calidad de CD
const WINDOW_SECONDS = 0.01;
const SILENCE_SHARE = 0.08; // más bajo que esto (respecto al punto más fuerte) cuenta como silencio
const PAD_START_SECONDS = 0.08;
const PAD_END_SECONDS = 0.2;
const TARGET_PEAK = 0.89; // -1 dB: fuerte pero sin distorsionar
const MAX_GAIN = 8;
const SILENT_PEAK = 0.003; // si lo más fuerte de la grabación no llega a esto, quedó en silencio

/** Error con un mensaje para mostrar en la fila de la frase. */
class RecordingError extends Error {}

const GROUPS = [
  { prefix: 'demo', title: 'Video de ¿Cómo se juega?' },
  { prefix: 'voz', title: 'Prueba de comunicación' },
];

const takes = new Map(); // clave → última grabación (Blob wav)
let folder = null;
let stream = null;
let recording = null; // { clip, recorder, stopMeter }
let player = null;

const list = document.getElementById('list');
const folderStatus = document.getElementById('folder-status');
const micStatus = document.getElementById('mic-status');

render();
refreshAll();
document.getElementById('pick-folder').addEventListener('click', pickFolder);
list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const { action, clip } = button.dataset;
  if (action === 'record') toggleRecording(clip);
  if (action === 'play') play(clip);
});

function render() {
  const clips = Object.keys(NARRATION);
  list.innerHTML = GROUPS.map(({ prefix, title }) => {
    const rows = clips
      .filter((clip) => clip === prefix || clip.startsWith(`${prefix}-`))
      .map(
        (clip) => `
        <li class="clip" id="clip-${clip}">
          <div class="clip__text"><span class="clip__name">${clip}</span>${NARRATION[clip]}</div>
          <span class="clip__state" data-state="unknown">…</span>
          <span class="clip__meter" hidden><span class="clip__meter-fill"></span></span>
          <button type="button" class="tool-btn tool-btn--record" data-action="record" data-clip="${clip}">Grabar</button>
          <button type="button" class="tool-btn" data-action="play" data-clip="${clip}">Escuchar</button>
        </li>`
      )
      .join('');
    return `<h2>${title}</h2><ul>${rows}</ul>`;
  }).join('');
}

/** Marca qué frases ya están grabadas en assets/audio. */
async function refreshAll() {
  await Promise.all(Object.keys(NARRATION).map(refresh));
}

async function refresh(clip) {
  const exists = takes.has(clip) || (await fileExists(clip));
  const state = document.querySelector(`#clip-${clip} .clip__state`);
  state.dataset.state = exists ? 'done' : 'missing';
  state.textContent = exists ? 'Grabada' : 'Falta';
}

async function fileExists(clip) {
  if (folder) {
    try {
      await folder.getFileHandle(fileName(clip));
      return true;
    } catch {
      return false;
    }
  }
  try {
    const response = await fetch(Narrator.fileFor(clip), { method: 'HEAD', cache: 'no-store' });
    return response.ok;
  } catch {
    return false;
  }
}

function fileName(clip) {
  return `${clip}.${NARRATOR.extension}`;
}

/** Con una carpeta elegida, cada grabación se guarda sola ahí (Chrome y Edge). */
async function pickFolder() {
  if (!window.showDirectoryPicker) {
    folderStatus.textContent = 'Este navegador no deja elegir carpeta: las grabaciones se descargan y las mueves a assets/audio.';
    return;
  }
  try {
    folder = await window.showDirectoryPicker({ mode: 'readwrite' });
  } catch {
    return; // canceló
  }
  folderStatus.textContent =
    folder.name === 'audio'
      ? 'Carpeta lista: cada grabación se guarda sola en assets/audio.'
      : `Elegiste "${folder.name}". Asegúrate de que sea la carpeta assets/audio del juego.`;
  refreshAll();
}

async function toggleRecording(clip) {
  if (recording) {
    recording.recorder.stop(); // un clic en cualquier "Detener" o "Grabar" termina la grabación actual
    return;
  }
  player?.pause();
  try {
    stream ??= await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch (error) {
    micStatus.textContent = `No se pudo usar el micrófono (${error.name}). Revisa el permiso en el ícono junto a la dirección de Chrome.`;
    return;
  }
  const [track] = stream.getAudioTracks();
  micStatus.textContent = `Micrófono: ${track?.label || 'sin nombre'}${track?.muted ? ' (está silenciado)' : ''}`;

  const recorder = new MediaRecorder(stream);
  const chunks = [];
  recorder.addEventListener('dataavailable', (event) => chunks.push(event.data));
  recorder.addEventListener('stop', () => finishRecording(clip, chunks));
  recording = { clip, recorder, stopMeter: showLiveLevel(clip) };
  setRecordingButton(clip, true);
  setState(clip, 'unknown', 'Grabando…');
  recorder.start();
}

/** Barrita de volumen mientras graba: así se ve si el micrófono sí escucha. */
function showLiveLevel(clip) {
  const meter = document.querySelector(`#clip-${clip} .clip__meter`);
  const fill = meter.firstElementChild;
  const context = new AudioContext();
  const analyser = context.createAnalyser();
  context.createMediaStreamSource(stream).connect(analyser);
  const samples = new Float32Array(analyser.fftSize);
  let frame = 0;
  const draw = () => {
    analyser.getFloatTimeDomainData(samples);
    const peak = samples.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
    fill.style.width = `${Math.min(100, peak * 140)}%`;
    frame = requestAnimationFrame(draw);
  };
  meter.hidden = false;
  draw();
  return () => {
    cancelAnimationFrame(frame);
    meter.hidden = true;
    context.close();
  };
}

async function finishRecording(clip, chunks) {
  recording.stopMeter();
  recording = null;
  setRecordingButton(clip, false);
  setState(clip, 'unknown', 'Procesando…');

  let wav;
  try {
    wav = await toCleanWav(new Blob(chunks, { type: chunks[0]?.type }));
  } catch (error) {
    console.error(error);
    const message = error instanceof RecordingError ? error.message : `No pude procesar la grabación (${error.name || error}). Graba otra vez.`;
    return setState(clip, 'missing', message);
  }
  takes.set(clip, wav);
  try {
    setState(clip, 'done', await save(clip, wav));
  } catch (error) {
    console.error(error);
    setState(clip, 'missing', `Se grabó, pero no se pudo guardar en la carpeta (${error.name}). Vuelve a dar clic en Elegir carpeta.`);
  }
}

function setState(clip, state, text) {
  const element = document.querySelector(`#clip-${clip} .clip__state`);
  element.dataset.state = state;
  element.textContent = text;
}

function setRecordingButton(clip, isRecording) {
  const button = document.querySelector(`#clip-${clip} [data-action="record"]`);
  button.textContent = isRecording ? 'Detener' : 'Grabar';
  button.classList.toggle('is-recording', isRecording);
}

async function save(clip, wav) {
  if (folder) {
    const handle = await folder.getFileHandle(fileName(clip), { create: true });
    const writable = await handle.createWritable();
    await writable.write(wav);
    await writable.close();
    return 'Guardada';
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(wav);
  link.download = fileName(clip);
  link.click();
  return 'Descargada: muévela a assets/audio';
}

function play(clip) {
  player?.pause();
  const take = takes.get(clip);
  player = new Audio(take ? URL.createObjectURL(take) : `${Narrator.fileFor(clip)}?v=${Date.now()}`);
  player.play().catch(() => {});
}

/** Pasa la grabación a mono, recorta los silencios de las orillas, iguala el volumen y la codifica en WAV. */
export async function toCleanWav(blob) {
  const context = new AudioContext();
  if (blob.size === 0) throw new RecordingError('La grabación salió vacía. Graba un poco más largo.');
  const decoded = await context.decodeAudioData(await blob.arrayBuffer());
  context.close();

  const length = Math.ceil(decoded.duration * SAMPLE_RATE);
  const offline = new OfflineAudioContext(1, length, SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const samples = (await offline.startRendering()).getChannelData(0);

  const trimmed = trimSilence(samples);
  const peak = trimmed.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
  if (peak < SILENT_PEAK) {
    throw new RecordingError('La grabación quedó en silencio: el micrófono no te escuchó. Revisa el micrófono que dice arriba.');
  }
  const gain = Math.min(MAX_GAIN, TARGET_PEAK / peak);
  return encodeWav(trimmed.map((sample) => sample * gain), SAMPLE_RATE);
}

function trimSilence(samples) {
  const windowSize = Math.round(WINDOW_SECONDS * SAMPLE_RATE);
  const levels = [];
  for (let start = 0; start < samples.length; start += windowSize) {
    let sum = 0;
    const end = Math.min(samples.length, start + windowSize);
    for (let i = start; i < end; i++) sum += samples[i] * samples[i];
    levels.push(Math.sqrt(sum / (end - start)));
  }
  const threshold = Math.max(...levels) * SILENCE_SHARE;
  const first = levels.findIndex((level) => level >= threshold);
  const last = levels.length - 1 - [...levels].reverse().findIndex((level) => level >= threshold);
  const from = Math.max(0, first * windowSize - Math.round(PAD_START_SECONDS * SAMPLE_RATE));
  const to = Math.min(samples.length, (last + 1) * windowSize + Math.round(PAD_END_SECONDS * SAMPLE_RATE));
  return samples.slice(from, to);
}

/** WAV de 16 bits, un canal. */
export function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (offset, value) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((sample, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample)) * 0x7fff, true));
  return new Blob([buffer], { type: 'audio/wav' });
}
