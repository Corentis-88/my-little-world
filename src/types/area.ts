import type { BoardState, Order } from "./game";
import type { TownAreaId } from "./content";

export type AreaProgress = {
  unlocked: boolean;
  board: BoardState;
  producerSlot: number;
  completedOrders: number;
  orders: Order[];
  orderSequence: number;
};

export type AreaProgressMap = Record<TownAreaId, AreaProgress>;
