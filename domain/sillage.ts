import { compose } from "./composition";
import { TOTAL_PPT, type ResolvedLine } from "./types";

/**
 * A transparent house heuristic, not a measured projection. Base and musk push
 * the trail outward; citrus pulls it back toward the skin.
 */
export function sillageIndex(lines: ResolvedLine[]): number {
  const composition = compose(lines);
  if (composition.totalPpt === 0) return 0;
  const baseShare = composition.notePpt.BASE / TOTAL_PPT;
  const muskShare = (composition.familyPpt.musk ?? 0) / TOTAL_PPT;
  const citrusShare = (composition.familyPpt.citrus ?? 0) / TOTAL_PPT;
  const raw = 100 * (0.35 + 0.4 * baseShare + 0.15 * muskShare + 0.1 * (1 - citrusShare));
  return Math.round(Math.min(100, Math.max(0, raw)));
}
