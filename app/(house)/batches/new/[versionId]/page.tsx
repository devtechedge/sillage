import { notFound } from "next/navigation";
import { requireHouse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BatchForm } from "@/components/batch-form";

export const metadata = { title: "New batch" };

export default async function NewBatchPage({ params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params;
  const { houseId, role } = await requireHouse();
  if (role !== "OWNER" && role !== "LAB") notFound();

  const version = await prisma.formulaVersion.findFirst({
    where: { id: versionId, status: "APPROVED", formula: { houseId } },
    include: {
      formula: { include: { brief: true } },
      lines: { include: { material: true }, orderBy: { material: { code: "asc" } } },
    },
  });
  if (!version) notFound();

  return (
    <div className="batch-new-page">
      <header className="page-head">
        <div>
          <p className="kicker">Production / new lot</p>
          <h1>Weigh the draw.</h1>
        </div>
        <p className="page-head__note">
          The preview is the exact milligram draw. If one drawer is short, nothing is deducted.
        </p>
      </header>
      <BatchForm
        versionId={version.id}
        formulaName={version.formula.name}
        version={version.version}
        concentrationBp={version.formula.concentrationBp}
        lines={version.lines.map((line) => ({
          ppt: line.ppt,
          material: {
            id: line.material.id,
            code: line.material.code,
            name: line.material.name,
            stockMg: line.material.stockMg,
          },
        }))}
      />
    </div>
  );
}
