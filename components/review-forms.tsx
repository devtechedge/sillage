"use client";

import { useActionState } from "react";
import { decisionAction, trialAction } from "@/app/formula-actions";
import type { ActionState } from "@/lib/action-state";

const INITIAL: ActionState = {};

const TAGS = ["powdery", "green", "woody", "sweet", "soapy", "cold", "warm", "quiet", "loud", "metallic"];

export function ReviewPanel({
  formulaId,
  versionId,
  versionNumber,
}: {
  formulaId: string;
  versionId: string;
  versionNumber: number;
}) {
  const [decisionState, runDecision, decisionPending] = useActionState(decisionAction, INITIAL);
  const [trialState, runTrial, trialPending] = useActionState(trialAction, INITIAL);

  return (
    <div className="review-panel">
      <p className="micro">Reading v{versionNumber}.</p>

      <form action={runTrial} className="review-form">
        <input type="hidden" name="formulaId" value={formulaId} />
        <input type="hidden" name="versionId" value={versionId} />
        <h3>Record a trial</h3>
        <label className="inline-field">
          <span>Score</span>
          <select name="score" defaultValue="4">
            <option value="1">1 / 5</option>
            <option value="2">2 / 5</option>
            <option value="3">3 / 5</option>
            <option value="4">4 / 5</option>
            <option value="5">5 / 5</option>
          </select>
        </label>
        <fieldset className="tag-field">
          <legend>Tags</legend>
          <div className="tag-options">
            {TAGS.map((tag) => (
              <label key={tag}>
                <input type="checkbox" name="tags" value={tag} />
                <span>{tag}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="field">
          <span>Note</span>
          <textarea name="note" rows={3} required minLength={3} maxLength={800} placeholder="What is on the strip?" />
        </label>
        <button className="button button--ghost button--wide" type="submit" disabled={trialPending}>
          {trialPending ? "Recording" : "Record trial"}
        </button>
        {trialState.error && <p className="form-error" role="alert">{trialState.error}</p>}
        {trialState.ok && <p className="form-ok">{trialState.message}</p>}
      </form>

      <form action={runDecision} className="review-form review-form--decision">
        <input type="hidden" name="formulaId" value={formulaId} />
        <input type="hidden" name="versionId" value={versionId} />
        <h3>Decide</h3>
        <label className="field">
          <span>Decision</span>
          <select name="decision" defaultValue="APPROVED">
            <option value="APPROVED">Approve this version</option>
            <option value="CHANGES">Return for changes</option>
          </select>
        </label>
        <label className="field">
          <span>Note</span>
          <textarea
            name="note"
            rows={3}
            maxLength={600}
            placeholder="Required when returning."
          />
        </label>
        <button className="button button--wide" type="submit" disabled={decisionPending}>
          {decisionPending ? "Recording" : "Record decision"}
        </button>
        {decisionState.error && <p className="form-error" role="alert">{decisionState.error}</p>}
        {decisionState.ok && <p className="form-ok">{decisionState.message}</p>}
      </form>
    </div>
  );
}
