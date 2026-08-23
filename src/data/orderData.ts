import { GAME_CONFIG } from "../config/gameConfig";
import type { CustomerDefinition, SpecialVisitorDefinition } from "../types/game";
import type { CustomerId, ItemFamily, ItemLevel, Order, SpecialOrder, SpecialVisitorId } from "../types/game";

export const CUSTOMERS = [
  { id: "mia", name: "Mia", portrait: "portrait-mia.svg", greeting: "Something sunny, please?", accent: "#d77962" },
  { id: "leo", name: "Leo", portrait: "portrait-leo.svg", greeting: "I have an idea...", accent: "#6f9992" },
  { id: "ivy", name: "Ivy", portrait: "portrait-ivy.svg", greeting: "A little wonder for my windowsill.", accent: "#7da06f" }
] as const satisfies readonly CustomerDefinition[];

export const SPECIAL_VISITORS = [
  { id: "margo", name: "Margo Bell", portrait: "portrait-margo.svg", greeting: "I am collecting little works with a lot of heart.", accent: "#b27a91" }
] as const satisfies readonly SpecialVisitorDefinition[];

export const REWARD_BY_LEVEL: Record<2 | 3 | 4 | 5 | 6, number> = {
  2: 15,
  3: 25,
  4: 45,
  5: 80,
  6: 150
};

const ORDER_LEVEL_PLAN: readonly (2 | 3 | 4 | 5 | 6)[] = [2, 3, 2, 3, 4, 2, 4, 3, 5, 2, 5, 4, 6, 3, 5, 6];

export function customerById(id: CustomerId): CustomerDefinition {
  const customer = CUSTOMERS.find((entry) => entry.id === id);
  if (!customer) {
    return {
      id: "mia",
      name: "Mia",
      portrait: "portrait-mia.svg",
      greeting: "Something sunny, please?",
      accent: "#d77962"
    };
  }
  return customer;
}

export function specialVisitorById(id: SpecialVisitorId): SpecialVisitorDefinition {
  return SPECIAL_VISITORS.find((visitor) => visitor.id === id) ?? SPECIAL_VISITORS[0];
}

export function createInitialOrders(): Order[] {
  return [
    createOrder("order-1", "mia", 2),
    createOrder("order-2", "leo", 3),
    createOrder("order-3", "ivy", 2)
  ];
}

export function createReplacementOrder(sequence: number, active: readonly Order[], families: readonly ItemFamily[] = ["drawing"]): Order {
  const customer = CUSTOMERS[sequence % CUSTOMERS.length];
  const plannedLevel = ORDER_LEVEL_PLAN[sequence % ORDER_LEVEL_PLAN.length] ?? 2;
  const occupiedLevels = new Set(active.map((order) => order.requestedLevel));
  const fallbackLevels: (2 | 3 | 4 | 5 | 6)[] = [2, 3, 4, 5, 6];
  const level = occupiedLevels.has(plannedLevel)
    ? (fallbackLevels.find((candidate) => !occupiedLevels.has(candidate)) ?? plannedLevel)
    : plannedLevel;
  return createOrder(`order-${sequence + 1}`, customer?.id ?? "mia", level, families[sequence % families.length] ?? "drawing");
}

export function createSpecialOrder(sequence: number, restored: boolean, familyOrNow: ItemFamily | number = "drawing", maybeNow = Date.now()): SpecialOrder {
  const family = typeof familyOrNow === "string" ? familyOrNow : "drawing";
  const now = typeof familyOrNow === "number" ? familyOrNow : maybeNow;
  const requestedLevel: ItemLevel = restored || sequence % 2 === 1 ? 6 : 5;
  const bonusItemLevels: ItemLevel[] = requestedLevel === 5 ? [2, 2, 3] : [3, 3, 4];
  return {
    id: `visitor-${sequence + 1}`,
    visitor: "margo",
    family,
    requestedLevel,
    quantity: 1,
    coinReward: requestedLevel === 5 ? 140 : 240,
    bonusItemLevels,
    expiresAt: now + GAME_CONFIG.specialVisit.durationMs
  };
}

function createOrder(id: string, customer: CustomerId, requestedLevel: 2 | 3 | 4 | 5 | 6, family: ItemFamily = "drawing"): Order {
  return {
    id,
    customer,
    family,
    requestedLevel: requestedLevel as ItemLevel,
    quantity: 1,
    reward: REWARD_BY_LEVEL[requestedLevel]
  };
}
