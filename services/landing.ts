import { prisma } from "@/lib/db";
import { briefFit } from "@/domain/fit";
import { compose } from "@/domain/composition";
import { costPer100mlCents } from "@/domain/cost";
import { guardrails } from "@/domain/guardrails";
import { sillageIndex } from "@/domain/sillage";
import { tenacityHours } from "@/domain/tenacity";
import type { ResolvedLine } from "@/domain/types";

export async function publicFormula() {
  const house = await prisma.house.findUnique({ where: { slug: "maison-verre" } });
  if (!house) return null;
  const formula = await prisma.formula.findFirst({
    where: { houseId: house.id, status: "APPROVED" },
    orderBy: { updatedAt: "desc" },
    include: {
      brief: true,
      versions: {
        where: { status: "APPROVED" },
        orderBy: { version: "desc" },
        take: 1,
        include: {
          lines: { include: { material: true } },
        },
      },
    },
  });
  const version = formula?.versions[0];
  if (!formula || !version) return null;

  const lines: ResolvedLine[] = version.lines.map((line) => ({
    ppt: line.ppt,
    material: {
      id: line.material.id,
      code: line.material.code,
      name: line.material.name,
      family: line.material.family,
      note: line.material.note,
      costCentsPerGram: line.material.costCentsPerGram,
      persistenceHours: line.material.persistenceHours,
      maxPpt: line.material.maxPpt,
      stockMg: line.material.stockMg,
    },
  }));
  const composition = compose(lines);
  const targets = {
    top: formula.brief.targetTop,
    heart: formula.brief.targetHeart,
    base: formula.brief.targetBase,
  };

  return {
    name: formula.name,
    brief: formula.brief.title,
    client: formula.brief.client,
    concentrationBp: formula.concentrationBp,
    version: version.version,
    noteShare: composition.noteShare,
    totalPpt: composition.totalPpt,
    costCents: costPer100mlCents(lines, formula.concentrationBp),
    tenacity: tenacityHours(lines, formula.concentrationBp),
    sillage: sillageIndex(lines),
    fit: briefFit(lines, targets),
    warnings: guardrails(lines, formula.concentrationBp, formula.brief.costCeilingCents, targets).length,
    materialCount: lines.length,
  };
}
