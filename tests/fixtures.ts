import type { MaterialSnapshot, ResolvedLine } from "@/domain/types";

export function material(overrides: Partial<MaterialSnapshot> = {}): MaterialSnapshot {
  return {
    id: "mat_berg",
    code: "BERG",
    name: "Bergamot",
    family: "citrus",
    note: "TOP",
    costCentsPerGram: 10,
    persistenceHours: 2,
    maxPpt: 120,
    stockMg: 200000,
    ...overrides,
  };
}

export function line(
  code: string,
  ppt: number,
  overrides: Partial<MaterialSnapshot> = {}
): ResolvedLine {
  return {
    ppt,
    material: material({
      id: `mat_${code.toLowerCase()}`,
      code,
      name: code,
      ...overrides,
    }),
  };
}
