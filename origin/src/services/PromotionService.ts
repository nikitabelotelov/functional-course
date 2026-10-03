import type { CartItem } from "../domain/CartItem.js";
import type { Customer } from "../domain/Customer.js";
import type { ShoppingCart } from "../domain/ShoppingCart.js";
import { PromoCodeError } from "../domain/errors.js";
import { ItemPromotion } from "../promotions/ItemPromotion.js";
import { OrderPromotion } from "../promotions/OrderPromotion.js";
import { PromoCodeDiscount } from "../promotions/PromoCodeDiscount.js";
import type { Promotion } from "../promotions/Promotion.js";
import type { ActivityLog } from "../utils/ActivityLog.js";

/** Лучшая позиционная скидка для позиции корзины. */
export interface BestItemDiscount {
  readonly promotion: ItemPromotion;
  readonly amount: number;
}

/** Хранит акции и определяет, какие из них применимы. spec: Уточнения п. 7. */
export class PromotionService {
  private readonly promotions: Promotion[] = [];

  constructor(private readonly activityLog: ActivityLog) {}

  /** Регистрирует акцию в каталоге акций магазина. */
  register(promotion: Promotion): void {
    this.promotions.push(promotion);
    this.activityLog.record(`Promotion "${promotion.name}" (${promotion.id}) registered`);
  }

  listAll(): readonly Promotion[] {
    return this.promotions;
  }

  /** Акции, активные прямо сейчас. */
  listActive(): Promotion[] {
    return this.promotions.filter((promotion) => promotion.isActiveNow());
  }

  /**
   * Лучшая (максимальная) позиционная скидка для позиции корзины.
   * spec: Уточнения п. 7.1 — позиционные скидки между собой не суммируются.
   */
  bestItemDiscount(item: CartItem, customer: Customer): BestItemDiscount | undefined {
    let best: BestItemDiscount | undefined;
    for (const promotion of this.listActive()) {
      if (!(promotion instanceof ItemPromotion)) {
        continue;
      }
      const amount = promotion.discountForItem(item, customer);
      if (amount > 0 && (!best || amount > best.amount)) {
        best = { promotion, amount };
      }
    }
    return best;
  }

  /** Активные заказовые акции, которые можно комбинировать друг с другом. */
  combinableOrderPromotions(): OrderPromotion[] {
    return this.activeOrderPromotions().filter((promotion) => promotion.stackable);
  }

  /**
   * Активные некомбинируемые заказовые акции, применимые к данной корзине.
   * PromoCodeDiscount применим только если его код установлен в cart.promoCode.
   */
  applicableNonCombinableOrderPromotions(cart: ShoppingCart): OrderPromotion[] {
    return this.activeOrderPromotions()
      .filter((promotion) => !promotion.stackable)
      .filter((promotion) => {
        if (promotion instanceof PromoCodeDiscount) {
          return cart.promoCode?.toLowerCase() === promotion.code.toLowerCase();
        }
        return true;
      });
  }

  /** Находит зарегистрированный промокод по строке кода (без учёта регистра). */
  findPromoCode(code: string): PromoCodeDiscount | undefined {
    return this.promotions.find(
      (promotion): promotion is PromoCodeDiscount =>
        promotion instanceof PromoCodeDiscount && promotion.code.toLowerCase() === code.toLowerCase(),
    );
  }

  /**
   * Применяет промокод к корзине: проверяет, что он существует, активен
   * и не исчерпан, и сохраняет его в ShoppingCart.promoCode.
   * spec: Уточнения п. 7 — применить можно только такой код, иначе ошибка.
   */
  applyPromoCode(cart: ShoppingCart, code: string): void {
    const promoCode = this.findPromoCode(code);
    if (!promoCode) {
      throw new PromoCodeError(`Promo code "${code}" does not exist`);
    }
    if (!promoCode.isActiveNow()) {
      throw new PromoCodeError(`Promo code "${code}" is not active`);
    }
    if (promoCode.isExhausted()) {
      throw new PromoCodeError(`Promo code "${code}" has reached its usage limit`);
    }
    cart.promoCode = promoCode.code;
  }

  /** Увеличивает счётчик использований промокода. Вызывается при checkout. */
  registerPromoCodeUse(code: string): void {
    const promoCode = this.findPromoCode(code);
    promoCode?.registerUse();
  }

  private activeOrderPromotions(): OrderPromotion[] {
    return this.listActive().filter((promotion): promotion is OrderPromotion => promotion instanceof OrderPromotion);
  }
}
