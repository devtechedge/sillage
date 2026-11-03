export interface BatchDraw {
  materialId: string;
  code: string;
  name: string;
  ppt: number;
  requiredMg: number;
  stockMg: number;
}

/**
 * Converts a formula into the exact milligram draw for a lot. The draw is
 * rounded up so the bench never promises a material it cannot weigh.
 */
export function batchDraws(
  lines: { ppt: number; material: { id: string; code: string; name: string; stockMg: number } }[],
  bottleCount: number,
  bottleMl: number,
  concentrationBp: number
): BatchDraw[] {
  const concentrateGrams = (bottleCount * bottleMl * concentrationBp) / 10000;
  return lines.map((line) => ({
    materialId: line.material.id,
    code: line.material.code,
    name: line.material.name,
    ppt: line.ppt,
    requiredMg: Math.ceil(concentrateGrams * (line.ppt / 1000) * 1000),
    stockMg: line.material.stockMg,
  }));
}
