import { describe, expect, it } from "vitest";
import { createStore } from "../../src/Store.js";
import { Category, LoyaltyLevel } from "../../src/domain/enums.js";
import { InvalidArgumentError } from "../../src/domain/errors.js";
import { LoyaltyDiscount } from "../../src/promotions/LoyaltyDiscount.js";
import { MinOrderAmountDiscount } from "../../src/promotions/MinOrderAmountDiscount.js";
import { PromoCodeDiscount } from "../../src/promotions/PromoCodeDiscount.js";
import { CategoryDiscount } from "../../src/promotions/CategoryDiscount.js";
import { makeGame } from "../helpers/fixtures.js";

describe("PricingService", () => {
  it("computes subtotal and delivery with no promotions", () => {
    const store = createStore();
    const game = makeGame(store, { price: 1_000_00, stock: 10 });
    const customer = store.customerService.create("Alice");
    customer.cart.addItem(game, 1);

    const breakdown = store.pricingService.calculate(customer.cart, customer);
    expect(breakdown.subtotal).toBe(1_000_00);
    expect(breakdown.itemDiscountTotal).toBe(0);
    expect(breakdown.orderDiscountTotal).toBe(0);
    expect(breakdown.deliveryCost).toBe(390_00);
    expect(breakdown.total).toBe(1_000_00 + 390_00);
  });

  it("applies only the single best item-level discount", () => {
    const store = createStore();
    const game = makeGame(store, { category: Category.Cooperative, price: 1_000_00 });
    store.promotionService.register(
      new CategoryDiscount({ id: "P-1", name: "Coop -10%", description: "desc", category: Category.Cooperative, percent: 10 }),
    );
    store.promotionService.register(
      new CategoryDiscount({ id: "P-2", name: "Coop -20%", description: "desc", category: Category.Cooperative, percent: 20 }),
    );
    const customer = store.customerService.create("Alice");
    customer.cart.addItem(game, 1);

    const breakdown = store.pricingService.calculate(customer.cart, customer);
    expect(breakdown.itemDiscountTotal).toBe(200_00);
    expect(breakdown.items[0]?.promotionName).toBe("Coop -20%");
  });

  it("combines stackable order-level promotions", () => {
    const store = createStore();
    const game = makeGame(store, { price: 10_000_00, stock: 5 });
    store.promotionService.register(new LoyaltyDiscount({ id: "P-1", name: "Loyalty", description: "desc" }));
    store.promotionService.register(
      new MinOrderAmountDiscount({ id: "P-2", name: "500 off 10000", description: "desc", threshold: 10_000_00, discountAmount: 500_00 }),
    );
    const customer = store.customerService.create("Bob", { loyaltyLevel: LoyaltyLevel.Silver });
    customer.cart.addItem(game, 1);

    const breakdown = store.pricingService.calculate(customer.cart, customer);
    // Loyalty 3% of 1_000_000 = 30_000, plus fixed 500_00 = 80_000
    expect(breakdown.orderDiscountTotal).toBe(30_000 + 500_00);
    expect(breakdown.appliedPromotions).toHaveLength(2);
  });

  it("picks the better of combined stackable vs best non-combinable promo code", () => {
    const store = createStore();
    const game = makeGame(store, { price: 10_000_00, stock: 5 });
    store.promotionService.register(new LoyaltyDiscount({ id: "P-1", name: "Loyalty", description: "desc" }));
    store.promotionService.register(
      new PromoCodeDiscount({ id: "P-2", name: "WELCOME10", description: "desc", code: "WELCOME10", percent: 10 }),
    );
    const customer = store.customerService.create("Bob", { loyaltyLevel: LoyaltyLevel.Silver });
    customer.cart.addItem(game, 1);
    customer.cart.promoCode = "WELCOME10";

    const breakdown = store.pricingService.calculate(customer.cart, customer);
    // Loyalty alone: 3% of 1_000_000 = 30_000. Promo code: 10% of 1_000_000 = 100_000.
    expect(breakdown.orderDiscountTotal).toBe(100_000);
    expect(breakdown.appliedPromotions).toEqual([{ name: "WELCOME10", amount: 100_000 }]);
  });

  it("caps points usage at the maximum share and at the customer balance", () => {
    const store = createStore();
    const game = makeGame(store, { price: 10_000_00, stock: 5 });
    const customer = store.customerService.create("Alice", { points: 10 });
    customer.cart.addItem(game, 1);

    const breakdown = store.pricingService.calculate(customer.cart, customer);
    // 20% of 1_000_000 = 200_00 (in points, 1 point = 100 kopecks -> 200 points),
    // but the customer only has 10 points.
    expect(breakdown.maxPointsUsable).toBe(10);
  });

  it("rejects spending more points than allowed", () => {
    const store = createStore();
    const game = makeGame(store, { price: 10_000_00, stock: 5 });
    const customer = store.customerService.create("Alice", { points: 1000 });
    customer.cart.addItem(game, 1);

    expect(() => store.pricingService.calculate(customer.cart, customer, 10_000)).toThrow(InvalidArgumentError);
  });

  it("subtracts the value of spent points from the total", () => {
    const store = createStore();
    const game = makeGame(store, { price: 10_000_00, stock: 5 });
    const customer = store.customerService.create("Alice", { points: 100 });
    customer.cart.addItem(game, 1);

    const breakdown = store.pricingService.calculate(customer.cart, customer, 50);
    expect(breakdown.pointsValue).toBe(50_00);
    expect(breakdown.total).toBe(breakdown.amountAfterDiscounts + breakdown.deliveryCost - 50_00);
  });
});
