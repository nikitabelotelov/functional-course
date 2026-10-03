import { describe, expect, it } from "vitest";
import { createStore } from "../../src/Store.js";
import { OrderStatus } from "../../src/domain/enums.js";
import { InactiveGameError, InvalidStatusTransitionError, OutOfStockError } from "../../src/domain/errors.js";
import { PromoCodeDiscount } from "../../src/promotions/PromoCodeDiscount.js";
import { makeGame } from "../helpers/fixtures.js";

describe("CheckoutService.checkout", () => {
  it("creates an order, reserves stock and clears the cart", () => {
    const store = createStore();
    const game = makeGame(store, { price: 1_000_00, stock: 10 });
    const customer = store.customerService.create("Alice");
    customer.cart.addItem(game, 2);

    const order = store.checkoutService.checkout(customer);

    expect(order.id).toBe("O-1001");
    expect(order.status).toBe(OrderStatus.Created);
    expect(order.items).toHaveLength(1);
    expect(order.items[0]?.quantity).toBe(2);
    expect(customer.cart.isEmpty()).toBe(true);
    expect(customer.orders).toContain(order);
    expect(store.checkoutService.listOrders()).toContain(order);

    const item = store.inventoryService.getItem(game);
    expect(item.getAvailableQuantity()).toBe(8);
    expect(item.getReservedQuantity()).toBe(2);
  });

  it("fails with OutOfStockError and leaves the stock untouched (all-or-nothing)", () => {
    const store = createStore();
    const plentiful = makeGame(store, { name: "Plentiful", stock: 10 });
    const scarce = makeGame(store, { name: "Scarce", stock: 1 });
    const customer = store.customerService.create("Alice");
    customer.cart.addItem(plentiful, 2);
    customer.cart.addItem(scarce, 2);

    expect(() => store.checkoutService.checkout(customer)).toThrow(OutOfStockError);

    expect(store.inventoryService.getItem(plentiful).getReservedQuantity()).toBe(0);
    expect(store.inventoryService.getItem(plentiful).getAvailableQuantity()).toBe(10);
    expect(store.inventoryService.getItem(scarce).getReservedQuantity()).toBe(0);
    expect(customer.cart.isEmpty()).toBe(false);
  });

  it("fails with InactiveGameError when a cart item became inactive", () => {
    const store = createStore();
    const game = makeGame(store, { stock: 5 });
    const customer = store.customerService.create("Alice");
    customer.cart.addItem(game, 1);
    store.catalogService.deactivate(game);

    expect(() => store.checkoutService.checkout(customer)).toThrow(InactiveGameError);
    expect(customer.cart.isEmpty()).toBe(false);
  });

  it("fixes the order price even if the catalog price changes afterwards", () => {
    const store = createStore();
    const game = makeGame(store, { price: 1_000_00, stock: 5 });
    const customer = store.customerService.create("Alice");
    customer.cart.addItem(game, 1);

    const order = store.checkoutService.checkout(customer);
    expect(order.items[0]?.unitPrice).toBe(1_000_00);

    store.catalogService.setPrice(game, 5_000_00);
    expect(order.items[0]?.unitPrice).toBe(1_000_00);
    expect(order.total).toBe(order.items[0]!.lineTotal + order.deliveryCost);
  });

  it("pays part of the order with points and deducts them from the customer", () => {
    const store = createStore();
    const game = makeGame(store, { price: 10_000_00, stock: 5 });
    const customer = store.customerService.create("Alice", { points: 100 });
    customer.cart.addItem(game, 1);

    const order = store.checkoutService.checkout(customer, 50);

    expect(order.pointsSpent).toBe(50);
    expect(customer.points).toBe(50);
    expect(order.total).toBe(10_000_00 + order.deliveryCost - 50_00);
  });

  it("throws when the cart is empty", () => {
    const store = createStore();
    const customer = store.customerService.create("Alice");
    expect(() => store.checkoutService.checkout(customer)).toThrow();
  });

  it("increments the promo code usage counter on checkout", () => {
    const store = createStore();
    const game = makeGame(store, { price: 10_000_00, stock: 5 });
    store.promotionService.register(
      new PromoCodeDiscount({
        id: "PC-1",
        name: "WELCOME10",
        description: "desc",
        code: "WELCOME10",
        percent: 10,
      }),
    );
    const customer = store.customerService.create("Alice");
    customer.cart.addItem(game, 1);
    store.promotionService.applyPromoCode(customer.cart, "WELCOME10");

    store.checkoutService.checkout(customer);

    const promoCode = store.promotionService.findPromoCode("WELCOME10");
    expect(promoCode?.getUsesCount()).toBe(1);
  });
});

describe("CheckoutService status transitions", () => {
  it("moves stock from reserved to shipped on Shipped", () => {
    const store = createStore();
    const game = makeGame(store, { stock: 5 });
    const customer = store.customerService.create("Alice");
    customer.cart.addItem(game, 2);
    const order = store.checkoutService.checkout(customer);

    store.checkoutService.changeStatus(order, OrderStatus.Confirmed);
    store.checkoutService.changeStatus(order, OrderStatus.Paid);
    store.checkoutService.changeStatus(order, OrderStatus.Shipped);

    const item = store.inventoryService.getItem(game);
    expect(item.getReservedQuantity()).toBe(0);
    expect(item.getAvailableQuantity()).toBe(3);
    expect(order.status).toBe(OrderStatus.Shipped);
  });

  it("awards bonus points and recalculates loyalty level on Completed", () => {
    const store = createStore();
    const game = makeGame(store, { price: 10_000_00, stock: 5 });
    const customer = store.customerService.create("Alice");
    customer.cart.addItem(game, 1);
    const order = store.checkoutService.checkout(customer);

    store.checkoutService.changeStatus(order, OrderStatus.Confirmed);
    store.checkoutService.changeStatus(order, OrderStatus.Paid);
    store.checkoutService.changeStatus(order, OrderStatus.Shipped);
    store.checkoutService.changeStatus(order, OrderStatus.Completed);

    // 10_000.00 RUB after discounts -> 100 points at Regular x1 multiplier.
    expect(customer.points).toBe(100);
    expect(customer.totalSpent).toBe(10_000_00);
  });

  it("rejects invalid transitions, e.g. skipping to Shipped", () => {
    const store = createStore();
    const game = makeGame(store, { stock: 5 });
    const customer = store.customerService.create("Alice");
    customer.cart.addItem(game, 1);
    const order = store.checkoutService.checkout(customer);

    expect(() => store.checkoutService.changeStatus(order, OrderStatus.Shipped)).toThrow(InvalidStatusTransitionError);
  });
});

describe("CheckoutService.cancelOrder", () => {
  it("releases reserved stock back to available", () => {
    const store = createStore();
    const game = makeGame(store, { stock: 5 });
    const customer = store.customerService.create("Alice");
    customer.cart.addItem(game, 3);
    const order = store.checkoutService.checkout(customer);

    store.checkoutService.cancelOrder(order);

    const item = store.inventoryService.getItem(game);
    expect(item.getAvailableQuantity()).toBe(5);
    expect(item.getReservedQuantity()).toBe(0);
    expect(order.status).toBe(OrderStatus.Cancelled);
  });

  it("refunds spent points", () => {
    const store = createStore();
    const game = makeGame(store, { price: 10_000_00, stock: 5 });
    const customer = store.customerService.create("Alice", { points: 100 });
    customer.cart.addItem(game, 1);
    const order = store.checkoutService.checkout(customer, 50);
    expect(customer.points).toBe(50);

    store.checkoutService.cancelOrder(order);
    expect(customer.points).toBe(100);
  });

  it("cannot cancel a shipped order", () => {
    const store = createStore();
    const game = makeGame(store, { stock: 5 });
    const customer = store.customerService.create("Alice");
    customer.cart.addItem(game, 1);
    const order = store.checkoutService.checkout(customer);
    store.checkoutService.changeStatus(order, OrderStatus.Confirmed);
    store.checkoutService.changeStatus(order, OrderStatus.Paid);
    store.checkoutService.changeStatus(order, OrderStatus.Shipped);

    expect(() => store.checkoutService.cancelOrder(order)).toThrow(InvalidStatusTransitionError);
  });

  it("cannot cancel a completed order", () => {
    const store = createStore();
    const game = makeGame(store, { stock: 5 });
    const customer = store.customerService.create("Alice");
    customer.cart.addItem(game, 1);
    const order = store.checkoutService.checkout(customer);
    store.checkoutService.changeStatus(order, OrderStatus.Confirmed);
    store.checkoutService.changeStatus(order, OrderStatus.Paid);
    store.checkoutService.changeStatus(order, OrderStatus.Shipped);
    store.checkoutService.changeStatus(order, OrderStatus.Completed);

    expect(() => store.checkoutService.cancelOrder(order)).toThrow(InvalidStatusTransitionError);
  });
});
