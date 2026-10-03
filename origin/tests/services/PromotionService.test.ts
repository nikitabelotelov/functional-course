import { describe, expect, it } from "vitest";
import { createStore } from "../../src/Store.js";
import { Category } from "../../src/domain/enums.js";
import { PromoCodeError } from "../../src/domain/errors.js";
import { CategoryDiscount } from "../../src/promotions/CategoryDiscount.js";
import { PromoCodeDiscount } from "../../src/promotions/PromoCodeDiscount.js";
import { makeGame } from "../helpers/fixtures.js";

describe("PromotionService", () => {
  it("registers and lists promotions", () => {
    const store = createStore();
    const promo = new CategoryDiscount({ id: "P-1", name: "Coop -10%", description: "desc", category: Category.Cooperative, percent: 10 });
    store.promotionService.register(promo);
    expect(store.promotionService.listAll()).toContain(promo);
    expect(store.promotionService.listActive()).toContain(promo);
  });

  it("excludes inactive promotions from listActive", () => {
    const store = createStore();
    const promo = new CategoryDiscount({ id: "P-1", name: "Coop -10%", description: "desc", category: Category.Cooperative, percent: 10, active: false });
    store.promotionService.register(promo);
    expect(store.promotionService.listActive()).not.toContain(promo);
  });

  it("finds the best item discount among several applicable promotions", () => {
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
    const item = customer.cart.findItem(game)!;
    const best = store.promotionService.bestItemDiscount(item, customer);
    expect(best?.amount).toBe(200_00);
    expect(best?.promotion.name).toBe("Coop -20%");
  });

  it("applies a valid promo code to the cart", () => {
    const store = createStore();
    store.promotionService.register(
      new PromoCodeDiscount({ id: "PC-1", name: "WELCOME10", description: "desc", code: "WELCOME10", percent: 10 }),
    );
    const customer = store.customerService.create("Alice");
    store.promotionService.applyPromoCode(customer.cart, "WELCOME10");
    expect(customer.cart.promoCode).toBe("WELCOME10");
  });

  it("rejects an unknown promo code", () => {
    const store = createStore();
    const customer = store.customerService.create("Alice");
    expect(() => store.promotionService.applyPromoCode(customer.cart, "NOPE")).toThrow(PromoCodeError);
  });

  it("rejects an inactive promo code", () => {
    const store = createStore();
    store.promotionService.register(
      new PromoCodeDiscount({ id: "PC-1", name: "WELCOME10", description: "desc", code: "WELCOME10", percent: 10, active: false }),
    );
    const customer = store.customerService.create("Alice");
    expect(() => store.promotionService.applyPromoCode(customer.cart, "WELCOME10")).toThrow(PromoCodeError);
  });

  it("rejects an exhausted promo code", () => {
    const store = createStore();
    const promo = new PromoCodeDiscount({ id: "PC-1", name: "BOARD500", description: "desc", code: "BOARD500", fixedAmount: 500_00, maxUses: 1 });
    promo.registerUse();
    store.promotionService.register(promo);
    const customer = store.customerService.create("Alice");
    expect(() => store.promotionService.applyPromoCode(customer.cart, "BOARD500")).toThrow(PromoCodeError);
  });

  it("only treats the matching promo code as applicable for a given cart", () => {
    const store = createStore();
    const welcome = new PromoCodeDiscount({ id: "PC-1", name: "WELCOME10", description: "desc", code: "WELCOME10", percent: 10 });
    const board = new PromoCodeDiscount({ id: "PC-2", name: "BOARD500", description: "desc", code: "BOARD500", fixedAmount: 500_00 });
    store.promotionService.register(welcome);
    store.promotionService.register(board);
    const customer = store.customerService.create("Alice");
    customer.cart.promoCode = "WELCOME10";
    const applicable = store.promotionService.applicableNonCombinableOrderPromotions(customer.cart);
    expect(applicable).toEqual([welcome]);
  });
});
