import { PACKAGING_CENTS, TOTAL_PPT, type ResolvedLine } from "./types";

/**
 * Cost of the juice in a 100 ml bottle plus the house's fixed packaging.
 * Density is treated as 1.0 for this estimate, which the interface states.
 * Integer cents leave the function; the floating sum is rounded exactly once.
 */
export function costPer100mlCents(lines: ResolvedLine[], concentrationBp: number): number {
  const concentrateGrams = (100 * concentrationBp) / 10000;
  let materialCents = 0;
  for (const line of lines) {
    if (!Number.isInteger(line.ppt) || line.ppt <= 0) continue;
    materialCents +=
      (line.ppt / TOTAL_PPT) * concentrateGrams * line.material.costCentsPerGram;
  }
  return Math.round(materialCents) + PACKAGING_CENTS;
}

export function concentrateGramsFor(bottleCount: number, bottleMl: number, concentrationBp: number): number {
  return (bottleCount * bottleMl * concentrationBp) / 10000;
}
