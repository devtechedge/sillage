"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { batchAction } from "@/app/formula-actions";
import { batchDraws } from "@/domain/batch";
import { formatGrams } from "@/lib/format";
import type { ActionState } from "@/lib/action-state";

const INITIAL: ActionState = {};

export function BatchForm({
  versionId,
  formulaName,
  version,
  concentrationBp,
  lines,
}: {
  versionId: string;
  formulaName: string;
  version: number;
  concentrationBp: number;
  lines: { ppt: number; material: { id: string; code: string; name: string; stockMg: number } }[];
}) {
  const [bottleCount, setBottleCount] = useState(48);
  const [bottleMl, setBottleMl] = useState(50);
  const [state, action, pending] = useActionState(batchAction, INITIAL);
  const router = useRouter();

  useEffect(() => {
    if (state.ok && state.link) router.push(state.link);
  }, [state, router]);

  const draws = useMemo(
    () => batchDraws(lines, bottleCount, bottleMl, concentrationBp),
    [lines, bottleCount, bottleMl, concentrationBp]
  );
  const shortages = draws.filter((draw) => draw.requiredMg > draw.stockMg);
  const totalMg = draws.reduce((sum, draw) => sum + draw.requiredMg, 0);
  const concentrateGrams = (bottleCount * bottleMl * concentrationBp) / 10000;

  return (
    <form action={action} className="batch-form">
      <input type="hidden" name="versionId" value={versionId} />
      <div className="batch-form__controls">
        <label className="field">
          <span>Bottles</span>
          <input
            name="bottleCount"
            type="number"
            min={1}
            max={500}
            value={bottleCount}
            onChange={(event) => setBottleCount(Math.max(1, Math.min(500, event.target.valueAsNumber || 1)))}
            required
          />
        </label>
        <label className="field">
          <span>Bottle size</span>
          <select name="bottleMl" value={bottleMl} onChange={(event) => setBottleMl(Number(event.target.value))}>
            <option value={30}>30 ml</option>
            <option value={50}>50 ml</option>
            <option value={100}>100 ml</option>
          </select>
        </label>
        <div className="batch-form__readout">
          <span>Concentrate</span>
          <strong>{concentrateGrams.toFixed(1)} g</strong>
          <span>{bottleCount} bottles of {bottleMl} ml at {concentrationBp / 100} percent</span>
        </div>
      </div>

      <div className="batch-form__head">
        <h2>{formulaName}</h2>
        <span className="mono">v{version} / approved</span>
      </div>

      <div className="table-wrap" role="region" aria-label="Batch draw preview" tabIndex={0}>
        <table className="draw-table">
          <caption className="sr-only">Material draw preview</caption>
          <thead>
            <tr>
              <th scope="col">Material</th>
              <th scope="col" className="num">Parts</th>
              <th scope="col" className="num">Draw</th>
              <th scope="col" className="num">In cabinet</th>
              <th scope="col">After</th>
            </tr>
          </thead>
          <tbody>
            {draws.map((draw) => {
              const short = draw.requiredMg > draw.stockMg;
              return (
                <tr key={draw.materialId} className={short ? "is-short" : undefined}>
                  <th scope="row">{draw.name} <span className="line-code">{draw.code}</span></th>
                  <td className="num mono">{draw.ppt}</td>
                  <td className="num mono">{formatGrams(draw.requiredMg)}</td>
                  <td className="num mono">{formatGrams(draw.stockMg)}</td>
                  <td className={short ? "short-cell" : "mono"}>
                    {short ? `Short ${formatGrams(draw.requiredMg - draw.stockMg)}` : formatGrams(draw.stockMg - draw.requiredMg)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total material</th>
              <td />
              <td className="num mono">{formatGrams(totalMg)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      {shortages.length > 0 && (
        <p className="form-error" role="alert">
          The bench is short on {shortages.map((draw) => draw.name).join(", ")}. Nothing will be
          deducted until every drawer can cover its draw.
        </p>
      )}

      <div className="batch-form__foot">
        <button className="button" type="submit" disabled={pending || shortages.length > 0}>
          {pending ? "Producing" : "Produce the lot"}
        </button>
        <p className="micro">
          Production is one transaction. Materials, ledger and lot either all land or none do.
        </p>
      </div>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {state.ok && <p className="form-ok">{state.message}</p>}
    </form>
  );
}
