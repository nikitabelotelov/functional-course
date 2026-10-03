import type { BoardGame } from "./BoardGame.js";
import { InvalidArgumentError, OutOfStockError } from "./errors.js";

/**
 * Складской остаток конкретной игры. У каждой игры ровно один InventoryItem
 * (spec: Уточнения п. 1). Операции соответствуют таблице п. 4.
 */
export class InventoryItem {
  readonly product: BoardGame;
  private availableQuantity: number;
  private reservedQuantity: number;

  constructor(product: BoardGame, availableQuantity = 0, reservedQuantity = 0) {
    this.product = product;
    this.availableQuantity = availableQuantity;
    this.reservedQuantity = reservedQuantity;
  }

  getAvailableQuantity(): number {
    return this.availableQuantity;
  }

  getReservedQuantity(): number {
    return this.reservedQuantity;
  }

  /** Пополнение склада на n: availableQuantity += n. */
  restock(quantity: number): void {
    this.assertPositiveInteger(quantity);
    this.availableQuantity += quantity;
  }

  /** Резервирование n при checkout: availableQuantity -= n, reservedQuantity += n. */
  reserve(quantity: number): void {
    this.assertPositiveInteger(quantity);
    if (quantity > this.availableQuantity) {
      throw new OutOfStockError(
        `Not enough stock for "${this.product.name}": requested ${quantity}, available ${this.availableQuantity}`,
      );
    }
    this.availableQuantity -= quantity;
    this.reservedQuantity += quantity;
  }

  /** Снятие резерва n (отмена до отгрузки): availableQuantity += n, reservedQuantity -= n. */
  releaseReservation(quantity: number): void {
    this.assertPositiveInteger(quantity);
    if (quantity > this.reservedQuantity) {
      throw new InvalidArgumentError(
        `Cannot release ${quantity} reserved units for "${this.product.name}": only ${this.reservedQuantity} reserved`,
      );
    }
    this.reservedQuantity -= quantity;
    this.availableQuantity += quantity;
  }

  /** Списание n при переходе в Shipped: reservedQuantity -= n. */
  ship(quantity: number): void {
    this.assertPositiveInteger(quantity);
    if (quantity > this.reservedQuantity) {
      throw new InvalidArgumentError(
        `Cannot ship ${quantity} units for "${this.product.name}": only ${this.reservedQuantity} reserved`,
      );
    }
    this.reservedQuantity -= quantity;
  }

  /** Проверяет, что доступно не меньше указанного количества. */
  hasAvailable(quantity: number): boolean {
    return this.availableQuantity >= quantity;
  }

  private assertPositiveInteger(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new InvalidArgumentError(`Quantity must be a positive integer, got ${quantity}`);
    }
  }
}
