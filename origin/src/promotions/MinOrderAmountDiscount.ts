import type { Customer } from "../domain/Customer.js";
import type { ShoppingCart } from "../domain/ShoppingCart.js";
import { OrderPromotion } from "./OrderPromotion.js";
import type { PromotionProps } from "./Promotion.js";

export interface MinOrderAmountDiscountProps extends PromotionProps {
  /** Порог суммы после позиционных скидок, в копейках. */
  readonly threshold: number;
  /** Фиксированная сумма скидки, в копейках. */
  readonly discountAmount: number;
}

/**
 * Фиксированная скидка при сумме заказа не меньше порога. Комбинируется
 * с другими заказовыми акциями. spec: Уточнения п. 7.
 */
export class MinOrderAmountDiscount extends OrderPromotion {
  readonly stackable = true;
  readonly threshold: number;
  readonly discountAmount: number;

  constructor(props: MinOrderAmountDiscountProps) {
    super(props);
    this.threshold = props.threshold;
    this.discountAmount = props.discountAmount;
  }

  discountForOrder(amountAfterItemDiscounts: number, _cart: ShoppingCart, _customer: Customer): number {
    if (amountAfterItemDiscounts < this.threshold) {
      return 0;
    }
    // spec: Уточнения п. 3 — скидка не может превышать стоимость товаров.
    return Math.min(this.discountAmount, amountAfterItemDiscounts);
  }
}
