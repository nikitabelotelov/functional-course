import { describe, expect, it } from "vitest";
import { CategoryDiscount } from "../../src/promotions/CategoryDiscount.js";
import { Category } from "../../src/domain/enums.js";

describe("Promotion.isActiveNow", () => {
  it("is active when active flag is true and no date range is set", () => {
    const promo = new CategoryDiscount({
      id: "P-1",
      name: "Cooperative -10%",
      description: "desc",
      category: Category.Cooperative,
      percent: 10,
    });
    expect(promo.isActiveNow()).toBe(true);
  });

  it("is not active when active flag is false", () => {
    const promo = new CategoryDiscount({
      id: "P-1",
      name: "Cooperative -10%",
      description: "desc",
      category: Category.Cooperative,
      percent: 10,
      active: false,
    });
    expect(promo.isActiveNow()).toBe(false);
  });

  it("is not active before validFrom", () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const promo = new CategoryDiscount({
      id: "P-1",
      name: "Cooperative -10%",
      description: "desc",
      category: Category.Cooperative,
      percent: 10,
      validFrom: future,
    });
    expect(promo.isActiveNow()).toBe(false);
  });

  it("is not active after validTo", () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const promo = new CategoryDiscount({
      id: "P-1",
      name: "Cooperative -10%",
      description: "desc",
      category: Category.Cooperative,
      percent: 10,
      validTo: past,
    });
    expect(promo.isActiveNow()).toBe(false);
  });

  it("is active within validFrom..validTo", () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24);
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const promo = new CategoryDiscount({
      id: "P-1",
      name: "Cooperative -10%",
      description: "desc",
      category: Category.Cooperative,
      percent: 10,
      validFrom: past,
      validTo: future,
    });
    expect(promo.isActiveNow()).toBe(true);
  });
});
