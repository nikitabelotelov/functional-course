import type { Order } from "./Order.js";
import { LoyaltyLevel } from "./enums.js";
import { ShoppingCart } from "./ShoppingCart.js";
import { InvalidArgumentError } from "./errors.js";
import { GOLD_LEVEL_THRESHOLD, SILVER_LEVEL_THRESHOLD } from "../config/rules.js";

export interface CustomerProps {
  readonly id: string;
  readonly name: string;
  readonly loyaltyLevel?: LoyaltyLevel;
  readonly points?: number;
  readonly totalSpent?: number;
}

/**
 * Покупатель. Хранит корзину и историю заказов — ссылки на те же объекты
 * Order, что лежат в реестре CheckoutService (spec: Уточнения п. 1).
 */
export class Customer {
  readonly id: string;
  name: string;
  loyaltyLevel: LoyaltyLevel;
  /** Накопленные бонусные баллы. */
  points: number;
  /** Сумма товаров после скидок по завершённым заказам. spec: Уточнения п. 9. */
  totalSpent: number;
  readonly cart: ShoppingCart = new ShoppingCart();
  readonly orders: Order[] = [];

  constructor(props: CustomerProps) {
    this.id = props.id;
    this.name = props.name;
    this.loyaltyLevel = props.loyaltyLevel ?? LoyaltyLevel.Regular;
    this.points = props.points ?? 0;
    this.totalSpent = props.totalSpent ?? 0;
  }

  /** Начисляет баллы клиенту. */
  addPoints(amount: number): void {
    if (amount < 0) {
      throw new InvalidArgumentError(`Cannot add a negative amount of points: ${amount}`);
    }
    this.points += amount;
  }

  /** Списывает баллы (оплата баллами при checkout). */
  spendPoints(amount: number): void {
    if (amount < 0) {
      throw new InvalidArgumentError(`Cannot spend a negative amount of points: ${amount}`);
    }
    if (amount > this.points) {
      throw new InvalidArgumentError(`Not enough points: have ${this.points}, requested ${amount}`);
    }
    this.points -= amount;
  }

  /** Возвращает ранее списанные баллы (отмена заказа). */
  refundPoints(amount: number): void {
    if (amount < 0) {
      throw new InvalidArgumentError(`Cannot refund a negative amount of points: ${amount}`);
    }
    this.points += amount;
  }

  /** Добавляет заказ в историю клиента. */
  registerOrder(order: Order): void {
    this.orders.push(order);
  }

  /**
   * Учитывает сумму завершённого заказа в totalSpent и пересчитывает уровень
   * лояльности. Уровень не понижается. spec: Уточнения п. 9.
   */
  recordCompletedPurchase(amountAfterDiscounts: number): void {
    this.totalSpent += amountAfterDiscounts;
    this.recalculateLoyaltyLevel();
  }

  private recalculateLoyaltyLevel(): void {
    const eligibleLevel = this.eligibleLoyaltyLevel();
    if (this.loyaltyLevelRank(eligibleLevel) > this.loyaltyLevelRank(this.loyaltyLevel)) {
      this.loyaltyLevel = eligibleLevel;
    }
  }

  private eligibleLoyaltyLevel(): LoyaltyLevel {
    if (this.totalSpent >= GOLD_LEVEL_THRESHOLD) {
      return LoyaltyLevel.Gold;
    }
    if (this.totalSpent >= SILVER_LEVEL_THRESHOLD) {
      return LoyaltyLevel.Silver;
    }
    return LoyaltyLevel.Regular;
  }

  private loyaltyLevelRank(level: LoyaltyLevel): number {
    switch (level) {
      case LoyaltyLevel.Regular:
        return 0;
      case LoyaltyLevel.Silver:
        return 1;
      case LoyaltyLevel.Gold:
        return 2;
    }
  }
}
