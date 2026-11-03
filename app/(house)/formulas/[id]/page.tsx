import { notFound } from "next/navigation";
import { requireHouse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loadFormula } from "@/services/formulas";
import { FormulaRoom } from "@/components/formula-room";

export const metadata = { title: "Formula room" };

export default async function FormulaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { houseId, role } = await requireHouse();
  const formula = await loadFormula(houseId, id);
  if (!formula) notFound();

  const materials = await prisma.material.findMany({
    where: { houseId, active: true },
    orderBy: [{ family: "asc" }, { name: "asc" }],
  });

  const selected =
    formula.versions.find((version) => version.id === query.version) ?? formula.versions[0];
  if (!selected) notFound();

  const canEdit = (role === "OWNER" || role === "PERFUMER") && selected.status === "DRAFT";

  return (
    <FormulaRoom
      key={selected.id}
      formulaId={formula.id}
      formulaName={formula.name}
      concentrationBp={formula.concentrationBp}
      brief={{
        id: formula.brief.id,
        title: formula.brief.title,
        client: formula.brief.client,
        targetTop: formula.brief.targetTop,
        targetHeart: formula.brief.targetHeart,
        targetBase: formula.brief.targetBase,
        costCeilingCents: formula.brief.costCeilingCents,
      }}
      materials={materials.map((material) => ({
        id: material.id,
        code: material.code,
        name: material.name,
        family: material.family,
        note: material.note,
        costCentsPerGram: material.costCentsPerGram,
        persistenceHours: material.persistenceHours,
        stockMg: material.stockMg,
        maxPpt: material.maxPpt,
        reorderMg: material.reorderMg,
        description: material.description,
      }))}
      versions={formula.versions.map((version) => ({
        id: version.id,
        version: version.version,
        status: version.status,
        note: version.note,
        decisionNote: version.decisionNote,
        submittedAt: version.submittedAt?.toISOString() ?? null,
        decidedAt: version.decidedAt?.toISOString() ?? null,
        reviewerName: version.reviewer?.name ?? null,
        createdByName: version.createdBy.name,
        lines: version.lines.map((line) => ({
          materialId: line.materialId,
          ppt: line.ppt,
        })),
        trials: version.trials.map((trial) => ({
          id: trial.id,
          score: trial.score,
          tags: trial.tags,
          note: trial.note,
          evaluatorName: trial.evaluator.name,
          createdAt: trial.createdAt.toISOString(),
        })),
      }))}
      selectedVersionId={selected.id}
      role={role}
      canEdit={canEdit}
    />
  );
}
