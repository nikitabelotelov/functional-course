import type { Customer } from "./Customer.js";
import type { OrderItem } from "./OrderItem.js";
import { OrderStatus } from "./enums.js";
import { InvalidStatusTransitionError } from "./errors.js";

/** Запись истории смены статуса заказа. */
export interface OrderStatusHistoryEntry {
  readonly status: OrderStatus;
  readonly at: Date;
}

/** Применённая к заказу акция: название и сумма скидки. spec: Уточнения п. 6. */
export interface AppliedPromotion {
  readonly name: string;
  readonly amount: number;
}

export interface OrderProps {
  readonly id: string;
  readonly customer: Customer;
  readonly items: readonly OrderItem[];
  /** Сумма до скидок. */
  readonly subtotal: number;
  readonly itemDiscountTotal: number;
  readonly orderDiscountTotal: number;
  readonly appliedPromotions: readonly AppliedPromotion[];
  readonly deliveryCost: number;
  readonly pointsSpent: number;
  readonly total: number;
}

/** Допустимые переходы статуса заказа. spec: Уточнения п. 5. */
const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.Created]: [OrderStatus.Confirmed, OrderStatus.Cancelled],
  [OrderStatus.Confirmed]: [OrderStatus.Paid, OrderStatus.Cancelled],
  [OrderStatus.Paid]: [OrderStatus.Shipped, OrderStatus.Cancelled],
  [OrderStatus.Shipped]: [OrderStatus.Completed],
  [OrderStatus.Completed]: [],
  [OrderStatus.Cancelled]: [],
};

/**
 * Заказ. Существует в одном экземпляре (spec: Уточнения п. 1) — Customer.orders
 * и реестр CheckoutService ссылаются на тот же объект.
 *
 * Order отвечает только за собственные данные и легальность переходов статуса.
 * Побочные эффекты переходов (списание склада, начисление баллов и т.п.)
 * оркеструет CheckoutService (этап 2).
 */
export class Order {
  readonly id: string;
  readonly customer: Customer;
  readonly items: readonly OrderItem[];
  readonly subtotal: number;
  readonly itemDiscountTotal: number;
  readonly orderDiscountTotal: number;
  readonly appliedPromotions: readonly AppliedPromotion[];
  readonly deliveryCost: number;
  readonly pointsSpent: number;
  readonly total: number;
  readonly createdAt: Date;
  status: OrderStatus;
  private readonly statusHistory: OrderStatusHistoryEntry[];

  constructor(props: OrderProps) {
    this.id = props.id;
    this.customer = props.customer;
    this.items = props.items;
    this.subtotal = props.subtotal;
    this.itemDiscountTotal = props.itemDiscountTotal;
    this.orderDiscountTotal = props.orderDiscountTotal;
    this.appliedPromotions = props.appliedPromotions;
    this.deliveryCost = props.deliveryCost;
    this.pointsSpent = props.pointsSpent;
    this.total = props.total;
    // spec: Уточнения п. 2 — текущее время через new Date() внутри методов/конструктора.
    this.createdAt = new Date();
    this.status = OrderStatus.Created;
    this.statusHistory = [{ status: OrderStatus.Created, at: this.createdAt }];
  }

  getStatusHistory(): readonly OrderStatusHistoryEntry[] {
    return this.statusHistory;
  }

  /** Проверяет, допустим ли переход в указанный статус из текущего. */
  canTransitionTo(newStatus: OrderStatus): boolean {
    return ALLOWED_TRANSITIONS[this.status].includes(newStatus);
  }

  /**
   * Переводит заказ в новый статус, если переход допустим, и дописывает
   * запись в историю. Иначе выбрасывает InvalidStatusTransitionError.
   */
  changeStatus(newStatus: OrderStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new InvalidStatusTransitionError(
        `Cannot transition order ${this.id} from ${this.status} to ${newStatus}`,
      );
    }
    this.status = newStatus;
    this.statusHistory.push({ status: newStatus, at: new Date() });
  }

  /** Суммарное количество экземпляров в заказе. */
  getTotalItemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
