import type { BuildingTease, TownAreaDefinition } from "../types/content";

/**
 * The town's complete area catalogue. UI and game systems can use these
 * definitions to decide availability, producer behaviour, artwork, and order
 * pools without hard-coding a second list of buildings.
 */
export const TOWN_AREAS: readonly TownAreaDefinition[] = [
  {
    id: "drawing-studio", name: "The Drawing Studio", shortName: "Studio", icon: "palette", accent: "#d77962",
    unlock: { villageLevel: 1, lifetimeCoins: 0, description: "Open from the start" },
    producer: { id: "artist-desk", name: "Artist's Desk", description: "A well-loved desk full of pencils and paint.", startingLevel: 1 },
    mergeChain: ["Pencil", "Coloured Pencils", "Paintbrush", "Paint Set", "Sketch", "Finished Drawing", "Beautiful Artwork"]
  },
  {
    id: "kitchen-table", name: "The Kitchen Table", shortName: "Kitchen", icon: "bowl", accent: "#e59b52",
    unlock: { villageLevel: 2, lifetimeCoins: 500, description: "Reach Village Level 2 and earn 500 lifetime coins" },
    producer: { id: "recipe-tin", name: "Recipe Tin", description: "A tin of handwritten recipes and little baking tools.", startingLevel: 1 },
    mergeChain: ["Flour Scoop", "Butter Pat", "Mixing Bowl", "Cookie Dough", "Warm Biscuit", "Iced Cake", "Celebration Feast"]
  },
  {
    id: "windowsill-greenhouse", name: "The Windowsill Greenhouse", shortName: "Greenhouse", icon: "leaf", accent: "#75a86b",
    unlock: { villageLevel: 2, lifetimeCoins: 850, description: "Reach Village Level 2 and earn 850 lifetime coins" },
    producer: { id: "seed-tray", name: "Seed Tray", description: "A sunny tray where tiny seeds begin their journey.", startingLevel: 1 },
    mergeChain: ["Seed Packet", "Tiny Sprout", "Leafy Pot", "Herb Planter", "Blooming Basket", "Garden Bouquet", "Windowsill Eden"]
  },
  {
    id: "music-room", name: "The Music Room", shortName: "Music", icon: "note", accent: "#8c79af",
    unlock: { villageLevel: 3, lifetimeCoins: 1_400, description: "Reach Village Level 3 and earn 1,400 lifetime coins" },
    producer: { id: "music-chest", name: "Music Chest", description: "A chest of instruments, songs, and old concert tickets.", startingLevel: 1 },
    mergeChain: ["Loose Note", "Song Sheet", "Tin Whistle", "Little Drum", "Stringed Tune", "Band Practice", "Moonlight Concert"]
  },
  {
    id: "library", name: "The Library", shortName: "Library", icon: "book", accent: "#6d91ae",
    unlock: { villageLevel: 3, lifetimeCoins: 1_900, description: "Reach Village Level 3 and earn 1,900 lifetime coins" },
    producer: { id: "book-cart", name: "Book Cart", description: "A rolling cart carrying stories waiting to be shared.", startingLevel: 1 },
    mergeChain: ["Bookmark", "Postcard", "Pocket Book", "Story Stack", "Reading Lamp", "Open Atlas", "Grand Story Collection"]
  },
  {
    id: "little-schoolhouse", name: "The Little Schoolhouse", shortName: "Schoolhouse", icon: "school", accent: "#d7737a",
    unlock: { villageLevel: 4, lifetimeCoins: 2_700, description: "Reach Village Level 4 and earn 2,700 lifetime coins" },
    producer: { id: "classroom-cubby", name: "Classroom Cubby", description: "A cheerful cubby packed with classroom treasures.", startingLevel: 1 },
    mergeChain: ["Chalk Piece", "Letter Card", "Exercise Book", "Pencil Case", "Class Project", "School Fair", "Golden Graduation"]
  },
  {
    id: "repair-curiosity-shop", name: "The Repair & Curiosity Shop", shortName: "Curiosity Shop", icon: "star", accent: "#b88855",
    unlock: { villageLevel: 4, lifetimeCoins: 3_500, description: "Reach Village Level 4 and earn 3,500 lifetime coins" },
    producer: { id: "odds-and-ends-drawer", name: "Odds & Ends Drawer", description: "A drawer of useful bits, strange finds, and clever tools.", startingLevel: 1 },
    mergeChain: ["Loose Button", "Tiny Screw", "Pocket Tool", "Mended Toy", "Curious Clock", "Restored Treasure", "Marvelous Invention"]
  },
  {
    id: "railway-platform", name: "The Railway Platform", shortName: "Railway", icon: "rail", accent: "#5794a8",
    unlock: { villageLevel: 5, lifetimeCoins: 4_500, description: "Reach Village Level 5 and earn 4,500 lifetime coins" },
    producer: { id: "travellers-trunk", name: "Traveller's Trunk", description: "A weathered trunk filled with keepsakes from every journey.", startingLevel: 1 },
    mergeChain: ["Ticket Stub", "Travel Tag", "Packed Parcel", "Station Lantern", "Little Suitcase", "Steam Train", "Journey of a Lifetime"]
  }
];

/** Temporary TownView adapter; no area is represented as “Coming Soon”. */
export const FUTURE_BUILDINGS: readonly BuildingTease[] = TOWN_AREAS
  .filter((area) => area.id !== "drawing-studio")
  .map((area) => ({ name: area.name, icon: area.icon, status: "locked", detail: area.unlock.description }));
