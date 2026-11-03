import { compose } from "./composition";
import type { FormulaTargets, ResolvedLine } from "./types";

/**
 * Fit compares the actual note shares, measured against 1000 parts, with the
 * brief's target shares. An unfinished formula loses fit for the missing
 * material rather than being normalised into a perfect score.
 */
export function briefFit(lines: ResolvedLine[], targets: FormulaTargets): number {
  const composition = compose(lines);
  const difference =
    Math.abs(composition.noteShare.TOP - targets.top) +
    Math.abs(composition.noteShare.HEART - targets.heart) +
    Math.abs(composition.noteShare.BASE - targets.base);
  return Math.round(Math.min(100, Math.max(0, 100 - difference / 2)) * 10) / 10;
}
