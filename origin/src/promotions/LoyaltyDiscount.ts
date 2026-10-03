import type { Customer } from "../domain/Customer.js";
import type { ShoppingCart } from "../domain/ShoppingCart.js";
import { LoyaltyLevel } from "../domain/enums.js";
import { LOYALTY_DISCOUNT_GOLD_PERCENT, LOYALTY_DISCOUNT_SILVER_PERCENT } from "../config/rules.js";
import { percentOf } from "../utils/money.js";
import { OrderPromotion } from "./OrderPromotion.js";
import type { PromotionProps } from "./Promotion.js";

/**
 * Скидка для Silver/Gold клиентов от суммы заказа после позиционных скидок.
 * Комбинируется с другими заказовыми акциями. spec: Уточнения п. 7.
 */
export class LoyaltyDiscount extends OrderPromotion {
  readonly stackable = true;

  constructor(props: PromotionProps) {
    super(props);
  }

  discountForOrder(amountAfterItemDiscounts: number, _cart: ShoppingCart, customer: Customer): number {
    const percent = this.percentForLevel(customer.loyaltyLevel);
    if (percent === 0) {
      return 0;
    }
    return percentOf(amountAfterItemDiscounts, percent);
  }

  private percentForLevel(level: LoyaltyLevel): number {
    switch (level) {
      case LoyaltyLevel.Gold:
        return LOYALTY_DISCOUNT_GOLD_PERCENT;
      case LoyaltyLevel.Silver:
        return LOYALTY_DISCOUNT_SILVER_PERCENT;
      case LoyaltyLevel.Regular:
        return 0;
    }
  }
}
