/**
 * Находит элемент списка по порядковому номеру (как он был напечатан) или
 * по его id. spec: Уточнения п. 15.8 — выбор по номеру в списке или по id.
 */
export function resolveByNumberOrId<T>(
  items: readonly T[],
  answer: string,
  getId: (item: T) => string,
): T | undefined {
  const asNumber = Number(answer);
  if (Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= items.length) {
    return items[asNumber - 1];
  }
  return items.find((item) => getId(item) === answer);
}
