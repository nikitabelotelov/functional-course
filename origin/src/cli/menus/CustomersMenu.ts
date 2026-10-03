import type { Store } from "../../Store.js";
import type { Prompter } from "../Prompter.js";
import { formatCustomerDetails, formatCustomerSummary, formatOrderSummary } from "../format.js";
import { resolveByNumberOrId } from "../selection.js";

/** Подменю покупателей: список, создание, выбор активного, история заказов. */
export class CustomersMenu {
  constructor(
    private readonly store: Store,
    private readonly prompter: Prompter,
  ) {}

  async run(): Promise<void> {
    while (true) {
      this.prompter.write(
        "\n=== Customers ===\n1. List customers\n2. Create customer\n3. Switch active customer\n4. View customer info\n5. Order history\n0. Back\n",
      );
      const choice = await this.prompter.askChoice("> ", ["0", "1", "2", "3", "4", "5"]);
      if (choice === "1") this.listCustomers();
      else if (choice === "2") await this.createCustomer();
      else if (choice === "3") await this.switchActiveCustomer();
      else if (choice === "4") await this.viewCustomerInfo();
      else if (choice === "5") await this.viewOrderHistory();
      else return;
    }
  }

  private listCustomers(): void {
    const customers = this.store.customerService.listAll();
    this.prompter.write(customers.map((customer, index) => formatCustomerSummary(customer, index)).join("\n") + "\n");
  }

  private async createCustomer(): Promise<void> {
    const name = await this.prompter.askNonEmpty("Customer name: ");
    const customer = this.store.customerService.create(name);
    this.store.setActiveCustomer(customer);
    this.prompter.write(`Created customer ${customer.id} "${customer.name}" and made them active.\n`);
  }

  private async switchActiveCustomer(): Promise<void> {
    const customers = this.store.customerService.listAll();
    this.prompter.write(customers.map((customer, index) => formatCustomerSummary(customer, index)).join("\n") + "\n");
    const answer = await this.prompter.askNonEmpty("Enter customer number or id: ");
    const customer = resolveByNumberOrId(customers, answer, (candidate) => candidate.id);
    if (!customer) {
      this.prompter.write(`Customer "${answer}" not found.\n`);
      return;
    }
    this.store.setActiveCustomer(customer);
    this.prompter.write(`Active customer is now ${customer.id} "${customer.name}".\n`);
  }

  private async viewCustomerInfo(): Promise<void> {
    const customers = this.store.customerService.listAll();
    this.prompter.write(customers.map((customer, index) => formatCustomerSummary(customer, index)).join("\n") + "\n");
    const answer = await this.prompter.askNonEmpty("Enter customer number or id: ");
    const customer = resolveByNumberOrId(customers, answer, (candidate) => candidate.id);
    if (!customer) {
      this.prompter.write(`Customer "${answer}" not found.\n`);
      return;
    }
    this.prompter.write(formatCustomerDetails(customer) + "\n");
  }

  private async viewOrderHistory(): Promise<void> {
    const customers = this.store.customerService.listAll();
    this.prompter.write(customers.map((customer, index) => formatCustomerSummary(customer, index)).join("\n") + "\n");
    const answer = await this.prompter.askNonEmpty("Enter customer number or id: ");
    const customer = resolveByNumberOrId(customers, answer, (candidate) => candidate.id);
    if (!customer) {
      this.prompter.write(`Customer "${answer}" not found.\n`);
      return;
    }
    if (customer.orders.length === 0) {
      this.prompter.write("No orders yet.\n");
      return;
    }
    this.prompter.write(customer.orders.map((order, index) => formatOrderSummary(order, index)).join("\n") + "\n");
  }
}
