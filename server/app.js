import express from 'express';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveRound } from './questions.js';
import { addEntry, getPage, parseEntry } from './ranking.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_FOLDERS = ['css', 'js', 'assets'];
const PUBLIC_PAGES = { '/': 'index.html', '/index.html': 'index.html', '/grabar.html': 'grabar.html' };

export function createApp(db) {
  const app = express();
  app.use(express.json({ limit: '2kb' }));

  app.post('/api/rounds', async (_req, res) => {
    res.json(await serveRound(db));
  });

  app.get('/api/ranking', async (req, res) => {
    res.json(await getPage(db, req.query));
  });

  app.post('/api/ranking', async (req, res) => {
    const entry = parseEntry(req.body);
    if (!entry) return res.status(400).json({ error: 'Entrada no válida' });
    res.status(201).json(await addEntry(db, entry));
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'No encontrado' }));

  // Solo se publican los archivos del juego: nunca server/, .env ni node_modules.
  const noCache = { setHeaders: (res) => res.setHeader('Cache-Control', 'no-cache') };
  for (const folder of PUBLIC_FOLDERS) app.use(`/${folder}`, express.static(join(ROOT, folder), noCache));
  for (const [route, file] of Object.entries(PUBLIC_PAGES)) app.get(route, (_req, res) => res.sendFile(join(ROOT, file)));

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(error.status ?? 500).json({ error: 'Error del servidor' });
  });
  return app;
}
