import type { Store } from "../../Store.js";
import { Category } from "../../domain/enums.js";
import type { Prompter } from "../Prompter.js";
import { formatGameDetails, formatGameList } from "../format.js";
import { resolveByNumberOrId } from "../selection.js";

const CATEGORY_VALUES = Object.values(Category);

/** Пользовательский каталог: обзор, детали, поиск, фильтры. spec: раздел "Каталог". */
export class CatalogMenu {
  constructor(
    private readonly store: Store,
    private readonly prompter: Prompter,
  ) {}

  async run(): Promise<void> {
    while (true) {
      this.prompter.write(
        "\n=== Catalog ===\n1. Browse all games\n2. View game details\n3. Search by name\n4. Filter by category\n5. Filter by player count\n6. Filter by max price\n0. Back\n",
      );
      const choice = await this.prompter.askChoice("> ", ["0", "1", "2", "3", "4", "5", "6"]);
      if (choice === "1") this.prompter.write(formatGameList(this.store.catalogService.listActive()) + "\n");
      else if (choice === "2") await this.viewDetails();
      else if (choice === "3") await this.searchByName();
      else if (choice === "4") await this.filterByCategory();
      else if (choice === "5") await this.filterByPlayerCount();
      else if (choice === "6") await this.filterByMaxPrice();
      else return;
    }
  }

  private async viewDetails(): Promise<void> {
    const games = this.store.catalogService.listActive();
    this.prompter.write(formatGameList(games) + "\n");
    const answer = await this.prompter.askNonEmpty("Enter game number or id: ");
    const game = resolveByNumberOrId(games, answer, (candidate) => candidate.id);
    if (!game) {
      this.prompter.write(`Game "${answer}" not found.\n`);
      return;
    }
    const inventoryItem = this.store.inventoryService.getItem(game);
    this.prompter.write(formatGameDetails(game, inventoryItem) + "\n");
  }

  private async searchByName(): Promise<void> {
    const query = await this.prompter.askNonEmpty("Search text: ");
    this.prompter.write(formatGameList(this.store.catalogService.searchByName(query)) + "\n");
  }

  private async filterByCategory(): Promise<void> {
    const index = await this.prompter.askInt(
      `Category (${CATEGORY_VALUES.map((category, categoryIndex) => `${categoryIndex + 1}=${category}`).join(", ")}): `,
      { min: 1, max: CATEGORY_VALUES.length },
    );
    const category = CATEGORY_VALUES[index - 1]!;
    this.prompter.write(formatGameList(this.store.catalogService.filterByCategory(category)) + "\n");
  }

  private async filterByPlayerCount(): Promise<void> {
    const players = await this.prompter.askInt("Number of players: ", { min: 1 });
    this.prompter.write(formatGameList(this.store.catalogService.filterByPlayerCount(players)) + "\n");
  }

  private async filterByMaxPrice(): Promise<void> {
    const maxPriceRub = await this.prompter.askInt("Max price (RUB): ", { min: 1 });
    this.prompter.write(formatGameList(this.store.catalogService.filterByMaxPrice(maxPriceRub * 100)) + "\n");
  }
}
