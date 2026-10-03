import type { Store } from "../../Store.js";
import type { Prompter } from "../Prompter.js";
import { formatPriceBreakdown, formatPromotionSummary } from "../format.js";

/** Подменю акций: активные акции, промокоды, применённые к корзине скидки. */
export class PromotionsMenu {
  constructor(
    private readonly store: Store,
    private readonly prompter: Prompter,
  ) {}

  async run(): Promise<void> {
    while (true) {
      this.prompter.write(
        "\n=== Promotions ===\n1. Show active promotions\n2. Apply promo code to cart\n3. Preview discounts applied to cart\n0. Back\n",
      );
      const choice = await this.prompter.askChoice("> ", ["0", "1", "2", "3"]);
      if (choice === "1") this.showActive();
      else if (choice === "2") await this.applyPromoCode();
      else if (choice === "3") this.previewDiscounts();
      else return;
    }
  }

  private showActive(): void {
    const promotions = this.store.promotionService.listActive();
    if (promotions.length === 0) {
      this.prompter.write("No active promotions.\n");
      return;
    }
    this.prompter.write(promotions.map((promotion, index) => formatPromotionSummary(promotion, index)).join("\n") + "\n");
  }

  private async applyPromoCode(): Promise<void> {
    const customer = this.store.getActiveCustomer();
    const code = await this.prompter.askNonEmpty("Promo code: ");
    this.store.promotionService.applyPromoCode(customer.cart, code);
    this.prompter.write(`Promo code "${code}" applied to the cart.\n`);
  }

  private previewDiscounts(): void {
    const customer = this.store.getActiveCustomer();
    if (customer.cart.isEmpty()) {
      this.prompter.write("Your cart is empty.\n");
      return;
    }
    const breakdown = this.store.pricingService.calculate(customer.cart, customer);
    this.prompter.write(formatPriceBreakdown(breakdown) + "\n");
  }
}
