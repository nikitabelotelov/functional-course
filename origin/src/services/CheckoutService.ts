import type { Customer } from "../domain/Customer.js";
import { Order } from "../domain/Order.js";
import { OrderItem } from "../domain/OrderItem.js";
import { LoyaltyLevel, OrderStatus } from "../domain/enums.js";
import { InactiveGameError, InvalidArgumentError, NotFoundError, OutOfStockError } from "../domain/errors.js";
import { POINTS_EARN_AMOUNT_STEP, POINTS_MULTIPLIER_BY_LEVEL } from "../config/rules.js";
import type { ActivityLog } from "../utils/ActivityLog.js";
import type { IdGenerator } from "../utils/IdGenerator.js";
import type { InventoryService } from "./InventoryService.js";
import type { PricingService } from "./PricingService.js";
import type { PromotionService } from "./PromotionService.js";

/** Оркестрирует оформление заказа, смену статусов и отмену. spec: разделы "Сервисы" и "Статусы заказа". */
export class CheckoutService {
  private readonly orders: Order[] = [];

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly pricingService: PricingService,
    private readonly promotionService: PromotionService,
    private readonly idGenerator: IdGenerator,
    private readonly activityLog: ActivityLog,
  ) {}

  /**
   * Оформляет заказ из текущей корзины клиента.
   * Шаги читаются сверху вниз — допустимое исключение для оркестратора.
   * spec: Уточнения п. 16.
   */
  checkout(customer: Customer, pointsToSpend = 0): Order {
    const cart = customer.cart;
    if (cart.isEmpty()) {
      throw new InvalidArgumentError("Cannot checkout: cart is empty");
    }

    // spec: Уточнения п. 10 — неактивные игры не попадают в новые заказы.
    const inactiveItems = cart.getItems().filter((item) => !item.game.active);
    if (inactiveItems.length > 0) {
      const names = inactiveItems.map((item) => item.game.name).join(", ");
      throw new InactiveGameError(`Cannot checkout: the following games are no longer active: ${names}`);
    }

    // spec: Уточнения п. 4 — повторная проверка остатков, всё или ничего.
    const shortages = cart
      .getItems()
      .filter((item) => !this.inventoryService.checkAvailability(item.game, item.quantity));
    if (shortages.length > 0) {
      const names = shortages.map((item) => item.game.name).join(", ");
      throw new OutOfStockError(`Cannot checkout: not enough stock for: ${names}`);
    }

    const breakdown = this.pricingService.calculate(cart, customer, pointsToSpend);

    // Резервируем склад только после того, как убедились, что хватает всего.
    for (const item of cart.getItems()) {
      this.inventoryService.reserve(item.game, item.quantity);
    }

    const orderItems = breakdown.items.map(
      (line) => new OrderItem(line.item.game, line.item.quantity, line.unitPrice, line.discount),
    );

    const order = new Order({
      id: this.idGenerator.next("O", 1001),
      customer,
      items: orderItems,
      subtotal: breakdown.subtotal,
      itemDiscountTotal: breakdown.itemDiscountTotal,
      orderDiscountTotal: breakdown.orderDiscountTotal,
      appliedPromotions: breakdown.appliedPromotions,
      deliveryCost: breakdown.deliveryCost,
      pointsSpent: breakdown.pointsSpent,
      total: breakdown.total,
    });

    if (pointsToSpend > 0) {
      customer.spendPoints(pointsToSpend);
    }
    if (cart.promoCode) {
      this.promotionService.registerPromoCodeUse(cart.promoCode);
    }

    this.orders.push(order);
    customer.registerOrder(order);
    cart.clear();

    this.activityLog.record(`Order ${order.id} created for customer ${customer.id} "${customer.name}"`);
    return order;
  }

  listOrders(): readonly Order[] {
    return this.orders;
  }

  getOrderById(id: string): Order {
    const order = this.orders.find((candidate) => candidate.id === id);
    if (!order) {
      throw new NotFoundError(`Order with id "${id}" not found`);
    }
    return order;
  }

  /** Отменяет заказ, если это допустимо для текущего статуса. */
  cancelOrder(order: Order): void {
    this.changeStatus(order, OrderStatus.Cancelled);
  }

  /**
   * Меняет статус заказа и выполняет связанные с переходом побочные эффекты
   * (склад, баллы, лояльность). spec: Уточнения п. 5.
   */
  changeStatus(order: Order, newStatus: OrderStatus): void {
    // order.changeStatus бросает InvalidStatusTransitionError раньше, чем мы
    // успеем что-либо изменить, так что побочные эффекты применяются только
    // к легальным переходам.
    order.changeStatus(newStatus);

    if (newStatus === OrderStatus.Shipped) {
      for (const item of order.items) {
        this.inventoryService.ship(item.game, item.quantity);
      }
      this.activityLog.record(`Order ${order.id} shipped`);
      return;
    }

    if (newStatus === OrderStatus.Completed) {
      const amountAfterDiscounts = order.subtotal - order.itemDiscountTotal - order.orderDiscountTotal;
      const earnedPoints = this.calculateEarnedPoints(amountAfterDiscounts, order.customer.loyaltyLevel);
      order.customer.addPoints(earnedPoints);
      order.customer.recordCompletedPurchase(amountAfterDiscounts);
      this.activityLog.record(
        `Order ${order.id} completed, +${earnedPoints} points for customer ${order.customer.id}`,
      );
      return;
    }

    if (newStatus === OrderStatus.Cancelled) {
      for (const item of order.items) {
        this.inventoryService.releaseReservation(item.game, item.quantity);
      }
      if (order.pointsSpent > 0) {
        order.customer.refundPoints(order.pointsSpent);
      }
      this.activityLog.record(`Order ${order.id} cancelled`);
      return;
    }

    this.activityLog.record(`Order ${order.id} status changed to ${newStatus}`);
  }

  private calculateEarnedPoints(amountAfterDiscounts: number, loyaltyLevel: LoyaltyLevel): number {
    const basePoints = Math.floor(amountAfterDiscounts / POINTS_EARN_AMOUNT_STEP);
    const multiplier = POINTS_MULTIPLIER_BY_LEVEL[loyaltyLevel];
    return Math.floor(basePoints * multiplier);
  }
}
