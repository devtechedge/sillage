import type { ResolvedLine } from "./types";

export type DiffStatus = "added" | "removed" | "changed" | "same";

export interface LineDiff {
  materialId: string;
  code: string;
  name: string;
  fromPpt: number;
  toPpt: number;
  delta: number;
  status: DiffStatus;
}

export function diffLines(from: ResolvedLine[], to: ResolvedLine[]): LineDiff[] {
  const map = new Map<string, LineDiff>();

  for (const line of from) {
    map.set(line.material.id, {
      materialId: line.material.id,
      code: line.material.code,
      name: line.material.name,
      fromPpt: line.ppt,
      toPpt: 0,
      delta: -line.ppt,
      status: "removed",
    });
  }

  for (const line of to) {
    const existing = map.get(line.material.id);
    if (!existing) {
      map.set(line.material.id, {
        materialId: line.material.id,
        code: line.material.code,
        name: line.material.name,
        fromPpt: 0,
        toPpt: line.ppt,
        delta: line.ppt,
        status: "added",
      });
      continue;
    }
    map.set(line.material.id, {
      ...existing,
      toPpt: line.ppt,
      delta: line.ppt - existing.fromPpt,
      status: line.ppt === existing.fromPpt ? "same" : "changed",
    });
  }

  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
}
