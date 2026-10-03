import type { BoardGame } from "../domain/BoardGame.js";
import type { Customer } from "../domain/Customer.js";
import type { InventoryItem } from "../domain/InventoryItem.js";
import type { Order } from "../domain/Order.js";
import type { ActivityLogEntry } from "../utils/ActivityLog.js";
import type { Promotion } from "../promotions/Promotion.js";
import type { PriceBreakdown } from "../services/PricingService.js";
import { formatMoney } from "../utils/money.js";

/** Форматирует список игр как пронумерованную таблицу для выбора по номеру или id. */
export function formatGameList(games: readonly BoardGame[]): string {
  if (games.length === 0) {
    return "(no games found)";
  }
  return games
    .map((game, index) => {
      const flag = game.active ? "" : " [inactive]";
      return `${index + 1}. ${game.id} "${game.name}" — ${game.category} — ${formatMoney(game.price)} — ${game.minPlayers}-${game.maxPlayers} players${flag}`;
    })
    .join("\n");
}

/** Подробная карточка одной игры. */
export function formatGameDetails(game: BoardGame, inventoryItem?: InventoryItem): string {
  const lines = [
    `${game.id} "${game.name}"${game.active ? "" : " [inactive]"}`,
    game.description,
    `Category: ${game.category}`,
    `Price: ${formatMoney(game.price)}`,
    `Players: ${game.minPlayers}-${game.maxPlayers}, age ${game.minAge}+`,
    `Play time: ~${game.playTimeMinutes} min`,
    `Publisher: ${game.publisher}`,
  ];
  if (inventoryItem) {
    lines.push(`In stock: ${inventoryItem.getAvailableQuantity()} (reserved: ${inventoryItem.getReservedQuantity()})`);
  }
  return lines.join("\n");
}

/** Таблица складских остатков. */
export function formatInventoryList(items: readonly InventoryItem[]): string {
  if (items.length === 0) {
    return "(no inventory records)";
  }
  return items
    .map(
      (item, index) =>
        `${index + 1}. ${item.product.id} "${item.product.name}" — available: ${item.getAvailableQuantity()}, reserved: ${item.getReservedQuantity()}`,
    )
    .join("\n");
}

/** Разбивка стоимости корзины: позиции, скидки, доставка, баллы, итог. */
export function formatPriceBreakdown(breakdown: PriceBreakdown): string {
  const lines: string[] = [];
  for (const line of breakdown.items) {
    const discountNote = line.discount > 0 ? ` (-${formatMoney(line.discount)}, ${line.promotionName})` : "";
    lines.push(
      `${line.item.game.name} x${line.item.quantity} @ ${formatMoney(line.unitPrice)} = ${formatMoney(line.lineTotal)}${discountNote}`,
    );
  }
  lines.push(`Subtotal: ${formatMoney(breakdown.subtotal)}`);
  lines.push(`Item discounts: -${formatMoney(breakdown.itemDiscountTotal)}`);
  if (breakdown.appliedPromotions.length > 0) {
    for (const applied of breakdown.appliedPromotions) {
      lines.push(`Order discount "${applied.name}": -${formatMoney(applied.amount)}`);
    }
  }
  lines.push(`Order discount reason: ${breakdown.orderDiscountReason}`);
  lines.push(`Amount after discounts: ${formatMoney(breakdown.amountAfterDiscounts)}`);
  lines.push(`Delivery: ${formatMoney(breakdown.deliveryCost)}`);
  if (breakdown.pointsSpent > 0) {
    lines.push(`Points spent: ${breakdown.pointsSpent} (-${formatMoney(breakdown.pointsValue)})`);
  }
  lines.push(`Total: ${formatMoney(breakdown.total)}`);
  return lines.join("\n");
}

/** Короткая строка заказа для списков. */
export function formatOrderSummary(order: Order, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : "";
  return `${prefix}${order.id} — ${order.status} — ${formatMoney(order.total)} — created ${order.createdAt.toISOString()}`;
}

/** Подробности заказа: позиции, скидки, статус, история статусов. */
export function formatOrderDetails(order: Order): string {
  const lines = [`${order.id} — status: ${order.status}`, `Customer: ${order.customer.id} "${order.customer.name}"`];
  for (const item of order.items) {
    lines.push(
      `  ${item.game.name} x${item.quantity} @ ${formatMoney(item.unitPrice)} = ${formatMoney(item.lineTotal)} (discount ${formatMoney(item.discount)})`,
    );
  }
  lines.push(`Subtotal: ${formatMoney(order.subtotal)}`);
  lines.push(`Item discounts: -${formatMoney(order.itemDiscountTotal)}`);
  lines.push(`Order discounts: -${formatMoney(order.orderDiscountTotal)}`);
  for (const applied of order.appliedPromotions) {
    lines.push(`  Promotion "${applied.name}": -${formatMoney(applied.amount)}`);
  }
  lines.push(`Delivery: ${formatMoney(order.deliveryCost)}`);
  if (order.pointsSpent > 0) {
    lines.push(`Points spent: ${order.pointsSpent}`);
  }
  lines.push(`Total: ${formatMoney(order.total)}`);
  lines.push("Status history:");
  for (const entry of order.getStatusHistory()) {
    lines.push(`  ${entry.status} at ${entry.at.toISOString()}`);
  }
  return lines.join("\n");
}

/** Короткая строка клиента для списков. */
export function formatCustomerSummary(customer: Customer, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : "";
  return `${prefix}${customer.id} "${customer.name}" — ${customer.loyaltyLevel}`;
}

/** Подробная информация о клиенте: уровень, баллы, totalSpent. */
export function formatCustomerDetails(customer: Customer): string {
  return [
    `${customer.id} "${customer.name}"`,
    `Loyalty level: ${customer.loyaltyLevel}`,
    `Points: ${customer.points}`,
    `Total spent (completed orders): ${formatMoney(customer.totalSpent)}`,
    `Orders placed: ${customer.orders.length}`,
  ].join("\n");
}

/** Короткая строка акции для списков. */
export function formatPromotionSummary(promotion: Promotion, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : "";
  const status = promotion.isActiveNow() ? "active" : "inactive";
  return `${prefix}${promotion.id} "${promotion.name}" (${status}) — ${promotion.description}`;
}

/** Журнал событий в хронологическом порядке. */
export function formatActivityLog(entries: readonly ActivityLogEntry[]): string {
  if (entries.length === 0) {
    return "(activity log is empty)";
  }
  return entries.map((entry) => `[${entry.at.toISOString()}] ${entry.message}`).join("\n");
}
