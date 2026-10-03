import type { Customer } from "../domain/Customer.js";
import type { ShoppingCart } from "../domain/ShoppingCart.js";
import { percentOf } from "../utils/money.js";
import { OrderPromotion } from "./OrderPromotion.js";
import type { PromotionProps } from "./Promotion.js";

export interface PromoCodeDiscountProps extends PromotionProps {
  readonly code: string;
  /** Процент скидки, например 10 для 10%. Указывается либо percent, либо fixedAmount. */
  readonly percent?: number;
  /** Фиксированная сумма скидки, в копейках. */
  readonly fixedAmount?: number;
  /** Максимальное число использований, без ограничения если не указано. */
  readonly maxUses?: number;
}

/**
 * Скидка по промокоду: процент или фиксированная сумма. Не комбинируется
 * с другими заказовыми акциями, может иметь лимит использований.
 * spec: Уточнения п. 7.
 */
export class PromoCodeDiscount extends OrderPromotion {
  readonly stackable = false;
  readonly code: string;
  readonly percent?: number;
  readonly fixedAmount?: number;
  readonly maxUses?: number;
  private usesCount = 0;

  constructor(props: PromoCodeDiscountProps) {
    super(props);
    this.code = props.code;
    this.percent = props.percent;
    this.fixedAmount = props.fixedAmount;
    this.maxUses = props.maxUses;
  }

  discountForOrder(amountAfterItemDiscounts: number, _cart: ShoppingCart, _customer: Customer): number {
    if (this.isExhausted()) {
      return 0;
    }
    const raw = this.percent != null ? percentOf(amountAfterItemDiscounts, this.percent) : (this.fixedAmount ?? 0);
    // spec: Уточнения п. 3 — скидка не может превышать стоимость товаров.
    return Math.min(raw, amountAfterItemDiscounts);
  }

  /** Сколько раз код уже был использован при checkout. */
  getUsesCount(): number {
    return this.usesCount;
  }

  /** Исчерпан ли лимит использований. */
  isExhausted(): boolean {
    return this.maxUses != null && this.usesCount >= this.maxUses;
  }

  /** Увеличивает счётчик использований. spec: Уточнения п. 7 — при checkout. */
  registerUse(): void {
    this.usesCount += 1;
  }
}
