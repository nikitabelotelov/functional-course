import type { Store } from "../Store.js";
import { DomainError } from "../domain/errors.js";
import { EndOfInputError, Prompter } from "./Prompter.js";
import type { InputSource, OutputSink } from "./io.js";
import { formatActivityLog, formatOrderDetails, formatOrderSummary, formatPriceBreakdown } from "./format.js";
import { CartMenu } from "./menus/CartMenu.js";
import { CatalogAdminMenu } from "./menus/CatalogAdminMenu.js";
import { CatalogMenu } from "./menus/CatalogMenu.js";
import { CustomersMenu } from "./menus/CustomersMenu.js";
import { InventoryMenu } from "./menus/InventoryMenu.js";
import { OrdersAdminMenu } from "./menus/OrdersAdminMenu.js";
import { PromotionsMenu } from "./menus/PromotionsMenu.js";

const MAIN_MENU_CHOICES = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

export interface StoreCliOptions {
  /** true для реального интерактивного терминала (TTY), по умолчанию false (эхо включено). */
  readonly interactive?: boolean;
}

/**
 * Главное CLI-приложение магазина настольных игр. Получает Store и
 * абстракции ввода-вывода через конструктор. spec: Уточнения п. 15.6.
 */
export class StoreCli {
  private readonly prompter: Prompter;
  private readonly catalogMenu: CatalogMenu;
  private readonly cartMenu: CartMenu;
  private readonly customersMenu: CustomersMenu;
  private readonly inventoryMenu: InventoryMenu;
  private readonly catalogAdminMenu: CatalogAdminMenu;
  private readonly promotionsMenu: PromotionsMenu;
  private readonly ordersAdminMenu: OrdersAdminMenu;

  constructor(
    private readonly store: Store,
    input: InputSource,
    output: OutputSink,
    options: StoreCliOptions = {},
  ) {
    this.prompter = new Prompter(input, output, !options.interactive);
    this.catalogMenu = new CatalogMenu(store, this.prompter);
    this.cartMenu = new CartMenu(store, this.prompter);
    this.customersMenu = new CustomersMenu(store, this.prompter);
    this.inventoryMenu = new InventoryMenu(store, this.prompter);
    this.catalogAdminMenu = new CatalogAdminMenu(store, this.prompter);
    this.promotionsMenu = new PromotionsMenu(store, this.prompter);
    this.ordersAdminMenu = new OrdersAdminMenu(store, this.prompter);
  }

  /** Запускает главный цикл меню до выбора выхода или конца ввода. */
  async run(): Promise<void> {
    this.prompter.write("=== Board Game Store ===\n");
    try {
      while (true) {
        this.printMainMenu();
        const choice = await this.prompter.askChoice("> ", MAIN_MENU_CHOICES);
        try {
          const shouldExit = await this.handleMainMenuChoice(choice);
          if (shouldExit) {
            return;
          }
        } catch (error) {
          if (error instanceof DomainError) {
            this.prompter.write(`Error: ${error.message}\n`);
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      if (error instanceof EndOfInputError) {
        this.prompter.write("\nInput ended. Exiting.\n");
        return;
      }
      throw error;
    }
  }

  private printMainMenu(): void {
    const customer = this.store.getActiveCustomerOrNull();
    const customerLine = customer ? `${customer.id} "${customer.name}"` : "(none selected)";
    this.prompter.write(
      `\nActive customer: ${customerLine}\n` +
        "1. Catalog\n" +
        "2. Cart\n" +
        "3. Checkout\n" +
        "4. My orders\n" +
        "5. Customers\n" +
        "6. Inventory management\n" +
        "7. Catalog management\n" +
        "8. Promotions\n" +
        "9. Orders management\n" +
        "10. Activity log\n" +
        "0. Exit\n",
    );
  }

  /** Возвращает true, если нужно завершить программу. */
  private async handleMainMenuChoice(choice: string): Promise<boolean> {
    switch (choice) {
      case "1":
        await this.catalogMenu.run();
        return false;
      case "2":
        await this.cartMenu.run();
        return false;
      case "3":
        await this.checkout();
        return false;
      case "4":
        this.showMyOrders();
        return false;
      case "5":
        await this.customersMenu.run();
        return false;
      case "6":
        await this.inventoryMenu.run();
        return false;
      case "7":
        await this.catalogAdminMenu.run();
        return false;
      case "8":
        await this.promotionsMenu.run();
        return false;
      case "9":
        await this.ordersAdminMenu.run();
        return false;
      case "10":
        this.prompter.write(formatActivityLog(this.store.activityLog.getEntries()) + "\n");
        return false;
      default:
        this.prompter.write("Goodbye!\n");
        return true;
    }
  }

  private showMyOrders(): void {
    const customer = this.store.getActiveCustomer();
    if (customer.orders.length === 0) {
      this.prompter.write("You have no orders yet.\n");
      return;
    }
    this.prompter.write(customer.orders.map((order, index) => formatOrderSummary(order, index)).join("\n") + "\n");
  }

  /**
   * Оформление заказа: показывает предварительную разбивку, спрашивает про
   * баллы, показывает итог и запрашивает подтверждение. spec: Уточнения п. 11.
   */
  private async checkout(): Promise<void> {
    const customer = this.store.getActiveCustomer();
    if (customer.cart.isEmpty()) {
      this.prompter.write("Your cart is empty.\n");
      return;
    }

    const preview = this.store.pricingService.calculate(customer.cart, customer, 0);
    this.prompter.write(formatPriceBreakdown(preview) + "\n");

    let pointsToSpend = 0;
    if (preview.maxPointsUsable > 0) {
      pointsToSpend = await this.prompter.askInt(
        `How many points to spend (0-${preview.maxPointsUsable}, balance ${customer.points})? `,
        { min: 0, max: preview.maxPointsUsable },
      );
    }

    const finalBreakdown =
      pointsToSpend > 0 ? this.store.pricingService.calculate(customer.cart, customer, pointsToSpend) : preview;
    if (pointsToSpend > 0) {
      this.prompter.write(formatPriceBreakdown(finalBreakdown) + "\n");
    }

    const confirmed = await this.prompter.askYesNo("Confirm checkout? (y/n): ");
    if (!confirmed) {
      this.prompter.write("Checkout cancelled.\n");
      return;
    }

    const order = this.store.checkoutService.checkout(customer, pointsToSpend);
    this.prompter.write(`Order placed!\n${formatOrderDetails(order)}\n`);
  }
}
