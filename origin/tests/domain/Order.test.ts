import { describe, expect, it } from "vitest";
import { BoardGame } from "../../src/domain/BoardGame.js";
import { Customer } from "../../src/domain/Customer.js";
import { Order } from "../../src/domain/Order.js";
import { OrderItem } from "../../src/domain/OrderItem.js";
import { Category, OrderStatus } from "../../src/domain/enums.js";
import { InvalidStatusTransitionError } from "../../src/domain/errors.js";

function makeOrder(): Order {
  const game = new BoardGame({
    id: "G-1",
    name: "Azul",
    description: "desc",
    price: 2_990_00,
    category: Category.Abstract,
    minPlayers: 2,
    maxPlayers: 4,
    minAge: 8,
    playTimeMinutes: 45,
    publisher: "Plan B Games",
    active: true,
  });
  const customer = new Customer({ id: "C-1", name: "Alice" });
  const item = new OrderItem(game, 2, game.price, 0);
  return new Order({
    id: "O-1001",
    customer,
    items: [item],
    subtotal: item.unitPrice * item.quantity,
    itemDiscountTotal: 0,
    orderDiscountTotal: 0,
    appliedPromotions: [],
    deliveryCost: 390_00,
    pointsSpent: 0,
    total: item.unitPrice * item.quantity + 390_00,
  });
}

describe("Order status transitions", () => {
  it("starts in Created status with one history entry", () => {
    const order = makeOrder();
    expect(order.status).toBe(OrderStatus.Created);
    expect(order.getStatusHistory()).toHaveLength(1);
    expect(order.getStatusHistory()[0]?.status).toBe(OrderStatus.Created);
  });

  it("allows the full happy path Created -> Confirmed -> Paid -> Shipped -> Completed", () => {
    const order = makeOrder();
    order.changeStatus(OrderStatus.Confirmed);
    order.changeStatus(OrderStatus.Paid);
    order.changeStatus(OrderStatus.Shipped);
    order.changeStatus(OrderStatus.Completed);
    expect(order.status).toBe(OrderStatus.Completed);
    expect(order.getStatusHistory().map((entry) => entry.status)).toEqual([
      OrderStatus.Created,
      OrderStatus.Confirmed,
      OrderStatus.Paid,
      OrderStatus.Shipped,
      OrderStatus.Completed,
    ]);
  });

  it("allows cancellation from Created, Confirmed or Paid", () => {
    for (const steps of [[], [OrderStatus.Confirmed], [OrderStatus.Confirmed, OrderStatus.Paid]]) {
      const order = makeOrder();
      for (const step of steps) {
        order.changeStatus(step);
      }
      order.changeStatus(OrderStatus.Cancelled);
      expect(order.status).toBe(OrderStatus.Cancelled);
    }
  });

  it("rejects skipping steps", () => {
    const order = makeOrder();
    expect(() => order.changeStatus(OrderStatus.Paid)).toThrow(InvalidStatusTransitionError);
    expect(() => order.changeStatus(OrderStatus.Shipped)).toThrow(InvalidStatusTransitionError);
    expect(() => order.changeStatus(OrderStatus.Completed)).toThrow(InvalidStatusTransitionError);
  });

  it("does not allow cancelling after Shipped", () => {
    const order = makeOrder();
    order.changeStatus(OrderStatus.Confirmed);
    order.changeStatus(OrderStatus.Paid);
    order.changeStatus(OrderStatus.Shipped);
    expect(() => order.changeStatus(OrderStatus.Cancelled)).toThrow(InvalidStatusTransitionError);
  });

  it("treats Completed and Cancelled as terminal statuses", () => {
    const completed = makeOrder();
    completed.changeStatus(OrderStatus.Confirmed);
    completed.changeStatus(OrderStatus.Paid);
    completed.changeStatus(OrderStatus.Shipped);
    completed.changeStatus(OrderStatus.Completed);
    expect(() => completed.changeStatus(OrderStatus.Cancelled)).toThrow(InvalidStatusTransitionError);

    const cancelled = makeOrder();
    cancelled.changeStatus(OrderStatus.Cancelled);
    expect(() => cancelled.changeStatus(OrderStatus.Confirmed)).toThrow(InvalidStatusTransitionError);
  });

  it("reports the correct total item count", () => {
    const order = makeOrder();
    expect(order.getTotalItemCount()).toBe(2);
  });
});
