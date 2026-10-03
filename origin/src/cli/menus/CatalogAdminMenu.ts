import type { Store } from "../../Store.js";
import type { BoardGame } from "../../domain/BoardGame.js";
import type { Prompter } from "../Prompter.js";
import { Category } from "../../domain/enums.js";
import { formatGameList } from "../format.js";
import { resolveByNumberOrId } from "../selection.js";

const CATEGORY_VALUES = Object.values(Category);

/** Подменю управления каталогом (добавление, цена, активность). spec: Уточнения п. 11. */
export class CatalogAdminMenu {
  constructor(
    private readonly store: Store,
    private readonly prompter: Prompter,
  ) {}

  async run(): Promise<void> {
    while (true) {
      this.prompter.write(
        "\n=== Catalog management ===\n1. List all games (including inactive)\n2. Add new game\n3. Change price\n4. Deactivate game\n5. Activate game\n0. Back\n",
      );
      const choice = await this.prompter.askChoice("> ", ["0", "1", "2", "3", "4", "5"]);
      if (choice === "1") this.listAll();
      else if (choice === "2") await this.addGame();
      else if (choice === "3") await this.changePrice();
      else if (choice === "4") await this.deactivate();
      else if (choice === "5") await this.activate();
      else return;
    }
  }

  private listAll(): void {
    this.prompter.write(formatGameList(this.store.catalogService.listAll()) + "\n");
  }

  private async addGame(): Promise<void> {
    const name = await this.prompter.askNonEmpty("Name: ");
    const description = await this.prompter.askNonEmpty("Description: ");
    const price = await this.prompter.askInt("Price (RUB): ", { min: 1 });
    const categoryIndex = await this.prompter.askInt(
      `Category (${CATEGORY_VALUES.map((category, index) => `${index + 1}=${category}`).join(", ")}): `,
      { min: 1, max: CATEGORY_VALUES.length },
    );
    const minPlayers = await this.prompter.askInt("Min players: ", { min: 1 });
    const maxPlayers = await this.prompter.askInt("Max players: ", { min: minPlayers });
    const minAge = await this.prompter.askInt("Min age: ", { min: 0 });
    const playTimeMinutes = await this.prompter.askInt("Play time (minutes): ", { min: 1 });
    const publisher = await this.prompter.askNonEmpty("Publisher: ");

    const game = this.store.catalogService.addGame({
      name,
      description,
      price: price * 100,
      category: CATEGORY_VALUES[categoryIndex - 1]!,
      minPlayers,
      maxPlayers,
      minAge,
      playTimeMinutes,
      publisher,
    });
    this.store.inventoryService.registerProduct(game, 0);
    this.prompter.write(`Added game ${game.id} "${game.name}".\n`);
  }

  private async changePrice(): Promise<void> {
    const game = await this.pickGame();
    if (!game) return;
    const price = await this.prompter.askInt("New price (RUB): ", { min: 1 });
    this.store.catalogService.setPrice(game, price * 100);
    this.prompter.write(`Price of "${game.name}" changed to ${price} RUB.\n`);
  }

  private async deactivate(): Promise<void> {
    const game = await this.pickGame();
    if (!game) return;
    this.store.catalogService.deactivate(game);
    this.prompter.write(`"${game.name}" deactivated.\n`);
  }

  private async activate(): Promise<void> {
    const game = await this.pickGame();
    if (!game) return;
    this.store.catalogService.activate(game);
    this.prompter.write(`"${game.name}" activated.\n`);
  }

  private async pickGame(): Promise<BoardGame | undefined> {
    const games = this.store.catalogService.listAll();
    this.prompter.write(formatGameList(games) + "\n");
    const answer = await this.prompter.askNonEmpty("Enter game number or id: ");
    const game = resolveByNumberOrId(games, answer, (candidate) => candidate.id);
    if (!game) {
      this.prompter.write(`Game "${answer}" not found.\n`);
    }
    return game;
  }
}
