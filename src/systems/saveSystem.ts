import { BOARD_SIZE, GAME_CONFIG, PRODUCER_SLOT } from "../config/gameConfig";
import { createInitialOrders } from "../data/orderData";
import { isCustomerId, isItemFamily, isItemLevel, isSpecialVisitorId, type BoardItem, type BoardState, type ItemLevel, type Order, type SaveGame, type SpecialOrder } from "../types/game";
import { createEmptyBoard } from "./boardSystem";

export const SAVE_KEY = GAME_CONFIG.save.key;
export const SAVE_VERSION = GAME_CONFIG.save.version;

export function createDefaultSaveGame(): SaveGame {
  return {
    version: SAVE_VERSION,
    coins: 0,
    lifetimeCoins: 0,
    studioLevel: 1,
    activeFamily: "drawing",
    board: createEmptyBoard(),
    discoveries: [],
    orders: createInitialOrders(),
    orderSequence: 3,
    regularOrdersCompleted: 0,
    specialOrderSequence: 0,
    nextSpecialOrderAt: GAME_CONFIG.specialVisit.everyRegularOrders,
    specialOrder: null,
    masterpieceOrderSequence: 0,
    masterpieceOrder: null,
    buildings: { drawingStudioStage: 0 }
  };
}

export function serializeSaveGame(save: SaveGame): string {
  return JSON.stringify({ ...save, version: SAVE_VERSION });
}

export function deserializeSaveGame(raw: string | null): SaveGame {
  if (!raw) {
    return createDefaultSaveGame();
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return migrateSaveGame(parsed);
  } catch {
    return createDefaultSaveGame();
  }
}

export function loadSaveGame(storage: Storage | undefined = getStorage("localStorage")): SaveGame {
  if (!storage) {
    return createDefaultSaveGame();
  }
  return deserializeSaveGame(storage.getItem(SAVE_KEY));
}

export function persistSaveGame(save: SaveGame, storage: Storage | undefined = getStorage("localStorage")): void {
  storage?.setItem(SAVE_KEY, serializeSaveGame(save));
}

function migrateSaveGame(value: unknown): SaveGame {
  if (!isRecord(value)) {
    return createDefaultSaveGame();
  }
  const defaults = createDefaultSaveGame();
  const stage = value.buildings && isRecord(value.buildings) && value.buildings.drawingStudioStage === 1 ? 1 : 0;
  return {
    version: SAVE_VERSION,
    coins: typeof value.coins === "number" && Number.isFinite(value.coins) && value.coins >= 0 ? Math.floor(value.coins) : defaults.coins,
    lifetimeCoins: normaliseNonNegativeInteger(value.lifetimeCoins, 0),
    studioLevel: value.studioLevel === 2 || value.studioLevel === 3 ? value.studioLevel : 1,
    activeFamily: isItemFamily(value.activeFamily) ? value.activeFamily : "drawing",
    board: normaliseBoard(value.board),
    discoveries: normaliseDiscoveries(value.discoveries),
    orders: normaliseOrders(value.orders, defaults.orders),
    orderSequence: typeof value.orderSequence === "number" && Number.isInteger(value.orderSequence) && value.orderSequence >= 3 ? value.orderSequence : defaults.orderSequence,
    regularOrdersCompleted: normaliseNonNegativeInteger(value.regularOrdersCompleted, defaults.regularOrdersCompleted),
    specialOrderSequence: normaliseNonNegativeInteger(value.specialOrderSequence, defaults.specialOrderSequence),
    nextSpecialOrderAt: normalisePositiveInteger(value.nextSpecialOrderAt, defaults.nextSpecialOrderAt),
    specialOrder: normaliseSpecialOrder(value.specialOrder),
    masterpieceOrderSequence: normaliseNonNegativeInteger(value.masterpieceOrderSequence, 0),
    masterpieceOrder: null,
    buildings: { drawingStudioStage: stage }
  };
}

function normaliseNonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : fallback;
}

function normalisePositiveInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 ? value : fallback;
}

function normaliseSpecialOrder(value: unknown): SpecialOrder | null {
  if (!isRecord(value) || typeof value.id !== "string" || !isSpecialVisitorId(value.visitor) || !isItemLevel(value.requestedLevel)) {
    return null;
  }
  if (value.requestedLevel < 5 || value.requestedLevel > 6 || typeof value.expiresAt !== "number" || !Number.isFinite(value.expiresAt)) {
    return null;
  }
  const bonusItemLevels = Array.isArray(value.bonusItemLevels) ? value.bonusItemLevels.filter(isItemLevel).slice(0, 4) : [];
  if (bonusItemLevels.length === 0) {
    return null;
  }
  return {
    id: value.id.slice(0, 100), visitor: value.visitor, family: isItemFamily(value.family) ? value.family : "drawing", requestedLevel: value.requestedLevel,
    quantity: normalisePositiveInteger(value.quantity, 1),
    coinReward: normaliseNonNegativeInteger(value.coinReward, 0), bonusItemLevels, expiresAt: value.expiresAt
  };
}

function normaliseBoard(value: unknown): BoardState {
  const board = createEmptyBoard();
  if (!Array.isArray(value)) {
    return board;
  }
  for (let index = 0; index < Math.min(value.length, BOARD_SIZE); index += 1) {
    if (index === PRODUCER_SLOT) {
      continue;
    }
    const item = normaliseBoardItem(value[index]);
    board[index] = item;
  }
  return board;
}

function normaliseBoardItem(value: unknown): BoardItem | null {
  if (!isRecord(value) || !isItemLevel(value.level) || typeof value.id !== "string") {
    return null;
  }
  return {
    id: value.id.slice(0, 100),
    family: isItemFamily(value.family) ? value.family : "drawing",
    level: value.level,
    createdAt: typeof value.createdAt === "number" && Number.isFinite(value.createdAt) ? value.createdAt : Date.now()
  };
}

function normaliseDiscoveries(value: unknown): ItemLevel[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return Array.from(new Set(value.filter(isItemLevel))).sort((a, b) => a - b);
}

function normaliseOrders(value: unknown, fallback: Order[]): Order[] {
  if (!Array.isArray(value) || value.length !== 3) {
    return fallback;
  }
  const orders = value.map((entry) => {
    if (!isRecord(entry) || typeof entry.id !== "string" || !isCustomerId(entry.customer) || !isItemLevel(entry.requestedLevel)) {
      return null;
    }
    if (entry.requestedLevel < 2 || entry.requestedLevel > 6) {
      return null;
    }
    return {
      id: entry.id.slice(0, 100),
      customer: entry.customer,
      family: isItemFamily(entry.family) ? entry.family : "drawing",
      requestedLevel: entry.requestedLevel,
      quantity: typeof entry.quantity === "number" && entry.quantity > 0 ? Math.min(3, Math.floor(entry.quantity)) : 1,
      reward: typeof entry.reward === "number" && entry.reward >= 0 ? Math.floor(entry.reward) : 0
    } satisfies Order;
  });
  return orders.every((order): order is Order => Boolean(order)) ? orders : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStorage(kind: "localStorage" | "sessionStorage"): Storage | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  try {
    return window[kind];
  } catch {
    return undefined;
  }
}
