import Link from "next/link";
import { requireHouse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Status } from "@/components/status";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Batches" };

export default async function BatchesPage() {
  const { houseId, role } = await requireHouse();
  const [batches, approved] = await Promise.all([
    prisma.batch.findMany({
      where: { houseId },
      orderBy: { createdAt: "desc" },
      include: {
        version: { include: { formula: true } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.formulaVersion.findMany({
      where: { status: "APPROVED", formula: { houseId } },
      orderBy: { decidedAt: "desc" },
      include: { formula: { include: { brief: true } } },
    }),
  ]);

  const canProduce = role === "OWNER" || role === "LAB";

  return (
    <div className="batches-page">
      <header className="page-head">
        <div>
          <p className="kicker">The bench / lots and maceration</p>
          <h1>Batches</h1>
        </div>
        <p className="page-head__note">
          Every lot is drawn from an approved version. Twenty-one days in the dark before it is ready.
        </p>
      </header>

      <div className="batches-grid">
        <section aria-labelledby="lots-heading">
          <div className="section-head">
            <h2 id="lots-heading">Lots</h2>
            <span className="mono">{batches.length}</span>
          </div>
          <div className="lot-list">
            {batches.map((batch) => (
              <Link href={`/batches/${batch.id}`} className="lot-row" key={batch.id}>
                <span className="mono lot-code">{batch.lotCode}</span>
                <span className="lot-row__main">
                  <strong>{batch.version.formula.name}</strong>
                  <small>
                    {batch.bottleCount} x {batch.bottleMl} ml / v{batch.version.version} / {batch.createdBy.name}
                  </small>
                </span>
                <Status value={batch.status} />
                <span className="mono">{formatDate(batch.maceratedUntil)}</span>
              </Link>
            ))}
            {batches.length === 0 && <p className="empty-note">No batch has been produced yet.</p>}
          </div>
        </section>

        <aside aria-labelledby="approved-heading">
          <div className="section-head">
            <h2 id="approved-heading">Approved for production</h2>
            <span className="mono">{approved.length}</span>
          </div>
          {canProduce ? (
            <div className="approved-list">
              {approved.map((version) => (
                <article key={version.id} className="approved-row">
                  <div>
                    <strong>{version.formula.name}</strong>
                    <span className="mono">v{version.version} / {version.formula.brief.title}</span>
                  </div>
                  <Link className="button button--small" href={`/batches/new/${version.id}`}>
                    Produce
                  </Link>
                </article>
              ))}
              {approved.length === 0 && <p className="empty-note">No approved version is waiting.</p>}
            </div>
          ) : (
            <p className="empty-note">Only the lab or the owner can produce a batch.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
