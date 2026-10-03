import type { Customer } from "./domain/Customer.js";
import { NotFoundError } from "./domain/errors.js";
import { ActivityLog } from "./utils/ActivityLog.js";
import { IdGenerator } from "./utils/IdGenerator.js";
import { CatalogService } from "./services/CatalogService.js";
import { CheckoutService } from "./services/CheckoutService.js";
import { CustomerService } from "./services/CustomerService.js";
import { DeliveryService } from "./services/DeliveryService.js";
import { InventoryService } from "./services/InventoryService.js";
import { PricingService } from "./services/PricingService.js";
import { PromotionService } from "./services/PromotionService.js";

/**
 * Единое место сборки зависимостей магазина и состояния сессии — активного
 * покупателя. spec: Уточнения п. 2, 13.
 */
export class Store {
  readonly idGenerator = new IdGenerator();
  readonly activityLog = new ActivityLog();

  readonly catalogService: CatalogService;
  readonly inventoryService: InventoryService;
  readonly customerService: CustomerService;
  readonly promotionService: PromotionService;
  readonly deliveryService: DeliveryService;
  readonly pricingService: PricingService;
  readonly checkoutService: CheckoutService;

  /** Активный покупатель текущей CLI-сессии. spec: Уточнения п. 2. */
  private activeCustomer: Customer | null = null;

  constructor() {
    this.catalogService = new CatalogService(this.idGenerator, this.activityLog);
    this.inventoryService = new InventoryService(this.activityLog);
    this.customerService = new CustomerService(this.idGenerator, this.activityLog);
    this.promotionService = new PromotionService(this.activityLog);
    this.deliveryService = new DeliveryService();
    this.pricingService = new PricingService(this.promotionService, this.deliveryService);
    this.checkoutService = new CheckoutService(
      this.inventoryService,
      this.pricingService,
      this.promotionService,
      this.idGenerator,
      this.activityLog,
    );
  }

  getActiveCustomer(): Customer {
    if (!this.activeCustomer) {
      throw new NotFoundError("No active customer is selected");
    }
    return this.activeCustomer;
  }

  getActiveCustomerOrNull(): Customer | null {
    return this.activeCustomer;
  }

  setActiveCustomer(customer: Customer): void {
    this.activeCustomer = customer;
    this.activityLog.record(`Active customer switched to ${customer.id} "${customer.name}"`);
  }
}

/** Фабрика магазина со всеми сервисами, но без тестовых данных. */
export function createStore(): Store {
  return new Store();
}
