import { describe, expect, it } from "vitest";
import { BoardGame } from "../../src/domain/BoardGame.js";
import { ShoppingCart } from "../../src/domain/ShoppingCart.js";
import { Category } from "../../src/domain/enums.js";
import { InvalidArgumentError } from "../../src/domain/errors.js";

function makeGame(id: string, price: number): BoardGame {
  return new BoardGame({
    id,
    name: `Game ${id}`,
    description: "desc",
    price,
    category: Category.Family,
    minPlayers: 2,
    maxPlayers: 4,
    minAge: 8,
    playTimeMinutes: 30,
    publisher: "Acme",
    active: true,
  });
}

describe("ShoppingCart", () => {
  it("adds a new item", () => {
    const cart = new ShoppingCart();
    const game = makeGame("G-1", 1_000_00);
    cart.addItem(game, 2);
    expect(cart.getItems()).toHaveLength(1);
    expect(cart.findItem(game)?.quantity).toBe(2);
  });

  it("sums quantity when adding the same game twice", () => {
    const cart = new ShoppingCart();
    const game = makeGame("G-1", 1_000_00);
    cart.addItem(game, 2);
    cart.addItem(game, 3);
    expect(cart.findItem(game)?.quantity).toBe(5);
    expect(cart.getItems()).toHaveLength(1);
  });

  it("removes an item", () => {
    const cart = new ShoppingCart();
    const game = makeGame("G-1", 1_000_00);
    cart.addItem(game, 2);
    cart.removeItem(game);
    expect(cart.isEmpty()).toBe(true);
  });

  it("updates quantity for an existing item", () => {
    const cart = new ShoppingCart();
    const game = makeGame("G-1", 1_000_00);
    cart.addItem(game, 2);
    cart.updateQuantity(game, 5);
    expect(cart.findItem(game)?.quantity).toBe(5);
  });

  it("throws when updating quantity for a game not in the cart", () => {
    const cart = new ShoppingCart();
    const game = makeGame("G-1", 1_000_00);
    expect(() => cart.updateQuantity(game, 5)).toThrow(InvalidArgumentError);
  });

  it("rejects non-positive or non-integer quantities", () => {
    const cart = new ShoppingCart();
    const game = makeGame("G-1", 1_000_00);
    expect(() => cart.addItem(game, 0)).toThrow(InvalidArgumentError);
    expect(() => cart.addItem(game, -1)).toThrow(InvalidArgumentError);
    expect(() => cart.addItem(game, 1.5)).toThrow(InvalidArgumentError);
  });

  it("clears items and promo code", () => {
    const cart = new ShoppingCart();
    const game = makeGame("G-1", 1_000_00);
    cart.addItem(game, 2);
    cart.promoCode = "WELCOME10";
    cart.clear();
    expect(cart.isEmpty()).toBe(true);
    expect(cart.promoCode).toBeNull();
  });

  it("computes total and item count from current game prices", () => {
    const cart = new ShoppingCart();
    const gameA = makeGame("G-1", 1_000_00);
    const gameB = makeGame("G-2", 500_00);
    cart.addItem(gameA, 2);
    cart.addItem(gameB, 3);
    expect(cart.getTotal()).toBe(2 * 1_000_00 + 3 * 500_00);
    expect(cart.getItemCount()).toBe(5);

    // spec: Уточнения п. 6 — цена всегда берётся из текущей цены игры.
    gameA.price = 1_200_00;
    expect(cart.getTotal()).toBe(2 * 1_200_00 + 3 * 500_00);
  });
});
