import type { Category } from "./enums.js";

export interface BoardGameProps {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly category: Category;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly minAge: number;
  readonly playTimeMinutes: number;
  readonly publisher: string;
  readonly active: boolean;
}

/**
 * Настольная игра в каталоге. Существует в одном экземпляре на игру
 * (spec: Уточнения п. 1) — другие сущности хранят ссылку на этот же объект.
 */
export class BoardGame {
  readonly id: string;
  name: string;
  description: string;
  /** Текущая цена в копейках. */
  price: number;
  category: Category;
  minPlayers: number;
  maxPlayers: number;
  minAge: number;
  playTimeMinutes: number;
  publisher: string;
  active: boolean;

  constructor(props: BoardGameProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.price = props.price;
    this.category = props.category;
    this.minPlayers = props.minPlayers;
    this.maxPlayers = props.maxPlayers;
    this.minAge = props.minAge;
    this.playTimeMinutes = props.playTimeMinutes;
    this.publisher = props.publisher;
    this.active = props.active;
  }

  /** Поддерживает ли игра указанное число игроков. */
  supportsPlayerCount(players: number): boolean {
    return players >= this.minPlayers && players <= this.maxPlayers;
  }
}
