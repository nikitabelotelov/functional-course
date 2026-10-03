import type { BoardGame } from "./BoardGame.js";

/**
 * Позиция оформленного заказа. Цена, скидка и итог по позиции фиксируются
 * в момент оформления и не зависят от последующих изменений каталога.
 * spec: Уточнения п. 6.
 */
export class OrderItem {
  readonly game: BoardGame;
  readonly quantity: number;
  /** Цена за единицу на момент оформления заказа, в копейках. */
  readonly unitPrice: number;
  /** Сумма позиционной скидки по этой позиции, в копейках. */
  readonly discount: number;
  /** Итог по позиции с учётом скидки: unitPrice * quantity - discount. */
  readonly lineTotal: number;

  constructor(game: BoardGame, quantity: number, unitPrice: number, discount: number) {
    this.game = game;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
    this.discount = discount;
    this.lineTotal = unitPrice * quantity - discount;
  }
}
