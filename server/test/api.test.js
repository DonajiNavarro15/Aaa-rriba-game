import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app.js';
import { BalloonFlight, FLIGHT_EVENT } from '../../js/game/BalloonFlight.js';
import { FLIGHT } from '../../js/config.js';
import { BONUS_WORDS } from '../../js/game/words.js';
import { buildCatalog, ROUND_KINDS, WORD_KIND, WORDS_PER_ROUND } from '../catalog.js';
import { prepareQuestions } from '../questions.js';
import { prepareRanking } from '../ranking.js';

let mongo, client, db, server, base;
const VISOR = '#2F6FD1';

const post = (path, body) =>
  fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const fullRound = async () => (await post('/api/rounds', {})).json();
const round = async () => (await fullRound()).questions;
const addPlayer = async (name, points, seconds = 100) =>
  (await post('/api/ranking', { name, points, seconds, visor: VISOR })).json();

before(async () => {
  mongo = await MongoMemoryServer.create();
  client = await new MongoClient(mongo.getUri()).connect();
  db = client.db('test');
  await prepareQuestions(db);
  await prepareRanking(db);
  await new Promise((resolve) => (server = createApp(db).listen(0, resolve)));
  base = `http://localhost:${server.address().port}`;
});

after(async () => {
  server.close();
  await client.close();
  await mongo.stop();
});

beforeEach(() => db.collection('ranking').deleteMany({}));

test('el catálogo no repite operaciones y sus opciones son válidas', () => {
  const catalog = buildCatalog();
  assert.equal(new Set(catalog.map((q) => q.text)).size, catalog.length);
  for (const q of catalog.filter(({ kind }) => kind !== WORD_KIND)) {
    assert.equal(q.options.length, 3, q.text);
    assert.ok(q.options.includes(q.answer), q.text);
    assert.ok(q.options.every((option) => option > 0), q.text);
  }
});

test('ninguna operación tiene dos cifras de dos dígitos ni cifras de tres', () => {
  for (const q of buildCatalog().filter(({ kind }) => kind !== WORD_KIND)) {
    const numbers = q.text.match(/\d+/g).map(Number);
    assert.ok(numbers.every((n) => n <= 99), q.text);
    assert.ok(numbers.filter((n) => n >= 10).length <= 1, q.text);
  }
});

test('las palabras no se repiten en muchas partidas seguidas', async () => {
  assert.equal(new Set(BONUS_WORDS).size, BONUS_WORDS.length);
  await db.collection('questionQueues').updateOne({ _id: WORD_KIND }, { $set: { next: 0 } });
  const seen = [];
  for (let i = 0; i < Math.floor(BONUS_WORDS.length / WORDS_PER_ROUND); i++) seen.push(...(await fullRound()).words);
  assert.equal(new Set(seen).size, seen.length);
});

test('un catálogo nuevo reemplaza al viejo aunque tenga el mismo tamaño', async () => {
  const questions = db.collection('questions');
  await db.collection('catalogState').deleteOne({ _id: 'current' });
  await questions.updateOne({ kind: 'suma', position: 0 }, { $set: { text: '50 + 49 =' } });
  await prepareQuestions(db);
  assert.equal(await questions.countDocuments({ text: '50 + 49 =' }), 0);
  assert.equal(await questions.countDocuments(), buildCatalog().length);
});

test('las flechas mueven el globo en las cuatro direcciones sin voz', () => {
  const dt = 1 / 60;
  const fly = (flight, arrows, seconds) => {
    for (let t = 0; t < seconds; t += dt) flight.update(dt, 0, arrows);
  };
  const flight = new BalloonFlight();
  assert.equal(flight.update(dt, 0, { x: 0, y: -1 }), FLIGHT_EVENT.LAUNCHED);
  fly(flight, { x: 0, y: -1 }, 1);
  const { y } = flight;
  assert.ok(y < FLIGHT.groundY);
  const { x } = flight;
  fly(flight, { x: 0, y: 0 }, 1);
  assert.equal(flight.x, x, 'sin flechas se queda en su lugar');
  assert.ok(Math.abs(flight.y - y) < 40, 'sin flechas no se cae');
  fly(flight, { x: 1, y: 0 }, 0.5);
  assert.ok(flight.x > x);
  fly(flight, { x: -1, y: 0 }, 10);
  assert.equal(flight.x, FLIGHT.minX);
  fly(flight, { x: 0, y: 1 }, 5);
  assert.equal(flight.y, FLIGHT.groundY);
});

test('con flechas se puede cruzar el aro; sin flechas el vuelo con voz no cambia', () => {
  const dt = 1 / 60;
  const arrows = new BalloonFlight();
  let event;
  for (let t = 0; t < 20 && event !== FLIGHT_EVENT.REACHED_HOOPS; t += dt) event = arrows.update(dt, 0, { x: 1, y: 0 });
  assert.equal(event, FLIGHT_EVENT.REACHED_HOOPS);
  assert.equal(arrows.hoopIndex(), 2);

  const voice = new BalloonFlight();
  for (let t = 0; t < 1; t += dt) voice.update(dt, 60);
  const { x, y } = voice;
  for (let t = 0; t < 0.5; t += dt) voice.update(dt, 0);
  assert.ok(voice.x > x, 'sigue avanzando');
  assert.ok(voice.y > y, 'en silencio baja');
});

test('una partida trae 6 preguntas ordenadas por nivel', async () => {
  const questions = await round();
  assert.equal(questions.length, ROUND_KINDS.length);
  assert.deepEqual(questions.map((q) => q.level), [1, 1, 2, 2, 3, 3]);
});

test('las partidas seguidas no repiten operaciones', async () => {
  const seen = new Set();
  for (let i = 0; i < 40; i++) for (const q of await round()) {
    assert.ok(!seen.has(q.text), `se repitió ${q.text}`);
    seen.add(q.text);
  }
});

test('muchas partidas al mismo tiempo reciben operaciones distintas', async () => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const rounds = await Promise.all(Array.from({ length: 10 }, () => round()));
    const texts = rounds.flat().map((q) => q.text);
    assert.equal(new Set(texts).size, texts.length);
    await db.collection('questionQueues').updateMany({}, { $set: { next: 0 } });
  }
});

test('al acabarse el catálogo vuelve a empezar desde el principio', async () => {
  const queues = db.collection('questionQueues');
  const { size } = await queues.findOne({ _id: 'division' });
  const first = await db.collection('questions').findOne({ kind: 'division', position: 0 });
  await queues.updateOne({ _id: 'division' }, { $set: { next: size } });
  assert.equal((await round())[4].text, first.text);
});

test('reiniciar el servidor no reinicia la fila ni revuelve el catálogo', async () => {
  await round();
  const before = await db.collection('questionQueues').find().sort({ _id: 1 }).toArray();
  const first = await db.collection('questions').findOne({ kind: 'suma', position: 0 });
  await prepareQuestions(db);
  assert.deepEqual(await db.collection('questionQueues').find().sort({ _id: 1 }).toArray(), before);
  assert.equal((await db.collection('questions').findOne({ kind: 'suma', position: 0 })).text, first.text);
});

test('el ranking ordena por puntos y tiempo y abre en la hoja del jugador', async () => {
  const ids = [];
  for (let i = 0; i < 23; i++) ids.push((await addPlayer(`N${i}`, 50 - i)).id);
  const page = await (await fetch(`${base}/api/ranking?pageSize=5&aroundId=${ids[17]}`)).json();
  assert.equal(page.page, 4);
  assert.equal(page.totalPages, 5);
  assert.equal(page.firstRank, 16);
  assert.equal(page.entries[2].id, ids[17]);

  const tied = await addPlayer('Rapido', 50, 10);
  const first = await (await fetch(`${base}/api/ranking?pageSize=5`)).json();
  assert.equal(first.entries[0].id, tied.id);
});

test('un id desconocido abre la hoja pedida y las hojas se limitan', async () => {
  await addPlayer('Ana', 1);
  for (const query of ['aroundId=nope&page=1', 'aroundId=507f1f77bcf86cd799439011', 'page=99', 'page=-3', 'page=abc']) {
    const page = await (await fetch(`${base}/api/ranking?pageSize=5&${query}`)).json();
    assert.equal(page.page, 1, query);
    assert.equal(page.entries.length, 1, query);
  }
});

test('rechaza entradas no válidas', async () => {
  const good = { name: 'Ana', points: 3, seconds: 10, visor: VISOR };
  const bad = [
    { ...good, name: '   ' },
    { ...good, name: 'x'.repeat(13) },
    { ...good, name: { $gt: '' } },
    { ...good, points: -1 },
    { ...good, points: 1.5 },
    { ...good, seconds: '10' },
    { ...good, visor: '"><script>alert(1)</script>' },
  ];
  for (const body of bad) assert.equal((await post('/api/ranking', body)).status, 400, JSON.stringify(body));
  assert.equal((await post('/api/ranking', good)).status, 201);
});

test('solo publica los archivos del juego', async () => {
  assert.equal((await fetch(`${base}/`)).status, 200);
  assert.equal((await fetch(`${base}/js/main.js`)).status, 200);
  for (const path of ['/.env', '/.env.example', '/package.json', '/server/index.js', '/js/../server/index.js', '/api/nada']) {
    assert.equal((await fetch(base + path)).status, 404, path);
  }
});
