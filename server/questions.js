import { createHash } from 'node:crypto';
import { buildCatalog, ROUND_KINDS, WORD_KIND, WORDS_PER_ROUND } from './catalog.js';

const QUESTIONS = 'questions';
const QUEUES = 'questionQueues';
const CATALOG_STATE = 'catalogState';

/** Llena el catálogo solo si su contenido cambió; así reiniciar el servidor no altera las filas. */
export async function prepareQuestions(db) {
  const collection = db.collection(QUESTIONS);
  await collection.createIndex({ kind: 1, position: 1 }, { unique: true });

  const catalog = buildCatalog();
  const hash = catalogHash(catalog);
  if ((await db.collection(CATALOG_STATE).findOne({ _id: 'current' }))?.hash === hash) return;
  await collection.deleteMany({});
  await collection.insertMany(catalog, { ordered: false });

  const sizes = {};
  for (const { kind } of catalog) sizes[kind] = (sizes[kind] ?? 0) + 1;
  await db.collection(QUEUES).bulkWrite(
    Object.entries(sizes).map(([kind, size]) => ({
      updateOne: { filter: { _id: kind }, update: { $set: { size }, $setOnInsert: { next: 0 } }, upsert: true },
    }))
  );
  await db.collection(CATALOG_STATE).updateOne({ _id: 'current' }, { $set: { hash } }, { upsert: true });
}

function catalogHash(catalog) {
  const texts = catalog.map(({ kind, text }) => `${kind}:${text}`).sort();
  return createHash('sha1').update(texts.join('\n')).digest('hex');
}

/**
 * Cada tipo de operación y las palabras son filas que comparten todos los jugadores: cada partida
 * toma las siguientes y al terminarse vuelve a empezar. El contador es atómico, así que dos niños
 * jugando al mismo tiempo nunca reciben el mismo lugar.
 */
export async function serveRound(db, random = Math.random) {
  const questions = [];
  for (const kind of ROUND_KINDS) {
    const { text, answer, level, options } = await nextInQueue(db, kind);
    questions.push({ text, answer, level, options: shuffled(options, random) });
  }
  const words = [];
  for (let i = 0; i < WORDS_PER_ROUND; i++) words.push((await nextInQueue(db, WORD_KIND)).text);
  return { questions, words };
}

async function nextInQueue(db, kind) {
  const { next, size } = await db
    .collection(QUEUES)
    .findOneAndUpdate({ _id: kind }, { $inc: { next: 1 } }, { returnDocument: 'before' });
  return db.collection(QUESTIONS).findOne({ kind, position: next % size });
}

function shuffled(values, random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
