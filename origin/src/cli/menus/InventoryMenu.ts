import type { Store } from "../../Store.js";
import type { Prompter } from "../Prompter.js";
import { formatInventoryList } from "../format.js";
import { resolveByNumberOrId } from "../selection.js";

/** Подменю склада: остатки, пополнение, резервы. */
export class InventoryMenu {
  constructor(
    private readonly store: Store,
    private readonly prompter: Prompter,
  ) {}

  async run(): Promise<void> {
    while (true) {
      this.prompter.write("\n=== Inventory ===\n1. Show stock\n2. Restock product\n3. Show reserved products\n0. Back\n");
      const choice = await this.prompter.askChoice("> ", ["0", "1", "2", "3"]);
      if (choice === "1") this.showStock();
      else if (choice === "2") await this.restock();
      else if (choice === "3") this.showReserved();
      else return;
    }
  }

  private showStock(): void {
    this.prompter.write(formatInventoryList(this.store.inventoryService.listAll()) + "\n");
  }

  private async restock(): Promise<void> {
    const games = this.store.catalogService.listAll();
    this.prompter.write(games.map((game, index) => `${index + 1}. ${game.id} "${game.name}"`).join("\n") + "\n");
    const answer = await this.prompter.askNonEmpty("Enter game number or id to restock: ");
    const game = resolveByNumberOrId(games, answer, (candidate) => candidate.id);
    if (!game) {
      this.prompter.write(`Game "${answer}" not found.\n`);
      return;
    }
    const quantity = await this.prompter.askInt("Quantity to add: ", { min: 1 });
    this.store.inventoryService.restock(game, quantity);
    this.prompter.write(`Restocked "${game.name}" +${quantity}.\n`);
  }

  private showReserved(): void {
    this.prompter.write(formatInventoryList(this.store.inventoryService.listReserved()) + "\n");
  }
}
