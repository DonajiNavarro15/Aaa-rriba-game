import { API, STORAGE_KEYS } from '../config.js';

/**
 * Contrato del ranking: `ApiRankingRepository` lo guarda en Mongo a través del servidor
 * y `LocalRankingRepository` en el navegador, como respaldo si el servidor no responde.
 *
 * Entrada: { id, name, points, seconds, visor, isExample? }
 */
export class RankingRepository {
  /** @returns {Promise<Array>} */
  async getAll() {
    throw new Error('getAll() no implementado');
  }

  /** @returns {Promise<object>} la entrada guardada */
  async add(_entry) {
    throw new Error('add() no implementado');
  }

  /**
   * Una hoja del ranking ya ordenado. Con `aroundId` devuelve la hoja donde está esa entrada.
   * @returns {Promise<{entries: Array, page: number, totalPages: number, firstRank: number}>}
   */
  async getPage(_options) {
    throw new Error('getPage() no implementado');
  }
}

const EXAMPLE_CREW = [
  { id: 'ejemplo-leo', name: 'Leo', points: 7, seconds: 220, visor: '#3FB6A8', isExample: true },
  { id: 'ejemplo-mia', name: 'Mía', points: 6, seconds: 185, visor: '#8B6FD6', isExample: true },
  { id: 'ejemplo-sofi', name: 'Sofi', points: 5, seconds: 208, visor: '#E2604A', isExample: true },
  { id: 'ejemplo-diego', name: 'Diego', points: 4, seconds: 231, visor: '#F2B53A', isExample: true },
];

export class LocalRankingRepository extends RankingRepository {
  constructor() {
    super();
    this.memory = null; // respaldo si el navegador no deja guardar
  }

  async getAll() {
    return this.read() ?? this.memory ?? [...EXAMPLE_CREW];
  }

  async add(entry) {
    const saved = { ...entry, id: `${Date.now()}` };
    this.write([...(await this.getAll()), saved]);
    return saved;
  }

  async getPage({ page = 1, pageSize, aroundId = null }) {
    const sorted = sortRanking(await this.getAll());
    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const aroundIndex = aroundId === null ? -1 : sorted.findIndex((entry) => entry.id === aroundId);
    const wanted = aroundIndex >= 0 ? Math.floor(aroundIndex / pageSize) + 1 : page;
    const current = Math.min(Math.max(wanted, 1), totalPages);
    const start = (current - 1) * pageSize;
    return { entries: sorted.slice(start, start + pageSize), page: current, totalPages, firstRank: start + 1 };
  }

  read() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.crew));
    } catch {
      return null;
    }
  }

  write(entries) {
    this.memory = entries;
    try {
      localStorage.setItem(STORAGE_KEYS.crew, JSON.stringify(entries));
    } catch {
      /* sin almacenamiento disponible: el ranking dura solo esta sesión */
    }
  }
}

export class ApiRankingRepository extends RankingRepository {
  /** @param {RankingRepository} fallback se usa cuando el servidor no responde */
  constructor(fallback) {
    super();
    this.fallback = fallback;
  }

  async add(entry) {
    try {
      return await request('/ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch {
      return this.fallback.add(entry);
    }
  }

  async getPage({ page = 1, pageSize, aroundId = null }) {
    const query = new URLSearchParams({ page, pageSize });
    if (aroundId) query.set('aroundId', aroundId);
    try {
      return await request(`/ranking?${query}`);
    } catch {
      return this.fallback.getPage({ page, pageSize, aroundId });
    }
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API.baseUrl}${path}`, { ...options, signal: AbortSignal.timeout(API.timeoutMs) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

/** Más puntos primero; si empatan, gana quien tardó menos. */
export function sortRanking(entries) {
  return [...entries].sort((a, b) => b.points - a.points || a.seconds - b.seconds);
}
