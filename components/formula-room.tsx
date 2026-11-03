"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { NotePyramid } from "@/components/note-pyramid";
import { Status } from "@/components/status";
import { TargetBars } from "@/components/target-bars";
import { ReviewPanel } from "@/components/review-forms";
import { saveDraftAction, submitVersionAction, reviseFormulaAction } from "@/app/formula-actions";
import { compose, partPercent } from "@/domain/composition";
import { costPer100mlCents } from "@/domain/cost";
import { briefFit } from "@/domain/fit";
import { guardrails } from "@/domain/guardrails";
import { sillageIndex } from "@/domain/sillage";
import { tenacityHours } from "@/domain/tenacity";
import type { ResolvedLine, Role } from "@/domain/types";
import { formatCents, formatHours } from "@/lib/format";
import type { ActionState } from "@/lib/action-state";

export interface MaterialView {
  id: string;
  code: string;
  name: string;
  family: string;
  note: string;
  costCentsPerGram: number;
  persistenceHours: number;
  stockMg: number;
  maxPpt: number;
  reorderMg: number;
  description: string;
}

export interface VersionView {
  id: string;
  version: number;
  status: string;
  note: string;
  decisionNote: string | null;
  submittedAt: string | null;
  decidedAt: string | null;
  reviewerName: string | null;
  createdByName: string;
  lines: { materialId: string; ppt: number }[];
  trials: {
    id: string;
    score: number;
    tags: string[];
    note: string;
    evaluatorName: string;
    createdAt: string;
  }[];
}

interface FormulaRoomProps {
  formulaId: string;
  formulaName: string;
  concentrationBp: number;
  brief: {
    id: string;
    title: string;
    client: string;
    targetTop: number;
    targetHeart: number;
    targetBase: number;
    costCeilingCents: number;
  };
  materials: MaterialView[];
  versions: VersionView[];
  selectedVersionId: string;
  role: Role;
  canEdit: boolean;
}

const INITIAL: ActionState = {};

function resolvedLines(lines: { materialId: string; ppt: number }[], byId: Map<string, MaterialView>): ResolvedLine[] {
  return lines
    .filter((line) => line.ppt > 0 && byId.has(line.materialId))
    .map((line) => {
      const material = byId.get(line.materialId)!;
      return {
        ppt: line.ppt,
        material: {
          id: material.id,
          code: material.code,
          name: material.name,
          family: material.family,
          note: material.note,
          costCentsPerGram: material.costCentsPerGram,
          persistenceHours: material.persistenceHours,
          maxPpt: material.maxPpt,
          stockMg: material.stockMg,
        },
      };
    });
}

export function FormulaRoom({
  formulaId,
  formulaName,
  concentrationBp,
  brief,
  materials,
  versions,
  selectedVersionId,
  role,
  canEdit,
}: FormulaRoomProps) {
  const selected = versions.find((version) => version.id === selectedVersionId) ?? versions[0]!;
  const [lines, setLines] = useState(selected.lines);
  const [note, setNote] = useState(selected.note);
  const [concentration, setConcentration] = useState(concentrationBp);
  const [query, setQuery] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [saveState, saveAction, savePending] = useActionState(saveDraftAction, INITIAL);
  const [submitState, submitAction, submitPending] = useActionState(submitVersionAction, INITIAL);

  const byId = useMemo(() => new Map(materials.map((material) => [material.id, material])), [materials]);
  const resolved = useMemo(() => resolvedLines(lines, byId), [lines, byId]);
  const composition = useMemo(() => compose(resolved), [resolved]);
  const cost = useMemo(() => costPer100mlCents(resolved, concentration), [resolved, concentration]);
  const tenacity = useMemo(() => tenacityHours(resolved, concentration), [resolved, concentration]);
  const sillage = useMemo(() => sillageIndex(resolved), [resolved]);
  const fit = useMemo(
    () =>
      briefFit(resolved, {
        top: brief.targetTop,
        heart: brief.targetHeart,
        base: brief.targetBase,
      }),
    [resolved, brief.targetTop, brief.targetHeart, brief.targetBase]
  );
  const warnings = useMemo(
    () =>
      guardrails(
        resolved,
        concentration,
        brief.costCeilingCents,
        { top: brief.targetTop, heart: brief.targetHeart, base: brief.targetBase }
      ),
    [resolved, concentration, brief.costCeilingCents, brief.targetTop, brief.targetHeart, brief.targetBase]
  );
  const blocking = warnings.filter((warning) => warning.severity === "blocking");
  const canSubmit = selected.status === "DRAFT" && canEdit && blocking.length === 0;
  const isDraft = selected.status === "DRAFT";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAnnouncement(
        `${composition.totalPpt} of 1000 parts. ${formatCents(cost)} per 100 ml. ${tenacity.toFixed(1)} hours. Fit ${fit.toFixed(1)}.`
      );
    }, 500);
    return () => window.clearTimeout(timer);
  }, [composition.totalPpt, cost, tenacity, fit]);

  const families = useMemo(() => [...new Set(materials.map((material) => material.family))].sort(), [materials]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return materials;
    return materials.filter((material) =>
      `${material.name} ${material.code} ${material.family} ${material.note}`.toLowerCase().includes(needle)
    );
  }, [materials, query]);
  const selectedIds = new Set(lines.map((line) => line.materialId));

  function addMaterial(materialId: string) {
    if (selectedIds.has(materialId)) return;
    setLines((current) => [...current, { materialId, ppt: 10 }]);
  }

  function updatePpt(materialId: string, value: number) {
    const safe = Number.isFinite(value) ? Math.max(0, Math.min(1000, Math.trunc(value))) : 0;
    setLines((current) =>
      current.map((line) => (line.materialId === materialId ? { ...line, ppt: safe } : line))
    );
  }

  function removeLine(materialId: string) {
    setLines((current) => current.filter((line) => line.materialId !== materialId));
  }

  const latestTrial = selected.trials[0] ?? null;
  const serialisedLines = JSON.stringify(lines.filter((line) => line.ppt > 0));

  return (
    <div className="formula">
      <header className="formula-head">
        <div>
          <p className="kicker">Formula room / {brief.title}</p>
          <h1>{formulaName}</h1>
          <p className="formula-head__sub">
            {brief.client} <span className="dot">·</span> version {selected.version} of{" "}
            {versions.length} <span className="dot">·</span> {concentration / 100} percent
          </p>
        </div>
        <div className="formula-head__status">
          <Status value={selected.status} />
          <span className="mono">{composition.totalPpt} / 1000 parts</span>
        </div>
      </header>

      <div className="formula-layout">
        <aside className="cabinet" aria-labelledby="cabinet-heading" tabIndex={0}>
          <div className="section-head">
            <h2 id="cabinet-heading">The cabinet</h2>
            <span className="mono">{materials.length}</span>
          </div>
          <label className="cabinet-search">
            <span className="sr-only">Search materials</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Bergamot, ORRI, powder"
            />
          </label>
          <div className="cabinet-groups">
            {families.map((family, index) => {
              const familyMaterials = filtered.filter((material) => material.family === family);
              if (familyMaterials.length === 0) return null;
              return (
                <details className="drawer" key={family} open={index === 0 || query.length > 0}>
                  <summary>
                    <span>{family}</span>
                    <span className="mono">{familyMaterials.length}</span>
                  </summary>
                  <ul>
                    {familyMaterials.map((material) => {
                      const used = selectedIds.has(material.id);
                      return (
                        <li key={material.id}>
                          <button
                            type="button"
                            className="material-row"
                            onClick={() => addMaterial(material.id)}
                            disabled={used || !canEdit}
                          >
                            <span className="sr-only">Add to formula: </span>
                            <span className="material-row__main">
                              <span className="material-row__name">{material.name}</span>
                              <span className="material-row__meta">
                                {material.code} / {material.note.toLowerCase()} / max {material.maxPpt}
                              </span>
                            </span>
                            <span className="material-row__right">
                              <span className="mono">{formatCents(material.costCentsPerGram)}/g</span>
                              <span className="mono material-row__stock">
                                {(material.stockMg / 1000).toFixed(1)} g
                              </span>
                            </span>
                            {used ? <span className="material-row__used">In formula</span> : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              );
            })}
            {filtered.length === 0 && <p className="empty-note">No material by that name.</p>}
          </div>
        </aside>

        <section className="paper" aria-labelledby="paper-heading">
          <div className="paper__head">
            <div>
              <p className="mono">Maison Verre / formula sheet</p>
              <h2 id="paper-heading">{formulaName}</h2>
            </div>
            <div className="paper__controls">
              <label className="inline-field">
                <span>Concentration</span>
                {canEdit ? (
                  <select
                    value={concentration}
                    onChange={(event) => setConcentration(Number(event.target.value))}
                  >
                    <option value={1200}>12% EDT</option>
                    <option value={2000}>20% EDP</option>
                    <option value={2500}>25% Parfum</option>
                  </select>
                ) : (
                  <strong>{concentration / 100}%</strong>
                )}
              </label>
              <nav className="version-tabs" aria-label="Formula versions">
                {versions.map((version) => (
                  <Link
                    key={version.id}
                    href={`/formulas/${formulaId}?version=${version.id}`}
                    className={version.id === selected.id ? "version-tab version-tab--active" : "version-tab"}
                    aria-current={version.id === selected.id ? "page" : undefined}
                  >
                    v{version.version}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {!isDraft && (
            <p className="paper__locked">
              {selected.status === "IN_REVIEW"
                ? "This version is with the evaluator and cannot be edited."
                : selected.status === "APPROVED"
                  ? "This version is approved and locked. Revise it to open the next draft."
                  : "This version was returned with a note. Revise it to open the next draft."}
            </p>
          )}

          <div className="line-table-wrap" role="region" aria-label="Formula lines" tabIndex={0}>
            <table className="line-table">
              <caption className="sr-only">Composition lines in parts per thousand</caption>
              <thead>
                <tr>
                  <th scope="col">Material</th>
                  <th scope="col">Note</th>
                  <th scope="col" className="num">Parts</th>
                  <th scope="col" className="num">Share</th>
                  <th scope="col"><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const material = byId.get(line.materialId);
                  if (!material) return null;
                  return (
                    <tr key={line.materialId}>
                      <th scope="row">
                        <span className="line-name">{material.name}</span>
                        <span className="line-code">{material.code}</span>
                      </th>
                      <td className="line-note">{material.note.toLowerCase()}</td>
                      <td className="num">
                        {canEdit ? (
                          <input
                            className="parts-input"
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={1000}
                            step={1}
                            value={line.ppt}
                            onChange={(event) => updatePpt(line.materialId, event.target.valueAsNumber)}
                            aria-label={`${material.name} parts per thousand`}
                          />
                        ) : (
                          <span className="mono">{line.ppt}</span>
                        )}
                      </td>
                      <td className="num mono">{partPercent(line.ppt).toFixed(1)}%</td>
                      <td className="num">
                        {canEdit && (
                          <button
                            type="button"
                            className="remove-line"
                            onClick={() => removeLine(line.materialId)}
                          >
                            <span aria-hidden="true">×</span>
                            <span className="sr-only">Remove {material.name}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {lines.length === 0 && (
                  <tr>
                    <td colSpan={5} className="line-empty">
                      Add a material from the cabinet. Start with the heart.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="paper__totals" aria-hidden="true">
            <div>
              <span>Parts</span>
              <strong>{composition.totalPpt}<small> / 1000</small></strong>
            </div>
            <div>
              <span>Cost / 100 ml</span>
              <strong>{formatCents(cost)}</strong>
            </div>
            <div>
              <span>Tenacity</span>
              <strong>{formatHours(tenacity)}</strong>
            </div>
            <div>
              <span>Sillage</span>
              <strong>{sillage}<small> / 100</small></strong>
            </div>
            <div>
              <span>Brief fit</span>
              <strong>{fit.toFixed(1)}</strong>
            </div>
          </div>

          <p className="sr-only" aria-live="polite">{announcement}</p>

          {warnings.length > 0 && (
            <ul className="warnings">
              {warnings.map((warning) => (
                <li className={`warning warning--${warning.severity}`} key={`${warning.code}-${warning.materialId ?? ""}`}>
                  <span>{warning.severity === "blocking" ? "Hold" : "Note"}</span>
                  {warning.message}
                </li>
              ))}
            </ul>
          )}

          {canEdit ? (
            <div className="paper__actions">
              <form action={saveAction} className="paper__save">
                <input type="hidden" name="formulaId" value={formulaId} />
                <input type="hidden" name="versionId" value={selected.id} />
                <input type="hidden" name="lines" value={serialisedLines} />
                <input type="hidden" name="concentrationBp" value={concentration} />
                <label className="field field--inline">
                  <span>Version note</span>
                  <input
                    name="note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={400}
                    placeholder="What changed in this version?"
                  />
                </label>
                <button className="button button--ghost" type="submit" disabled={savePending}>
                  {savePending ? "Saving" : "Save draft"}
                </button>
                {saveState.error && <p className="form-error" role="alert">{saveState.error}</p>}
                {saveState.ok && <p className="form-ok">{saveState.message}</p>}
              </form>

              <form action={submitAction} className="paper__submit">
                <input type="hidden" name="formulaId" value={formulaId} />
                <input type="hidden" name="versionId" value={selected.id} />
                <input type="hidden" name="note" value={note} />
                <button className="button" type="submit" disabled={!canSubmit || submitPending}>
                  {submitPending ? "Submitting" : "Submit for review"}
                </button>
                <span className="micro">Needs 1,000 parts and no hold.</span>
                {submitState.error && <p className="form-error" role="alert">{submitState.error}</p>}
                {submitState.ok && <p className="form-ok">{submitState.message}</p>}
              </form>
            </div>
          ) : (
            <p className="paper__readonly">
              Read only. {role === "EVALUATOR" ? "Record a trial or decide the version in the right rail." : "The lab can produce a batch from the approved version."}
            </p>
          )}
        </section>

        <aside className="formula-rail" aria-label="Evaluation and history">
          <section className="rail-block">
            <div className="section-head">
              <h2>Profile</h2>
              <span className="mono">v{selected.version}</span>
            </div>
            <NotePyramid
              top={composition.noteShare.TOP}
              heart={composition.noteShare.HEART}
              base={composition.noteShare.BASE}
              total={composition.totalPpt}
            />
          </section>

          <section className="rail-block">
            <div className="section-head">
              <h2>Brief</h2>
              <span className="mono">{formatCents(brief.costCeilingCents)}</span>
            </div>
            <p className="rail-brief">{brief.title}</p>
            <TargetBars top={brief.targetTop} heart={brief.targetHeart} base={brief.targetBase} />
          </section>

          <section className="rail-block">
            <div className="section-head">
              <h2>The read</h2>
              <span className="mono">{selected.trials.length}</span>
            </div>
            {latestTrial ? (
              <article className="trial-card">
                <header>
                  <span className="score" role="img" aria-label={`Score ${latestTrial.score} out of 5`}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <span key={value} className={value <= latestTrial.score ? "score__dot score__dot--on" : "score__dot"} />
                    ))}
                  </span>
                  <span className="mono">{latestTrial.score} / 5</span>
                </header>
                <p>{latestTrial.note}</p>
                <ul className="tag-list">
                  {latestTrial.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
                <footer>
                  {latestTrial.evaluatorName} /{" "}
                  {new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(latestTrial.createdAt))}
                </footer>
              </article>
            ) : (
              <p className="empty-note">No strip has been written for this version.</p>
            )}
            {selected.trials.length > 1 && (
              <p className="micro">{selected.trials.length} trials on this version.</p>
            )}
          </section>

          {(role === "EVALUATOR" || role === "OWNER") && selected.status === "IN_REVIEW" && (
            <section className="rail-block">
              <div className="section-head">
                <h2>Review</h2>
                <span className="mono">open</span>
              </div>
              <ReviewPanel formulaId={formulaId} versionId={selected.id} versionNumber={selected.version} />
            </section>
          )}

          {(role === "PERFUMER" || role === "OWNER") && (selected.status === "CHANGES" || selected.status === "APPROVED") && (
            <section className="rail-block">
              <div className="section-head">
                <h2>Next version</h2>
              </div>
              <p className="rail-note">
                {selected.status === "APPROVED"
                  ? "The approved version stays locked. A revision opens the next draft with these lines."
                  : "Open the next draft with these lines and answer the evaluator."}
              </p>
              <form action={reviseFormulaAction}>
                <input type="hidden" name="formulaId" value={formulaId} />
                <button className="button button--ghost button--wide" type="submit">
                  Revise formula
                </button>
              </form>
            </section>
          )}

          <section className="rail-block">
            <div className="section-head">
              <h2>History</h2>
              <span className="mono">{versions.length}</span>
            </div>
            <ol className="version-history">
              {versions.map((version) => (
                <li key={version.id} className={version.id === selected.id ? "is-current" : undefined}>
                  <Link href={`/formulas/${formulaId}?version=${version.id}`}>
                    <span className="mono">v{version.version}</span>
                    <span>
                      <strong>{version.status.toLowerCase().replace("_", " ")}</strong>
                      <small>{version.note || "No note."}</small>
                    </span>
                  </Link>
                  {version.decisionNote && <p className="decision-note">{version.decisionNote}</p>}
                </li>
              ))}
            </ol>
          </section>

          {selected.decisionNote && (
            <section className="rail-block">
              <div className="section-head">
                <h2>Decision</h2>
              </div>
              <p className="rail-note">{selected.decisionNote}</p>
              {selected.reviewerName && <p className="micro">Read by {selected.reviewerName}</p>}
            </section>
          )}

          <p className="micro rail-disclaimer">
            Costs and persistence are house estimates. Guardrails are house rules, not safety or
            regulatory advice.
          </p>
        </aside>
      </div>
    </div>
  );
}
