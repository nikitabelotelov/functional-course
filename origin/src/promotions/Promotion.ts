export interface PromotionProps {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly active?: boolean;
  readonly validFrom?: Date;
  readonly validTo?: Date;
}

/**
 * Акция или правило скидки. Общая часть для позиционных (ItemPromotion) и
 * заказовых (OrderPromotion) акций. spec: Уточнения п. 7.
 */
export abstract class Promotion {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  active: boolean;
  validFrom?: Date;
  validTo?: Date;

  protected constructor(props: PromotionProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.active = props.active ?? true;
    this.validFrom = props.validFrom;
    this.validTo = props.validTo;
  }

  /**
   * Акция применима, только если active === true и текущая дата попадает
   * в [validFrom, validTo]. spec: Уточнения п. 7.3 — использует new Date().
   */
  isActiveNow(): boolean {
    if (!this.active) {
      return false;
    }
    const now = new Date();
    if (this.validFrom && now < this.validFrom) {
      return false;
    }
    if (this.validTo && now > this.validTo) {
      return false;
    }
    return true;
  }
}
