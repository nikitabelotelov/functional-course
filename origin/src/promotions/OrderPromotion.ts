import type { Customer } from "../domain/Customer.js";
import type { ShoppingCart } from "../domain/ShoppingCart.js";
import { Promotion } from "./Promotion.js";

/**
 * Заказовая акция: скидка считается от суммы корзины после позиционных
 * скидок. `stackable` определяет, можно ли комбинировать акцию с другими
 * заказовыми акциями. spec: Уточнения п. 7.
 */
export abstract class OrderPromotion extends Promotion {
  /** Можно ли комбинировать эту акцию с другими заказовыми акциями. */
  abstract readonly stackable: boolean;

  /** Сумма скидки в копейках от суммы после позиционных скидок. */
  abstract discountForOrder(amountAfterItemDiscounts: number, cart: ShoppingCart, customer: Customer): number;
}
