import type { BoardGame } from "../domain/BoardGame.js";
import type { CartItem } from "../domain/CartItem.js";
import type { Customer } from "../domain/Customer.js";
import { percentOf } from "../utils/money.js";
import { ItemPromotion } from "./ItemPromotion.js";
import type { PromotionProps } from "./Promotion.js";

export interface ProductDiscountProps extends PromotionProps {
  /** Ссылка на конкретную игру (spec: Уточнения п. 1 — не id, а сам объект). */
  readonly game: BoardGame;
  /** Процент скидки, например 15 для 15%. */
  readonly percent: number;
}

/** Процентная скидка на конкретную игру. spec: Уточнения п. 7. */
export class ProductDiscount extends ItemPromotion {
  readonly game: BoardGame;
  readonly percent: number;

  constructor(props: ProductDiscountProps) {
    super(props);
    this.game = props.game;
    this.percent = props.percent;
  }

  discountForItem(item: CartItem, _customer: Customer): number {
    if (item.game !== this.game) {
      return 0;
    }
    return percentOf(item.getBaseTotal(), this.percent);
  }
}
