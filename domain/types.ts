export const ROLES = ["OWNER", "PERFUMER", "EVALUATOR", "LAB"] as const;
export type Role = (typeof ROLES)[number];

export const NOTES = ["TOP", "HEART", "BASE"] as const;
export type Note = (typeof NOTES)[number];

export const FAMILIES = [
  "citrus",
  "green",
  "floral",
  "powdery",
  "wood",
  "resin",
  "musk",
  "gourmand",
  "moss",
  "spice",
] as const;
export type Family = (typeof FAMILIES)[number];

export const FORMULA_STATUSES = ["DRAFT", "IN_REVIEW", "CHANGES", "APPROVED"] as const;
export type FormulaStatus = (typeof FORMULA_STATUSES)[number];

export const BATCH_STATUSES = ["MACERATING", "READY", "RELEASED"] as const;
export type BatchStatus = (typeof BATCH_STATUSES)[number];

export const STOCK_REASONS = ["INTAKE", "BATCH", "ADJUSTMENT"] as const;
export type StockReason = (typeof STOCK_REASONS)[number];

export const CONCENTRATIONS = [1200, 2000, 2500] as const;
export type Concentration = (typeof CONCENTRATIONS)[number];

export const PACKAGING_CENTS = 240;
export const TOTAL_PPT = 1000;

export interface MaterialSnapshot {
  id: string;
  code: string;
  name: string;
  family: string;
  note: string;
  costCentsPerGram: number;
  persistenceHours: number;
  maxPpt: number;
  stockMg: number;
}

export interface ResolvedLine {
  material: MaterialSnapshot;
  ppt: number;
}

export interface NoteShares {
  TOP: number;
  HEART: number;
  BASE: number;
}

export interface Composition {
  totalPpt: number;
  notePpt: NoteShares;
  noteShare: NoteShares;
  familyPpt: Record<string, number>;
  familyShare: Record<string, number>;
  dominantFamily: string | null;
}

export interface FormulaTargets {
  top: number;
  heart: number;
  base: number;
}

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

export function isNote(value: string): value is Note {
  return (NOTES as readonly string[]).includes(value);
}
