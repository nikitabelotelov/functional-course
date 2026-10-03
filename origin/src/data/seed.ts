import type { Store } from "../Store.js";
import { Category, LoyaltyLevel } from "../domain/enums.js";
import { BulkDiscount } from "../promotions/BulkDiscount.js";
import { CategoryDiscount } from "../promotions/CategoryDiscount.js";
import { LoyaltyDiscount } from "../promotions/LoyaltyDiscount.js";
import { MinOrderAmountDiscount } from "../promotions/MinOrderAmountDiscount.js";
import { ProductDiscount } from "../promotions/ProductDiscount.js";
import { PromoCodeDiscount } from "../promotions/PromoCodeDiscount.js";

interface GameSeed {
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly category: Category;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly minAge: number;
  readonly playTimeMinutes: number;
  readonly publisher: string;
  readonly stock: number;
}

const GAMES: readonly GameSeed[] = [
  { name: "Catan", description: "Trade and build on the island of Catan.", price: 2_490_00, category: Category.Strategy, minPlayers: 3, maxPlayers: 4, minAge: 10, playTimeMinutes: 90, publisher: "Kosmos", stock: 15 },
  { name: "Carcassonne", description: "Tile-placement game of medieval landscapes.", price: 1_990_00, category: Category.Family, minPlayers: 2, maxPlayers: 5, minAge: 7, playTimeMinutes: 40, publisher: "Hans im Glück", stock: 20 },
  { name: "Codenames", description: "Guess your team's secret words first.", price: 1_490_00, category: Category.Party, minPlayers: 2, maxPlayers: 8, minAge: 14, playTimeMinutes: 15, publisher: "Czech Games Edition", stock: 25 },
  { name: "Pandemic", description: "Cooperatively stop four diseases from spreading.", price: 2_990_00, category: Category.Cooperative, minPlayers: 2, maxPlayers: 4, minAge: 8, playTimeMinutes: 45, publisher: "Z-Man Games", stock: 12 },
  { name: "Azul", description: "Draft colorful tiles to decorate a palace wall.", price: 2_990_00, category: Category.Abstract, minPlayers: 2, maxPlayers: 4, minAge: 8, playTimeMinutes: 45, publisher: "Plan B Games", stock: 10 },
  { name: "Risk", description: "Classic game of global conquest.", price: 3_490_00, category: Category.Wargame, minPlayers: 2, maxPlayers: 6, minAge: 10, playTimeMinutes: 120, publisher: "Hasbro", stock: 8 },
  { name: "Terraforming Mars", description: "Compete to make Mars habitable.", price: 4_990_00, category: Category.Strategy, minPlayers: 1, maxPlayers: 5, minAge: 12, playTimeMinutes: 120, publisher: "FryxGames", stock: 6 },
  { name: "Wingspan", description: "Attract birds to your wildlife preserves.", price: 3_990_00, category: Category.Strategy, minPlayers: 1, maxPlayers: 5, minAge: 10, playTimeMinutes: 70, publisher: "Stonemaier Games", stock: 9 },
  { name: "7 Wonders", description: "Build an ancient civilization in 3 ages.", price: 2_490_00, category: Category.Strategy, minPlayers: 2, maxPlayers: 7, minAge: 10, playTimeMinutes: 30, publisher: "Repos Production", stock: 14 },
  { name: "Ticket to Ride", description: "Build train routes across the continent.", price: 2_290_00, category: Category.Family, minPlayers: 2, maxPlayers: 5, minAge: 8, playTimeMinutes: 60, publisher: "Days of Wonder", stock: 18 },
  { name: "Dixit", description: "Tell stories with beautifully surreal cards.", price: 1_990_00, category: Category.Party, minPlayers: 3, maxPlayers: 6, minAge: 8, playTimeMinutes: 30, publisher: "Libellud", stock: 20 },
  { name: "Splendor", description: "Collect gems to attract the attention of nobles.", price: 1_790_00, category: Category.Abstract, minPlayers: 2, maxPlayers: 4, minAge: 8, playTimeMinutes: 30, publisher: "Space Cowboys", stock: 16 },
  { name: "Hanabi", description: "Cooperative fireworks show with hidden hands.", price: 990_00, category: Category.Cooperative, minPlayers: 2, maxPlayers: 5, minAge: 8, playTimeMinutes: 25, publisher: "Cocktail Games", stock: 22 },
  { name: "Forbidden Island", description: "Recover treasures from a sinking island, together.", price: 1_690_00, category: Category.Cooperative, minPlayers: 2, maxPlayers: 4, minAge: 10, playTimeMinutes: 30, publisher: "Gamewright", stock: 11 },
  { name: "Exploding Kittens", description: "A card game of kittens, explosions and laser beams.", price: 1_290_00, category: Category.CardGame, minPlayers: 2, maxPlayers: 5, minAge: 7, playTimeMinutes: 15, publisher: "Exploding Kittens Inc.", stock: 30 },
  { name: "Uno", description: "The classic numbered card game.", price: 990_00, category: Category.CardGame, minPlayers: 2, maxPlayers: 10, minAge: 7, playTimeMinutes: 20, publisher: "Mattel", stock: 40 },
  { name: "Memoir '44", description: "Relive famous WWII battles.", price: 3_990_00, category: Category.Wargame, minPlayers: 2, maxPlayers: 8, minAge: 10, playTimeMinutes: 60, publisher: "Days of Wonder", stock: 7 },
  { name: "Scythe", description: "Engine-building strategy in an alternate 1920s Europe.", price: 5_990_00, category: Category.Strategy, minPlayers: 1, maxPlayers: 5, minAge: 14, playTimeMinutes: 115, publisher: "Stonemaier Games", stock: 5 },
  { name: "Gloomhaven", description: "A massive cooperative dungeon-crawl campaign.", price: 11_990_00, category: Category.Cooperative, minPlayers: 1, maxPlayers: 4, minAge: 14, playTimeMinutes: 120, publisher: "Cephalofair Games", stock: 2 },
  { name: "Patchwork", description: "Sew the most beautiful (and dense) patchwork quilt.", price: 1_990_00, category: Category.Abstract, minPlayers: 2, maxPlayers: 2, minAge: 8, playTimeMinutes: 30, publisher: "Lookout Games", stock: 0 },
  { name: "King of Tokyo", description: "Giant monsters fight for the control of Tokyo.", price: 2_490_00, category: Category.Party, minPlayers: 2, maxPlayers: 6, minAge: 8, playTimeMinutes: 30, publisher: "IELLO", stock: 0 },
  { name: "Twilight Struggle", description: "Relive the Cold War as the USA or the USSR.", price: 4_490_00, category: Category.Wargame, minPlayers: 2, maxPlayers: 2, minAge: 14, playTimeMinutes: 180, publisher: "GMT Games", stock: 4 },
];

/**
 * Заполняет магазин повторяемыми тестовыми данными: один и тот же набор
 * игр, клиентов и акций при каждом запуске. spec: Уточнения п. 12.
 */
export function seed(store: Store): void {
  for (const gameSeed of GAMES) {
    const game = store.catalogService.addGame({
      name: gameSeed.name,
      description: gameSeed.description,
      price: gameSeed.price,
      category: gameSeed.category,
      minPlayers: gameSeed.minPlayers,
      maxPlayers: gameSeed.maxPlayers,
      minAge: gameSeed.minAge,
      playTimeMinutes: gameSeed.playTimeMinutes,
      publisher: gameSeed.publisher,
    });
    store.inventoryService.registerProduct(game, gameSeed.stock);
    // spec: Уточнения п. 12 — одна игра в каталоге неактивна.
    if (gameSeed.name === "Twilight Struggle") {
      store.catalogService.deactivate(game);
    }
  }

  const azul = store.catalogService.getById("G-5");

  store.promotionService.register(
    new CategoryDiscount({
      id: store.idGenerator.next("PROMO"),
      name: "Cooperative -10%",
      description: "10% off all cooperative games",
      category: Category.Cooperative,
      percent: 10,
    }),
  );
  store.promotionService.register(
    new ProductDiscount({
      id: store.idGenerator.next("PROMO"),
      name: "Azul -15%",
      description: "15% off Azul",
      game: azul,
      percent: 15,
    }),
  );
  store.promotionService.register(
    new BulkDiscount({
      id: store.idGenerator.next("PROMO"),
      name: "Buy 3+ -10%",
      description: "10% off a line when buying 3 or more copies of the same game",
      minQuantity: 3,
      percent: 10,
    }),
  );
  store.promotionService.register(
    new LoyaltyDiscount({
      id: store.idGenerator.next("PROMO"),
      name: "Loyalty discount",
      description: "3% for Silver, 5% for Gold customers",
    }),
  );
  store.promotionService.register(
    new MinOrderAmountDiscount({
      id: store.idGenerator.next("PROMO"),
      name: "500 off orders of 10 000+",
      description: "500 RUB off orders of 10 000 RUB or more",
      threshold: 10_000_00,
      discountAmount: 500_00,
    }),
  );
  store.promotionService.register(
    new PromoCodeDiscount({
      id: store.idGenerator.next("PROMO"),
      name: "WELCOME10",
      description: "10% off with promo code WELCOME10",
      code: "WELCOME10",
      percent: 10,
    }),
  );
  store.promotionService.register(
    new PromoCodeDiscount({
      id: store.idGenerator.next("PROMO"),
      name: "BOARD500",
      description: "500 RUB off with promo code BOARD500 (up to 3 uses)",
      code: "BOARD500",
      fixedAmount: 500_00,
      maxUses: 3,
    }),
  );

  store.customerService.create("Alice");
  store.customerService.create("Bob", { loyaltyLevel: LoyaltyLevel.Silver, totalSpent: 20_000_00 });
  store.customerService.create("Carol", {
    loyaltyLevel: LoyaltyLevel.Gold,
    points: 1_200,
    totalSpent: 60_000_00,
  });
}
