import type { ItemDefinition } from "../types/content";
import type { ItemFamily, ItemLevel } from "../types/game";

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

const FAMILY_NAMES: Record<ItemFamily, readonly string[]> = {
  drawing: ITEM_DEFINITIONS.map((item) => item.name),
  collage: ["Paper Snips", "Pattern Pieces", "Glue Pot", "Paper Garden", "Collage Scene", "Story Panel", "Paper Masterpiece"],
  prints: ["Ink Dot", "Carved Stamp", "Ink Roller", "Printed Tile", "Mini Poster", "Gallery Print", "Ink Masterpiece"]
};

export const FAMILY_LABELS: Record<ItemFamily, string> = { drawing: "Drawing", collage: "Paper Collage", prints: "Little Prints" };
export const FAMILY_UNLOCK_LEVEL: Record<ItemFamily, 1 | 2 | 3> = { drawing: 1, collage: 2, prints: 3 };
export const FAMILY_ACCENT: Record<ItemFamily, string> = { drawing: "#d77962", collage: "#6f9992", prints: "#7f79a6" };

export function itemFor(family: ItemFamily, level: ItemLevel): ItemDefinition {
  const base = ITEM_BY_LEVEL[level];
  return { ...base, name: FAMILY_NAMES[family][level - 1] ?? base.name, color: family === "drawing" ? base.color : FAMILY_ACCENT[family] };
}

export function unlockedFamilies(studioLevel: number): ItemFamily[] {
  return (Object.keys(FAMILY_UNLOCK_LEVEL) as ItemFamily[]).filter((family) => FAMILY_UNLOCK_LEVEL[family] <= studioLevel);
}
