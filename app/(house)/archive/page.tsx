import Link from "next/link";
import { requireHouse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Status } from "@/components/status";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Archive" };

export default async function ArchivePage() {
  const { houseId } = await requireHouse();
  const [formulas, batches] = await Promise.all([
    prisma.formula.findMany({
      where: { houseId, status: "APPROVED" },
      orderBy: { updatedAt: "desc" },
      include: {
        brief: true,
        versions: {
          where: { status: "APPROVED" },
          orderBy: { version: "desc" },
          take: 1,
          include: { reviewer: { select: { name: true } } },
        },
      },
    }),
    prisma.batch.findMany({
      where: { houseId },
      orderBy: { createdAt: "desc" },
      include: { version: { include: { formula: true } } },
    }),
  ]);

  return (
    <div className="archive-page">
      <header className="page-head">
        <div>
          <p className="kicker">The house memory / approved and released</p>
          <h1>Archive</h1>
        </div>
        <p className="page-head__note">
          Approved versions never change. The archive is the room after the lights are turned down.
        </p>
      </header>

      <section aria-labelledby="archive-formulas">
        <div className="section-head">
          <h2 id="archive-formulas">Approved formulas</h2>
          <span className="mono">{formulas.length}</span>
        </div>
        <div className="archive-list">
          {formulas.map((formula) => {
            const version = formula.versions[0];
            return (
              <Link className="archive-row" href={`/formulas/${formula.id}`} key={formula.id}>
                <span className="mono">v{version?.version ?? 0}</span>
                <span className="archive-row__main">
                  <strong>{formula.name}</strong>
                  <small>{formula.brief.title} / {formula.brief.client}</small>
                </span>
                <span className="mono">{formula.concentrationBp / 100}%</span>
                <span className="mono">{version?.decidedAt ? formatDate(version.decidedAt) : "no date"}</span>
                <span>{version?.reviewer?.name ?? "house"}</span>
              </Link>
            );
          })}
          {formulas.length === 0 && <p className="empty-note">No formula has been approved yet.</p>}
        </div>
      </section>

      <section aria-labelledby="archive-batches">
        <div className="section-head">
          <h2 id="archive-batches">Lots</h2>
          <span className="mono">{batches.length}</span>
        </div>
        <div className="archive-list">
          {batches.map((batch) => (
            <Link className="archive-row" href={`/batches/${batch.id}`} key={batch.id}>
              <span className="mono lot-code">{batch.lotCode}</span>
              <span className="archive-row__main">
                <strong>{batch.version.formula.name}</strong>
                <small>{batch.bottleCount} x {batch.bottleMl} ml / v{batch.version.version}</small>
              </span>
              <Status value={batch.status} />
              <span className="mono">{formatDate(batch.maceratedUntil)}</span>
            </Link>
          ))}
          {batches.length === 0 && <p className="empty-note">No lot has been produced yet.</p>}
        </div>
      </section>

      <p className="micro">
        The house keeps one approved version at a time. A revision creates the next version; the
        approved one remains readable here.
      </p>
    </div>
  );
}
