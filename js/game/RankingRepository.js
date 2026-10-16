import { STORAGE_KEYS } from '../config.js';

/**
 * Contrato del ranking. Hoy se guarda en el navegador; cuando exista el back-end
 * se crea `ApiRankingRepository` con los mismos métodos y se cambia en App.js.
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

/** Más puntos primero; si empatan, gana quien tardó menos. */
export function sortRanking(entries) {
  return [...entries].sort((a, b) => b.points - a.points || a.seconds - b.seconds);
}
