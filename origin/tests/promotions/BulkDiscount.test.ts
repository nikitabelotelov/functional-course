import { describe, expect, it } from "vitest";
import { BoardGame } from "../../src/domain/BoardGame.js";
import { CartItem } from "../../src/domain/CartItem.js";
import { Customer } from "../../src/domain/Customer.js";
import { Category } from "../../src/domain/enums.js";
import { BulkDiscount } from "../../src/promotions/BulkDiscount.js";

function makeGame(price: number): BoardGame {
  return new BoardGame({
    id: "G-1",
    name: "Carcassonne",
    description: "desc",
    price,
    category: Category.Family,
    minPlayers: 2,
    maxPlayers: 5,
    minAge: 7,
    playTimeMinutes: 40,
    publisher: "Hans im Glück",
    active: true,
  });
}

describe("BulkDiscount", () => {
  const customer = new Customer({ id: "C-1", name: "Alice" });
  const promo = new BulkDiscount({ id: "P-1", name: "Bulk -10%", description: "desc", minQuantity: 3, percent: 10 });

  it("does not apply below the minimum quantity", () => {
    const item = new CartItem(makeGame(1_000_00), 2);
    expect(promo.discountForItem(item, customer)).toBe(0);
  });

  it("applies at the minimum quantity", () => {
    const item = new CartItem(makeGame(1_000_00), 3);
    expect(promo.discountForItem(item, customer)).toBe(30_000); // 10% of 300000
  });

  it("applies above the minimum quantity", () => {
    const item = new CartItem(makeGame(1_000_00), 5);
    expect(promo.discountForItem(item, customer)).toBe(50_000); // 10% of 500000
  });
});
