import type { Store } from "../../src/Store.js";
import type { BoardGame } from "../../src/domain/BoardGame.js";
import { Category } from "../../src/domain/enums.js";

export interface MakeGameOptions {
  readonly name?: string;
  readonly price?: number;
  readonly category?: Category;
  readonly minPlayers?: number;
  readonly maxPlayers?: number;
  readonly stock?: number;
}

/** Создаёт игру через CatalogService и регистрирует складской остаток. */
export function makeGame(store: Store, options: MakeGameOptions = {}): BoardGame {
  const game = store.catalogService.addGame({
    name: options.name ?? "Azul",
    description: "A tile-laying game",
    price: options.price ?? 2_990_00,
    category: options.category ?? Category.Abstract,
    minPlayers: options.minPlayers ?? 2,
    maxPlayers: options.maxPlayers ?? 4,
    minAge: 8,
    playTimeMinutes: 45,
    publisher: "Plan B Games",
  });
  store.inventoryService.registerProduct(game, options.stock ?? 10);
  return game;
}
