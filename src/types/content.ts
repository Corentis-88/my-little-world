import type { ItemLevel } from "./game";

export type ItemDefinition = {
  level: ItemLevel;
  name: string;
  asset: string;
  color: string;
  hint: string;
};

export type BuildingTease = {
  name: string;
  icon: string;
  status: "coming" | "locked" | "mystery";
  detail?: string;
};
