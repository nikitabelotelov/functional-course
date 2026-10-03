import type { CartItem } from "../domain/CartItem.js";
import type { Customer } from "../domain/Customer.js";
import { percentOf } from "../utils/money.js";
import { ItemPromotion } from "./ItemPromotion.js";
import type { PromotionProps } from "./Promotion.js";

export interface BulkDiscountProps extends PromotionProps {
  /** Минимальное количество экземпляров одной игры в позиции. */
  readonly minQuantity: number;
  /** Процент скидки, например 10 для 10%. */
  readonly percent: number;
}

/** "Купи N экземпляров — получи скидку" на эту позицию. spec: Уточнения п. 7. */
export class BulkDiscount extends ItemPromotion {
  readonly minQuantity: number;
  readonly percent: number;

  constructor(props: BulkDiscountProps) {
    super(props);
    this.minQuantity = props.minQuantity;
    this.percent = props.percent;
  }

  discountForItem(item: CartItem, _customer: Customer): number {
    if (item.quantity < this.minQuantity) {
      return 0;
    }
    return percentOf(item.getBaseTotal(), this.percent);
  }
}
