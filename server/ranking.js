import { ObjectId } from 'mongodb';

const RANKING = 'ranking';
const MAX_NAME_LENGTH = 12;
const MAX_POINTS = 100;
const MAX_SECONDS = 86400;
const MAX_PAGE_SIZE = 50;
const VISOR_PATTERN = /^#[0-9a-fA-F]{6}$/; // el color se dibuja dentro del SVG: solo se acepta un color
const ORDER = { points: -1, seconds: 1, _id: 1 };

export async function prepareRanking(db) {
  await db.collection(RANKING).createIndex(ORDER);
}

/** @returns {object|null} la entrada lista para guardar, o null si no es válida */
export function parseEntry({ name, points, seconds, visor } = {}) {
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const valid =
    cleanName.length > 0 &&
    cleanName.length <= MAX_NAME_LENGTH &&
    Number.isInteger(points) &&
    points >= 0 &&
    points <= MAX_POINTS &&
    Number.isInteger(seconds) &&
    seconds >= 0 &&
    seconds <= MAX_SECONDS &&
    typeof visor === 'string' &&
    VISOR_PATTERN.test(visor);
  return valid ? { name: cleanName, points, seconds, visor } : null;
}

export async function addEntry(db, entry) {
  const { insertedId } = await db.collection(RANKING).insertOne({ ...entry, createdAt: new Date() });
  return { id: insertedId.toHexString(), ...entry };
}

/** Una hoja del ranking; con `aroundId` calcula la hoja de esa entrada sin recorrer la tabla. */
export async function getPage(db, { page, pageSize, aroundId }) {
  const collection = db.collection(RANKING);
  const size = clamp(toInteger(pageSize, 5), 1, MAX_PAGE_SIZE);
  const total = await collection.countDocuments();
  const totalPages = Math.max(1, Math.ceil(total / size));
  const position = await positionOf(collection, aroundId);
  const wanted = position === null ? toInteger(page, 1) : Math.floor(position / size) + 1;
  const current = clamp(wanted, 1, totalPages);
  const start = (current - 1) * size;
  const entries = await collection.find().sort(ORDER).skip(start).limit(size).toArray();
  return { entries: entries.map(toEntry), page: current, totalPages, firstRank: start + 1 };
}

/** Cuántas entradas van antes de esta: más puntos, o mismos puntos y menos tiempo. */
async function positionOf(collection, id) {
  if (!ObjectId.isValid(id ?? '')) return null;
  const _id = new ObjectId(id);
  const entry = await collection.findOne({ _id });
  if (!entry) return null;
  const { points, seconds } = entry;
  return collection.countDocuments({
    $or: [{ points: { $gt: points } }, { points, seconds: { $lt: seconds } }, { points, seconds, _id: { $lt: _id } }],
  });
}

function toEntry({ _id, name, points, seconds, visor }) {
  return { id: _id.toHexString(), name, points, seconds, visor };
}

function toInteger(value, fallback) {
  const number = Number.parseInt(value, 10);
  return Number.isNaN(number) ? fallback : number;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
