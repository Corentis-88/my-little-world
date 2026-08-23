import { TOWN_AREAS } from "./buildingData";
import { ITEM_BY_LEVEL } from "./itemData";
import type { TownAreaId } from "../types/content";
import type { ItemLevel } from "../types/game";

export function areaItemName(areaId: TownAreaId, level: ItemLevel): string {
  const area = TOWN_AREAS.find((entry) => entry.id === areaId);
  return area?.mergeChain[level - 1] ?? ITEM_BY_LEVEL[level].name;
}
