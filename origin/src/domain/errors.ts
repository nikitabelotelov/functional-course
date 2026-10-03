/**
 * Базовый класс ошибок бизнес-правил. Сервисы сообщают о нарушении правил
 * исключениями — наследниками DomainError, а не через консоль.
 * spec: Уточнения п. 2.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Недостаточно товара на складе для выполнения операции. */
export class OutOfStockError extends DomainError {}

/** Запрошен недопустимый переход статуса заказа. */
export class InvalidStatusTransitionError extends DomainError {}

/** Сущность не найдена (игра, клиент, заказ, акция и т.п.). */
export class NotFoundError extends DomainError {}

/** Попытка выполнить действие с неактивной игрой (добавить в корзину и т.п.). */
export class InactiveGameError extends DomainError {}

/** Переданы некорректные входные данные (количество, сумма и т.п.). */
export class InvalidArgumentError extends DomainError {}

/** Ошибка, связанная с промокодом (не найден, не активен, исчерпан). */
export class PromoCodeError extends DomainError {}
