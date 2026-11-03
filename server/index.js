import { MongoClient } from 'mongodb';
import { createApp } from './app.js';
import { prepareQuestions } from './questions.js';
import { prepareRanking } from './ranking.js';

const PORT = process.env.PORT ?? 5500;
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/aaa-rriba';
const CONNECT_TIMEOUT_MS = 5000;

const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS });
try {
  await client.connect();
} catch (error) {
  console.error(`No se pudo conectar a Mongo. Revisa MONGODB_URI en .env. (${error.message})`);
  process.exit(1);
}
const db = client.db();
await prepareQuestions(db);
await prepareRanking(db);
createApp(db).listen(PORT, (error) => {
  if (error) {
    console.error(`No se pudo abrir el puerto ${PORT}. ¿Hay otro servidor corriendo? (${error.message})`);
    process.exit(1);
  }
  console.log(`Aaa-rriba en http://localhost:${PORT}  (Ctrl+C para detener)`);
});
