import type { BoardGame } from "./BoardGame.js";
import { CartItem } from "./CartItem.js";
import { InvalidArgumentError } from "./errors.js";

/**
 * Корзина покупателя. Проверка остатков на складе (spec: Уточнения п. 4)
 * выполняется на уровне сервиса (этап 2), а не здесь — корзина отвечает
 * только за собственный набор позиций.
 */
export class ShoppingCart {
  private readonly items: CartItem[] = [];
  /** Промокод корзины — не более одного. spec: Уточнения п. 7. */
  promoCode: string | null = null;

  getItems(): readonly CartItem[] {
    return this.items;
  }

  findItem(game: BoardGame): CartItem | undefined {
    return this.items.find((item) => item.game === game);
  }

  /** Добавляет игру в корзину. Если позиция уже есть, количество суммируется. */
  addItem(game: BoardGame, quantity: number): void {
    this.assertPositiveInteger(quantity);
    const existing = this.findItem(game);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push(new CartItem(game, quantity));
    }
  }

  /** Удаляет игру из корзины полностью. */
  removeItem(game: BoardGame): void {
    const index = this.items.findIndex((item) => item.game === game);
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  /** Устанавливает новое количество для игры, уже лежащей в корзине. */
  updateQuantity(game: BoardGame, quantity: number): void {
    this.assertPositiveInteger(quantity);
    const existing = this.findItem(game);
    if (!existing) {
      throw new InvalidArgumentError(`Game "${game.name}" is not in the cart`);
    }
    existing.quantity = quantity;
  }

  /** Очищает корзину и сбрасывает промокод. */
  clear(): void {
    this.items.length = 0;
    this.promoCode = null;
  }

  /** Суммарная стоимость корзины по текущим ценам, без скидок. */
  getTotal(): number {
    return this.items.reduce((sum, item) => sum + item.getBaseTotal(), 0);
  }

  /** Суммарное количество экземпляров во всех позициях. */
  getItemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  private assertPositiveInteger(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new InvalidArgumentError(`Quantity must be a positive integer, got ${quantity}`);
    }
  }
}
