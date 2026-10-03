import type { BoardGame } from "../domain/BoardGame.js";
import { InventoryItem } from "../domain/InventoryItem.js";
import { NotFoundError } from "../domain/errors.js";
import type { ActivityLog } from "../utils/ActivityLog.js";

/** Отвечает за складские остатки игр. Операции из таблицы п. 4. */
export class InventoryService {
  private readonly itemsByGameId = new Map<string, InventoryItem>();

  constructor(private readonly activityLog: ActivityLog) {}

  /** Создаёт InventoryItem для новой игры. У каждой игры ровно один. spec: Уточнения п. 1. */
  registerProduct(game: BoardGame, initialQuantity = 0): InventoryItem {
    const item = new InventoryItem(game, initialQuantity, 0);
    this.itemsByGameId.set(game.id, item);
    return item;
  }

  getItem(game: BoardGame): InventoryItem {
    const item = this.itemsByGameId.get(game.id);
    if (!item) {
      throw new NotFoundError(`No inventory record for game "${game.name}"`);
    }
    return item;
  }

  listAll(): InventoryItem[] {
    return [...this.itemsByGameId.values()];
  }

  /** Позиции, у которых есть зарезервированные под заказы экземпляры. */
  listReserved(): InventoryItem[] {
    return this.listAll().filter((item) => item.getReservedQuantity() > 0);
  }

  checkAvailability(game: BoardGame, quantity: number): boolean {
    return this.getItem(game).hasAvailable(quantity);
  }

  /** Пополняет склад и пишет запись в журнал. */
  restock(game: BoardGame, quantity: number): void {
    this.getItem(game).restock(quantity);
    this.activityLog.record(`Restocked "${game.name}" +${quantity}`);
  }

  /** Резервирует n экземпляров (checkout). */
  reserve(game: BoardGame, quantity: number): void {
    this.getItem(game).reserve(quantity);
  }

  /** Снимает резерв n экземпляров (отмена заказа до отгрузки). */
  releaseReservation(game: BoardGame, quantity: number): void {
    this.getItem(game).releaseReservation(quantity);
  }

  /** Списывает n зарезервированных экземпляров (переход заказа в Shipped). */
  ship(game: BoardGame, quantity: number): void {
    this.getItem(game).ship(quantity);
  }
}
