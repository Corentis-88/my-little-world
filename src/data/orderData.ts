import type { CustomerDefinition } from "../types/game";
import type { CustomerId, ItemLevel, Order } from "../types/game";

export const CUSTOMERS = [
  { id: "mia", name: "Mia", portrait: "portrait-mia.svg", greeting: "Something sunny, please?", accent: "#d77962" },
  { id: "leo", name: "Leo", portrait: "portrait-leo.svg", greeting: "I have an idea...", accent: "#6f9992" },
  { id: "ivy", name: "Ivy", portrait: "portrait-ivy.svg", greeting: "A little wonder for my windowsill.", accent: "#7da06f" }
] as const satisfies readonly CustomerDefinition[];

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

export function createInitialOrders(): Order[] {
  return [
    createOrder("order-1", "mia", 2),
    createOrder("order-2", "leo", 3),
    createOrder("order-3", "ivy", 2)
  ];
}

export function createReplacementOrder(sequence: number, active: readonly Order[]): Order {
  const customer = CUSTOMERS[sequence % CUSTOMERS.length];
  const plannedLevel = ORDER_LEVEL_PLAN[sequence % ORDER_LEVEL_PLAN.length] ?? 2;
  const occupiedLevels = new Set(active.map((order) => order.requestedLevel));
  const fallbackLevels: (2 | 3 | 4 | 5 | 6)[] = [2, 3, 4, 5, 6];
  const level = occupiedLevels.has(plannedLevel)
    ? (fallbackLevels.find((candidate) => !occupiedLevels.has(candidate)) ?? plannedLevel)
    : plannedLevel;
  return createOrder(`order-${sequence + 1}`, customer?.id ?? "mia", level);
}

function createOrder(id: string, customer: CustomerId, requestedLevel: 2 | 3 | 4 | 5 | 6): Order {
  return {
    id,
    customer,
    requestedLevel: requestedLevel as ItemLevel,
    quantity: 1,
    reward: REWARD_BY_LEVEL[requestedLevel]
  };
}
