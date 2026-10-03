import type { CartItem } from "../domain/CartItem.js";
import type { Customer } from "../domain/Customer.js";
import type { ShoppingCart } from "../domain/ShoppingCart.js";
import type { AppliedPromotion } from "../domain/Order.js";
import { InvalidArgumentError } from "../domain/errors.js";
import { MAX_POINTS_SHARE, POINT_VALUE_IN_KOPECKS } from "../config/rules.js";
import type { DeliveryService } from "./DeliveryService.js";
import type { PromotionService } from "./PromotionService.js";

/** Разбивка цены одной позиции корзины после позиционной скидки. */
export interface ItemPriceBreakdown {
  readonly item: CartItem;
  readonly unitPrice: number;
  readonly discount: number;
  readonly lineTotal: number;
  readonly promotionName?: string;
}

/** Полная разбивка стоимости корзины, используемая и для предпросмотра, и для checkout. */
export interface PriceBreakdown {
  readonly items: readonly ItemPriceBreakdown[];
  readonly subtotal: number;
  readonly itemDiscountTotal: number;
  readonly orderDiscountTotal: number;
  readonly appliedPromotions: readonly AppliedPromotion[];
  /** Пояснение, почему выбрана именно эта комбинация заказовых скидок. */
  readonly orderDiscountReason: string;
  readonly deliveryCost: number;
  /** Сумма товаров после всех скидок, до доставки и до оплаты баллами. */
  readonly amountAfterDiscounts: number;
  /** Максимум баллов, которые можно потратить в этом заказе. */
  readonly maxPointsUsable: number;
  readonly pointsSpent: number;
  /** Денежный эквивалент потраченных баллов, в копейках. */
  readonly pointsValue: number;
  readonly total: number;
}

/**
 * Отвечает за расчёт стоимости корзины: позиционные и заказовые скидки,
 * доставка, оплата баллами. Сам обращается к PromotionService и
 * DeliveryService. spec: Уточнения п. 2.
 */
export class PricingService {
  constructor(
    private readonly promotionService: PromotionService,
    private readonly deliveryService: DeliveryService,
  ) {}

  /**
   * Считает полную разбивку стоимости корзины для покупателя.
   * pointsToSpend — сколько баллов клиент хочет потратить (0 для предпросмотра).
   * Шаги читаются сверху вниз, поэтому метод сделан оркестратором без разбиения
   * на мелкие приватные шаги. spec: Уточнения п. 16 — допустимое исключение.
   */
  calculate(cart: ShoppingCart, customer: Customer, pointsToSpend = 0): PriceBreakdown {
    if (pointsToSpend < 0 || !Number.isInteger(pointsToSpend)) {
      throw new InvalidArgumentError(`pointsToSpend must be a non-negative integer, got ${pointsToSpend}`);
    }

    // 1. Позиционные скидки: для каждой позиции — одна лучшая. spec: Уточнения п. 7.1.
    const items: ItemPriceBreakdown[] = cart.getItems().map((item) => {
      const best = this.promotionService.bestItemDiscount(item, customer);
      const discount = best?.amount ?? 0;
      return {
        item,
        unitPrice: item.game.price,
        discount,
        lineTotal: item.getBaseTotal() - discount,
        promotionName: best?.promotion.name,
      };
    });

    const subtotal = cart.getTotal();
    const itemDiscountTotal = items.reduce((sum, line) => sum + line.discount, 0);
    const amountAfterItemDiscounts = subtotal - itemDiscountTotal;

    // 2. Заказовые скидки от суммы после позиционных. spec: Уточнения п. 7.2.
    const combinable = this.promotionService.combinableOrderPromotions();
    const combinableApplied: AppliedPromotion[] = combinable
      .map((promotion) => ({ name: promotion.name, amount: promotion.discountForOrder(amountAfterItemDiscounts, cart, customer) }))
      .filter((applied) => applied.amount > 0);
    const combinableTotal = combinableApplied.reduce((sum, applied) => sum + applied.amount, 0);

    const nonCombinable = this.promotionService.applicableNonCombinableOrderPromotions(cart);
    let bestNonCombinable: AppliedPromotion | undefined;
    for (const promotion of nonCombinable) {
      const amount = promotion.discountForOrder(amountAfterItemDiscounts, cart, customer);
      if (amount > 0 && (!bestNonCombinable || amount > bestNonCombinable.amount)) {
        bestNonCombinable = { name: promotion.name, amount };
      }
    }

    // Сравниваем сумму комбинируемых скидок и лучшую некомбинируемую, берём большую.
    let appliedPromotions: AppliedPromotion[];
    let orderDiscountReason: string;
    if (bestNonCombinable && bestNonCombinable.amount > combinableTotal) {
      appliedPromotions = [bestNonCombinable];
      orderDiscountReason = `"${bestNonCombinable.name}" gives a bigger discount than combining stackable promotions`;
    } else if (combinableApplied.length > 0) {
      appliedPromotions = combinableApplied;
      orderDiscountReason = "Combined stackable promotions give the biggest discount";
    } else {
      appliedPromotions = [];
      orderDiscountReason = "No applicable order-level promotions";
    }
    const orderDiscountTotal = appliedPromotions.reduce((sum, applied) => sum + applied.amount, 0);

    const amountAfterDiscounts = amountAfterItemDiscounts - orderDiscountTotal;

    // 3. Доставка — не участвует в скидках и не оплачивается баллами. spec: Уточнения п. 8.
    const deliveryCost = this.deliveryService.calculateCost(amountAfterDiscounts, cart.getItemCount());

    // 4. Оплата баллами: не больше MAX_POINTS_SHARE суммы товаров и не больше баланса. spec: Уточнения п. 9.
    const maxPointsUsable = Math.min(
      Math.floor((amountAfterDiscounts * MAX_POINTS_SHARE) / POINT_VALUE_IN_KOPECKS),
      customer.points,
    );
    if (pointsToSpend > maxPointsUsable) {
      throw new InvalidArgumentError(
        `Cannot spend ${pointsToSpend} points: at most ${maxPointsUsable} points allowed`,
      );
    }
    const pointsValue = pointsToSpend * POINT_VALUE_IN_KOPECKS;

    const total = amountAfterDiscounts + deliveryCost - pointsValue;

    return {
      items,
      subtotal,
      itemDiscountTotal,
      orderDiscountTotal,
      appliedPromotions,
      orderDiscountReason,
      deliveryCost,
      amountAfterDiscounts,
      maxPointsUsable,
      pointsSpent: pointsToSpend,
      pointsValue,
      total,
    };
  }
}
