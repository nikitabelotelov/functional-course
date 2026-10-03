import { describe, expect, it } from "vitest";
import { Customer } from "../../src/domain/Customer.js";
import { ShoppingCart } from "../../src/domain/ShoppingCart.js";
import { MinOrderAmountDiscount } from "../../src/promotions/MinOrderAmountDiscount.js";

describe("MinOrderAmountDiscount", () => {
  const promo = new MinOrderAmountDiscount({
    id: "P-1",
    name: "500 off 10000",
    description: "desc",
    threshold: 10_000_00,
    discountAmount: 500_00,
  });
  const customer = new Customer({ id: "C-1", name: "Alice" });
  const cart = new ShoppingCart();

  it("is stackable", () => {
    expect(promo.stackable).toBe(true);
  });

  it("gives no discount below the threshold", () => {
    expect(promo.discountForOrder(9_999_99, cart, customer)).toBe(0);
  });

  it("gives the fixed discount at or above the threshold", () => {
    expect(promo.discountForOrder(10_000_00, cart, customer)).toBe(500_00);
    expect(promo.discountForOrder(50_000_00, cart, customer)).toBe(500_00);
  });

  it("never discounts more than the amount itself", () => {
    expect(promo.discountForOrder(10_000_00, cart, customer)).toBeLessThanOrEqual(10_000_00);
  });
});
