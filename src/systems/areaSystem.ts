import { TOWN_AREAS } from "../data/buildingData";
import type { TownAreaId } from "../types/content";
import type { AreaProgress, AreaProgressMap } from "../types/area";
import { createEmptyBoard } from "./boardSystem";
import { createInitialOrders } from "../data/orderData";

export function createAreaProgressMap(): AreaProgressMap {
  return Object.fromEntries(TOWN_AREAS.map((area) => [area.id, createAreaProgress(area.id === "drawing-studio")])) as AreaProgressMap;
}

export function createAreaProgress(unlocked = false): AreaProgress {
  return { unlocked, board: createEmptyBoard(), completedOrders: 0, orders: createInitialOrders(), orderSequence: 3 };
}

export function isAreaUnlocked(id: TownAreaId, lifetimeCoins: number, villageLevel: number): boolean {
  const area = TOWN_AREAS.find((entry) => entry.id === id);
  const earnedVillageLevel = Math.max(villageLevel, Math.floor(lifetimeCoins / 500) + 1);
  return Boolean(area && earnedVillageLevel >= area.unlock.villageLevel && lifetimeCoins >= area.unlock.lifetimeCoins);
}
