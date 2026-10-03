import {
  BASE_DELIVERY_COST,
  FREE_DELIVERY_THRESHOLD,
  LARGE_ORDER_ITEM_COUNT_THRESHOLD,
  LARGE_ORDER_SURCHARGE,
} from "../config/rules.js";

/** Вычисляет стоимость доставки. spec: Уточнения п. 8. */
export class DeliveryService {
  /**
   * @param amountAfterDiscounts сумма товаров после всех скидок, в копейках.
   * @param totalItemCount суммарное количество экземпляров в заказе.
   */
  calculateCost(amountAfterDiscounts: number, totalItemCount: number): number {
    let cost = amountAfterDiscounts >= FREE_DELIVERY_THRESHOLD ? 0 : BASE_DELIVERY_COST;
    // spec: Уточнения п. 8 — доплата действует и при бесплатной доставке.
    if (totalItemCount > LARGE_ORDER_ITEM_COUNT_THRESHOLD) {
      cost += LARGE_ORDER_SURCHARGE;
    }
    return cost;
  }
}
