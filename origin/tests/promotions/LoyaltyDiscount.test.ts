import { describe, expect, it } from "vitest";
import { Customer } from "../../src/domain/Customer.js";
import { LoyaltyLevel } from "../../src/domain/enums.js";
import { ShoppingCart } from "../../src/domain/ShoppingCart.js";
import { LoyaltyDiscount } from "../../src/promotions/LoyaltyDiscount.js";

describe("LoyaltyDiscount", () => {
  const promo = new LoyaltyDiscount({ id: "P-1", name: "Loyalty discount", description: "desc" });
  const cart = new ShoppingCart();

  it("is stackable", () => {
    expect(promo.stackable).toBe(true);
  });

  it("gives no discount to Regular customers", () => {
    const customer = new Customer({ id: "C-1", name: "Alice" });
    expect(promo.discountForOrder(10_000_00, cart, customer)).toBe(0);
  });

  it("gives 3% to Silver customers", () => {
    const customer = new Customer({ id: "C-2", name: "Bob", loyaltyLevel: LoyaltyLevel.Silver });
    expect(promo.discountForOrder(10_000_00, cart, customer)).toBe(30_000); // 3% of 1_000_000
  });

  it("gives 5% to Gold customers", () => {
    const customer = new Customer({ id: "C-3", name: "Carol", loyaltyLevel: LoyaltyLevel.Gold });
    expect(promo.discountForOrder(10_000_00, cart, customer)).toBe(50_000); // 5% of 1_000_000
  });
});
