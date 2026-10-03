/**
 * Утилиты для работы с деньгами. Суммы хранятся в целых копейках (number),
 * валюта — рубли. spec: Уточнения п. 3.
 */

/** Форматирует сумму в копейках в строку вида "3 990.00 ₽". */
export function formatMoney(amountInKopecks: number): string {
  const rubles = Math.trunc(amountInKopecks / 100);
  const kopecks = Math.abs(amountInKopecks % 100);
  const rublesStr = formatWithThousandsSeparator(rubles);
  return `${rublesStr}.${kopecks.toString().padStart(2, "0")} ₽`;
}

/** Группирует цифры по 3 разряда с неразрывным пробелом в качестве разделителя. */
function formatWithThousandsSeparator(value: number): string {
  const negative = value < 0;
  const digits = Math.abs(value).toString();
  const groups: string[] = [];
  for (let i = digits.length; i > 0; i -= 3) {
    groups.unshift(digits.slice(Math.max(0, i - 3), i));
  }
  return (negative ? "-" : "") + groups.join(" ");
}

/**
 * Вычисляет процент от суммы (в копейках) и округляет до целой копейки.
 * spec: Уточнения п. 3 — округление Math.round в момент вычисления скидки.
 */
export function percentOf(amountInKopecks: number, percent: number): number {
  return Math.round((amountInKopecks * percent) / 100);
}
