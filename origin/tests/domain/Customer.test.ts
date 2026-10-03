import { describe, expect, it } from "vitest";
import { Customer } from "../../src/domain/Customer.js";
import { LoyaltyLevel } from "../../src/domain/enums.js";
import { InvalidArgumentError } from "../../src/domain/errors.js";
import { GOLD_LEVEL_THRESHOLD, SILVER_LEVEL_THRESHOLD } from "../../src/config/rules.js";

describe("Customer points", () => {
  it("adds and spends points", () => {
    const customer = new Customer({ id: "C-1", name: "Alice" });
    customer.addPoints(100);
    expect(customer.points).toBe(100);
    customer.spendPoints(40);
    expect(customer.points).toBe(60);
  });

  it("throws when spending more points than available", () => {
    const customer = new Customer({ id: "C-1", name: "Alice" });
    customer.addPoints(10);
    expect(() => customer.spendPoints(11)).toThrow(InvalidArgumentError);
  });

  it("refunds spent points on cancellation", () => {
    const customer = new Customer({ id: "C-1", name: "Alice" });
    customer.addPoints(100);
    customer.spendPoints(60);
    customer.refundPoints(60);
    expect(customer.points).toBe(100);
  });
});

describe("Customer loyalty level", () => {
  it("stays Regular below the Silver threshold", () => {
    const customer = new Customer({ id: "C-1", name: "Alice" });
    customer.recordCompletedPurchase(SILVER_LEVEL_THRESHOLD - 1);
    expect(customer.loyaltyLevel).toBe(LoyaltyLevel.Regular);
  });

  it("upgrades to Silver once totalSpent reaches the threshold", () => {
    const customer = new Customer({ id: "C-1", name: "Alice" });
    customer.recordCompletedPurchase(SILVER_LEVEL_THRESHOLD);
    expect(customer.loyaltyLevel).toBe(LoyaltyLevel.Silver);
    expect(customer.totalSpent).toBe(SILVER_LEVEL_THRESHOLD);
  });

  it("upgrades to Gold once totalSpent reaches the threshold", () => {
    const customer = new Customer({ id: "C-1", name: "Alice" });
    customer.recordCompletedPurchase(GOLD_LEVEL_THRESHOLD);
    expect(customer.loyaltyLevel).toBe(LoyaltyLevel.Gold);
  });

  it("never downgrades the loyalty level", () => {
    const customer = new Customer({ id: "C-1", name: "Carol", loyaltyLevel: LoyaltyLevel.Gold, totalSpent: GOLD_LEVEL_THRESHOLD });
    // A tiny additional purchase keeps totalSpent well above Gold, but even if
    // it didn't, the level must not drop back to Silver or Regular.
    customer.recordCompletedPurchase(1_00);
    expect(customer.loyaltyLevel).toBe(LoyaltyLevel.Gold);
  });

  it("accumulates totalSpent across multiple completed orders", () => {
    const customer = new Customer({ id: "C-1", name: "Alice" });
    customer.recordCompletedPurchase(10_000_00);
    customer.recordCompletedPurchase(15_000_00);
    expect(customer.totalSpent).toBe(25_000_00);
    expect(customer.loyaltyLevel).toBe(LoyaltyLevel.Silver);
  });

  it("registers orders in customer history", () => {
    const customer = new Customer({ id: "C-1", name: "Alice" });
    const order = { id: "O-1001" } as unknown as import("../../src/domain/Order.js").Order;
    customer.registerOrder(order);
    expect(customer.orders).toContain(order);
  });
});
