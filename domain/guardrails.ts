import { compose } from "./composition";
import { costPer100mlCents } from "./cost";
import type { FormulaTargets, ResolvedLine } from "./types";

export type GuardrailSeverity = "blocking" | "warning";

export interface Guardrail {
  code: string;
  severity: GuardrailSeverity;
  message: string;
  materialId?: string;
}

export function guardrails(
  lines: ResolvedLine[],
  concentrationBp: number,
  costCeilingCents: number,
  targets: FormulaTargets
): Guardrail[] {
  const result: Guardrail[] = [];
  const composition = compose(lines);

  if (lines.length === 0) {
    result.push({
      code: "EMPTY",
      severity: "blocking",
      message: "The formula has no materials yet.",
    });
    return result;
  }

  if (lines.length < 3) {
    result.push({
      code: "TOO_FEW",
      severity: "blocking",
      message: "A formula needs at least three materials before it can be submitted.",
    });
  }

  if (composition.totalPpt !== 1000) {
    result.push({
      code: "TOTAL",
      severity: "blocking",
      message: `The formula holds ${composition.totalPpt} of 1000 parts.`,
    });
  }

  for (const line of lines) {
    if (line.ppt > line.material.maxPpt) {
      result.push({
        code: "CAP",
        severity: "blocking",
        message: `${line.material.name} is at ${line.ppt} parts, above the house maximum of ${line.material.maxPpt}.`,
        materialId: line.material.id,
      });
    }
  }

  const cost = costPer100mlCents(lines, concentrationBp);
  if (cost > costCeilingCents) {
    result.push({
      code: "COST",
      severity: "warning",
      message: `The juice costs ${(cost / 100).toFixed(2)} per 100 ml, above the brief ceiling of ${(costCeilingCents / 100).toFixed(2)}.`,
    });
  }

  for (const note of ["TOP", "HEART", "BASE"] as const) {
    if (composition.notePpt[note] === 0) {
      result.push({
        code: `EMPTY_${note}`,
        severity: "warning",
        message: `No ${note.toLowerCase()} materials yet.`,
      });
    }
  }

  const fit = Math.abs(composition.noteShare.TOP - targets.top);
  if (fit > 25) {
    result.push({
      code: "FIT",
      severity: "warning",
      message: "The top note is far from the brief's target.",
    });
  }

  return result;
}

export function canSubmit(lines: ResolvedLine[]): boolean {
  if (lines.length < 3) return false;
  const total = lines.reduce((sum, line) => sum + line.ppt, 0);
  return total === 1000;
}
