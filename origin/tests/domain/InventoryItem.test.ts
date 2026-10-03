import { describe, expect, it } from "vitest";
import { BoardGame } from "../../src/domain/BoardGame.js";
import { InventoryItem } from "../../src/domain/InventoryItem.js";
import { Category } from "../../src/domain/enums.js";
import { InvalidArgumentError, OutOfStockError } from "../../src/domain/errors.js";

function makeGame(): BoardGame {
  return new BoardGame({
    id: "G-1",
    name: "Azul",
    description: "Tile-laying game",
    price: 2_990_00,
    category: Category.Abstract,
    minPlayers: 2,
    maxPlayers: 4,
    minAge: 8,
    playTimeMinutes: 45,
    publisher: "Plan B Games",
    active: true,
  });
}

describe("InventoryItem", () => {
  it("restocks available quantity", () => {
    const item = new InventoryItem(makeGame(), 5, 0);
    item.restock(3);
    expect(item.getAvailableQuantity()).toBe(8);
    expect(item.getReservedQuantity()).toBe(0);
  });

  it("reserves quantity: moves from available to reserved", () => {
    const item = new InventoryItem(makeGame(), 5, 0);
    item.reserve(2);
    expect(item.getAvailableQuantity()).toBe(3);
    expect(item.getReservedQuantity()).toBe(2);
  });

  it("throws OutOfStockError when reserving more than available", () => {
    const item = new InventoryItem(makeGame(), 1, 0);
    expect(() => item.reserve(2)).toThrow(OutOfStockError);
    expect(item.getAvailableQuantity()).toBe(1);
    expect(item.getReservedQuantity()).toBe(0);
  });

  it("releases reservation back to available", () => {
    const item = new InventoryItem(makeGame(), 5, 0);
    item.reserve(3);
    item.releaseReservation(2);
    expect(item.getAvailableQuantity()).toBe(4);
    expect(item.getReservedQuantity()).toBe(1);
  });

  it("ships: decreases reserved only, leaves available untouched", () => {
    const item = new InventoryItem(makeGame(), 5, 0);
    item.reserve(3);
    item.ship(3);
    expect(item.getAvailableQuantity()).toBe(2);
    expect(item.getReservedQuantity()).toBe(0);
  });

  it("rejects non-positive or non-integer quantities", () => {
    const item = new InventoryItem(makeGame(), 5, 0);
    expect(() => item.restock(0)).toThrow(InvalidArgumentError);
    expect(() => item.restock(-1)).toThrow(InvalidArgumentError);
    expect(() => item.restock(1.5)).toThrow(InvalidArgumentError);
  });

  it("reports whether enough is available", () => {
    const item = new InventoryItem(makeGame(), 5, 0);
    expect(item.hasAvailable(5)).toBe(true);
    expect(item.hasAvailable(6)).toBe(false);
  });

  it("never lets available or reserved go negative", () => {
    const item = new InventoryItem(makeGame(), 2, 1);
    expect(() => item.releaseReservation(2)).toThrow(InvalidArgumentError);
    expect(() => item.ship(2)).toThrow(InvalidArgumentError);
  });
});
