import { Customer } from "../domain/Customer.js";
import { LoyaltyLevel } from "../domain/enums.js";
import { NotFoundError } from "../domain/errors.js";
import type { ActivityLog } from "../utils/ActivityLog.js";
import type { IdGenerator } from "../utils/IdGenerator.js";

export interface NewCustomerProps {
  readonly loyaltyLevel?: LoyaltyLevel;
  readonly points?: number;
  readonly totalSpent?: number;
}

/** Отвечает за реестр покупателей. */
export class CustomerService {
  private readonly customers: Customer[] = [];

  constructor(
    private readonly idGenerator: IdGenerator,
    private readonly activityLog: ActivityLog,
  ) {}

  /** Создаёт нового покупателя со сгенерированным id. */
  create(name: string, props: NewCustomerProps = {}): Customer {
    const customer = new Customer({ id: this.idGenerator.next("C"), name, ...props });
    this.customers.push(customer);
    this.activityLog.record(`Customer ${customer.id} "${customer.name}" created`);
    return customer;
  }

  listAll(): readonly Customer[] {
    return this.customers;
  }

  getById(id: string): Customer {
    const customer = this.customers.find((candidate) => candidate.id === id);
    if (!customer) {
      throw new NotFoundError(`Customer with id "${id}" not found`);
    }
    return customer;
  }
}
