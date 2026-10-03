import { describe, expect, it } from "vitest";
import { BoardGame } from "../../src/domain/BoardGame.js";
import { CartItem } from "../../src/domain/CartItem.js";
import { Customer } from "../../src/domain/Customer.js";
import { Category } from "../../src/domain/enums.js";
import { ProductDiscount } from "../../src/promotions/ProductDiscount.js";

function makeGame(id: string, price: number): BoardGame {
  return new BoardGame({
    id,
    name: `Game ${id}`,
    description: "desc",
    price,
    category: Category.Strategy,
    minPlayers: 2,
    maxPlayers: 4,
    minAge: 8,
    playTimeMinutes: 45,
    publisher: "Acme",
    active: true,
  });
}

describe("ProductDiscount", () => {
  const customer = new Customer({ id: "C-1", name: "Alice" });

  it("applies the discount only to the specified game", () => {
    const target = makeGame("G-1", 1_000_00);
    const other = makeGame("G-2", 1_000_00);
    const promo = new ProductDiscount({ id: "P-1", name: "Game -15%", description: "desc", game: target, percent: 15 });

    const targetItem = new CartItem(target, 1);
    const otherItem = new CartItem(other, 1);

    expect(promo.discountForItem(targetItem, customer)).toBe(15_000); // 15% of 100000
    expect(promo.discountForItem(otherItem, customer)).toBe(0);
  });

  it("distinguishes games with the same id string but different object identity is irrelevant — identity is by reference", () => {
    const target = makeGame("G-1", 1_000_00);
    const lookalike = makeGame("G-1", 1_000_00); // same id, different object
    const promo = new ProductDiscount({ id: "P-1", name: "Game -15%", description: "desc", game: target, percent: 15 });

    const lookalikeItem = new CartItem(lookalike, 1);
    expect(promo.discountForItem(lookalikeItem, customer)).toBe(0);
  });
});
