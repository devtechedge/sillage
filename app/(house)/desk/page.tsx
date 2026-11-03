import Link from "next/link";
import { requireHouse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { lowStock } from "@/services/materials";
import { compose } from "@/domain/composition";
import { costPer100mlCents } from "@/domain/cost";
import { briefFit } from "@/domain/fit";
import { sillageIndex } from "@/domain/sillage";
import { tenacityHours } from "@/domain/tenacity";
import type { ResolvedLine } from "@/domain/types";
import { NotePyramid } from "@/components/note-pyramid";
import { Status } from "@/components/status";
import { TargetBars } from "@/components/target-bars";
import { formatCents, formatGrams, formatHours } from "@/lib/format";

export const metadata = { title: "Atelier desk" };

export default async function DeskPage() {
  const { houseId, user, role } = await requireHouse();

  const [briefs, formulas, reviewQueue, stock] = await Promise.all([
    prisma.brief.findMany({
      where: { houseId },
      orderBy: { updatedAt: "desc" },
      include: { formulas: { orderBy: { updatedAt: "desc" }, take: 4 } },
    }),
    prisma.formula.findMany({
      where: { houseId },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      include: {
        brief: true,
        versions: {
          orderBy: { version: "desc" },
          include: {
            lines: { include: { material: true } },
            trials: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
    }),
    prisma.formulaVersion.findMany({
      where: { formula: { houseId }, status: "IN_REVIEW" },
      orderBy: { submittedAt: "asc" },
      include: { formula: { include: { brief: true } }, createdBy: { select: { name: true } } },
    }),
    lowStock(houseId),
  ]);

  const tabs = formulas.map((formula) => {
    const version = formula.versions[0];
    const lines: ResolvedLine[] = (version?.lines ?? []).map((line) => ({
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
      formula,
      version,
      noteShare: composition.noteShare,
      total: composition.totalPpt,
      cost: costPer100mlCents(lines, formula.concentrationBp),
      tenacity: tenacityHours(lines, formula.concentrationBp),
      sillage: sillageIndex(lines),
      fit: briefFit(lines, targets),
      score: version?.trials[0]?.score ?? null,
    };
  });

  return (
    <div className="desk">
      <header className="page-head">
        <div>
          <p className="kicker">Atelier desk / {new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "2-digit", month: "long", year: "numeric" }).format(new Date())}</p>
          <h1>Good evening, {user.name.split(" ")[0]}.</h1>
        </div>
        <p className="page-head__note">
          {role === "OWNER" || role === "PERFUMER"
            ? "The cabinet is open. The house is waiting for the next version."
            : role === "EVALUATOR"
              ? "Two strips are on the tray. The house is waiting for a read."
              : "The bench is clear. Approved formulas are ready for the lab."}
        </p>
      </header>

      <div className="desk-grid">
        <section className="desk-column" aria-labelledby="briefs-heading">
          <div className="section-head">
            <h2 id="briefs-heading">Briefs</h2>
            <span className="mono">{briefs.length}</span>
          </div>
          <div className="brief-list">
            {briefs.map((brief) => (
              <article className="brief-card" key={brief.id}>
                <header>
                  <p className="mono">{brief.client}</p>
                  <Status value={brief.status} />
                </header>
                <h3>
                  <Link href={`/briefs/${brief.id}`}>{brief.title}</Link>
                </h3>
                <p>{brief.body}</p>
                <TargetBars
                  top={brief.targetTop}
                  heart={brief.targetHeart}
                  base={brief.targetBase}
                  compact
                />
                <footer>
                  <span>{brief.formulas.length} {brief.formulas.length === 1 ? "formula" : "formulas"}</span>
                  <span className="mono">{formatCents(brief.costCeilingCents)} ceiling</span>
                </footer>
              </article>
            ))}
          </div>
        </section>

        <section className="desk-column desk-column--wide" aria-labelledby="shelf-heading">
          <div className="section-head">
            <h2 id="shelf-heading">Formula shelf</h2>
            <span className="mono">{tabs.length} in house</span>
          </div>
          <div className="formula-shelf">
            {tabs.map(({ formula, version, noteShare, total, cost, tenacity, sillage, fit, score }) => (
              <Link className="formula-tab" href={`/formulas/${formula.id}`} key={formula.id}>
                <div className="formula-tab__top">
                  <span className="mono">v{version?.version ?? 0}</span>
                  <Status value={formula.status} />
                </div>
                <h3>{formula.name}</h3>
                <p>{formula.brief.title} / {formula.brief.client}</p>
                <div className="formula-tab__body">
                  <NotePyramid
                    top={noteShare.TOP}
                    heart={noteShare.HEART}
                    base={noteShare.BASE}
                    total={total}
                    compact
                  />
                  <dl>
                    <div>
                      <dt>Cost</dt>
                      <dd>{formatCents(cost)}</dd>
                    </div>
                    <div>
                      <dt>Tenacity</dt>
                      <dd>{formatHours(tenacity)}</dd>
                    </div>
                    <div>
                      <dt>Fit</dt>
                      <dd>{fit.toFixed(1)}</dd>
                    </div>
                    <div>
                      <dt>Sillage</dt>
                      <dd>{sillage}</dd>
                    </div>
                  </dl>
                </div>
                <footer>
                  <span>{total} / 1000 parts</span>
                  <span className="mono">{score ? `Trial ${score} / 5` : "No trial"}</span>
                </footer>
              </Link>
            ))}
          </div>
          {role === "PERFUMER" || role === "OWNER" ? (
            <p className="desk-hint">
              Open a brief to start a formula. Every version keeps its own strip.
            </p>
          ) : null}
        </section>

        <aside className="desk-column desk-column--rail">
          <section aria-labelledby="review-heading">
            <div className="section-head">
              <h2 id="review-heading">On the tray</h2>
              <span className="mono">{reviewQueue.length}</span>
            </div>
            <div className="review-list">
              {reviewQueue.map((version) => (
                <Link href={`/formulas/${version.formulaId}`} className="review-row" key={version.id}>
                  <span className="mono">v{version.version}</span>
                  <span>
                    <strong>{version.formula.name}</strong>
                    <small>{version.createdBy.name} / {version.formula.brief.title}</small>
                  </span>
                  <span className="review-row__arrow" aria-hidden="true">→</span>
                </Link>
              ))}
              {reviewQueue.length === 0 && <p className="empty-note">Nothing is waiting for a read.</p>}
            </div>
          </section>

          <section aria-labelledby="stock-heading">
            <div className="section-head">
              <h2 id="stock-heading">Low stock</h2>
              <span className="mono">{stock.length}</span>
            </div>
            <div className="stock-list">
              {stock.map((material) => (
                <div className="stock-row" key={material.id}>
                  <span>{material.name}</span>
                  <span className="mono">{formatGrams(material.stockMg)}</span>
                </div>
              ))}
              {stock.length === 0 && <p className="empty-note">Every drawer is above its line.</p>}
            </div>
            <Link className="quiet-link" href="/materials">
              Open the cabinet
            </Link>
          </section>

          <section aria-labelledby="rhythm-heading">
            <div className="section-head">
              <h2 id="rhythm-heading">House rhythm</h2>
            </div>
            <p className="rail-note">
              A version is submitted at exactly 1,000 parts. Approval locks it. A revision opens
              the next number. Batches macerate for twenty-one days before they are ready.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
