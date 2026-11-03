import type { ResolvedLine } from "./types";

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Weighted average persistence of the materials, lifted slightly by
 * concentration. This is a house estimate, not a measured dry-down.
 */
export function tenacityHours(lines: ResolvedLine[], concentrationBp: number): number {
  const total = lines.reduce((sum, line) => sum + Math.max(0, line.ppt), 0);
  if (total === 0) return 0;
  const weighted = lines.reduce(
    (sum, line) => sum + (Math.max(0, line.ppt) / total) * line.material.persistenceHours,
    0
  );
  const estimate = weighted * (0.8 + concentrationBp / 10000);
  return round1(Math.min(48, Math.max(0, estimate)));
}
