import { describe, expect, it } from "vitest";
import { BoardGame } from "../../src/domain/BoardGame.js";
import { CartItem } from "../../src/domain/CartItem.js";
import { Customer } from "../../src/domain/Customer.js";
import { Category } from "../../src/domain/enums.js";
import { CategoryDiscount } from "../../src/promotions/CategoryDiscount.js";

function makeGame(category: Category, price = 1_000_00): BoardGame {
  return new BoardGame({
    id: "G-1",
    name: "Pandemic",
    description: "desc",
    price,
    category,
    minPlayers: 2,
    maxPlayers: 4,
    minAge: 8,
    playTimeMinutes: 45,
    publisher: "Z-Man Games",
    active: true,
  });
}

describe("CategoryDiscount", () => {
  const customer = new Customer({ id: "C-1", name: "Alice" });

  it("applies the discount to items of the matching category", () => {
    const promo = new CategoryDiscount({
      id: "P-1",
      name: "Cooperative -10%",
      description: "desc",
      category: Category.Cooperative,
      percent: 10,
    });
    const item = new CartItem(makeGame(Category.Cooperative, 1_000_00), 2);
    // base total = 2 * 1000.00 RUB = 2000.00 RUB, 10% of that = 200.00 RUB
    expect(promo.discountForItem(item, customer)).toBe(200_00);
  });

  it("does not apply to items of a different category", () => {
    const promo = new CategoryDiscount({
      id: "P-1",
      name: "Cooperative -10%",
      description: "desc",
      category: Category.Cooperative,
      percent: 10,
    });
    const item = new CartItem(makeGame(Category.Strategy, 1_000_00), 2);
    expect(promo.discountForItem(item, customer)).toBe(0);
  });
});
