import Link from "next/link";
import { requireHouse } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { diffLines } from "@/domain/diff";
import { costPer100mlCents } from "@/domain/cost";
import { briefFit } from "@/domain/fit";
import { sillageIndex } from "@/domain/sillage";
import { tenacityHours } from "@/domain/tenacity";
import type { ResolvedLine } from "@/domain/types";
import { formatCents, formatHours } from "@/lib/format";

export const metadata = { title: "Trials" };

type Line = {
  ppt: number;
  material: {
    id: string;
    code: string;
    name: string;
    family: string;
    note: string;
    costCentsPerGram: number;
    persistenceHours: number;
    maxPpt: number;
    stockMg: number;
  };
};

function resolve(lines: Line[]): ResolvedLine[] {
  return lines.map((line) => ({
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
}

export default async function TrialsPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const query = await searchParams;
  const { houseId } = await requireHouse();
  const trials = await prisma.trial.findMany({
    where: { houseId },
    orderBy: { createdAt: "desc" },
    include: {
      evaluator: { select: { name: true } },
      version: {
        include: {
          formula: { include: { brief: true } },
          lines: { include: { material: true } },
        },
      },
    },
  });

  const trialA = query.a ? trials.find((trial) => trial.id === query.a) : undefined;
  const trialB = query.b ? trials.find((trial) => trial.id === query.b) : undefined;
  const comparable = trialA && trialB && trialA.version.formulaId === trialB.version.formulaId;

  let comparison: null | {
    diff: ReturnType<typeof diffLines>;
    aMetrics: { cost: number; tenacity: number; sillage: number; fit: number };
    bMetrics: { cost: number; tenacity: number; sillage: number; fit: number };
  } = null;

  if (comparable) {
    const aLines = resolve(trialA.version.lines);
    const bLines = resolve(trialB.version.lines);
    const brief = trialA.version.formula.brief;
    const targets = { top: brief.targetTop, heart: brief.targetHeart, base: brief.targetBase };
    const aMetrics = {
      cost: costPer100mlCents(aLines, trialA.version.formula.concentrationBp),
      tenacity: tenacityHours(aLines, trialA.version.formula.concentrationBp),
      sillage: sillageIndex(aLines),
      fit: briefFit(aLines, targets),
    };
    const bMetrics = {
      cost: costPer100mlCents(bLines, trialB.version.formula.concentrationBp),
      tenacity: tenacityHours(bLines, trialB.version.formula.concentrationBp),
      sillage: sillageIndex(bLines),
      fit: briefFit(bLines, targets),
    };
    comparison = { diff: diffLines(aLines, bLines), aMetrics, bMetrics };
  }

  return (
    <div className="trials-page">
      <header className="page-head">
        <div>
          <p className="kicker">Evaluation / strips and reads</p>
          <h1>Trials</h1>
        </div>
        <p className="page-head__note">
          {trials.length} dated strips. A trial is never edited, only read again and compared.
        </p>
      </header>

      <form method="get" className="compare-picker">
        <label className="inline-field">
          <span>Strip A</span>
          <select name="a" defaultValue={query.a ?? ""}>
            <option value="">Choose a trial</option>
            {trials.map((trial) => (
              <option value={trial.id} key={trial.id}>
                {trial.version.formula.name} v{trial.version.version} / {trial.score}/5
              </option>
            ))}
          </select>
        </label>
        <label className="inline-field">
          <span>Strip B</span>
          <select name="b" defaultValue={query.b ?? ""}>
            <option value="">Choose a trial</option>
            {trials.map((trial) => (
              <option value={trial.id} key={trial.id}>
                {trial.version.formula.name} v{trial.version.version} / {trial.score}/5
              </option>
            ))}
          </select>
        </label>
        <button className="button button--ghost" type="submit">
          Compare
        </button>
      </form>

      {query.a && query.b && !comparable && (
        <p className="form-error">Choose two trials of the same formula to compare them.</p>
      )}

      {comparison && trialA && trialB && (
        <section className="comparison" aria-labelledby="comparison-heading">
          <div className="section-head">
            <h2 id="comparison-heading">
              {trialA.version.formula.name}: v{trialA.version.version} against v{trialB.version.version}
            </h2>
          </div>
          <div className="comparison__metrics">
            {(["cost", "tenacity", "sillage", "fit"] as const).map((key) => {
              const labels = { cost: "Cost / 100 ml", tenacity: "Tenacity", sillage: "Sillage", fit: "Brief fit" };
              const format = (value: number) =>
                key === "cost" ? formatCents(value) : key === "tenacity" ? formatHours(value) : value.toFixed(1);
              const delta = comparison.bMetrics[key] - comparison.aMetrics[key];
              return (
                <div key={key}>
                  <span>{labels[key]}</span>
                  <strong>
                    {format(comparison.aMetrics[key])} <small>to</small> {format(comparison.bMetrics[key])}
                  </strong>
                  <span className={delta === 0 ? "delta" : delta > 0 ? "delta delta--up" : "delta delta--down"}>
                    {delta > 0 ? "+" : ""}
                    {key === "cost" ? formatCents(Math.abs(delta)) : key === "tenacity" ? formatHours(Math.abs(delta)) : Math.abs(delta).toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
          <table className="diff-table">
            <caption className="sr-only">Material differences between the two versions</caption>
            <thead>
              <tr>
                <th scope="col">Material</th>
                <th scope="col" className="num">Version A</th>
                <th scope="col" className="num">Version B</th>
                <th scope="col" className="num">Delta</th>
              </tr>
            </thead>
            <tbody>
              {comparison.diff.map((line) => (
                <tr key={line.materialId} className={`diff-row diff-row--${line.status}`}>
                  <th scope="row">
                    {line.name} <span className="line-code">{line.code}</span>
                  </th>
                  <td className="num mono">{line.fromPpt}</td>
                  <td className="num mono">{line.toPpt}</td>
                  <td className="num mono">
                    {line.delta > 0 ? "+" : ""}
                    {line.delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="micro">The delta is arithmetic, not a recommendation.</p>
        </section>
      )}

      <section aria-labelledby="trial-list">
        <div className="section-head">
          <h2 id="trial-list">The tray</h2>
          <span className="mono">{trials.length}</span>
        </div>
        <div className="trial-grid">
          {trials.map((trial) => (
            <article className="trial-strip" key={trial.id}>
              <header>
                <Link href={`/formulas/${trial.version.formulaId}?version=${trial.versionId}`}>
                  {trial.version.formula.name}
                </Link>
                <span className="mono">v{trial.version.version}</span>
              </header>
              <div className="trial-strip__score">
                <span className="score" role="img" aria-label={`Score ${trial.score} out of 5`}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <span key={value} className={value <= trial.score ? "score__dot score__dot--on" : "score__dot"} />
                  ))}
                </span>
                <span className="mono">{trial.score} / 5</span>
              </div>
              <p>{trial.note}</p>
              <ul className="tag-list">
                {trial.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
              <footer>
                <span>{trial.evaluator.name}</span>
                <time dateTime={trial.createdAt.toISOString()}>
                  {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(trial.createdAt)}
                </time>
              </footer>
            </article>
          ))}
          {trials.length === 0 && <p className="empty-note">No trial has been recorded yet.</p>}
        </div>
      </section>

      <p className="micro">
        Trials are immutable. The evaluator records a strip against a submitted version; the
        formula keeps every one.
      </p>
    </div>
  );
}
