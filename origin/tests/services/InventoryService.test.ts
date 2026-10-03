import { describe, expect, it } from "vitest";
import { createStore } from "../../src/Store.js";
import { OutOfStockError } from "../../src/domain/errors.js";
import { makeGame } from "../helpers/fixtures.js";

describe("InventoryService", () => {
  it("registers a product with an initial quantity", () => {
    const store = createStore();
    const game = makeGame(store, { stock: 7 });
    const item = store.inventoryService.getItem(game);
    expect(item.getAvailableQuantity()).toBe(7);
    expect(item.getReservedQuantity()).toBe(0);
  });

  it("restocks and logs the activity", () => {
    const store = createStore();
    const game = makeGame(store, { name: "Azul", stock: 5 });
    store.inventoryService.restock(game, 3);
    expect(store.inventoryService.getItem(game).getAvailableQuantity()).toBe(8);
    const messages = store.activityLog.getEntries().map((entry) => entry.message);
    expect(messages).toContain('Restocked "Azul" +3');
  });

  it("checks availability", () => {
    const store = createStore();
    const game = makeGame(store, { stock: 5 });
    expect(store.inventoryService.checkAvailability(game, 5)).toBe(true);
    expect(store.inventoryService.checkAvailability(game, 6)).toBe(false);
  });

  it("reserves, releases and ships stock through the service", () => {
    const store = createStore();
    const game = makeGame(store, { stock: 5 });
    store.inventoryService.reserve(game, 3);
    let item = store.inventoryService.getItem(game);
    expect(item.getAvailableQuantity()).toBe(2);
    expect(item.getReservedQuantity()).toBe(3);

    store.inventoryService.releaseReservation(game, 1);
    item = store.inventoryService.getItem(game);
    expect(item.getAvailableQuantity()).toBe(3);
    expect(item.getReservedQuantity()).toBe(2);

    store.inventoryService.ship(game, 2);
    item = store.inventoryService.getItem(game);
    expect(item.getAvailableQuantity()).toBe(3);
    expect(item.getReservedQuantity()).toBe(0);
  });

  it("throws OutOfStockError when reserving more than available", () => {
    const store = createStore();
    const game = makeGame(store, { stock: 1 });
    expect(() => store.inventoryService.reserve(game, 2)).toThrow(OutOfStockError);
  });

  it("lists only items with a non-zero reservation", () => {
    const store = createStore();
    const reserved = makeGame(store, { name: "Reserved", stock: 5 });
    makeGame(store, { name: "NotReserved", stock: 5 });
    store.inventoryService.reserve(reserved, 2);
    const result = store.inventoryService.listReserved();
    expect(result).toHaveLength(1);
    expect(result[0]?.product).toBe(reserved);
  });
});
