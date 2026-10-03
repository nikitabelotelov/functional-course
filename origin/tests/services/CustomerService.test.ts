import { describe, expect, it } from "vitest";
import { createStore } from "../../src/Store.js";
import { LoyaltyLevel } from "../../src/domain/enums.js";
import { NotFoundError } from "../../src/domain/errors.js";

describe("CustomerService", () => {
  it("creates a customer with a generated id and defaults", () => {
    const store = createStore();
    const alice = store.customerService.create("Alice");
    expect(alice.id).toBe("C-1");
    expect(alice.loyaltyLevel).toBe(LoyaltyLevel.Regular);
    expect(alice.points).toBe(0);
    expect(store.customerService.listAll()).toContain(alice);
  });

  it("creates a customer with seeded loyalty data", () => {
    const store = createStore();
    const carol = store.customerService.create("Carol", {
      loyaltyLevel: LoyaltyLevel.Gold,
      points: 500,
      totalSpent: 60_000_00,
    });
    expect(carol.loyaltyLevel).toBe(LoyaltyLevel.Gold);
    expect(carol.points).toBe(500);
    expect(carol.totalSpent).toBe(60_000_00);
  });

  it("finds a customer by id and throws otherwise", () => {
    const store = createStore();
    const alice = store.customerService.create("Alice");
    expect(store.customerService.getById(alice.id)).toBe(alice);
    expect(() => store.customerService.getById("C-999")).toThrow(NotFoundError);
  });
});
