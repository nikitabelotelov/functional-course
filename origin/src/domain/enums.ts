/** Категории настольных игр. */
export enum Category {
  Strategy = "Strategy",
  Family = "Family",
  Party = "Party",
  Cooperative = "Cooperative",
  CardGame = "CardGame",
  Abstract = "Abstract",
  Wargame = "Wargame",
}

/** Уровень лояльности клиента. spec: Уточнения п. 9. */
export enum LoyaltyLevel {
  Regular = "Regular",
  Silver = "Silver",
  Gold = "Gold",
}

/** Статус заказа. spec: Уточнения п. 5. */
export enum OrderStatus {
  Created = "Created",
  Confirmed = "Confirmed",
  Paid = "Paid",
  Shipped = "Shipped",
  Completed = "Completed",
  Cancelled = "Cancelled",
}
