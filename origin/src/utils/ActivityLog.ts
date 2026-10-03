/**
 * Журнал событий приложения. Сервисы дописывают в него записи о значимых
 * действиях ("Order O-1001 created", "Restocked Azul +5" и т.п.).
 * spec: Уточнения п. 2.
 */
export interface ActivityLogEntry {
  readonly message: string;
  readonly at: Date;
}

export class ActivityLog {
  private readonly entries: ActivityLogEntry[] = [];

  /** Добавляет запись в журнал с текущей отметкой времени. */
  record(message: string): void {
    this.entries.push({ message, at: new Date() });
  }

  /** Возвращает все записи журнала в порядке добавления. */
  getEntries(): readonly ActivityLogEntry[] {
    return this.entries;
  }
}
