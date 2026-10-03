import type { CartItem } from "../domain/CartItem.js";
import type { Customer } from "../domain/Customer.js";
import type { Category } from "../domain/enums.js";
import { percentOf } from "../utils/money.js";
import { ItemPromotion } from "./ItemPromotion.js";
import type { PromotionProps } from "./Promotion.js";

export interface CategoryDiscountProps extends PromotionProps {
  readonly category: Category;
  /** Процент скидки, например 10 для 10%. */
  readonly percent: number;
}

/** Процентная скидка на все игры указанной категории. spec: Уточнения п. 7. */
export class CategoryDiscount extends ItemPromotion {
  readonly category: Category;
  readonly percent: number;

  constructor(props: CategoryDiscountProps) {
    super(props);
    this.category = props.category;
    this.percent = props.percent;
  }

  discountForItem(item: CartItem, _customer: Customer): number {
    if (item.game.category !== this.category) {
      return 0;
    }
    return percentOf(item.getBaseTotal(), this.percent);
  }
}
