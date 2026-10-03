import { describe, expect, it } from "vitest";
import { Customer } from "../../src/domain/Customer.js";
import { ShoppingCart } from "../../src/domain/ShoppingCart.js";
import { PromoCodeDiscount } from "../../src/promotions/PromoCodeDiscount.js";

describe("PromoCodeDiscount", () => {
  const customer = new Customer({ id: "C-1", name: "Alice" });
  const cart = new ShoppingCart();

  it("is not stackable", () => {
    const promo = new PromoCodeDiscount({ id: "P-1", name: "WELCOME10", description: "desc", code: "WELCOME10", percent: 10 });
    expect(promo.stackable).toBe(false);
  });

  it("computes a percentage discount", () => {
    const promo = new PromoCodeDiscount({ id: "P-1", name: "WELCOME10", description: "desc", code: "WELCOME10", percent: 10 });
    expect(promo.discountForOrder(10_000_00, cart, customer)).toBe(1_000_00);
  });

  it("computes a fixed amount discount capped by the order amount", () => {
    const promo = new PromoCodeDiscount({ id: "P-2", name: "BOARD500", description: "desc", code: "BOARD500", fixedAmount: 500_00 });
    expect(promo.discountForOrder(10_000_00, cart, customer)).toBe(500_00);
    expect(promo.discountForOrder(100_00, cart, customer)).toBe(100_00);
  });

  it("tracks usage and becomes exhausted at maxUses", () => {
    const promo = new PromoCodeDiscount({ id: "P-2", name: "BOARD500", description: "desc", code: "BOARD500", fixedAmount: 500_00, maxUses: 2 });
    expect(promo.isExhausted()).toBe(false);
    promo.registerUse();
    expect(promo.getUsesCount()).toBe(1);
    expect(promo.isExhausted()).toBe(false);
    promo.registerUse();
    expect(promo.getUsesCount()).toBe(2);
    expect(promo.isExhausted()).toBe(true);
  });

  it("returns 0 discount once exhausted", () => {
    const promo = new PromoCodeDiscount({ id: "P-2", name: "BOARD500", description: "desc", code: "BOARD500", fixedAmount: 500_00, maxUses: 1 });
    promo.registerUse();
    expect(promo.discountForOrder(10_000_00, cart, customer)).toBe(0);
  });

  it("has no limit when maxUses is not set", () => {
    const promo = new PromoCodeDiscount({ id: "P-1", name: "WELCOME10", description: "desc", code: "WELCOME10", percent: 10 });
    for (let i = 0; i < 100; i++) {
      promo.registerUse();
    }
    expect(promo.isExhausted()).toBe(false);
  });
});
