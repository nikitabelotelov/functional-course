/**
 * Генератор идентификаторов с префиксами. Хранит отдельный счётчик для
 * каждого префикса и доступен сервисам как общая зависимость.
 * spec: Уточнения п. 2 — генерация id через общий объект-генератор.
 */
export class IdGenerator {
  private readonly counters = new Map<string, number>();

  /** Возвращает следующий id вида "PREFIX-N", например "G-1", "C-1", "O-1001". */
  next(prefix: string, startFrom = 1): string {
    const current = this.counters.get(prefix) ?? startFrom - 1;
    const value = current + 1;
    this.counters.set(prefix, value);
    return `${prefix}-${value}`;
  }
}
