import type { CartItem } from "../domain/CartItem.js";
import type { Customer } from "../domain/Customer.js";
import { Promotion } from "./Promotion.js";

/**
 * Позиционная акция: скидка считается для одной позиции корзины.
 * spec: Уточнения п. 7 — к каждой позиции применяется одна лучшая такая акция.
 */
export abstract class ItemPromotion extends Promotion {
  /** Сумма скидки в копейках для данной позиции, 0 — если акция не применима к ней. */
  abstract discountForItem(item: CartItem, customer: Customer): number;
}
