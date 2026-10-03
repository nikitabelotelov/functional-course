import type { Store } from "../../Store.js";
import type { CartItem } from "../../domain/CartItem.js";
import type { Prompter } from "../Prompter.js";
import { formatGameList, formatPriceBreakdown } from "../format.js";
import { resolveByNumberOrId } from "../selection.js";

/** Подменю корзины: просмотр, добавление, удаление, изменение количества. */
export class CartMenu {
  constructor(
    private readonly store: Store,
    private readonly prompter: Prompter,
  ) {}

  async run(): Promise<void> {
    while (true) {
      this.prompter.write(
        "\n=== Cart ===\n1. View cart\n2. Add game\n3. Remove game\n4. Update quantity\n5. Clear cart\n0. Back\n",
      );
      const choice = await this.prompter.askChoice("> ", ["0", "1", "2", "3", "4", "5"]);
      if (choice === "1") this.viewCart();
      else if (choice === "2") await this.addGame();
      else if (choice === "3") await this.removeGame();
      else if (choice === "4") await this.updateQuantity();
      else if (choice === "5") this.clearCart();
      else return;
    }
  }

  private viewCart(): void {
    const customer = this.store.getActiveCustomer();
    if (customer.cart.isEmpty()) {
      this.prompter.write("Your cart is empty.\n");
      return;
    }
    const breakdown = this.store.pricingService.calculate(customer.cart, customer);
    this.prompter.write(formatPriceBreakdown(breakdown) + "\n");
  }

  private async addGame(): Promise<void> {
    const customer = this.store.getActiveCustomer();
    const games = this.store.catalogService.listActive();
    this.prompter.write(formatGameList(games) + "\n");
    const answer = await this.prompter.askNonEmpty("Enter game number or id to add (or 'back'): ");
    if (answer.toLowerCase() === "back") {
      return;
    }
    const game = resolveByNumberOrId(games, answer, (candidate) => candidate.id);
    if (!game) {
      this.prompter.write(`Game "${answer}" not found.\n`);
      return;
    }
    const quantity = await this.prompter.askInt("Quantity: ", { min: 1 });
    // spec: Уточнения п. 4 — количество в корзине не может превышать остаток на складе.
    const item = this.store.inventoryService.getItem(game);
    const currentQuantity = customer.cart.findItem(game)?.quantity ?? 0;
    if (!item.hasAvailable(currentQuantity + quantity)) {
      this.prompter.write(`Only ${item.getAvailableQuantity()} unit(s) of "${game.name}" available.\n`);
      return;
    }
    customer.cart.addItem(game, quantity);
    this.prompter.write(`Added ${quantity} x "${game.name}" to the cart.\n`);
  }

  private async removeGame(): Promise<void> {
    const customer = this.store.getActiveCustomer();
    if (customer.cart.isEmpty()) {
      this.prompter.write("Your cart is empty.\n");
      return;
    }
    const items = customer.cart.getItems();
    this.prompter.write(this.formatCartItemList(items) + "\n");
    const answer = await this.prompter.askNonEmpty("Enter item number or game id to remove: ");
    const match = resolveByNumberOrId(items, answer, (item) => item.game.id);
    if (!match) {
      this.prompter.write(`Item "${answer}" not found in the cart.\n`);
      return;
    }
    customer.cart.removeItem(match.game);
    this.prompter.write(`Removed "${match.game.name}" from the cart.\n`);
  }

  private async updateQuantity(): Promise<void> {
    const customer = this.store.getActiveCustomer();
    if (customer.cart.isEmpty()) {
      this.prompter.write("Your cart is empty.\n");
      return;
    }
    const items = customer.cart.getItems();
    this.prompter.write(this.formatCartItemList(items) + "\n");
    const answer = await this.prompter.askNonEmpty("Enter item number or game id to update: ");
    const match = resolveByNumberOrId(items, answer, (item) => item.game.id);
    if (!match) {
      this.prompter.write(`Item "${answer}" not found in the cart.\n`);
      return;
    }
    const quantity = await this.prompter.askInt("New quantity: ", { min: 1 });
    // spec: Уточнения п. 4 — проверяется и при изменении количества.
    const inventoryItem = this.store.inventoryService.getItem(match.game);
    if (!inventoryItem.hasAvailable(quantity)) {
      this.prompter.write(`Only ${inventoryItem.getAvailableQuantity()} unit(s) of "${match.game.name}" available.\n`);
      return;
    }
    customer.cart.updateQuantity(match.game, quantity);
    this.prompter.write(`Updated "${match.game.name}" quantity to ${quantity}.\n`);
  }

  private clearCart(): void {
    const customer = this.store.getActiveCustomer();
    customer.cart.clear();
    this.prompter.write("Cart cleared.\n");
  }

  private formatCartItemList(items: readonly CartItem[]): string {
    return items.map((item, index) => `${index + 1}. ${item.game.id} "${item.game.name}" x${item.quantity}`).join("\n");
  }
}
