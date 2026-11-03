import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHouse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loadBatch } from "@/services/batches";
import { advanceBatchAction } from "@/app/formula-actions";
import { Status } from "@/components/status";
import { formatDate, formatDateTime, formatGrams } from "@/lib/format";

export default async function BatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { houseId, role } = await requireHouse();
  const batch = await loadBatch(houseId, id);
  if (!batch) notFound();

  const audit = await prisma.auditEvent.findMany({
    where: { houseId, entityType: "batch", entityId: batch.id },
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true } } },
  });

  const canAdvance = (role === "OWNER" || role === "LAB") && batch.status !== "RELEASED";
  const totalDraw = batch.stock.reduce((sum, entry) => sum + Math.abs(entry.deltaMg), 0);

  return (
    <div className="batch-page">
      <header className="page-head page-head--split">
        <div>
          <p className="kicker">Lot / {batch.version.formula.brief.title}</p>
          <h1 className="lot-title">{batch.lotCode}</h1>
          <p className="page-head__note">
            {batch.version.formula.name} / version {batch.version.version} /{" "}
            {batch.bottleCount} bottles of {batch.bottleMl} ml
          </p>
        </div>
        <div className="batch-page__status">
          <Status value={batch.status} />
          <span className="mono">macerates until {formatDate(batch.maceratedUntil)}</span>
        </div>
      </header>

      <div className="batch-facts">
        <div>
          <span>Concentration</span>
          <strong>{batch.version.formula.concentrationBp / 100}%</strong>
        </div>
        <div>
          <span>Total material</span>
          <strong>{formatGrams(totalDraw)}</strong>
        </div>
        <div>
          <span>Produced by</span>
          <strong>{batch.createdBy.name}</strong>
        </div>
        <div>
          <span>Produced</span>
          <strong>{formatDate(batch.createdAt)}</strong>
        </div>
      </div>

      <div className="batch-page__grid">
        <section aria-labelledby="ledger-heading">
          <div className="section-head">
            <h2 id="ledger-heading">Milligram ledger</h2>
            <span className="mono">{batch.stock.length}</span>
          </div>
          <div className="table-wrap" role="region" aria-label="Batch ledger" tabIndex={0}>
            <table className="ledger-table">
              <caption className="sr-only">Stock entries written by this batch</caption>
              <thead>
                <tr>
                  <th scope="col">Material</th>
                  <th scope="col" className="num">Draw</th>
                  <th scope="col">Reason</th>
                  <th scope="col">When</th>
                </tr>
              </thead>
              <tbody>
                {batch.stock.map((entry) => (
                  <tr key={entry.id}>
                    <th scope="row">
                      {entry.material.name} <span className="line-code">{entry.material.code}</span>
                    </th>
                    <td className="num mono">{formatGrams(Math.abs(entry.deltaMg))}</td>
                    <td><span className="mono">{entry.reason.toLowerCase()}</span></td>
                    <td className="mono">{formatDateTime(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="micro">
            The ledger is signed. A batch writes one negative entry per material; intake writes a
            positive one.
          </p>
        </section>

        <aside>
          <div className="section-head">
            <h2>Trace</h2>
          </div>
          <ol className="audit-list">
            {audit.map((event) => (
              <li key={event.id}>
                <span className="mono">{formatDateTime(event.createdAt)}</span>
                <strong>{event.action}</strong>
                <span>{event.actor.name}</span>
              </li>
            ))}
            {audit.length === 0 && <li className="empty-note">No batch event yet.</li>}
          </ol>

          {canAdvance && (
            <form action={advanceBatchAction} className="advance-form">
              <input type="hidden" name="batchId" value={batch.id} />
              <button className="button button--ghost button--wide" type="submit">
                {batch.status === "MACERATING" ? "Mark ready" : "Release lot"}
              </button>
              <p className="micro">
                {batch.status === "MACERATING"
                  ? "Move the lot from the dark room to the shelf."
                  : "Release is the last state. The ledger stays."}
              </p>
            </form>
          )}
        </aside>
      </div>

      <div className="batch-page__links">
        <Link className="quiet-link" href={`/formulas/${batch.version.formula.id}`}>
          Open the formula
        </Link>
        <Link className="quiet-link" href="/batches">
          All lots
        </Link>
      </div>
    </div>
  );
}
