import { describe, expect, it } from "vitest";
import { DeliveryService } from "../../src/services/DeliveryService.js";

describe("DeliveryService", () => {
  const delivery = new DeliveryService();

  it("charges the base cost below the free delivery threshold", () => {
    expect(delivery.calculateCost(1_000_00, 1)).toBe(390_00);
  });

  it("is free at or above the free delivery threshold", () => {
    expect(delivery.calculateCost(5_000_00, 1)).toBe(0);
    expect(delivery.calculateCost(10_000_00, 1)).toBe(0);
  });

  it("adds a surcharge for large orders even when delivery is free", () => {
    expect(delivery.calculateCost(5_000_00, 11)).toBe(500_00);
  });

  it("adds a surcharge for large orders on top of the base cost", () => {
    expect(delivery.calculateCost(1_000_00, 11)).toBe(390_00 + 500_00);
  });

  it("does not add a surcharge exactly at the threshold", () => {
    expect(delivery.calculateCost(1_000_00, 10)).toBe(390_00);
  });
});
