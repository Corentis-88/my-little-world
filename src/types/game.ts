export type ItemLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type ItemFamily = "drawing" | "collage" | "prints";

export const ITEM_LEVELS: readonly ItemLevel[] = [1, 2, 3, 4, 5, 6, 7];

export type BoardItem = {
  id: string;
  family: ItemFamily;
  level: ItemLevel;
  createdAt: number;
};

export type BoardSlot = BoardItem | null;
export type BoardState = BoardSlot[];

export type CustomerId = "mia" | "leo" | "ivy";
export type SpecialVisitorId = "margo";

export type CustomerDefinition = {
  id: CustomerId;
  name: string;
  portrait: string;
  greeting: string;
  accent: string;
};

export type Order = {
  id: string;
  customer: CustomerId;
  family: ItemFamily;
  requestedLevel: ItemLevel;
  quantity: number;
  reward: number;
};

export type SpecialVisitorDefinition = {
  id: SpecialVisitorId;
  name: string;
  portrait: string;
  greeting: string;
  accent: string;
};

export type SpecialOrder = {
  id: string;
  visitor: SpecialVisitorId;
  family: ItemFamily;
  requestedLevel: ItemLevel;
  quantity: number;
  coinReward: number;
  bonusItemLevels: ItemLevel[];
  expiresAt: number;
};

export type MasterpieceOrder = { id: string; family: ItemFamily; quantity: 2; reward: number };

export type BuildingState = {
  drawingStudioStage: 0 | 1;
};

export type SaveGame = {
  version: number;
  coins: number;
  lifetimeCoins: number;
  studioLevel: 1 | 2 | 3;
  activeFamily: ItemFamily;
  board: BoardState;
  discoveries: ItemLevel[];
  orders: Order[];
  orderSequence: number;
  regularOrdersCompleted: number;
  specialOrderSequence: number;
  nextSpecialOrderAt: number;
  specialOrder: SpecialOrder | null;
  masterpieceOrderSequence: number;
  masterpieceOrder: MasterpieceOrder | null;
  buildings: BuildingState;
};

export type BoardChangeMeta =
  | { kind: "produce"; producedLevel: ItemLevel; family: ItemFamily }
  | { kind: "move"; from: number; to: number }
  | { kind: "merge"; from: number; to: number; resultLevel: ItemLevel; family: ItemFamily };

export function isItemLevel(value: unknown): value is ItemLevel {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 7;
}

export function isItemFamily(value: unknown): value is ItemFamily {
  return value === "drawing" || value === "collage" || value === "prints";
}

export function isCustomerId(value: unknown): value is CustomerId {
  return value === "mia" || value === "leo" || value === "ivy";
}

export function isSpecialVisitorId(value: unknown): value is SpecialVisitorId {
  return value === "margo";
}
