import { describe, expect, it } from "vitest";
import { createStore } from "../../src/Store.js";
import { Category } from "../../src/domain/enums.js";
import { NotFoundError } from "../../src/domain/errors.js";
import { makeGame } from "../helpers/fixtures.js";

describe("CatalogService", () => {
  it("adds a game with a generated id", () => {
    const store = createStore();
    const game = store.catalogService.addGame({
      name: "Wingspan",
      description: "A bird-themed engine builder",
      price: 3_500_00,
      category: Category.Strategy,
      minPlayers: 1,
      maxPlayers: 5,
      minAge: 10,
      playTimeMinutes: 70,
      publisher: "Stonemaier Games",
    });
    expect(game.id).toBe("G-1");
    expect(game.active).toBe(true);
    expect(store.catalogService.listActive()).toContain(game);
  });

  it("hides inactive games from the default catalog but keeps them in listAll", () => {
    const store = createStore();
    const game = makeGame(store, { name: "Azul" });
    store.catalogService.deactivate(game);
    expect(store.catalogService.listActive()).not.toContain(game);
    expect(store.catalogService.listAll()).toContain(game);
    expect(game.active).toBe(false);
  });

  it("can reactivate a game", () => {
    const store = createStore();
    const game = makeGame(store, { name: "Azul" });
    store.catalogService.deactivate(game);
    store.catalogService.activate(game);
    expect(store.catalogService.listActive()).toContain(game);
  });

  it("changes the price without affecting identity", () => {
    const store = createStore();
    const game = makeGame(store, { price: 1_000_00 });
    store.catalogService.setPrice(game, 1_200_00);
    expect(game.price).toBe(1_200_00);
  });

  it("finds a game by id and throws NotFoundError otherwise", () => {
    const store = createStore();
    const game = makeGame(store);
    expect(store.catalogService.getById(game.id)).toBe(game);
    expect(() => store.catalogService.getById("G-999")).toThrow(NotFoundError);
  });

  it("searches by name case-insensitively among active games only", () => {
    const store = createStore();
    const azul = makeGame(store, { name: "Azul" });
    makeGame(store, { name: "Carcassonne" });
    expect(store.catalogService.searchByName("azu")).toEqual([azul]);

    store.catalogService.deactivate(azul);
    expect(store.catalogService.searchByName("azu")).toEqual([]);
  });

  it("filters by category, player count and max price", () => {
    const store = createStore();
    const abstractGame = makeGame(store, { category: Category.Abstract, price: 1_000_00, minPlayers: 2, maxPlayers: 2 });
    const familyGame = makeGame(store, { category: Category.Family, price: 3_000_00, minPlayers: 2, maxPlayers: 6 });

    expect(store.catalogService.filterByCategory(Category.Abstract)).toEqual([abstractGame]);
    expect(store.catalogService.filterByPlayerCount(6)).toEqual([familyGame]);
    expect(store.catalogService.filterByMaxPrice(2_000_00)).toEqual([abstractGame]);
  });
});
