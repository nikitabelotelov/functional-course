import type { Store } from "../../Store.js";
import type { Order } from "../../domain/Order.js";
import { OrderStatus } from "../../domain/enums.js";
import type { Prompter } from "../Prompter.js";
import { formatOrderDetails, formatOrderSummary } from "../format.js";
import { resolveByNumberOrId } from "../selection.js";

const ALL_STATUSES = Object.values(OrderStatus);

/** Подменю управления заказами: список, детали, смена статуса, отмена. spec: Уточнения п. 11. */
export class OrdersAdminMenu {
  constructor(
    private readonly store: Store,
    private readonly prompter: Prompter,
  ) {}

  async run(): Promise<void> {
    while (true) {
      this.prompter.write(
        "\n=== Orders management ===\n1. List all orders\n2. View order details\n3. Change order status\n4. Cancel order\n0. Back\n",
      );
      const choice = await this.prompter.askChoice("> ", ["0", "1", "2", "3", "4"]);
      if (choice === "1") this.listOrders();
      else if (choice === "2") await this.viewOrder();
      else if (choice === "3") await this.changeStatus();
      else if (choice === "4") await this.cancelOrder();
      else return;
    }
  }

  private listOrders(): void {
    const orders = this.store.checkoutService.listOrders();
    if (orders.length === 0) {
      this.prompter.write("No orders yet.\n");
      return;
    }
    this.prompter.write(orders.map((order, index) => formatOrderSummary(order, index)).join("\n") + "\n");
  }

  private async viewOrder(): Promise<void> {
    const order = await this.pickOrder();
    if (!order) return;
    this.prompter.write(formatOrderDetails(order) + "\n");
  }

  private async changeStatus(): Promise<void> {
    const order = await this.pickOrder();
    if (!order) return;
    const options = ALL_STATUSES.filter((status) => order.canTransitionTo(status));
    if (options.length === 0) {
      this.prompter.write(`Order ${order.id} has no further status transitions available.\n`);
      return;
    }
    this.prompter.write(options.map((status, index) => `${index + 1}. ${status}`).join("\n") + "\n");
    const choice = await this.prompter.askInt("Select new status: ", { min: 1, max: options.length });
    this.store.checkoutService.changeStatus(order, options[choice - 1]!);
    this.prompter.write(`Order ${order.id} is now ${order.status}.\n`);
  }

  private async cancelOrder(): Promise<void> {
    const order = await this.pickOrder();
    if (!order) return;
    this.store.checkoutService.cancelOrder(order);
    this.prompter.write(`Order ${order.id} cancelled.\n`);
  }

  private async pickOrder(): Promise<Order | undefined> {
    const orders = this.store.checkoutService.listOrders();
    if (orders.length === 0) {
      this.prompter.write("No orders yet.\n");
      return undefined;
    }
    this.prompter.write(orders.map((order, index) => formatOrderSummary(order, index)).join("\n") + "\n");
    const answer = await this.prompter.askNonEmpty("Enter order number or id: ");
    const order = resolveByNumberOrId(orders, answer, (candidate) => candidate.id);
    if (!order) {
      this.prompter.write(`Order "${answer}" not found.\n`);
    }
    return order;
  }
}
