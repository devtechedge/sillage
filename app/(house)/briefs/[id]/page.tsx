import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHouse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Status } from "@/components/status";
import { TargetBars } from "@/components/target-bars";
import { NewFormulaForm } from "@/components/new-formula-form";
import { formatCents } from "@/lib/format";

export const metadata = { title: "Brief" };

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { houseId, role } = await requireHouse();
  const brief = await prisma.brief.findFirst({
    where: { id, houseId },
    include: {
      formulas: {
        orderBy: { updatedAt: "desc" },
        include: {
          versions: {
            orderBy: { version: "desc" },
            take: 1,
            include: { trials: { orderBy: { createdAt: "desc" }, take: 1 } },
          },
        },
      },
    },
  });
  if (!brief) notFound();

  const canCompose = role === "OWNER" || role === "PERFUMER";

  return (
    <div className="brief-page">
      <header className="page-head page-head--split">
        <div>
          <p className="kicker">Brief / {brief.client}</p>
          <h1>{brief.title}</h1>
        </div>
        <Status value={brief.status} />
      </header>

      <div className="brief-page__grid">
        <section className="brief-sheet">
          <p className="brief-sheet__body">{brief.body}</p>
          <dl className="brief-sheet__facts">
            <div>
              <dt>Target families</dt>
              <dd>{brief.targetFamilies.join(", ")}</dd>
            </div>
            <div>
              <dt>Cost ceiling</dt>
              <dd>{formatCents(brief.costCeilingCents)} / 100 ml</dd>
            </div>
            <div>
              <dt>Target notes</dt>
              <dd>
                {brief.targetTop} / {brief.targetHeart} / {brief.targetBase}
              </dd>
            </div>
          </dl>
          <TargetBars top={brief.targetTop} heart={brief.targetHeart} base={brief.targetBase} />
          <p className="micro">
            The target bars are shares of 1,000 parts. A formula that leaves a band empty loses
            fit rather than being normalised into a perfect score.
          </p>
        </section>

        <aside className="brief-page__side">
          {canCompose ? (
            <NewFormulaForm briefId={brief.id} title={brief.title} />
          ) : (
            <p className="empty-note">Only a perfumer or the owner can open a formula here.</p>
          )}
        </aside>
      </div>

      <section aria-labelledby="brief-formulas">
        <div className="section-head">
          <h2 id="brief-formulas">Formulas against this brief</h2>
          <span className="mono">{brief.formulas.length}</span>
        </div>
        <div className="brief-formula-list">
          {brief.formulas.map((formula) => {
            const version = formula.versions[0];
            return (
              <Link className="brief-formula" href={`/formulas/${formula.id}`} key={formula.id}>
                <span className="mono">v{version?.version ?? 0}</span>
                <span className="brief-formula__name">{formula.name}</span>
                <Status value={formula.status} />
                <span className="mono">{version?.trials[0]?.score ? `${version.trials[0].score} / 5` : "No trial"}</span>
              </Link>
            );
          })}
          {brief.formulas.length === 0 && (
            <p className="empty-note">No formula has been opened against this brief yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
