import type { ItemDefinition } from "../types/content";
import type { ItemLevel } from "../types/game";

export const ITEM_DEFINITIONS: readonly ItemDefinition[] = [
  { level: 1, name: "Pencil", asset: "pencil.svg", color: "#e9b760", hint: "A tiny beginning" },
  { level: 2, name: "Coloured Pencils", asset: "coloured-pencils.svg", color: "#d66a58", hint: "A little more colour" },
  { level: 3, name: "Paintbrush", asset: "paintbrush.svg", color: "#6f9f93", hint: "Ready to make a mark" },
  { level: 4, name: "Paint Set", asset: "paint-set.svg", color: "#dc8660", hint: "Every shade has a story" },
  { level: 5, name: "Sketch", asset: "sketch.svg", color: "#e6ae5e", hint: "A thought taking shape" },
  { level: 6, name: "Finished Drawing", asset: "finished-drawing.svg", color: "#7b9f86", hint: "Nearly ready to share" },
  { level: 7, name: "Beautiful Artwork", asset: "beautiful-artwork.svg", color: "#c97859", hint: "A little piece of magic" }
];

export const ITEM_BY_LEVEL: Record<ItemLevel, ItemDefinition> = Object.fromEntries(
  ITEM_DEFINITIONS.map((definition) => [definition.level, definition])
) as Record<ItemLevel, ItemDefinition>;

export const itemName = (level: ItemLevel): string => ITEM_BY_LEVEL[level].name;
