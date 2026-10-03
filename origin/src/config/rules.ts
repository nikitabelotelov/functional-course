/**
 * Числовые константы бизнес-правил. Все суммы — в целых копейках.
 * spec: Уточнения п. 16 — "все числа бизнес-правил лежат в одном файле".
 */

// --- Доставка (spec: Уточнения п. 8) ---

/** Базовая стоимость доставки. */
export const BASE_DELIVERY_COST = 390_00;

/** Порог суммы товаров после скидок, при котором доставка бесплатна. */
export const FREE_DELIVERY_THRESHOLD = 5_000_00;

/** Порог количества экземпляров в заказе, после которого считается "крупным". */
export const LARGE_ORDER_ITEM_COUNT_THRESHOLD = 10;

/** Доплата за крупный заказ (действует даже при бесплатной доставке). */
export const LARGE_ORDER_SURCHARGE = 500_00;

// --- Бонусные баллы и лояльность (spec: Уточнения п. 9) ---

/** Сумма товаров (после скидок), за которую начисляется 1 балл. */
export const POINTS_EARN_AMOUNT_STEP = 100_00;

/** Множители начисления баллов по уровню лояльности. */
export const POINTS_MULTIPLIER_BY_LEVEL = {
  Regular: 1,
  Silver: 1.5,
  Gold: 2,
} as const;

/** 1 балл = 1 рубль (в копейках — 100 копеек за балл) при оплате баллами. */
export const POINT_VALUE_IN_KOPECKS = 100;

/** Максимальная доля суммы товаров (после скидок), которую можно оплатить баллами. */
export const MAX_POINTS_SHARE = 0.2;

/** Порог totalSpent для уровня Silver. */
export const SILVER_LEVEL_THRESHOLD = 20_000_00;

/** Порог totalSpent для уровня Gold. */
export const GOLD_LEVEL_THRESHOLD = 50_000_00;

// --- Акции (spec: Уточнения п. 7) ---

/** Скидка лояльности для Silver, в процентах. */
export const LOYALTY_DISCOUNT_SILVER_PERCENT = 3;

/** Скидка лояльности для Gold, в процентах. */
export const LOYALTY_DISCOUNT_GOLD_PERCENT = 5;
