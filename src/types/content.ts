import type { ItemLevel } from "./game";

export type ItemDefinition = {
  level: ItemLevel;
  name: string;
  asset: string;
  color: string;
  hint: string;
};

export type TownAreaId =
  | "drawing-studio"
  | "kitchen-table"
  | "windowsill-greenhouse"
  | "music-room"
  | "library"
  | "little-schoolhouse"
  | "repair-curiosity-shop"
  | "railway-platform";

export type AreaUnlockCriterion = {
  /** The village level earned from lifetime coins. */
  villageLevel: number;
  /** A second, explicit coin gate for areas within the same village level. */
  lifetimeCoins: number;
  description: string;
};

export type AreaProducerDefinition = {
  id: string;
  name: string;
  description: string;
  startingLevel: ItemLevel;
};

/** A complete, data-driven playable location and its merge-chain content. */
export type TownAreaDefinition = {
  id: TownAreaId;
  name: string;
  icon: string;
  shortName: string;
  accent: string;
  unlock: AreaUnlockCriterion;
  producer: AreaProducerDefinition;
  /** Exactly seven stages, from the producer's first drop to its masterpiece. */
  mergeChain: readonly [string, string, string, string, string, string, string];
};

/**
 * Compatibility projection for the current TownView.
 * It is derived from the canonical area definitions rather than maintaining a
 * separate tease-only content list; the view can be migrated to TOWN_AREAS
 * without changing the content model.
 */
export type BuildingTease = {
  name: string;
  icon: string;
  status: "coming" | "locked" | "mystery";
  detail: string;
};
