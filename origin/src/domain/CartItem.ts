import type { BoardGame } from "./BoardGame.js";

/**
 * Позиция корзины. Хранит только ссылку на игру и количество — цена всегда
 * берётся из текущей цены игры. spec: Уточнения п. 6.
 */
export class CartItem {
  readonly game: BoardGame;
  quantity: number;

  constructor(game: BoardGame, quantity: number) {
    this.game = game;
    this.quantity = quantity;
  }

  /** Базовая стоимость позиции по текущей цене игры (без скидок). */
  getBaseTotal(): number {
    return this.game.price * this.quantity;
  }
}
