import { BoardGame } from "../domain/BoardGame.js";
import type { Category } from "../domain/enums.js";
import { NotFoundError } from "../domain/errors.js";
import type { ActivityLog } from "../utils/ActivityLog.js";
import type { IdGenerator } from "../utils/IdGenerator.js";

export interface NewGameProps {
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly category: Category;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly minAge: number;
  readonly playTimeMinutes: number;
  readonly publisher: string;
}

/** Отвечает за каталог игр: список, поиск, фильтрацию и управление карточками. */
export class CatalogService {
  private readonly games: BoardGame[] = [];

  constructor(
    private readonly idGenerator: IdGenerator,
    private readonly activityLog: ActivityLog,
  ) {}

  /** Игры, видимые в обычном (не админском) каталоге — только активные. */
  listActive(): BoardGame[] {
    return this.games.filter((game) => game.active);
  }

  /** Все игры, включая неактивные. Для админского подменю. spec: Уточнения п. 10. */
  listAll(): readonly BoardGame[] {
    return this.games;
  }

  getById(id: string): BoardGame {
    const game = this.games.find((candidate) => candidate.id === id);
    if (!game) {
      throw new NotFoundError(`Game with id "${id}" not found`);
    }
    return game;
  }

  /** Поиск по подстроке названия (без учёта регистра), только среди активных игр. */
  searchByName(query: string): BoardGame[] {
    const needle = query.trim().toLowerCase();
    return this.listActive().filter((game) => game.name.toLowerCase().includes(needle));
  }

  filterByCategory(category: Category): BoardGame[] {
    return this.listActive().filter((game) => game.category === category);
  }

  filterByPlayerCount(players: number): BoardGame[] {
    return this.listActive().filter((game) => game.supportsPlayerCount(players));
  }

  filterByMaxPrice(maxPrice: number): BoardGame[] {
    return this.listActive().filter((game) => game.price <= maxPrice);
  }

  /** Добавляет новую игру в каталог со сгенерированным id. */
  addGame(props: NewGameProps): BoardGame {
    const game = new BoardGame({ id: this.idGenerator.next("G"), ...props, active: true });
    this.games.push(game);
    this.activityLog.record(`Game ${game.id} "${game.name}" added to catalog`);
    return game;
  }

  /** Изменяет цену игры. spec: правило 3 — не затрагивает уже оформленные заказы. */
  setPrice(game: BoardGame, newPrice: number): void {
    const oldPrice = game.price;
    game.price = newPrice;
    this.activityLog.record(`Game ${game.id} "${game.name}" price changed: ${oldPrice} -> ${newPrice}`);
  }

  /** Деактивирует игру — она перестаёт продаваться. spec: Уточнения п. 10, 11. */
  deactivate(game: BoardGame): void {
    game.active = false;
    this.activityLog.record(`Game ${game.id} "${game.name}" deactivated`);
  }

  /** Возвращает игру в продажу. */
  activate(game: BoardGame): void {
    game.active = true;
    this.activityLog.record(`Game ${game.id} "${game.name}" activated`);
  }
}
